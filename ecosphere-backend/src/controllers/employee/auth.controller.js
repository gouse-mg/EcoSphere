const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Employee = require('../../models/Employee');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, employee.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: employee._id, department: employee.department, role: 'employee' },
      process.env.JWT_SECRET_EMPLOYEE,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      employee: { id: employee._id, name: employee.name, department: employee.department }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
