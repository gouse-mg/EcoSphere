const CSRActivity = require('../../models/CSRActivity');
const EmployeeParticipation = require('../../models/EmployeeParticipation');
const DiversityMetric = require('../../models/DiversityMetric');
const ESGConfig = require('../../models/ESGConfig');
const CSRActivityModel = require('../../models/CSRActivity');
const crudFactory = require('../shared/crudFactory');
const { checkAndAwardBadges } = require('../../services/badge.service');
const { createNotification } = require('../../services/notification.service');

const csrActivities = crudFactory(CSRActivity);
const diversity = crudFactory(DiversityMetric);

async function listParticipationQueue(req, res, next) {
  try {
    const participations = await EmployeeParticipation.find()
      .populate('employee', 'name email')
      .populate('activity', 'title')
      .sort({ createdAt: -1 });

    // Pending shown first, as required.
    const statusOrder = { Pending: 0, Approved: 1, Rejected: 2 };
    participations.sort((a, b) => statusOrder[a.approval] - statusOrder[b.approval]);

    res.json(participations);
  } catch (err) {
    next(err);
  }
}

async function approveParticipation(req, res, next) {
  try {
    const participation = await EmployeeParticipation.findById(req.params.id).populate('activity');
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    const config = await ESGConfig.findOne();
    const evidenceRequired = config ? config.toggles.evidenceRequiredForCSR : true;

    if (evidenceRequired && !participation.proofFileUrl) {
      return res.status(400).json({ error: 'Proof file is required before this can be approved' });
    }

    const { pointsEarned } = req.body;
    participation.approval = 'Approved';
    participation.pointsEarned = pointsEarned !== undefined ? pointsEarned : (participation.pointsEarned || 10);
    participation.completionDate = new Date();
    await participation.save();

    if (!config || config.toggles.badgeAutoAward) {
      await checkAndAwardBadges(participation.employee);
    }

    await createNotification({
      recipientType: 'Employee',
      recipientId: participation.employee,
      message: `Your CSR activity submission was approved.`,
      settingKey: 'approvalDecisions'
    });

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

async function rejectParticipation(req, res, next) {
  try {
    const participation = await EmployeeParticipation.findById(req.params.id);
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    participation.approval = 'Rejected';
    await participation.save();

    await createNotification({
      recipientType: 'Employee',
      recipientId: participation.employee,
      message: `Your CSR activity submission was rejected.`,
      settingKey: 'approvalDecisions'
    });

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  csrActivities,
  diversity,
  listParticipationQueue,
  approveParticipation,
  rejectParticipation
};
