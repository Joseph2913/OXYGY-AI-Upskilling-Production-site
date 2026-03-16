import React from 'react';
import AdminCard from '../AdminCard';
import InsightLine from './InsightLine';

const LEVEL_COLOURS: Record<number, string> = {
  1: '#A8F0E0',
  2: '#C3D0F5',
  3: '#F7E8A4',
  4: '#F5B8A0',
  5: '#38B2AC',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Level 5',
};

interface TimelinePoint {
  date: string;
  levels: Record<number, number>;
}

interface CompletionTimelineProps {
  data: TimelinePoint[];
  insightLine?: string;
}

const CompletionTimeline: React.FC<CompletionTimelineProps> = ({ data, insightLine }) => {
  if (data.length === 0) {
    return (
      <AdminCard padding="20px">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 2 }}>
          Completion Timeline
        </div>
        <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 16 }}>
          Cumulative tool completions over time
        </div>
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: '#A0AEC0' }}>
          No completion data available yet.
        </div>
      </AdminCard>
    );
  }

  // Calculate chart dimensions
  const width = 800;
  const height = 240;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 10;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Find max Y value across all levels
  let maxY = 0;
  data.forEach(pt => {
    Object.values(pt.levels).forEach(v => { const n = v as number; if (n > maxY) maxY = n; });
  });
  if (maxY === 0) maxY = 1;

  // Scale functions
  const xScale = (i: number) => padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
  const yScale = (v: number) => padTop + chartH - (v / maxY) * chartH;

  // Build paths for each level
  const levels = [1, 2, 3, 4, 5].filter(l => data.some(pt => (pt.levels[l] || 0) > 0));

  const paths = levels.map(level => {
    const points = data.map((pt, i) => `${xScale(i)},${yScale(pt.levels[level] || 0)}`);
    return {
      level,
      d: `M${points.join(' L')}`,
      colour: LEVEL_COLOURS[level],
    };
  });

  // X-axis labels (show ~6 labels max)
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  // Y-axis labels
  const yTicks = [0, Math.round(maxY / 2), maxY];

  return (
    <AdminCard padding="20px">
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 2 }}>
        Completion Timeline
      </div>
      <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 16 }}>
        Cumulative tool completions over time
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {yTicks.map(tick => (
          <line
            key={tick}
            x1={padLeft} y1={yScale(tick)}
            x2={width - padRight} y2={yScale(tick)}
            stroke="#EDF2F7" strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(tick => (
          <text
            key={tick}
            x={padLeft - 8} y={yScale(tick) + 4}
            textAnchor="end" fontSize={10} fill="#A0AEC0"
          >
            {tick}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(pt => {
          const i = data.indexOf(pt);
          const d = new Date(pt.date);
          const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          return (
            <text
              key={pt.date}
              x={xScale(i)} y={height - 8}
              textAnchor="middle" fontSize={10} fill="#A0AEC0"
            >
              {label}
            </text>
          );
        })}

        {/* Lines */}
        {paths.map(p => (
          <path
            key={p.level}
            d={p.d}
            fill="none"
            stroke={p.colour}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {levels.map(level => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4A5568' }}>
            <span style={{
              display: 'inline-block', width: 12, height: 3,
              borderRadius: 1, background: LEVEL_COLOURS[level],
            }} />
            {LEVEL_NAMES[level]}
          </div>
        ))}
      </div>

      {insightLine && <InsightLine text={insightLine} />}
    </AdminCard>
  );
};

export default CompletionTimeline;
