const jwt = require('jsonwebtoken');
const { UserDAO } = require('../models/dao');

const JWT_SECRET = process.env.JWT_SECRET || 'batch_secret_key_notion_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserDAO.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User session expired or user no longer exists.' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is waiting for admin approval.' });
    }

    req.user = {
      _id: String(user._id),
      name: user.name,
      email: (user.email || '').toLowerCase().trim(),
      role: user.role,
      assignedBatches: user.assignedBatches || [],
      avatar: user.avatar,
      title: user.title
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session. Please sign in again.', error: err.message });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' does not have permission for this action.`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
