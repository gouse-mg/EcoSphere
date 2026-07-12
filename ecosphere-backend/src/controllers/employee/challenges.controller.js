const Challenge = require('../../models/Challenge');
const ChallengeParticipation = require('../../models/ChallengeParticipation');

async function listActive(req, res, next) {
  try {
    const challenges = await Challenge.find({ status: 'Active' });
    res.json(challenges);
  } catch (err) {
    next(err);
  }
}

async function join(req, res, next) {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const existing = await ChallengeParticipation.findOne({
      employee: req.employee.id,
      challenge: challenge._id
    });
    if (existing) {
      return res.status(409).json({ error: 'Already joined this challenge' });
    }

    const participation = await ChallengeParticipation.create({
      employee: req.employee.id,
      challenge: challenge._id
    });

    res.status(201).json(participation);
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'progress must be a number between 0 and 100' });
    }

    const participation = await ChallengeParticipation.findOne({
      _id: req.params.id,
      employee: req.employee.id // only their own progress
    });
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    participation.progress = progress;
    await participation.save();

    res.json(participation);
  } catch (err) {
    next(err);
  }
}

async function uploadProof(req, res, next) {
  try {
    const participation = await ChallengeParticipation.findOne({
      _id: req.params.id,
      employee: req.employee.id
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

module.exports = { listActive, join, updateProgress, uploadProof };
