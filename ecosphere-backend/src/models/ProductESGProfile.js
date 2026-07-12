const mongoose = require('mongoose');
const { Schema } = mongoose;

const productESGProfileSchema = new Schema({
  productName: { type: String, required: true },
  linkedEmissionFactor: { type: Schema.Types.ObjectId, ref: 'EmissionFactor' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProductESGProfile', productESGProfileSchema);
