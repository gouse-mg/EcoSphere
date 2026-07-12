const mongoose = require('mongoose');
const { Schema } = mongoose;

const esgPolicySchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Environmental', 'Social', 'Governance'] },
  version: { type: String },
  effectiveDate: { type: Date },
  applicableDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }], // empty = applies to all
  documentUrl: { type: String },
  status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('ESGPolicy', esgPolicySchema);
