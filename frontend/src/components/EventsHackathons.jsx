import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Users, 
  CheckCircle, 
  ArrowUpRight,
  Award,
  Filter,
  X,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/client';

export default function EventsHackathons({
  events = [],
  batches = [],
  selectedBatchId,
  onEventCreated,
  onEventUpdated
}) {
  const { canEdit, isSenior } = useAuth();
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [winnerTeamInput, setWinnerTeamInput] = useState('');

  // New Event Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('hackathon');
  const [batchId, setBatchId] = useState(selectedBatchId || 'all');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [venueOrLink, setVenueOrLink] = useState('Lab 1 / Virtual');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [participantsCount, setParticipantsCount] = useState(25);
  const [saving, setSaving] = useState(false);

  const handleOpenWinnerModal = (evt) => {
    setSelectedEvent(evt);
    setWinnerTeamInput(evt.winnerTeam || '');
    setShowWinnerModal(true);
  };

  const handleSaveWinner = async () => {
    if (!selectedEvent) return;
    try {
      await eventApi.update(selectedEvent._id, {
        winnerTeam: winnerTeamInput,
        status: 'completed'
      });
      // Fire confetti celebration!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setShowWinnerModal(false);
      if (onEventUpdated) onEventUpdated();
    } catch (err) {
      alert('Failed to update winner: ' + err.message);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title || !date) return;
    try {
      setSaving(true);
      await eventApi.create({
        batchId,
        title,
        type,
        date,
        endDate: endDate || date,
        time,
        venueOrLink,
        description,
        deliverables,
        participantsCount: Number(participantsCount) || 0,
        status: 'upcoming'
      });
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setDeliverables('');
      if (onEventCreated) onEventCreated();
    } catch (err) {
      alert('Failed to create event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-notion-text flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span>Activities, Hackathons & Events Hub</span>
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {filteredEvents.length} Events
            </span>
          </div>
          <p className="text-xs text-notion-muted mt-0.5">
            Track hackathons, workshops, and industry sessions across all batches with deliverables, rosters, and winner showcases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center bg-stone-100 rounded-md p-0.5 border border-notion-border text-xs">
            {['all', 'hackathon', 'workshop', 'assessment'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  filterType === t
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t === 'all' ? 'All Activities' : `${t}s`}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event / Hackathon</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => {
          const isHackathon = evt.type === 'hackathon';
          const isCompleted = evt.status === 'completed';
          const batchObj = batches.find(b => String(b._id) === String(evt.batchId));

          return (
            <div
              key={evt._id}
              className="bg-white rounded-lg border border-notion-border p-4 shadow-notion-card flex flex-col justify-between hover:border-stone-300 transition-all space-y-3"
            >
              {/* Card Top: Type Badge & Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`notion-pill text-[11px] font-semibold ${
                        isHackathon
                          ? 'bg-[#F4F0F7] text-[#6940A5] border border-[#E3DCED]'
                          : evt.type === 'workshop'
                          ? 'bg-[#FAECE5] text-[#D9730D] border border-[#F2D7C8]'
                          : 'bg-[#FBF1F5] text-[#AD1A72] border border-[#F4DCDE]'
                      }`}
                    >
                      {isHackathon ? '🚀 Hackathon' : evt.type === 'workshop' ? '🎯 Workshop' : '📝 Assessment'}
                    </span>

                    <span className="text-[10px] text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                      {batchObj ? batchObj.code : 'All Batches'}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm text-notion-text leading-snug">
                  {evt.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-notion-muted mt-1.5 line-clamp-2 leading-relaxed">
                  {evt.description || 'No description provided.'}
                </p>
              </div>

              {/* Meta details */}
              <div className="space-y-1.5 pt-2 border-t border-notion-border/60 text-xs text-notion-muted">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{evt.date} {evt.endDate && evt.endDate !== evt.date ? `to ${evt.endDate}` : ''}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{evt.time}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="truncate max-w-[180px]">{evt.venueOrLink}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{evt.participantsCount || 0} Participants</span>
                  </span>
                </div>
              </div>

              {/* Deliverables / Winner Showcase */}
              <div className="pt-2 border-t border-notion-border/60">
                {evt.winnerTeam ? (
                  <div className="p-2.5 rounded-md bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                          🏆 Winning Team
                        </div>
                        <div className="text-xs font-medium text-amber-950">
                          {evt.winnerTeam}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenWinnerModal(evt)}
                        className="text-[10px] text-amber-700 hover:underline font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-notion-muted">
                    <span className="text-[11px] truncate max-w-[220px]">
                      {evt.deliverables ? `Deliverables: ${evt.deliverables}` : 'Pending submissions'}
                    </span>
                    {canEdit && isHackathon && (
                      <button
                        onClick={() => handleOpenWinnerModal(evt)}
                        className="text-[11px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded transition-colors"
                      >
                        Declare Winner 🏆
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Event / Hackathon */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-notion-border flex items-center justify-between bg-notion-sidebar/60">
              <h3 className="font-semibold text-sm text-notion-text flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-600" />
                <span>Schedule New Activity / Hackathon</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-notion-hover rounded text-notion-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Title / Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CodeClash 2026: 24-Hour Web Innovation Challenge"
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:outline-none focus:ring-1 focus:ring-stone-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-notion-text mb-1">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                  >
                    <option value="hackathon">🚀 Hackathon</option>
                    <option value="workshop">🎯 Workshop</option>
                    <option value="event">🌟 Event / Guest Lecture</option>
                    <option value="assessment">📝 Mid-Term Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-notion-text mb-1">Assigned Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                  >
                    <option value="all">All Batches (Institute-Wide)</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-notion-text mb-1">Start Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-notion-border"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-notion-text mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-notion-border"
                  />
                </div>
                <div>
                  <label className="block font-medium text-notion-text mb-1">Timing</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-notion-border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">Venue or Meeting Link</label>
                <input
                  type="text"
                  value={venueOrLink}
                  onChange={(e) => setVenueOrLink(e.target.value)}
                  placeholder="Campus Innovation Lab / Discord / Zoom Link"
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                />
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">Description & Objective</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the challenge, topic, or keynote..."
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                />
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">Deliverables / Submission Requirements</label>
                <input
                  type="text"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. GitHub Repository, Live Demo URL, Slide Deck"
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-notion-border">
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
                  {saving ? 'Creating...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Declare Winner */}
      {showWinnerModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-notion-text">
                  Declare Hackathon Winner
                </h3>
                <p className="text-xs text-notion-muted">
                  {selectedEvent.title}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-notion-text mb-1">
                Winning Team & Project Highlights
              </label>
              <textarea
                rows={3}
                value={winnerTeamInput}
                onChange={(e) => setWinnerTeamInput(e.target.value)}
                placeholder="e.g. Team ByteCraft (Aarav, Diya, Rohan) - AI Kanban Suite"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWinnerModal(false)}
                className="px-3 py-1.5 rounded border border-notion-border text-xs text-notion-muted hover:bg-notion-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWinner}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Publish Winner & Celebrate 🎉</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
