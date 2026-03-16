import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Hash, Globe, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { generateAccessCode, generateSlug } from '../../../lib/enrollment';
import { useAuth } from '../../../context/AuthContext';
import type { ChannelType } from '../../../types';

interface Props {
  orgId: string;
  orgName: string;
  cohorts: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

const TYPE_OPTIONS: { type: ChannelType; icon: React.FC<{ size?: number; color?: string }>; label: string; desc: string }[] = [
  { type: 'link', icon: LinkIcon, label: 'Invite Link', desc: 'Generate a shareable URL' },
  { type: 'code', icon: Hash, label: 'Access Code', desc: 'Create a code users enter after login' },
  { type: 'domain', icon: Globe, label: 'Email Domain', desc: 'Auto-enroll users by email domain' },
];

const CreateChannelModal: React.FC<Props> = ({ orgId, orgName, cohorts, onClose, onCreated }) => {
  const { user } = useAuth();
  const [channelType, setChannelType] = useState<ChannelType>('link');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ type: ChannelType; value: string } | null>(null);

  // Auto-generate value on type change
  useEffect(() => {
    if (channelType === 'link') setValue(generateSlug(orgName));
    else if (channelType === 'code') setValue(generateAccessCode());
    else setValue('');
  }, [channelType, orgName]);

  function validateValue(): string | null {
    const v = value.trim();
    if (!v) return 'This field is required';
    if (channelType === 'link') {
      if (!/^[a-z0-9-]+$/.test(v)) return 'Only lowercase letters, numbers, and hyphens';
      if (v.length < 3 || v.length > 60) return 'Must be 3-60 characters';
    }
    if (channelType === 'code') {
      if (!/^[A-Z0-9-]+$/i.test(v)) return 'Only letters, numbers, and hyphens';
      if (v.length < 4 || v.length > 12) return 'Must be 4-12 characters';
    }
    if (channelType === 'domain') {
      if (!v.includes('.') || v.includes('@') || v.includes(' ')) return 'Enter a valid domain (e.g., acme.com)';
    }
    return null;
  }

  async function handleSubmit() {
    const valError = validateValue();
    if (valError) { setError(valError); return; }
    if (!user) return;

    setSubmitting(true);
    setError('');

    const finalValue = channelType === 'code' ? value.trim().toUpperCase() : value.trim().toLowerCase();

    // Check uniqueness
    const { data: existing } = await supabase
      .from('enrollment_channels')
      .select('id')
      .eq('value', finalValue)
      .eq('type', channelType)
      .maybeSingle();

    if (existing) {
      setError(`This ${channelType === 'link' ? 'slug' : channelType === 'code' ? 'code' : 'domain'} is already in use`);
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase
      .from('enrollment_channels')
      .insert({
        org_id: orgId,
        cohort_id: cohortId || null,
        type: channelType,
        value: finalValue,
        label: label.trim() || null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt || null,
        active: true,
        created_by: user.id,
      });

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    await writeAuditLog({
      actorId: user.id,
      action: 'channel.create',
      targetType: 'enrollment_channel',
      orgId,
      metadata: { type: channelType, value: finalValue, org_name: orgName },
    });

    if (channelType === 'link') {
      setCreated({ type: 'link', value: finalValue });
    } else {
      onCreated();
      onClose();
    }
    setSubmitting(false);
  }

  // Link created confirmation
  if (created) {
    const fullUrl = `${window.location.origin}/join/${created.value}`;
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={e => { if (e.target === e.currentTarget) { onCreated(); onClose(); } }}
      >
        <div style={{
          background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 520,
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Link Created</span>
            <button onClick={() => { onCreated(); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: 24, textAlign: 'center' as const }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>&#10003;</div>
            <div style={{ fontSize: 14, color: '#718096', marginBottom: 16 }}>
              Share this URL with users to join <strong>{orgName}</strong>:
            </div>
            <div style={{
              background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
              padding: '14px 16px', fontFamily: 'monospace', fontSize: 13,
              wordBreak: 'break-all' as const, marginBottom: 16,
            }}>
              {fullUrl}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(fullUrl); }}
              style={{
                padding: '12px 28px', borderRadius: 24, border: 'none',
                background: '#38B2AC', color: '#FFFFFF', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 520,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>New Enrollment Channel</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' as const }}>
          {/* Type Selector */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 8 }}>Channel Type</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = channelType === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => setChannelType(opt.type)}
                  style={{
                    flex: 1, padding: 14, borderRadius: 10, cursor: 'pointer',
                    textAlign: 'center' as const, border: selected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                    background: selected ? '#E6FFFA' : '#FFFFFF',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <Icon size={20} color={selected ? '#38B2AC' : '#A0AEC0'} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', marginTop: 6 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Type-specific fields */}
          {channelType === 'link' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
                URL Slug <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <input
                value={value}
                onChange={e => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setError(''); }}
                style={{
                  width: '100%', padding: '10px 14px', border: `1px solid ${error ? '#E53E3E' : '#E2E8F0'}`,
                  borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                Preview: {window.location.origin}/join/<strong>{value || '...'}</strong>
              </div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4, lineHeight: 1.5 }}>
                Anyone with this URL can sign up and join the organisation. Lowercase letters, numbers, and hyphens only.
              </div>
            </div>
          )}

          {channelType === 'code' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
                Access Code <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={value}
                  onChange={e => { setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setError(''); }}
                  style={{
                    flex: 1, padding: '10px 14px', border: `1px solid ${error ? '#E53E3E' : '#E2E8F0'}`,
                    borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
                    fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' as const, outline: 'none',
                  }}
                />
                <button
                  onClick={() => setValue(generateAccessCode())}
                  title="Generate new code"
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0',
                    background: '#F7FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600, color: '#718096',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <RefreshCw size={14} /> Generate
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4, lineHeight: 1.5 }}>
                Share this code with users. After signing in, they'll be prompted to enter it on the join page. 4-12 characters, letters and numbers only.
              </div>
            </div>
          )}

          {channelType === 'domain' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
                Email Domain <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <input
                value={value}
                onChange={e => { setValue(e.target.value.toLowerCase().replace(/\s/g, '')); setError(''); }}
                placeholder="acme.com"
                style={{
                  width: '100%', padding: '10px 14px', border: `1px solid ${error ? '#E53E3E' : '#E2E8F0'}`,
                  borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4, lineHeight: 1.5 }}>
                Enter the bare domain (e.g. <strong>acme.com</strong>), without the @ symbol or https://. Any user who signs in with an email ending in @{value || 'domain.com'} will be automatically enrolled into this organisation. This only applies to future logins — use "Scan & Enroll" on existing domain channels to retroactively add users who already have accounts.
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 12 }}>{error}</div>
          )}

          {/* Label */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Label <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g., Q1 2026 London Workshop"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
              A human-readable name for this channel. Visible only to admins.
            </div>
          </div>

          {/* Cohort */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Assign to Cohort <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 400 }}>(optional)</span>
            </label>
            {cohorts.length > 0 ? (
              <select
                value={cohortId}
                onChange={e => setCohortId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                  borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                  fontFamily: "'DM Sans', sans-serif", background: '#FFFFFF',
                }}
              >
                <option value="">No cohort</option>
                {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>
                No cohorts available — create one below
              </div>
            )}
          </div>

          {/* Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, fontWeight: 600, color: '#718096',
              fontFamily: "'DM Sans', sans-serif", marginBottom: showAdvanced ? 16 : 0,
            }}
          >
            Advanced options {showAdvanced ? '\u25B4' : '\u25BE'}
          </button>

          {showAdvanced && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
                  Max Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                    borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
                  Expires
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0',
                    borderRadius: 10, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'flex-end', gap: 12,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 24, border: '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#4A5568', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !value.trim()}
            style={{
              padding: '9px 18px', borderRadius: 24, border: 'none',
              background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
              opacity: submitting || !value.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;
