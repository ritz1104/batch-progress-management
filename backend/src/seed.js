const bcrypt = require('bcryptjs');
const {
  UserDAO,
  BatchDAO,
  DailyProgressDAO,
  AttendanceDAO,
  ActivityEventDAO,
  InviteDAO
} = require('./models/dao');

async function seedData(force = false) {
  const usersCount = await UserDAO.countDocuments();
  if (usersCount > 0 && !force) {
    console.log('[Seed] Database already has data. Skipping seed.');
    return;
  }

  // Clear existing if force
  if (force) {
    await UserDAO.deleteMany();
    await BatchDAO.deleteMany();
    await DailyProgressDAO.deleteMany();
    await AttendanceDAO.deleteMany();
    await ActivityEventDAO.deleteMany();
    await InviteDAO.deleteMany();
  }

  console.log('[Seed] Seeding sample batches (with 2 co-instructors), daily attendance counts, hackathons, and users...');

  // 1. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Super Admin (Only one with Admin Panel access)
  const adminUser = await UserDAO.create({
    name: 'Super Admin',
    email: 'admin@academy.dev',
    password: passwordHash,
    role: 'admin',
    title: 'Academy Director & Batch Operations Head',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin'
  });

  // Instructor 1 (Teammate)
  const trainer1 = await UserDAO.create({
    name: 'Sarah Jenkins',
    email: 'sarah.trainer@academy.dev',
    password: passwordHash,
    role: 'instructor',
    title: 'Lead Full-Stack Instructor (Primary)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah'
  });

  // Instructor 2 (Teammate / Co-Instructor)
  const trainer2 = await UserDAO.create({
    name: 'Alex Morgan',
    email: 'alex.trainer@academy.dev',
    password: passwordHash,
    role: 'instructor',
    title: 'Associate Instructor (Co-Trainer)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex'
  });

  // Senior Reviewer (Read-only + PDF Reports)
  const seniorUser = await UserDAO.create({
    name: 'Dr. Vikram Roy',
    email: 'senior@academy.dev',
    password: passwordHash,
    role: 'senior',
    title: 'VP of Academics & Senior Leadership',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Vikram'
  });

  // 2. Batches with TWO INSTRUCTORS
  const batch1 = await BatchDAO.create({
    code: 'FSW-2026-A',
    name: 'Full Stack Web Engineering (Cohort Alpha)',
    track: 'Full Stack Web Development (MERN)',
    startDate: '2026-11-01',
    endDate: '2027-02-28',
    instructor1: 'Sarah Jenkins',
    instructor2: 'Alex Morgan',
    instructors: ['Sarah Jenkins', 'Alex Morgan'],
    description: 'Intensive 16-week professional bootcamp co-instructed by Sarah Jenkins & Alex Morgan.',
    color: '#0B6E99',
    totalStudents: 32,
    status: 'active'
  });

  const batch2 = await BatchDAO.create({
    code: 'AIML-2026-B',
    name: 'Applied AI & Data Systems (Cohort Beta)',
    track: 'Machine Learning & Generative AI',
    startDate: '2026-11-03',
    endDate: '2027-03-15',
    instructor1: 'Alex Morgan',
    instructor2: 'Sarah Jenkins',
    instructors: ['Alex Morgan', 'Sarah Jenkins'],
    description: 'Mastering Python, LLMs, Vector Databases, and production AI pipelines.',
    color: '#6940A5',
    totalStudents: 26,
    status: 'active'
  });

  // 3. Daily Progress Logs for Batch 1 (November 2026) - Alternating between both instructors
  const curriculumLogs = [
    {
      date: '2026-11-03',
      topic: 'Modern JavaScript ES6+, Async/Await & Event Loop',
      syllabusPercentage: 8,
      summary: 'Deep dive into asynchronous JavaScript, promises chaining, microtask queue, and ES modules.',
      assignments: 'Build an async weather fetcher with debounced search input.',
      loggedBy: 'Sarah Jenkins',
      tags: ['JavaScript', 'Async', 'ES6']
    },
    {
      date: '2026-11-04',
      topic: 'React Core Architecture, JSX & Virtual DOM',
      syllabusPercentage: 15,
      summary: 'Component hierarchy, props drilling vs composition, and reconciliation algorithms.',
      assignments: 'Implement an interactive task breakdown dashboard with nested components.',
      loggedBy: 'Alex Morgan',
      tags: ['React', 'Architecture']
    },
    {
      date: '2026-11-05',
      topic: 'React Hooks: State Management with useState, useEffect & useRef',
      syllabusPercentage: 22,
      summary: 'Hook rules, closures inside hooks, effect cleanup, and avoiding common memory leak pitfalls.',
      assignments: 'Timer app with audio notification and local storage persistence.',
      loggedBy: 'Sarah Jenkins',
      tags: ['React', 'Hooks']
    },
    {
      date: '2026-11-06',
      topic: 'Component Design Systems with Tailwind CSS & Lucide Icons',
      syllabusPercentage: 28,
      summary: 'Responsive utility classes, CSS grid layouts, Notion-inspired design tokens, and accessible buttons.',
      assignments: 'Recreate a Notion page header and database view using Tailwind.',
      loggedBy: 'Alex Morgan',
      tags: ['TailwindCSS', 'UI/UX']
    },
    {
      date: '2026-11-10',
      topic: 'Node.js Runtime & Express Server Architecture',
      syllabusPercentage: 35,
      summary: 'Request-Response cycle, custom middlewares, error handling filters, and environment variables.',
      assignments: 'Create an Express REST API with health-checks, rate limiting, and CORS configuration.',
      loggedBy: 'Sarah Jenkins',
      tags: ['Node.js', 'Express', 'Backend']
    },
    {
      date: '2026-11-11',
      topic: 'RESTful API Routing, Controllers & Validation',
      syllabusPercentage: 42,
      summary: 'Clean controller separation, request body schema validation, and standardized JSON responses.',
      assignments: 'Add CRUD endpoints for student batch enrollments with validation.',
      loggedBy: 'Alex Morgan',
      tags: ['API Design', 'Express']
    },
    {
      date: '2026-11-12',
      topic: 'MongoDB & Mongoose Document Schemas',
      syllabusPercentage: 50,
      summary: 'Data modeling, schema hooks, virtuals, indexing for search performance, and query filters.',
      assignments: 'Design a multi-tenant schema with embedded subdocuments for batch attendance.',
      loggedBy: 'Sarah Jenkins',
      tags: ['MongoDB', 'Mongoose', 'Database']
    },
    {
      date: '2026-11-13',
      topic: 'JWT Authentication, Password Hashing & Role-Based Access Control',
      syllabusPercentage: 58,
      summary: 'Bcrypt salt rounds, token generation, auth middlewares for Admin, Instructor, and Senior roles.',
      assignments: 'Protect batch endpoints with bearer token auth and write unit tests.',
      loggedBy: 'Alex Morgan',
      tags: ['Security', 'JWT', 'Auth']
    },
    {
      date: '2026-11-17',
      topic: 'Full-Stack Integration: Calendar Views, Realtime Attendance & PDF Reporting',
      syllabusPercentage: 65,
      summary: 'Connecting React client with Express endpoints, calendar grid algorithms, and client-side PDF document generation.',
      assignments: 'Generate complete monthly report with automated attendance tables and milestone badges.',
      loggedBy: 'Sarah Jenkins',
      tags: ['FullStack', 'Reporting', 'Calendar']
    }
  ];

  for (const log of curriculumLogs) {
    await DailyProgressDAO.create({
      batchId: String(batch1._id),
      ...log
    });
  }

  // 4. Daily Attendance Count Entries (Total count entered by instructors)
  const attendanceCounts = [
    { date: '2026-11-03', totalStudents: 32, presentCount: 30, loggedBy: 'Sarah Jenkins', note: 'Strong session turnout' },
    { date: '2026-11-04', totalStudents: 32, presentCount: 31, loggedBy: 'Alex Morgan', note: 'Full lab capacity' },
    { date: '2026-11-05', totalStudents: 32, presentCount: 29, loggedBy: 'Sarah Jenkins', note: '3 on medical leave' },
    { date: '2026-11-06', totalStudents: 32, presentCount: 28, loggedBy: 'Alex Morgan', note: 'Friday lab workshop' },
    { date: '2026-11-10', totalStudents: 32, presentCount: 30, loggedBy: 'Sarah Jenkins', note: 'Node.js intro' },
    { date: '2026-11-11', totalStudents: 32, presentCount: 29, loggedBy: 'Alex Morgan', note: 'Active hands-on code along' },
    { date: '2026-11-12', totalStudents: 32, presentCount: 27, loggedBy: 'Sarah Jenkins', note: '5 students attending hackathon prep' },
    { date: '2026-11-13', totalStudents: 32, presentCount: 31, loggedBy: 'Alex Morgan', note: 'JWT security lecture' },
    { date: '2026-11-17', totalStudents: 32, presentCount: 30, loggedBy: 'Sarah Jenkins', note: 'Full stack milestone day' }
  ];

  for (const att of attendanceCounts) {
    const total = att.totalStudents;
    const present = att.presentCount;
    const absent = total - present;
    const rate = Math.round((present / total) * 100);

    await AttendanceDAO.create({
      batchId: String(batch1._id),
      date: att.date,
      totalStudents: total,
      presentCount: present,
      absentCount: absent,
      attendanceRate: rate,
      loggedBy: att.loggedBy,
      note: att.note
    });
  }

  // 5. Activities, Events & Hackathons
  await ActivityEventDAO.create({
    batchId: String(batch1._id),
    title: 'CodeClash 2026: 24-Hour Web Innovation Hackathon',
    type: 'hackathon',
    date: '2026-11-08',
    endDate: '2026-11-09',
    time: '09:00 AM - 09:00 AM (24 Hours)',
    description: 'Students formed 4 teams to build full-stack productivity & collaboration tools from scratch.',
    organizer: 'Sarah Jenkins & Alex Morgan',
    venueOrLink: 'Campus Innovation Lab & Discord',
    status: 'completed',
    winnerTeam: 'Team ByteCraft - AI Kanban Suite',
    deliverables: 'GitHub repository + live demo deployed on Railway + 5-min presentation',
    participantsCount: 28
  });

  await ActivityEventDAO.create({
    batchId: 'all',
    title: 'Industry Masterclass: Scalable Cloud Architecture with AWS',
    type: 'workshop',
    date: '2026-11-14',
    endDate: '2026-11-14',
    time: '04:00 PM - 06:30 PM',
    description: 'Guest lecture and hands-on workshop on microservices & containerization.',
    organizer: 'Alex Morgan',
    venueOrLink: 'Auditorium A & Zoom Live Stream',
    status: 'completed',
    winnerTeam: 'N/A',
    deliverables: 'Hands-on AWS ECS deployment walkthrough',
    participantsCount: 42
  });

  await ActivityEventDAO.create({
    batchId: String(batch1._id),
    title: 'Generative AI Hackathon: Prompt-to-Product Challenge',
    type: 'hackathon',
    date: '2026-11-28',
    endDate: '2026-11-29',
    time: '10:00 AM Start',
    description: 'Build real-world multi-agent and LLM-powered applications using Gemini API and vector storage.',
    organizer: 'Sarah Jenkins & Alex Morgan',
    venueOrLink: 'Hacker Hall & Virtual Workspace',
    status: 'upcoming',
    winnerTeam: 'Pending Evaluation',
    deliverables: 'Working Prototype + API Documentation + Pitch Deck',
    participantsCount: 30
  });

  // 6. Invites
  await InviteDAO.create({
    code: 'INV-SENIOR-2026',
    role: 'senior',
    batchId: 'all',
    invitedBy: 'Super Admin',
    email: 'executive.board@academy.dev',
    status: 'pending'
  });

  console.log('🎉 [Seed] Reseeded with 2 Co-Instructors and Daily Attendance Counts!');
}

module.exports = { seedData };
