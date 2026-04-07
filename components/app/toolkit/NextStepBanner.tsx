import React from 'react';
import { ArrowRight } from 'lucide-react';

const FONT = "'DM Sans', sans-serif";

interface NextStepBannerProps {
  accentColor: string;
  accentDark: string;
  text: string;
  title?: string;
  visible?: boolean;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const NextStepBanner: React.FC<NextStepBannerProps> = ({
  accentColor,
  accentDark,
  text,
  title = "What's next",
  visible = true,
  primaryCta,
  secondaryCta,
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
      marginTop: 20,
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
      {(primaryCta || secondaryCta) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
          flexWrap: 'wrap',
        }}>
          {primaryCta && (
            <a
              href={primaryCta.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: accentDark, color: '#FFFFFF',
                borderRadius: 20, padding: '7px 18px',
                fontSize: 12, fontWeight: 700,
                textDecoration: 'none', fontFamily: FONT,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {primaryCta.label} <ArrowRight size={12} />
            </a>
          )}
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: accentDark, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', fontFamily: FONT,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      )}
    </div>
  </div>
);

export default NextStepBanner;
