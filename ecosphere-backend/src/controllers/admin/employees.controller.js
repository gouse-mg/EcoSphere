const bcrypt = require('bcrypt');
const Employee = require('../../models/Employee');
const crudFactory = require('../shared/crudFactory');

// Employees need password hashing on create/update (for employee portal login),
// so they get a thin wrapper around the generic CRUD factory, same pattern as
// departments.controller.js.
const base = crudFactory(Employee, { populate: 'department' });

async function create(req, res, next) {
  try {
    const { name, email, department, password, xp, status } = req.body;
    if (!name || !email || !department || !password) {
      return res.status(400).json({ error: 'name, email, department and password are required' });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      name, email, department, passwordHash, xp, status
    });

    res.status(201).json(employee);
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
    } else {
      delete updates.password;
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('department');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    res.json(employee);
  } catch (err) {
    next(err);
  }
}

module.exports = { ...base, create, update };
