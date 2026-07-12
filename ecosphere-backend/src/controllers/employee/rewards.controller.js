const Reward = require('../../models/Reward');
const RewardRedemption = require('../../models/RewardRedemption');
const Employee = require('../../models/Employee');

async function listCatalog(req, res, next) {
  try {
    const employee = await Employee.findById(req.employee.id);
    const rewards = await Reward.find({ status: 'Active' });
    res.json({ currentXP: employee.xp, rewards });
  } catch (err) {
    next(err);
  }
}

async function redeem(req, res, next) {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward || reward.status !== 'Active') {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const employee = await Employee.findById(req.employee.id);
    if (employee.xp < reward.pointsRequired) {
      return res.status(400).json({ error: 'Not enough XP to redeem this reward' });
    }

    // Atomic stock decrement to prevent overselling on concurrent requests.
    const updatedReward = await Reward.findOneAndUpdate(
      { _id: reward._id, stock: { $gt: 0 } },
      { $inc: { stock: -1 } },
      { new: true }
    );
    if (!updatedReward) {
      return res.status(409).json({ error: 'Reward is out of stock' });
    }

    // Atomic XP deduction, guarded so we never push an employee's XP negative
    // if two redemptions race past the initial check above.
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: employee._id, xp: { $gte: reward.pointsRequired } },
      { $inc: { xp: -reward.pointsRequired } },
      { new: true }
    );
    if (!updatedEmployee) {
      // Roll back the stock decrement since the XP deduction failed
      await Reward.findByIdAndUpdate(reward._id, { $inc: { stock: 1 } });
      return res.status(400).json({ error: 'Not enough XP to redeem this reward' });
    }

    const redemption = await RewardRedemption.create({
      employee: employee._id,
      reward: reward._id,
      pointsSpent: reward.pointsRequired,
      date: new Date()
    });

    res.status(201).json({ redemption, remainingXP: updatedEmployee.xp, remainingStock: updatedReward.stock });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCatalog, redeem };
