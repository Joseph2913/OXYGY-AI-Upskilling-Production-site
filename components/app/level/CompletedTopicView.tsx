import React from 'react';
import { CheckCircle, Check } from 'lucide-react';
import { Topic } from '../../../data/levelTopics';

interface CompletedTopicViewProps {
  topic: Topic;
  completedDate: Date;
  accentColor: string;
  accentDark: string;
  hasNextTopic: boolean;
  onReviewELearning: () => void;
  onNextTopic: () => void;
}

const PHASE_LABELS = ['E-Learn', 'Read', 'Watch', 'Practise'];

const CompletedTopicView: React.FC<CompletedTopicViewProps> = ({
  topic,
  completedDate,
  accentColor,
  accentDark,
  hasNextTopic,
  onReviewELearning,
  onNextTopic,
}) => {
  const dateStr = completedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accentColor}`,
        padding: '32px 36px',
        textAlign: 'center',
      }}
    >
      {/* Checkmark circle */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `${accentColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <CheckCircle size={28} color={accentDark} />
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 6 }}>
        Topic Complete
      </div>
      <div
        style={{
          fontSize: 14,
          color: '#718096',
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        You completed "{topic.title}" on {dateStr}.
      </div>

      {/* Phase review strip */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        {PHASE_LABELS.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: `${accentColor}33`,
              color: accentDark,
            }}
          >
            <Check size={11} />
            {label}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onReviewELearning}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#1A202C';
            (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#1A202C';
          }}
          style={{
            border: '1px solid #1A202C',
            borderRadius: 24,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 600,
            color: '#1A202C',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Review E-Learning →
        </button>

        {hasNextTopic && (
          <button
            onClick={onNextTopic}
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
            Next topic →
          </button>
        )}
      </div>
    </div>
  );
};

export default CompletedTopicView;
