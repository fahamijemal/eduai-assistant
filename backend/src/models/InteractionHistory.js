import mongoose from 'mongoose';

const interactionHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['ask', 'quiz', 'summarize', 'compare'], required: true },
    question: { type: String },
    aiResponse: { type: String },
    topicTag: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    responseTimeMs: { type: Number },
    correct: { type: Boolean },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InteractionHistory = mongoose.model('InteractionHistory', interactionHistorySchema);
