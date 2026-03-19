import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LEVEL_META } from '../../../data/levelTopics';
import { ALL_TOOLS } from '../../../data/toolkitData';

interface LevelCompletionViewProps {
  levelNumber: number;
  accentColor: string;
  accentDark: string;
  onContinueToNextLevel: () => void;
}

const LevelCompletionView: React.FC<LevelCompletionViewProps> = ({
  levelNumber,
  accentColor,
  accentDark,
  onContinueToNextLevel,
}) => {
  const navigate = useNavigate();
  const isFinalLevel = levelNumber === 5;
  const levelMeta = LEVEL_META.find((l) => l.number === levelNumber);
  const levelName = levelMeta?.name || `Level ${levelNumber}`;
  const topicCount = 2; // all levels have 2 topics in current data

  const unlockedTools = ALL_TOOLS.filter((t) => t.levelRequired === levelNumber);

  return (
    <div
      style={{
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: 560,
        margin: '0 auto',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 56,
          marginBottom: 20,
          animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        🎉
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#1A202C',
          letterSpacing: '-0.5px',
          marginBottom: 8,
        }}
      >
        Level {levelNumber} Complete!
      </div>
      <div
        style={{
          fontSize: 15,
          color: '#4A5568',
          lineHeight: 1.7,
          marginBottom: 28,
        }}
      >
        {isFinalLevel
          ? "You've completed the entire OXYGY AI Upskilling Programme. Exceptional work."
          : `You've completed all ${topicCount} topics in ${levelName}. Level ${levelNumber + 1} is now unlocked.`}
      </div>

      {/* Newly unlocked tools */}
      {unlockedTools.length > 0 && (
        <div
          style={{
            background: `${accentColor}12`,
            borderRadius: 14,
            border: `1px solid ${accentColor}44`,
            padding: '20px 24px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accentDark,
              marginBottom: 10,
            }}
          >
            🔓 Newly Unlocked
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unlockedTools.map((tool) => (
              <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{tool.icon}</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                    {tool.name}
                  </span>
                  <span style={{ fontSize: 12, color: '#718096', marginLeft: 6 }}>
                    — {tool.description.split('.')[0]}.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/app/journey')}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = accentDark;
            (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = accentColor;
            (e.currentTarget as HTMLElement).style.color = accentDark;
          }}
          style={{
            background: accentColor,
            color: accentDark,
            border: 'none',
            borderRadius: 24,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Go to My Journey →
        </button>

        {isFinalLevel ? (
          <button
            onClick={() => navigate('/app/toolkit')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2D3748';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#1A202C';
            }}
            style={{
              background: '#1A202C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 24,
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Explore My Toolkit
          </button>
        ) : (
          <button
            onClick={onContinueToNextLevel}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2D3748';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#1A202C';
            }}
            style={{
              background: '#1A202C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 24,
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Continue to Level {levelNumber + 1}
          </button>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LevelCompletionView;
