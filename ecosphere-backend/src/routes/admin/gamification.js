const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/gamification.controller');

// Challenges use crudRouter for GET/POST/DELETE but override PUT for status-transition logic
router.get('/challenges', asyncHandler(controller.challenges.list));
router.get('/challenges/:id', asyncHandler(controller.challenges.getOne));
router.post('/challenges', asyncHandler(controller.challenges.create));
router.put('/challenges/:id', asyncHandler(controller.updateChallenge));
router.delete('/challenges/:id', asyncHandler(controller.challenges.remove));

router.get('/challenge-participation', asyncHandler(controller.listChallengeParticipationQueue));
router.patch('/challenge-participation/:id/approve', asyncHandler(controller.approveChallengeParticipation));
router.patch('/challenge-participation/:id/reject', asyncHandler(controller.rejectChallengeParticipation));

router.post('/badges/award', asyncHandler(controller.awardBadgeManually));
router.use('/badges', crudRouter(controller.badges));

router.use('/rewards', crudRouter(controller.rewards));

router.get('/leaderboard', asyncHandler(controller.leaderboard));

module.exports = router;
