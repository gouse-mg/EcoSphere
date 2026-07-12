const mongoose = require('mongoose');
const { Schema } = mongoose;

const rewardRedemptionSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reward: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
  pointsSpent: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
