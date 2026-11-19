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
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab, dbStatus, onOpenLoginModal }) {
  const { user, isAdmin, isSenior, isAuthenticated, logout } = useAuth();

  const navItems = [
    { id: 'calendar', label: 'Calendar View', icon: CalendarIcon, badge: 'Google Style' },
    { id: 'batches', label: 'Batches Directory', icon: Layers },
    { id: 'attendance', label: 'Attendance Count', icon: CheckSquare, badge: 'Daily' },
    { id: 'events', label: 'Hackathons & Events', icon: Trophy, count: '3' },
    { id: 'reports', label: 'Monthly PDF Reports', icon: FileText, highlight: true },
  ];

  // Admin Panel is ONLY visible for authenticated Super Admin
  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: ShieldCheck,
      badge: 'Admin Only'
    });
  }

  return (
    <aside className="hidden md:flex w-64 bg-notion-sidebar border-r border-notion-border flex-col justify-between select-none h-screen sticky top-0 shrink-0">
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
                    v2.0
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
        {isAuthenticated ? (
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
        ) : (
          /* Not authenticated — show sign in prompt */
          <div className="px-3 py-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-stone-400" />
              </div>
              <h3 className="text-sm font-semibold text-notion-text">Welcome to BatchProgress</h3>
              <p className="text-xs text-notion-muted leading-relaxed">
                Please sign in to access your batch calendar, attendance tracking, and reports.
              </p>
            </div>
            <button
              onClick={onOpenLoginModal}
              className="w-full py-2.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sign Up</span>
            </button>
          </div>
        )}

        {/* Batch Co-Instructors Callout (only when authenticated) */}
        {isAuthenticated && (
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
        )}
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

        {/* User Card (only when authenticated) */}
        {isAuthenticated && user && (
          <div className="p-1.5 rounded-md bg-white border border-notion-border space-y-2 shadow-notion-card">
            <div className="flex items-center justify-between">
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
                  <div className="text-[10px] text-notion-muted truncate font-mono">
                    {user.email}
                  </div>
                </div>
              </div>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                user.role === 'admin'
                  ? 'bg-amber-100 text-amber-800'
                  : user.role === 'senior'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? '👑' : user.role === 'senior' ? '👓' : '👩‍🏫'} {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="w-full py-1 rounded bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 text-[11px] font-medium transition-colors border border-stone-200 hover:border-red-200 flex items-center justify-center gap-1"
              title="Sign out of your account"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Sign In Button (when NOT authenticated) */}
        {!isAuthenticated && (
          <button
            onClick={onOpenLoginModal}
            className="w-full py-2 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors border border-stone-200 flex items-center justify-center gap-1"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Sign Up</span>
          </button>
        )}
      </div>
    </aside>
  );
}
