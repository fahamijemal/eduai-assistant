const express = require('express');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Interaction = require('../models/Interaction');
const { extractText } = require('../services/pdfExtractor');
const gemini = require('../services/gemini');

const router = express.Router();

/**
 * POST /api/ai/ask
 * Ask a question about a document
 */
router.post('/ask', auth, async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: 'Document ID and question are required' });
    }

    if (question.trim().length < 3) {
      return res.status(400).json({ error: 'Question must be at least 3 characters' });
    }

    // Find document (ensure user owns it)
    const document = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract text from PDF
    const pdfText = await extractText(document.filePath);

    // Ask Gemini
    const answer = await gemini.askQuestion(pdfText, question);

    // Save interaction
    const interaction = new Interaction({
      userId: req.userId,
      documentId: document._id,
      question,
      response: answer,
      type: 'ask',
    });
    await interaction.save();

    res.json({
      answer,
      interactionId: interaction._id,
    });
  } catch (error) {
    console.error('AI ask error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to get answer' });
  }
});

/**
 * POST /api/ai/summarize
 * Generate a summary of a document
 */
router.post('/summarize', auth, async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Find document
    const document = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract text from PDF
    const pdfText = await extractText(document.filePath);

    // Summarize with Gemini
    const summary = await gemini.summarize(pdfText);

    // Save interaction
    const interaction = new Interaction({
      userId: req.userId,
      documentId: document._id,
      question: 'Generate summary',
      response: summary,
      type: 'summary',
    });
    await interaction.save();

    res.json({
      summary,
      interactionId: interaction._id,
    });
  } catch (error) {
    console.error('AI summarize error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

/**
 * POST /api/ai/generate-quiz
 * Generate a quiz from a document
 */
router.post('/generate-quiz', auth, async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Find document
    const document = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract text from PDF
    const pdfText = await extractText(document.filePath);

    // Generate quiz with Gemini
    const quiz = await gemini.generateQuiz(pdfText);

    // Save interaction (store quiz as JSON string)
    const interaction = new Interaction({
      userId: req.userId,
      documentId: document._id,
      question: 'Generate quiz',
      response: JSON.stringify(quiz),
      type: 'quiz',
    });
    await interaction.save();

    res.json({
      quiz,
      interactionId: interaction._id,
    });
  } catch (error) {
    console.error('AI generate-quiz error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

module.exports = router;
