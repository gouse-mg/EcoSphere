const mongoose = require('mongoose');
const { Schema } = mongoose;

const challengeSchema = new Schema({
  title: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String },
  xp: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  evidenceRequired: { type: Boolean, default: true },
  deadline: { type: Date },
  status: { type: String, enum: ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'], default: 'Draft' }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
