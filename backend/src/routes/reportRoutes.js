const express = require('express');
const router = express.Router();
const { BatchDAO, DailyProgressDAO, AttendanceDAO, ActivityEventDAO } = require('../models/dao');
const { authenticateToken } = require('../middleware/auth');

// GET /api/reports/month-end-status
router.get('/month-end-status', authenticateToken, (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const lastDateObj = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDateObj.getDate();
  const currentDate = now.getDate();
  const daysRemaining = totalDaysInMonth - currentDate;
  const isMonthEnd = daysRemaining <= 3;

  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const lastDateStr = `${currentMonthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

  res.json({
    currentDate: `${currentMonthStr}-${String(currentDate).padStart(2, '0')}`,
    lastDate: lastDateStr,
    totalDaysInMonth,
    daysRemaining,
    isMonthEnd,
    currentMonth: currentMonthStr,
    monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' })
  });
});

// GET /api/reports/monthly?batchId=...&month=YYYY-MM
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { batchId, month } = req.query;
    if (!batchId) {
      return res.status(400).json({ message: 'batchId is required.' });
    }

    const targetMonth = month || new Date().toISOString().substring(0, 7);

    // 1. Batch info
    const batch = await BatchDAO.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // 2. Daily progress for this month
    let progressLogs = await DailyProgressDAO.find({ batchId });
    progressLogs = progressLogs.filter(p => p.date && p.date.startsWith(targetMonth));
    progressLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    const maxSyllabusPct = progressLogs.length > 0
      ? Math.max(...progressLogs.map(p => p.syllabusPercentage || 0))
      : 0;

    // 3. Attendance count records for this month
    let attendanceLogs = await AttendanceDAO.find({ batchId });
    attendanceLogs = attendanceLogs.filter(a => a.date && a.date.startsWith(targetMonth));
    attendanceLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    let sumPresent = 0;
    let sumTotal = 0;
    attendanceLogs.forEach(a => {
      sumPresent += a.presentCount;
      sumTotal += a.totalStudents;
    });

    const totalDaysRecorded = attendanceLogs.length;
    const overallAttendanceRate = sumTotal > 0 ? Math.round((sumPresent / sumTotal) * 100) : 0;
    const averagePresentCount = totalDaysRecorded > 0 ? Math.round(sumPresent / totalDaysRecorded) : 0;

    // 4. Events & Hackathons for this month
    let events = await ActivityEventDAO.find();
    events = events.filter(e => {
      const matchesBatch = e.batchId === batchId || e.batchId === 'all';
      const matchesMonth = e.date && e.date.startsWith(targetMonth);
      return matchesBatch && matchesMonth;
    });
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Format readable month name
    const [y, m] = targetMonth.split('-');
    const monthDate = new Date(parseInt(y), parseInt(m) - 1, 1);
    const formattedMonth = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    res.json({
      batch: {
        _id: batch._id,
        name: batch.name,
        code: batch.code,
        track: batch.track,
        startDate: batch.startDate,
        endDate: batch.endDate,
        instructor1: batch.instructor1 || 'Sarah Jenkins',
        instructor2: batch.instructor2 || 'Alex Morgan',
        instructors: [batch.instructor1 || 'Sarah Jenkins', batch.instructor2 || 'Alex Morgan'],
        totalStudents: batch.totalStudents || 30,
        color: batch.color
      },
      reportMeta: {
        targetMonth,
        monthName: formattedMonth,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      summary: {
        totalEnrolledStudents: batch.totalStudents || 30,
        totalClassesConducted: progressLogs.length,
        overallAttendanceRate,
        averageDailyPresent: averagePresentCount,
        syllabusCompletedPercentage: maxSyllabusPct,
        totalEventsHeld: events.length,
        hackathonsCount: events.filter(e => e.type === 'hackathon').length
      },
      attendance: {
        totalDaysRecorded,
        overallAttendanceRate,
        averagePresentCount,
        dailyRecords: attendanceLogs.map(a => ({
          date: a.date,
          totalStudents: a.totalStudents,
          presentCount: a.presentCount,
          absentCount: a.absentCount,
          attendanceRate: a.attendanceRate,
          loggedBy: a.loggedBy || 'Trainer',
          note: a.note || ''
        }))
      },
      curriculum: progressLogs.map(p => ({
        date: p.date,
        topic: p.topic,
        syllabusPercentage: p.syllabusPercentage,
        summary: p.summary,
        assignments: p.assignments,
        loggedBy: p.loggedBy || 'Lead Trainer'
      })),
      events: events.map(e => ({
        date: e.date,
        title: e.title,
        type: e.type,
        status: e.status,
        venueOrLink: e.venueOrLink,
        winnerTeam: e.winnerTeam,
        deliverables: e.deliverables,
        participantsCount: e.participantsCount
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate monthly report data', error: err.message });
  }
});

module.exports = router;
