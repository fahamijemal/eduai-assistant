import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMastery,
  getWeakTopics,
  getExamReadiness,
  getStudyTime,
  getPerformanceTrend,
  getRevisionPlan,
} from '../controllers/analyticsController.js';

const router = Router();

// All analytics routes require authentication
router.use(protect);

router.get('/mastery', getMastery);
router.get('/weak-topics', getWeakTopics);
router.get('/exam-readiness', getExamReadiness);
router.get('/study-time', getStudyTime);
router.get('/performance-trend', getPerformanceTrend);
router.get('/revision-plan', getRevisionPlan);

export default router;
