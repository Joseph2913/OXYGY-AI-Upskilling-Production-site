import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { useAuth } from '../../../context/AuthContext';
import type { CohortRow } from './CohortTable';

interface Props {
  orgId: string;
  editing?: CohortRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const CreateCohortModal: React.FC<Props> = ({ orgId, editing, onClose, onSaved }) => {
  const { user } = useAuth();
  const [name, setName] = useState(editing?.name || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [startDate, setStartDate] = useState(editing?.startDate || '');
  const [endDate, setEndDate] = useState(editing?.endDate || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editing;

  async function handleSubmit() {
    if (!name.trim()) { setError('Cohort name is required'); return; }
    if (!user) return;

    setSubmitting(true);
    setError('');

    if (isEdit) {
      const { error: updateErr } = await supabase
        .from('cohorts')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing!.id);

      if (updateErr) { setError(updateErr.message); setSubmitting(false); return; }

      await writeAuditLog({
        actorId: user.id,
        action: 'cohort.update',
        targetType: 'cohort',
        targetId: editing!.id,
        orgId,
        metadata: { name: name.trim() },
      });
    } else {
      const { error: insertErr } = await supabase
        .from('cohorts')
        .insert({
          org_id: orgId,
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          active: true,
          created_by: user.id,
        });

      if (insertErr) { setError(insertErr.message); setSubmitting(false); return; }

      await writeAuditLog({
        actorId: user.id,
        action: 'cohort.create',
        targetType: 'cohort',
        orgId,
        metadata: { name: name.trim() },
      });
    }

    setSubmitting(false);
    onSaved();
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
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
            {isEdit ? 'Edit Cohort' : 'New Cohort'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Cohort Name <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Q1 2026" style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
              Description <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Brief description..." style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
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
            disabled={submitting || !name.trim()}
            style={{
              padding: '9px 18px', borderRadius: 24, border: 'none',
              background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
              opacity: submitting || !name.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCohortModal;
