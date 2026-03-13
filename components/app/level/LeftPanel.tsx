import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { Topic } from '../../../data/levelTopics';
import { TopicProgress } from '../../../hooks/useLevelData';

interface LeftPanelProps {
  levelNumber: number;
  levelName: string;
  accentColor: string;
  accentDark: string;
  topics: Topic[];
  topicProgress: TopicProgress[];
  selectedTopicId: number;
  activeTopicId: number;
  onSelectTopic: (topicId: number) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  levelNumber,
  levelName,
  accentColor,
  accentDark,
  topics,
  topicProgress,
  selectedTopicId,
  activeTopicId,
  onSelectTopic,
}) => {
  const navigate = useNavigate();

  const completedTopics = topicProgress.filter((tp) => tp.completedAt).length;
  const totalTopics = topics.length;
  const progressPct = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  const getTopicStatus = (topicId: number): 'completed' | 'active' | 'upcoming' => {
    const tp = topicProgress.find((t) => t.topicId === topicId);
    if (tp?.completedAt) return 'completed';
    if (topicId === activeTopicId) return 'active';
    return 'upcoming';
  };

  const getCurrentPhase = (topicId: number): number => {
    const tp = topicProgress.find((t) => t.topicId === topicId);
    return tp?.phase ?? 1;
  };

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        height: '100%',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header — sticky */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          zIndex: 2,
          padding: '24px 20px 16px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        {/* Level badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              background: `${accentColor}44`,
              border: `1px solid ${accentColor}88`,
              borderRadius: 20,
              padding: '3px 12px',
              fontSize: 10,
              fontWeight: 700,
              color: accentDark,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            LEVEL {levelNumber}
          </span>
        </div>

        {/* Level title */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: '#1A202C',
            letterSpacing: '-0.3px',
            marginBottom: 10,
          }}
        >
          {levelName}
        </div>

        {/* Mini progress bar */}
        <div style={{ fontSize: 11, color: '#718096', marginBottom: 5 }}>
          {completedTopics} of {totalTopics} topics complete
        </div>
        <div
          style={{
            height: 4,
            background: `${accentColor}33`,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: accentColor,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Topic list */}
      <div style={{ padding: '12px 12px', flex: 1 }}>
        {topics.map((topic, idx) => {
          const status = getTopicStatus(topic.id);
          const isSelected = topic.id === selectedTopicId;
          const isLocked = false; // All topics accessible for now
          const currentPhase = getCurrentPhase(topic.id);

          let bgColor = 'transparent';
          let borderColor = 'transparent';
          let cursor: React.CSSProperties['cursor'] = 'pointer';
          let opacity = 1;

          if (isSelected) {
            bgColor = `${accentColor}18`;
            borderColor = `${accentColor}66`;
            cursor = 'default';
          } else if (isLocked) {
            cursor = 'default';
            opacity = 0.5;
          }

          return (
            <div
              key={topic.id}
              onClick={() => {
                if (!isSelected && !isLocked) onSelectTopic(topic.id);
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isLocked) {
                  (e.currentTarget as HTMLElement).style.background = '#F7FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isLocked) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 10px',
                borderRadius: 10,
                cursor,
                transition: 'background 0.12s',
                border: `1px solid ${borderColor}`,
                background: bgColor,
                opacity,
                marginBottom: 4,
              }}
            >
              {/* Status circle */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    status === 'completed'
                      ? accentDark
                      : status === 'active'
                        ? accentColor
                        : '#E2E8F0',
                  boxShadow:
                    isSelected && status === 'active'
                      ? `0 0 0 3px ${accentColor}44`
                      : 'none',
                }}
              >
                {status === 'completed' ? (
                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: status === 'active' ? accentDark : '#A0AEC0',
                    }}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Content block */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected || status === 'active' ? 600 : 400,
                    color:
                      status === 'active' || isSelected
                        ? '#1A202C'
                        : status === 'completed'
                          ? '#718096'
                          : '#A0AEC0',
                    lineHeight: 1.3,
                  }}
                >
                  {topic.title}
                </div>

                {/* Phase dots (active topic only) */}
                {status === 'active' && (
                  <div style={{ marginTop: 5 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[1, 2, 3].map((phase) => (
                        <div
                          key={phase}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: phase <= currentPhase ? accentDark : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {['E-Learn', 'Read', 'Watch'].map((label) => (
                        <span
                          key={label}
                          style={{ fontSize: 9, color: '#A0AEC0', width: 6, textAlign: 'center' }}
                        >
                          {/* Labels are wider than dots, shown below */}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                      <span style={{ fontSize: 9, color: '#A0AEC0' }}>E-Learn</span>
                      <span style={{ fontSize: 9, color: '#A0AEC0' }}>Read</span>
                      <span style={{ fontSize: 9, color: '#A0AEC0' }}>Watch</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Time estimate (active & upcoming only) */}
              {status !== 'completed' && (
                <span style={{ fontSize: 11, color: '#A0AEC0', flexShrink: 0 }}>
                  {topic.estimatedMinutes}m
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <div
          onClick={() => navigate('/app/journey')}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#1A202C';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#718096';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#718096',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          <ArrowLeft size={13} />
          My Journey
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
