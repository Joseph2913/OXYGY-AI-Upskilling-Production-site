import React, { useState } from 'react';
import { Calendar, Copy, Power, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { generateAccessCode } from '../../../lib/enrollment';
import { useAuth } from '../../../context/AuthContext';
import AdminSectionLabel from '../AdminSectionLabel';
import AdminEmptyState from '../AdminEmptyState';
import ConfirmDialog from '../ConfirmDialog';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Fundamentals & Awareness',
  2: 'Applied Capability',
  3: 'Systemic Integration',
  4: 'Interactive Dashboards',
  5: 'Full AI Applications',
};

export interface WorkshopRow {
  id: string;
  session_name: string;
  level: number;
  code: string;
  session_date: string | null;
  active: boolean;
}

interface Props {
  workshops: WorkshopRow[];
  orgId: string;
  levelAccess: number[];
  onRefresh: () => void;
}

const WorkshopTable: React.FC<Props> = ({ workshops, orgId, levelAccess, onRefresh }) => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState('');
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setToast('Code copied!');
    setTimeout(() => setToast(''), 2000);
  }

  function formatDate(d: string | null) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleDeactivate(ws: WorkshopRow) {
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('workshop_sessions')
      .update({ active: !ws.active })
      .eq('id', ws.id);
    if (!error) {
      await writeAuditLog({
        actorId: user.id,
        action: ws.active ? 'workshop.deactivate' : 'workshop.reactivate',
        targetType: 'workshop_session',
        targetId: ws.id,
        orgId,
        metadata: { session_name: ws.session_name },
      });
      onRefresh();
    }
    setActionLoading(false);
    setDeactivating(null);
  }

  const COLS = [
    { label: 'Session Name', width: '28%' },
    { label: 'Level', width: '12%' },
    { label: 'Code', width: '18%' },
    { label: 'Date', width: '18%' },
    { label: 'Status', width: '12%' },
    { label: 'Actions', width: '12%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AdminSectionLabel text="Workshop Sessions" />
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '9px 18px', borderRadius: 24, border: 'none',
            background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + New Session
        </button>
      </div>

      {workshops.length === 0 ? (
        <AdminEmptyState
          icon={<Calendar size={20} color="#A0AEC0" />}
          title="No workshop sessions yet"
          description="Create workshop sessions with attendance codes for live events."
          action={{ label: 'New Session', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', padding: '10px 16px',
            borderBottom: '1px solid #E2E8F0', background: '#F7FAFC',
          }}>
            {COLS.map(c => (
              <div key={c.label} style={{
                width: c.width, fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                textTransform: 'uppercase' as const, letterSpacing: '0.04em',
              }}>
                {c.label}
              </div>
            ))}
          </div>

          {workshops.map(ws => (
            <div
              key={ws.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: '1px solid #F7FAFC', fontSize: 13,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <div style={{ width: '28%', fontWeight: 500, color: '#2D3748' }}>{ws.session_name}</div>
              <div style={{ width: '12%', fontSize: 12, color: '#718096' }}>
                Level {ws.level}
              </div>
              <div style={{ width: '18%', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", background: '#F7FAFC',
                  padding: '2px 8px', borderRadius: 4, fontSize: 12, letterSpacing: '0.05em',
                }}>
                  {ws.code}
                </span>
                <button
                  onClick={() => copyCode(ws.code)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#A0AEC0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ width: '18%', fontSize: 12, color: '#718096' }}>{formatDate(ws.session_date)}</div>
              <div style={{ width: '12%' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                  background: ws.active ? '#C6F6D5' : '#FED7D7',
                  color: ws.active ? '#22543D' : '#9B2C2C',
                }}>
                  {ws.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ width: '12%' }}>
                <button
                  onClick={() => setDeactivating(ws.id)}
                  title={ws.active ? 'Deactivate' : 'Reactivate'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ws.active ? '#E53E3E' : '#48BB78'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                >
                  <Power size={14} />
                </button>
              </div>

              {deactivating === ws.id && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
                  zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ConfirmDialog
                    title={ws.active ? 'Deactivate Session' : 'Reactivate Session'}
                    message={ws.active
                      ? `Deactivate "${ws.session_name}"? The attendance code will no longer work.`
                      : `Reactivate "${ws.session_name}"?`}
                    confirmLabel={ws.active ? 'Deactivate' : 'Reactivate'}
                    confirmVariant={ws.active ? 'danger' : 'success'}
                    onConfirm={() => handleDeactivate(ws)}
                    onCancel={() => setDeactivating(null)}
                    isLoading={actionLoading}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Workshop Modal */}
      {showCreate && (
        <CreateWorkshopModal
          orgId={orgId}
          levelAccess={levelAccess}
          onClose={() => setShowCreate(false)}
          onCreated={onRefresh}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', padding: '10px 20px',
          borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 100,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

// ── Create Workshop Modal ──

function CreateWorkshopModal({ orgId, levelAccess, onClose, onCreated }: {
  orgId: string; levelAccess: number[]; onClose: () => void; onCreated: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [level, setLevel] = useState(levelAccess[0]?.toString() || '1');
  const [code, setCode] = useState(generateAccessCode());
  const [sessionDate, setSessionDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError('Session name is required'); return; }
    if (!code.trim()) { setError('Session code is required'); return; }
    if (!user) return;

    setSubmitting(true);
    setError('');

    const finalCode = code.trim().toUpperCase();

    // Check uniqueness
    const { data: existing } = await supabase
      .from('workshop_sessions')
      .select('id')
      .eq('code', finalCode)
      .maybeSingle();

    if (existing) { setError('This code is already in use'); setSubmitting(false); return; }

    const { error: insertErr } = await supabase
      .from('workshop_sessions')
      .insert({
        org_id: orgId,
        level: parseInt(level),
        code: finalCode,
        session_name: name.trim(),
        session_date: sessionDate || null,
        created_by: user.id,
        active: true,
      });

    if (insertErr) { setError(insertErr.message); setSubmitting(false); return; }

    await writeAuditLog({
      actorId: user.id,
      action: 'workshop.create',
      targetType: 'workshop_session',
      orgId,
      metadata: { session_name: name.trim(), level: parseInt(level), code: finalCode },
    });

    setSubmitting(false);
    onCreated();
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
    borderRadius: 10, fontSize: 13, boxSizing: 'border-box', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>New Workshop Session</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Session Name <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g., London Cohort — Level 1 Workshop" style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Level <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <select value={level} onChange={e => setLevel(e.target.value)} style={{ ...inputStyle, background: '#FFFFFF' }}>
              {levelAccess.map(n => (
                <option key={n} value={n}>Level {n} — {LEVEL_NAMES[n]}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Session Code <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setError(''); }}
                style={{
                  ...inputStyle, flex: 1, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700, letterSpacing: '0.05em',
                }}
              />
              <button
                onClick={() => setCode(generateAccessCode())}
                style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0',
                  background: '#F7FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: '#718096', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <RefreshCw size={14} /> Generate
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Session Date <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={inputStyle} />
          </div>

          {error && <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 12 }}>{error}</div>}
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'flex-end', gap: 12,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 24, border: '1px solid #E2E8F0',
            background: '#FFFFFF', color: '#4A5568', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !code.trim()}
            style={{
              padding: '9px 18px', borderRadius: 24, border: 'none',
              background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
              opacity: submitting || !name.trim() || !code.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkshopTable;
