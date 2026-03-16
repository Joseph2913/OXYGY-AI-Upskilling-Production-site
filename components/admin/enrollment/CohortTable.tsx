import React, { useState } from 'react';
import { Users, Edit2, Power } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { useAuth } from '../../../context/AuthContext';
import AdminSectionLabel from '../AdminSectionLabel';
import AdminEmptyState from '../AdminEmptyState';
import ConfirmDialog from '../ConfirmDialog';

export interface CohortRow {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  memberCount: number;
}

interface Props {
  cohorts: CohortRow[];
  orgId: string;
  onRefresh: () => void;
  onCreateClick: () => void;
  onEditClick: (cohort: CohortRow) => void;
}

const CohortTable: React.FC<Props> = ({ cohorts, orgId, onRefresh, onCreateClick, onEditClick }) => {
  const { user } = useAuth();
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function formatDate(d: string | null) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleDeactivate(cohort: CohortRow) {
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('cohorts')
      .update({ active: !cohort.active })
      .eq('id', cohort.id);
    if (!error) {
      await writeAuditLog({
        actorId: user.id,
        action: cohort.active ? 'cohort.deactivate' : 'cohort.reactivate',
        targetType: 'cohort',
        targetId: cohort.id,
        orgId,
        metadata: { name: cohort.name },
      });
      onRefresh();
    }
    setActionLoading(false);
    setDeactivating(null);
  }

  if (cohorts.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <AdminSectionLabel text="Cohorts" />
        </div>
        <AdminEmptyState
          icon={<Users size={20} color="#A0AEC0" />}
          title="No cohorts yet"
          description="Cohorts let you group users and track their progress separately."
          action={{ label: 'New Cohort', onClick: onCreateClick }}
        />
      </div>
    );
  }

  const COLS = [
    { label: 'Name', width: '25%' },
    { label: 'Start Date', width: '18%' },
    { label: 'End Date', width: '18%' },
    { label: 'Members', width: '15%' },
    { label: 'Status', width: '12%' },
    { label: 'Actions', width: '12%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AdminSectionLabel text="Cohorts" />
        <button
          onClick={onCreateClick}
          style={{
            padding: '9px 18px', borderRadius: 24, border: 'none',
            background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + New Cohort
        </button>
      </div>

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

        {cohorts.map(ch => (
          <div
            key={ch.id}
            style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              borderBottom: '1px solid #F7FAFC', fontSize: 13,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div style={{ width: '25%', fontWeight: 500, color: '#2D3748' }}>{ch.name}</div>
            <div style={{ width: '18%', fontSize: 12, color: '#718096' }}>{formatDate(ch.startDate)}</div>
            <div style={{ width: '18%', fontSize: 12, color: '#718096' }}>{formatDate(ch.endDate)}</div>
            <div style={{ width: '15%', fontSize: 12, color: '#718096' }}>{ch.memberCount}</div>
            <div style={{ width: '12%' }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                background: ch.active ? '#C6F6D5' : '#FED7D7',
                color: ch.active ? '#22543D' : '#9B2C2C',
              }}>
                {ch.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ width: '12%', display: 'flex', gap: 6 }}>
              <button
                onClick={() => onEditClick(ch)}
                title="Edit"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setDeactivating(ch.id)}
                title={ch.active ? 'Deactivate' : 'Reactivate'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ch.active ? '#E53E3E' : '#48BB78'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
              >
                <Power size={14} />
              </button>
            </div>

            {deactivating === ch.id && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(26,32,44,0.5)',
                zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ConfirmDialog
                  title={ch.active ? 'Deactivate Cohort' : 'Reactivate Cohort'}
                  message={ch.active
                    ? `Deactivate "${ch.name}"? Existing members will remain but new enrollments won't target this cohort.`
                    : `Reactivate "${ch.name}"?`}
                  confirmLabel={ch.active ? 'Deactivate' : 'Reactivate'}
                  confirmVariant={ch.active ? 'danger' : 'success'}
                  onConfirm={() => handleDeactivate(ch)}
                  onCancel={() => setDeactivating(null)}
                  isLoading={actionLoading}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CohortTable;
