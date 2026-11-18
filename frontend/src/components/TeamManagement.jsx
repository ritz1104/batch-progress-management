import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Copy, 
  Check, 
  Clock, 
  Link as LinkIcon, 
  Eye, 
  Shield, 
  BookOpen,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

export default function TeamManagement({ batches = [] }) {
  const { user, isAdmin, canEdit } = useAuth();
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('instructor');
  const [inviteBatch, setInviteBatch] = useState('all');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTeamData() {
      setLoading(true);
      try {
        const teamList = await authApi.getTeam();
        setTeam(teamList);
        const invitesList = await authApi.getInvites();
        setInvites(invitesList);
      } catch (err) {
        console.error('Failed to load team data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, []);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await authApi.createInvite({
        email: inviteEmail,
        role: inviteRole,
        batchId: inviteBatch
      });
      setGeneratedInvite(res);
      // Refresh invites list
      const updatedInvites = await authApi.getInvites();
      setInvites(updatedInvites);
    } catch (err) {
      alert('Failed to generate invite: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-notion-border shadow-notion-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-notion-text flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-700" />
              <span>Team & Access Management</span>
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              {team.length} Members
            </span>
          </div>
          <p className="text-xs text-notion-muted mt-0.5">
            Grant permission to instructors and teammates to log progress, and invite seniors for executive oversight and PDF audits.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setGeneratedInvite(null);
              setShowInviteModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Teammate / Senior</span>
          </button>
        )}
      </div>

      {/* Role Permission Breakdown Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-lg bg-stone-50 border border-notion-border space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-stone-800">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Administrator (Lead)</span>
          </div>
          <p className="text-[11px] text-notion-muted leading-relaxed">
            Full access to create/archive batches, add students, configure database and issue invitations.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-stone-50 border border-notion-border space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-stone-800">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Instructor / Teammate</span>
          </div>
          <p className="text-[11px] text-notion-muted leading-relaxed">
            Logs daily curriculum progress, marks student attendance registers, schedules hackathons, and awards badges.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-stone-50 border border-notion-border space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-stone-800">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Senior / Reviewer</span>
          </div>
          <p className="text-[11px] text-notion-muted leading-relaxed">
            Executive oversight access. Evaluates student attendance rates, curriculum velocity, and downloads monthly PDF reports.
          </p>
        </div>
      </div>

      {/* Team Members Notion-Style Table */}
      <div className="bg-white rounded-lg border border-notion-border shadow-notion-card overflow-hidden">
        <div className="p-3 border-b border-notion-border bg-notion-sidebar/40 font-semibold text-xs text-notion-text">
          Active Team & Leadership Roster
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-notion-border text-notion-muted font-medium text-[11px]">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Designation</th>
                <th className="py-2.5 px-4">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-notion-border">
              {team.map((m) => (
                <tr key={m._id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200"
                      />
                      <div>
                        <div className="font-medium text-notion-text">{m.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-stone-500 text-[11px]">
                    {m.email}
                  </td>
                  <td className="py-2.5 px-4 text-stone-700">
                    {m.title || 'Curriculum Member'}
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
                      {m.role === 'admin' ? '👑 Admin / Lead' : (m.role === 'senior' ? '👓 Senior Leadership' : '👨‍🏫 Instructor')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites List */}
      {invites.length > 0 && (
        <div className="bg-white rounded-lg border border-notion-border p-4 shadow-notion-card space-y-3">
          <h3 className="text-xs font-semibold text-notion-text flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
            <span>Generated Invite Codes & Links</span>
          </h3>
          <div className="divide-y divide-notion-border border border-notion-border rounded-md text-xs">
            {invites.map((inv) => (
              <div key={inv._id} className="p-2.5 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {inv.code}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Role: <span className="font-medium capitalize text-stone-800">{inv.role}</span>
                  </span>
                  {inv.email && (
                    <span className="text-[11px] text-stone-400">
                      ({inv.email})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Invite Teammate / Senior */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-notion-modal border border-notion-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-notion-border">
              <h3 className="font-semibold text-sm text-notion-text flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-stone-700" />
                <span>Invite Teammate or Senior</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-notion-hover rounded text-notion-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!generatedInvite ? (
              <form onSubmit={handleCreateInvite} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-notion-text mb-1">
                    Assign Access Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                  >
                    <option value="instructor">👨‍🏫 Instructor / Teammate (Log curriculum & mark attendance)</option>
                    <option value="senior">👓 Senior Reviewer (Executive analytics & PDF reports)</option>
                    <option value="admin">👑 Administrator (Full control)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-notion-text mb-1">
                    Recipient Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com or senior@director.com"
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border"
                  />
                </div>

                <div>
                  <label className="block font-medium text-notion-text mb-1">
                    Batch Access Scope
                  </label>
                  <select
                    value={inviteBatch}
                    onChange={(e) => setInviteBatch(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-white"
                  >
                    <option value="all">All Batches (Recommended for Seniors)</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-notion-border">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 rounded border border-notion-border text-notion-muted hover:bg-notion-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded bg-stone-900 text-white font-medium hover:bg-black transition-colors"
                  >
                    {submitting ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            ) : (
              /* Success View with Copyable Link */
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Invitation Link Created!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Send this link to your {generatedInvite.invite.role}. They can join instantly with their assigned permissions.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Shareable Invite URL</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={generatedInvite.inviteUrl}
                      className="w-full text-xs px-3 py-2 rounded-md border border-notion-border bg-stone-50 font-mono text-stone-800"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-md bg-stone-900 text-white font-medium hover:bg-black transition-colors flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
