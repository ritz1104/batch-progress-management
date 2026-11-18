const express = require('express');
const router = express.Router();
const { BatchDAO, DailyProgressDAO, AttendanceDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/batches (Filtered by user permission)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let batches = await BatchDAO.find();

    // If not super admin, filter to only batches assigned to this user
    if (req.user.role !== 'admin') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userName = (req.user.name || '').toLowerCase().trim();
      const userBatches = (req.user.assignedBatches || []).map(String);

      batches = batches.filter(b => {
        if (b.isAllAccess) return true;
        if (userBatches.includes(String(b._id)) || userBatches.includes(b.code)) return true;
        if ((b.assignedEmails || []).some(e => e.toLowerCase().trim() === userEmail)) return true;
        if (b.instructor1 && b.instructor1.toLowerCase().trim() === userName) return true;
        if (b.instructor2 && b.instructor2.toLowerCase().trim() === userName) return true;
        if ((b.instructors || []).some(inst => inst.toLowerCase().trim() === userName || inst.toLowerCase().trim() === userEmail)) return true;
        return false;
      });
    }
    
    // Enrich with dynamic metrics
    const enriched = await Promise.all(batches.map(async (b) => {
      const progresses = await DailyProgressDAO.find({ batchId: String(b._id) });
      let latestProgress = null;
      let maxPercentage = 0;
      if (progresses.length > 0) {
        progresses.sort((a, b) => new Date(b.date) - new Date(a.date));
        latestProgress = progresses[0];
        maxPercentage = Math.max(...progresses.map(p => p.syllabusPercentage || 0));
      }

      const attendances = await AttendanceDAO.find({ batchId: String(b._id) });
      let avgRate = 0;
      if (attendances.length > 0) {
        const totalP = attendances.reduce((acc, curr) => acc + curr.presentCount, 0);
        const totalS = attendances.reduce((acc, curr) => acc + curr.totalStudents, 0);
        avgRate = totalS > 0 ? Math.round((totalP / totalS) * 100) : 0;
      }

      const instructorsList = [b.instructor1, b.instructor2].filter(Boolean);

      return {
        ...b,
        instructor1: b.instructor1 || 'Sarah Jenkins',
        instructor2: b.instructor2 || 'Alex Morgan',
        instructors: instructorsList.length > 0 ? instructorsList : (b.instructors || ['Sarah Jenkins', 'Alex Morgan']),
        assignedEmails: b.assignedEmails || [],
        isAllAccess: !!b.isAllAccess,
        latestTopic: latestProgress ? latestProgress.topic : 'Orientation & Setup',
        syllabusPercentage: maxPercentage,
        totalLecturesLogged: progresses.length,
        averageAttendanceRate: avgRate
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch batches', error: err.message });
  }
});

// GET /api/batches/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const batch = await BatchDAO.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Permission check for non-admin
    if (req.user.role !== 'admin') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userName = (req.user.name || '').toLowerCase().trim();
      const userBatches = (req.user.assignedBatches || []).map(String);

      const hasAccess = batch.isAllAccess ||
        userBatches.includes(String(batch._id)) ||
        userBatches.includes(batch.code) ||
        (batch.assignedEmails || []).some(e => e.toLowerCase().trim() === userEmail) ||
        (batch.instructor1 && batch.instructor1.toLowerCase().trim() === userName) ||
        (batch.instructor2 && batch.instructor2.toLowerCase().trim() === userName);

      if (!hasAccess) {
        return res.status(403).json({ message: 'You do not have access to this batch.' });
      }
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch batch', error: err.message });
  }
});

// POST /api/batches (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { 
      name, 
      code, 
      track, 
      startDate, 
      endDate, 
      instructor1 = 'Sarah Jenkins', 
      instructor2 = 'Alex Morgan', 
      assignedEmails = [],
      isAllAccess = false,
      description = '', 
      color = '#0B6E99', 
      totalStudents = 30 
    } = req.body;
    
    if (!name || !code || !track || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, code, track, start date, and end date are required.' });
    }

    const existing = await BatchDAO.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'A batch with this code already exists.' });
    }

    const batch = await BatchDAO.create({
      name,
      code: code.toUpperCase(),
      track,
      startDate,
      endDate,
      instructor1,
      instructor2,
      instructors: [instructor1, instructor2].filter(Boolean),
      assignedEmails: Array.isArray(assignedEmails) ? assignedEmails.map(e => e.toLowerCase().trim()) : [],
      isAllAccess: !!isAllAccess,
      description,
      color,
      totalStudents: Number(totalStudents) || 30,
      status: 'active'
    });

    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create batch', error: err.message });
  }
});

// PUT /api/batches/:id (Update batch or assign teammate access - Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.instructor1 || updateData.instructor2) {
      updateData.instructors = [
        updateData.instructor1 || 'Sarah Jenkins',
        updateData.instructor2 || 'Alex Morgan'
      ].filter(Boolean);
    }
    if (Array.isArray(updateData.assignedEmails)) {
      updateData.assignedEmails = updateData.assignedEmails.map(e => e.toLowerCase().trim());
    }

    const updated = await BatchDAO.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update batch', error: err.message });
  }
});

// DELETE /api/batches/:id (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const deleted = await BatchDAO.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete batch', error: err.message });
  }
});

module.exports = router;
