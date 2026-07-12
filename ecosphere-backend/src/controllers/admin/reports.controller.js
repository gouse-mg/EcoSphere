const Department = require('../../models/Department');
const EnvironmentalGoal = require('../../models/EnvironmentalGoal');
const CarbonTransaction = require('../../models/CarbonTransaction');
const CSRActivity = require('../../models/CSRActivity');
const EmployeeParticipation = require('../../models/EmployeeParticipation');
const ChallengeParticipation = require('../../models/ChallengeParticipation');
const ESGPolicy = require('../../models/ESGPolicy');
const PolicyAcknowledgement = require('../../models/PolicyAcknowledgement');
const Audit = require('../../models/Audit');
const ComplianceIssue = require('../../models/ComplianceIssue');
const scoringService = require('../../services/scoring.service');

async function environmentalReport(req, res, next) {
  try {
    const goals = await EnvironmentalGoal.find().populate('department', 'name code');
    const transactions = await CarbonTransaction.find()
      .populate('department', 'name code')
      .populate('emissionFactor');
    res.json({ goals, transactions });
  } catch (err) {
    next(err);
  }
}

async function socialReport(req, res, next) {
  try {
    const activities = await CSRActivity.find();
    const participations = await EmployeeParticipation.find().populate('employee', 'name email');
    const challengeParticipations = await ChallengeParticipation.find().populate('employee', 'name email');
    res.json({ activities, participations, challengeParticipations });
  } catch (err) {
    next(err);
  }
}

async function governanceReport(req, res, next) {
  try {
    const policies = await ESGPolicy.find();
    const acknowledgements = await PolicyAcknowledgement.find().populate('employee', 'name email');
    const audits = await Audit.find().populate('department', 'name code');
    const complianceIssues = await ComplianceIssue.find().populate('department', 'name code');
    res.json({ policies, acknowledgements, audits, complianceIssues });
  } catch (err) {
    next(err);
  }
}

async function esgSummary(req, res, next) {
  try {
    const overview = await scoringService.getOrganizationOverview();
    res.json(overview);
  } catch (err) {
    next(err);
  }
}

async function customReport(req, res, next) {
  try {
    const { department, dateRange, module, employee, challenge, esgCategory } = req.body;
    const filters = {};

    if (department) filters.department = department;
    if (dateRange && dateRange.from && dateRange.to) {
      filters.date = { $gte: new Date(dateRange.from), $lte: new Date(dateRange.to) };
    }

    let result;
    switch (module) {
      case 'environmental':
        result = await CarbonTransaction.find(filters).populate('department emissionFactor');
        break;
      case 'social': {
        const socialFilters = {};
        if (employee) socialFilters.employee = employee;
        result = await EmployeeParticipation.find(socialFilters).populate('employee activity');
        break;
      }
      case 'governance': {
        const govFilters = {};
        if (department) govFilters.department = department;
        result = await ComplianceIssue.find(govFilters).populate('department audit');
        break;
      }
      case 'gamification': {
        const gamFilters = {};
        if (employee) gamFilters.employee = employee;
        if (challenge) gamFilters.challenge = challenge;
        result = await ChallengeParticipation.find(gamFilters).populate('employee challenge');
        break;
      }
      default:
        return res.status(400).json({ error: 'module must be one of: environmental, social, governance, gamification' });
    }

    res.json({ filters: { department, dateRange, module, employee, challenge, esgCategory }, result });
  } catch (err) {
    next(err);
  }
}

async function exportReport(req, res, next) {
  try {
    const { format } = req.query;
    const overview = await scoringService.getOrganizationOverview();

    if (format === 'csv') {
      const header = 'Department,Environmental,Social,Governance,Total,Rank\n';
      const rows = overview.departments
        .map((d) => `${d.department.name},${d.environmental.toFixed(2)},${d.social.toFixed(2)},${d.governance.toFixed(2)},${d.total.toFixed(2)},${d.rank}`)
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="esg-report.csv"');
      return res.send(header + rows);
    }

    // PDF/Excel generation would use a dedicated library (e.g. pdfkit, exceljs).
    // Wiring those up is left as an infra decision for whoever picks this up;
    // for now, unsupported formats get a clean 501 instead of a fake file.
    if (format === 'pdf' || format === 'excel') {
      return res.status(501).json({
        error: `${format} export is not implemented yet — csv is available now`
      });
    }

    return res.status(400).json({ error: 'format must be one of: pdf, excel, csv' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  environmentalReport,
  socialReport,
  governanceReport,
  esgSummary,
  customReport,
  exportReport
};
