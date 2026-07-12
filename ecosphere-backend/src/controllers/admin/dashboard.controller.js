const scoringService = require('../../services/scoring.service');
const EmployeeParticipation = require('../../models/EmployeeParticipation');
const ChallengeParticipation = require('../../models/ChallengeParticipation');
const ComplianceIssue = require('../../models/ComplianceIssue');

async function overview(req, res, next) {
  try {
    const orgOverview = await scoringService.getOrganizationOverview();

    const recentParticipations = await EmployeeParticipation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employee', 'name')
      .populate('activity', 'title');

    const recentChallengeParticipations = await ChallengeParticipation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employee', 'name')
      .populate('challenge', 'title');

    const recentComplianceIssues = await ComplianceIssue.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('department', 'name');

    res.json({
      overallESGScore: orgOverview.overallESGScore,
      departments: orgOverview.departments,
      recentActivity: {
        csrParticipations: recentParticipations,
        challengeParticipations: recentChallengeParticipations,
        complianceIssues: recentComplianceIssues
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
