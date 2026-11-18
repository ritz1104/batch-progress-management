import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Mail, 
  Key, 
  Save, 
  Check, 
  AlertCircle, 
  Lock, 
  UserPlus, 
  Copy, 
  Trash2, 
  ExternalLink,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { batchApi, authApi, adminApi } from '../api/client';

export default function AdminPanel({ batches = [], onBatchUpdated }) {
  const { isAdmin, user } = useAuth();
  const [team, setTeam] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?._id || '');
  const [instructor1, setInstructor1] = useState('Sarah Jenkins');
  const [instructor2, setInstructor2] = useState('Alex Morgan');
  const [totalStudents, setTotalStudents] = useState(30);
  const [savingBatch, setSavingBatch] = useState(false);
  const [savedBatchSuccess, setSavedBatchSuccess] = useState(false);

  // Admin Self Profile State
  const [adminName, setAdminName] = useState(user?.name || 'Super Admin');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@academy.dev');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Direct Email Access State
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directRole, setDirectRole] = useState('instructor');
  const [directBatchId, setDirectBatchId] = useState(batches[0]?._id || '');
  const [directPassword, setDirectPassword] = useState('password123');
  const [addingMember, setAddingMember] = useState(false);
  const [addedMemberResult, setAddedMemberResult] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Invite Link State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('instructor');
  const [inviteBatchId, setInviteBatchId] = useState(batches[0]?._id || '');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  // Seed Database State
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');

  const loadTeam = async () => {
    try {
      const teamList = await authApi.getTeam();
      setTeam(teamList);
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    if (selectedBatchId && batches.length > 0) {
      const b = batches.find(x => String(x._id) === String(selectedBatchId));
      if (b) {
        setInstructor1(b.instructor1 || 'Sarah Jenkins');
        setInstructor2(b.instructor2 || 'Alex Morgan');
        setTotalStudents(b.totalStudents || 30);
      }
    }
  }, [selectedBatchId, batches]);

  if (!isAdmin) {
    return (
      <div className="bg-white p-12 rounded-xl border border-red-200 text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-stone-900">Admin Panel Access Restricted</h2>
        <p className="text-xs text-stone-600">
          Only the Super Administrator (Owner) has access to this administration console. Instructors and Seniors have delegated workspace access.
        </p>
      </div>
    );
  }

  // 0. Update Admin's Own Email & Password
  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminEmail) return;

    try {
      setUpdatingProfile(true);
      setProfileError('');
      const res = await authApi.updateProfile({
        name: adminName,
        email: adminEmail,
        password: adminNewPassword || undefined
      });
      localStorage.setItem('token', res.token);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
      setAdminNewPassword('');
      await loadTeam();
    } catch (err) {
      setProfileError(err.message || 'Failed to update admin profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // 1. Direct Grant Access by Email
  const handleDirectAddMember = async (e) => {
    e.preventDefault();
    if (!directName || !directEmail) return;

    try {
      setAddingMember(true);
      setErrorMsg('');
      const res = await authApi.addMember({
        name: directName,
        email: directEmail,
        password: directPassword || 'password123',
        role: directRole,
        batchId: directBatchId
      });

      setAddedMemberResult(res.member);
      setDirectName('');
      setDirectEmail('');
      await loadTeam();
      if (onBatchUpdated) onBatchUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to grant access');
    } finally {
      setAddingMember(false);
    }
  };

  // 2. Generate Shareable Invite Link by Email
  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setGeneratingInvite(true);
      const res = await authApi.createInvite({
        email: inviteEmail,
        role: inviteRole,
        batchId: inviteBatchId
      });
      setGeneratedInvite(res);
      setInviteEmail('');
      await loadTeam();
    } catch (err) {
      alert('Failed to generate invite: ' + err.message);
    } finally {
      setGeneratingInvite(false);
    }
  };

  // Copy Email Template to Clipboard
  const handleCopyEmailTemplate = (member) => {
    const batchName = batches.find(b => String(b._id) === String(directBatchId))?.name || 'Assigned Cohort';
    const text = `Subject: Welcome to BatchProgress — Your Access Credentials\n\n` +
      `Hello ${member.name},\n\n` +
      `You have been granted access to the Batch Progress Management platform.\n\n` +
      `🔗 Workspace Portal: ${window.location.origin}\n` +
      `📧 Login Email: ${member.email}\n` +
      `🔑 Password: ${member.tempPassword || 'password123'}\n` +
      `🏷️ Assigned Role: ${member.role === 'senior' ? 'Senior Reviewer (Executive Oversight & PDF Reports)' : 'Instructor (Add to Calendar & Daily Attendance)'}\n` +
      `👥 Batch: ${batchName}\n\n` +
      `You can now log in at ${window.location.origin} and collaborate on the batch progress.\n\n` +
      `Best regards,\n${user?.name || 'Batch Operations Lead'}`;

    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 3000);
  };

  // Copy Invite Link to Clipboard
  const handleCopyInviteLink = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite.inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Revoke Access
  const handleRevokeAccess = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to revoke access for ${memberName}? They will no longer be able to log in.`)) return;
    try {
      await authApi.removeMember(memberId);
      await loadTeam();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Co-Instructor Batch Assignment
  const handleSaveCoInstructors = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    try {
      setSavingBatch(true);
      await batchApi.update(selectedBatchId, {
        instructor1,
        instructor2,
        totalStudents: Number(totalStudents)
      });
      setSavedBatchSuccess(true);
      setTimeout(() => setSavedBatchSuccess(false), 3000);
      if (onBatchUpdated) onBatchUpdated();
    } catch (err) {
      alert('Failed to update batch instructors: ' + err.message);
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
              Super Admin Console • Owner Exclusive
            </span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Email Access & Teammate Management</span>
          </h2>
          <p className="text-xs text-stone-400">
            Easily give access to instructors and seniors using their email address, manage batch co-trainers, and control workspace permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-stone-800 border border-stone-700 text-xs font-mono text-amber-300">
            Admin Access Level
          </span>
        </div>
      </div>

      {/* Super Admin Personal Email & Credentials Settings */}
      <div className="bg-white rounded-lg border border-notion-border p-5 shadow-notion-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm text-notion-text">
              Your Super Admin Email & Login Credentials
            </h3>
          </div>
          <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-mono">
            Active Admin: {user?.email}
          </span>
        </div>
        <p className="text-xs text-notion-muted">
          Change this to your original personal/work email so you can log in directly from anywhere without using the demo credentials!
        </p>

        {profileError && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Admin profile updated! You can now log in with {adminEmail} anytime.</span>
          </div>
        )}

        <form onSubmit={handleUpdateAdminProfile} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end">
          <div>
            <label className="block font-medium text-notion-text mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-notion-text mb-1">
              Your Original Email (Admin Login) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-notion-text mb-1">
              New Password (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
              />
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-4 py-2 rounded-md bg-stone-900 hover:bg-black text-white font-semibold transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {updatingProfile ? 'Saving...' : 'Save Email'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Two Methods to Give Access by Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Instant Account Creation by Email */}
        <div className="bg-white rounded-lg border border-notion-border p-6 shadow-notion-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-notion-border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-notion-text">
                Option 1: Add Teammate Directly by Email
              </h3>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Instant Access
            </span>
          </div>
          <p className="text-xs text-notion-muted">
            Enter your teammate or senior's email. Their login credentials are created immediately with a copyable welcome message!
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDirectAddMember} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-notion-text mb-1">
                Colleague / Senior Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                placeholder="e.g. rahul.sharma@company.com"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Access Role
                </label>
                <select
                  value={directRole}
                  onChange={(e) => setDirectRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                >
                  <option value="instructor">👩‍🏫 Instructor (Can edit calendar & attendance)</option>
                  <option value="senior">👓 Senior Reviewer (Read-Only & PDF Reports)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Assign to Batch
                </label>
                <select
                  value={directBatchId}
                  onChange={(e) => setDirectBatchId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                >
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.code} - {b.name.substring(0, 16)}...</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                Initial Password
              </label>
              <input
                type="text"
                value={directPassword}
                onChange={(e) => setDirectPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border font-mono text-stone-700 bg-stone-50"
              />
            </div>

            <button
              type="submit"
              disabled={addingMember}
              className="w-full py-2.5 rounded-md bg-stone-900 hover:bg-black text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{addingMember ? 'Granting Access...' : 'Grant Access Now'}</span>
            </button>
          </form>

          {/* Success Result & Copy Email Template */}
          {addedMemberResult && (
            <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-emerald-900 font-semibold">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Access Granted to {addedMemberResult.name}!</span>
                </span>
                <span className="capitalize text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                  {addedMemberResult.role}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800">
                They can now log in using <strong>{addedMemberResult.email}</strong> and password: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200">{addedMemberResult.tempPassword}</code>.
              </div>
              <button
                type="button"
                onClick={() => handleCopyEmailTemplate(addedMemberResult)}
                className="w-full py-1.5 rounded bg-white hover:bg-emerald-100 text-emerald-900 font-medium border border-emerald-300 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTemplate ? 'Copied Email Draft to Clipboard!' : '📋 Copy Ready-to-Send Email Message'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Method 2: Shareable Email Invite Link */}
        <div className="bg-white rounded-lg border border-notion-border p-6 shadow-notion-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-notion-border">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm text-notion-text">
                Option 2: Generate 1-Click Invite Link
              </h3>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Self-Register
            </span>
          </div>
          <p className="text-xs text-notion-muted">
            Send an invitation link where your teammate or senior registers their own password and joins automatically with pre-configured permissions.
          </p>

          <form onSubmit={handleGenerateInvite} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-notion-text mb-1">
                Recipient Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@gmail.com or senior@director.com"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Access Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                >
                  <option value="instructor">👩‍🏫 Instructor (Can edit calendar)</option>
                  <option value="senior">👓 Senior Reviewer (Read-Only & PDF)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-notion-text mb-1">
                  Assigned Batch
                </label>
                <select
                  value={inviteBatchId}
                  onChange={(e) => setInviteBatchId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                >
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.code} - {b.name.substring(0, 14)}...</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingInvite}
              className="w-full py-2.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold border border-notion-border transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{generatingInvite ? 'Generating...' : 'Create 1-Click Invite Link'}</span>
            </button>
          </form>

          {/* Generated Link Card */}
          {generatedInvite && (
            <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200 text-xs space-y-2 animate-fade-in">
              <div className="text-blue-900 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Invite Link Ready for {generatedInvite.invite.email}!</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.inviteUrl}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-blue-200 bg-white font-mono text-stone-800"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[10px] text-blue-700">
                Send this link via WhatsApp, Slack, or Email.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Batch Co-Instructors Allocation */}
      <div className="bg-white rounded-lg border border-notion-border p-6 shadow-notion-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-notion-text">
              Assign 2 Co-Instructors per Batch
            </h3>
          </div>
          <span className="text-[10px] text-notion-muted">
            Both instructors can add topics and enter attendance counts
          </span>
        </div>

        <form onSubmit={handleSaveCoInstructors} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-notion-text mb-1">
                Select Cohort / Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-notion-sidebar focus:bg-white"
              >
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                👩‍🏫 Instructor 1 (Primary)
              </label>
              <input
                type="text"
                value={instructor1}
                onChange={(e) => setInstructor1(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-notion-text mb-1">
                👨‍🏫 Instructor 2 (Co-Trainer)
              </label>
              <input
                type="text"
                value={instructor2}
                onChange={(e) => setInstructor2(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedBatchSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Co-Instructors Saved Successfully!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={savingBatch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-stone-900 hover:bg-black text-white font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBatch ? 'Saving...' : 'Update Batch Co-Instructors'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Card 4: Current Active Users & Roles Table */}
      <div className="bg-white rounded-lg border border-notion-border shadow-notion-card overflow-hidden">
        <div className="p-4 border-b border-notion-border bg-notion-sidebar/40 flex items-center justify-between">
          <h3 className="font-semibold text-xs text-notion-text uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-stone-700" />
            <span>Active Team Members & Leadership Directory ({team.length})</span>
          </h3>
          <span className="text-[11px] text-notion-muted">
            All users with access via their email
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-notion-border text-notion-muted font-medium text-[11px]">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4">Email Address</th>
                <th className="py-2.5 px-4">Access Level</th>
                <th className="py-2.5 px-4">Designation</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-notion-border">
              {team.map((m) => {
                const isSelf = String(m._id) === String(user?._id) || m.role === 'admin';

                return (
                  <tr key={m._id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(m.name)}`}
                          alt={m.name}
                          className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200"
                        />
                        <span className="font-semibold text-notion-text">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-stone-600 text-[11px]">
                      {m.email}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`notion-pill text-[11px] font-medium ${
                          m.role === 'admin'
                            ? 'bg-[#FBF3DB] text-[#8F6B00] border border-[#F4E5B8]'
                            : m.role === 'senior'
                            ? 'bg-[#F4F0F7] text-[#6940A5] border border-[#E3DCED]'
                            : 'bg-[#E7F3F8] text-[#0B6E99] border border-[#CDE5F0]'
                        }`}
                      >
                        {m.role === 'admin' ? '👑 Super Admin' : (m.role === 'senior' ? '👓 Senior Reviewer' : '👩‍🏫 Instructor')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-stone-600">
                      {m.title || 'Curriculum Member'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleRevokeAccess(m._id, m.name)}
                          className="text-red-600 hover:text-red-800 font-medium text-[11px] hover:underline"
                          title="Revoke access for this email"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Card 5: Seed Database (Admin Only) */}
      <div className="bg-white rounded-lg border border-notion-border p-6 shadow-notion-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm text-notion-text">
              🌱 Database Seed & Reset
            </h3>
          </div>
          <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-mono">
            Super Admin Only
          </span>
        </div>
        <p className="text-xs text-notion-muted">
          Populate the database with sample batches, attendance logs, curriculum entries, and hackathons for testing.
        </p>

        {seedResult && (
          <div className={`p-2.5 rounded text-xs ${
            seedResult.includes('✅') || seedResult.includes('success')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {seedResult}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                setSeeding(true);
                setSeedResult('');
                const res = await adminApi.seed({ cleanFirst: false });
                setSeedResult('✅ ' + (res.message || 'Seed completed!'));
                if (onBatchUpdated) onBatchUpdated();
                await loadTeam();
              } catch (err) {
                setSeedResult('❌ ' + (err.message || 'Seed failed'));
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
            className="px-4 py-2 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>

          <button
            onClick={async () => {
              if (!confirm('⚠️ This will DELETE all existing data and reseed with fresh sample data. Continue?')) return;
              try {
                setSeeding(true);
                setSeedResult('');
                const res = await adminApi.seed({ cleanFirst: true });
                setSeedResult('✅ ' + (res.message || 'Database cleared and reseeded!'));
                if (onBatchUpdated) onBatchUpdated();
                await loadTeam();
              } catch (err) {
                setSeedResult('❌ ' + (err.message || 'Reset failed'));
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
            className="px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors border border-red-200 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear & Reseed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
