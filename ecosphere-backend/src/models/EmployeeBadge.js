const mongoose = require('mongoose');
const { Schema } = mongoose;

// Join collection tracking which employees have which badges
const employeeBadgeSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  awardedDate: { type: Date, default: Date.now }
}, { timestamps: true });

employeeBadgeSchema.index({ employee: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeBadge', employeeBadgeSchema);
