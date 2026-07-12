const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditSchema = new Schema({
  title: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  auditor: { type: String },
  date: { type: Date },
  findings: { type: String },
  status: { type: String, enum: ['Scheduled', 'Under Review', 'Completed'], default: 'Scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
