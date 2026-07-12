const CarbonTransaction = require('../../models/CarbonTransaction');
const EmissionFactor = require('../../models/EmissionFactor');
const ESGConfig = require('../../models/ESGConfig');

async function listMine(req, res, next) {
  try {
    const transactions = await CarbonTransaction.find({ department: req.department.id })
      .populate('emissionFactor')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { emissionFactor, quantity, sourceDescription, co2eCalculated } = req.body;

    if (!emissionFactor || quantity === undefined) {
      return res.status(400).json({ error: 'emissionFactor and quantity are required' });
    }

    const factor = await EmissionFactor.findById(emissionFactor);
    if (!factor) {
      return res.status(400).json({ error: 'Invalid emissionFactor id' });
    }

    const config = await ESGConfig.findOne();
    const autoCalc = config ? config.toggles.autoEmissionCalculation : true;

    const txPayload = {
      department: req.department.id, // never trust a department-supplied id
      submittedBy: req.department.id,
      emissionFactor,
      quantity,
      sourceDescription
    };

    // The toggle only decides whether a manual override is *allowed*.
    // The pre-save hook always (re)computes co2eCalculated server-side,
    // so a client-sent override here only matters if autoCalc is off AND
    // we explicitly choose to respect it below.
    const transaction = new CarbonTransaction(txPayload);

    if (!autoCalc && co2eCalculated !== undefined) {
      // Manual override permitted only when autoEmissionCalculation is off.
      transaction.co2eCalculated = co2eCalculated;
      transaction._allowManualOverride = true;
    }

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMine, create };
