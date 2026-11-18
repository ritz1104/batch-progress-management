const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'instructor', 'senior'], default: 'instructor' },
  avatar: { type: String, default: '' },
  title: { type: String, default: 'Team Member' },
  assignedBatches: [{ type: String }], // Array of batch IDs or codes this user can access
  createdAt: { type: Date, default: Date.now }
});

const BatchSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  track: { type: String, required: true },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true },
  instructor1: { type: String, default: 'Sarah Jenkins' }, // Primary Instructor
  instructor2: { type: String, default: 'Alex Morgan' },   // Co-Instructor
  instructors: [{ type: String }],
  assignedEmails: [{ type: String }], // Array of teammate emails who have access to this batch
  isAllAccess: { type: Boolean, default: false }, // If true, all teammates can see it
  description: { type: String, default: '' },
  color: { type: String, default: '#0B6E99' },
  status: { type: String, enum: ['active', 'completed', 'upcoming'], default: 'active' },
  totalStudents: { type: Number, default: 30 }, // Total enrolled strength
  createdAt: { type: Date, default: Date.now }
});

const DailyProgressSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  topic: { type: String, required: true },
  syllabusPercentage: { type: Number, default: 0, min: 0, max: 100 },
  summary: { type: String, default: '' },
  assignments: { type: String, default: '' },
  resources: [{ title: String, url: String }],
  loggedBy: { type: String, default: '' }, // Which of the 2 instructors logged this
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Simplified Attendance Schema: Just Total Count & Present Count per day
const AttendanceSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalStudents: { type: Number, required: true, default: 30 },
  presentCount: { type: Number, required: true, default: 0 },
  absentCount: { type: Number, default: 0 },
  attendanceRate: { type: Number, default: 0 }, // Percentage e.g. 90
  loggedBy: { type: String, default: '' }, // Instructor who entered the count
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const ActivityEventSchema = new mongoose.Schema({
  batchId: { type: String, default: 'all' },
  title: { type: String, required: true },
  type: { type: String, enum: ['hackathon', 'workshop', 'event', 'assessment', 'guest_lecture'], default: 'hackathon' },
  date: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, default: '' },
  time: { type: String, default: '10:00 AM' },
  description: { type: String, default: '' },
  organizer: { type: String, default: '' },
  venueOrLink: { type: String, default: 'Lab 1 / Virtual' },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  winnerTeam: { type: String, default: '' },
  deliverables: { type: String, default: '' },
  participantsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const InviteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  role: { type: String, enum: ['instructor', 'senior', 'admin'], default: 'instructor' },
  batchId: { type: String, default: 'all' },
  invitedBy: { type: String, default: 'Admin' },
  email: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
});

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const BatchModel = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
const DailyProgressModel = mongoose.models.DailyProgress || mongoose.model('DailyProgress', DailyProgressSchema);
const AttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const ActivityEventModel = mongoose.models.ActivityEvent || mongoose.model('ActivityEvent', ActivityEventSchema);
const InviteModel = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);

module.exports = {
  UserModel,
  BatchModel,
  DailyProgressModel,
  AttendanceModel,
  ActivityEventModel,
  InviteModel
};
