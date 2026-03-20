import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Trophy, Flame, Target, BookOpen, PenTool, KeyRound, Mail, Users, ChevronRight, Zap, FolderOpen, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import LearningPlanBlocker from '../../components/app/LearningPlanBlocker';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData, LeaderboardMember } from '../../hooks/useDashboardData';
import { validateAndAcceptInvite } from '../../lib/database';
import {
  LEVEL_TOPICS,
  LEVEL_FULL_NAMES,
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
} from '../../data/levelTopics';
import { timeAgo } from '../../utils/timeAgo';

/* ─── Greeting helper ─── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─── Animations ─── */
const pulseStyle = `
@keyframes skeletonPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

function Skeleton({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#E2E8F0',
        animation: 'skeletonPulse 1s ease-in-out infinite',
      }}
    />
  );
}

/* ─── Progress Ring SVG ─── */
function ProgressRing({
  completed,
  total,
  accentColor,
  size = 96,
  strokeWidth = 8,
}: {
  completed: number;
  total: number;
  accentColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={accentColor + '44'} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#38B2AC" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 60 ? 20 : 14, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{displayPct}%</span>
        {size > 60 && <span style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{completed} / {total}</span>}
      </div>
    </div>
  );
}

/* ─── Leaderboard Row ─── */
const LeaderboardRow: React.FC<{ member: LeaderboardMember; rank: number }> = ({ member, rank }) => {
  const levelAccent = LEVEL_ACCENT_COLORS[member.level] || '#E2E8F0';
  const isTop3 = rank <= 3;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        background: member.isCurrentUser ? '#F0FFF4' : '#FFFFFF',
        border: member.isCurrentUser ? '1.5px solid #38B2AC' : '1px solid #F1F5F9',
        transition: 'background 0.12s',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
          background: rank === 1 ? '#F7E8A4' : rank === 2 ? '#E2E8F0' : rank === 3 ? '#FED7AA' : 'transparent',
          color: rank === 1 ? '#8A6A00' : rank === 2 ? '#4A5568' : rank === 3 ? '#9C4221' : '#718096',
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: member.avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#1A202C',
          flexShrink: 0,
          border: member.isCurrentUser ? '2px solid #38B2AC' : '2px solid #FFFFFF',
        }}
      >
        {member.initials}
      </div>

      {/* Name + Level */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: member.isCurrentUser ? 700 : 600, color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.name} {member.isCurrentUser && <span style={{ fontSize: 10, color: '#38B2AC', fontWeight: 600 }}>(You)</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 10,
              background: levelAccent + '55',
              color: LEVEL_ACCENT_DARK_COLORS[member.level] || '#4A5568',
            }}
          >
            L{member.level}
          </span>
          {member.streakDays > 0 && (
            <span style={{ fontSize: 10, color: '#718096', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Flame size={9} color="#F6AD55" /> {member.streakDays}d
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: isTop3 ? '#1A202C' : '#4A5568', lineHeight: 1 }}>
          {member.score}
        </div>
        <div style={{ fontSize: 9, color: '#A0AEC0', marginTop: 1 }}>pts</div>
      </div>
    </div>
  );
};

/* ─── Journey Step Indicator ─── */
function JourneySteps({ currentLevel, levelsCompleted }: { currentLevel: number; levelsCompleted: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {[1, 2, 3, 4, 5].map((lvl) => {
        const isCompleted = lvl <= levelsCompleted;
        const isCurrent = lvl === currentLevel;
        const accent = LEVEL_ACCENT_COLORS[lvl];
        const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl];

        return (
          <React.Fragment key={lvl}>
            {lvl > 1 && (
              <div style={{ width: 24, height: 2, background: isCompleted || isCurrent ? '#1A202C' : '#E2E8F0', flexShrink: 0 }} />
            )}
            <div
              style={{
                width: isCurrent ? 34 : 28,
                height: isCurrent ? 34 : 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isCompleted ? '#1A202C' : isCurrent ? accent : '#F1F5F9',
                border: isCurrent ? `2.5px solid ${accentDark}` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isCompleted ? (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <span style={{ fontSize: isCurrent ? 13 : 11, fontWeight: 800, color: isCurrent ? accentDark : '#A0AEC0' }}>
                  {lvl}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */
const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, hasLearningPlan, learningPlanLoading, projectSubmissions } = useAppContext();
  const { data, loading } = useDashboardData();

  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';

  // Org invite code state (for no-org users)
  const [inviteCode, setInviteCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [joinError, setJoinError] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [weekExpanded, setWeekExpanded] = useState(false);
  const [levelDepths, setLevelDepths] = useState<Record<string, string>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      import('../../lib/database').then(({ getLatestLearningPlan }) => {
        getLatestLearningPlan(user.id).then(result => {
          if (result?.level_depths) setLevelDepths(result.level_depths);
        });
      });
    }
  }, [user]);

  const handleJoinOrg = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinStatus('loading');
    const result = await validateAndAcceptInvite(user.id, inviteCode.trim());
    if (result.success) {
      setJoinStatus('success');
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setJoinStatus('error');
      setJoinError(result.error || 'Invalid code');
    }
  };

  const handleRequestCode = async () => {
    if (!user?.email) return;
    setEmailSending(true);
    try {
      const res = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || '' }),
      });
      if (res.ok) setEmailSent(true);
    } catch { /* ignore */ }
    setEmailSending(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{pulseStyle}</style>
        <Skeleton width="100%" height={110} radius={16} />
        <div style={{ height: 18 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="100%" height={180} radius={16} />
            <Skeleton width="100%" height={200} radius={16} />
            <Skeleton width="100%" height={200} radius={16} />
          </div>
          <Skeleton width="100%" height={600} radius={16} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>Unable to load dashboard</div>
        <div style={{ fontSize: 14, color: '#718096', marginBottom: 20 }}>Check the browser console for details, or try refreshing.</div>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '10px 24px', borderRadius: 8, background: '#38B2AC', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Refresh
        </button>
      </div>
    );
  }

  const level = data.currentLevel;
  const topics = LEVEL_TOPICS[level] || [];
  const totalTopics = topics.length;
  const accent = LEVEL_ACCENT_COLORS[level];
  const accentDark = LEVEL_ACCENT_DARK_COLORS[level];
  const levelFull = LEVEL_FULL_NAMES[level];
  const activeTopic = topics[data.activeTopicIndex];
  const phaseNames: Record<number, string> = { 1: 'E-Learning', 2: 'Practise' };


  const currentUserRank = data.leaderboard.findIndex(m => m.isCurrentUser) + 1;
  const currentUserData = data.leaderboard.find(m => m.isCurrentUser);

  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="Dashboard" />;

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{pulseStyle}</style>

      {/* ═══ Hero Strip ═══ */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.3s ease both',
        }}
      >
        <div style={{ position: 'absolute', right: 180, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247, 232, 164, 0.14)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(56, 178, 172, 0.07)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Left — greeting + journey */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, color: '#718096', fontWeight: 500, marginBottom: 2 }}>{getGreeting()}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 12 }}>
            {firstName}.
          </div>
          <JourneySteps currentLevel={level} levelsCompleted={data.levelsCompleted} />
          <div style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>
            Level {level} · <span style={{ fontWeight: 600, color: '#1A202C' }}>{levelFull}</span>
            {' — '}{data.overallCompletedTopics} of {data.overallTotalTopics} topics complete across all levels
          </div>
        </div>

        {/* Right — score + ring */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 14px', background: '#FAEEDA33',
            border: '1px solid #FAEEDA', borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Flame size={13} color="#BA7517" />
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>
                {data.streakDays}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#BA7517', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                day streak
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(() => {
                const now = new Date();
                const dow = now.getDay();
                const monBased = dow === 0 ? 6 : dow - 1;
                return ['M','T','W','T','F','S','S'].map((label, i) => {
                  const isActive = data.activeDaysThisWeek[i];
                  const isPast = i < monBased;
                  const isToday = i === monBased;
                  let bg = '#F7FAFC';
                  let border = '1px dashed #E2E8F0';
                  let checkColor = '';
                  if ((isPast || isToday) && isActive) { bg = isToday ? '#38B2AC' : '#A8F0E0'; border = 'none'; checkColor = isToday ? '#FFFFFF' : '#085041'; }
                  else if (isPast) { bg = '#F1F5F9'; border = '1px solid #E2E8F0'; }
                  return (
                    <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checkColor && <Check size={7} color={checkColor} strokeWidth={3} />}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          {currentUserData && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Your Score</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{currentUserData.score}</div>
              <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>Rank #{currentUserRank} of {data.leaderboard.length}</div>
            </div>
          )}
          <ProgressRing completed={data.overallCompletedTopics} total={data.overallTotalTopics} accentColor={accent} />
        </div>
      </div>

      {/* ═══ Main two-column layout ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 18,
          marginTop: 18,
          animation: 'fadeSlideUp 0.3s ease 0.08s both',
        }}
      >
        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Card: Resume Learning + Your Week integrated */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${accent}`,
              overflow: 'hidden',
            }}
          >
            {/* Top section — Resume Learning */}
            <div style={{ padding: '22px 26px', display: 'flex', gap: 20, alignItems: 'stretch' }}>
              {/* Left content area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {/* Header badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: accent + '55', color: accentDark, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: 20 }}>
                    LEVEL {level}
                  </span>
                  <span style={{ fontSize: 12, color: '#718096' }}>
                    Topic {data.activeTopicIndex + 1} of {totalTopics}
                  </span>
                </div>

                {/* Title + description */}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', letterSpacing: '-0.3px', marginBottom: 4 }}>
                    {activeTopic?.title || 'Getting Started'}
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>
                    {activeTopic?.description || ''}
                  </div>
                </div>
              </div>

              {/* Right CTA area */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 18,
                  padding: '12px 24px',
                  borderRadius: 14,
                  background: accent + '15',
                  flexShrink: 0,
                  alignSelf: 'stretch',
                }}
              >
                <ProgressRing completed={data.completedTopics} total={data.totalTopics} accentColor={accent} size={110} strokeWidth={8} />
                <button
                  onClick={() => navigate('/app/level?phase=1')}
                  style={{
                    background: '#1A202C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 24,
                    padding: '11px 26px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2D3748')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1A202C')}
                >
                  Resume <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ── Your Week — integrated footer strip ── */}
            {(() => {
              // ── Derive Learning stats ──
              const phaseLabels = ['E-Learning', 'Read', 'Watch', 'Practice'];
              const phaseCounts = [0, 0, 0, 0];
              Object.values(data.levelProgress).forEach(lp => {
                lp.phasesCompleted.forEach((done, i) => { if (done) phaseCounts[i]++; });
              });
              const totalPhasesThisWeek = phaseCounts.reduce((a, b) => a + b, 0);
              const maxPhase = Math.max(...phaseCounts, 1);

              // ── Derive Toolkit stats ──
              const TOOL_DISPLAY: Record<string, { name: string; level: number }> = {
                'prompt-playground': { name: 'Prompt Playground', level: 1 },
                'agent-builder': { name: 'Agent Builder', level: 2 },
                'workflow-canvas': { name: 'Workflow Canvas', level: 3 },
                'dashboard-designer': { name: 'Dashboard Designer', level: 4 },
                'ai-app-evaluator': { name: 'App Evaluator', level: 5 },
              };
              const toolEntries = Object.entries(data.toolUsage)
                .filter(([, u]) => u.artefactsCreated > 0)
                .map(([id, u]) => ({ id, ...TOOL_DISPLAY[id], count: u.artefactsCreated }))
                .filter(t => t.name)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              const totalArtefacts = Object.values(data.toolUsage).reduce((s, u) => s + u.artefactsCreated, 0);
              const toolCount = toolEntries.length;

              // ── Derive Project stats ──
              const assignedLevels = [1, 2, 3, 4, 5].filter(lvl => {
                const depth = levelDepths[`L${lvl}`];
                return !depth || depth !== 'skip';
              });
              const projectEntries = assignedLevels.map(lvl => {
                const sub = projectSubmissions[lvl];
                return { lvl, status: sub?.status || 'not-started' };
              });
              const activeProjects = projectEntries.filter(p => p.status !== 'not-started').length;

              // ── Verdict label ──
              const activeDaysCount = data.activeDaysThisWeek.filter(Boolean).length;
              const verdict = activeDaysCount >= 5 ? { label: 'Strong week', bg: '#F0FFF4', color: '#276749' }
                : activeDaysCount >= 3 ? { label: 'Good progress', bg: '#EBF8FF', color: '#2B6CB0' }
                : activeDaysCount >= 1 ? { label: 'Getting going', bg: '#FFFBEB', color: '#92400E' }
                : { label: 'Start today', bg: '#F7FAFC', color: '#718096' };

              const PROJECT_STATUS_STYLES: Record<string, { label: string; color: string; dot: string }> = {
                passed: { label: 'Passed ✓', color: '#276749', dot: '#48BB78' },
                submitted: { label: 'Under review', color: '#92400E', dot: '#ECC94B' },
                needs_revision: { label: 'Needs revision', color: '#C53030', dot: '#FC8181' },
                draft: { label: 'Draft saved', color: '#718096', dot: '#A0AEC0' },
                'not-started': { label: 'Not started', color: '#A0AEC0', dot: '#E2E8F0' },
              };

              const sectionStyle = { flex: 1, minWidth: 0, padding: '0 20px' };
              const dividerStyle = { width: 1, background: accentDark + '22', flexShrink: 0 };
              const colLabelStyle = { fontSize: 11, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 };
              const iconBoxStyle = (bg: string) => ({ width: 18, height: 18, borderRadius: 5, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 });
              const bigNumStyle = { fontSize: 30, fontWeight: 800, color: '#1A202C', lineHeight: 1, marginBottom: 2 };
              const bigSubStyle = { fontSize: 12, color: '#718096', marginBottom: 12 };
              const pillStyle = { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, background: '#FFFFFF', border: '1px solid ' + accent + '55', marginBottom: 5 };

              return (
                <div style={{ background: accent + '12', borderTop: '1px solid ' + accent + '33' }}>
                  {/* ── Collapsed header — always visible ── */}
                  <div
                    onClick={() => setWeekExpanded(!weekExpanded)}
                    style={{ padding: '16px 26px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0 }}
                  >
                    {/* Week label + verdict */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>Your Week</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 20, background: verdict.bg, color: verdict.color }}>
                        {verdict.label}
                      </span>
                    </div>
                    {/* Summary stats row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={iconBoxStyle('#EAF3DE')}>
                          <BookOpen size={11} color="#27500A" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{totalPhasesThisWeek}</span>
                        <span style={{ fontSize: 13, color: '#718096' }}>phases</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={iconBoxStyle('#E6FFFA')}>
                          <Zap size={11} color="#085041" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{totalArtefacts}</span>
                        <span style={{ fontSize: 13, color: '#718096' }}>artefacts</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={iconBoxStyle('#EEEDFE')}>
                          <FolderOpen size={11} color="#3C3489" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{activeProjects}</span>
                        <span style={{ fontSize: 13, color: '#718096' }}>projects</span>
                      </div>
                    </div>
                    <ChevronDown size={18} color="#A0AEC0" style={{ transition: 'transform 0.25s ease', transform: weekExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
                  </div>

                  {/* ── Expanded detail — only visible when open ── */}
                  <div style={{ maxHeight: weekExpanded ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease', borderTop: weekExpanded ? '1px solid ' + accent + '33' : 'none' }}>
                    <div style={{ padding: '18px 26px', display: 'flex', gap: 0, alignItems: 'flex-start' }}>

                      {/* Learning column */}
                      <div style={{ ...sectionStyle, paddingLeft: 0 }}>
                        <div style={colLabelStyle}>
                          <div style={iconBoxStyle('#EAF3DE')}><BookOpen size={11} color="#27500A" /></div>
                          Learning
                        </div>
                        <div style={bigNumStyle}>{totalPhasesThisWeek} <span style={{ fontSize: 14, color: '#718096', fontWeight: 500 }}>phases</span></div>
                        <div style={bigSubStyle}>Completed to date</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {phaseLabels.map((label, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#718096', width: 68, flexShrink: 0 }}>{label}</span>
                              <div style={{ flex: 1, height: 5, background: '#FFFFFF', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, background: LEVEL_ACCENT_COLORS[i + 1] || '#A8F0E0', width: `${(phaseCounts[i] / maxPhase) * 100}%`, transition: 'width 0.4s ease' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1A202C', width: 18, textAlign: 'right' as const }}>{phaseCounts[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={dividerStyle} />

                      {/* Toolkit column */}
                      <div style={sectionStyle}>
                        <div style={colLabelStyle}>
                          <div style={iconBoxStyle('#E6FFFA')}><Zap size={11} color="#085041" /></div>
                          Toolkit
                        </div>
                        <div style={bigNumStyle}>{totalArtefacts} <span style={{ fontSize: 14, color: '#718096', fontWeight: 500 }}>artefacts</span></div>
                        <div style={bigSubStyle}>Across {toolCount} tool{toolCount !== 1 ? 's' : ''}</div>
                        {toolEntries.length > 0 ? toolEntries.map(t => (
                          <div key={t.id} style={pillStyle}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: LEVEL_ACCENT_COLORS[t.level] || '#E2E8F0', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{t.count}</span>
                          </div>
                        )) : (
                          <div style={{ fontSize: 13, color: '#A0AEC0', fontStyle: 'italic' }}>No artefacts yet</div>
                        )}
                      </div>

                      <div style={dividerStyle} />

                      {/* Projects column */}
                      <div style={{ ...sectionStyle, paddingRight: 0 }}>
                        <div style={colLabelStyle}>
                          <div style={iconBoxStyle('#EEEDFE')}><FolderOpen size={11} color="#3C3489" /></div>
                          Projects
                        </div>
                        <div style={bigNumStyle}>{activeProjects} <span style={{ fontSize: 14, color: '#718096', fontWeight: 500 }}>active</span></div>
                        <div style={bigSubStyle}>Across assigned levels</div>
                        {projectEntries.map(({ lvl, status }) => {
                          const s = PROJECT_STATUS_STYLES[status] || PROJECT_STATUS_STYLES['not-started'];
                          const weekAccent = LEVEL_ACCENT_COLORS[lvl];
                          const weekAccentDk = LEVEL_ACCENT_DARK_COLORS[lvl];
                          return (
                            <div key={lvl} style={pillStyle}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: weekAccent + '33', color: weekAccentDk, flexShrink: 0 }}>L{lvl}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: s.color, flex: 1 }}>{s.label}</span>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Unified Journey card (collapsible levels) ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '22px 22px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #E2E8F0', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="#1A202C" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Your Journey</span>
              </div>
              <button
                onClick={() => navigate('/app/journey')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#38B2AC', padding: 0, transition: 'opacity 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                View all →
              </button>
            </div>

            {/* Level rows */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {[1, 2, 3, 4, 5].map(lvl => {
                const lvlAccent = LEVEL_ACCENT_COLORS[lvl];
                const lvlAccentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
                const depth = data.levelDepths[String(lvl)] ?? 'full';
                const isSkipped = depth === 'skip';
                const progress = data.levelProgress[lvl];
                const phasesCompleted = progress?.phasesCompleted?.filter(Boolean).length ?? 0;

                const eLearnStatus = isSkipped ? 'n/a' : phasesCompleted >= 2 ? 'done' : phasesCompleted >= 1 ? 'progress' : 'not-started';

                const toolKeyMap: Record<number, string> = { 1: 'prompt-playground', 2: 'agent-builder', 3: 'workflow-canvas', 4: 'dashboard-designer', 5: 'ai-app-evaluator' };
                const toolUsageKey = toolKeyMap[lvl];
                const artefacts = data.toolUsage[toolUsageKey]?.artefactsCreated ?? 0;
                const toolkitStatus = isSkipped ? 'n/a' : artefacts > 0 ? 'done' : 'not-started';

                const projectSub = data.projectSubmissions[lvl];
                const projectStatus = isSkipped ? 'n/a' : projectSub?.status === 'passed' ? 'done' : (projectSub?.status === 'submitted' || projectSub?.status === 'needs_revision' || projectSub?.status === 'draft') ? 'progress' : 'not-started';

                const levelNames: Record<number, string> = { 1: 'AI Fundamentals', 2: 'Applied Capability', 3: 'Systemic Integration', 4: 'Interactive Dashboards', 5: 'Full AI Applications' };
                const toolkitRouteMap: Record<number, string> = { 1: '/app/toolkit/prompt-playground', 2: '/app/toolkit/agent-builder', 3: '/app/toolkit/workflow-canvas', 4: '/app/toolkit/dashboard-designer', 5: '/app/toolkit/ai-app-evaluator' };

                const eLearnTooltips: Record<number, string> = {
                  1: 'Learn the Prompt Blueprint framework – Role, Context, Task, Format, Steps, Checks',
                  2: 'Build reusable AI agents with personas, guardrails, and memory',
                  3: 'Map end-to-end AI workflows with triggers, steps, and outputs',
                  4: 'Design interactive dashboards that surface AI-generated insights',
                  5: 'Architect and evaluate full-stack AI applications',
                };
                const toolkitTooltips: Record<number, string> = {
                  1: 'Prompt Playground – Write, test, and refine prompts with live AI feedback',
                  2: 'Agent Builder – Design custom AI agents with personas and guardrails',
                  3: 'Workflow Canvas – Map automated AI pipelines visually',
                  4: 'Dashboard Designer – Prototype interactive dashboards for AI outputs',
                  5: 'App Evaluator – Evaluate and score your AI application architecture',
                };
                const projectTooltips: Record<number, string> = {
                  1: 'Submit a prompt artefact demonstrating the Blueprint framework',
                  2: 'Submit a working AI agent you built on a platform',
                  3: 'Submit a documented AI workflow with real outputs',
                  4: 'Submit an interactive dashboard prototype with AI data',
                  5: 'Submit a full AI application case study with outcomes',
                };

                const StatusPill = ({ status, onClick, tooltip }: { status: string; onClick?: () => void; tooltip?: string }) => {
                  const isClickable = onClick && status !== 'n/a';
                  const styles: Record<string, React.CSSProperties> = {
                    'done': { background: '#C6F6D5', color: '#276749' },
                    'progress': { background: lvlAccent + '33', color: lvlAccentDark },
                    'not-started': { background: '#F7FAFC', color: '#A0AEC0', border: '1px solid #E2E8F0' },
                    'n/a': { background: 'transparent', color: '#CBD5E0' },
                  };
                  const labels: Record<string, string> = { 'done': 'Done', 'progress': 'In progress', 'not-started': 'Not started', 'n/a': '—' };
                  return (
                    <div
                      title={isClickable ? tooltip : undefined}
                      onClick={isClickable ? onClick : undefined}
                      style={{
                        textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '4px 6px', borderRadius: 20,
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        ...styles[status],
                      }}
                      onMouseEnter={e => { if (isClickable) { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)'; } }}
                      onMouseLeave={e => { if (isClickable) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; } }}
                    >
                      {labels[status]}
                      {isClickable && <span style={{ marginLeft: 3, fontSize: 10 }}>→</span>}
                    </div>
                  );
                };

                const doneCount = [eLearnStatus, toolkitStatus, projectStatus].filter(s => s === 'done').length;
                const levelPct = isSkipped ? -1 : Math.round((doneCount / 3) * 100);
                const lvlTopics = LEVEL_TOPICS[lvl] || [];
                const isExpanded = expandedLevels.has(lvl);

                const toggleLevel = () => {
                  if (isSkipped) return;
                  setExpandedLevels(prev => {
                    const next = new Set(prev);
                    if (next.has(lvl)) next.delete(lvl); else next.add(lvl);
                    return next;
                  });
                };

                return (
                  <div key={lvl} style={{ borderBottom: lvl < 5 ? '1px solid #F0F4F8' : 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* ── Collapsed level row — always visible ── */}
                    <div
                      onClick={toggleLevel}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '36px 1fr auto 50px 22px',
                        gap: 8,
                        alignItems: 'center',
                        padding: '0 10px',
                        flex: 1,
                        cursor: isSkipped ? 'default' : 'pointer',
                        borderRadius: 10,
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSkipped) e.currentTarget.style.background = '#F7FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Level badge */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSkipped ? '#F7FAFC' : lvlAccent + '33',
                        border: `2px solid ${isSkipped ? '#E2E8F0' : lvlAccent}`,
                        color: isSkipped ? '#A0AEC0' : lvlAccentDark,
                        fontSize: 13, fontWeight: 700,
                      }}>
                        {lvl}
                      </div>

                      {/* Level name + topic list */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isSkipped ? '#A0AEC0' : '#1A202C', whiteSpace: 'nowrap' }}>
                          {levelNames[lvl]}
                          {isSkipped && <span style={{ fontSize: 12, color: '#CBD5E0', fontWeight: 400, marginLeft: 6 }}>Not assigned</span>}
                        </div>
                        {!isSkipped && lvlTopics.length > 0 && (
                          <div style={{ fontSize: 12, color: '#718096', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                            {lvlTopics.map(t => t.title).join(', ')}
                          </div>
                        )}
                      </div>

                      {/* E-Learning → Artefacts → Project flow */}
                      {!isSkipped ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          {/* E-Learning */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: '#EAF3DE88' }}>
                            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={11} color="#27500A" />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: phasesCompleted > 0 ? '#27500A' : '#CBD5E0' }}>{phasesCompleted}/2</span>
                          </div>
                          <ChevronRight size={14} color="#CBD5E0" strokeWidth={2} style={{ flexShrink: 0 }} />
                          {/* Artefacts */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: '#E6FFFA88' }}>
                            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#E6FFFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Zap size={11} color="#085041" />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: artefacts > 0 ? '#085041' : '#CBD5E0' }}>{artefacts}</span>
                          </div>
                          <ChevronRight size={14} color="#CBD5E0" strokeWidth={2} style={{ flexShrink: 0 }} />
                          {/* Project */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: '#EEEDFE88' }}>
                            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FolderOpen size={11} color="#3C3489" />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: (projectStatus === 'done' ? 1 : 0) > 0 ? '#3C3489' : '#CBD5E0' }}>{projectStatus === 'done' ? 1 : 0}/1</span>
                          </div>
                        </div>
                      ) : <div />}

                      {/* Progress ring */}
                      {(() => {
                        if (isSkipped) return <div style={{ textAlign: 'center', fontSize: 12, color: '#CBD5E0' }}>—</div>;
                        const size = 44;
                        const stroke = 3.5;
                        const r = (size - stroke) / 2;
                        const circ = 2 * Math.PI * r;
                        const offset = circ - (levelPct / 100) * circ;
                        const ringColor = levelPct === 100 ? '#48BB78' : levelPct > 0 ? lvlAccent : '#EDF2F7';
                        return (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDF2F7" strokeWidth={stroke} />
                              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
                            </svg>
                            <span style={{ position: 'absolute', fontSize: 12, fontWeight: 700, color: levelPct === 100 ? '#276749' : levelPct > 0 ? lvlAccentDark : '#A0AEC0' }}>{levelPct}%</span>
                          </div>
                        );
                      })()}

                      {/* Chevron */}
                      {!isSkipped ? (
                        <ChevronDown
                          size={18}
                          color="#A0AEC0"
                          style={{ transition: 'transform 0.25s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      ) : <div />}
                    </div>

                    {/* ── Expanded topic detail ── */}
                    {!isSkipped && (
                      <div style={{
                        maxHeight: isExpanded ? lvlTopics.length * 80 + 50 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                      }}>
                        {/* Column labels row */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr 96px 16px 96px 16px 96px',
                          gap: 4,
                          alignItems: 'center',
                          padding: '2px 6px 6px',
                        }}>
                          <div />
                          <div />
                          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>E-Learning</div>
                          <div />
                          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Toolkit</div>
                          <div />
                          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Project</div>
                        </div>

                        {/* Topic rows */}
                        {lvlTopics.map((topic, tIdx) => {
                          const isSoon = !!(topic as any).comingSoon;
                          return (
                            <div
                              key={tIdx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '36px 1fr 96px 16px 96px 16px 96px',
                                gap: 4,
                                alignItems: 'center',
                                borderRadius: 8,
                                padding: '5px 6px',
                                marginLeft: 4,
                                background: isSoon ? '#F7FAFC' : lvlAccent + '08',
                                marginBottom: tIdx < lvlTopics.length - 1 ? 4 : 8,
                                transition: 'background 0.12s',
                                opacity: isSoon ? 0.7 : 1,
                              }}
                              onMouseEnter={e => { if (!isSoon) e.currentTarget.style.background = lvlAccent + '18'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = isSoon ? '#F7FAFC' : lvlAccent + '08'; }}
                            >
                              <div />
                              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 12, color: isSoon ? '#A0AEC0' : '#4A5568', fontWeight: 500 }}>
                                {topic.title}
                                {isSoon && <span style={{ fontSize: 10, fontWeight: 600, color: '#CBD5E0', marginLeft: 8, fontStyle: 'italic' }}>Coming soon</span>}
                              </div>
                              {isSoon ? (
                                <>
                                  <div style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E0', fontStyle: 'italic' }}>—</div>
                                  <div />
                                  <div style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E0', fontStyle: 'italic' }}>—</div>
                                  <div />
                                  <div style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E0', fontStyle: 'italic' }}>—</div>
                                </>
                              ) : (
                                <>
                                  <StatusPill status={eLearnStatus} onClick={() => navigate(`/app/level?level=${lvl}`)} tooltip={eLearnTooltips[lvl]} />
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <ChevronRight size={14} color={lvlAccent} strokeWidth={2.5} />
                                  </div>
                                  <StatusPill status={toolkitStatus} onClick={() => navigate(toolkitRouteMap[lvl])} tooltip={toolkitTooltips[lvl]} />
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <ChevronRight size={14} color={lvlAccent} strokeWidth={2.5} />
                                  </div>
                                  <StatusPill status={projectStatus} onClick={() => navigate(`/app/journey/project/${lvl}`)} tooltip={projectTooltips[lvl]} />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Cohort Leaderboard ─── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '22px 22px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 72,
          }}
        >
          {data.leaderboard.length > 1 ? (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={16} color="#F6AD55" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Cohort Leaderboard</span>
                </div>
                <button
                  onClick={() => navigate('/app/cohort')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#38B2AC', padding: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  View all →
                </button>
              </div>

              {/* Summary bar */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#F7FAFC',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{data.activeColleaguesCount}</div>
                  <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>Active</div>
                </div>
                <div style={{ width: 1, background: '#E2E8F0' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: LEVEL_ACCENT_DARK_COLORS[level] || '#1A202C', lineHeight: 1 }}>{level}</div>
                  <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>Your Level</div>
                </div>
                <div style={{ width: 1, background: '#E2E8F0' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38B2AC', lineHeight: 1 }}>#{currentUserRank}</div>
                  <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>Your Rank</div>
                </div>
              </div>

              {/* Leaderboard list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.leaderboard.map((member, i) => (
                  <LeaderboardRow key={i} member={member} rank={i + 1} />
                ))}
              </div>

            </>
          ) : (
            /* No-org state — invite code entry */
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Trophy size={16} color="#F6AD55" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Cohort Leaderboard</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <Users size={28} color="#38B2AC" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>
                  Join your cohort
                </div>
                <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5 }}>
                  Enter the code from your facilitator to see your team's leaderboard.
                </div>
              </div>

              {/* Code entry */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <KeyRound size={13} color="#A0AEC0" style={{ position: 'absolute', left: 10, top: 11 }} />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB3K7NWQ"
                    maxLength={8}
                    style={{
                      width: '100%',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '9px 12px 9px 30px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1A202C',
                      fontFamily: "'DM Sans', sans-serif",
                      outline: 'none',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={handleJoinOrg}
                  disabled={!inviteCode.trim() || joinStatus === 'loading'}
                  style={{
                    background: inviteCode.trim() ? '#38B2AC' : '#A0AEC0',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: inviteCode.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {joinStatus === 'loading' ? 'Joining...' : 'Join'}
                </button>
              </div>

              {joinStatus === 'error' && (
                <div style={{ fontSize: 12, color: '#C53030', marginBottom: 8 }}>{joinError}</div>
              )}
              {joinStatus === 'success' && (
                <div style={{ fontSize: 12, color: '#38A169', fontWeight: 600, marginBottom: 8 }}>
                  Joined! Reloading...
                </div>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontSize: 11, color: '#A0AEC0' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>

              {/* Request code via email */}
              <button
                onClick={handleRequestCode}
                disabled={emailSending || emailSent}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  background: emailSent ? '#F0FFF4' : '#F7FAFC',
                  fontSize: 12,
                  fontWeight: 600,
                  color: emailSent ? '#38A169' : '#4A5568',
                  cursor: emailSending || emailSent ? 'default' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Mail size={13} color={emailSent ? '#38A169' : '#718096'} />
                {emailSent ? 'Code sent to your email!' : emailSending ? 'Sending...' : 'Email me my code'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#A0AEC0', lineHeight: 1.4 }}>
                  No code? You can join a cohort anytime.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;