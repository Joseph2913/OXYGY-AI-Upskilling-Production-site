import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import type { StalledUser } from '../../../lib/analytics';
import { supabase } from '../../../lib/supabase';
import AdminCard from '../AdminCard';

interface StalledUsersListProps {
  users: StalledUser[];
  orgId: string;
  orgName: string;
  totalStalled?: number;
}

const StalledUsersList: React.FC<StalledUsersListProps> = ({ users, orgId, orgName, totalStalled }) => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  async function handleSendReminders() {
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch('/api/admin/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          users: users.map(u => ({ email: u.email, name: u.name, daysInactive: u.daysInactive, orgName })),
        }),
      });
      const data = await res.json();
      setToast(data.message || `Sent ${users.length} reminders`);
    } catch (err) {
      console.error('Send reminders error:', err);
      setToast('Failed to send reminders');
    } finally {
      setSending(false);
      setTimeout(() => setToast(''), 4000);
    }
  }

  return (
  <>
    <AdminCard padding="20px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
            Stalled Users
          </span>
          {users.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#718096',
              background: '#EDF2F7', padding: '2px 8px', borderRadius: 10,
            }}>
              {totalStalled || users.length} users inactive 14+ days
            </span>
          )}
          {users.length > 0 && (
            <button
              onClick={handleSendReminders}
              disabled={sending}
              style={{
                padding: '5px 12px', borderRadius: 20, background: '#38B2AC', color: '#FFFFFF',
                fontSize: 11, fontWeight: 600, border: 'none', cursor: sending ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? <Loader2 size={12} style={{ animation: 'app-spin 0.7s linear infinite' }} /> : <Mail size={12} />}
              Send Reminders
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 18, marginRight: 6 }}>&#10003;</span>
          <span style={{ fontSize: 13, color: '#48BB78' }}>
            No stalled users — everyone has been active in the last 14 days.
          </span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            display: 'flex', padding: '8px 0', borderBottom: '1px solid #EDF2F7',
            fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span style={{ flex: 2 }}>Name</span>
            <span style={{ flex: 1 }}>Current Level</span>
            <span style={{ flex: 1 }}>Last Active</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Days Inactive</span>
          </div>

          {/* Rows */}
          {users.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #F7FAFC', fontSize: 12,
            }}>
              <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#EDF2F7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#4A5568',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontWeight: 500, color: '#1A202C' }}>{user.name}</span>
              </span>
              <span style={{ flex: 1 }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                  fontSize: 11, fontWeight: 600, background: '#EDF2F7', color: '#4A5568',
                }}>
                  L{user.currentLevel}
                </span>
              </span>
              <span style={{ flex: 1, color: '#718096' }}>
                {user.lastActive
                  ? `${user.daysInactive}d ago`
                  : '—'}
              </span>
              <span style={{
                flex: 1, textAlign: 'right', fontWeight: 600,
                color: user.daysInactive >= 30 ? '#E53E3E' : '#ECC94B',
              }}>
                {user.daysInactive}
              </span>
            </div>
          ))}

          {(totalStalled || 0) > 10 && (
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <a
                href={`/admin/organisations/${orgId}?tab=users`}
                onClick={e => { e.preventDefault(); navigate(`/admin/organisations/${orgId}?tab=users`); }}
                style={{ fontSize: 12, fontWeight: 600, color: '#38B2AC', textDecoration: 'none' }}
              >
                View all stalled users →
              </a>
            </div>
          )}
        </>
      )}
    </AdminCard>

    {toast && (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: '#1A202C', color: '#FFFFFF', padding: '10px 20px', borderRadius: 10,
        fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {toast}
      </div>
    )}
  </>
  );
};

export default StalledUsersList;
