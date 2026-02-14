import { TopicMastery } from '../models/TopicMastery.js';
import { InteractionHistory } from '../models/InteractionHistory.js';

const RECENCY_DECAY = 0.95; // decay factor for older attempts
const CONFIDENCE_ACCURACY_WEIGHT = 0.7;

/**
 * Update mastery for a user on a specific topic after an interaction.
 *
 * @param {string} userId
 * @param {string} topicName
 * @param {boolean} isCorrect
 * @param {number} responseTimeMs
 */
export async function updateMastery(userId, topicName, isCorrect, responseTimeMs = 0) {
  let mastery = await TopicMastery.findOne({ userId, topicName });

  if (!mastery) {
    mastery = await TopicMastery.create({
      userId,
      topicName,
      accuracy: 0,
      attempts: 0,
      correctAttempts: 0,
      confidenceScore: 0,
      improvementTrend: 0,
    });
  }

  // Update raw counts
  mastery.attempts += 1;
  if (isCorrect) mastery.correctAttempts += 1;

  // Recalculate accuracy
  mastery.accuracy = Math.round((mastery.correctAttempts / mastery.attempts) * 100);

  // Update average response time
  if (responseTimeMs > 0) {
    if (mastery.avgResponseTimeMs) {
      mastery.avgResponseTimeMs = Math.round(
        (mastery.avgResponseTimeMs * (mastery.attempts - 1) + responseTimeMs) / mastery.attempts,
      );
    } else {
      mastery.avgResponseTimeMs = responseTimeMs;
    }
  }

  // Recency factor: how recent is this topic's activity (1.0 = just now, decays over days)
  const daysSinceLast = mastery.lastUpdated
    ? (Date.now() - mastery.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const recencyFactor = Math.pow(RECENCY_DECAY, daysSinceLast);

  // Confidence = weighted combination of accuracy + recency
  mastery.confidenceScore = parseFloat(
    (CONFIDENCE_ACCURACY_WEIGHT * (mastery.accuracy / 100) + (1 - CONFIDENCE_ACCURACY_WEIGHT) * recencyFactor).toFixed(3),
  );

  // Improvement trend: compare recent 5 vs previous 5 interactions
  mastery.improvementTrend = await computeImprovementTrend(userId, topicName);

  mastery.lastUpdated = new Date();
  await mastery.save();

  return mastery;
}

/**
 * Compute improvement trend by comparing recent interactions to earlier ones.
 * Returns -1 (declining), 0 (stable), 1 (improving).
 */
async function computeImprovementTrend(userId, topicName) {
  const interactions = await InteractionHistory.find({
    userId,
    topicTag: topicName,
    correct: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  if (interactions.length < 4) return 0;

  const mid = Math.floor(interactions.length / 2);
  const recent = interactions.slice(0, mid);
  const older = interactions.slice(mid);

  const recentAccuracy = recent.filter((i) => i.correct).length / recent.length;
  const olderAccuracy = older.filter((i) => i.correct).length / older.length;

  const diff = recentAccuracy - olderAccuracy;
  if (diff > 0.1) return 1;
  if (diff < -0.1) return -1;
  return 0;
}

/**
 * Get all mastery records for a user.
 */
export async function getUserMasteries(userId) {
  return TopicMastery.find({ userId }).sort({ accuracy: 1 });
}

/**
 * Bulk update mastery after a quiz.
 * @param {string} userId
 * @param {Array<{topic, isCorrect, responseTimeMs}>} results
 */
export async function bulkUpdateMastery(userId, results) {
  const updated = [];
  for (const r of results) {
    const m = await updateMastery(userId, r.topic, r.isCorrect, r.responseTimeMs);
    updated.push(m);
  }
  return updated;
}
