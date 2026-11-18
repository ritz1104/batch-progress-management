import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  Clock, 
  MapPin,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CalendarView({
  currentMonth,
  progressLogs = [],
  attendanceLogs = [],
  events = [],
  selectedBatch,
  onOpenDailyLog,
  onOpenAttendance,
  onOpenEventDetail
}) {
  const { canEdit, isSenior } = useAuth();
  const [hoveredDate, setHoveredDate] = useState(null);

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const todayStr = new Date().toISOString().substring(0, 10);

  // Group data by date string YYYY-MM-DD
  const progressByDate = {};
  progressLogs.forEach(p => {
    progressByDate[p.date] = p;
  });

  const attendanceByDate = {};
  attendanceLogs.forEach(a => {
    attendanceByDate[a.date] = a;
  });

  const eventsByDate = {};
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  // Build grid days
  const calendarCells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthNum = month === 1 ? 12 : month - 1;
    const prevYearNum = month === 1 ? year - 1 : year;
    const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr
    });
  }

  const remainingCells = 35 - calendarCells.length;
  const cellsToFill = remainingCells < 0 ? (42 - calendarCells.length) : remainingCells;
  for (let n = 1; n <= cellsToFill; n++) {
    const nextMonthNum = month === 12 ? 1 : month + 1;
    const nextYearNum = month === 12 ? year + 1 : year;
    const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: n,
      isCurrentMonth: false,
      isNextMonth: true
    });
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border border-notion-border shadow-notion-card overflow-hidden">
      {/* Calendar Header Legend */}
      <div className="px-5 py-3 border-b border-notion-border bg-notion-sidebar/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-notion-text">
            {selectedBatch ? selectedBatch.name : 'All Batches'}
          </span>
          <span className="text-[11px] text-notion-muted">
            • Co-Instructors: <strong className="text-stone-800">{selectedBatch?.instructor1}</strong> & <strong className="text-stone-800">{selectedBatch?.instructor2}</strong>
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
            <span className="text-notion-muted">Lecture Topic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span className="text-notion-muted">Attendance Count</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-600"></span>
            <span className="text-notion-muted">Hackathon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span className="text-notion-muted">Workshop/Event</span>
          </div>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 border-b border-notion-border bg-stone-50/70 text-center text-[11px] font-semibold text-notion-muted py-2">
        {weekdays.map((day, idx) => (
          <div key={day} className={idx === 0 || idx === 6 ? 'text-stone-400' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-[minmax(128px,auto)] divide-x divide-y divide-notion-border/70">
        {calendarCells.map((cell) => {
          const progress = progressByDate[cell.dateStr];
          const attendance = attendanceByDate[cell.dateStr];
          const cellEvents = eventsByDate[cell.dateStr] || [];

          return (
            <div
              key={cell.dateStr}
              onMouseEnter={() => setHoveredDate(cell.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              onClick={() => onOpenDailyLog(cell.dateStr)}
              className={`p-1.5 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                !cell.isCurrentMonth
                  ? 'bg-stone-50/50 text-stone-300'
                  : cell.isToday
                  ? 'bg-blue-50/20'
                  : 'bg-white hover:bg-stone-50/70'
              }`}
            >
              {/* Day Cell Top: Date Number + Hover Action */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    cell.isToday
                      ? 'bg-stone-900 text-white font-bold shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-stone-700'
                      : 'text-stone-400'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {canEdit && cell.isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDailyLog(cell.dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-stone-200 text-stone-500 transition-opacity"
                    title={`Log topic & attendance count for ${cell.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Event Badges List */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {/* 1. Daily Progress Lecture Badge */}
                {progress && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDailyLog(cell.dateStr);
                    }}
                    className="p-1 rounded bg-[#E7F3F8] border border-[#CDE5F0] text-[#0B6E99] text-[11px] leading-tight font-medium hover:brightness-95 transition-all truncate"
                    title={`Topic: ${progress.topic} (${progress.syllabusPercentage}% Completed) - Logged by ${progress.loggedBy || 'Trainer'}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">📘 {progress.topic}</span>
                      <span className="text-[9px] font-mono font-bold bg-white/70 px-1 rounded flex-shrink-0">
                        {progress.syllabusPercentage}%
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Daily Attendance Count Badge */}
                {attendance && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAttendance(cell.dateStr);
                    }}
                    className={`p-1 rounded text-[10px] leading-tight font-medium hover:brightness-95 transition-all truncate flex items-center justify-between ${
                      attendance.attendanceRate >= 85
                        ? 'bg-[#EDF3EC] border border-[#D4E5D3] text-[#0F7B6C]'
                        : attendance.attendanceRate >= 70
                        ? 'bg-[#FBF3DB] border border-[#F4E5B8] text-[#8F6B00]'
                        : 'bg-[#FDEBEC] border border-[#F8D0D2] text-[#E03E3E]'
                    }`}
                    title={`Attendance Count: ${attendance.presentCount}/${attendance.totalStudents} Students Present (${attendance.attendanceRate}%)`}
                  >
                    <span className="truncate">
                      👥 {attendance.presentCount}/{attendance.totalStudents} Present
                    </span>
                    <span className="font-bold flex-shrink-0">{attendance.attendanceRate}%</span>
                  </div>
                )}

                {/* 3. Hackathons & Events Badges */}
                {cellEvents.map((evt) => (
                  <div
                    key={evt._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEventDetail(evt);
                    }}
                    className={`p-1 rounded text-[10px] font-medium leading-tight hover:brightness-95 transition-all truncate flex items-center gap-1 ${
                      evt.type === 'hackathon'
                        ? 'bg-[#F4F0F7] border border-[#E3DCED] text-[#6940A5]'
                        : evt.type === 'workshop'
                        ? 'bg-[#FAECE5] text-[#D9730D] border border-[#F2D7C8]'
                        : 'bg-[#FBF1F5] text-[#AD1A72] border border-[#F4DCDE]'
                    }`}
                    title={`${evt.type.toUpperCase()}: ${evt.title}`}
                  >
                    {evt.type === 'hackathon' ? (
                      <Trophy className="w-3 h-3 flex-shrink-0 text-[#6940A5]" />
                    ) : (
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{evt.title}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Subtle Tag for Instructor */}
              <div className="pt-1 flex items-center justify-between text-[9px] text-stone-400">
                {progress && (
                  <span className="truncate text-stone-500 font-medium">
                    By {progress.loggedBy ? progress.loggedBy.split(' ')[0] : 'Instructor'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
