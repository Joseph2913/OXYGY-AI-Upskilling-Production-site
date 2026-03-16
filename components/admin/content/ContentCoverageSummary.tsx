import React from 'react';
import AdminCard from '../AdminCard';
import AdminSectionLabel from '../AdminSectionLabel';
import { LEVEL_TOPICS, LEVEL_FULL_NAMES, LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS } from '../../../data/levelTopics';
import { TOPIC_CONTENT } from '../../../data/topicContent';

interface LevelCoverage {
  level: number;
  name: string;
  withContent: number;
  total: number;
  accentColor: string;
  accentDark: string;
}

function computeCoverage(): LevelCoverage[] {
  return [1, 2, 3, 4, 5].map(level => {
    const topics = LEVEL_TOPICS[level] || [];
    const withContent = topics.filter(t => {
      const c = TOPIC_CONTENT[`${level}-${t.id}`];
      return c && c.slides && c.slides.length > 0;
    }).length;
    return {
      level,
      name: LEVEL_FULL_NAMES[level] || `Level ${level}`,
      withContent,
      total: topics.length,
      accentColor: LEVEL_ACCENT_COLORS[level] || '#38B2AC',
      accentDark: LEVEL_ACCENT_DARK_COLORS[level] || '#1A7A76',
    };
  });
}

const ContentCoverageSummary: React.FC = () => {
  const coverage = computeCoverage();
  const totalWith = coverage.reduce((s, c) => s + c.withContent, 0);
  const totalAll = coverage.reduce((s, c) => s + c.total, 0);
  const overallPct = totalAll > 0 ? Math.round((totalWith / totalAll) * 100) : 0;

  return (
    <AdminCard padding="24px">
      <AdminSectionLabel text="Content Coverage" />
      {coverage.map(c => {
        const pct = c.total > 0 ? Math.round((c.withContent / c.total) * 100) : 0;
        return (
          <div key={c.level} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '10px 0', borderBottom: '1px solid #F7FAFC',
          }}>
            {/* Level pill */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: c.accentColor, color: c.accentDark, whiteSpace: 'nowrap',
            }}>
              L{c.level}
            </span>
            {/* Level name */}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', flex: 1 }}>
              Level {c.level}: {c.name}
            </span>
            {/* Progress bar */}
            <div style={{
              width: 120, height: 6, borderRadius: 3, background: '#EDF2F7', flexShrink: 0,
            }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 3,
                background: c.accentColor, transition: 'width 0.3s ease',
              }} />
            </div>
            {/* Fraction */}
            <span style={{ fontSize: 12, color: '#718096', whiteSpace: 'nowrap' }}>
              {c.withContent}/{c.total} topics
            </span>
            {/* Percentage */}
            <span style={{
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              color: pct === 100 ? '#22543D' : pct > 0 ? '#975A16' : '#A0AEC0',
            }}>
              ({pct}%)
            </span>
          </div>
        );
      })}

      {/* Overall summary */}
      <div style={{
        borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 8,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
          Overall: {totalWith} of {totalAll} topics have content
        </span>
        <div style={{
          width: 200, height: 6, borderRadius: 3, background: '#EDF2F7',
        }}>
          <div style={{
            width: `${overallPct}%`, height: '100%', borderRadius: 3,
            background: '#38B2AC', transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: overallPct === 100 ? '#22543D' : overallPct > 0 ? '#975A16' : '#A0AEC0',
        }}>
          ({overallPct}%)
        </span>
      </div>
    </AdminCard>
  );
};

export default ContentCoverageSummary;
