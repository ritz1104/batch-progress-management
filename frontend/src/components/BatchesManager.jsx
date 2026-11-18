import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp,
  X,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { batchApi } from '../api/client';

export default function BatchesManager({
  batches = [],
  selectedBatchId,
  setSelectedBatchId,
  onBatchCreated,
  setCurrentTab
}) {
  const { canEdit, isAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [track, setTrack] = useState('Full Stack Web Engineering');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [targetStudents, setTargetStudents] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!name || !code || !startDate) return;

    try {
      setSaving(true);
      await batchApi.create({
        name,
        code: code.toUpperCase(),
        track,
        startDate,
        endDate: endDate || '2027-04-30',
        description,
        targetStudents: Number(targetStudents) || 30
      });
      setShowCreateModal(false);
      setName('');
      setCode('');
      setDescription('');
      if (onBatchCreated) onBatchCreated();
    } catch (err) {
      alert('Failed to create batch: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-notion-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-stone-800" />
              <span>Cohorts & Batches Directory</span>
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              {batches.length} Active Batches
            </span>
          </div>
          <p className="text-xs text-notion-muted mt-0.5">
            Monitor curriculum pacing, enrolled student counts, and active instructor allocations across batches.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Cohort / Batch</span>
          </button>
        )}
      </div>

      {/* Batches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.map((b) => {
          const isSelected = String(b._id) === String(selectedBatchId);

          return (
            <div
              key={b._id}
              onClick={() => setSelectedBatchId(b._id)}
              className={`bg-white rounded-lg border p-5 shadow-notion-card transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/10'
                  : 'border-notion-border hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                    {b.code}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {b.status || 'Active'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-notion-text">
                  {b.name}
                </h3>
                <div className="text-xs text-stone-500 mt-1 font-medium">
                  Track: <span className="text-stone-800">{b.track}</span>
                </div>
                <p className="text-xs text-notion-muted mt-2 line-clamp-2 leading-relaxed">
                  {b.description || 'Professional immersive training cohort.'}
                </p>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-3 pt-3 border-t border-notion-border/70 text-xs">
                {/* Syllabus Completion Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-notion-muted flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span>Syllabus Pacing</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {b.syllabusPercentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${b.syllabusPercentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* Meta Items */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-notion-muted">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{b.studentCount || 0} Students Enrolled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                    <span>{b.totalLecturesLogged || 0} Sessions Logged</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{b.startDate} to {b.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-notion-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400">
                  Instructors: {(b.instructors || []).join(', ') || 'Lead Trainer'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBatchId(b._id);
                    setCurrentTab('calendar');
                  }}
                  className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                >
                  <span>Open Calendar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-notion-border">
              <h3 className="font-semibold text-sm text-notion-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-800" />
                <span>Launch New Batch / Cohort</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-notion-hover rounded text-notion-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud DevOps Engineering (Cohort Gamma)"
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-notion-text mb-1">
                    Batch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DEVOPS-2026-C"
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-notion-text mb-1">Track / Specialization</label>
                  <input
                    type="text"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    placeholder="e.g. AWS & Kubernetes"
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-notion-text mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-notion-border"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-notion-text mb-1">Expected End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-notion-border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">Cohort Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, target competencies, graduation project expectations..."
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-notion-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded border border-notion-border text-notion-muted hover:bg-notion-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-stone-900 text-white font-medium hover:bg-black transition-colors"
                >
                  {saving ? 'Creating...' : 'Launch Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
