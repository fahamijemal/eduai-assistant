import { TopicMastery } from '../models/TopicMastery.js';
import { User } from '../models/User.js';
import { detectWeakTopics } from './weaknessDetectionService.js';

/**
 * Predict exam readiness for a user.
 *
 * Readiness is a weighted composite of:
 *   - Topic accuracy (40%)
 *   - Confidence scores (25%)
 *   - Coverage: % of topics attempted (20%)
 *   - Improvement trend bonus (15%)
 *
 * @param {string} userId
 * @returns {Promise<{readinessScore, passProbability, focusAreas, recommendation}>}
 */
export async function predictReadiness(userId) {
  const masteries = await TopicMastery.find({ userId });

  if (masteries.length === 0) {
    return {
      readinessScore: 0,
      passProbability: 0,
      focusAreas: [],
      recommendation: 'Upload study materials and start learning to build your readiness score.',
    };
  }

  // 1. Average accuracy across all topics
  const avgAccuracy =
    masteries.reduce((sum, m) => sum + m.accuracy, 0) / masteries.length;

  // 2. Average confidence
  const avgConfidence =
    masteries.reduce((sum, m) => sum + m.confidenceScore, 0) / masteries.length;

  // 3. Coverage: fraction of topics with at least 1 attempt
  const attemptedTopics = masteries.filter((m) => m.attempts > 0).length;
  const coverage = attemptedTopics / masteries.length;

  // 4. Improvement trend bonus
  const improvingCount = masteries.filter((m) => m.improvementTrend === 1).length;
  const decliningCount = masteries.filter((m) => m.improvementTrend === -1).length;
  const trendScore = masteries.length > 0
    ? (improvingCount - decliningCount) / masteries.length
    : 0;
  // Normalize trend to 0-1 range
  const normalizedTrend = (trendScore + 1) / 2;

  // Weighted composite score (0-100)
  const readinessScore = Math.round(
    avgAccuracy * 0.4 +
    avgConfidence * 100 * 0.25 +
    coverage * 100 * 0.2 +
    normalizedTrend * 100 * 0.15,
  );

  // Clamp to 0-100
  const clampedScore = Math.max(0, Math.min(100, readinessScore));

  // Pass probability: sigmoid-like mapping
  const passProbability = parseFloat(
    (1 / (1 + Math.exp(-0.08 * (clampedScore - 55)))).toFixed(2),
  );

  // Focus areas: weak topics
  const weakTopics = await detectWeakTopics(userId);
  const focusAreas = weakTopics.slice(0, 5).map((w) => ({
    topic: w.topicName,
    accuracy: w.accuracy,
    reason: w.reasons[0] || 'Needs improvement',
  }));

  // Generate recommendation
  const recommendation = generateRecommendation(clampedScore, focusAreas);

  // Update user's readiness score
  await User.updateOne({ _id: userId }, { readinessScore: clampedScore });

  return {
    readinessScore: clampedScore,
    passProbability,
    focusAreas,
    recommendation,
    stats: {
      totalTopics: masteries.length,
      attemptedTopics,
      avgAccuracy: Math.round(avgAccuracy),
      avgConfidence: parseFloat((avgConfidence * 100).toFixed(1)),
      improvingTopics: improvingCount,
      decliningTopics: decliningCount,
    },
  };
}

function generateRecommendation(score, focusAreas) {
  const topicList = focusAreas.map((f) => f.topic).join(', ');

  if (score >= 80) {
    return `Excellent! You are ${score}% ready. You have strong mastery across topics. Light review of ${topicList || 'all topics'} will keep you sharp.`;
  }
  if (score >= 60) {
    return `Good progress! You are ${score}% ready. Focus on ${topicList || 'weaker areas'} to improve your score further.`;
  }
  if (score >= 40) {
    return `You are ${score}% ready. Significant improvement needed. Prioritize studying: ${topicList || 'core topics'}.`;
  }
  return `You are ${score}% ready. Intensive study recommended. Start with: ${topicList || 'fundamental concepts'}.`;
}
