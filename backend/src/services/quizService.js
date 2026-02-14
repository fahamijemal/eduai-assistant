import { Document } from '../models/Document.js';
import { QuizResult } from '../models/QuizResult.js';
import { InteractionHistory } from '../models/InteractionHistory.js';
import { extractTextFromPdf } from './pdfService.js';
import * as aiService from './aiService.js';
import { detectWeakTopics } from './weaknessDetectionService.js';
import { bulkUpdateMastery } from './masteryService.js';

/**
 * Determine quiz difficulty based on topic accuracy.
 */
function determineDifficulty(accuracy) {
  if (accuracy < 40) return 'easy';
  if (accuracy < 70) return 'medium';
  return 'hard';
}

/**
 * Generate an adaptive quiz targeting the user's weak areas.
 *
 * @param {string} userId
 * @param {string[]} documentIds
 * @param {object} options – { topic, difficulty, count }
 * @returns {Promise<{questions, meta}>}
 */
export async function generateAdaptiveQuiz(userId, documentIds, options = {}) {
  // 1. Load document texts
  const docs = await Document.find({ _id: { $in: documentIds }, userId });
  if (docs.length === 0) throw new Error('No documents found');

  const texts = await Promise.all(
    docs.map(async (doc) => {
      const text = await extractTextFromPdf(doc.filePath);
      return text;
    }),
  );
  const combinedText = texts.join('\n\n');

  // 2. Determine target topic and difficulty
  let targetTopic = options.topic;
  let difficulty = options.difficulty;

  if (!targetTopic) {
    // Auto-select from weak topics
    const weakTopics = await detectWeakTopics(userId);
    if (weakTopics.length > 0) {
      targetTopic = weakTopics[0].topicName;
      if (!difficulty) {
        difficulty = determineDifficulty(weakTopics[0].accuracy);
      }
    } else {
      targetTopic = 'General';
      difficulty = difficulty || 'medium';
    }
  } else {
    difficulty = difficulty || 'medium';
  }

  const count = options.count || 5;

  // 3. Generate quiz via AI
  const questions = await aiService.generateQuiz(combinedText, targetTopic, difficulty, count);

  return {
    questions,
    meta: {
      topic: targetTopic,
      difficulty,
      count: questions.length,
      documentIds,
    },
  };
}

/**
 * Evaluate quiz responses and update mastery.
 *
 * @param {string} userId
 * @param {object} submission – { topic, difficulty, timeSpent, answers: [{questionIndex, selectedAnswer, correctAnswer, topic}] }
 * @returns {Promise<{score, totalQuestions, correctCount, masteryUpdates}>}
 */
export async function evaluateQuizResponse(userId, submission) {
  const { topic, difficulty, timeSpent, answers } = submission;

  let correctCount = 0;
  const masteryResults = [];

  for (const answer of answers) {
    const isCorrect = answer.selectedAnswer === answer.correctAnswer;
    if (isCorrect) correctCount += 1;

    masteryResults.push({
      topic: answer.topic || topic,
      isCorrect,
      responseTimeMs: answer.responseTimeMs || 0,
    });
  }

  const totalQuestions = answers.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  // Record quiz result
  await QuizResult.create({
    userId,
    topic,
    score,
    totalQuestions,
    timeSpent,
    difficulty: difficulty || 'medium',
    correctCount,
  });

  // Update mastery for each answered topic
  const masteryUpdates = await bulkUpdateMastery(userId, masteryResults);

  // Log to interaction history
  await InteractionHistory.create({
    userId,
    type: 'quiz',
    question: `Quiz: ${topic} (${difficulty})`,
    aiResponse: `Score: ${score}% (${correctCount}/${totalQuestions})`,
    topicTag: topic,
    difficulty,
    correct: score >= 50,
    metadata: { score, correctCount, totalQuestions, timeSpent },
  });

  return {
    score,
    totalQuestions,
    correctCount,
    masteryUpdates: masteryUpdates.map((m) => ({
      topic: m.topicName,
      accuracy: m.accuracy,
      confidenceScore: m.confidenceScore,
      improvementTrend: m.improvementTrend,
    })),
  };
}
