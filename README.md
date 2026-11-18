# BatchProgress — Batch Progress Management Platform

A modern, **Notion-inspired** Batch Progress Management & Academic Operations platform built with **Node.js, Express, React, Tailwind CSS, and MongoDB** (with automatic zero-config resilient local fallback).

---

## 🌟 Key Updates & Features

### 1. 👥 Simple Daily Attendance Head-Count (No Individual Check-Ins Required)
- **Fast Head-Count Entry**: Instead of marking 30+ students one by one, instructors simply enter the **Total Enrolled Strength** and the **Present Count** for the day.
- **Auto-Calculations**:
  - Automatically computes **Absent Count** (`Total - Present`).
  - Automatically computes **Attendance Turnout %** (`(Present / Total) * 100`).
- **All-In-One Daily Drawer**: When an instructor clicks any day in the calendar, they can enter **both** the curriculum topic covered AND the daily attendance count in a single, fast dialog!

### 2. 👩‍🏫👨‍🏫 Dual Co-Instructors per Batch
- Each batch is configured with **two instructors** (e.g. Lead Trainer & Co-Trainer).
- **Both instructors can add and update**:
  - Daily curriculum progress and topics covered.
  - Daily attendance head-counts.
  - Hackathons, workshops, and student events into the calendar.
- Entries are labeled with the instructor's name: *"Logged by Sarah Jenkins (Co-Trainer: Alex Morgan)"*.

### 3. 👑 Exclusive Admin Panel (Owner Access Only)
- Access to the **Admin Panel** is strictly restricted to **Super Admin (You)**.
- **Instructors / Teammates**: Have calendar authoring & attendance tracking permissions on their assigned batches, but **CANNOT** access the Admin Panel or alter system permissions.
- **Seniors / Management**: Have read-only executive oversight and 1-click monthly PDF report generation access.
- **How to Give Access to Other People Using Their Email**:
  1. **Option A (Instant Direct Access)**:
     - Open the **Admin Panel** (`admin@academy.dev`).
     - Enter their **Name**, **Email**, **Role** (Instructor or Senior), and **Assigned Batch**.
     - Click **"Grant Access Now"**.
     - Click **"📋 Copy Ready-to-Send Email Message"** to send them their login link and initial password via Gmail, Outlook, Slack, or WhatsApp!
  2. **Option B (1-Click Invite Link)**:
     - In the Admin Panel, enter their email and click **"Create 1-Click Invite Link"**.
     - Send the link (`http://localhost:5173/?join=INV-...`).
     - When they open the link, an onboarding modal appears allowing them to set their own password and join immediately.

### 4. 📑 Automated Month-End PDF Report
- **Month-End Trigger**: Automatically alerts when the end of the monthly batch cycle arrives.
- **Live Preview & 1-Click PDF Export**:
  - Executive KPI summary (Overall Attendance %, Daily Average Turnout, Syllabus Pacing %, Total Hackathons).
  - Daily Curriculum Progress Table.
  - Daily Attendance Head-Count Register Table.
  - Hackathons & Workshops Showcase.
  - Tripartite Sign-off Block: Primary Instructor, Co-Instructor, and Senior Academic Director.

---

## 🔐 Accounts & Permissions Matrix

| Account / Role | Email | Password | Permissions |
|---|---|---|---|
| **👑 Super Admin (You)** | `admin@academy.dev` | `password123` | **Full Platform Access + Exclusive Admin Panel** |
| **👩‍🏫 Instructor 1 (Primary)** | `sarah.trainer@academy.dev` | `password123` | Add/edit calendar topics, log attendance counts, schedule hackathons |
| **👨‍🏫 Instructor 2 (Co-Trainer)** | `alex.trainer@academy.dev` | `password123` | Add/edit calendar topics, log attendance counts, schedule hackathons |
| **👓 Senior Leadership** | `senior@academy.dev` | `password123` | Read-only batch oversight & 1-click monthly PDF report downloads |

---

## 🚀 How to Run

1. **Double-click [start.bat](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/batch-progress-management/start.bat)** or run `start.ps1` in PowerShell.
2. Open your browser at **`http://localhost:5173`**.
3. Use the **Simulate Role** switcher in the top bar to test how Instructor 1, Instructor 2, and Seniors see the system. Notice that the **Admin Panel** tab in the sidebar is only accessible to you (Super Admin)!
