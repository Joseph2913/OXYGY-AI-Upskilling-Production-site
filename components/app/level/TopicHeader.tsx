import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Topic } from '../../../data/levelTopics';
import { TOTAL_PHASES } from '../../../hooks/useLevelData';

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
  onPhaseClick: (phase: number) => void;
}

/* ─── Progress Ring (matches dashboard) ─── */
function ProgressRing({
  completed,
  total,
  accentColor,
}: {
  completed: number;
  total: number;
  accentColor: string;
}) {
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={accentColor + '44'} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A202C" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{displayPct}%</span>
        <span style={{ fontSize: 10, color: '#718096', marginTop: 1 }}>{completed}/{total}</span>
      </div>
    </div>
  );
}

const TopicHeader: React.FC<TopicHeaderProps> = ({
  levelNumber,
  levelName,
  topic,
  topicIndex,
  totalTopics,
  currentPhase,
  completedPhases,
  accentColor,
  accentDark,
  onPhaseClick,
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span
          onClick={() => navigate('/app/journey')}
          style={{ fontSize: 12, color: '#A0AEC0', cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4A5568'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
        >
          My Journey
        </span>
        <span style={{ fontSize: 12, color: '#CBD5E0' }}>›</span>
        <span style={{ fontSize: 12, color: '#A0AEC0' }}>Level {levelNumber}</span>
        <span style={{ fontSize: 12, color: '#CBD5E0' }}>›</span>
        <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>{topic.title}</span>
      </div>

      {/* Hero card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          borderLeft: `4px solid ${accentColor}`,
          padding: '22px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', right: 140, top: -40, width: 180, height: 180, borderRadius: '50%', background: `${accentColor}0A`, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: 30, bottom: -50, width: 130, height: 130, borderRadius: '50%', background: 'rgba(56, 178, 172, 0.05)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Left — level label + topic title + description */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-block',
                background: accentColor,
                color: accentDark,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 9px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Level {levelNumber}
            </span>
            <span style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>
              {levelName} · Topic {topicIndex + 1} of {totalTopics}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C', margin: '0 0 4px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
            {topic.title}
          </h1>
          <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, margin: 0, maxWidth: 580 }}>
            {topic.description}
          </p>
        </div>

        {/* Right — progress ring */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Progress
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>
              {completedPhases} of {TOTAL_PHASES} phases
            </div>
          </div>
          <ProgressRing completed={completedPhases} total={TOTAL_PHASES} accentColor={accentColor} />
        </div>
      </div>
    </div>
  );
};

export default TopicHeader;
