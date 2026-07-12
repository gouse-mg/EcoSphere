// app.js
// Configures the Express application: middleware, routes, and error handling.
// The actual server startup (listening on a port + DB connection) happens in server.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const emissionFactorRoutes = require('./routes/emissionFactorRoutes');
const goalRoutes = require('./routes/goalRoutes');
const policyRoutes = require('./routes/policyRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const manufacturingRoutes = require('./routes/manufacturingRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const carbonRoutes = require('./routes/carbonRoutes');
const csrRoutes = require('./routes/csrRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const auditRoutes = require('./routes/auditRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- Global middleware ---
app.use(cors()); // allow cross-origin requests from the frontend
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // log requests to the console in development
}

// Serve uploaded files (e.g. proof of CSR participation) statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health check ---
app.get('/', (req, res) => {
  res.json({ success: true, message: 'EcoSphere ESG Management Platform API is running' });
});

// --- Mount routes ---
app.use('/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/categories', categoryRoutes);
app.use('/emission-factors', emissionFactorRoutes);
app.use('/goals', goalRoutes);
app.use('/policies', policyRoutes);
app.use('/badges', badgeRoutes);
app.use('/rewards', rewardRoutes);
app.use('/purchases', purchaseRoutes);
app.use('/manufacturing', manufacturingRoutes);
app.use('/fleet', fleetRoutes);
app.use('/expenses', expenseRoutes);
app.use('/carbon', carbonRoutes);
app.use('/csr', csrRoutes);
app.use('/challenges', challengeRoutes);
app.use('/audits', auditRoutes);
app.use('/compliance', complianceRoutes);
app.use('/reports', reportRoutes);
app.use('/dashboard', dashboardRoutes);

// --- Error handling (must be registered last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
