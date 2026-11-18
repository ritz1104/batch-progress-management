import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Key, Mail, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

export default function JoinModal({ isOpen, onClose, initialCode, initialEmail, initialRole }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole || 'instructor');
  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialRole) setRole(initialRole);
    if (initialCode) setInviteCode(initialCode);
  }, [initialEmail, initialRole, initialCode]);

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        name,
        email,
        password,
        role,
        inviteCode
      });
      onClose();
      // Clean up URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-notion-text">
                Welcome! You're Invited to Collaborate
              </h3>
              <p className="text-[11px] text-notion-muted">
                Accept your invitation and join the Batch Progress Workspace.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-notion-hover rounded text-notion-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-notion-text mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diya Patel"
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-notion-text mb-1">
              Your Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-stone-50 font-medium text-stone-800"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-notion-text mb-1">
              Create a Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
              required
            />
          </div>

          <div className="p-2.5 bg-stone-50 rounded-md border border-notion-border text-xs flex items-center justify-between">
            <span className="text-stone-600">Assigned Workspace Role:</span>
            <span className="font-semibold text-stone-900 capitalize">
              {role === 'senior' ? '👓 Senior Reviewer' : '👩‍🏫 Instructor'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-stone-900 hover:bg-black text-white font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Creating Your Account...' : 'Join Workspace Now'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
