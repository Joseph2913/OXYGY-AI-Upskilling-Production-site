import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Trophy, Flame, Target, BookOpen, Play, FileText, Video, PenTool, FolderOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useDashboardData, LeaderboardMember } from '../../hooks/useDashboardData';
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A202C" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
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
  const { userProfile } = useAppContext();
  const { data, loading } = useDashboardData();
  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';

  if (loading || !data) {
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

  const level = data.currentLevel;
  const topics = LEVEL_TOPICS[level] || [];
  const totalTopics = topics.length;
  const accent = LEVEL_ACCENT_COLORS[level];
  const accentDark = LEVEL_ACCENT_DARK_COLORS[level];
  const levelFull = LEVEL_FULL_NAMES[level];
  const activeTopic = topics[data.activeTopicIndex];
  const phaseNames: Record<number, string> = { 1: 'E-Learning', 2: 'Read', 3: 'Watch', 4: 'Practice' };


  const currentUserRank = data.leaderboard.findIndex(m => m.isCurrentUser) + 1;
  const currentUserData = data.leaderboard.find(m => m.isCurrentUser);

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
                {data.lastActivityAt && (
                  <span style={{ fontSize: 11, color: '#A0AEC0', marginLeft: 'auto' }}>
                    {timeAgo(data.lastActivityAt)}
                  </span>
                )}
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

              {/* Phase strip with icons */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[
                  { phase: 1, label: 'E-Learn', icon: <Play size={11} /> },
                  { phase: 2, label: 'Read', icon: <FileText size={11} /> },
                  { phase: 3, label: 'Watch', icon: <Video size={11} /> },
                  { phase: 4, label: 'Practise', icon: <PenTool size={11} /> },
                ].map((p, idx) => {
                  const isCurrent = p.phase === data.currentPhase;
                  const isDone = p.phase < data.currentPhase;
                  return (
                    <React.Fragment key={p.phase}>
                      {idx > 0 && (
                        <div style={{ width: 16, height: 2, background: isDone || isCurrent ? '#1A202C' : '#E2E8F0', flexShrink: 0 }} />
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          flexShrink: 0,
                          background: isCurrent ? accent + '44' : isDone ? '#1A202C' : '#F1F5F9',
                          color: isCurrent ? accentDark : isDone ? '#FFFFFF' : '#A0AEC0',
                        }}
                      >
                        {isDone ? <Check size={10} strokeWidth={3} /> : p.icon}
                        {p.label}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Slide progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#718096', fontWeight: 500 }}>
                    Slide {data.currentSlide} of {data.totalSlides}
                  </span>
                  <span style={{ fontSize: 12, color: '#718096' }}>
                    {phaseNames[data.currentPhase] || 'E-Learning'}
                  </span>
                </div>
                <div style={{ height: 5, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(data.currentSlide / data.totalSlides) * 100}%`, height: '100%', background: '#1A202C', borderRadius: 4 }} />
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
              <ProgressRing completed={data.currentSlide} total={data.totalSlides} accentColor={accent} size={110} strokeWidth={8} />
              <button
                onClick={() => navigate('/app/level')}
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

          {/* Card: Streak + Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Streak */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                THIS WEEK
              </div>
              {data.streakDays > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 11 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{data.streakDays}</span>
                    <span style={{ fontSize: 13, color: '#718096', marginLeft: 4 }}>day streak</span>
                  </div>
                  <DayDots activeDays={data.activeDaysThisWeek} streakDays={data.streakDays} />
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#718096', marginBottom: 11 }}>Start your streak today.</div>
                  <DayDots activeDays={data.activeDaysThisWeek} streakDays={0} />
                </>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>
                YOUR STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: <Target size={13} color="#38B2AC" />, label: 'Use Cases', value: currentUserData?.useCasesIdentified || 0 },
                  { icon: <BookOpen size={13} color="#8B5CF6" />, label: 'Assessment Avg', value: `${currentUserData?.assessmentAvg || 0}%` },
                  { icon: <Trophy size={13} color="#F6AD55" />, label: 'Completion', value: `${currentUserData?.completionPct || 0}%` },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, color: '#718096' }}>{stat.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{stat.value}</span>
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
                const isLocked = lvl > level;
                const progress = data.levelProgress[lvl];
                const phases = progress?.phasesCompleted || [false, false, false, false];
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
                                background: phasesCompleted === 4 ? lvlAccent + '25' : '#F7FAFC',
                                border: `1px solid ${phasesCompleted === 4 ? lvlAccent + '55' : '#E2E8F0'}`,
                                fontSize: 10, fontWeight: 600,
                                color: phasesCompleted === 4 ? lvlAccentDark : '#4A5568',
                              }}
                            >
                              {phasesCompleted === 4 ? <Check size={9} strokeWidth={3} /> : <Play size={9} />}
                              {phasesCompleted} of 4 phases
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
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{data.sameLevelColleaguesCount}</div>
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

          {/* Score explainer */}
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#F7FAFC',
              fontSize: 11,
              color: '#718096',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 600, color: '#4A5568' }}>Score</span> = Completion + Use Cases + Assessments + Streak + Activity Rate
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;