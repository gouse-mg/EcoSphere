const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  recipientType: { type: String, enum: ['Admin', 'Department', 'Employee'], required: true },
  recipientId: { type: Schema.Types.ObjectId, default: null }, // null for Admin (global)
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
