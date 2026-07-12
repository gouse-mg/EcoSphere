const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeParticipationSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  activity: { type: Schema.Types.ObjectId, ref: 'CSRActivity', required: true },
  proofFileUrl: { type: String },
  approval: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  pointsEarned: { type: Number, default: 0 },
  completionDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeParticipation', employeeParticipationSchema);
