import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckSquare, 
  Trophy, 
  FileText, 
  ShieldCheck, 
  Layers,
  Database,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab, dbStatus }) {
  const { user, isAdmin, isSenior } = useAuth();

  const navItems = [
    { id: 'calendar', label: 'Calendar View', icon: CalendarIcon, badge: 'Google Style' },
    { id: 'batches', label: 'Batches Directory', icon: Layers },
    { id: 'attendance', label: 'Attendance Count', icon: CheckSquare, badge: 'Daily' },
    { id: 'events', label: 'Hackathons & Events', icon: Trophy, count: '3' },
    { id: 'reports', label: 'Monthly PDF Reports', icon: FileText, highlight: true },
  ];

  // Admin Panel is ONLY visible for Super Admin
  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: ShieldCheck,
      badge: 'Admin Only'
    });
  }

  return (
    <aside className="w-64 bg-notion-sidebar border-r border-notion-border flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Top Workspace Header */}
      <div>
        <div className="p-4 border-b border-notion-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-stone-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                B
              </div>
              <div>
                <h1 className="font-semibold text-sm text-notion-text tracking-tight flex items-center gap-1.5">
                  BatchProgress
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-notion-hover text-notion-muted">
                    v1.2
                  </span>
                </h1>
                <p className="text-[11px] text-notion-muted truncate max-w-[140px]">
                  Curriculum & Ops Suite
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-2 py-3 space-y-0.5">
          <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-notion-subtle">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-notion-active text-notion-text font-semibold shadow-notion-card'
                    : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stone-900' : 'text-notion-subtle'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded ${
                    item.id === 'admin' 
                      ? 'bg-amber-100 text-amber-800 font-semibold' 
                      : 'bg-notion-border/70 text-notion-muted'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    PDF Export
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Batch Co-Instructors Callout */}
        <div className="px-3 py-2 mt-1">
          <div className="p-2.5 rounded-md bg-white border border-notion-border text-xs space-y-1.5 shadow-notion-card">
            <div className="flex items-center gap-1.5 text-notion-text font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Two Co-Instructors</span>
            </div>
            <p className="text-[11px] text-notion-muted leading-relaxed">
              Both instructors collaborate on each batch calendar, curriculum logs, and daily attendance counts.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Profile & DB Indicator */}
      <div className="p-3 border-t border-notion-border/70 space-y-2">
        {/* Database indicator */}
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-notion-muted bg-stone-100/70 rounded border border-notion-border/50">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-stone-500" />
            <span className="truncate max-w-[150px]">
              {dbStatus?.connected ? '🟢 MongoDB Connected' : '📦 Resilient Local Store'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-stone-400">Node/API</span>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-notion-hover transition-colors">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                alt={user.name}
                className="w-7 h-7 rounded-full bg-stone-200 border border-notion-border"
              />
              <div className="text-left overflow-hidden">
                <div className="text-xs font-medium text-notion-text truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-notion-muted truncate capitalize">
                  {user.role === 'admin' ? '👑 Super Admin (You)' : (user.role === 'senior' ? '👓 Senior Reviewer' : '👨‍🏫 Instructor')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
