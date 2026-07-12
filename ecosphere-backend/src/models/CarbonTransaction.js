const mongoose = require('mongoose');
const { Schema } = mongoose;

const carbonTransactionSchema = new Schema({
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  emissionFactor: { type: Schema.Types.ObjectId, ref: 'EmissionFactor', required: true },
  sourceDescription: { type: String },
  quantity: { type: Number, required: true },
  co2eCalculated: { type: Number },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'Department' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Business rule: co2eCalculated is always derived server-side from
// quantity * emissionFactor.co2ePerUnit UNLESS the controller explicitly
// sets `_allowManualOverride = true` (only permitted when the
// autoEmissionCalculation toggle is off and the department supplied its own value).
carbonTransactionSchema.pre('save', async function (next) {
  try {
    if (this._allowManualOverride && this.co2eCalculated !== undefined) {
      return next();
    }
    if (this.isModified('quantity') || this.isModified('emissionFactor') || this.isNew) {
      const EmissionFactor = mongoose.model('EmissionFactor');
      const factor = await EmissionFactor.findById(this.emissionFactor);
      if (!factor) {
        return next(new Error('Invalid emissionFactor reference'));
      }
      this.co2eCalculated = this.quantity * factor.co2ePerUnit;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('CarbonTransaction', carbonTransactionSchema);
