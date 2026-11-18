const express = require('express');
const router = express.Router();
const { ActivityEventDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/events?batchId=...&month=YYYY-MM&type=...
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { batchId, month, type } = req.query;
    let events = await ActivityEventDAO.find();

    if (batchId && batchId !== 'all') {
      events = events.filter(e => e.batchId === batchId || e.batchId === 'all');
    }

    if (type) {
      events = events.filter(e => e.type === type);
    }

    if (month) {
      events = events.filter(e => e.date && e.date.startsWith(month));
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// POST /api/events (Create event or hackathon)
router.post('/', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const {
      batchId = 'all',
      title,
      type = 'hackathon',
      date,
      endDate = '',
      time = '10:00 AM',
      description = '',
      organizer = '',
      venueOrLink = '',
      status = 'upcoming',
      winnerTeam = '',
      deliverables = '',
      participantsCount = 0
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required.' });
    }

    const event = await ActivityEventDAO.create({
      batchId,
      title,
      type,
      date,
      endDate: endDate || date,
      time,
      description,
      organizer: organizer || req.user.name,
      venueOrLink,
      status,
      winnerTeam,
      deliverables,
      participantsCount: Number(participantsCount) || 0
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

// PUT /api/events/:id (Update event/hackathon, record winners)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const updated = await ActivityEventDAO.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const deleted = await ActivityEventDAO.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
});

module.exports = router;
