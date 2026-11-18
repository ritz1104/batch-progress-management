const express = require('express');
const router = express.Router();
const { AttendanceDAO, BatchDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/attendance?batchId=...&date=YYYY-MM-DD&month=YYYY-MM
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { batchId, date, month } = req.query;
    let query = {};
    if (batchId && batchId !== 'all') {
      query.batchId = batchId;
    }
    if (date) {
      query.date = date;
    }

    let records = await AttendanceDAO.find(query);

    if (month) {
      records = records.filter(r => r.date && r.date.startsWith(month));
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance records', error: err.message });
  }
});

// POST /api/attendance (Log or update daily attendance count)
router.post('/', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const { batchId, date, totalStudents = 30, presentCount = 0, note = '', loggedBy = '' } = req.body;
    
    if (!batchId || !date) {
      return res.status(400).json({ message: 'batchId and date are required.' });
    }

    const total = Number(totalStudents) || 30;
    const present = Math.min(Number(presentCount) || 0, total);
    const absent = Math.max(total - present, 0);
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const instructorName = loggedBy || req.user.name;

    // Check if record exists for this batch and date
    const existing = await AttendanceDAO.findOne({ batchId, date });
    if (existing) {
      const updated = await AttendanceDAO.findByIdAndUpdate(existing._id, {
        totalStudents: total,
        presentCount: present,
        absentCount: absent,
        attendanceRate,
        loggedBy: instructorName,
        note
      }, { new: true });
      return res.json(updated);
    }

    const created = await AttendanceDAO.create({
      batchId,
      date,
      totalStudents: total,
      presentCount: present,
      absentCount: absent,
      attendanceRate,
      loggedBy: instructorName,
      note
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record attendance', error: err.message });
  }
});

// GET /api/attendance/summary?batchId=...&month=YYYY-MM
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { batchId, month } = req.query;
    if (!batchId) {
      return res.status(400).json({ message: 'batchId is required.' });
    }

    let records = await AttendanceDAO.find({ batchId });
    if (month) {
      records = records.filter(a => a.date && a.date.startsWith(month));
    }
    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalDaysRecorded = records.length;
    if (totalDaysRecorded === 0) {
      return res.json({
        batchId,
        month: month || 'all',
        totalDaysRecorded: 0,
        averageAttendanceRate: 0,
        averagePresentCount: 0,
        highestAttendance: null,
        lowestAttendance: null,
        dailyBreakdown: []
      });
    }

    let sumPresent = 0;
    let sumTotal = 0;
    records.forEach(r => {
      sumPresent += r.presentCount;
      sumTotal += r.totalStudents;
    });

    const averageAttendanceRate = sumTotal > 0 ? Math.round((sumPresent / sumTotal) * 100) : 0;
    const averagePresentCount = Math.round(sumPresent / totalDaysRecorded);

    // Find highest and lowest attendance days
    const sortedByRate = [...records].sort((a, b) => b.attendanceRate - a.attendanceRate);
    const highestAttendance = sortedByRate[0];
    const lowestAttendance = sortedByRate[sortedByRate.length - 1];

    res.json({
      batchId,
      month: month || 'all',
      totalDaysRecorded,
      averageAttendanceRate,
      averagePresentCount,
      highestAttendance: {
        date: highestAttendance.date,
        rate: highestAttendance.attendanceRate,
        present: highestAttendance.presentCount,
        total: highestAttendance.totalStudents
      },
      lowestAttendance: {
        date: lowestAttendance.date,
        rate: lowestAttendance.attendanceRate,
        present: lowestAttendance.presentCount,
        total: lowestAttendance.totalStudents
      },
      dailyBreakdown: records
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate attendance summary', error: err.message });
  }
});

module.exports = router;
