const mongoose = require('mongoose');
const { Schema } = mongoose;

const challengeParticipationSchema = new Schema({
  challenge: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  proofFileUrl: { type: String },
  approval: {
    type: String,
    enum: ['In progress', 'Pending', 'Under review', 'Approved', 'Rejected'],
    default: 'In progress'
  },
  xpAwarded: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ChallengeParticipation', challengeParticipationSchema);
