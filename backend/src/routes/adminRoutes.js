const express = require('express');
const router = express.Router();
const { UserDAO, BatchDAO, DailyProgressDAO, AttendanceDAO, ActivityEventDAO, InviteDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { seedData } = require('../seed');
const { isMongoConnected } = require('../config/db');

// All endpoints in this router are restricted to Super Admin only
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// POST /api/admin/seed (Super Admin seeds database with sample cohorts, logs & attendance)
router.post('/seed', async (req, res) => {
  try {
    const { cleanFirst = false } = req.body;
    console.log(`[Admin] Seeding database requested by ${req.user.email} (cleanFirst: ${cleanFirst})...`);

    await seedData(cleanFirst);

    res.json({
      success: true,
      message: cleanFirst
        ? 'Database successfully cleared and reseeded with sample cohorts, attendance logs, and hackathons!'
        : 'Sample batches and logs seeded successfully!'
    });
  } catch (err) {
    console.error('[Admin] Seed error:', err);
    res.status(500).json({ message: 'Failed to seed database', error: err.message });
  }
});

// POST /api/admin/assign-batch (Assign teammate to batch)
router.post('/assign-batch', async (req, res) => {
  try {
    const { userId, batchIds = [] } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await UserDAO.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's assigned batches
    const updatedUser = await UserDAO.findByIdAndUpdate(userId, {
      assignedBatches: batchIds.map(String)
    }, { new: true });

    // Update batches' assignedEmails
    const userEmail = (user.email || '').toLowerCase().trim();
    const allBatches = await BatchDAO.find();
    for (const b of allBatches) {
      const isAssigned = batchIds.map(String).includes(String(b._id));
      let currentEmails = b.assignedEmails || [];
      if (isAssigned && !currentEmails.includes(userEmail)) {
        currentEmails.push(userEmail);
        await BatchDAO.findByIdAndUpdate(b._id, { assignedEmails: currentEmails });
      } else if (!isAssigned && currentEmails.includes(userEmail)) {
        currentEmails = currentEmails.filter(e => e.toLowerCase() !== userEmail);
        await BatchDAO.findByIdAndUpdate(b._id, { assignedEmails: currentEmails });
      }
    }

    res.json({
      message: `Batch permissions updated for ${user.name}`,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign batches', error: err.message });
  }
});

// PUT /api/admin/users/:id/role (Change user role)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['instructor', 'senior', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updated = await UserDAO.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Role updated to ${role}`, user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

// PUT /api/admin/users/:id/approval (Approve or reject a pending instructor)
router.put('/users/:id/approval', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid approval action' });
    }

    if (action === 'approve') {
      const updated = await UserDAO.findByIdAndUpdate(req.params.id, {
        status: 'approved',
        role: 'instructor'
      }, { new: true });
      if (!updated) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: `${updated.name} was approved as an instructor`, user: updated });
    }

    const removed = await UserDAO.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${removed.name}'s registration was rejected` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update approval', error: err.message });
  }
});

// GET /api/admin/system-status (Admin system overview)
router.get('/system-status', async (req, res) => {
  try {
    const totalUsers = await UserDAO.countDocuments();
    const totalBatches = await BatchDAO.countDocuments();
    const totalProgress = await DailyProgressDAO.countDocuments();
    const totalAttendance = await AttendanceDAO.countDocuments();
    const totalEvents = await ActivityEventDAO.countDocuments();

    res.json({
      database: {
        isMongo: isMongoConnected(),
        mode: isMongoConnected() ? 'MongoDB Atlas Cluster Connected' : 'Local File Store Fallback'
      },
      counts: {
        users: totalUsers,
        batches: totalBatches,
        progressLogs: totalProgress,
        attendanceRecords: totalAttendance,
        events: totalEvents
      },
      superAdminEmail: req.user.email
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch status', error: err.message });
  }
});

module.exports = router;
