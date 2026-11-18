import React, { useState } from 'react';
import { LogIn, UserPlus, Key, Mail, User, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccess(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      const msg = err.message || 'Invalid email or password.';
      if (err.data?.notRegistered) {
        setError('No account found. Please use the "Sign Up" tab to create your account first.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({ name: name.trim(), email: email.trim(), password });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-notion-text">
                BatchProgress
              </h3>
              <p className="text-[11px] text-notion-muted">
                Sign in or create your account
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-notion-hover rounded text-notion-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-md bg-stone-100 p-0.5 border border-stone-200">
          <button
            onClick={() => { setTab('signin'); resetForm(); }}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              tab === 'signin'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setTab('signup'); resetForm(); }}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              tab === 'signup'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span>Sign Up</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{tab === 'signin' ? 'Successfully signed in!' : 'Account created successfully!'}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-notion-text mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. you@gmail.com"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                Password
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-stone-900 hover:bg-black text-white font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>

            <p className="text-center text-[11px] text-stone-400">
              Don't have an account?{' '}
              <button type="button" onClick={() => { setTab('signup'); resetForm(); }} className="text-stone-700 font-medium hover:underline">
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-notion-text mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ritik Rajput"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. you@gmail.com"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-stone-900 hover:bg-black text-white font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>

            <p className="text-center text-[11px] text-stone-400">
              Already have an account?{' '}
              <button type="button" onClick={() => { setTab('signin'); resetForm(); }} className="text-stone-700 font-medium hover:underline">
                Sign In
              </button>
            </p>

            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <strong>Note:</strong> Only the designated admin email gets Super Admin access. All other registrations get Instructor role by default.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
