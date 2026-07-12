// server.js
// Entry point of the application: loads env vars, connects to MongoDB, and starts the server.

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start listening for requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`EcoSphere API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});

// Catch unexpected errors so the process doesn't crash silently
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
