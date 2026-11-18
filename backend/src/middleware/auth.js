const jwt = require('jsonwebtoken');
const { UserDAO } = require('../models/dao');

const JWT_SECRET = process.env.JWT_SECRET || 'batch_secret_key_notion_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Optional Demo Role Header for quick testing/switching
  const demoRole = req.headers['x-demo-role'];
  const demoEmail = req.headers['x-demo-email'];

  if (!token && demoRole) {
    req.user = {
      _id: 'demo-' + demoRole,
      name: demoRole === 'admin' ? 'Admin / Batch Lead' : (demoRole === 'senior' ? 'Senior Director' : 'Teammate / Instructor'),
      email: demoEmail || `${demoRole}@academy.dev`,
      role: demoRole
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserDAO.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      title: user.title
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.', error: err.message });
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
