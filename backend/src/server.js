require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB, isMongoConnected } = require('./config/db');
const { seedData } = require('./seed');

const authRoutes = require('./routes/authRoutes');
const batchRoutes = require('./routes/batchRoutes');
const progressRoutes = require('./routes/progressRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: isMongoConnected(),
      mode: isMongoConnected() ? 'MongoDB' : 'Local Resilient File Store (Ready for Atlas/Local MongoDB)'
    },
    version: '1.2.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Production Static Frontend Hosting (Single-Server Deployment)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[Static] Serving production frontend from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start server
async function startServer() {
  await connectDB();
  await seedData();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Batch Progress Management Platform running on port ${PORT}`);
    console.log(`📍 Web Interface: http://localhost:${PORT}`);
    console.log(`📍 Health Check:   http://localhost:${PORT}/api/health`);
    console.log(`💾 Database Mode:  ${isMongoConnected() ? 'MongoDB Active' : 'Resilient File Store (data/store.json)'}`);
    console.log(`=======================================================`);
  });
}

startServer();
