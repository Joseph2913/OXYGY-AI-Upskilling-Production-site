import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AuditLogEntryProps {
  entry: {
    id: string;
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    orgId?: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  actorName: string;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} ${year}, ${time}`;
}

function describeAction(action: string, metadata: Record<string, unknown>): string {
  const m = metadata || {};
  const descriptions: Record<string, () => string> = {
    'org.create': () => `created organisation "${m.org_name}" (tier: ${m.tier})`,
    'org.update': () => `updated organisation "${m.org_name}"`,
    'org.deactivate': () => `deactivated organisation "${m.org_name}"`,
    'org.reactivate': () => `reactivated organisation "${m.org_name}"`,
    'user.invite': () => `invited ${m.user_email} to ${m.org_name} as ${m.role}`,
    'user.enroll': () => `enrolled in ${m.org_name} via ${m.channel_type} channel`,
    'user.deactivate': () => `deactivated ${m.user_name || m.user_email}'s membership in ${m.org_name}`,
    'user.role_change': () => `changed ${m.user_name}'s role to ${m.new_role} in ${m.org_name}`,
    'channel.create': () => `created ${m.channel_type} enrollment channel "${m.channel_label || m.channel_value}" for ${m.org_name}`,
    'channel.deactivate': () => `deactivated enrollment channel "${m.channel_label || m.channel_value}"`,
    'workshop.create': () => `created workshop session "${m.session_name}" (Level ${m.level}) for ${m.org_name}`,
    'workshop.deactivate': () => `deactivated workshop session "${m.session_name}"`,
    'flag.toggle': () => `${m.enabled ? 'enabled' : 'disabled'} feature flag "${m.key}"`,
    'flag.override_create': () => `created org override for flag "${m.key}" (${m.enabled ? 'ON' : 'OFF'}) in ${m.org_name}`,
    'flag.override_delete': () => `removed org override for flag "${m.key}" from ${m.org_name}`,
  };

  const descFn = descriptions[action];
  return descFn ? descFn() : `performed action: ${action}`;
}

const AuditLogEntryComponent: React.FC<AuditLogEntryProps> = ({ entry, actorName }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #F7FAFC' }}>
      <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 6 }}>
        {formatDateTime(entry.createdAt)}
      </div>
      <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600 }}>{actorName}</span>
        {' '}{describeAction(entry.action, entry.metadata)}
      </div>
      <button onClick={() => setExpanded(!expanded)} style={{
        marginTop: 8, fontSize: 11, fontWeight: 600, color: '#718096',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        {expanded ? 'Less' : 'More'}
      </button>
      {expanded && (
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF2F7',
        }}>
          <pre style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: '#4A5568', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6,
          }}>
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuditLogEntryComponent;
