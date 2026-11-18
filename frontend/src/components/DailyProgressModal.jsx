import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  Users, 
  Tag, 
  Save, 
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { progressApi, attendanceApi } from '../api/client';

export default function DailyProgressModal({
  isOpen,
  onClose,
  date,
  batches = [],
  selectedBatchId,
  existingProgress,
  onProgressSaved
}) {
  const { user, canEdit, isSenior } = useAuth();

  const [batchId, setBatchId] = useState(selectedBatchId);
  const [topic, setTopic] = useState('');
  const [syllabusPercentage, setSyllabusPercentage] = useState(35);
  const [summary, setSummary] = useState('');
  const [assignments, setAssignments] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loggedBy, setLoggedBy] = useState('');

  // Daily Attendance Count Fields
  const [totalStudents, setTotalStudents] = useState(30);
  const [presentCount, setPresentCount] = useState(28);
  const [attendanceNote, setAttendanceNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedBatch = batches.find(b => String(b._id) === String(batchId));

  useEffect(() => {
    async function loadDayData() {
      if (!isOpen || !date || !batchId) return;

      const batchObj = batches.find(b => String(b._id) === String(batchId));
      const defaultTotal = batchObj ? (batchObj.totalStudents || 30) : 30;
      setTotalStudents(defaultTotal);

      // Default loggedBy to current user or batch instructor
      if (batchObj) {
        setLoggedBy(user?.name || batchObj.instructor1 || 'Sarah Jenkins');
      }

      if (existingProgress) {
        setTopic(existingProgress.topic || '');
        setSyllabusPercentage(existingProgress.syllabusPercentage || 0);
        setSummary(existingProgress.summary || '');
        setAssignments(existingProgress.assignments || '');
        setTagsInput(Array.isArray(existingProgress.tags) ? existingProgress.tags.join(', ') : '');
        if (existingProgress.loggedBy) setLoggedBy(existingProgress.loggedBy);
      } else {
        setTopic('');
        setSyllabusPercentage(batchObj?.syllabusPercentage || 35);
        setSummary('');
        setAssignments('');
        setTagsInput('');
      }

      // Fetch existing attendance count for this date
      try {
        const attList = await attendanceApi.getByDate(batchId, date);
        if (attList && attList.length > 0) {
          const rec = attList[0];
          setTotalStudents(rec.totalStudents || defaultTotal);
          setPresentCount(rec.presentCount !== undefined ? rec.presentCount : defaultTotal);
          setAttendanceNote(rec.note || '');
        } else {
          setPresentCount(Math.round(defaultTotal * 0.9)); // sensible default
          setAttendanceNote('');
        }
      } catch (err) {
        console.warn('Failed to fetch attendance for date:', err);
      }

      setError('');
    }

    loadDayData();
  }, [existingProgress, batchId, date, isOpen]);

  if (!isOpen) return null;

  const absentCount = Math.max(totalStudents - presentCount, 0);
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a lecture topic.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      // 1. Save Daily Progress
      await progressApi.createOrUpdate({
        batchId,
        date,
        topic: topic.trim(),
        syllabusPercentage: Number(syllabusPercentage),
        summary,
        assignments,
        tags,
        loggedBy
      });

      // 2. Save Daily Attendance Count
      await attendanceApi.mark({
        batchId,
        date,
        totalStudents: Number(totalStudents),
        presentCount: Number(presentCount),
        note: attendanceNote,
        loggedBy
      });

      if (onProgressSaved) onProgressSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save daily record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingProgress?._id) return;
    if (!confirm('Are you sure you want to delete this daily log?')) return;
    try {
      setLoading(true);
      await progressApi.delete(existingProgress._id);
      if (onProgressSaved) onProgressSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const instructorOptions = [
    selectedBatch?.instructor1 || 'Sarah Jenkins (Instructor 1)',
    selectedBatch?.instructor2 || 'Alex Morgan (Instructor 2)',
    user?.name
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-notion-border flex items-center justify-between bg-notion-sidebar/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-notion-text">
                {isSenior ? 'Curriculum & Attendance Daily Log' : 'Daily Lecture & Attendance Entry'}
              </h2>
              <p className="text-[11px] text-notion-muted flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{date}</span>
                <span>•</span>
                <span>{selectedBatch?.code || 'Cohort'}</span>
                <span>•</span>
                <span className="text-stone-700 font-medium">Co-Instructors: {selectedBatch?.instructor1} & {selectedBatch?.instructor2}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-notion-hover rounded-md text-notion-muted hover:text-notion-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Instructor Submitting Tag */}
          <div className="p-2.5 rounded-md bg-stone-50 border border-notion-border flex items-center justify-between">
            <span className="font-medium text-stone-700">Logging as Instructor:</span>
            {canEdit ? (
              <select
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="bg-white font-medium text-xs px-2 py-1 rounded border border-stone-200"
              >
                {instructorOptions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-stone-800">{loggedBy || 'Lead Instructor'}</span>
            )}
          </div>

          {/* Lecture Topic */}
          <div>
            <label className="block font-medium text-notion-text mb-1">
              Topic / Concepts Covered Today <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Express Middlewares & JWT Token Verification"
              disabled={!canEdit}
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
              required
            />
          </div>

          {/* DAILY ATTENDANCE COUNT (Total Students & How many came) */}
          <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-950 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Daily Student Attendance Count</span>
              </span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                {attendanceRate}% Present ({presentCount}/{totalStudents})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-emerald-900 mb-1">
                  Total Students in Batch
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={totalStudents}
                  onChange={(e) => setTotalStudents(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-emerald-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-emerald-900 mb-1">
                  Students Present Today (Count)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalStudents}
                  value={presentCount}
                  onChange={(e) => setPresentCount(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-emerald-300 bg-white font-bold text-emerald-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-800">
              <span>Absent Count: <strong className="text-rose-700">{absentCount}</strong></span>
              <span>Turnout: <strong className="text-emerald-900">{attendanceRate}%</strong></span>
            </div>

            <div>
              <input
                type="text"
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
                placeholder="Optional attendance remarks (e.g. 2 on sick leave)..."
                disabled={!canEdit}
                className="w-full text-xs px-2.5 py-1 rounded border border-emerald-200 bg-white text-stone-700"
              />
            </div>
          </div>

          {/* Syllabus Progress Slider */}
          <div className="p-3 bg-stone-50 rounded-lg border border-notion-border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-notion-text flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-stone-500" />
                Cumulative Syllabus Completion:
              </span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {syllabusPercentage}%
              </span>
            </div>
            {canEdit ? (
              <input
                type="range"
                min="0"
                max="100"
                value={syllabusPercentage}
                onChange={(e) => setSyllabusPercentage(e.target.value)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            ) : (
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${syllabusPercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block font-medium text-notion-text mb-1">
              Lecture Summary & Student Engagement Notes
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key concepts discussed, questions raised by students, hands-on lab demonstration..."
              disabled={!canEdit}
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
            />
          </div>

          {/* Assignments */}
          <div>
            <label className="block font-medium text-notion-text mb-1">
              Assignment / Task Assigned
            </label>
            <input
              type="text"
              value={assignments}
              onChange={(e) => setAssignments(e.target.value)}
              placeholder="e.g. Build an authentication middleware and protect user routes"
              disabled={!canEdit}
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-notion-border bg-notion-sidebar/40 flex items-center justify-between text-xs">
          <div>
            {canEdit && existingProgress && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-notion-border text-notion-muted hover:bg-notion-hover"
            >
              Close
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-stone-900 text-white font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save Lecture & Attendance'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
