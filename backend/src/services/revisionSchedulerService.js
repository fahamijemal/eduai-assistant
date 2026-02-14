import { TopicMastery } from '../models/TopicMastery.js';

/**
 * SM-2 inspired interval calculation.
 * Returns number of days until next review.
 */
function calculateInterval(accuracy, attempts, lastUpdated) {
  // Base interval using modified SM-2
  const easeFactor = Math.max(1.3, 2.5 - 0.08 * (100 - accuracy));

  let interval;
  if (attempts <= 1) {
    interval = 1; // Review tomorrow
  } else if (attempts === 2) {
    interval = 3; // 3 days
  } else {
    interval = Math.round(attempts * easeFactor);
  }

  // Reduce interval for low accuracy topics
  if (accuracy < 40) interval = 1;
  else if (accuracy < 60) interval = Math.min(interval, 2);

  // Check how many days since last study
  const daysSinceLast = lastUpdated
    ? (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  // If overdue, prioritize
  const isOverdue = daysSinceLast >= interval;

  return { interval, isOverdue, daysSinceLast: Math.round(daysSinceLast) };
}

/**
 * Assign priority level based on accuracy and overdue status.
 */
function getPriority(accuracy, isOverdue) {
  if (isOverdue && accuracy < 50) return 'critical';
  if (isOverdue || accuracy < 50) return 'high';
  if (accuracy < 70) return 'medium';
  return 'low';
}

/**
 * Suggest action based on mastery level.
 */
function suggestAction(accuracy, attempts) {
  if (attempts === 0) return 'First study – read material';
  if (accuracy < 30) return 'Re-study fundamentals';
  if (accuracy < 50) return 'Practice with easy quiz';
  if (accuracy < 70) return 'Practice with medium quiz';
  if (accuracy < 85) return 'Challenge with hard quiz';
  return 'Quick review';
}

/**
 * Estimate study time in minutes.
 */
function estimateMinutes(accuracy, priority) {
  if (priority === 'critical') return 30;
  if (priority === 'high') return 20;
  if (accuracy < 70) return 15;
  return 10;
}

/**
 * Generate a daily micro-study plan for the user using spaced repetition logic.
 *
 * @param {string} userId
 * @returns {Promise<{date, tasks[], totalEstimatedMinutes}>}
 */
export async function generateDailyPlan(userId) {
  const masteries = await TopicMastery.find({ userId });

  if (masteries.length === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      tasks: [],
      totalEstimatedMinutes: 0,
      message: 'No topics found. Upload study materials to get started.',
    };
  }

  const tasks = [];

  for (const m of masteries) {
    const { interval, isOverdue, daysSinceLast } = calculateInterval(
      m.accuracy,
      m.attempts,
      m.lastUpdated,
    );

    // Include topic if overdue or never attempted
    if (isOverdue || m.attempts === 0) {
      const priority = getPriority(m.accuracy, isOverdue);
      const action = suggestAction(m.accuracy, m.attempts);
      const estimatedMinutes = estimateMinutes(m.accuracy, priority);

      tasks.push({
        topic: m.topicName,
        parentTopic: m.parentTopic,
        accuracy: m.accuracy,
        priority,
        action,
        estimatedMinutes,
        daysSinceLastStudy: daysSinceLast,
        nextReviewIn: interval,
      });
    }
  }

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to a reasonable daily load (max ~90 min / ~6 tasks)
  const dailyTasks = tasks.slice(0, 6);
  const totalEstimatedMinutes = dailyTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    date: new Date().toISOString().split('T')[0],
    tasks: dailyTasks,
    totalEstimatedMinutes,
    remainingTopics: Math.max(0, tasks.length - 6),
  };
}
