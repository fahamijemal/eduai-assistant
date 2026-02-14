import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    activities: [{ type: String }],
  },
  { timestamps: true }
);

export const StudySession = mongoose.model('StudySession', studySessionSchema);
