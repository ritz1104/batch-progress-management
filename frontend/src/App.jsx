import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MonthEndBanner from './components/MonthEndBanner';
import CalendarView from './components/CalendarView';
import AttendanceTracker from './components/AttendanceTracker';
import EventsHackathons from './components/EventsHackathons';
import BatchesManager from './components/BatchesManager';
import AdminPanel from './components/AdminPanel';
import DailyProgressModal from './components/DailyProgressModal';
import MonthlyReportModal from './components/MonthlyReportModal';
import JoinModal from './components/JoinModal';
import { batchApi, progressApi, attendanceApi, eventApi, reportApi } from './api/client';

function MainApp() {
  const { user, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState('2026-11');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [progressLogs, setProgressLogs] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  // Modals state
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [selectedDateForLog, setSelectedDateForLog] = useState('');
  const [selectedProgressForLog, setSelectedProgressForLog] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Check URL query parameters for invite link: ?join=INV-XXXXX&email=...&role=...
  const [joinModalData, setJoinModalData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setJoinModalData({
        code: joinCode,
        email: params.get('email') || '',
        role: params.get('role') || 'instructor'
      });
    }
  }, []);

  // Load Initial Batches & DB health
  const refreshBatches = async () => {
    try {
      const batchList = await batchApi.getAll();
      setBatches(batchList);
      if (batchList.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batchList[0]._id);
      }
      const health = await reportApi.getHealth();
      setDbStatus(health.database);
    } catch (err) {
      console.error('Failed to load initial batches:', err);
    }
  };

  useEffect(() => {
    refreshBatches();
  }, []);

  // Reload calendar data whenever selected batch or month changes
  const reloadCalendarData = async () => {
    if (!selectedBatchId) return;
    try {
      const logs = await progressApi.getLogs(selectedBatchId, currentMonth);
      setProgressLogs(logs || []);

      const att = await attendanceApi.getByDate(selectedBatchId, '', currentMonth);
      const filteredAtt = (att || []).filter(a => a.date && a.date.startsWith(currentMonth));
      setAttendanceLogs(filteredAtt);

      const evts = await eventApi.getAll(selectedBatchId, currentMonth);
      setEvents(evts || []);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    }
  };

  useEffect(() => {
    reloadCalendarData();
  }, [selectedBatchId, currentMonth]);

  const handleOpenDailyLog = (dateStr) => {
    setSelectedDateForLog(dateStr);
    const existing = progressLogs.find(p => p.date === dateStr);
    setSelectedProgressForLog(existing || null);
    setIsDailyLogOpen(true);
  };

  const handleOpenAttendanceFromDate = (dateStr) => {
    setSelectedDateForLog(dateStr);
    setCurrentTab('attendance');
  };

  const handleOpenEventDetail = (evt) => {
    setCurrentTab('events');
  };

  const selectedBatch = batches.find(b => String(b._id) === String(selectedBatchId));

  return (
    <div className="flex min-h-screen bg-notion-bg text-notion-text font-sans">
      {/* Sidebar (Admin Panel only visible if Super Admin) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        dbStatus={dbStatus}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          batches={batches}
          selectedBatchId={selectedBatchId}
          setSelectedBatchId={setSelectedBatchId}
          currentTab={currentTab}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenDailyLogModal={handleOpenDailyLog}
        />

        <MonthEndBanner
          currentMonth={currentMonth}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {currentTab === 'calendar' && (
            <CalendarView
              currentMonth={currentMonth}
              progressLogs={progressLogs}
              attendanceLogs={attendanceLogs}
              events={events}
              selectedBatch={selectedBatch}
              onOpenDailyLog={handleOpenDailyLog}
              onOpenAttendance={handleOpenAttendanceFromDate}
              onOpenEventDetail={handleOpenEventDetail}
            />
          )}

          {currentTab === 'batches' && (
            <BatchesManager
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              onBatchCreated={refreshBatches}
              setCurrentTab={setCurrentTab}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceTracker
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              initialDate={selectedDateForLog}
              onAttendanceUpdated={reloadCalendarData}
            />
          )}

          {currentTab === 'events' && (
            <EventsHackathons
              events={events}
              batches={batches}
              selectedBatchId={selectedBatchId}
              onEventCreated={reloadCalendarData}
              onEventUpdated={reloadCalendarData}
            />
          )}

          {/* Admin Panel (Accessible only when logged in as Admin) */}
          {currentTab === 'admin' && (
            <AdminPanel
              batches={batches}
              onBatchUpdated={refreshBatches}
            />
          )}

          {currentTab === 'reports' && (
            <div className="bg-white p-8 rounded-lg border border-notion-border shadow-notion-card text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-xl font-bold">
                📄
              </div>
              <div>
                <h2 className="text-base font-bold text-notion-text">
                  Monthly PDF Report Station
                </h2>
                <p className="text-xs text-notion-muted max-w-md mx-auto mt-1">
                  Generate official month-end reports formatted with curriculum logs, daily attendance counts, and hackathons.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Open Report Studio & Download PDF
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Daily Progress & Attendance Modal */}
      <DailyProgressModal
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
        date={selectedDateForLog}
        batches={batches}
        selectedBatchId={selectedBatchId}
        existingProgress={selectedProgressForLog}
        onProgressSaved={reloadCalendarData}
      />

      {/* Flagship Monthly Report PDF Studio Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        batchId={selectedBatchId}
        month={currentMonth}
        batches={batches}
      />

      {/* 1-Click Join Invitation Acceptance Modal */}
      {joinModalData && (
        <JoinModal
          isOpen={!!joinModalData}
          onClose={() => setJoinModalData(null)}
          initialCode={joinModalData.code}
          initialEmail={joinModalData.email}
          initialRole={joinModalData.role}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
