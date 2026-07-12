const jwt = require('jsonwebtoken');

function authDepartment(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_DEPARTMENT);
    if (decoded.role !== 'department') {
      return res.status(403).json({ error: 'Wrong token type' });
    }
    req.department = decoded; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authDepartment;
