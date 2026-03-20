import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Search, Flame, FolderOpen, Mail, KeyRound,
  ChevronDown, ChevronUp, X, FileText, Calendar, Clock,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  getOrgLeaderboard,
  getOrgWeeklyActivity,
  getOrgWorkshopSessions,
  getMemberArtefacts,
  getAllTopicProgress,
  getLatestLearningPlan,
  validateAndAcceptInvite,
  ScoredMember,
  TopicProgressRow,
} from '../../lib/database';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
  LEVEL_TOPICS,
} from '../../data/levelTopics';

// ─── Constants ───

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Score' },
  { key: 'name', label: 'Name A–Z' },
  { key: 'level', label: 'Level' },
  { key: 'completion', label: 'Completion %' },
  { key: 'streak', label: 'Streak' },
  { key: 'active', label: 'Active Days' },
];

type SortKey = 'score' | 'name' | 'level' | 'completion' | 'streak' | 'active';

const MEDAL_GRADIENTS = [
  'linear-gradient(135deg, #F6E05E, #D69E2E)',
  'linear-gradient(135deg, #CBD5E0, #A0AEC0)',
  'linear-gradient(135deg, #EDCBAB, #C8875D)',
];
const MEDAL_SHADOWS = [
  '0 1px 4px rgba(214,158,46,0.3)',
  '0 1px 4px rgba(160,174,192,0.3)',
  '0 1px 4px rgba(200,135,93,0.3)',
];

const SCORE_BREAKDOWN_COMPONENTS = [
  { key: 'phases', label: 'Phases completed', color: '#38B2AC' },
  { key: 'artefacts', label: 'Artefacts saved', color: '#667EEA' },
  { key: 'insights', label: 'Insights logged', color: '#ED8936' },
  { key: 'streak', label: 'Day streak', color: '#F6AD55' },
  { key: 'active', label: 'Active days (30d)', color: '#48BB78' },
];

const SCORE_ICONS: Record<string, React.ReactNode> = {
  phases: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  artefacts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  insights: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  streak: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  active: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

const SCORE_ICON_BG: Record<string, string> = {
  phases: '#EAF3DE',
  artefacts: '#E6FFFA',
  insights: '#FBEAF0',
  streak: '#FAEEDA',
  active: '#E6F1FB',
};

const SCORE_ICON_COLOR: Record<string, string> = {
  phases: '#27500A',
  artefacts: '#085041',
  insights: '#72243E',
  streak: '#633806',
  active: '#0C447C',
};


// ─── Hook: animated count-up ───

function useCountUp(target: number, duration: number = 600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── CSS Animations ───

const COHORT_STYLES = `
@keyframes cohort-spin { to { transform: rotate(360deg); } }
@keyframes cohortRowFadeIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes cohortCardFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes cohortTodayPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(56, 178, 172, 0.2); }
  50% { box-shadow: 0 0 14px rgba(56, 178, 172, 0.4); }
}
@keyframes cohortPodiumGrow {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}
@keyframes cohortShimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
`;

// ─── Drawer data type ───

interface DrawerData {
  artefacts: Awaited<ReturnType<typeof getMemberArtefacts>>;
  topicProgress: TopicProgressRow[];
  assignedLevels: number[];
}

// ─── Main Component ───

const AppCohort: React.FC = () => {
  const { user } = useAuth();
  const { orgId, orgName, orgTier, members, loading: orgLoading } = useOrg();

  // Page-level state
  const [memberStats, setMemberStats] = useState<ScoredMember[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(Array(7).fill(0));
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Detail drawer state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Workshop state
  const [workshopSessions, setWorkshopSessions] = useState<Array<{ id: string; level: number; code: string; name: string; date: string | null; active: boolean }>>([]);

  // Cohort activity feed

  // Invite code state (no-org flow)
  const [inviteCode, setInviteCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [joinError, setJoinError] = useState('');

  // Refs
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const drawerCacheRef = useRef<Map<string, DrawerData>>(new Map());

  // ─── Data loading ───

  useEffect(() => {
    if (!orgId || !user) { setStatsLoading(false); return; }
    setStatsLoading(true);
    drawerCacheRef.current.clear();
    Promise.all([
      getOrgLeaderboard(orgId, user.id),
      getOrgWeeklyActivity(orgId),
      getOrgWorkshopSessions(orgId),
    ]).then(([stats, activity, workshops]) => {
      setMemberStats(stats);
      setWeeklyActivity(activity);
      setWorkshopSessions(workshops);
      setStatsLoading(false);
    });
  }, [orgId, user]);

  // ─── Drawer data loading ───

  useEffect(() => {
    if (!selectedMemberId) {
      setDrawerData(null);
      return;
    }
    const cached = drawerCacheRef.current.get(selectedMemberId);
    if (cached) {
      setDrawerData(cached);
      return;
    }
    setDrawerLoading(true);
    Promise.all([
      getMemberArtefacts(selectedMemberId),
      getAllTopicProgress(selectedMemberId),
      getLatestLearningPlan(selectedMemberId),
    ]).then(([artefacts, topicProgress, planResult]) => {
      const assignedLevels = [1, 2, 3, 4, 5].filter(lvl => {
        const depth = planResult?.level_depths?.[`L${lvl}`];
        return depth && depth !== 'skip';
      });
      const data: DrawerData = { artefacts, topicProgress, assignedLevels };
      drawerCacheRef.current.set(selectedMemberId, data);
      setDrawerData(data);
      setDrawerLoading(false);
    });
  }, [selectedMemberId]);

  // ─── Keyboard handler ───

  const filteredMembers = useMemo(() => {
    let list = [...memberStats];
    if (levelFilter !== null) list = list.filter(m => m.level === levelFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.fullName.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const dir = sortDirection === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'score': return (a.score - b.score) * dir;
        case 'name': return a.fullName.localeCompare(b.fullName) * dir;
        case 'level': return (a.level - b.level) * dir || (b.score - a.score);
        case 'completion': return (a.completionPct - b.completionPct) * dir;
        case 'streak': return (a.streakDays - b.streakDays) * dir;
        case 'active': return (a.activeDays30 - b.activeDays30) * dir;
        default: return b.score - a.score;
      }
    });
    return list;
  }, [memberStats, levelFilter, searchQuery, sortBy, sortDirection]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMemberId) {
        setSelectedMemberId(null);
      }
      if (selectedMemberId && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const idx = filteredMembers.findIndex(m => m.userId === selectedMemberId);
        if (idx === -1) return;
        const nextIdx = e.key === 'ArrowDown'
          ? Math.min(idx + 1, filteredMembers.length - 1)
          : Math.max(idx - 1, 0);
        setSelectedMemberId(filteredMembers[nextIdx].userId);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedMemberId, filteredMembers]);

  // ─── Close sort dropdown on outside click ───

  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sortDropdownOpen]);

  // ─── Derived values ───

  const selectedMember = selectedMemberId
    ? memberStats.find(m => m.userId === selectedMemberId) ?? null
    : null;

  const levelDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  memberStats.forEach(m => { levelDist[m.level] = (levelDist[m.level] || 0) + 1; });
  const maxLevelCount = Math.max(...Object.values(levelDist), 1);

  const avgCompletion = memberStats.length > 0
    ? Math.round(memberStats.reduce((a, m) => a + m.completionPct, 0) / memberStats.length)
    : 0;

  const avgScore = memberStats.length > 0
    ? Math.round(memberStats.reduce((a, m) => a + m.score, 0) / memberStats.length)
    : 0;

  const totalArtefacts = memberStats.reduce((a, m) => a + m.artefactCount, 0);

  const activeThisWeek = weeklyActivity.reduce((a, b) => a + b, 0);

  const maxActivity = Math.max(...weeklyActivity, 1);

  // Engagement: % of members active in last 30 days
  const activeMembersCount = memberStats.filter(m => m.activeDays30 > 0).length;
  const engagementPct = memberStats.length > 0
    ? Math.round((activeMembersCount / memberStats.length) * 100)
    : 0;

  // Avg active days per active member
  const avgActiveDays = activeMembersCount > 0
    ? Math.round(memberStats.filter(m => m.activeDays30 > 0).reduce((a, m) => a + m.activeDays30, 0) / activeMembersCount)
    : 0;

  // Avg streak among members with streaks
  const membersWithStreaks = memberStats.filter(m => m.streakDays > 0);
  const avgStreak = membersWithStreaks.length > 0
    ? Math.round(membersWithStreaks.reduce((a, m) => a + m.streakDays, 0) / membersWithStreaks.length)
    : 0;

  const avgLevel = members.length > 0
    ? (members.reduce((s, m) => s + m.currentLevel, 0) / members.length).toFixed(1)
    : '0';
  const activeCount = activeMembersCount;

  // Your Standing — current user's position
  const currentUserStats = memberStats.find(m => m.isCurrentUser);
  const myRank = currentUserStats
    ? [...memberStats].sort((a, b) => b.score - a.score).findIndex(m => m.userId === currentUserStats.userId) + 1
    : 0;
  const myPercentile = memberStats.length > 1 && myRank > 0
    ? Math.round(((memberStats.length - myRank) / (memberStats.length - 1)) * 100)
    : 0;
  const scoreVsAvg = currentUserStats && avgScore > 0
    ? Math.round(((currentUserStats.score - avgScore) / avgScore) * 100)
    : 0;

  // Upcoming workshop (next future session, or most recent active)
  const upcomingWorkshop = useMemo(() => {
    const now = new Date();
    const future = workshopSessions
      .filter(w => w.date && new Date(w.date) >= now)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    if (future.length > 0) return future[0];
    const activeSessions = workshopSessions.filter(w => w.active);
    return activeSessions.length > 0 ? activeSessions[0] : null;
  }, [workshopSessions]);

  // ─── Handlers ───

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

  const handleColumnSort = (col: SortKey) => {
    if (sortBy === col) {
      if (sortDirection === 'desc') setSortDirection('asc');
      else { setSortBy('score'); setSortDirection('desc'); }
    } else {
      setSortBy(col);
      setSortDirection(col === 'name' ? 'asc' : 'desc');
    }
  };

  // ─── Score breakdown helper ───

  const getScoreBreakdown = (m: ScoredMember) => {
    const phasesScore = (m.completionPct / 100) * m.score; // approximate
    // Use the scoring formula from the PRD
    const artefactScore = Math.min(m.artefactCount, 20) * 25;
    const insightScore = Math.min(m.insightCount, 10) * 30;
    const streakScore = Math.min(m.streakDays, 14) * 5;
    const activeScore = Math.min(m.activeDays30, 30) * 2;
    const phaseScore = Math.max(m.score - artefactScore - insightScore - streakScore - activeScore, 0);
    return [
      { ...SCORE_BREAKDOWN_COMPONENTS[0], value: phaseScore },
      { ...SCORE_BREAKDOWN_COMPONENTS[1], value: artefactScore },
      { ...SCORE_BREAKDOWN_COMPONENTS[2], value: insightScore },
      { ...SCORE_BREAKDOWN_COMPONENTS[3], value: streakScore },
      { ...SCORE_BREAKDOWN_COMPONENTS[4], value: activeScore },
    ];
  };

  // ─── Loading state ───

  if (orgLoading || statsLoading) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{COHORT_STYLES}</style>
        <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC', borderRadius: '50%', animation: 'cohort-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  // ─── No-org state ───

  if (!orgId) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 6px', letterSpacing: '-0.4px' }}>My Cohort</h1>
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
                  flex: 1, border: '1px solid #E2E8F0', borderRadius: 10,
                  padding: '12px 16px', fontSize: 16, fontWeight: 600, color: '#1A202C',
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center',
                }}
              />
              <button
                onClick={handleJoin}
                disabled={!inviteCode.trim() || joinStatus === 'loading'}
                style={{
                  background: inviteCode.trim() ? '#38B2AC' : '#A0AEC0', color: '#FFFFFF',
                  border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14,
                  fontWeight: 600, cursor: inviteCode.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <button
            onClick={() => {
              const email = user?.email || '';
              const subject = encodeURIComponent('Request: Organisation Invite Code');
              const body = encodeURIComponent(
                `Hi,\n\nI'm using the OXYGY AI Upskilling platform and would like to join my organisation's cohort.\n\nCould you please send me the invite code?\n\nMy account email: ${email}\n\nThanks!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 20px', border: '1px solid #E2E8F0', borderRadius: 10,
              background: '#F7FAFC', fontSize: 14, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
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

  // ─── Main dashboard render ───

  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  // Engagement health thresholds
  const engagementColor = engagementPct >= 70 ? '#48BB78' : engagementPct >= 40 ? '#ECC94B' : '#FC8181';
  const engagementLabel = engagementPct >= 70 ? 'Healthy' : engagementPct >= 40 ? 'Moderate' : 'Needs Attention';

  // Top 3 for podium
  const top3 = [...memberStats].sort((a, b) => b.score - a.score).slice(0, 3);

  // Selected member's rank (in global score order)
  const globalRanked = [...memberStats].sort((a, b) => b.score - a.score);
  const selectedRank = selectedMember
    ? globalRanked.findIndex(m => m.userId === selectedMember.userId) + 1
    : 0;

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{COHORT_STYLES}</style>

      {/* Page Header */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '0 0 6px', letterSpacing: '-0.4px', fontFamily: "'DM Sans', sans-serif" }}>
        My Cohort
      </h1>
      <p style={{ fontSize: 14, color: '#718096', margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif" }}>
        Your team's AI upskilling progress at a glance
      </p>

      {/* Org Info Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 24px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName}</span>
          {orgTier && (
            <span style={{ background: '#E6FFFA', color: '#38B2AC', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
              {orgTier}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#718096' }}>
          {members.length} member{members.length !== 1 ? 's' : ''} &middot; Avg Level {avgLevel} &middot; {activeCount} active this week
        </div>
      </div>

      {/* Workshop Banner */}
      {upcomingWorkshop && (
        <div style={{
          background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)',
          borderRadius: 14, padding: '18px 24px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 16,
          animation: 'cohortCardFadeIn 0.4s ease both',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(56, 178, 172, 0.15)', border: '1px solid rgba(56, 178, 172, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Calendar size={20} color="#38B2AC" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38B2AC', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              {upcomingWorkshop.date && new Date(upcomingWorkshop.date) >= new Date() ? 'Upcoming Workshop' : 'Active Workshop'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {upcomingWorkshop.name || `Level ${upcomingWorkshop.level} Workshop`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
              background: (LEVEL_ACCENT_COLORS[upcomingWorkshop.level] || '#E2E8F0') + '33',
              color: LEVEL_ACCENT_COLORS[upcomingWorkshop.level] || '#FFFFFF',
            }}>
              Level {upcomingWorkshop.level}
            </span>
            {upcomingWorkshop.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CBD5E0', fontSize: 13, fontWeight: 600 }}>
                <Clock size={14} color="#718096" />
                {new Date(upcomingWorkshop.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}
                {new Date(upcomingWorkshop.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* ─── LEFT: Table + Bottom Cards ─── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Level Filter Pills + Sort/Search Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                    borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 150ms ease',
                  }}
                >
                  {lvl === null ? 'All' : `L${lvl}`}
                </button>
              );
            })}

            {/* Sort + Search (right-aligned to table edge) */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Sort Dropdown */}
              <div ref={sortDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  style={{
                    background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                    padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  Sort: {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
                  <ChevronDown size={12} color="#A0AEC0" />
                </button>
                {sortDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                    padding: '6px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    zIndex: 20, minWidth: 170,
                  }}>
                    {SORT_OPTIONS.map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setSortDirection(opt.key === 'name' ? 'asc' : 'desc'); setSortDropdownOpen(false); }}
                        style={{
                          padding: '8px 16px', fontSize: 13,
                          fontWeight: sortBy === opt.key ? 700 : 500,
                          color: sortBy === opt.key ? '#1A202C' : '#2D3748',
                          cursor: 'pointer', transition: 'background 100ms ease',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F7FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {sortBy === opt.key && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38B2AC', flexShrink: 0 }} />
                        )}
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#A0AEC0" style={{ position: 'absolute', left: 10, top: 8 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  style={{
                    border: '1px solid #E2E8F0', borderRadius: 20, padding: '5px 14px 5px 30px',
                    fontSize: 12, color: '#1A202C', fontFamily: "'DM Sans', sans-serif",
                    outline: 'none', width: 160,
                  }}
                />
              </div>
            </div>
          </div>

        {/* Member Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            background: '#F7FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 20px',
            display: 'grid', gridTemplateColumns: '40px 1fr 56px 60px 110px 56px 68px 68px',
            alignItems: 'center', gap: 8,
          }}>
            {[
              { label: '#', key: null as SortKey | null, width: undefined },
              { label: 'MEMBER', key: 'name' as SortKey, width: undefined },
              { label: 'LVL', key: 'level' as SortKey, width: undefined },
              { label: 'SCORE', key: 'score' as SortKey, width: undefined },
              { label: 'PROGRESS', key: 'completion' as SortKey, width: undefined },
              { label: 'STREAK', key: 'streak' as SortKey, width: undefined },
              { label: 'SAVED', key: null as SortKey | null, width: undefined },
              { label: 'ACTIVE', key: 'active' as SortKey, width: undefined },
            ].map((col, ci) => (
              <div
                key={ci}
                onClick={() => col.key && handleColumnSort(col.key)}
                style={{
                  fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
                  letterSpacing: '0.04em', fontFamily: "'DM Sans', sans-serif", userSelect: 'none',
                  cursor: col.key ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                {col.label}
                {col.key && sortBy === col.key && (
                  sortDirection === 'desc'
                    ? <ChevronDown size={10} color="#1A202C" />
                    : <ChevronUp size={10} color="#1A202C" />
                )}
                {col.key && sortBy !== col.key && (
                  <ChevronDown size={10} color="#CBD5E0" />
                )}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Users size={32} color="#CBD5E0" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>
                No members match your filters
              </div>
              <div style={{ fontSize: 13, color: '#A0AEC0' }}>
                Try adjusting your search or level filter
              </div>
            </div>
          ) : (
            filteredMembers.map((m, idx) => {
              const isSelected = selectedMemberId === m.userId;
              const showMedal = sortBy === 'score' && idx < 3;
              const accent = LEVEL_ACCENT_COLORS[m.level] || '#E2E8F0';
              const accentDark = LEVEL_ACCENT_DARK_COLORS[m.level] || '#4A5568';
              const activeColor = m.activeDays30 >= 15 ? '#38A169' : m.activeDays30 >= 5 ? '#718096' : '#E53E3E';

              return (
                <div
                  key={m.userId}
                  onClick={() => setSelectedMemberId(isSelected ? null : m.userId)}
                  style={{
                    background: isSelected ? '#EDF2F7' : m.isCurrentUser ? 'rgba(56, 178, 172, 0.04)' : '#FFFFFF',
                    borderBottom: '1px solid #F1F5F9',
                    borderLeft: isSelected ? '3px solid #1A202C' : m.isCurrentUser ? '3px solid #38B2AC' : 'none',
                    padding: '12px 20px',
                    paddingLeft: (isSelected || m.isCurrentUser) ? 17 : 20,
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 56px 60px 110px 56px 68px 68px',
                    alignItems: 'center', gap: 8, cursor: 'pointer',
                    transition: 'background 150ms ease',
                    animation: idx < 15 ? `cohortRowFadeIn 0.3s ease both` : undefined,
                    animationDelay: idx < 15 ? `${idx * 40}ms` : undefined,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = m.isCurrentUser ? 'rgba(56, 178, 172, 0.06)' : '#F7FAFC'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = m.isCurrentUser ? 'rgba(56, 178, 172, 0.04)' : '#FFFFFF'; }}
                >
                  {/* Rank */}
                  <div style={{ textAlign: 'center' }}>
                    {showMedal ? (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#FFFFFF', margin: '0 auto',
                        background: MEDAL_GRADIENTS[idx], boxShadow: MEDAL_SHADOWS[idx],
                      }}>
                        {idx + 1}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#718096' }}>{idx + 1}</span>
                    )}
                  </div>

                  {/* Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: m.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#1A202C', flexShrink: 0,
                    }}>
                      {m.initials}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.fullName}
                      {m.isCurrentUser && <span style={{ fontSize: 9, fontWeight: 600, color: '#38B2AC', marginLeft: 4 }}>(You)</span>}
                    </span>
                  </div>

                  {/* Level */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: accent + '55', color: accentDark }}>
                      L{m.level}
                    </span>
                  </div>

                  {/* Score */}
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A202C', textAlign: 'right' }}>
                    {m.score}
                  </div>

                  {/* Progress */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#718096' }}>{m.completionPct}%</div>
                    <div style={{ height: 6, background: '#EDF2F7', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
                      <div style={{
                        height: '100%', background: accent, borderRadius: 3,
                        transition: 'width 0.4s ease', width: `${m.completionPct}%`,
                        minWidth: m.completionPct > 0 ? 4 : 0,
                      }} />
                    </div>
                  </div>

                  {/* Streak */}
                  <div style={{ fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {m.streakDays > 0 ? (
                      <><Flame size={12} color="#F6AD55" />{m.streakDays}d</>
                    ) : (
                      <span style={{ color: '#CBD5E0' }}>—</span>
                    )}
                  </div>

                  {/* Artefacts */}
                  <div style={{ fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FolderOpen size={12} color="#A0AEC0" />{m.artefactCount}
                  </div>

                  {/* Active Days */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeColor }}>
                    {m.activeDays30}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom cards: Level Distribution + Weekly Activity (below table) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Level Distribution */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', animation: 'cohortCardFadeIn 0.4s ease both', animationDelay: '160ms' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Level Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((lvl, li) => {
                const count = levelDist[lvl] || 0;
                const pct = (count / maxLevelCount) * 100;
                const isActive = levelFilter === lvl;
                return (
                  <div
                    key={lvl}
                    onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '4px 6px', borderRadius: 8, transition: 'background 150ms ease',
                      background: isActive ? '#F7FAFC' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F7FAFC')}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? '#1A202C' : '#4A5568', width: 26, flexShrink: 0 }}>L{lvl}</span>
                    <div style={{ flex: 1, height: 20, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%', background: LEVEL_ACCENT_COLORS[lvl], borderRadius: 5,
                        transition: 'width 0.5s ease', width: `${pct}%`,
                        minWidth: count > 0 ? 8 : 0,
                        animationDelay: `${li * 60}ms`,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Activity */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', animation: 'cohortCardFadeIn 0.4s ease both', animationDelay: '240ms' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Weekly Activity</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, padding: '8px 0' }}>
              {DAY_LABELS.map((label, i) => {
                const val = weeklyActivity[i] || 0;
                const barH = Math.max((val / maxActivity) * 130, val > 0 ? 8 : 0);
                const isToday = i === todayIdx;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1A202C', minHeight: 14 }}>{val}</span>
                    <div style={{
                      width: '100%', height: barH, borderRadius: 4,
                      background: isToday ? 'linear-gradient(to top, #2C9A94, #38B2AC)' : '#38B2AC',
                      transition: 'height 0.5s ease',
                      boxShadow: isToday ? '0 0 8px rgba(56, 178, 172, 0.3)' : undefined,
                      animation: isToday ? 'cohortTodayPulse 2s ease-in-out infinite' : undefined,
                    }} />
                    <span style={{ fontSize: 10, fontWeight: isToday ? 700 : 500, color: isToday ? '#1A202C' : '#718096' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        </div>{/* end LEFT column */}

        {/* ─── RIGHT: Analytics Sidebar ─── */}
        <div style={{
          width: 340, flexShrink: 0, position: 'sticky', top: 74,
          maxHeight: 'calc(100vh - 94px)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
          scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent',
        }}>
          {/* Card 1: Cohort Snapshot */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 18px', animation: 'cohortCardFadeIn 0.4s ease both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Cohort Snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <SnapshotCell value={memberStats.length} label="Members" />
              <SnapshotCell value={avgCompletion} label="Avg Progress" suffix="%" />
              <SnapshotCell value={totalArtefacts} label="Artefacts" />
              <SnapshotCell value={avgScore} label="Avg Score" />
            </div>
          </div>

          {/* Card 2: Your Standing */}
          {currentUserStats && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', animation: 'cohortCardFadeIn 0.4s ease both', animationDelay: '80ms' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Your Standing</div>

              {/* Rank + Percentile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: myRank <= 3 ? MEDAL_GRADIENTS[myRank - 1] : '#EDF2F7',
                  color: myRank <= 3 ? '#FFFFFF' : '#1A202C',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>#{myRank}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>of {memberStats.length}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 4 }}>
                    Top {Math.max(100 - myPercentile, 1)}% of your cohort
                  </div>
                  <div style={{ height: 6, background: '#EDF2F7', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, #38B2AC, #667EEA)',
                      width: `${myPercentile}%`, transition: 'width 0.6s ease',
                      minWidth: myPercentile > 0 ? 4 : 0,
                    }} />
                  </div>
                </div>
              </div>

              {/* Stats rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#718096' }}>Your score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{currentUserStats.score} pts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#718096' }}>vs cohort avg</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {scoreVsAvg > 0 ? <TrendingUp size={12} color="#48BB78" /> : scoreVsAvg < 0 ? <TrendingDown size={12} color="#FC8181" /> : <Minus size={12} color="#A0AEC0" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreVsAvg > 0 ? '#48BB78' : scoreVsAvg < 0 ? '#FC8181' : '#A0AEC0' }}>
                      {scoreVsAvg > 0 ? '+' : ''}{scoreVsAvg}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#718096' }}>Your streak</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {currentUserStats.streakDays > 0 && <Flame size={12} color="#F6AD55" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{currentUserStats.streakDays > 0 ? `${currentUserStats.streakDays}d` : '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#718096' }}>Completion</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{currentUserStats.completionPct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Top Performers */}
          {top3.length >= 2 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', animation: 'cohortCardFadeIn 0.4s ease both', animationDelay: '160ms' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Top Performers</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, padding: '12px 0 4px' }}>
                {/* Order: 2nd, 1st, 3rd */}
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((m, vi) => {
                  const actualRank = vi === 0 ? 2 : vi === 1 ? 1 : 3;
                  const idx = actualRank - 1;
                  const avatarSize = actualRank === 1 ? 48 : 40;
                  const fontSize = actualRank === 1 ? 16 : 14;
                  const borderColor = actualRank === 1 ? '#D69E2E' : actualRank === 2 ? '#A0AEC0' : '#C8875D';
                  const borderWidth = actualRank === 1 ? 3 : 2;
                  const podiumHeight = actualRank === 1 ? 48 : actualRank === 2 ? 32 : 24;
                  const podiumBg = [
                    'linear-gradient(to top, #CBD5E033, #A0AEC022)',
                    'linear-gradient(to top, #F6E05E33, #D69E2E22)',
                    'linear-gradient(to top, #EDCBAB33, #C8875D22)',
                  ][vi];

                  return (
                    <div key={m.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {/* Avatar with rank badge */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: avatarSize, height: avatarSize, borderRadius: '50%', background: m.avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize, fontWeight: 700, color: '#1A202C',
                          border: `${borderWidth}px solid ${borderColor}`,
                          boxShadow: actualRank === 1 ? '0 0 0 3px rgba(214, 158, 46, 0.2)' : undefined,
                        }}>
                          {m.initials}
                        </div>
                        <div style={{
                          position: 'absolute', bottom: -2, right: -2,
                          width: 18, height: 18, borderRadius: '50%',
                          background: MEDAL_GRADIENTS[idx],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 800, color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                        }}>
                          {actualRank}
                        </div>
                      </div>
                      {/* Name */}
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1A202C', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.fullName.split(' ')[0]}
                      </span>
                      {/* Score */}
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1A202C' }}>{m.score}</span>
                      <span style={{ fontSize: 9, color: '#A0AEC0', marginTop: -2 }}>pts</span>
                      {/* Podium bar */}
                      <div style={{
                        width: '100%', borderRadius: '4px 4px 0 0', height: podiumHeight,
                        background: podiumBg,
                        animation: `cohortPodiumGrow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                        animationDelay: vi === 1 ? '0ms' : vi === 0 ? '150ms' : '300ms',
                        transformOrigin: 'bottom',
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Detail Drawer Backdrop ─── */}
      {selectedMemberId && (
        <div
          onClick={() => setSelectedMemberId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.15)',
            zIndex: 39, cursor: 'pointer', transition: 'opacity 200ms ease',
          }}
        />
      )}

      {/* ─── Detail Drawer ─── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
        background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.06)', zIndex: 40,
        overflowY: 'auto', padding: 0,
        transform: selectedMemberId ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {selectedMember && (
          <>
            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 0', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1, borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
              {/* Close button */}
              <button
                onClick={() => setSelectedMemberId(null)}
                style={{
                  position: 'absolute', top: 16, right: 16, width: 32, height: 32,
                  borderRadius: 8, background: '#F7FAFC', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EDF2F7')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F7FAFC')}
              >
                <X size={16} color="#718096" />
              </button>

              {/* Member identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: selectedMember.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#1A202C', flexShrink: 0,
                }}>
                  {selectedMember.initials}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C' }}>
                    {selectedMember.fullName}
                    {selectedMember.isCurrentUser && <span style={{ fontSize: 10, color: '#38B2AC', marginLeft: 6 }}>(You)</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: (LEVEL_ACCENT_COLORS[selectedMember.level] || '#E2E8F0') + '55',
                      color: LEVEL_ACCENT_DARK_COLORS[selectedMember.level] || '#4A5568',
                    }}>
                      L{selectedMember.level}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {selectedMember.role || 'Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score highlight */}
              <div style={{ background: '#F7FAFC', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' }}>Total Score</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#1A202C' }}>{selectedMember.score}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {selectedRank <= 3 ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#FFFFFF',
                      background: MEDAL_GRADIENTS[selectedRank - 1],
                      boxShadow: MEDAL_SHADOWS[selectedRank - 1],
                    }}>
                      {selectedRank}
                    </div>
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#718096', background: '#EDF2F7',
                    }}>
                      {selectedRank}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#A0AEC0' }}>Rank #{selectedRank}</div>
                </div>
              </div>
            </div>

            {/* Drawer Body */}
            <div>
              {/* Assigned Levels */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '20px 24px 10px' }}>
                  Assigned Levels
                </div>
                <div style={{ padding: '0 24px 20px', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {drawerLoading ? (
                    <ShimmerRows count={1} />
                  ) : (
                    [1, 2, 3, 4, 5].map(lvl => {
                      const isAssigned = drawerData?.assignedLevels?.includes(lvl) ?? false;
                      const accent = LEVEL_ACCENT_COLORS[lvl] || '#E2E8F0';
                      const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl] || '#718096';
                      return (
                        <div key={lvl} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: isAssigned ? `${accent}33` : '#F7FAFC',
                          border: `1px solid ${isAssigned ? accent : '#E2E8F0'}`,
                          color: isAssigned ? accentDark : '#A0AEC0',
                        }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: isAssigned ? accentDark : '#CBD5E0',
                            flexShrink: 0,
                          }} />
                          Level {lvl}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '0 24px' }} />

              {/* Score Breakdown */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '20px 24px 10px' }}>
                  Score Breakdown
                </div>
                <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {getScoreBreakdown(selectedMember).map((comp) => (
                    <div key={comp.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: SCORE_ICON_BG[comp.key] || '#F7FAFC',
                        color: SCORE_ICON_COLOR[comp.key] || '#718096',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {SCORE_ICONS[comp.key]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#4A5568', flex: 1 }}>{comp.label}</span>
                      <div style={{ width: 80, height: 5, background: '#EDF2F7', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{
                          height: '100%', background: comp.color, borderRadius: 3,
                          width: selectedMember.score > 0 ? `${Math.min((comp.value / selectedMember.score) * 100, 100)}%` : '0%',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C', width: 36, textAlign: 'right' as const }}>{comp.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '0 24px' }} />

              {/* Saved Artefacts */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '20px 24px 10px' }}>
                  Saved Artefacts ({drawerData?.artefacts?.length ?? 0})
                </div>
                <div style={{ padding: '0 24px 20px' }}>
                  {drawerLoading ? (
                    <ShimmerRows count={2} />
                  ) : drawerData?.artefacts && drawerData.artefacts.length > 0 ? (
                    drawerData.artefacts.map(art => {
                      const artAccent = LEVEL_ACCENT_COLORS[art.level] || '#E2E8F0';
                      const artAccentDark = LEVEL_ACCENT_DARK_COLORS[art.level] || '#4A5568';
                      return (
                        <div key={art.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F7FAFC', borderRadius: 8, marginBottom: 5, border: '1px solid #F1F5F9' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: artAccent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={14} color={artAccentDark} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {art.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#A0AEC0' }}>
                              {art.sourceTool || 'Unknown'} &middot; L{art.level}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: '#A0AEC0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {new Date(art.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 13, color: '#A0AEC0', textAlign: 'center', padding: '20px 0' }}>No artefacts saved yet</div>
                  )}
                </div>
              </div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '0 24px' }} />

              {/* Completion Map */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '20px 24px 10px' }}>
                  Completion Map
                </div>
                <div style={{ padding: '0 24px 24px' }}>
                  {drawerLoading ? (
                    <ShimmerRows count={3} />
                  ) : drawerData?.topicProgress && drawerData.topicProgress.length > 0 ? (
                    (() => {
                      const byLevel: Record<number, TopicProgressRow[]> = {};
                      drawerData.topicProgress.forEach(tp => {
                        if (!byLevel[tp.level]) byLevel[tp.level] = [];
                        byLevel[tp.level].push(tp);
                      });
                      const assignedSet = new Set(drawerData?.assignedLevels || [1, 2, 3, 4, 5]);
                      return Object.keys(byLevel)
                        .sort((a, b) => Number(a) - Number(b))
                        .filter(lvlStr => assignedSet.has(Number(lvlStr)))
                        .map(lvlStr => {
                        const lvl = Number(lvlStr);
                        const topics = byLevel[lvl];
                        const accent = LEVEL_ACCENT_COLORS[lvl] || '#E2E8F0';
                        const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl] || '#4A5568';
                        return (
                          <div key={lvl} style={{ marginBottom: 14 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: accentDark, background: accent + '33', padding: '2px 10px', borderRadius: 8, display: 'inline-block', marginBottom: 8 }}>
                              Level {lvl}
                            </span>
                            {topics.map(tp => {
                              const topicMeta = LEVEL_TOPICS[lvl]?.find(t => t.id === tp.topic_id);
                              const phases = [
                                { name: 'E-Learn', done: !!tp.elearn_completed_at },
                                { name: 'Read', done: !!tp.read_completed_at },
                                { name: 'Watch', done: !!tp.watch_completed_at },
                                { name: 'Practice', done: !!tp.practise_completed_at },
                              ];
                              return (
                                <div key={tp.topic_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#F7FAFC', borderRadius: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 500, color: '#4A5568', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {topicMeta?.title || `Topic ${tp.topic_id}`}
                                  </span>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {phases.map(p => (
                                      <div
                                        key={p.name}
                                        title={`${p.name}: ${p.done ? 'Completed' : 'Not started'}`}
                                        style={{
                                          width: 16, height: 16, borderRadius: 4,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          background: p.done ? accent : '#EDF2F7',
                                          border: p.done ? 'none' : '1px solid #E2E8F0',
                                          fontSize: 8, color: accentDark,
                                        }}
                                      >
                                        {p.done && '✓'}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div style={{ fontSize: 13, color: '#A0AEC0', textAlign: 'center', padding: '16px 0' }}>No progress data yet</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───

const SnapshotCell: React.FC<{ value: number; label: string; suffix?: string }> = ({ value, label, suffix }) => {
  const animated = useCountUp(value);
  return (
    <div
      style={{
        background: '#F7FAFC', borderRadius: 10, padding: '14px 12px', textAlign: 'center',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', lineHeight: 1, marginBottom: 4 }}>
        {animated}{suffix || ''}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
};

const ShimmerRows: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ height: 14, background: '#EDF2F7', borderRadius: 4, animation: 'cohortShimmer 1.2s ease-in-out infinite' }} />
    ))}
  </div>
);

export default AppCohort;
