import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Trophy, Flame, Target, BookOpen, Play, PenTool, FolderOpen, KeyRound, Mail, Users } from 'lucide-react';
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
import { getPrimaryTool } from '../../data/toolkitData';
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

/* ─── Day dots for streak ─── */
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function DayDots({ activeDays, streakDays }: { activeDays: boolean[]; streakDays: number }) {
  const now = new Date();
  const dow = now.getDay();
  const monBased = dow === 0 ? 6 : dow - 1;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {DAY_LABELS.map((label, i) => {
        const isPast = i < monBased;
        const isToday = i === monBased;
        const isFuture = i > monBased;
        const isActive = activeDays[i];

        let bg = '#E2E8F0';
        let showCheck = false;
        if (isPast && isActive) { bg = '#1A202C'; showCheck = true; }
        if (isToday && streakDays > 0) { bg = '#38B2AC'; showCheck = true; }
        if (isToday && streakDays === 0) { bg = '#E2E8F0'; }
        if (isFuture) { bg = '#E2E8F0'; }

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showCheck && <Check size={9} color="#FFFFFF" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 9, color: '#718096' }}>{label}</span>
          </div>
        );
      })}
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
  const { userProfile, hasLearningPlan, learningPlanLoading } = useAppContext();
  const { data, loading } = useDashboardData();

  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';

  // Org invite code state (for no-org users)
  const [inviteCode, setInviteCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [joinError, setJoinError] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ key: string; rect: DOMRect; dateLabel: string; isActive: boolean; details: { level: number; tool: string; phases: number; artefacts: number }[] } | null>(null);

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

          {/* Card: Resume Learning (redesigned — CTA right, phase icons) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${accent}`,
              padding: '22px 26px',
              display: 'flex',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
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

          {/* Card: Engagement + Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* ── YOUR ENGAGEMENT (dark, split: activity | streak) ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
              {/* Subtitles row */}
              <div style={{ display: 'flex', marginBottom: 14 }}>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Activity · Last 4 weeks</div>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em', paddingLeft: 18 }}>Streak · This week</div>
              </div>
              {/* Content row */}
              <div style={{ display: 'flex', gap: 0 }}>
                {/* LEFT — Activity: stats left, grid right (fills space) */}
                <div style={{ flex: 1, paddingRight: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Stats — centre-aligned with grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{data.activeDaysThisWeek.filter(Boolean).length}</div>
                      <div style={{ fontSize: 9, color: '#A0AEC0', marginTop: 2 }}>active days</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#38B2AC', lineHeight: 1 }}>{Object.values(data.toolUsage).reduce((s, t) => s + t.artefactsCreated, 0)}</div>
                      <div style={{ fontSize: 9, color: '#A0AEC0', marginTop: 2 }}>artefacts</div>
                    </div>
                  </div>
                  {/* Grid — fills all remaining space with hover tooltips */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={`h${i}`} style={{ fontSize: 7, color: '#A0AEC0', textAlign: 'center', lineHeight: '9px', marginBottom: 2 }}>{d}</div>
                      ))}
                      {(() => {
                        const now = new Date();
                        const dow = now.getDay();
                        const monBased = dow === 0 ? 6 : dow - 1;
                        const cells: React.ReactNode[] = [];
                        const levelToolNames: Record<number, string> = { 1: 'Prompt Playground', 2: 'Agent Builder', 3: 'Workflow Canvas', 4: 'Dashboard Designer', 5: 'App Evaluator' };
                        for (let w = 0; w < 4; w++) {
                          for (let d = 0; d < 7; d++) {
                            let bg = '#EDF2F7';
                            let isActiveCell = false;
                            const cellDate = new Date(now);
                            const daysBack = (3 - w) * 7 + (monBased - d);
                            cellDate.setDate(now.getDate() - daysBack);
                            if (w === 3) {
                              const isActive = data.activeDaysThisWeek[d];
                              const isPast = d < monBased;
                              const isToday = d === monBased;
                              if (isPast && isActive) { bg = '#38B2AC'; isActiveCell = true; }
                              else if (isPast) bg = '#E2E8F0';
                              else if (isToday && isActive) { bg = '#4FD1C5'; isActiveCell = true; }
                              else if (isToday) bg = '#B2DFDB';
                              else bg = '#F7FAFC';
                            }
                            const dateLabel = cellDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                            const cellKey = `${w}-${d}`;
                            const cellDetails: { level: number; tool: string; phases: number; artefacts: number }[] = [];
                            if (isActiveCell) {
                              Object.entries(data.levelProgress).forEach(([lvl, lp]) => {
                                const lvlNum = Number(lvl);
                                const tKey = Object.keys(data.toolUsage).find(k => {
                                  const mp: Record<string, number> = { 'prompt-playground': 1, 'agent-builder': 2, 'workflow-canvas': 3, 'dashboard-designer': 4, 'ai-app-evaluator': 5 };
                                  return mp[k] === lvlNum;
                                });
                                const ac = tKey ? data.toolUsage[tKey]?.artefactsCreated || 0 : 0;
                                const pd = lp.phasesCompleted.filter(Boolean).length;
                                if (pd > 0 || ac > 0) cellDetails.push({ level: lvlNum, tool: levelToolNames[lvlNum], phases: pd, artefacts: ac });
                              });
                            }
                            cells.push(
                              <div
                                key={cellKey}
                                style={{ aspectRatio: '1', borderRadius: 2, background: bg, cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'scale(1.15)';
                                  e.currentTarget.style.boxShadow = '0 0 6px rgba(56,178,172,0.4)';
                                  setHoveredCell({ key: cellKey, rect: e.currentTarget.getBoundingClientRect(), dateLabel, isActive: isActiveCell, details: cellDetails });
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                  setHoveredCell(null);
                                }}
                              />
                            );
                          }
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                  {/* Tooltip rendered via portal — see bottom of return */}
                </div>

                {/* Divider */}
                <div style={{ width: 1, background: '#E2E8F0', flexShrink: 0 }} />

                {/* RIGHT — Streak: ring + label top, days bottom-aligned with grid */}
                <div style={{ flex: 1, paddingLeft: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Ring + labels stacked */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
                    {(() => {
                      const ringSize = 72;
                      const strokeW = 4.5;
                      const radius = (ringSize - strokeW * 2) / 2;
                      const circ = 2 * Math.PI * radius;
                      const pct = Math.min(data.streakDays / 7, 1);
                      const offset = circ * (1 - pct);
                      return (
                        <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
                          <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="#F7FAFC" strokeWidth={strokeW} />
                            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="#F6AD55" strokeWidth={strokeW} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={13} color="#F6AD55" style={{ marginBottom: 2 }} />
                            <span style={{ fontSize: 22, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{data.streakDays}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ fontSize: 11, color: '#4A5568', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#F6AD55' }}>Current Streak</span>
                      <span style={{ color: '#A0AEC0', marginLeft: 6 }}>
                        {(() => {
                          const now = new Date();
                          const startDate = new Date(now);
                          startDate.setDate(startDate.getDate() - (data.streakDays - 1));
                          const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                          return data.streakDays > 0 ? `${fmt(startDate)} – ${fmt(now)}` : 'Start today';
                        })()}
                      </span>
                    </div>
                  </div>
                  {/* Day circles — bottom-aligned to match grid's last row */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(() => {
                      const now = new Date();
                      const dow = now.getDay();
                      const monBased = dow === 0 ? 6 : dow - 1;
                      return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
                        const isActive = data.activeDaysThisWeek[i];
                        const isPast = i < monBased;
                        const isToday = i === monBased;
                        let bg = '#EDF2F7';
                        if ((isPast || isToday) && isActive) bg = '#38B2AC';
                        else if (isToday) bg = '#B2DFDB';
                        else if (isPast) bg = '#E2E8F0';
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isActive && (isPast || isToday) ? <Check size={11} color="#FFF" strokeWidth={3} /> : null}
                            </div>
                            <span style={{ fontSize: 9, color: isToday ? '#38B2AC' : '#A0AEC0', fontWeight: isToday ? 600 : 400 }}>{label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* ── YOUR STATS ── */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>
                YOUR STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { icon: <Target size={14} color="#38B2AC" />, bg: '#F0FFF4', label: 'Topics Completed', value: `${data.overallCompletedTopics} / ${data.overallTotalTopics}`, barPct: data.overallTotalTopics > 0 ? (data.overallCompletedTopics / data.overallTotalTopics) * 100 : 0, barColor: '#38B2AC' },
                  { icon: <BookOpen size={14} color="#8B5CF6" />, bg: '#F5F3FF', label: 'Assessment Avg', value: `${currentUserData?.assessmentAvg || 0}%`, barPct: currentUserData?.assessmentAvg || 0, barColor: '#8B5CF6' },
                  { icon: <Trophy size={14} color="#F6AD55" />, bg: '#FFFBEB', label: 'Completion', value: `${currentUserData?.completionPct || 0}%`, barPct: currentUserData?.completionPct || 0, barColor: '#F6AD55' },
                ].map((stat, i, arr) => (
                  <div key={i} style={{ padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #F7FAFC' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {stat.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: '#4A5568', fontWeight: 500 }}>{stat.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>{stat.value}</span>
                    </div>
                    {stat.barPct !== null && (
                      <div style={{ marginLeft: 38, marginTop: 5, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(stat.barPct, 100)}%`, height: '100%', background: stat.barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Unified Journey + Toolkit card ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="#1A202C" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Your Journey</span>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <button
                  onClick={() => navigate('/app/journey')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#38B2AC', padding: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  All topics →
                </button>
                <button
                  onClick={() => navigate('/app/toolkit')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#38B2AC', padding: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  All tools →
                </button>
              </div>
            </div>

            {/* Column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, padding: '0 14px 8px', marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Topic & Progress</span>
              <div />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', paddingLeft: 14 }}>Tool & Artefacts</span>
            </div>

            {/* Level rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {[1, 2, 3, 4, 5].map(lvl => {
                const lvlTopics = LEVEL_TOPICS[lvl] || [];
                const topic = lvlTopics[0];
                const primaryTool = getPrimaryTool(lvl);
                if (!topic || !primaryTool) return null;

                const lvlAccent = LEVEL_ACCENT_COLORS[lvl];
                const lvlAccentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
                const isCurrentLevel = lvl === level;
                const isCompletedLevel = lvl < level;
                const isLocked = false; // All levels accessible
                const progress = data.levelProgress[lvl];
                const phases = progress?.phasesCompleted || [false, false];
                const usage = data.toolUsage[primaryTool.id];
                const artefactsCreated = usage?.artefactsCreated || 0;

                // Status badge config
                const statusLabel = isCompletedLevel ? 'COMPLETED' : isCurrentLevel ? 'IN PROGRESS' : 'NOT STARTED';
                const statusBg = isCompletedLevel ? '#C6F6D5' : isCurrentLevel ? lvlAccent + '44' : '#EDF2F7';
                const statusColor = isCompletedLevel ? '#276749' : isCurrentLevel ? lvlAccentDark : '#A0AEC0';

                // Short tool descriptions
                const toolDescriptions: Record<string, string> = {
                  'prompt-playground': 'Write, test, and refine prompts with live AI feedback',
                  'agent-builder': 'Design custom AI agents with personas and guardrails',
                  'workflow-canvas': 'Map end-to-end automated AI pipelines visually',
                  'dashboard-designer': 'Prototype interactive dashboards for AI outputs',
                  'ai-app-evaluator': 'Evaluate and score your AI application architecture',
                };

                return (
                  <div
                    key={lvl}
                    style={{
                      flex: 1,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1px 1fr',
                      borderRadius: 10,
                      border: `1px solid ${isLocked ? '#EDF2F7' : isCurrentLevel ? lvlAccent + '99' : '#E2E8F0'}`,
                      borderLeft: `3px solid ${isCompletedLevel ? lvlAccent : isCurrentLevel ? lvlAccent : isLocked ? '#EDF2F7' : '#E2E8F0'}`,
                      background: isLocked ? '#FAFBFC' : isCurrentLevel ? lvlAccent + '08' : '#FFFFFF',
                      overflow: 'hidden',
                    }}
                  >
                    {/* LEFT — Topic + progress */}
                    <div
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      {/* Title + status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isCompletedLevel ? lvlAccent : isCurrentLevel ? lvlAccent : '#E2E8F0',
                          fontSize: 10, fontWeight: 800, color: lvlAccentDark,
                        }}>
                          {isCompletedLevel ? <Check size={10} color={lvlAccentDark} strokeWidth={3} /> : isLocked ? <Lock size={9} color="#718096" /> : lvl}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {topic.title}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: statusBg, padding: '2px 7px', borderRadius: 6, flexShrink: 0, letterSpacing: '0.02em' }}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Subtitle */}
                      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.3, paddingLeft: 29, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topic.subtitle}
                      </div>

                      {/* Phase count + course button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 29, marginTop: 'auto' }}>
                        {(() => {
                          const phasesCompleted = phases.filter(Boolean).length;
                          return (
                            <div
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '2px 8px', borderRadius: 8,
                                background: phasesCompleted === 2 ? lvlAccent + '25' : '#F7FAFC',
                                border: `1px solid ${phasesCompleted === 2 ? lvlAccent + '55' : '#E2E8F0'}`,
                                fontSize: 10, fontWeight: 600,
                                color: phasesCompleted === 2 ? lvlAccentDark : '#4A5568',
                              }}
                            >
                              {phasesCompleted === 2 ? <Check size={9} strokeWidth={3} /> : <Play size={9} />}
                              {phasesCompleted} of 2 phases
                            </div>
                          );
                        })()}
                        {!isLocked && (
                          <button
                            onClick={() => navigate('/app/level')}
                            style={{
                              marginLeft: 'auto', background: 'none', border: `1px solid ${lvlAccent}`,
                              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600,
                              color: lvlAccentDark, cursor: 'pointer', flexShrink: 0,
                              transition: 'background 0.12s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = lvlAccent + '30')}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'transparent')}
                          >
                            Go to course →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ background: '#E2E8F0', margin: '8px 0' }} />

                    {/* RIGHT — Tool + description + artefacts */}
                    <div
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      {/* Tool name + icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: !isLocked ? lvlAccent + '55' : '#E2E8F0', fontSize: 12,
                        }}>
                          {!isLocked ? primaryTool.icon : <Lock size={9} color="#718096" />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: !isLocked ? '#1A202C' : '#718096', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {primaryTool.name}
                        </span>
                      </div>

                      {/* Tool description */}
                      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.3, paddingLeft: 29, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {toolDescriptions[primaryTool.id] || primaryTool.toolType}
                      </div>

                      {/* Artefact badge + open tool button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 29, marginTop: 'auto' }}>
                        {!isLocked && artefactsCreated > 0 && (
                          <div
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate('/app/artefacts'); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 8,
                              background: lvlAccent + '25', border: `1px solid ${lvlAccent + '55'}`,
                              fontSize: 10, fontWeight: 600, color: lvlAccentDark,
                              cursor: 'pointer',
                            }}
                          >
                            <FolderOpen size={9} />
                            {artefactsCreated} artefact{artefactsCreated !== 1 ? 's' : ''}
                          </div>
                        )}
                        {!isLocked && artefactsCreated === 0 && (
                          <span style={{ fontSize: 10, color: '#A0AEC0' }}>No artefacts yet</span>
                        )}
                        {!isLocked && (
                          <button
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(primaryTool.route); }}
                            style={{
                              marginLeft: 'auto', background: 'none', border: `1px solid ${lvlAccent}`,
                              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600,
                              color: lvlAccentDark, cursor: 'pointer', flexShrink: 0,
                              transition: 'background 0.12s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = lvlAccent + '30')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            Open tool →
                          </button>
                        )}
                      </div>
                    </div>
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
      {/* Activity grid tooltip — fixed position, rendered at top level */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.rect.left + hoveredCell.rect.width / 2,
            top: hoveredCell.rect.top - 10,
            transform: 'translate(-50%, -100%)',
            background: '#1A202C',
            color: '#FFFFFF',
            borderRadius: 10,
            padding: '10px 14px',
            minWidth: 180,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 1000,
            fontFamily: "'DM Sans', sans-serif",
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: '#1A202C', borderRadius: 2 }} />
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: hoveredCell.isActive ? 6 : 0 }}>{hoveredCell.dateLabel}</div>
          {hoveredCell.isActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {hoveredCell.details.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: LEVEL_ACCENT_COLORS[d.level] || '#38B2AC', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#E2E8F0' }}>L{d.level} {d.tool}</div>
                    <div style={{ fontSize: 9, color: '#A0AEC0' }}>{d.phases} phase{d.phases !== 1 ? 's' : ''} · {d.artefacts} artefact{d.artefacts !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#718096' }}>No activity</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppDashboard;