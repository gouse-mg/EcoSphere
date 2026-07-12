const cron = require('node-cron');
const ComplianceIssue = require('../models/ComplianceIssue');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notification.service');

// Marks issues we've already notified about (via a simple in-memory set) so
// the daily job doesn't spam a new notification every run for the same issue.
// For a multi-instance deployment this should move to a DB flag instead.
const alreadyNotified = new Set();

async function scanForOverdueIssues() {
  const now = new Date();
  const overdue = await ComplianceIssue.find({ status: 'Open', dueDate: { $lt: now } });

  for (const issue of overdue) {
    const key = String(issue._id);
    if (alreadyNotified.has(key)) continue;

    await createNotification({
      recipientType: 'Admin',
      message: `Compliance issue "${issue.description}" is overdue (owner: ${issue.owner}, due: ${issue.dueDate.toDateString()})`,
      settingKey: 'newComplianceIssue'
    });

    alreadyNotified.add(key);
  }
}

function startOverdueComplianceJob() {
  // Runs once a day at midnight server time.
  cron.schedule('0 0 * * *', () => {
    scanForOverdueIssues().catch((err) => console.error('Overdue compliance scan failed:', err));
  });
}

module.exports = { startOverdueComplianceJob, scanForOverdueIssues };
