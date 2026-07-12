const jwt = require('jsonwebtoken');

function authEmployee(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_EMPLOYEE);
    if (decoded.role !== 'employee') {
      return res.status(403).json({ error: 'Wrong token type' });
    }
    req.employee = decoded; // { id, department, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authEmployee;
