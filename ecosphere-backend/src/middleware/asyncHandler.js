// Wraps async route handlers so thrown errors reach the error middleware
// instead of crashing or returning an unhandled rejection.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
