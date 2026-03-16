import React, { useEffect, useState } from 'react';
import { X, Search, UserPlus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { useAuth } from '../../../context/AuthContext';

interface ScannedUser {
  id: string;
  email: string;
  fullName: string;
  alreadyEnrolled: boolean;
}

interface Props {
  domain: string;
  orgId: string;
  orgName: string;
  channelId: string;
  cohortId: string | null;
  onClose: () => void;
  onEnrolled: () => void;
}

const ScanEnrollModal: React.FC<Props> = ({ domain, orgId, orgName, channelId, cohortId, onClose, onEnrolled }) => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [users, setUsers] = useState<ScannedUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    scanUsers();
  }, []);

  async function scanUsers() {
    setScanning(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); setScanning(false); return; }

      const res = await fetch('/api/admin/scan-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ domain, orgId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to scan users');
        setScanning(false);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan users. Please try again.');
    }
    setScanning(false);
  }

  function toggleUser(userId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAll() {
    const enrollable = users.filter(u => !u.alreadyEnrolled && !enrolled.has(u.id));
    if (selected.size === enrollable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(enrollable.map(u => u.id)));
    }
  }

  async function handleEnroll() {
    if (!user || selected.size === 0) return;
    setEnrolling(true);
    setEnrollError('');

    const toEnroll = Array.from(selected);
    const newEnrolled = new Set(enrolled);
    let failCount = 0;

    for (const userId of toEnroll) {
      try {
        const { error: memErr } = await supabase
          .from('user_org_memberships')
          .insert({
            user_id: userId,
            org_id: orgId,
            role: 'learner',
            cohort_id: cohortId,
            enrolled_via: channelId,
            active: true,
          });

        if (memErr) {
          console.error('Enroll error for', userId, memErr);
          failCount++;
          continue;
        }

        newEnrolled.add(userId);

        // Increment channel uses_count (best effort)
        await supabase
          .from('enrollment_channels')
          .update({ uses_count: newEnrolled.size + 1 })
          .eq('id', channelId);

        await writeAuditLog({
          actorId: user.id,
          action: 'user.domain_enroll',
          targetType: 'user',
          targetId: userId as string,
          orgId,
          metadata: { domain, channelId },
        });
      } catch (err) {
        console.error('Enroll error for', userId, err);
        failCount++;
      }
    }

    setEnrolled(newEnrolled);
    setSelected(new Set());
    setEnrolling(false);

    if (failCount > 0) {
      setEnrollError(`${failCount} user(s) failed to enroll. They may already have memberships.`);
    }

    if (newEnrolled.size > 0) {
      onEnrolled();
    }
  }

  const enrollable = users.filter(u => !u.alreadyEnrolled && !enrolled.has(u.id));
  const alreadyCount = users.filter(u => u.alreadyEnrolled).length;
  const justEnrolledCount = enrolled.size;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF', borderRadius: 16, width: 560, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', margin: 0 }}>
              Scan & Enroll by Domain
            </h2>
            <p style={{ fontSize: 13, color: '#718096', margin: '4px 0 0' }}>
              Users with <strong>@{domain}</strong> emails → {orgName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {scanning ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={28} color="#38B2AC" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#718096', marginTop: 12 }}>
                Scanning for @{domain} users…
              </p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <AlertCircle size={28} color="#E53E3E" />
              <p style={{ fontSize: 13, color: '#E53E3E', marginTop: 8 }}>{error}</p>
              <button
                onClick={scanUsers}
                style={{
                  marginTop: 12, padding: '8px 16px', borderRadius: 24,
                  border: 'none', background: '#38B2AC', color: '#FFFFFF',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Search size={28} color="#A0AEC0" />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2D3748', marginTop: 12 }}>
                No users found
              </p>
              <p style={{ fontSize: 13, color: '#A0AEC0', marginTop: 4 }}>
                No accounts with @{domain} emails have signed up yet.
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div style={{
                display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: '#718096',
              }}>
                <span>{users.length} user{users.length !== 1 ? 's' : ''} found</span>
                {alreadyCount > 0 && <span style={{ color: '#38B2AC' }}>{alreadyCount} already enrolled</span>}
                {justEnrolledCount > 0 && <span style={{ color: '#38A169' }}>{justEnrolledCount} just enrolled</span>}
              </div>

              {/* Select all */}
              {enrollable.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  padding: '8px 0', borderBottom: '1px solid #F7FAFC',
                }}>
                  <input
                    type="checkbox"
                    checked={selected.size === enrollable.length && enrollable.length > 0}
                    onChange={toggleAll}
                    style={{ accentColor: '#38B2AC' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>
                    Select all ({enrollable.length} enrollable)
                  </span>
                </div>
              )}

              {/* User list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {users.map(u => {
                  const isEnrolled = u.alreadyEnrolled || enrolled.has(u.id);
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 8px', borderRadius: 8,
                        background: isEnrolled ? '#F0FFF4' : selected.has(u.id) ? '#F7FAFC' : 'transparent',
                        opacity: isEnrolled ? 0.7 : 1,
                      }}
                    >
                      {isEnrolled ? (
                        <Check size={16} color="#38A169" style={{ flexShrink: 0 }} />
                      ) : (
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleUser(u.id)}
                          style={{ accentColor: '#38B2AC', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2D3748' }}>
                          {u.fullName || 'No name'}
                        </div>
                        <div style={{ fontSize: 12, color: '#A0AEC0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {u.email}
                        </div>
                      </div>
                      {isEnrolled && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#38A169',
                          background: '#C6F6D5', padding: '2px 8px', borderRadius: 12,
                          flexShrink: 0,
                        }}>
                          {enrolled.has(u.id) ? 'Just enrolled' : 'Already enrolled'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {enrollError && (
                <p style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>{enrollError}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 24,
              border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#4A5568',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {enrolled.size > 0 ? 'Done' : 'Cancel'}
          </button>
          {enrollable.length > 0 && (
            <button
              onClick={handleEnroll}
              disabled={selected.size === 0 || enrolling}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 24,
                border: 'none',
                background: selected.size === 0 || enrolling ? '#CBD5E0' : '#38B2AC',
                color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                cursor: selected.size === 0 || enrolling ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {enrolling ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Enrolling…
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Enroll {selected.size > 0 ? `(${selected.size})` : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanEnrollModal;
