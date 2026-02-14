import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    extractedTopics: [{ type: String }],
    extractedAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
