const Challenge = require('../../models/Challenge');
const ChallengeParticipation = require('../../models/ChallengeParticipation');
const Badge = require('../../models/Badge');
const EmployeeBadge = require('../../models/EmployeeBadge');
const Reward = require('../../models/Reward');
const Employee = require('../../models/Employee');
const Department = require('../../models/Department');
const ESGConfig = require('../../models/ESGConfig');
const crudFactory = require('../shared/crudFactory');
const { checkAndAwardBadges } = require('../../services/badge.service');
const { createNotification } = require('../../services/notification.service');

const challenges = crudFactory(Challenge);
const badges = crudFactory(Badge);
const rewards = crudFactory(Reward);

const VALID_TRANSITIONS = {
  Draft: ['Active', 'Archived'],
  Active: ['Under Review', 'Archived'],
  'Under Review': ['Completed', 'Archived'],
  Completed: ['Archived'],
  Archived: []
};

async function updateChallenge(req, res, next) {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const { status, ...rest } = req.body;

    if (status && status !== challenge.status) {
      const allowed = VALID_TRANSITIONS[challenge.status] || [];
      if (status !== 'Archived' && !allowed.includes(status)) {
        return res.status(400).json({
          error: `Cannot transition challenge from ${challenge.status} to ${status}`
        });
      }
      challenge.status = status;
    }

    Object.assign(challenge, rest);
    await challenge.save();

    res.json(challenge);
  } catch (err) {
    next(err);
  }
}

async function listChallengeParticipationQueue(req, res, next) {
  try {
    const participations = await ChallengeParticipation.find()
      .populate('employee', 'name email')
      .populate('challenge', 'title xp');

    const statusOrder = { Pending: 0, 'Under review': 1, 'In progress': 2, Approved: 3, Rejected: 4 };
    participations.sort((a, b) => (statusOrder[a.approval] ?? 99) - (statusOrder[b.approval] ?? 99));

    res.json(participations);
  } catch (err) {
    next(err);
  }
}

async function approveChallengeParticipation(req, res, next) {
  try {
    const participation = await ChallengeParticipation.findById(req.params.id).populate('challenge');
    if (!participation) return res.status(404).json({ error: 'Challenge participation not found' });

    const config = await ESGConfig.findOne();
    const evidenceRequired = config ? config.toggles.evidenceRequiredForCSR : true;

    if (evidenceRequired && !participation.proofFileUrl) {
      return res.status(400).json({ error: 'Proof file is required before this can be approved' });
    }

    const { xpAwarded } = req.body;
    const awardedXP = xpAwarded !== undefined ? xpAwarded : (participation.challenge ? participation.challenge.xp : 0);

    participation.approval = 'Approved';
    participation.xpAwarded = awardedXP;
    await participation.save();

    // Credit XP to the employee's running wallet.
    await Employee.findByIdAndUpdate(participation.employee, { $inc: { xp: awardedXP } });

    if (!config || config.toggles.badgeAutoAward) {
      await checkAndAwardBadges(participation.employee);
    }

    await createNotification({
      recipientType: 'Employee',
      recipientId: participation.employee,
      message: `Your challenge submission was approved.`,
      settingKey: 'approvalDecisions'
    });

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

async function rejectChallengeParticipation(req, res, next) {
  try {
    const participation = await ChallengeParticipation.findById(req.params.id);
    if (!participation) return res.status(404).json({ error: 'Challenge participation not found' });

    participation.approval = 'Rejected';
    await participation.save();

    await createNotification({
      recipientType: 'Employee',
      recipientId: participation.employee,
      message: `Your challenge submission was rejected.`,
      settingKey: 'approvalDecisions'
    });

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

async function awardBadgeManually(req, res, next) {
  try {
    const { employee, badge } = req.body;
    if (!employee || !badge) {
      return res.status(400).json({ error: 'employee and badge are required' });
    }

    const existing = await EmployeeBadge.findOne({ employee, badge });
    if (existing) return res.status(409).json({ error: 'Employee already has this badge' });

    const employeeBadge = await EmployeeBadge.create({ employee, badge, awardedDate: new Date() });
    res.status(201).json(employeeBadge);
  } catch (err) {
    next(err);
  }
}

async function leaderboard(req, res, next) {
  try {
    const employees = await Employee.find({ status: 'Active' })
      .select('name email xp department')
      .populate('department', 'name code')
      .sort({ xp: -1 });

    res.json(employees);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  challenges,
  badges,
  rewards,
  updateChallenge,
  listChallengeParticipationQueue,
  approveChallengeParticipation,
  rejectChallengeParticipation,
  awardBadgeManually,
  leaderboard
};
