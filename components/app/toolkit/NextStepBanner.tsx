import React from 'react';
import { ArrowRight } from 'lucide-react';

const FONT = "'DM Sans', sans-serif";

interface NextStepBannerProps {
  accentColor: string;
  accentDark: string;
  text: string;
  title?: string;
  visible?: boolean;
}

const NextStepBanner: React.FC<NextStepBannerProps> = ({
  accentColor,
  accentDark,
  text,
  title = "What's next",
  visible = true,
}) => (
  <div
    style={{
      background: `${accentColor}15`,
      borderLeft: `4px solid ${accentDark}`,
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}
  >
    <ArrowRight size={16} color={accentDark} style={{ flexShrink: 0, marginTop: 2 }} />
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#1A202C',
          fontFamily: FONT,
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: '#4A5568',
          lineHeight: 1.6,
          fontFamily: FONT,
        }}
      >
        {text}
      </div>
    </div>
  </div>
);

export default NextStepBanner;
