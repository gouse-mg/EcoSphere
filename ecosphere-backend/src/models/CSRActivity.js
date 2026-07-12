const mongoose = require('mongoose');
const { Schema } = mongoose;

const csrActivitySchema = new Schema({
  title: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String },
  date: { type: Date },
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null }, // null = open to all
  evidenceRequired: { type: Boolean, default: true },
  status: { type: String, enum: ['Draft', 'Active', 'Completed'], default: 'Draft' }
}, { timestamps: true });

module.exports = mongoose.model('CSRActivity', csrActivitySchema);
