import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  ask,
  summarize,
  compareDocuments,
  extractTopics,
  generateQuiz,
} from '../controllers/aiController.js';
import { submitQuiz } from '../controllers/quizController.js';

const router = Router();

// All AI routes require authentication
router.use(protect);

router.post('/ask', ask);
router.post('/summarize', summarize);
router.post('/compare-documents', compareDocuments);
router.post('/extract-topics', extractTopics);
router.post('/generate-quiz', generateQuiz);
router.post('/submit-quiz', submitQuiz);

export default router;
