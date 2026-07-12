const Department = require('../models/Department');
const Employee = require('../models/Employee');
const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const ComplianceIssue = require('../models/ComplianceIssue');
const ESGConfig = require('../models/ESGConfig');

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

async function getConfig() {
  let config = await ESGConfig.findOne();
  if (!config) {
    config = await ESGConfig.create({});
  }
  return config;
}

// 8.1 Environmental Score - department-level, from Environmental Goals
async function getDepartmentEnvironmentalScore(departmentId) {
  const goals = await EnvironmentalGoal.find({
    department: departmentId,
    status: { $in: ['Active', 'On Track'] }
  });

  if (goals.length === 0) return 50; // neutral default

  const scores = goals.map((g) => {
    const denominator = g.baseline - g.target;
    if (denominator === 0) return 0;
    const goalScore = ((g.baseline - g.current) / denominator) * 100;
    return clamp(goalScore, 0, 100);
  });

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// 8.2 Social Score - employee-level first, then aggregated to department
async function getEmployeeSocialScore(employeeId, targetPerEmployee) {
  const approvedParticipations = await EmployeeParticipation.find({
    employee: employeeId,
    approval: 'Approved'
  });
  const approvedChallenges = await ChallengeParticipation.find({
    employee: employeeId,
    approval: 'Approved'
  });

  const approvedPoints = approvedParticipations.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  const approvedXP = approvedChallenges.reduce((sum, c) => sum + (c.xpAwarded || 0), 0);

  const raw = ((approvedPoints + approvedXP) / targetPerEmployee) * 100;
  return clamp(raw, 0, 100);
}

async function getDepartmentSocialScore(departmentId, targetPerEmployee) {
  const employees = await Employee.find({ department: departmentId });
  if (employees.length === 0) return 0;

  const scores = await Promise.all(
    employees.map((e) => getEmployeeSocialScore(e._id, targetPerEmployee))
  );

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// 8.3 Governance Score - department-level, hybrid
async function getDepartmentGovernanceScore(departmentId) {
  const employees = await Employee.find({ department: departmentId }).select('_id');
  const employeeIds = employees.map((e) => e._id);

  const totalAcks = await PolicyAcknowledgement.countDocuments({ employee: { $in: employeeIds } });
  const acknowledgedAcks = await PolicyAcknowledgement.countDocuments({
    employee: { $in: employeeIds },
    status: 'Acknowledged'
  });
  const policyAckRate = totalAcks === 0 ? 100 : (acknowledgedAcks / totalAcks) * 100;

  const totalIssues = await ComplianceIssue.countDocuments({ department: departmentId });
  const resolvedIssues = await ComplianceIssue.countDocuments({ department: departmentId, status: 'Resolved' });
  const complianceClosureRate = totalIssues === 0 ? 100 : (resolvedIssues / totalIssues) * 100;

  return (policyAckRate + complianceClosureRate) / 2;
}

// 8.4 Department Total Score
async function getDepartmentTotalScore(departmentId) {
  const config = await getConfig();
  const targetPerEmployee = config.targetPerEmployee || 200;

  const [environmental, social, governance] = await Promise.all([
    getDepartmentEnvironmentalScore(departmentId),
    getDepartmentSocialScore(departmentId, targetPerEmployee),
    getDepartmentGovernanceScore(departmentId)
  ]);

  const weights = config.weights;
  const total =
    (environmental * weights.environmental) / 100 +
    (social * weights.social) / 100 +
    (governance * weights.governance) / 100;

  return { environmental, social, governance, total };
}

// 8.5 Overall Organization ESG Score + department rankings
async function getOrganizationOverview() {
  const departments = await Department.find({ status: 'Active' });

  const departmentScores = await Promise.all(
    departments.map(async (dept) => {
      const scores = await getDepartmentTotalScore(dept._id);
      return {
        department: { id: dept._id, name: dept.name, code: dept.code },
        environmental: scores.environmental,
        social: scores.social,
        governance: scores.governance,
        total: scores.total
      };
    })
  );

  departmentScores.sort((a, b) => b.total - a.total);
  departmentScores.forEach((d, idx) => { d.rank = idx + 1; });

  const overallESGScore = departmentScores.length === 0
    ? 0
    : departmentScores.reduce((sum, d) => sum + d.total, 0) / departmentScores.length;

  return { overallESGScore, departments: departmentScores };
}

async function getDepartmentDashboard(departmentId) {
  const scores = await getDepartmentTotalScore(departmentId);
  const overview = await getOrganizationOverview();
  const rankEntry = overview.departments.find((d) => String(d.department.id) === String(departmentId));

  const config = await getConfig();
  const employees = await Employee.find({ department: departmentId });
  const employeeScores = await Promise.all(
    employees.map(async (e) => ({
      employee: { id: e._id, name: e.name, email: e.email },
      socialScore: await getEmployeeSocialScore(e._id, config.targetPerEmployee || 200)
    }))
  );

  return {
    scores,
    rank: rankEntry ? rankEntry.rank : null,
    totalDepartments: overview.departments.length,
    employees: employeeScores
  };
}

module.exports = {
  clamp,
  getConfig,
  getDepartmentEnvironmentalScore,
  getEmployeeSocialScore,
  getDepartmentSocialScore,
  getDepartmentGovernanceScore,
  getDepartmentTotalScore,
  getOrganizationOverview,
  getDepartmentDashboard
};
