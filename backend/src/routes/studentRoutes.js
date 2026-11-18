const express = require('express');
const router = express.Router();
const { StudentDAO, AttendanceDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/students?batchId=...
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { batchId } = req.query;
    const query = {};
    if (batchId) query.batchId = batchId;
    
    const students = await StudentDAO.find(query);
    // Sort by rollNo
    students.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
});

// POST /api/students
router.post('/', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const { batchId, rollNo, name, email, phone = '' } = req.body;
    if (!batchId || !rollNo || !name || !email) {
      return res.status(400).json({ message: 'batchId, rollNo, name, and email are required.' });
    }

    const student = await StudentDAO.create({
      batchId,
      rollNo,
      name,
      email,
      phone,
      status: 'active'
    });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add student', error: err.message });
  }
});

// POST /api/students/bulk (Bulk add or import)
router.post('/bulk', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const { batchId, students } = req.body;
    if (!batchId || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'batchId and array of students are required.' });
    }

    const createdList = [];
    for (const item of students) {
      if (item.name && item.rollNo) {
        const created = await StudentDAO.create({
          batchId,
          rollNo: item.rollNo,
          name: item.name,
          email: item.email || `${item.rollNo.toLowerCase()}@student.academy.dev`,
          phone: item.phone || '',
          status: 'active'
        });
        createdList.push(created);
      }
    }

    res.status(201).json({ count: createdList.length, students: createdList });
  } catch (err) {
    res.status(500).json({ message: 'Bulk import failed', error: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const updated = await StudentDAO.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update student', error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const deleted = await StudentDAO.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
});

module.exports = router;
