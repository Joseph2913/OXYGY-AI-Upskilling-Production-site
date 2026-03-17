import React from 'react';
import { Target, Image, Lightbulb, TrendingUp } from 'lucide-react';

export interface ReviewDimension {
  id: string;
  name: string;
  status: 'strong' | 'developing' | 'needs_attention';
  feedback: string;
}

interface DimensionRowProps {
  dimension: ReviewDimension;
  accentColor: string;
  accentDark: string;
  isLast: boolean;
  animDelay: number;
}

const ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  brief_alignment: Target,
  evidence_quality: Image,
  reflection_depth: Lightbulb,
  impact: TrendingUp,
};

export const DimensionRow: React.FC<DimensionRowProps> = ({
  dimension,
  accentColor,
  accentDark,
  isLast,
  animDelay,
}) => {
  const Icon = ICONS[dimension.id] || Target;

  const statusCircle = (() => {
    if (dimension.status === 'strong') {
      return (
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: accentDark,
        }} />
      );
    }
    if (dimension.status === 'developing') {
      return (
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'linear-gradient(to right, #F59E0B 50%, transparent 50%)',
          border: '1.5px solid #F59E0B',
          boxSizing: 'border-box',
        }} />
      );
    }
    return (
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        border: '1.5px solid #EF4444',
        background: 'transparent',
        boxSizing: 'border-box',
      }} />
    );
  })();

  const statusColor = dimension.status === 'strong'
    ? accentDark
    : dimension.status === 'developing'
      ? '#92400E'
      : '#DC2626';

  const statusLabel = dimension.status === 'strong'
    ? 'Strong'
    : dimension.status === 'developing'
      ? 'Developing'
      : 'Needs Attention';

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid #F7FAFC',
      padding: '14px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      animation: `dimFadeIn 0.3s ease ${animDelay}ms both`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left: icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${accentColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={14} color={accentDark} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>
            {dimension.name}
          </span>
        </div>

        {/* Right: status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {statusCircle}
          <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Feedback text */}
      <div style={{
        fontSize: 13, color: '#4A5568', lineHeight: 1.6,
        marginLeft: 38,
      }}>
        {dimension.feedback}
      </div>

      <style>{`
        @keyframes dimFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
