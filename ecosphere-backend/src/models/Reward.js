const mongoose = require('mongoose');
const { Schema } = mongoose;

const rewardSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  pointsRequired: { type: Number, required: true },
  stock: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
