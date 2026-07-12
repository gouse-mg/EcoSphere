const mongoose = require('mongoose');
const { Schema } = mongoose;

// Admin-editable collection since source data for diversity metrics
// isn't derived from another collection in this spec.
const diversityMetricSchema = new Schema({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  target: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('DiversityMetric', diversityMetricSchema);
