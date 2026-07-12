const Employee = require('../../models/Employee');
const EmployeeBadge = require('../../models/EmployeeBadge');

async function getDashboard(req, res, next) {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const badges = await EmployeeBadge.find({ employee: req.employee.id }).populate('badge');

    // Simple leaderboard rank: count how many employees have more XP.
    const higherXPCount = await Employee.countDocuments({ xp: { $gt: employee.xp } });
    const rank = higherXPCount + 1;

    res.json({
      xp: employee.xp,
      badges: badges.map((b) => b.badge),
      rank
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
