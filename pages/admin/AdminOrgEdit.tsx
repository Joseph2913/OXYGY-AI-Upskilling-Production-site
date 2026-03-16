import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrganisation, updateOrganisation, writeAuditLog } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Organisation } from '../../types';
import AdminCard from '../../components/admin/AdminCard';
import AdminSectionLabel from '../../components/admin/AdminSectionLabel';
import AdminInput from '../../components/admin/AdminInput';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Fundamentals & Awareness',
  2: 'Applied Capability',
  3: 'Systemic Integration',
  4: 'Interactive Dashboards',
  5: 'Full AI Applications',
};

const TIER_OPTIONS = [
  { value: 'foundation', label: 'Foundation', desc: 'Core AI literacy \u2014 Levels 1-3', levels: [1, 2, 3] },
  { value: 'accelerator', label: 'Accelerator', desc: 'Applied capability \u2014 Levels 1-4', levels: [1, 2, 3, 4] },
  { value: 'catalyst', label: 'Catalyst', desc: 'Full transformation \u2014 Levels 1-5', levels: [1, 2, 3, 4, 5] },
];

const AdminOrgEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [tier, setTier] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [levelAccess, setLevelAccess] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  useEffect(() => {
    if (id) loadOrg(id);
  }, [id]);

  async function loadOrg(orgId: string) {
    setLoading(true);
    const data = await getOrganisation(orgId);
    if (data) {
      setOrg(data);
      setName(data.name);
      setDomain(data.domain || '');
      setTier(data.tier || '');
      setContactName(data.contactName || '');
      setContactEmail(data.contactEmail || '');
      setLevelAccess(data.levelAccess || [1, 2, 3, 4, 5]);
    }
    setLoading(false);
  }

  function selectTier(t: string) {
    setTier(t);
    const opt = TIER_OPTIONS.find(o => o.value === t);
    if (opt) setLevelAccess(opt.levels);
  }

  function toggleLevel(n: number) {
    setLevelAccess(prev =>
      prev.includes(n) ? prev.filter(l => l !== n) : [...prev, n].sort()
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Organisation name is required (min 2 characters)';
    if (!tier) e.tier = 'Please select a programme tier';
    if (levelAccess.length === 0) e.levels = 'At least one level must be enabled';
    if (domain.trim() && (!domain.includes('.') || domain.includes(' '))) e.domain = 'Please enter a valid domain';
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.contactEmail = 'Please enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !org || !user) return;
    setIsSubmitting(true);
    try {
      const success = await updateOrganisation(org.id, {
        name: name.trim(),
        domain: domain.trim() || null,
        tier,
        levelAccess,
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
      }, user.id);

      if (success) {
        navigate(`/admin/organisations/${org.id}`, { state: { orgName: name.trim() } });
      } else {
        setErrors({ submit: 'Failed to update organisation.' });
      }
    } catch {
      setErrors({ submit: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!org || !user) return;
    setDeactivateLoading(true);
    const newActive = !org.active;
    const { error } = await supabase
      .from('organisations')
      .update({ active: newActive, updated_at: new Date().toISOString() })
      .eq('id', org.id);
    if (!error) {
      await writeAuditLog({
        actorId: user.id,
        action: newActive ? 'org.reactivate' : 'org.deactivate',
        targetType: 'organisation',
        targetId: org.id,
        metadata: { org_name: org.name },
      });
      setOrg({ ...org, active: newActive });
    }
    setDeactivateLoading(false);
    setShowDeactivate(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 36, textAlign: 'center' }}>
        <div style={{
          width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'app-spin 0.7s linear infinite', margin: '0 auto',
        }} />
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
            Organisation not found
          </div>
          <Link to="/admin/organisations" style={{ fontSize: 13, color: '#38B2AC', textDecoration: 'none', fontWeight: 600 }}>
            Back to Organisations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 720, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back link */}
      <Link
        to={`/admin/organisations/${org.id}`}
        state={{ orgName: org.name }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#718096', textDecoration: 'none', marginBottom: 20,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
      >
        <ArrowLeft size={14} /> Back to {org.name}
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: '0 0 20px' }}>
        Edit {org.name}
      </h1>

      {errors.submit && (
        <div style={{
          background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 10,
          padding: '10px 14px', fontSize: 13, color: '#E53E3E', marginBottom: 16,
        }}>
          {errors.submit}
        </div>
      )}

      {/* Organisation Details */}
      <AdminCard style={{ marginBottom: 20 }}>
        <AdminSectionLabel text="Organisation Details" />
        <AdminInput label="Organisation Name" value={name} onChange={setName} placeholder="e.g. Acme Corp" required error={errors.name} />
        <AdminInput label="Email Domain" value={domain} onChange={setDomain} placeholder="e.g. acme.com" helper="Optional \u2014 for domain-based auto-assign" error={errors.domain} />

        {/* Tier Selector */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6 }}>
          Programme Tier <span style={{ color: '#E53E3E' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 10, marginBottom: errors.tier ? 4 : 16 }}>
          {TIER_OPTIONS.map(opt => {
            const selected = tier === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => selectTier(opt.value)}
                style={{
                  flex: 1, padding: 14, borderRadius: 10, cursor: 'pointer', textAlign: 'center' as const,
                  border: selected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                  background: selected ? '#E6FFFA' : '#FFFFFF',
                  transition: 'border 0.15s, background 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#1A202C' : '#2D3748' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>{opt.desc}</div>
              </div>
            );
          })}
        </div>
        {errors.tier && <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 16 }}>{errors.tier}</div>}

        {/* Contact fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <AdminInput label="Contact Name" value={contactName} onChange={setContactName} placeholder="e.g. Jane Smith" />
          <AdminInput label="Contact Email" value={contactEmail} onChange={setContactEmail} placeholder="e.g. jane@acme.com" type="email" error={errors.contactEmail} />
        </div>
      </AdminCard>

      {/* Level Access */}
      <AdminCard style={{ marginBottom: 20 }}>
        <AdminSectionLabel text="Level Access" />
        {[1, 2, 3, 4, 5].map(n => {
          const checked = levelAccess.includes(n);
          return (
            <label key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', cursor: 'pointer',
              borderBottom: n < 5 ? '1px solid #F7FAFC' : 'none',
            }}>
              <div
                onClick={(e) => { e.preventDefault(); toggleLevel(n); }}
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${checked ? '#38B2AC' : '#E2E8F0'}`,
                  background: checked ? '#38B2AC' : '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#2D3748' }}>
                Level {n}: {LEVEL_NAMES[n]}
              </span>
            </label>
          );
        })}
        {errors.levels && <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>{errors.levels}</div>}
      </AdminCard>

      {/* Danger Zone */}
      <div style={{
        background: org.active ? '#FFF5F5' : '#F0FFF4',
        border: `1px solid ${org.active ? '#FEB2B2' : '#9AE6B4'}`,
        borderRadius: 12, padding: 24, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: org.active ? '#E53E3E' : '#48BB78',
          textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12,
        }}>
          Danger Zone
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>
              {org.active ? 'Deactivate this organisation' : 'Reactivate this organisation'}
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
              {org.active
                ? 'Users will not be able to log in. Data will be preserved.'
                : 'Users will be able to log in again.'}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDeactivate(true)}
              style={{
                padding: '8px 16px', borderRadius: 24,
                border: `1px solid ${org.active ? '#FEB2B2' : '#9AE6B4'}`,
                background: '#FFFFFF',
                color: org.active ? '#E53E3E' : '#48BB78',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {org.active ? 'Deactivate' : 'Reactivate'}
            </button>
            {showDeactivate && (
              <div style={{ position: 'absolute', bottom: 42, right: 0, zIndex: 10 }}>
                <ConfirmDialog
                  title={org.active ? 'Deactivate Organisation' : 'Reactivate Organisation'}
                  message={
                    org.active
                      ? `Are you sure you want to deactivate ${org.name}? Users will not be able to log in.`
                      : `Reactivate ${org.name}? Users will be able to log in again.`
                  }
                  confirmLabel={org.active ? 'Deactivate' : 'Reactivate'}
                  confirmVariant={org.active ? 'danger' : 'success'}
                  onConfirm={handleToggleActive}
                  onCancel={() => setShowDeactivate(false)}
                  isLoading={deactivateLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => navigate(`/admin/organisations/${org.id}`, { state: { orgName: org.name } })}
          style={{
            padding: '10px 22px', borderRadius: 24,
            border: '1px solid #E2E8F0', background: '#FFFFFF',
            color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            padding: '10px 22px', borderRadius: 24,
            border: 'none', background: '#38B2AC', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminOrgEdit;
