import React, { useState, useEffect } from 'react';
import { Users, Search, Flame, FolderOpen, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  getOrgLeaderboard,
  getOrgWeeklyActivity,
  validateAndAcceptInvite,
  ScoredMember,
} from '../../lib/database';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
} from '../../data/levelTopics';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AppCohort: React.FC = () => {
  const { user } = useAuth();
  const { orgId, orgName, orgTier, members, loading: orgLoading } = useOrg();
  const [memberStats, setMemberStats] = useState<ScoredMember[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(Array(7).fill(0));
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);

  // Invite code input for no-org state
  const [inviteCode, setInviteCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!orgId || !user) { setStatsLoading(false); return; }
    setStatsLoading(true);
    Promise.all([
      getOrgLeaderboard(orgId, user.id),
      getOrgWeeklyActivity(orgId),
    ]).then(([stats, activity]) => {
      setMemberStats(stats);
      setWeeklyActivity(activity);
      setStatsLoading(false);
    });
  }, [orgId, user]);

  const handleJoin = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinStatus('loading');
    const result = await validateAndAcceptInvite(user.id, inviteCode.trim());
    if (result.success) {
      setJoinStatus('success');
      window.location.reload();
    } else {
      setJoinStatus('error');
      setJoinError(result.error || 'Failed to join');
    }
  };

  if (orgLoading || statsLoading) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC', borderRadius: '50%', animation: 'cohort-spin 0.7s linear infinite' }} />
        <style>{`@keyframes cohort-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── No-org state ──
  if (!orgId) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 6px' }}>My Cohort</h1>
        <p style={{ fontSize: 14, color: '#718096', margin: '0 0 28px' }}>Your team's AI upskilling progress at a glance</p>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '40px 32px', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Users size={36} color="#38B2AC" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>
              Join your organisation's cohort
            </div>
            <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
              To access your cohort leaderboard, enter the organisation code you received from your facilitator.
            </div>
          </div>

          {/* Code entry */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <KeyRound size={14} color="#4A5568" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>Enter invite code</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB3K7NWQ"
                maxLength={8}
                style={{
                  flex: 1,
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#1A202C',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={handleJoin}
                disabled={!inviteCode.trim() || joinStatus === 'loading'}
                style={{
                  background: inviteCode.trim() ? '#38B2AC' : '#A0AEC0',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: inviteCode.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {joinStatus === 'loading' ? 'Joining...' : 'Join Cohort'}
              </button>
            </div>
            {joinStatus === 'error' && (
              <div style={{ fontSize: 13, color: '#C53030', marginTop: 8 }}>{joinError}</div>
            )}
            {joinStatus === 'success' && (
              <div style={{ fontSize: 13, color: '#38A169', marginTop: 8, fontWeight: 600 }}>
                Successfully joined! Reloading...
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Request code via email */}
          <button
            onClick={() => {
              const email = user?.email || '';
              const subject = encodeURIComponent('Request: Organisation Invite Code');
              const body = encodeURIComponent(
                `Hi,\n\nI'm using the Oxygy AI Upskilling platform and would like to join my organisation's cohort.\n\nCould you please send me the invite code?\n\nMy account email: ${email}\n\nThanks!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 20px',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              background: '#F7FAFC',
              fontSize: 14,
              fontWeight: 600,
              color: '#4A5568',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Mail size={16} color="#718096" />
            Request code via email
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#A0AEC0' }}>
              Don't have a code? You can continue using the platform individually — join a cohort anytime.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Org state — compute derived data ──
  const avgLevel = members.length > 0
    ? (members.reduce((s, m) => s + m.currentLevel, 0) / members.length).toFixed(1)
    : '0';
  const activeThisWeek = weeklyActivity.reduce((a, b) => a + b, 0) > 0
    ? new Set(memberStats.filter(m => m.activeDays30 > 0).map(m => m.userId)).size
    : 0;

  // Filter + search
  const filteredMembers = memberStats.filter(m => {
    if (levelFilter !== null && m.level !== levelFilter) return false;
    if (searchQuery && !m.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Level distribution
  const levelDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  memberStats.forEach(m => { levelDist[m.level] = (levelDist[m.level] || 0) + 1; });
  const maxLevelCount = Math.max(...Object.values(levelDist), 1);

  // Weekly activity chart max
  const maxActivity = Math.max(...weeklyActivity, 1);

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 6px' }}>My Cohort</h1>
      <p style={{ fontSize: 14, color: '#718096', margin: '0 0 20px' }}>Your team's AI upskilling progress at a glance</p>

      {/* Org Info Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1A202C' }}>{orgName}</span>
          {orgTier && (
            <span style={{ background: '#E6FFFA', color: '#38B2AC', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
              {orgTier}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#718096' }}>
          {members.length} member{members.length !== 1 ? 's' : ''} &middot; Avg Level {avgLevel} &middot; {activeThisWeek} active this week
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {[null, 1, 2, 3, 4, 5].map(lvl => {
          const active = levelFilter === lvl;
          return (
            <button
              key={lvl ?? 'all'}
              onClick={() => setLevelFilter(lvl)}
              style={{
                background: active ? '#1A202C' : '#F7FAFC',
                color: active ? '#FFFFFF' : '#4A5568',
                border: active ? 'none' : '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {lvl === null ? 'All' : `L${lvl}`}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} color="#A0AEC0" style={{ position: 'absolute', left: 10, top: 9 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              padding: '6px 14px 6px 30px',
              fontSize: 12,
              color: '#1A202C',
              fontFamily: "'DM Sans', sans-serif",
              outline: 'none',
              width: 160,
            }}
          />
        </div>
      </div>

      {/* Member Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
        {filteredMembers.map(m => {
          const accent = LEVEL_ACCENT_COLORS[m.level] || '#E2E8F0';
          const accentDark = LEVEL_ACCENT_DARK_COLORS[m.level] || '#4A5568';
          return (
            <div
              key={m.userId}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 16,
                borderLeft: m.isCurrentUser ? '3px solid #38B2AC' : '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: m.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#1A202C', flexShrink: 0,
                }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.fullName} {m.isCurrentUser && <span style={{ fontSize: 10, color: '#38B2AC', fontWeight: 600 }}>(You)</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: accent + '55', color: accentDark }}>
                    L{m.level}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{m.score}</div>
                  <div style={{ fontSize: 9, color: '#A0AEC0' }}>pts</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{m.completionPct}%</span>
                </div>
                <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${m.completionPct}%`, height: '100%', background: accent, borderRadius: 2 }} />
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#718096' }}>
                {m.streakDays > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Flame size={11} color="#F6AD55" /> {m.streakDays}d
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FolderOpen size={11} /> {m.artefactCount} artefact{m.artefactCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', fontSize: 14 }}>
          No members match your filters.
        </div>
      )}

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Level Distribution */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>Level Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(lvl => {
              const count = levelDist[lvl] || 0;
              const pct = (count / maxLevelCount) * 100;
              return (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', width: 24 }}>L{lvl}</span>
                  <div style={{ flex: 1, height: 16, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: LEVEL_ACCENT_COLORS[lvl], borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Activity */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>Weekly Activity</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {DAY_LABELS.map((label, i) => {
              const val = weeklyActivity[i] || 0;
              const barH = Math.max((val / maxActivity) * 80, val > 0 ? 8 : 0);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#1A202C' }}>{val}</span>
                  <div style={{ width: '100%', height: barH, background: '#38B2AC', borderRadius: 3, transition: 'height 0.3s' }} />
                  <span style={{ fontSize: 10, color: '#718096' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppCohort;
