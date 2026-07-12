const mongoose = require('mongoose');
const { Schema } = mongoose;

const environmentalGoalSchema = new Schema({
  name: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  metric: { type: String },
  baseline: { type: Number, required: true },
  target: { type: Number, required: true },
  current: {
    type: Number,
    default: function () { return this.baseline; }
  },
  dueDate: { type: Date },
  status: { type: String, enum: ['Active', 'On Track', 'At Risk', 'Completed'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('EnvironmentalGoal', environmentalGoalSchema);
