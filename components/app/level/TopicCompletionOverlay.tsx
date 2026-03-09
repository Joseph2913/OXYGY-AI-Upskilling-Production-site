import React, { useEffect, useState } from 'react';

const LEVEL_EMOJIS: Record<number, string> = {
  1: '⚡',
  2: '🤖',
  3: '🔗',
  4: '📊',
  5: '🚀',
};

interface TopicCompletionOverlayProps {
  levelNumber: number;
  nextTopicTitle: string;
  onComplete: () => void;
}

const TopicCompletionOverlay: React.FC<TopicCompletionOverlayProps> = ({
  levelNumber,
  nextTopicTitle,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress animation
    const startTimer = setTimeout(() => setProgress(100), 50);
    // Auto-complete after 1.5s
    const completeTimer = setTimeout(onComplete, 1500);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const emoji = LEVEL_EMOJIS[levelNumber] || '⚡';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        animation: 'fadeIn 0.2s ease',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 52,
          marginBottom: 16,
          animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {emoji}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', marginBottom: 6 }}>
        Topic Complete!
      </div>
      <div style={{ fontSize: 14, color: '#718096' }}>Moving to {nextTopicTitle}…</div>

      {/* Progress line at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: '#E2E8F0',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#38B2AC',
            transition: 'width 1.5s linear',
          }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TopicCompletionOverlay;
