import React from 'react';
import AdminCard from '../AdminCard';
import InsightLine from './InsightLine';

interface Bar {
  label: string;
  value: number;
  maxValue: number;
  colour: string;
  displayValue: string;
}

interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  bars: Bar[];
  insightLine?: string;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ title, subtitle, bars, insightLine }) => {
  const maxVal = bars.length > 0 ? Math.max(...bars.map(b => b.maxValue), 1) : 1;

  return (
    <AdminCard padding="20px">
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 2 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 16 }}>
          {subtitle}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 160, fontSize: 12, color: '#4A5568',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {bar.label}
            </span>
            <div style={{ flex: 1, height: 28, borderRadius: 6, background: '#EDF2F7', overflow: 'hidden' }}>
              <div style={{
                width: maxVal > 0 ? `${(bar.value / maxVal) * 100}%` : '0%',
                height: '100%', borderRadius: 6,
                background: bar.colour,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              width: 80, fontSize: 12, fontWeight: 600, color: '#1A202C',
              textAlign: 'right' as const, flexShrink: 0,
            }}>
              {bar.displayValue}
            </span>
          </div>
        ))}
      </div>

      {bars.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: '#A0AEC0' }}>
          No data yet.
        </div>
      )}

      {insightLine && <InsightLine text={insightLine} />}
    </AdminCard>
  );
};

export default HorizontalBarChart;
