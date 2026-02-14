import { getUserMasteries } from '../services/masteryService.js';
import { detectWeakTopics, getWeaknessPatterns } from '../services/weaknessDetectionService.js';
import { predictReadiness } from '../services/examReadinessService.js';
import { generateDailyPlan } from '../services/revisionSchedulerService.js';
import { StudySession } from '../models/StudySession.js';
import { QuizResult } from '../models/QuizResult.js';
import { InteractionHistory } from '../models/InteractionHistory.js';

export async function getMastery(req, res, next) {
  try {
    const masteries = await getUserMasteries(req.user._id);
    res.json({ masteries });
  } catch (err) {
    next(err);
  }
}

export async function getWeakTopics(req, res, next) {
  try {
    const weakTopics = await detectWeakTopics(req.user._id);
    const patterns = await getWeaknessPatterns(req.user._id);
    res.json({ weakTopics, patterns });
  } catch (err) {
    next(err);
  }
}

export async function getExamReadiness(req, res, next) {
  try {
    const readiness = await predictReadiness(req.user._id);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
}

export async function getStudyTime(req, res, next) {
  try {
    const sessions = await StudySession.find({ userId: req.user._id })
      .sort({ startTime: -1 })
      .limit(30);

    // Aggregate daily study time for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyAgg = await StudySession.aggregate([
      {
        $match: {
          userId: req.user._id,
          startTime: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
          },
          totalMinutes: { $sum: '$durationMinutes' },
          sessionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    res.json({
      totalStudyTimeMinutes: totalStudyTime,
      recentSessions: sessions,
      dailyBreakdown: dailyAgg.map((d) => ({
        date: d._id,
        minutes: d.totalMinutes,
        sessions: d.sessionCount,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPerformanceTrend(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Quiz performance over time
    const quizTrend = await QuizResult.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          avgScore: { $avg: '$score' },
          quizCount: { $sum: 1 },
          totalCorrect: { $sum: '$correctCount' },
          totalQuestions: { $sum: '$totalQuestions' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Interaction count over time
    const interactionTrend = await InteractionHistory.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          correctCount: {
            $sum: { $cond: [{ $eq: ['$correct', true] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      quizTrend: quizTrend.map((d) => ({
        date: d._id,
        avgScore: Math.round(d.avgScore),
        quizCount: d.quizCount,
        accuracy: Math.round((d.totalCorrect / d.totalQuestions) * 100),
      })),
      interactionTrend: interactionTrend.map((d) => ({
        date: d._id,
        interactions: d.count,
        correctCount: d.correctCount,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function startStudySession(req, res, next) {
  try {
    const session = await StudySession.create({
      userId: req.user._id,
      startTime: new Date(),
      activities: req.body.activities || [],
    });
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

export async function endStudySession(req, res, next) {
  try {
    const { sessionId } = req.body;
    const session = await StudySession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.endTime = new Date();
    session.durationMinutes = Math.round((session.endTime - session.startTime) / 60000);
    await session.save();

    // Update user study time and streak
    const user = req.user;
    user.studyTime = (user.studyTime || 0) + session.durationMinutes;

    const today = new Date().toDateString();
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastStudy === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else if (lastStudy !== today) {
      user.streak = 1;
    }
    user.lastStudyDate = new Date();
    await user.save();

    res.json({ session, studyTime: user.studyTime, streak: user.streak });
  } catch (err) {
    next(err);
  }
}

export async function getRevisionPlan(req, res, next) {
  try {
    const plan = await generateDailyPlan(req.user._id);
    res.json(plan);
  } catch (err) {
    next(err);
  }
}
