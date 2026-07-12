const ESGPolicy = require('../../models/ESGPolicy');
const PolicyAcknowledgement = require('../../models/PolicyAcknowledgement');
const Employee = require('../../models/Employee');
const ESGConfig = require('../../models/ESGConfig');
const { checkAndAwardBadges } = require('../../services/badge.service');

async function listMine(req, res, next) {
  try {
    const employee = await Employee.findById(req.employee.id);
    const policies = await ESGPolicy.find({
      status: 'Active',
      $or: [{ applicableDepartments: { $size: 0 } }, { applicableDepartments: employee.department }]
    });

    const acks = await PolicyAcknowledgement.find({
      employee: req.employee.id,
      policy: { $in: policies.map((p) => p._id) }
    });
    const ackMap = new Map(acks.map((a) => [String(a.policy), a.status]));

    const result = policies.map((p) => ({
      ...p.toObject(),
      ackStatus: ackMap.get(String(p._id)) || 'Pending'
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function acknowledge(req, res, next) {
  try {
    const policy = await ESGPolicy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    const ack = await PolicyAcknowledgement.findOneAndUpdate(
      { policy: policy._id, employee: req.employee.id },
      { status: 'Acknowledged', acknowledgedDate: new Date() },
      { upsert: true, new: true }
    );

    const config = await ESGConfig.findOne();
    if (!config || config.toggles.badgeAutoAward) {
      await checkAndAwardBadges(req.employee.id);
    }

    res.json(ack);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMine, acknowledge };
