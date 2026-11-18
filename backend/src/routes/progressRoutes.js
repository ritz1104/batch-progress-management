const express = require('express');
const router = express.Router();
const { DailyProgressDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/progress?batchId=...&month=YYYY-MM&date=YYYY-MM-DD
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { batchId, month, date } = req.query;
    let query = {};
    if (batchId && batchId !== 'all') {
      query.batchId = batchId;
    }
    if (date) {
      query.date = date;
    }

    let records = await DailyProgressDAO.find(query);

    if (month) {
      records = records.filter(r => r.date && r.date.startsWith(month));
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch progress logs', error: err.message });
  }
});

// POST /api/progress (Create or Update log for batch & date)
router.post('/', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const {
      batchId,
      date,
      topic,
      syllabusPercentage = 0,
      summary = '',
      assignments = '',
      resources = [],
      tags = []
    } = req.body;

    if (!batchId || !date || !topic) {
      return res.status(400).json({ message: 'batchId, date, and topic are required.' });
    }

    // Check if an entry already exists for this batch and date
    const existing = await DailyProgressDAO.findOne({ batchId, date });
    if (existing) {
      const updated = await DailyProgressDAO.findByIdAndUpdate(existing._id, {
        topic,
        syllabusPercentage: Number(syllabusPercentage) || 0,
        summary,
        assignments,
        resources,
        tags,
        instructorName: req.user.name
      }, { new: true });
      return res.json(updated);
    }

    const created = await DailyProgressDAO.create({
      batchId,
      date,
      topic,
      syllabusPercentage: Number(syllabusPercentage) || 0,
      summary,
      assignments,
      resources,
      tags,
      instructorName: req.user.name
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record progress', error: err.message });
  }
});

// DELETE /api/progress/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const deleted = await DailyProgressDAO.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Progress record not found' });
    }
    res.json({ message: 'Progress record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete progress', error: err.message });
  }
});

module.exports = router;
