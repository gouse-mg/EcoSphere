// Centralized error handler - ensures bad input / bad ObjectIds
// return clean 4xx responses instead of raw 500s.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value violates a unique constraint', details: err.keyValue });
  }
  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
