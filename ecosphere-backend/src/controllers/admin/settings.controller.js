const ESGConfig = require('../../models/ESGConfig');

async function getConfigDoc() {
  let config = await ESGConfig.findOne();
  if (!config) config = await ESGConfig.create({});
  return config;
}

async function getConfig(req, res, next) {
  try {
    const config = await getConfigDoc();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function updateConfig(req, res, next) {
  try {
    const config = await getConfigDoc();
    const { weights, toggles, targetPerEmployee } = req.body;

    if (weights) config.weights = { ...config.weights.toObject(), ...weights };
    if (toggles) config.toggles = { ...config.toggles.toObject(), ...toggles };
    if (targetPerEmployee !== undefined) config.targetPerEmployee = targetPerEmployee;

    await config.save();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const config = await getConfigDoc();
    res.json(config.notificationSettings);
  } catch (err) {
    next(err);
  }
}

async function updateNotifications(req, res, next) {
  try {
    const config = await getConfigDoc();
    config.notificationSettings = { ...config.notificationSettings.toObject(), ...req.body };
    await config.save();
    res.json(config.notificationSettings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig, updateConfig, getNotifications, updateNotifications };
