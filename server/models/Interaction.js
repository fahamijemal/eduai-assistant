const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  question: {
    type: String,
    default: '',
  },
  response: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['ask', 'summary', 'quiz'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Populate document info when querying
interactionSchema.pre(/^find/, function () {
  this.populate('documentId', 'originalName filename');
});

module.exports = mongoose.model('Interaction', interactionSchema);
