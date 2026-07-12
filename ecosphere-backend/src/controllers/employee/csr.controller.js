const CSRActivity = require('../../models/CSRActivity');
const EmployeeParticipation = require('../../models/EmployeeParticipation');

async function listOpenActivities(req, res, next) {
  try {
    const activities = await CSRActivity.find({
      status: 'Active',
      $or: [{ department: null }, { department: req.employee.department }]
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
}

async function join(req, res, next) {
  try {
    const activity = await CSRActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'CSR activity not found' });

    const existing = await EmployeeParticipation.findOne({
      employee: req.employee.id,
      activity: activity._id
    });
    if (existing) {
      return res.status(409).json({ error: 'Already joined this activity' });
    }

    const participation = await EmployeeParticipation.create({
      employee: req.employee.id,
      activity: activity._id
    });

    res.status(201).json(participation);
  } catch (err) {
    next(err);
  }
}

async function uploadProof(req, res, next) {
  try {
    const participation = await EmployeeParticipation.findOne({
      _id: req.params.id,
      employee: req.employee.id // employees may only touch their own participation
    });
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    participation.proofFileUrl = `/uploads/${req.file.filename}`;
    await participation.save();

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

module.exports = { listOpenActivities, join, uploadProof };
