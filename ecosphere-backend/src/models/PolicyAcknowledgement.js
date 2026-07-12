const mongoose = require('mongoose');
const { Schema } = mongoose;

const policyAcknowledgementSchema = new Schema({
  policy: { type: Schema.Types.ObjectId, ref: 'ESGPolicy', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  status: { type: String, enum: ['Pending', 'Acknowledged'], default: 'Pending' },
  acknowledgedDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('PolicyAcknowledgement', policyAcknowledgementSchema);
