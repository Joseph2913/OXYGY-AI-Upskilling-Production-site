import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  format?: 'integer' | 'percentage';
  trend?: number | null;
  trendLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, format, trend, trendLabel }) => {
  const isPercentage = format === 'percentage';
  const displayValue = isPercentage && typeof value === 'number' ? `${value}%` : value;

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: 12, padding: 20,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#A0AEC0',
        textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#1A202C' }}>
          {displayValue}
        </span>
        {trend !== undefined && trend !== null && trend !== 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600,
            color: trend > 0 ? '#48BB78' : '#E53E3E',
            marginLeft: 8,
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}{isPercentage ? 'pp' : ''}
          </span>
        )}
      </div>
      {trendLabel && (
        <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
          {trendLabel}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
