const Employee = require('../models/Employee');
const Badge = require('../models/Badge');
const EmployeeBadge = require('../models/EmployeeBadge');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const { createNotification } = require('./notification.service');

/**
 * Checks every badge's unlock rule against the employee's current stats and
 * awards any badge whose threshold has been crossed and isn't already held.
 * Called automatically after: EmployeeParticipation approved, ChallengeParticipation
 * approved, PolicyAcknowledgement acknowledged (when badgeAutoAward toggle is on).
 * Can also be triggered manually by an admin.
 */
async function checkAndAwardBadges(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) return [];

  const badges = await Badge.find();
  const alreadyHeld = await EmployeeBadge.find({ employee: employeeId }).select('badge');
  const heldIds = new Set(alreadyHeld.map((eb) => String(eb.badge)));

  const awarded = [];

  for (const badge of badges) {
    if (heldIds.has(String(badge._id))) continue;
    if (!badge.unlockRule || !badge.unlockRule.type) continue;

    let eligible = false;

    switch (badge.unlockRule.type) {
      case 'xp':
        eligible = employee.xp >= badge.unlockRule.min;
        break;
      case 'challenges': {
        const count = await ChallengeParticipation.countDocuments({
          employee: employeeId,
          approval: 'Approved'
        });
        eligible = count >= badge.unlockRule.min;
        break;
      }
      case 'csr': {
        const count = await EmployeeParticipation.countDocuments({
          employee: employeeId,
          approval: 'Approved'
        });
        eligible = count >= badge.unlockRule.min;
        break;
      }
      case 'policies': {
        const count = await PolicyAcknowledgement.countDocuments({
          employee: employeeId,
          status: 'Acknowledged'
        });
        eligible = count >= badge.unlockRule.min;
        break;
      }
      default:
        eligible = false;
    }

    if (eligible) {
      await EmployeeBadge.create({ employee: employeeId, badge: badge._id, awardedDate: new Date() });
      awarded.push(badge);
      await createNotification({
        recipientType: 'Employee',
        recipientId: employeeId,
        message: `You've unlocked the "${badge.name}" badge!`,
        settingKey: 'badgeUnlocks'
      });
    }
  }

  return awarded;
}

module.exports = { checkAndAwardBadges };
