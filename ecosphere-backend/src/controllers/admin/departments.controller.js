const bcrypt = require('bcrypt');
const Department = require('../../models/Department');
const crudFactory = require('../shared/crudFactory');

// Departments need password hashing on create/update (for department portal login),
// so they get a thin wrapper around the generic CRUD factory instead of using it as-is.
const base = crudFactory(Department);

async function create(req, res, next) {
  try {
    const { name, code, head, parentDepartment, employeeCount, password } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const department = await Department.create({
      name, code, head, parentDepartment, employeeCount, passwordHash
    });

    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const department = await Department.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });

    res.json(department);
  } catch (err) {
    next(err);
  }
}

module.exports = { ...base, create, update };
