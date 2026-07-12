const EmissionFactor = require('../../models/EmissionFactor');
const EnvironmentalGoal = require('../../models/EnvironmentalGoal');
const ProductESGProfile = require('../../models/ProductESGProfile');
const CarbonTransaction = require('../../models/CarbonTransaction');
const crudFactory = require('../shared/crudFactory');

const emissionFactors = crudFactory(EmissionFactor);
const goals = crudFactory(EnvironmentalGoal);
const productProfiles = crudFactory(ProductESGProfile, { populate: 'linkedEmissionFactor' });

// Read-only: departments submit these via their own portal; admin only views.
async function listCarbonTransactions(req, res, next) {
  try {
    const transactions = await CarbonTransaction.find()
      .populate('department', 'name code')
      .populate('emissionFactor')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

module.exports = { emissionFactors, goals, productProfiles, listCarbonTransactions };
