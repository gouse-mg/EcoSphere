const mongoose = require('mongoose');
const { Schema } = mongoose;

const badgeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  unlockRule: {
    type: { type: String, enum: ['xp', 'challenges', 'csr', 'policies'] },
    min: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
