import React from 'react';
import { Users } from 'lucide-react';
import type { CohortRow } from '../../../lib/analytics';
import AdminCard from '../AdminCard';
import AdminEmptyState from '../AdminEmptyState';
import MicroBar from './MicroBar';
import InsightLine from './InsightLine';
import { getCohortInsight } from '../../../lib/analytics';

interface CohortComparisonProps {
  cohorts: CohortRow[];
}

const CohortComparison: React.FC<CohortComparisonProps> = ({ cohorts }) => {
  if (cohorts.length < 2) {
    return (
      <AdminCard padding="20px">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>
          Cohort Comparison
        </div>
        <AdminEmptyState
          icon={<Users size={20} color="#A0AEC0" />}
          title="Not enough cohorts"
          description="Cohort comparison requires at least two cohorts. Create cohorts in the Enrollment tab to enable this view."
        />
      </AdminCard>
    );
  }

  function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const insight = getCohortInsight(cohorts);

  return (
    <AdminCard padding="20px">
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>
        Cohort Comparison
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', padding: '8px 0', borderBottom: '1px solid #EDF2F7',
        fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <span style={{ flex: 2 }}>Cohort</span>
        <span style={{ flex: 1, textAlign: 'center' }}>Members</span>
        <span style={{ flex: 1.5 }}>Active Rate</span>
        <span style={{ flex: 1, textAlign: 'center' }}>Avg Level</span>
        <span style={{ flex: 1.5 }}>Tool Usage</span>
      </div>

      {/* Rows */}
      {cohorts.map(cohort => (
        <div key={cohort.id} style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 0', borderBottom: '1px solid #F7FAFC', fontSize: 12,
        }}>
          <span style={{ flex: 2 }}>
            <span style={{ fontWeight: 600, color: '#1A202C' }}>{cohort.name}</span>
            <br />
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>
              {formatDate(cohort.startDate)} — {formatDate(cohort.endDate)}
            </span>
          </span>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#1A202C' }}>
            {cohort.members}
          </span>
          <span style={{ flex: 1.5 }}>
            <MicroBar value={cohort.activeRate} />
          </span>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#1A202C' }}>
            {cohort.avgLevel}
          </span>
          <span style={{ flex: 1.5 }}>
            <MicroBar value={cohort.toolUsageRate} />
          </span>
        </div>
      ))}

      {insight && <InsightLine text={insight} />}
    </AdminCard>
  );
};

export default CohortComparison;
