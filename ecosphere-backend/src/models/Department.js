const mongoose = require('mongoose');
const { Schema } = mongoose;

const departmentSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  head: { type: String },
  parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  employeeCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  passwordHash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
