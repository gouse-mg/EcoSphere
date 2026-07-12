const Notification = require('../models/Notification');
const ESGConfig = require('../models/ESGConfig');

/**
 * Creates a Notification record, but only if the corresponding
 * notificationSettings toggle in ESGConfig is enabled (or no settingKey given).
 * Email sending is out of scope for v1 - this just persists the record.
 */
async function createNotification({ recipientType, recipientId = null, message, settingKey = null }) {
  if (settingKey) {
    const config = await ESGConfig.findOne();
    if (config && config.notificationSettings && config.notificationSettings[settingKey] === false) {
      return null;
    }
  }

  return Notification.create({ recipientType, recipientId, message });
}

module.exports = { createNotification };
