import React, { useState } from 'react';
import { Topic } from '../../../data/levelTopics';
import { TOTAL_PHASES } from '../../../hooks/useLevelData';

const PHASE_LABELS = ['E-Learning', 'Toolkit', 'Project'];

interface TopicHeaderProps {
  levelNumber: number;
  levelName: string;
  topic: Topic;
  topicIndex: number;
  totalTopics: number;
  currentPhase: number;
  completedPhases: number;
  accentColor: string;
  accentDark: string;
  showPhaseTabs: boolean;
  onPhaseClick: (phase: number) => void;
  phaseCompletions: [boolean, boolean, boolean]; // [elearn, toolkit, project]
  toolkitUnlocked: boolean;   // elearn done
  projectUnlocked: boolean;   // toolkit done
}

/* ─── Progress Ring ─── */
function ProgressRing({
  completed,
  total,
  accentColor,
}: {
  completed: number;
  total: number;
  accentColor: string;
}) {
  const size = 44;
  const stroke = 4;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={accentColor + '44'} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={accentColor} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{displayPct}%</span>
      </div>
    </div>
  );
}

const TopicHeader: React.FC<TopicHeaderProps> = ({
  levelNumber,
  topic,
  currentPhase,
  completedPhases,
  accentColor,
  accentDark,
  showPhaseTabs,
  onPhaseClick,
  phaseCompletions,
  toolkitUnlocked,
  projectUnlocked,
}) => {
  const [descOpen, setDescOpen] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Single compact bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          borderLeft: `4px solid ${accentColor}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Left — level badge + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            flexShrink: 0,
            background: accentColor,
            color: accentDark,
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
          }}>
            L{levelNumber}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topic.title}
          </span>
        </div>

        {/* Expand toggle — between title and tabs */}
        <button
          onClick={() => setDescOpen(o => !o)}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: descOpen ? '#F7FAFC' : 'none', border: `1px solid ${descOpen ? '#E2E8F0' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', padding: '5px 8px', color: '#718096', transition: 'all 150ms ease' }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ transform: descOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}>
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Centre — phase tabs */}
        {showPhaseTabs && (
          <div style={{ display: 'flex', gap: 4, background: '#F7FAFC', borderRadius: 10, padding: 4, flexShrink: 0 }}>
            {PHASE_LABELS.map((label, i) => {
              const phaseNum = i + 1;
              const isDone = phaseCompletions[i];
              const isActive = phaseNum === currentPhase;

              // Determine if this phase is accessible
              const isLocked =
                (phaseNum === 2 && !toolkitUnlocked) ||
                (phaseNum === 3 && !projectUnlocked);

              return (
                <button
                  key={i}
                  onClick={isLocked ? undefined : () => onPhaseClick(phaseNum)}
                  disabled={isLocked}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, border: 'none',
                    cursor: isLocked ? 'default' : 'pointer',
                    background: isActive ? accentColor : 'transparent',
                    opacity: isLocked ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Badge: lock icon when locked, number otherwise */}
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: isLocked ? '#E2E8F0' : isActive ? accentDark : isDone ? '#1A202C' : '#E2E8F0',
                    color: isLocked ? '#A0AEC0' : isActive || isDone ? '#FFFFFF' : '#A0AEC0',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isLocked
                      ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M9 5H3V10H9V5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      : phaseNum
                    }
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: isLocked ? '#CBD5E0' : isActive ? accentDark : isDone ? '#4A5568' : '#A0AEC0',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right — progress ring */}
        <div style={{ flexShrink: 0 }}>
          <ProgressRing completed={completedPhases} total={TOTAL_PHASES} accentColor={accentColor} />
        </div>
      </div>

      {/* Description dropdown */}
      {descOpen && (
        <div style={{ margin: '6px 0 0', padding: '10px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: 0 }}>
            {topic.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default TopicHeader;
