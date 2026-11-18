import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Save, 
  Check, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Clock, 
  Edit3, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/client';

export default function AttendanceTracker({
  batches = [],
  selectedBatchId,
  setSelectedBatchId,
  initialDate,
  onAttendanceUpdated
}) {
  const { canEdit, isSenior, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate || new Date().toISOString().substring(0, 10));
  const [totalStudents, setTotalStudents] = useState(30);
  const [presentCount, setPresentCount] = useState(28);
  const [note, setNote] = useState('');
  const [loggedBy, setLoggedBy] = useState('');
  
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedBatch = batches.find(b => String(b._id) === String(selectedBatchId));

  const loadAttendanceData = async () => {
    if (!selectedBatchId) return;
    setLoading(true);
    try {
      const monthStr = currentDate.substring(0, 7);
      const attList = await attendanceApi.getByDate(selectedBatchId, '', monthStr);
      // Filter for this batch and month
      const filtered = (attList || []).filter(a => a.batchId === selectedBatchId && a.date.startsWith(monthStr));
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecords(filtered);

      const sum = await attendanceApi.getSummary(selectedBatchId, monthStr);
      setSummary(sum);

      // Check if entry exists for currentDate
      const dayRec = filtered.find(r => r.date === currentDate);
      const batchCapacity = selectedBatch?.totalStudents || 30;
      if (dayRec) {
        setTotalStudents(dayRec.totalStudents || batchCapacity);
        setPresentCount(dayRec.presentCount || batchCapacity);
        setNote(dayRec.note || '');
        setLoggedBy(dayRec.loggedBy || user?.name || '');
      } else {
        setTotalStudents(batchCapacity);
        setPresentCount(Math.round(batchCapacity * 0.9));
        setNote('');
        setLoggedBy(user?.name || selectedBatch?.instructor1 || 'Sarah Jenkins');
      }
    } catch (err) {
      console.error('Failed to load attendance count records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedBatchId, currentDate]);

  const absentCount = Math.max(totalStudents - presentCount, 0);
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setSaving(true);
      await attendanceApi.mark({
        batchId: selectedBatchId,
        date: currentDate,
        totalStudents: Number(totalStudents),
        presentCount: Number(presentCount),
        note,
        loggedBy: loggedBy || user?.name || 'Trainer'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await loadAttendanceData();
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err) {
      alert('Failed to save attendance count: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectRecordForEdit = (rec) => {
    setCurrentDate(rec.date);
    setTotalStudents(rec.totalStudents);
    setPresentCount(rec.presentCount);
    setNote(rec.note || '');
    setLoggedBy(rec.loggedBy || '');
  };

  const instructorOptions = [
    selectedBatch?.instructor1 || 'Sarah Jenkins',
    selectedBatch?.instructor2 || 'Alex Morgan',
    user?.name
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-notion-text flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Daily Student Attendance Count Log</span>
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {selectedBatch?.code || 'Cohort'}
            </span>
          </div>
          <p className="text-xs text-notion-muted mt-0.5">
            Quickly input the daily attendance head-count for {selectedBatch?.name}. Managed by {selectedBatch?.instructor1} & {selectedBatch?.instructor2}.
          </p>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">Cohort:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-notion-border bg-notion-sidebar focus:bg-white font-medium text-stone-800"
          >
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.code} - {b.name.substring(0, 26)}...</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Aggregate KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-notion-border shadow-notion-card">
          <div className="text-xs text-notion-muted flex items-center justify-between">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl font-bold text-notion-text mt-1">
            {selectedBatch?.totalStudents || 30}
          </div>
          <div className="text-[10px] text-notion-subtle mt-0.5">Batch Headcount</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-notion-border shadow-notion-card">
          <div className="text-xs text-emerald-700 font-medium flex items-center justify-between">
            <span>Avg Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            {summary?.averageAttendanceRate || 0}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Across {records.length} logged sessions</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-notion-border shadow-notion-card">
          <div className="text-xs text-blue-700 font-medium flex items-center justify-between">
            <span>Avg Daily Present</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-800 mt-1">
            {summary?.averagePresentCount || 0} Students
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">Mean daily attendance</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-notion-border shadow-notion-card">
          <div className="text-xs text-purple-700 font-medium flex items-center justify-between">
            <span>Peak Turnout Day</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-800 mt-1">
            {summary?.highestAttendance ? `${summary.highestAttendance.rate}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">
            {summary?.highestAttendance?.date || 'No logs yet'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Fast Daily Attendance Count Entry Form */}
        {canEdit ? (
          <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-2 border-b border-notion-border">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-xs text-notion-text uppercase tracking-wider">
                Enter Daily Head Count
              </h3>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Select Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-stone-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Instructor Logging Attendance
                </label>
                <select
                  value={loggedBy}
                  onChange={(e) => setLoggedBy(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                >
                  {instructorOptions.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Total Enrolled
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={totalStudents}
                    onChange={(e) => setTotalStudents(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-emerald-800 mb-1">
                    Students Present Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalStudents}
                    value={presentCount}
                    onChange={(e) => setPresentCount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-md border border-emerald-400 bg-emerald-50/50 font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Live Turnout Calculation Pill */}
              <div className="p-3 bg-stone-50 rounded-md border border-notion-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500">Calculated Absent:</span>{' '}
                  <strong className="text-rose-600 font-mono">{absentCount}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Daily Attendance Rate:</span>{' '}
                  <strong className="text-emerald-700 font-mono text-sm">{attendanceRate}%</strong>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Remarks / Attendance Notes
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 2 students absent due to hackathon travel..."
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 rounded-md bg-stone-900 hover:bg-black text-white font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attendance Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Recording...' : 'Save Daily Attendance Count'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card text-xs text-stone-600 space-y-2 h-fit">
            <h3 className="font-semibold text-stone-800">Senior Oversight View</h3>
            <p>
              Daily headcounts are recorded directly by the batch instructors ({selectedBatch?.instructor1} & {selectedBatch?.instructor2}).
            </p>
          </div>
        )}

        {/* Right Column: Historical Daily Attendance Counts Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-notion-border shadow-notion-card overflow-hidden">
          <div className="p-3.5 border-b border-notion-border bg-notion-sidebar/40 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-notion-text uppercase tracking-wider">
              Recorded Daily Attendance History ({records.length} Sessions)
            </h3>
            <span className="text-[11px] text-notion-muted">
              Month of {currentDate.substring(0, 7)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-notion-border text-notion-muted font-medium text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Enrolled</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-center">Rate %</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-3">Notes</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-notion-border">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-stone-800">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-stone-500">
                      {r.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800">
                      {r.presentCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-600">
                      {r.absentCount}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        r.attendanceRate >= 85
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.attendanceRate >= 70
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {r.loggedBy || 'Trainer'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 text-[11px] max-w-[140px] truncate">
                      {r.note || '—'}
                    </td>
                    {canEdit && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleSelectRecordForEdit(r)}
                          className="p-1 hover:bg-stone-200 rounded text-stone-600 transition-colors"
                          title="Edit this day's attendance"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="py-10 text-center text-xs text-notion-muted">
                      No attendance counts recorded for this month yet. Enter today's count on the left!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
