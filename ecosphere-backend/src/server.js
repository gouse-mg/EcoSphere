require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const ESGConfig = require('./models/ESGConfig');
const { startOverdueComplianceJob } = require('./jobs/overdueComplianceCheck');

const adminRouter = require('./routes/admin.index');
const departmentRouter = require('./routes/department.index');
const employeeRouter = require('./routes/employee.index');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded proof files statically.
// NOTE: this makes proof files publicly readable by URL. If that's a concern,
// replace this with an admin-only auth check on file access instead.
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin routes: intentionally NO auth middleware applied here.
app.use('/api/admin', adminRouter);

// Department and Employee routes: JWT auth applied inside their own routers.
app.use('/api/department', departmentRouter);
app.use('/api/employee', employeeRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

async function start() {
  await connectDB();

  // Ensure a single ESGConfig document exists on startup.
  const existing = await ESGConfig.findOne();
  if (!existing) {
    await ESGConfig.create({});
    console.log('Created default ESGConfig document');
  }

  startOverdueComplianceJob();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`EcoSphere backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
