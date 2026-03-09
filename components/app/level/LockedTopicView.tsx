import React from 'react';
import { Lock } from 'lucide-react';

interface LockedTopicViewProps {
  previousTopicTitle: string;
  accentColor: string;
  accentDark: string;
  onGoToCurrentTopic: () => void;
}

const LockedTopicView: React.FC<LockedTopicViewProps> = ({
  previousTopicTitle,
  accentColor,
  accentDark,
  onGoToCurrentTopic,
}) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '40px 36px',
        textAlign: 'center',
      }}
    >
      <Lock size={40} color="#CBD5E0" style={{ marginBottom: 14 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>
        Complete the previous topic first
      </div>
      <div style={{ fontSize: 14, color: '#718096', marginBottom: 20 }}>
        Finish "{previousTopicTitle}" to unlock this topic.
      </div>
      <button
        onClick={onGoToCurrentTopic}
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
        Go to current topic →
      </button>
    </div>
  );
};

export default LockedTopicView;
