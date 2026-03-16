import React, { useState, useEffect } from 'react';
import { X, User, BookOpen, Wrench, Shield, ChevronDown, MessageSquare, Bot, GitBranch, Layout, Cpu } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fetchAdminUserDetail, fetchUserProfile, updateMembershipRole, deactivateMembership } from '../../../lib/database';
import type { AdminUserDetail } from '../../../lib/database';
import type { AdminUserRow } from '../../../lib/database';
import type { OrgMemberRole } from '../../../types';
import { LEVEL_PILL_STYLES, LEVEL_NAMES } from '../../../data/dashboard-content';
import ConfirmDialog from '../ConfirmDialog';

interface EnrichedUser extends AdminUserRow {
  toolsUsed: number;
  lastActive: Date | null;
}

interface UserDetailDrawerProps {
  user: EnrichedUser;
  onClose: () => void;
  onRefresh: () => void;
}

const AI_EXP_LABELS: Record<string, string> = {
  'beginner': 'Beginner',
  'comfortable-user': 'Comfortable User',
  'builder': 'Builder',
  'integrator': 'Integrator',
};

const AMBITION_LABELS: Record<string, string> = {
  'confident-daily-use': 'Confident Daily Use',
  'build-reusable-tools': 'Build Reusable Tools',
  'own-ai-processes': 'Own AI Processes',
  'build-full-apps': 'Build Full Apps',
  'lead-ai-strategy': 'Lead AI Strategy',
};

const TOOL_DISPLAY: Record<string, { label: string; icon: React.FC<{ size?: number; color?: string }> }> = {
  'prompt-playground': { label: 'Prompt Playground', icon: MessageSquare },
  'agent-builder': { label: 'Agent Builder', icon: Bot },
  'workflow-designer': { label: 'Workflow Canvas', icon: GitBranch },
  'dashboard-designer': { label: 'App Designer', icon: Layout },
  'product-architecture': { label: 'App Evaluator', icon: Cpu },
};

const ORG_ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  learner: { bg: '#EDF2F7', text: '#4A5568' },
  facilitator: { bg: '#EBF4FF', text: '#2B6CB0' },
  admin: { bg: '#FAF5FF', text: '#6B46C1' },
};

const PLATFORM_ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  learner: { bg: '#EDF2F7', text: '#4A5568' },
  client_admin: { bg: '#FAF5FF', text: '#6B46C1' },
  oxygy_admin: { bg: '#E6FFFA', text: '#1A6B5F' },
  super_admin: { bg: '#FED7D7', text: '#9B2C2C' },
};

function getUserStatus(lastActive: Date | null): { label: string; color: string; bg: string } {
  if (!lastActive) return { label: 'Never Active', color: '#A0AEC0', bg: '#EDF2F7' };
  const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 30) return { label: 'Active', color: '#22543D', bg: '#C6F6D5' };
  return { label: 'Stalled', color: '#975A16', bg: '#FEFCBF' };
}

function formatDate(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ user, onClose, onRefresh }) => {
  const { user: authUser } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    profile: true, progress: true, toolkit: true, membership: true,
  });
  const [roleValue, setRoleValue] = useState<OrgMemberRole>(user.orgRole);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [d, p] = await Promise.all([
        fetchAdminUserDetail(user.userId),
        fetchUserProfile(user.userId),
      ]);
      if (mounted) {
        setDetail(d);
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user.userId]);

  function toggle(section: string) {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  }

  async function handleRoleChange(newRole: OrgMemberRole) {
    if (!authUser || newRole === roleValue) return;
    setRoleUpdating(true);
    const ok = await updateMembershipRole(user.membershipId, newRole, authUser.id, user.orgId);
    if (ok) {
      setRoleValue(newRole);
      showToast('Role updated');
      onRefresh();
    }
    setRoleUpdating(false);
  }

  async function handleDeactivate() {
    if (!authUser) return;
    setDeactivating(true);
    const ok = await deactivateMembership(user.membershipId, authUser.id);
    if (ok) {
      showToast('User deactivated');
      onRefresh();
      onClose();
    }
    setDeactivating(false);
    setShowDeactivate(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const initial = (user.fullName || '?')[0].toUpperCase();
  const status = getUserStatus(user.lastActive);
  const levelStyle = LEVEL_PILL_STYLES[user.currentLevel] || { bg: '#EDF2F7', text: '#4A5568' };
  const levelName = LEVEL_NAMES[user.currentLevel] || '';

  // Tool counts from detail
  const toolCounts: Record<string, number> = {};
  if (detail) {
    detail.savedPrompts.forEach(sp => {
      const t = sp.source_tool || 'unknown';
      toolCounts[t] = (toolCounts[t] || 0) + 1;
    });
  }
  const totalSaved = Object.values(toolCounts).reduce((s, n) => s + n, 0);

  const profileFields = profile ? [
    { label: 'Role', value: profile.role as string },
    { label: 'Function', value: (profile.function as string) || (profile.function_other as string) },
    { label: 'Seniority', value: profile.seniority as string },
    { label: 'AI Experience', value: AI_EXP_LABELS[(profile.ai_experience as string) || ''] || (profile.ai_experience as string) },
    { label: 'Ambition', value: AMBITION_LABELS[(profile.ambition as string) || ''] || (profile.ambition as string) },
    { label: 'Challenge', value: profile.challenge as string },
  ] : [];

  const hasIncompleteProfile = profile && (!profile.role || !profile.function || !profile.seniority);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(26, 32, 44, 0.3)',
          zIndex: 40, transition: 'opacity 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 520, maxWidth: '90vw',
        background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        zIndex: 41, overflowY: 'auto',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              border: 'none', background: 'none', cursor: 'pointer', padding: 4,
            }}
          >
            <X size={20} color="#A0AEC0" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#4A5568', flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A202C' }}>
                {user.fullName || 'Unnamed'}
              </div>
              {user.pendingEmail && (
                <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{user.pendingEmail}</div>
              )}
              <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 2 }}>
                {user.orgName}{user.cohortName ? ` \u00B7 ${user.cohortName}` : ''}
              </div>
            </div>
          </div>

          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <SummaryPill label="LEVEL" value={
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                fontSize: 11, fontWeight: 700, background: levelStyle.bg, color: levelStyle.text,
              }}>
                L{user.currentLevel} \u2014 {levelName}
              </span>
            } />
            <SummaryPill label="STATUS" value={
              <span style={{ color: status.color, fontWeight: 700 }}>{status.label}</span>
            } />
            <SummaryPill label="ENROLLED" value={formatDate(user.enrolledAt)} />
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{
              width: 20, height: 20, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
              borderRadius: '50%', animation: 'app-spin 0.7s linear infinite', margin: '0 auto',
            }} />
          </div>
        ) : (
          <div>
            {/* Profile Section */}
            <SectionHeader
              icon={User} title="Profile" expanded={expanded.profile}
              onToggle={() => toggle('profile')}
            />
            {expanded.profile && (
              <div style={{ padding: '0 24px 20px' }}>
                {profileFields.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    borderBottom: i < profileFields.length - 1 ? '1px solid #F7FAFC' : 'none',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#A0AEC0' }}>{f.label}</span>
                    <span style={{ fontSize: 13, color: f.value ? '#2D3748' : '#CBD5E0' }}>
                      {f.value || '\u2014'}
                    </span>
                  </div>
                ))}
                {hasIncompleteProfile && (
                  <div style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic', marginTop: 8 }}>
                    Profile incomplete — the user hasn't filled in all fields yet.
                  </div>
                )}
              </div>
            )}

            {/* Level Progress Section */}
            <SectionHeader
              icon={BookOpen} title="Level Progress"
              badge={`${user.toolsUsed}/5 tools used`}
              expanded={expanded.progress}
              onToggle={() => toggle('progress')}
            />
            {expanded.progress && (
              <div style={{ padding: '0 24px 20px' }}>
                {[1, 2, 3, 4, 5].map(level => {
                  const lp = detail?.levelProgress.find(p => p.level === level);
                  const ls = LEVEL_PILL_STYLES[level] || { bg: '#EDF2F7', text: '#4A5568' };
                  return (
                    <div key={level} style={{
                      display: 'grid', gridTemplateColumns: '36px 1fr 80px 80px',
                      gap: 8, alignItems: 'center', padding: '8px 0',
                      borderBottom: level < 5 ? '1px solid #F7FAFC' : 'none',
                    }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 10, fontWeight: 700, background: ls.bg, color: ls.text, textAlign: 'center',
                      }}>
                        L{level}
                      </span>
                      <span style={{ fontSize: 12, color: '#2D3748', fontWeight: 500 }}>
                        {LEVEL_NAMES[level] || `Level ${level}`}
                      </span>
                      <span style={{ fontSize: 12, color: lp?.tool_used ? '#48BB78' : '#CBD5E0' }}>
                        {lp?.tool_used ? '\u2713 Tool' : '\u2014 Tool'}
                      </span>
                      <span style={{ fontSize: 12, color: lp?.workshop_attended ? '#48BB78' : '#CBD5E0' }}>
                        {lp?.workshop_attended ? '\u2713 Workshop' : '\u2014 Workshop'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Toolkit Activity Section */}
            <SectionHeader
              icon={Wrench} title="Toolkit Activity"
              badge={`${totalSaved} artefacts saved`}
              expanded={expanded.toolkit}
              onToggle={() => toggle('toolkit')}
            />
            {expanded.toolkit && (
              <div style={{ padding: '0 24px 20px' }}>
                {Object.entries(TOOL_DISPLAY).map(([key, tool]) => {
                  const Icon = tool.icon;
                  const count = toolCounts[key] || 0;
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid #F7FAFC',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={16} color="#A0AEC0" />
                        <span style={{ fontSize: 13, color: '#2D3748' }}>{tool.label}</span>
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: count > 0 ? '#1A202C' : '#CBD5E0',
                      }}>
                        {count} saved
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Membership Section */}
            <SectionHeader
              icon={Shield} title="Membership"
              expanded={expanded.membership}
              onToggle={() => toggle('membership')}
            />
            {expanded.membership && (
              <div style={{ padding: '0 24px 20px' }}>
                {[
                  { label: 'Organisation', value: user.orgName },
                  {
                    label: 'Org Role',
                    value: (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 11, fontWeight: 600,
                        background: ORG_ROLE_STYLES[user.orgRole]?.bg || '#EDF2F7',
                        color: ORG_ROLE_STYLES[user.orgRole]?.text || '#4A5568',
                      }}>
                        {user.orgRole}
                      </span>
                    ),
                  },
                  { label: 'Cohort', value: user.cohortName || '\u2014' },
                  { label: 'Enrolled Via', value: user.enrolledVia || 'Manual' },
                  { label: 'Enrolled At', value: formatDate(user.enrolledAt) },
                  {
                    label: 'Platform Role',
                    value: (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 11, fontWeight: 600,
                        background: PLATFORM_ROLE_STYLES[user.platformRole]?.bg || '#EDF2F7',
                        color: PLATFORM_ROLE_STYLES[user.platformRole]?.text || '#4A5568',
                      }}>
                        {user.platformRole}
                      </span>
                    ),
                  },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid #F7FAFC',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#A0AEC0' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: '#2D3748' }}>{row.value}</span>
                  </div>
                ))}

                {/* Admin actions */}
                <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: 16, marginTop: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
                      Change organisation role
                    </label>
                    <select
                      value={roleValue}
                      onChange={e => handleRoleChange(e.target.value as OrgMemberRole)}
                      disabled={roleUpdating}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                        fontSize: 13, color: '#4A5568', background: '#FFFFFF',
                        fontFamily: "'DM Sans', sans-serif", cursor: roleUpdating ? 'wait' : 'pointer',
                      }}
                    >
                      <option value="learner">Learner</option>
                      <option value="facilitator">Facilitator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowDeactivate(true)}
                    style={{
                      border: 'none', background: 'none', fontSize: 12, color: '#E53E3E',
                      cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Deactivate this user's membership
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            background: '#1A202C', color: '#FFFFFF', padding: '10px 20px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {toast}
          </div>
        )}

        {/* Confirm Deactivate */}
        {showDeactivate && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={() => setShowDeactivate(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ConfirmDialog
                title="Deactivate User"
                message={`This will prevent ${user.fullName || 'this user'} from accessing the platform under ${user.orgName}. Their data will be preserved.`}
                confirmLabel="Deactivate"
                confirmVariant="danger"
                onConfirm={handleDeactivate}
                onCancel={() => setShowDeactivate(false)}
                isLoading={deactivating}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Sub-components ───

function SummaryPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 10, background: '#F7FAFC',
      border: '1px solid #E2E8F0',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#A0AEC0',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, badge, expanded, onToggle,
}: {
  icon: React.FC<{ size?: number; color?: string }>;
  title: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', border: 'none', background: 'transparent',
        borderBottom: '1px solid #F7FAFC', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={15} color="#A0AEC0" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2D3748' }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 8px',
            borderRadius: 10, background: '#F7FAFC', color: '#718096',
          }}>
            {badge}
          </span>
        )}
      </div>
      <ChevronDown
        size={14} color="#A0AEC0"
        style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
      />
    </button>
  );
}

export default UserDetailDrawer;
