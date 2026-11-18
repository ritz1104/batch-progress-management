import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  FileDown, 
  Layers,
  Shield,
  Plus,
  Users,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  currentMonth, 
  setCurrentMonth, 
  batches = [], 
  selectedBatchId, 
  setSelectedBatchId,
  currentTab,
  onOpenReportModal,
  onOpenDailyLogModal,
  onOpenLoginModal
}) {
  const { user, canEdit, isAdmin, isAuthenticated, logout } = useAuth();

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    let prevY = y;
    let prevM = m - 1;
    if (prevM === 0) {
      prevM = 12;
      prevY = y - 1;
    }
    setCurrentMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM === 13) {
      nextM = 1;
      nextY = y + 1;
    }
    setCurrentMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  const [y, m] = currentMonth.split('-').map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const formattedMonth = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedBatch = batches.find(b => String(b._id) === String(selectedBatchId));

  return (
    <header className="bg-white border-b border-notion-border sticky top-0 z-20 px-6 py-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Breadcrumbs & Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs text-notion-muted">
            <span>Workspace</span>
            <span className="mx-1.5 text-stone-300">/</span>
            <span className="font-semibold text-notion-text">
              {selectedBatch ? selectedBatch.name : 'All Batches'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-notion-border hidden sm:block" />

          {/* Month Stepper */}
          <div className="flex items-center bg-notion-sidebar border border-notion-border rounded-md px-1.5 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-notion-hover rounded text-notion-muted hover:text-notion-text transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-semibold text-notion-text min-w-[110px] text-center flex items-center justify-center gap-1">
              <CalendarIcon className="w-3 h-3 text-stone-500" />
              {formattedMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-notion-hover rounded text-notion-muted hover:text-notion-text transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dual Instructors Pill */}
          {selectedBatch && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-100 text-[11px] text-stone-600 border border-stone-200">
              <Users className="w-3 h-3 text-stone-500" />
              <span>Co-Trainers: <strong>{selectedBatch.instructor1}</strong> & <strong>{selectedBatch.instructor2}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Batch Filter, User info & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Batch Selector (only if authenticated and have batches) */}
          {isAuthenticated && batches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-notion-sidebar border border-notion-border rounded-md px-2 py-1 text-xs">
              <Layers className="w-3.5 h-3.5 text-notion-muted" />
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-transparent font-medium text-notion-text focus:outline-none cursor-pointer text-xs"
              >
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.code} - {b.name.substring(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Authenticated User Role Badge */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-xs">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                alt={user.name}
                className="w-5 h-5 rounded-full bg-stone-200"
              />
              <span className="font-medium text-stone-800 max-w-[100px] truncate">{user.name}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                user.role === 'admin'
                  ? 'bg-amber-100 text-amber-800'
                  : user.role === 'senior'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? '👑 Admin' : user.role === 'senior' ? '👓 Senior' : '👩‍🏫 Instructor'}
              </span>
              <button
                onClick={logout}
                className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-700 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Action: Log Progress / Attendance */}
          {isAuthenticated && canEdit && onOpenDailyLogModal && (
            <button
              onClick={() => onOpenDailyLogModal(new Date().toISOString().substring(0, 10))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-800 text-white text-xs font-medium hover:bg-stone-900 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Day</span>
            </button>
          )}

          {/* Monthly PDF Report Button */}
          {isAuthenticated && (
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-medium transition-colors shadow-sm"
              title="Generate and Download Monthly PDF Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Monthly PDF Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
