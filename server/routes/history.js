const express = require('express');
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');

const router = express.Router();

/**
 * GET /api/history
 * Get all interactions for the authenticated user
 * Query params: ?type=ask|summary|quiz (optional filter)
 */
router.get('/', auth, async (req, res) => {
  try {
    const query = { userId: req.userId };

    // Filter by type if provided
    if (req.query.type && ['ask', 'summary', 'quiz'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    const interactions = await Interaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ interactions });
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/history/stats/overview
 * Get statistics for the authenticated user
 * NOTE: Must be defined BEFORE /:id to avoid "stats" being matched as an id
 */
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [totalInteractions, askCount, summaryCount, quizCount] = await Promise.all([
      Interaction.countDocuments({ userId: req.userId }),
      Interaction.countDocuments({ userId: req.userId, type: 'ask' }),
      Interaction.countDocuments({ userId: req.userId, type: 'summary' }),
      Interaction.countDocuments({ userId: req.userId, type: 'quiz' }),
    ]);

    res.json({
      stats: {
        totalInteractions,
        askCount,
        summaryCount,
        quizCount,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/history/:id
 * Get a single interaction
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const interaction = await Interaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.json({ interaction });
  } catch (error) {
    console.error('Get interaction error:', error.message);
    res.status(500).json({ error: 'Failed to fetch interaction' });
  }
});

module.exports = router;
