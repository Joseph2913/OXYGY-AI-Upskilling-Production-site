import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { OrgMemberRole } from '../../../types';

interface InviteUserModalProps {
  preSelectedOrgId?: string;
  onClose: () => void;
  onInvited: () => void;
}

interface OrgOption { id: string; name: string; }
interface CohortOption { id: string; name: string; }

const InviteUserModal: React.FC<InviteUserModalProps> = ({ preSelectedOrgId, onClose, onInvited }) => {
  const { user: authUser } = useAuth();
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState(preSelectedOrgId || '');
  const [cohortId, setCohortId] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('learner');
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Load orgs
  useEffect(() => {
    supabase.from('organisations').select('id, name').eq('active', true).order('name')
      .then(({ data }) => {
        if (data) setOrgs(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: r.name as string })));
      });
  }, []);

  // Load cohorts when org changes
  useEffect(() => {
    if (!orgId) { setCohorts([]); return; }
    supabase.from('cohorts').select('id, name').eq('org_id', orgId).eq('active', true).order('name')
      .then(({ data }) => {
        if (data) setCohorts(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: r.name as string })));
        else setCohorts([]);
      });
    setCohortId('');
  }, [orgId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !orgId) { setError('Email and organisation are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ email, orgId, cohortId: cohortId || undefined, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to invite user.');
        setSubmitting(false);
        return;
      }
      setToast(json.invited ? `Invite sent to ${email}` : 'User enrolled');
      setTimeout(() => {
        onInvited();
        onClose();
      }, 1200);
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
    fontSize: 13, color: '#2D3748', fontFamily: "'DM Sans', sans-serif", outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26, 32, 44, 0.4)' }} />
      <div style={{
        position: 'relative', background: '#FFFFFF', borderRadius: 14,
        width: 480, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', margin: 0 }}>Invite User</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#A0AEC0" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address <span style={{ color: '#E53E3E' }}>*</span></label>
            <input
              type="email" placeholder="user@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Organisation */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Organisation <span style={{ color: '#E53E3E' }}>*</span></label>
            <select
              value={orgId} onChange={e => setOrgId(e.target.value)}
              disabled={!!preSelectedOrgId}
              style={{ ...inputStyle, cursor: preSelectedOrgId ? 'not-allowed' : 'pointer' }}
            >
              <option value="">Select organisation</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* Cohort */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Cohort (optional)</label>
            <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={inputStyle}>
              <option value="">No cohort</option>
              {cohorts.length === 0 && <option disabled>No cohorts available</option>}
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Organisation Role</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['learner', 'facilitator', 'admin'] as OrgMemberRole[]).map(r => (
                <label
                  key={r}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    padding: '8px 14px', borderRadius: 8,
                    border: `1px solid ${role === r ? '#38B2AC' : '#E2E8F0'}`,
                    background: role === r ? '#E6FFFA' : '#FFFFFF',
                    fontSize: 13, fontWeight: 600, color: role === r ? '#1A6B5F' : '#4A5568',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio" name="role" value={r}
                    checked={role === r} onChange={() => setRole(r)}
                    style={{ display: 'none' }}
                  />
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 12 }}>{error}</div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 4,
          }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#4A5568',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: '#38B2AC', fontSize: 13, fontWeight: 600, color: '#FFFFFF',
                cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)',
            background: '#1A202C', color: '#FFFFFF', padding: '10px 20px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteUserModal;
