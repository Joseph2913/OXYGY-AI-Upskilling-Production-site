import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, X, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  updateOrgName,
  createInvite,
  getOrgInvites,
  deleteInvite,
  updateMemberRole,
  removeMember,
  createWorkshopSession,
  getOrgWorkshopSessions,
  deactivateWorkshopSession,
} from '../../lib/database';

const AppAdmin: React.FC = () => {
  const { user, isOxygyAdmin } = useAuth();
  const navigate = useNavigate();
  const { orgId, orgName, orgTier, isAdmin, members, refreshOrg, loading: orgLoading } = useOrg();

  // Org settings
  const [editName, setEditName] = useState(orgName || '');
  const [nameSaving, setNameSaving] = useState(false);

  // Invites
  const [invites, setInvites] = useState<Array<{ id: string; email: string | null; code: string; role: string; acceptedBy: string | null; createdAt: Date }>>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('learner');
  const [generatedLink, setGeneratedLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Workshop sessions
  const [sessions, setSessions] = useState<Array<{ id: string; level: number; code: string; name: string; date: string | null; active: boolean }>>([]);
  const [sessionLevel, setSessionLevel] = useState(1);
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId?: string; label: string } | null>(null);

  useEffect(() => { setEditName(orgName || ''); }, [orgName]);

  useEffect(() => {
    if (!orgId) return;
    getOrgInvites(orgId).then(setInvites);
    getOrgWorkshopSessions(orgId).then(setSessions);
  }, [orgId]);

  // Redirect non-admins (org-level admin OR platform super_admin both get access)
  if (!orgLoading && !isAdmin && !isOxygyAdmin) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 8px' }}>Access Denied</h1>
        <p style={{ fontSize: 14, color: '#718096' }}>You need admin privileges to access this page.</p>
        <button
          onClick={() => navigate('/app/dashboard')}
          style={{ marginTop: 16, background: '#38B2AC', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (orgLoading || !orgId) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC', borderRadius: '50%', animation: 'admin-spin 0.7s linear infinite' }} />
        <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!editName.trim() || !orgId) return;
    setNameSaving(true);
    await updateOrgName(orgId, editName.trim());
    refreshOrg();
    setNameSaving(false);
  };

  const handleGenerateLink = async () => {
    if (!orgId || !user) return;
    setInviteLoading(true);
    const result = await createInvite(orgId, user.id);
    if (result) {
      setGeneratedLink(`${window.location.origin}/join/${result.code}`);
      getOrgInvites(orgId).then(setInvites);
    }
    setInviteLoading(false);
  };

  const handleSendInvite = async () => {
    if (!orgId || !user || !inviteEmail.trim()) return;
    setInviteLoading(true);
    await createInvite(orgId, user.id, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    getOrgInvites(orgId).then(setInvites);
    setInviteLoading(false);
  };

  const handleDeleteInvite = async (id: string) => {
    await deleteInvite(id);
    if (orgId) getOrgInvites(orgId).then(setInvites);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!orgId) return;
    await updateMemberRole(orgId, userId, newRole);
    refreshOrg();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!orgId) return;
    await removeMember(orgId, userId);
    refreshOrg();
    setConfirmAction(null);
  };

  const handleCreateSession = async () => {
    if (!orgId || !user || !sessionName.trim() || !sessionCode.trim()) return;
    await createWorkshopSession(orgId, user.id, sessionLevel, sessionName.trim(), sessionCode.trim());
    setSessionName('');
    setSessionCode('');
    getOrgWorkshopSessions(orgId).then(setSessions);
  };

  const handleDeactivateSession = async (id: string) => {
    await deactivateWorkshopSession(id);
    if (orgId) getOrgWorkshopSessions(orgId).then(setSessions);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const pendingInvites = invites.filter(i => !i.acceptedBy);
  const activeSessions = sessions.filter(s => s.active);

  const timeAgoShort = (d: Date) => {
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif", maxWidth: 800 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 6px' }}>Organisation Admin</h1>
      <p style={{ fontSize: 14, color: '#718096', margin: '0 0 28px' }}>Manage your organisation's AI upskilling cohort</p>

      {/* Org Settings */}
      <Section title="Organisation Settings">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <Label>Organisation name</Label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button onClick={handleSaveName} disabled={nameSaving} style={btnPrimaryStyle}>
            {nameSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#718096' }}>
          Tier: <span style={{ fontWeight: 600, color: '#38B2AC', textTransform: 'capitalize' }}>{orgTier || 'N/A'}</span> (read-only)
        </div>
      </Section>

      {/* Invite Members */}
      <Section title="Invite Members">
        <div style={{ marginBottom: 16 }}>
          <Label>Share invite link</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            {generatedLink ? (
              <>
                <input type="text" readOnly value={generatedLink} style={{ ...inputStyle, flex: 1, background: '#F7FAFC', color: '#4A5568' }} />
                <button onClick={() => copyToClipboard(generatedLink)} style={btnSecondaryStyle}>
                  <Copy size={14} /> Copy
                </button>
              </>
            ) : (
              <button onClick={handleGenerateLink} disabled={inviteLoading} style={btnPrimaryStyle}>
                {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: 16, marginBottom: 16 }}>
          <Label>Invite by email</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@company.com"
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ ...inputStyle, width: 120 }}>
              <option value="learner">Learner</option>
              <option value="facilitator">Facilitator</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleSendInvite} disabled={!inviteEmail.trim() || inviteLoading} style={btnPrimaryStyle}>
              Send Invite
            </button>
          </div>
        </div>

        {pendingInvites.length > 0 && (
          <div>
            <Label>Pending invites</Label>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #EDF2F7' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#1A202C' }}>
                  {inv.email || <span style={{ color: '#A0AEC0' }}>Open link</span>}
                  {' '}&mdash;{' '}
                  <span style={{ textTransform: 'capitalize', color: '#718096' }}>{inv.role}</span>
                  {' '}&mdash;{' '}
                  <span style={{ color: '#A0AEC0' }}>Sent {timeAgoShort(inv.createdAt)}</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', background: '#F7FAFC', padding: '2px 8px', borderRadius: 6 }}>{inv.code}</span>
                <button onClick={() => handleDeleteInvite(inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Members */}
      <Section title="Members">
        <div style={{ borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 60px 80px 40px', gap: 8, padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Name</span>
            <span>Role</span>
            <span>Level</span>
            <span>Joined</span>
            <span></span>
          </div>
          {/* Rows */}
          {members.map(m => (
            <div key={m.userId} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 60px 80px 40px', gap: 8, padding: '10px 12px', borderBottom: '1px solid #EDF2F7', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                {m.fullName}
                {m.userId === user?.id && <span style={{ fontSize: 10, color: '#38B2AC', marginLeft: 6 }}>(You)</span>}
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                  disabled={m.userId === user?.id}
                  style={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', background: '#FFFFFF', color: '#4A5568', fontFamily: "'DM Sans', sans-serif", cursor: m.userId === user?.id ? 'not-allowed' : 'pointer', width: '100%' }}
                >
                  <option value="learner">Learner</option>
                  <option value="facilitator">Facilitator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <span style={{ fontSize: 12, color: '#4A5568' }}>L{m.currentLevel}</span>
              <span style={{ fontSize: 12, color: '#718096' }}>
                {m.enrolledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              <div>
                {m.userId !== user?.id && (
                  <button
                    onClick={() => setConfirmAction({ type: 'remove', userId: m.userId, label: m.fullName })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', fontSize: 12, padding: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#E53E3E')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#A0AEC0')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Workshop Sessions */}
      <Section title="Workshop Sessions">
        {activeSessions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Label>Active sessions</Label>
            {activeSessions.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #EDF2F7' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#1A202C' }}>
                  L{s.level} &mdash; {s.name}
                  {' '}&mdash;{' '}
                  <span style={{ fontWeight: 600, color: '#38B2AC' }}>{s.code}</span>
                  {s.date && <span style={{ color: '#A0AEC0' }}> &mdash; {s.date}</span>}
                </span>
                <button
                  onClick={() => handleDeactivateSession(s.id)}
                  style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#718096', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        )}

        <Label>Create new session</Label>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={sessionLevel} onChange={(e) => setSessionLevel(Number(e.target.value))} style={{ ...inputStyle, width: 80 }}>
            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>L{l}</option>)}
          </select>
          <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Session name" style={{ ...inputStyle, flex: 1 }} />
          <input type="text" value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} placeholder="Code" style={{ ...inputStyle, width: 120 }} />
          <button onClick={handleCreateSession} disabled={!sessionName.trim() || !sessionCode.trim()} style={btnPrimaryStyle}>
            Create
          </button>
        </div>
      </Section>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '28px 32px', maxWidth: 400, width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>Remove member?</div>
            <div style={{ fontSize: 14, color: '#718096', marginBottom: 20 }}>
              Are you sure you want to remove <strong>{confirmAction.label}</strong> from the organisation? They will lose access to the cohort and leaderboard.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={btnSecondaryStyle}>Cancel</button>
              <button
                onClick={() => confirmAction.userId && handleRemoveMember(confirmAction.userId)}
                style={{ ...btnPrimaryStyle, background: '#E53E3E' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared UI ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  color: '#1A202C',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimaryStyle: React.CSSProperties = {
  background: '#38B2AC',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  background: '#FFFFFF',
  color: '#4A5568',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export default AppAdmin;
