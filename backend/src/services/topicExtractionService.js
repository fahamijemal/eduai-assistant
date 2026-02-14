import { TopicMastery } from '../models/TopicMastery.js';
import { Document } from '../models/Document.js';
import * as aiService from './aiService.js';
import { extractTextFromPdf } from './pdfService.js';

/**
 * Extract topics from a document and create initial TopicMastery records.
 *
 * @param {string} userId
 * @param {string} documentId
 * @returns {Promise<Array<{topic, subtopics, keywords}>>}
 */
export async function extractAndStoreTopics(userId, documentId) {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new Error('Document not found');

  const text = await extractTextFromPdf(doc.filePath);
  const topics = await aiService.extractTopics(text);

  // Flatten into topic names
  const allTopicNames = [];
  for (const t of topics) {
    allTopicNames.push(t.topic);
    if (t.subtopics) allTopicNames.push(...t.subtopics);
  }

  // Update document with extracted topics
  doc.extractedTopics = allTopicNames;
  doc.extractedAt = new Date();
  await doc.save();

  // Create TopicMastery records (upsert to avoid duplicates)
  const ops = [];
  for (const t of topics) {
    // Main topic
    ops.push({
      updateOne: {
        filter: { userId, topicName: t.topic },
        update: {
          $setOnInsert: {
            userId,
            topicName: t.topic,
            parentTopic: null,
            accuracy: 0,
            attempts: 0,
            correctAttempts: 0,
            confidenceScore: 0,
            improvementTrend: 0,
          },
        },
        upsert: true,
      },
    });

    // Subtopics
    for (const sub of t.subtopics || []) {
      ops.push({
        updateOne: {
          filter: { userId, topicName: sub },
          update: {
            $setOnInsert: {
              userId,
              topicName: sub,
              parentTopic: t.topic,
              accuracy: 0,
              attempts: 0,
              correctAttempts: 0,
              confidenceScore: 0,
              improvementTrend: 0,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (ops.length > 0) {
    await TopicMastery.bulkWrite(ops);
  }

  return topics;
}

/**
 * Get the hierarchical topic tree for a user.
 */
export async function getTopicTree(userId) {
  const masteries = await TopicMastery.find({ userId }).sort({ topicName: 1 });

  const mainTopics = masteries.filter((m) => !m.parentTopic);
  const tree = mainTopics.map((main) => {
    const children = masteries.filter((m) => m.parentTopic === main.topicName);
    return {
      topic: main.topicName,
      accuracy: main.accuracy,
      confidenceScore: main.confidenceScore,
      attempts: main.attempts,
      subtopics: children.map((c) => ({
        topic: c.topicName,
        accuracy: c.accuracy,
        confidenceScore: c.confidenceScore,
        attempts: c.attempts,
      })),
    };
  });

  return tree;
}
