import React from 'react';
import MetricCard from './MetricCard';

interface MetricDef {
  label: string;
  value: string | number;
  format?: 'integer' | 'percentage';
  trend?: number | null;
  trendLabel?: string;
}

interface MetricCardRowProps {
  metrics: MetricDef[];
}

const MetricCardRow: React.FC<MetricCardRowProps> = ({ metrics }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
    gap: 16,
  }}>
    {metrics.map(m => (
      <MetricCard key={m.label} {...m} />
    ))}
  </div>
);

export default MetricCardRow;
