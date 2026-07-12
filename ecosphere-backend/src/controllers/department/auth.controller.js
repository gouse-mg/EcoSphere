const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Department = require('../../models/Department');

async function login(req, res, next) {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      return res.status(400).json({ error: 'code and password are required' });
    }

    const department = await Department.findOne({ code });
    if (!department || !department.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, department.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: department._id, role: 'department' },
      process.env.JWT_SECRET_DEPARTMENT,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      department: { id: department._id, name: department.name, code: department.code }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
