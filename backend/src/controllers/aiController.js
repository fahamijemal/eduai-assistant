import { Document } from '../models/Document.js';
import { User } from '../models/User.js';
import { InteractionHistory } from '../models/InteractionHistory.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import * as aiService from '../services/aiService.js';
import { config } from '../config/index.js';

/**
 * Check and decrement AI quota for user.
 */
async function checkQuota(user) {
  if (user.aiQuotaUsed >= config.aiQuotaPerUser) {
    return false;
  }
  await User.updateOne(
    { _id: user._id },
    { $inc: { aiQuotaUsed: 1, aiInteractions: 1 } },
  );
  return true;
}

/**
 * Load text for one or more document IDs owned by the user.
 */
async function loadDocumentTexts(userId, documentIds) {
  const docs = await Document.find({
    _id: { $in: documentIds },
    userId,
  });

  if (docs.length === 0) {
    throw Object.assign(new Error('No matching documents found'), { statusCode: 404 });
  }

  const texts = await Promise.all(
    docs.map(async (doc) => {
      const text = await extractTextFromPdf(doc.filePath);
      return { id: doc._id, name: doc.originalName, text };
    }),
  );
  return texts;
}

// ── Endpoints ────────────────────────────────────────────────

export async function ask(req, res, next) {
  try {
    const { documentIds, question } = req.body;

    if (!documentIds?.length || !question) {
      return res.status(400).json({ error: 'documentIds and question are required' });
    }

    if (!(await checkQuota(req.user))) {
      return res.status(429).json({ error: 'AI usage quota exceeded' });
    }

    const startTime = Date.now();
    const texts = await loadDocumentTexts(req.user._id, documentIds);
    const context = texts.map((t) => `[${t.name}]\n${t.text}`).join('\n\n---\n\n');
    const answer = await aiService.askQuestion(context, question);
    const responseTimeMs = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      type: 'ask',
      question,
      aiResponse: answer,
      responseTimeMs,
      documentIds,
    });

    res.json({ answer, responseTimeMs });
  } catch (err) {
    next(err);
  }
}

export async function summarize(req, res, next) {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    if (!(await checkQuota(req.user))) {
      return res.status(429).json({ error: 'AI usage quota exceeded' });
    }

    const startTime = Date.now();
    const texts = await loadDocumentTexts(req.user._id, [documentId]);
    const summary = await aiService.summarizeText(texts[0].text);
    const responseTimeMs = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      type: 'summarize',
      question: `Summarize: ${texts[0].name}`,
      aiResponse: summary,
      responseTimeMs,
      documentIds: [documentId],
    });

    res.json({ summary, responseTimeMs });
  } catch (err) {
    next(err);
  }
}

export async function compareDocuments(req, res, next) {
  try {
    const { documentIdA, documentIdB, prompt } = req.body;

    if (!documentIdA || !documentIdB) {
      return res.status(400).json({ error: 'documentIdA and documentIdB are required' });
    }

    if (!(await checkQuota(req.user))) {
      return res.status(429).json({ error: 'AI usage quota exceeded' });
    }

    const startTime = Date.now();
    const textsA = await loadDocumentTexts(req.user._id, [documentIdA]);
    const textsB = await loadDocumentTexts(req.user._id, [documentIdB]);
    const comparison = await aiService.compareDocuments(textsA[0].text, textsB[0].text, prompt);
    const responseTimeMs = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      type: 'compare',
      question: prompt || `Compare ${textsA[0].name} and ${textsB[0].name}`,
      aiResponse: comparison,
      responseTimeMs,
      documentIds: [documentIdA, documentIdB],
    });

    res.json({ comparison, responseTimeMs });
  } catch (err) {
    next(err);
  }
}

export async function extractTopics(req, res, next) {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    if (!(await checkQuota(req.user))) {
      return res.status(429).json({ error: 'AI usage quota exceeded' });
    }

    const texts = await loadDocumentTexts(req.user._id, [documentId]);
    const topics = await aiService.extractTopics(texts[0].text);

    // Save extracted topic names to the document
    const topicNames = topics.flatMap((t) => [t.topic, ...(t.subtopics || [])]);
    await Document.updateOne(
      { _id: documentId },
      { extractedTopics: topicNames, extractedAt: new Date() },
    );

    res.json({ topics, topicNames });
  } catch (err) {
    next(err);
  }
}

export async function generateQuiz(req, res, next) {
  try {
    const { documentIds, topic, difficulty, count } = req.body;

    if (!documentIds?.length) {
      return res.status(400).json({ error: 'documentIds are required' });
    }

    if (!(await checkQuota(req.user))) {
      return res.status(429).json({ error: 'AI usage quota exceeded' });
    }

    const startTime = Date.now();
    const texts = await loadDocumentTexts(req.user._id, documentIds);
    const context = texts.map((t) => t.text).join('\n\n');
    const questions = await aiService.generateQuiz(context, topic || 'General', difficulty, count);
    const responseTimeMs = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      type: 'quiz',
      question: `Generate quiz: ${topic || 'General'} (${difficulty || 'medium'})`,
      aiResponse: JSON.stringify(questions),
      responseTimeMs,
      documentIds,
      metadata: { difficulty, count: questions.length },
    });

    res.json({ questions, responseTimeMs });
  } catch (err) {
    next(err);
  }
}
