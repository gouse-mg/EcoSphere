const scoringService = require('../../services/scoring.service');
const EnvironmentalGoal = require('../../models/EnvironmentalGoal');

async function getDashboard(req, res, next) {
  try {
    const dashboard = await scoringService.getDepartmentDashboard(req.department.id);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

async function getGoals(req, res, next) {
  try {
    const goals = await EnvironmentalGoal.find({ department: req.department.id });
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, getGoals };
