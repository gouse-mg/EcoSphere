const mongoose = require('mongoose');
const { Schema } = mongoose;

const esgConfigSchema = new Schema({
  weights: {
    environmental: { type: Number, default: 40 },
    social: { type: Number, default: 30 },
    governance: { type: Number, default: 30 }
  },
  toggles: {
    autoEmissionCalculation: { type: Boolean, default: true },
    evidenceRequiredForCSR: { type: Boolean, default: true },
    badgeAutoAward: { type: Boolean, default: true }
  },
  notificationSettings: {
    newComplianceIssue: { type: Boolean, default: true },
    approvalDecisions: { type: Boolean, default: true },
    policyReminders: { type: Boolean, default: true },
    badgeUnlocks: { type: Boolean, default: true }
  },
  targetPerEmployee: { type: Number, default: 200 } // used in social score calc
}, { timestamps: true });

module.exports = mongoose.model('ESGConfig', esgConfigSchema);
