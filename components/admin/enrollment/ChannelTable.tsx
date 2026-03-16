import React, { useState } from 'react';
import { Copy, Power, Link as LinkIcon, Hash, Globe, UserPlus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { getChannelStatus } from '../../../lib/enrollment';
import { useAuth } from '../../../context/AuthContext';
import type { EnrollmentChannel } from '../../../types';
import AdminSectionLabel from '../AdminSectionLabel';
import AdminEmptyState from '../AdminEmptyState';
import ConfirmDialog from '../ConfirmDialog';
import ScanEnrollModal from './ScanEnrollModal';

const CHANNEL_TYPE_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.FC<{ size?: number; color?: string }> }> = {
  link: { bg: '#EBF4FF', text: '#2B6CB0', label: 'Link', icon: LinkIcon },
  code: { bg: '#FAF5FF', text: '#6B46C1', label: 'Code', icon: Hash },
  domain: { bg: '#FFFBEB', text: '#975A16', label: 'Domain', icon: Globe },
};

interface Props {
  channels: EnrollmentChannel[];
  cohorts: { id: string; name: string }[];
  orgId: string;
  orgName: string;
  onRefresh: () => void;
  onCreateClick: () => void;
}

const ChannelTable: React.FC<Props> = ({ channels, cohorts, orgId, orgName, onRefresh, onCreateClick }) => {
  const { user } = useAuth();
  const [toast, setToast] = useState('');
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [scanChannel, setScanChannel] = useState<EnrollmentChannel | null>(null);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setToast('Copied!');
    setTimeout(() => setToast(''), 2000);
  }

  function getFullUrl(slug: string) {
    return `${window.location.origin}/join/${slug}`;
  }

  function getCohortName(cohortId: string | null) {
    if (!cohortId) return '\u2014';
    return cohorts.find(c => c.id === cohortId)?.name || '\u2014';
  }

  async function handleDeactivate(channel: EnrollmentChannel) {
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('enrollment_channels')
      .update({ active: false })
      .eq('id', channel.id);
    if (!error) {
      await writeAuditLog({
        actorId: user.id,
        action: 'channel.deactivate',
        targetType: 'enrollment_channel',
        targetId: channel.id,
        orgId: channel.orgId,
        metadata: { type: channel.type, value: channel.value },
      });
      onRefresh();
    }
    setActionLoading(false);
    setDeactivating(null);
  }

  if (channels.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <AdminSectionLabel text="Enrollment Channels" />
        </div>
        <AdminEmptyState
          icon={<LinkIcon size={20} color="#A0AEC0" />}
          title="No enrollment channels yet"
          description="Create one to start enrolling users into this organisation."
          action={{ label: 'New Channel', onClick: onCreateClick }}
        />
      </div>
    );
  }

  const COLS = [
    { label: 'Label', width: '22%' },
    { label: 'Type', width: '10%' },
    { label: 'Value', width: '22%' },
    { label: 'Cohort', width: '14%' },
    { label: 'Uses', width: '12%' },
    { label: 'Status', width: '10%' },
    { label: 'Actions', width: '10%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AdminSectionLabel text="Enrollment Channels" />
        <button
          onClick={onCreateClick}
          style={{
            padding: '9px 18px', borderRadius: 24, border: 'none',
            background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + New Channel
        </button>
      </div>

      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Header */}
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

        {/* Rows */}
        {channels.map(ch => {
          const typeStyle = CHANNEL_TYPE_STYLES[ch.type];
          const status = getChannelStatus(ch);
          return (
            <div
              key={ch.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: '1px solid #F7FAFC', fontSize: 13,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              {/* Label */}
              <div style={{ width: '22%', fontWeight: 500, color: '#2D3748' }}>
                {ch.label || `${typeStyle?.label} — ${ch.value}`}
              </div>

              {/* Type */}
              <div style={{ width: '10%' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, background: typeStyle?.bg, color: typeStyle?.text,
                }}>
                  {typeStyle?.label}
                </span>
              </div>

              {/* Value */}
              <div style={{ width: '22%', display: 'flex', alignItems: 'center', gap: 6 }}>
                {ch.type === 'code' ? (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", background: '#F7FAFC',
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, letterSpacing: '0.05em',
                  }}>
                    {ch.value}
                  </span>
                ) : ch.type === 'link' ? (
                  <span style={{
                    fontSize: 12, color: '#718096', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 160,
                  }}>
                    {getFullUrl(ch.value)}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#718096' }}>{ch.value}</span>
                )}
                {ch.type !== 'domain' && (
                  <button
                    onClick={() => copyToClipboard(ch.type === 'link' ? getFullUrl(ch.value) : ch.value)}
                    title="Copy"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: '#A0AEC0', flexShrink: 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>

              {/* Cohort */}
              <div style={{ width: '14%', fontSize: 12, color: '#718096' }}>
                {getCohortName(ch.cohortId)}
              </div>

              {/* Uses */}
              <div style={{ width: '12%', fontSize: 12, color: '#718096' }}>
                {ch.usesCount} / {ch.maxUses || '\u221E'}
              </div>

              {/* Status */}
              <div style={{ width: '10%' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, background: status.bg, color: status.color,
                }}>
                  {status.label}
                </span>
              </div>

              {/* Actions */}
              <div style={{ width: '10%', display: 'flex', gap: 6 }}>
                {ch.type === 'link' && (
                  <button
                    onClick={() => copyToClipboard(getFullUrl(ch.value))}
                    title="Copy Link"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: '#A0AEC0',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                  >
                    <Copy size={14} />
                  </button>
                )}
                {ch.type === 'domain' && ch.active && (
                  <button
                    onClick={() => setScanChannel(ch)}
                    title="Scan & Enroll existing users"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: '#A0AEC0',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                  >
                    <UserPlus size={14} />
                  </button>
                )}
                {ch.active && (
                  <button
                    onClick={() => setDeactivating(ch.id)}
                    title="Deactivate"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: '#A0AEC0',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E53E3E'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
                  >
                    <Power size={14} />
                  </button>
                )}
              </div>

              {/* Confirm deactivate */}
              {deactivating === ch.id && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
                  zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ConfirmDialog
                    title="Deactivate Channel"
                    message={`Deactivate this ${ch.type} channel? Users will no longer be able to enroll via "${ch.value}".`}
                    confirmLabel="Deactivate"
                    confirmVariant="danger"
                    onConfirm={() => handleDeactivate(ch)}
                    onCancel={() => setDeactivating(null)}
                    isLoading={actionLoading}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scan & Enroll Modal */}
      {scanChannel && (
        <ScanEnrollModal
          domain={scanChannel.value}
          orgId={orgId}
          orgName={orgName}
          channelId={scanChannel.id}
          cohortId={scanChannel.cohortId}
          onClose={() => setScanChannel(null)}
          onEnrolled={onRefresh}
        />
      )}

      {/* Toast */}
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

export default ChannelTable;
