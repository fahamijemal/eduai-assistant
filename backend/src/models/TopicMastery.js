import mongoose from 'mongoose';

const topicMasterySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicName: { type: String, required: true },
    parentTopic: { type: String },
    accuracy: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    improvementTrend: { type: Number, default: 0 }, // -1, 0, 1
    lastUpdated: { type: Date, default: Date.now },
    avgResponseTimeMs: { type: Number },
  },
  { timestamps: true }
);

topicMasterySchema.index({ userId: 1, topicName: 1 }, { unique: true });

export const TopicMastery = mongoose.model('TopicMastery', topicMasterySchema);
