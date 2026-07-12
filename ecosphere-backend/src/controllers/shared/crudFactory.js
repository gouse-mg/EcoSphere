/**
 * Generic CRUD controller factory for simple admin master-data endpoints
 * (Departments, Categories, Emission Factors, Policies, Badges, Rewards, etc).
 * Keeps repetitive list/create/update/delete logic in one place; anything
 * with extra business rules gets its own dedicated controller instead.
 */
function crudFactory(Model, options = {}) {
  const { populate, beforeCreate, afterCreate } = options;

  async function list(req, res, next) {
    try {
      let query = Model.find(req.query.filter ? JSON.parse(req.query.filter) : {});
      if (populate) query = query.populate(populate);
      const docs = await query.sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }

  async function getOne(req, res, next) {
    try {
      let query = Model.findById(req.params.id);
      if (populate) query = query.populate(populate);
      const doc = await query;
      if (!doc) return res.status(404).json({ error: `${Model.modelName} not found` });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }

  async function create(req, res, next) {
    try {
      let payload = req.body;
      if (beforeCreate) payload = await beforeCreate(payload, req);
      const doc = await Model.create(payload);
      if (afterCreate) await afterCreate(doc, req);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      if (!doc) return res.status(404).json({ error: `${Model.modelName} not found` });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: `${Model.modelName} not found` });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  }

  return { list, getOne, create, update, remove };
}

module.exports = crudFactory;
