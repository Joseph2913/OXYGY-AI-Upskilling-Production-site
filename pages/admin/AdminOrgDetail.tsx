import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Check, X, Users, Link as LinkIcon, Calendar, Sliders, Plus, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrganisation, updateOrganisation, writeAuditLog } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Organisation, EnrollmentChannel } from '../../types';
import AdminCard from '../../components/admin/AdminCard';
import AdminSectionLabel from '../../components/admin/AdminSectionLabel';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ChannelTable from '../../components/admin/enrollment/ChannelTable';
import CreateChannelModal from '../../components/admin/enrollment/CreateChannelModal';
import CohortTable from '../../components/admin/enrollment/CohortTable';
import type { CohortRow } from '../../components/admin/enrollment/CohortTable';
import CreateCohortModal from '../../components/admin/enrollment/CreateCohortModal';
import CsvUploadModal from '../../components/admin/enrollment/CsvUploadModal';
import WorkshopTable from '../../components/admin/enrollment/WorkshopTable';
import type { WorkshopRow } from '../../components/admin/enrollment/WorkshopTable';
import UsersTable from '../../components/admin/users/UsersTable';
import InviteUserModal from '../../components/admin/users/InviteUserModal';
import OrgAnalyticsTab from '../../components/admin/analytics/OrgAnalyticsTab';

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  foundation: { bg: '#E6FFFA', text: '#1A6B5F', label: 'Foundation' },
  accelerator: { bg: '#EBF4FF', text: '#2B6CB0', label: 'Accelerator' },
  catalyst: { bg: '#FAF5FF', text: '#6B46C1', label: 'Catalyst' },
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Fundamentals & Awareness',
  2: 'Applied Capability',
  3: 'Systemic Integration',
  4: 'Interactive Dashboards',
  5: 'Full AI Applications',
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'users', label: 'Users' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'workshops', label: 'Workshops' },
  { key: 'programme', label: 'Programme' },
];

const PLACEHOLDER_TABS: Record<string, { icon: React.FC<{ size?: number; color?: string }>; title: string; desc: string }> = {
  programme: { icon: Sliders, title: 'Programme Configuration', desc: 'Configure pacing, branding, and other programme settings. Coming in a future update.' },
};

interface QuickStats {
  userCount: number;
  cohortCount: number;
  workshopCount: number;
}

const AdminOrgDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [org, setOrg] = useState<Organisation | null>(null);
  const [stats, setStats] = useState<QuickStats>({ userCount: 0, cohortCount: 0, workshopCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Enrollment tab state
  const [channels, setChannels] = useState<EnrollmentChannel[]>([]);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCohort, setShowCreateCohort] = useState(false);
  const [editingCohort, setEditingCohort] = useState<CohortRow | null>(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  // Workshops tab state
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);

  // Users tab state
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  const activeTab = searchParams.get('tab') || 'overview';

  const fetchEnrollmentData = useCallback(async (orgId: string) => {
    const [channelsRes, cohortsRes] = await Promise.all([
      supabase.from('enrollment_channels').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
      supabase.from('cohorts').select('*, user_org_memberships(count)').eq('org_id', orgId).order('created_at', { ascending: false }),
    ]);

    if (channelsRes.data) {
      setChannels(channelsRes.data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        orgId: c.org_id as string,
        cohortId: (c.cohort_id as string) || null,
        type: c.type as 'link' | 'code' | 'domain',
        value: c.value as string,
        label: (c.label as string) || null,
        maxUses: (c.max_uses as number) || null,
        usesCount: (c.uses_count as number) || 0,
        expiresAt: (c.expires_at as string) || null,
        active: c.active as boolean,
        autoEnroll: (c.auto_enroll as boolean) ?? true,
        createdBy: (c.created_by as string) || null,
        createdAt: c.created_at as string,
      })));
    }

    if (cohortsRes.data) {
      setCohorts(cohortsRes.data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: c.name as string,
        description: (c.description as string) || null,
        startDate: (c.start_date as string) || null,
        endDate: (c.end_date as string) || null,
        active: c.active as boolean,
        memberCount: ((c.user_org_memberships as Array<{ count: number }>)?.[0]?.count) ?? 0,
      })));
    }
  }, []);

  const fetchWorkshops = useCallback(async (orgId: string) => {
    const { data } = await supabase
      .from('workshop_sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('session_date', { ascending: false });
    if (data) {
      setWorkshops(data as WorkshopRow[]);
    }
  }, []);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!id) return;
    if (activeTab === 'enrollment') fetchEnrollmentData(id);
    if (activeTab === 'workshops') fetchWorkshops(id);
  }, [activeTab, id, fetchEnrollmentData, fetchWorkshops]);

  async function fetchData(orgId: string) {
    setLoading(true);
    try {
      const orgData = await getOrganisation(orgId);
      if (!orgData) { setError('Organisation not found'); return; }
      setOrg(orgData);

      // Quick stats
      const [memberships, cohorts, workshops] = await Promise.all([
        supabase.from('user_org_memberships').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('cohorts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('active', true),
        supabase.from('workshop_sessions').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      ]);
      setStats({
        userCount: memberships.count ?? 0,
        cohortCount: cohorts.count ?? 0,
        workshopCount: workshops.count ?? 0,
      });
    } catch {
      setError('Failed to load organisation');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!org || !user) return;
    setActionLoading(true);
    const newActive = !org.active;
    const success = await updateOrganisation(org.id, { name: org.name }, user.id);
    if (success) {
      // Direct update for the active field
      const { error: err } = await supabase
        .from('organisations')
        .update({ active: newActive, updated_at: new Date().toISOString() })
        .eq('id', org.id);
      if (!err) {
        await writeAuditLog({
          actorId: user.id,
          action: newActive ? 'org.reactivate' : 'org.deactivate',
          targetType: 'organisation',
          targetId: org.id,
          metadata: { org_name: org.name },
        });
        setOrg({ ...org, active: newActive });
      }
    }
    setActionLoading(false);
    setConfirmAction(null);
    setMenuOpen(false);
  }

  function formatDate(d: string | null) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

  if (error || !org) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
            Organisation not found
          </div>
          <Link
            to="/admin/organisations"
            style={{ fontSize: 13, color: '#38B2AC', textDecoration: 'none', fontWeight: 600 }}
          >
            Back to Organisations
          </Link>
        </div>
      </div>
    );
  }

  const tierStyle = org.tier ? TIER_STYLES[org.tier] : null;

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back link */}
      <Link
        to="/admin/organisations"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#718096', textDecoration: 'none', marginBottom: 20,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#38B2AC'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
      >
        <ArrowLeft size={14} /> Back to Organisations
      </Link>

      {/* Org Header Card */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
        padding: 24, marginBottom: 0,
        ...(org.active ? {} : { borderLeft: '4px solid #E53E3E' }),
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C', margin: 0 }}>
                {org.name}
              </h1>
              {!org.active && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#E53E3E', background: '#FFF5F5',
                  border: '1px solid #FEB2B2', padding: '2px 8px', borderRadius: 4,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  INACTIVE
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13, color: '#718096' }}>
              {tierStyle && (
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, background: tierStyle.bg, color: tierStyle.text,
                }}>
                  {tierStyle.label}
                </span>
              )}
              {org.domain && <><span>&middot;</span><span>{org.domain}</span></>}
              <span>&middot;</span>
              <span>{stats.userCount} users</span>
            </div>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 6 }}>
              Created {formatDate(org.createdAt)}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button
              onClick={() => navigate(`/admin/organisations/${org.id}/edit`, { state: { orgName: org.name } })}
              style={{
                padding: '8px 16px', borderRadius: 24,
                border: '1px solid #E2E8F0', background: '#FFFFFF',
                color: '#4A5568', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid #E2E8F0', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <MoreHorizontal size={16} color="#4A5568" />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 40, right: 0,
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '6px 0',
                minWidth: 200, zIndex: 10,
              }}>
                <button
                  onClick={() => { setConfirmAction(org.active ? 'deactivate' : 'reactivate'); setMenuOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '8px 16px',
                    border: 'none', background: 'none', textAlign: 'left',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    color: org.active ? '#E53E3E' : '#48BB78',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F7FAFC'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {org.active ? 'Deactivate Organisation' : 'Reactivate Organisation'}
                </button>
              </div>
            )}
            {confirmAction && (
              <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 20 }}>
                <ConfirmDialog
                  title={confirmAction === 'deactivate' ? 'Deactivate Organisation' : 'Reactivate Organisation'}
                  message={
                    confirmAction === 'deactivate'
                      ? `Are you sure you want to deactivate ${org.name}? Users will not be able to log in.`
                      : `Reactivate ${org.name}? Users will be able to log in again.`
                  }
                  confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
                  confirmVariant={confirmAction === 'deactivate' ? 'danger' : 'success'}
                  onConfirm={handleToggleActive}
                  onCancel={() => setConfirmAction(null)}
                  isLoading={actionLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0', borderRadius: '0 0 12px 12px',
        padding: '0 24px', marginBottom: 24, display: 'flex',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              style={{
                padding: '12px 16px', fontSize: 13, cursor: 'pointer',
                fontWeight: active ? 600 : 500,
                color: active ? '#1A202C' : '#718096',
                borderBottom: active ? '2px solid #38B2AC' : '2px solid transparent',
                background: 'none', border: 'none', borderBottomStyle: 'solid',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#4A5568'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#718096'; }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab org={org} stats={stats} />}

      {activeTab === 'analytics' && <OrgAnalyticsTab orgId={id!} orgName={org.name} />}

      {activeTab === 'enrollment' && (
        <>
          <ChannelTable
            channels={channels}
            cohorts={cohorts.map(c => ({ id: c.id, name: c.name }))}
            orgId={id!}
            orgName={org.name}
            onRefresh={() => fetchEnrollmentData(id!)}
            onCreateClick={() => setShowCreateChannel(true)}
          />

          {/* CSV Bulk Upload */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 20, marginBottom: 4, padding: '14px 18px',
            background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>Bulk Enroll via CSV</div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Upload a CSV file to add multiple users at once</div>
            </div>
            <button
              onClick={() => setShowCsvUpload(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 24, border: '1px solid #E2E8F0',
                background: '#FFFFFF', color: '#2D3748', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Upload size={14} /> Upload CSV
            </button>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 24, marginTop: 24 }}>
            <CohortTable
              cohorts={cohorts}
              orgId={id!}
              onRefresh={() => fetchEnrollmentData(id!)}
              onCreateClick={() => setShowCreateCohort(true)}
              onEditClick={c => setEditingCohort(c)}
            />
          </div>
          {showCreateChannel && (
            <CreateChannelModal
              orgId={id!}
              orgName={org.name}
              cohorts={cohorts.filter(c => c.active).map(c => ({ id: c.id, name: c.name }))}
              onClose={() => setShowCreateChannel(false)}
              onCreated={() => fetchEnrollmentData(id!)}
            />
          )}
          {showCsvUpload && (
            <CsvUploadModal
              orgId={id!}
              orgName={org.name}
              cohorts={cohorts.filter(c => c.active).map(c => ({ id: c.id, name: c.name }))}
              onClose={() => setShowCsvUpload(false)}
              onComplete={() => fetchEnrollmentData(id!)}
            />
          )}
          {(showCreateCohort || editingCohort) && (
            <CreateCohortModal
              orgId={id!}
              editing={editingCohort}
              onClose={() => { setShowCreateCohort(false); setEditingCohort(null); }}
              onSaved={() => fetchEnrollmentData(id!)}
            />
          )}
        </>
      )}

      {activeTab === 'workshops' && (
        <WorkshopTable
          workshops={workshops}
          orgId={id!}
          levelAccess={org.levelAccess}
          onRefresh={() => fetchWorkshops(id!)}
        />
      )}

      {activeTab === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setShowInviteUser(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 24,
                border: 'none', background: '#38B2AC', color: '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Plus size={15} /> Invite User
            </button>
          </div>
          <UsersTable key={usersRefreshKey} orgId={id} orgName={org.name} showOrgColumn={false} />
          {showInviteUser && (
            <InviteUserModal
              preSelectedOrgId={id}
              onClose={() => setShowInviteUser(false)}
              onInvited={() => { setUsersRefreshKey(k => k + 1); fetchData(id!); }}
            />
          )}
        </>
      )}

      {activeTab === 'programme' && <PlaceholderTab tabKey={activeTab} />}
    </div>
  );
};

/* ─── Overview Tab ─── */
function OverviewTab({ org, stats }: { org: Organisation; stats: QuickStats }) {
  const tierStyle = org.tier ? TIER_STYLES[org.tier] : null;

  function formatDate(d: string | null) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const detailRows = [
    { label: 'Name', value: org.name },
    { label: 'Domain', value: org.domain || '\u2014' },
    {
      label: 'Tier',
      value: tierStyle ? (
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
          fontSize: 11, fontWeight: 600, background: tierStyle.bg, color: tierStyle.text,
        }}>
          {tierStyle.label}
        </span>
      ) : '\u2014',
    },
    {
      label: 'Status',
      value: (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 500, color: org.active ? '#22543D' : '#9B2C2C',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: org.active ? '#48BB78' : '#FC8181' }} />
          {org.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      label: 'Contact',
      value: org.contactName || org.contactEmail
        ? `${org.contactName || ''} ${org.contactEmail ? `(${org.contactEmail})` : ''}`.trim()
        : '\u2014',
    },
    { label: 'Created', value: formatDate(org.createdAt) },
    { label: 'Last Updated', value: formatDate(org.updatedAt) },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Org Details */}
        <AdminCard>
          <AdminSectionLabel text="Organisation Details" />
          {detailRows.map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 0', borderBottom: i < detailRows.length - 1 ? '1px solid #F7FAFC' : 'none',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#A0AEC0' }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#2D3748', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </AdminCard>

        {/* Right: Level Access */}
        <AdminCard>
          <AdminSectionLabel text="Level Access" />
          {[1, 2, 3, 4, 5].map(n => {
            const enabled = org.levelAccess.includes(n);
            return (
              <div key={n} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: n < 5 ? '1px solid #F7FAFC' : 'none',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: enabled ? '#C6F6D5' : '#FED7D7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {enabled
                    ? <Check size={12} color="#22543D" />
                    : <X size={12} color="#9B2C2C" />}
                </div>
                <span style={{
                  fontSize: 13, color: enabled ? '#2D3748' : '#A0AEC0',
                  fontWeight: enabled ? 500 : 400,
                  textDecoration: enabled ? 'none' : 'line-through',
                }}>
                  Level {n}: {LEVEL_NAMES[n]}
                </span>
              </div>
            );
          })}
          <Link
            to={`/admin/organisations/${org.id}/edit`}
            state={{ orgName: org.name }}
            style={{ display: 'block', fontSize: 12, color: '#38B2AC', marginTop: 12, textDecoration: 'none', fontWeight: 600 }}
          >
            Edit level access &rarr;
          </Link>
        </AdminCard>
      </div>

      {/* Quick Stats */}
      <AdminCard style={{ marginTop: 20 }}>
        <AdminSectionLabel text="Quick Stats" />
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Enrolled Users', value: stats.userCount },
            { label: 'Active Cohorts', value: stats.cohortCount },
            { label: 'Workshop Sessions', value: stats.workshopCount },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1A202C' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}

/* ─── Placeholder Tab ─── */
function PlaceholderTab({ tabKey }: { tabKey: string }) {
  const config = PLACEHOLDER_TABS[tabKey];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#F7FAFC', border: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Icon size={20} color="#A0AEC0" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
        {config.title}
      </div>
      <div style={{ fontSize: 13, color: '#A0AEC0', maxWidth: 400, margin: '0 auto' }}>
        {config.desc}
      </div>
    </div>
  );
}

export default AdminOrgDetail;
