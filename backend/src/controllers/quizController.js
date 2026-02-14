import { evaluateQuizResponse } from '../services/quizService.js';

export async function submitQuiz(req, res, next) {
  try {
    const { topic, difficulty, timeSpent, answers } = req.body;

    if (!topic || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'topic and answers array are required' });
    }

    const result = await evaluateQuizResponse(req.user._id, {
      topic,
      difficulty,
      timeSpent: timeSpent || 0,
      answers,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
