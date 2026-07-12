const ESGPolicy = require('../../models/ESGPolicy');
const PolicyAcknowledgement = require('../../models/PolicyAcknowledgement');
const Audit = require('../../models/Audit');
const ComplianceIssue = require('../../models/ComplianceIssue');
const crudFactory = require('../shared/crudFactory');
const { createNotification } = require('../../services/notification.service');

const policies = crudFactory(ESGPolicy);
const audits = crudFactory(Audit);

async function listAcknowledgements(req, res, next) {
  try {
    const acks = await PolicyAcknowledgement.find()
      .populate('employee', 'name email')
      .populate('policy', 'title category');
    res.json(acks);
  } catch (err) {
    next(err);
  }
}

async function listComplianceIssues(req, res, next) {
  try {
    const issues = await ComplianceIssue.find()
      .populate('audit', 'title')
      .populate('department', 'name code')
      .sort({ dueDate: 1 });
    res.json(issues);
  } catch (err) {
    next(err);
  }
}

async function createComplianceIssue(req, res, next) {
  try {
    const { audit, description, severity, department, owner, dueDate } = req.body;

    // Ownership rule: owner + dueDate are mandatory.
    if (!owner || !dueDate) {
      return res.status(400).json({ error: 'owner and dueDate are required to create a compliance issue' });
    }

    const issue = await ComplianceIssue.create({
      audit, description, severity, department, owner, dueDate
    });

    await createNotification({
      recipientType: 'Admin',
      message: `New compliance issue created: ${description}`,
      settingKey: 'newComplianceIssue'
    });

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
}

async function resolveComplianceIssue(req, res, next) {
  try {
    const issue = await ComplianceIssue.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved' },
      { new: true }
    );
    if (!issue) return res.status(404).json({ error: 'Compliance issue not found' });
    res.json(issue);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  policies,
  audits,
  listAcknowledgements,
  listComplianceIssues,
  createComplianceIssue,
  resolveComplianceIssue
};
