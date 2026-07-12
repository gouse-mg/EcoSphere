const mongoose = require('mongoose');
const { Schema } = mongoose;

const complianceIssueSchema = new Schema({
  audit: { type: Schema.Types.ObjectId, ref: 'Audit', required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  owner: { type: String, required: true }, // mandatory ownership rule
  dueDate: { type: Date, required: true },  // mandatory
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceIssue', complianceIssueSchema);
