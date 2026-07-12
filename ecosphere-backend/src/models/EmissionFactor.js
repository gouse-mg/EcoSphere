const mongoose = require('mongoose');
const { Schema } = mongoose;

const emissionFactorSchema = new Schema({
  activity: { type: String, required: true },
  scope: { type: String, enum: ['Scope 1', 'Scope 2', 'Scope 3'] },
  unit: { type: String },
  co2ePerUnit: { type: Number, required: true },
  source: { type: String },
  status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('EmissionFactor', emissionFactorSchema);
