import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    timeSpent: { type: Number, required: true }, // seconds
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    correctCount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
