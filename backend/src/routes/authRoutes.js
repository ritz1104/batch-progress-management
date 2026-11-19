const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserDAO, InviteDAO, BatchDAO } = require('../models/dao');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register (Self-registration or via Invite Code)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, inviteCode, title } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserDAO.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please Sign In instead.' });
    }

    const envAdminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;

    // STRICT ROLE ASSIGNMENT:
    // Only the ADMIN_EMAIL from environment gets admin role.
    // Everyone else defaults to 'instructor' (or invite-assigned role).
    // Nobody can self-register as admin by passing role='admin' in the request.
    let assignedRole = 'instructor';
    let assignedStatus = 'pending';
    if (envAdminEmail && normalizedEmail === envAdminEmail) {
      assignedRole = 'admin';
      assignedStatus = 'approved';
    }

    if (inviteCode) {
      const invite = await InviteDAO.findOne({ code: inviteCode, status: 'pending' });
      if (invite) {
        // Public registrations always wait for approval and are granted Instructor access.
        assignedRole = 'instructor';
        await InviteDAO.updateOne({ _id: invite._id }, { status: 'accepted' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultTitle = assignedRole === 'admin' 
      ? 'Academy Director & Batch Operations Head' 
      : (assignedRole === 'senior' ? 'Senior Leadership / Reviewer' : 'Lead Instructor & Mentor');

    const user = await UserDAO.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      status: assignedStatus,
      title: title || defaultTitle,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`
    });

    if (assignedStatus === 'pending') {
      return res.status(201).json({
        message: 'Account submitted successfully. Wait for the admin to approve your instructor access.',
        pendingApproval: true,
        user: {
          name: user.name,
          email: user.email,
          role: assignedRole,
          status: assignedStatus
        }
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: assignedRole === 'admin' ? 'Super Admin account created successfully!' : 'Account registered successfully!',
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserDAO.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ 
        message: `No account found for "${normalizedEmail}". Please click "Sign Up" below to create your account.`,
        notRegistered: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is waiting for admin approval.',
        pendingApproval: true
      });
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

// PUT /api/auth/profile (Update Admin or User profile email & password)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user._id;

    // If demo account, find the real admin user in database or create one
    let targetUser = await UserDAO.findById(userId);
    if (!targetUser) {
      targetUser = await UserDAO.findOne({ role: 'admin' });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (email) {
      const normalized = email.toLowerCase().trim();
      const existing = await UserDAO.findOne({ email: normalized });
      if (existing && String(existing._id) !== String(targetUser._id)) {
        return res.status(400).json({ message: 'Another user already uses this email address.' });
      }
      updateFields.email = normalized;
    }
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await UserDAO.findByIdAndUpdate(targetUser._id, updateFields, { new: true });

    const token = jwt.sign(
      { id: updated._id, role: updated.role, email: updated.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Profile updated successfully!',
      token,
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        title: updated.title,
        avatar: updated.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
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
      status: u.status || 'approved',
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

// POST /api/auth/add-member (Admin directly creates a teammate account by email)
router.post('/add-member', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password = 'password123', role = 'instructor', batchId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserDAO.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Never allow creating another admin via add-member
    const safeRole = role === 'admin' ? 'instructor' : role;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const member = await UserDAO.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      status: 'approved',
      title: safeRole === 'senior' ? 'Senior Leadership / Reviewer' : 'Lead Instructor & Mentor',
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`,
      assignedBatches: batchId ? [String(batchId)] : []
    });

    // Also add to batch's assignedEmails if batchId provided
    if (batchId) {
      const batch = await BatchDAO.findById(batchId);
      if (batch) {
        const emails = batch.assignedEmails || [];
        if (!emails.includes(normalizedEmail)) {
          emails.push(normalizedEmail);
          await BatchDAO.findByIdAndUpdate(batchId, { assignedEmails: emails });
        }
      }
    }

    res.status(201).json({
      message: `Access granted to ${name}!`,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        tempPassword: password
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member', error: err.message });
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

    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
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
