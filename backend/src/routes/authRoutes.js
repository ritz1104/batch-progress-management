const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserDAO, InviteDAO, BatchDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register (Self-registration or via Invite Code)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'instructor', inviteCode, title } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await UserDAO.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    let assignedRole = role;
    if (inviteCode) {
      const invite = await InviteDAO.findOne({ code: inviteCode, status: 'pending' });
      if (invite) {
        assignedRole = invite.role;
        await InviteDAO.updateOne({ _id: invite._id }, { status: 'accepted' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserDAO.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      title: title || (assignedRole === 'admin' ? 'Batch Lead & Admin' : (assignedRole === 'senior' ? 'Senior Leadership / Reviewer' : 'Instructor & Mentor')),
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/add-member (Direct Account Creation by Admin using Email)
router.post('/add-member', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password = 'password123', role = 'instructor', title, batchId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserDAO.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: `A user with email ${normalizedEmail} already has access.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultTitle = role === 'admin' 
      ? 'Batch Operations Admin' 
      : (role === 'senior' ? 'Senior Academic Leadership' : 'Co-Instructor & Mentor');

    const newUser = await UserDAO.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      title: title || defaultTitle,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`
    });

    // If an instructor was added and a batchId was selected, assign them to that batch
    if (batchId && batchId !== 'all' && role === 'instructor') {
      const batch = await BatchDAO.findById(batchId);
      if (batch) {
        // Assign as instructor2 if instructor1 is occupied, else instructor1
        if (!batch.instructor1 || batch.instructor1 === 'Sarah Jenkins') {
          await BatchDAO.findByIdAndUpdate(batchId, { instructor2: name.trim() });
        } else {
          await BatchDAO.findByIdAndUpdate(batchId, { instructor1: name.trim() });
        }
      }
    }

    res.status(201).json({
      message: 'Access granted successfully!',
      member: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
        avatar: newUser.avatar,
        tempPassword: password
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await UserDAO.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/team (Teammates and Seniors)
router.get('/team', authenticateToken, async (req, res) => {
  try {
    const users = await UserDAO.find();
    const sanitized = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      avatar: u.avatar,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch team members', error: err.message });
  }
});

// DELETE /api/auth/team/:id (Admin removes access)
router.delete('/team/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'You cannot remove your own admin account.' });
    }
    const removed = await UserDAO.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Access revoked successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove user', error: err.message });
  }
});

// POST /api/auth/invite (Create invite link)
router.post('/invite', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role = 'instructor', batchId = 'all', email = '', name = '' } = req.body;
    const code = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const invite = await InviteDAO.create({
      code,
      role,
      batchId,
      email: email.toLowerCase().trim(),
      invitedBy: req.user.name,
      status: 'pending'
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/?join=${code}&email=${encodeURIComponent(email)}&role=${role}`;

    res.status(201).json({
      invite,
      inviteUrl
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate invite', error: err.message });
  }
});

// GET /api/auth/invites
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    const invites = await InviteDAO.find();
    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch invites', error: err.message });
  }
});

// GET /api/auth/verify-invite/:code
router.get('/verify-invite/:code', async (req, res) => {
  try {
    const invite = await InviteDAO.findOne({ code: req.params.code });
    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite code.' });
    }
    res.json(invite);
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify invite', error: err.message });
  }
});

module.exports = router;
