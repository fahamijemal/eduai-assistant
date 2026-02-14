import { TopicMastery } from '../models/TopicMastery.js';
import { InteractionHistory } from '../models/InteractionHistory.js';

const WEAK_ACCURACY_THRESHOLD = 50;
const WEAK_CONFIDENCE_THRESHOLD = 0.4;
const SLOW_RESPONSE_THRESHOLD_MS = 30000; // 30 seconds

/**
 * Detect weak topics for a user based on mastery data.
 *
 * @param {string} userId
 * @returns {Promise<Array<{topicName, accuracy, confidenceScore, attempts, reasons}>>}
 */
export async function detectWeakTopics(userId) {
  const masteries = await TopicMastery.find({
    userId,
    $or: [
      { accuracy: { $lt: WEAK_ACCURACY_THRESHOLD } },
      { confidenceScore: { $lt: WEAK_CONFIDENCE_THRESHOLD } },
    ],
  }).sort({ accuracy: 1 });

  return masteries.map((m) => {
    const reasons = [];
    if (m.accuracy < WEAK_ACCURACY_THRESHOLD) {
      reasons.push(`Low accuracy (${m.accuracy}%)`);
    }
    if (m.confidenceScore < WEAK_CONFIDENCE_THRESHOLD) {
      reasons.push(`Low confidence (${(m.confidenceScore * 100).toFixed(0)}%)`);
    }
    if (m.improvementTrend === -1) {
      reasons.push('Declining performance');
    }

    return {
      topicName: m.topicName,
      parentTopic: m.parentTopic,
      accuracy: m.accuracy,
      confidenceScore: m.confidenceScore,
      attempts: m.attempts,
      improvementTrend: m.improvementTrend,
      reasons,
    };
  });
}

/**
 * Analyze interaction patterns to detect deeper weakness signals.
 *
 * @param {string} userId
 * @returns {Promise<{frequentlyIncorrect, slowTopics, repeatedMisunderstandings}>}
 */
export async function getWeaknessPatterns(userId) {
  // Frequently incorrect topics
  const incorrectAgg = await InteractionHistory.aggregate([
    { $match: { userId: userId, correct: false } },
    {
      $group: {
        _id: '$topicTag',
        incorrectCount: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { incorrectCount: -1 } },
    { $limit: 10 },
  ]);

  const frequentlyIncorrect = incorrectAgg.map((item) => ({
    topic: item._id,
    incorrectCount: item.incorrectCount,
    lastOccurrence: item.lastOccurrence,
  }));

  // Slow response topics (average response time > threshold)
  const slowAgg = await InteractionHistory.aggregate([
    {
      $match: {
        userId: userId,
        responseTimeMs: { $gt: 0 },
        topicTag: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$topicTag',
        avgResponseTime: { $avg: '$responseTimeMs' },
        count: { $sum: 1 },
      },
    },
    { $match: { avgResponseTime: { $gt: SLOW_RESPONSE_THRESHOLD_MS } } },
    { $sort: { avgResponseTime: -1 } },
    { $limit: 10 },
  ]);

  const slowTopics = slowAgg.map((item) => ({
    topic: item._id,
    avgResponseTimeMs: Math.round(item.avgResponseTime),
    interactionCount: item.count,
  }));

  // Repeated misunderstandings: topics with 3+ consecutive incorrect answers
  const repeatedMisunderstandings = await findRepeatedMisunderstandings(userId);

  return { frequentlyIncorrect, slowTopics, repeatedMisunderstandings };
}

/**
 * Find topics where the user got 3+ consecutive wrong answers.
 */
async function findRepeatedMisunderstandings(userId) {
  const interactions = await InteractionHistory.find({
    userId,
    topicTag: { $ne: null },
    correct: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const topicStreaks = {};

  for (const interaction of interactions) {
    const topic = interaction.topicTag;
    if (!topicStreaks[topic]) {
      topicStreaks[topic] = { currentStreak: 0, maxStreak: 0, lastWasIncorrect: true };
    }

    if (!interaction.correct) {
      if (topicStreaks[topic].lastWasIncorrect) {
        topicStreaks[topic].currentStreak += 1;
      } else {
        topicStreaks[topic].currentStreak = 1;
      }
      topicStreaks[topic].lastWasIncorrect = true;
    } else {
      topicStreaks[topic].lastWasIncorrect = false;
      topicStreaks[topic].currentStreak = 0;
    }

    topicStreaks[topic].maxStreak = Math.max(
      topicStreaks[topic].maxStreak,
      topicStreaks[topic].currentStreak,
    );
  }

  return Object.entries(topicStreaks)
    .filter(([, data]) => data.maxStreak >= 3)
    .map(([topic, data]) => ({
      topic,
      consecutiveErrors: data.maxStreak,
    }))
    .sort((a, b) => b.consecutiveErrors - a.consecutiveErrors);
}
