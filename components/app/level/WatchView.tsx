import React from 'react';
import { Play, Video } from 'lucide-react';

const PLACEHOLDER_VIDEOS = [
  {
    source: 'YouTube · Andrej Karpathy',
    title: 'Intro to Large Language Models',
    description:
      "A clear, non-technical explanation of how LLMs work, what they're good at, and where they fall short. Essential viewing for anyone new to AI.",
    duration: '59:48',
  },
  {
    source: 'YouTube · 3Blue1Brown',
    title: 'But what is a GPT? Visual intro to transformers',
    description:
      'A visually rich walkthrough of the transformer architecture. Builds intuition without requiring a maths background.',
    duration: '27:14',
  },
];

interface WatchViewProps {
  accentColor: string;
  accentDark: string;
  onCompletePhase: () => void;
}

const WatchView: React.FC<WatchViewProps> = ({ accentColor, accentDark, onCompletePhase }) => {
  return (
    <div>
      {/* Hero section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`,
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Video size={20} color={accentColor} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
              Curated Videos
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Watch these expert videos to build deeper understanding
            </div>
          </div>
        </div>

        {/* Video cards — 16:9 thumbnails */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PLACEHOLDER_VIDEOS.map((video, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* 16:9 Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, transform 0.2s',
                      }}
                    >
                      <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                    </div>
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {video.duration}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: accentDark,
                      background: `${accentColor}33`,
                      padding: '2px 8px',
                      borderRadius: 20,
                      display: 'inline-block',
                      marginBottom: 8,
                    }}
                  >
                    {video.source}
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4, lineHeight: 1.3 }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>
                    {video.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onCompletePhase}
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
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Complete Watch →
        </button>
      </div>
    </div>
  );
};

export default WatchView;
