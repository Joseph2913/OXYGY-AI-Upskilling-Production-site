import React, { useState, useEffect } from 'react';
import MetricCardRow from './MetricCardRow';
import DateRangeSelector from './DateRangeSelector';
import HorizontalBarChart from './HorizontalBarChart';
import CompletionTimeline from './CompletionTimeline';
import StalledUsersList from './StalledUsersList';
import CohortComparison from './CohortComparison';
import {
  fetchOrgAnalytics,
  getDateRange,
  getLevelInsight,
  getTimelineInsight,
  type OrgAnalytics,
} from '../../../lib/analytics';

const LEVEL_COLOURS: Record<number, string> = {
  1: '#A8F0E0',
  2: '#C3D0F5',
  3: '#F7E8A4',
  4: '#F5B8A0',
  5: '#38B2AC',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Fundamentals & Awareness',
  2: 'Applied Capability',
  3: 'Systemic Integration',
  4: 'Interactive Dashboards',
  5: 'Full AI Applications',
};

interface OrgAnalyticsTabProps {
  orgId: string;
  orgName?: string;
}

const OrgAnalyticsTab: React.FC<OrgAnalyticsTabProps> = ({ orgId, orgName }) => {
  const [days, setDays] = useState<number | null>(30);
  const [data, setData] = useState<OrgAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dateRange = getDateRange(days);
    fetchOrgAnalytics(orgId, dateRange).then(result => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, days]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{
          width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'app-spin 0.7s linear infinite', margin: '0 auto',
        }} />
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 60, fontSize: 14, color: '#718096' }}>
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div>
      {/* Date Range */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <DateRangeSelector value={days} onChange={setDays} />
      </div>

      {/* Metric Cards */}
      <MetricCardRow metrics={[
        { label: 'Enrolled', value: data.enrolled, format: 'integer', trend: data.trends.enrolled },
        { label: 'Active Rate', value: data.activeRate, format: 'percentage', trend: data.trends.activeRate },
        { label: 'Completion Rate', value: data.completionRate, format: 'percentage', trend: data.trends.completionRate },
        { label: 'Tool Usage', value: data.toolUsageRate, format: 'percentage', trend: data.trends.toolUsageRate },
      ]} />

      {/* Level Distribution + Tool Adoption */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <HorizontalBarChart
          title="Level Distribution"
          subtitle="Where your users are in the learning journey"
          bars={data.levelDistribution.map(ld => ({
            label: `Level ${ld.level}: ${LEVEL_NAMES[ld.level] || ''}`,
            value: ld.count,
            maxValue: Math.max(...data.levelDistribution.map(d => d.count), 1),
            colour: LEVEL_COLOURS[ld.level] || '#38B2AC',
            displayValue: `${ld.count} (${ld.percentage}%)`,
          }))}
          insightLine={getLevelInsight(data.levelDistribution)}
        />

        <HorizontalBarChart
          title="Tool Adoption"
          bars={data.toolAdoption.map(row => ({
            label: row.label,
            value: row.percentage,
            maxValue: 100,
            colour: row.colour,
            displayValue: `${row.percentage}% (${row.userCount})`,
          }))}
        />
      </div>

      {/* Completion Timeline */}
      <div style={{ marginTop: 24 }}>
        <CompletionTimeline
          data={data.completionTimeline}
          insightLine={getTimelineInsight(data.completionTimeline)}
        />
      </div>

      {/* Stalled Users + Cohort Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <StalledUsersList
          users={data.stalledUsers}
          orgId={orgId}
          orgName={orgName || ''}
          totalStalled={data.stalledUsers.length}
        />
        <CohortComparison cohorts={data.cohortComparison} />
      </div>
    </div>
  );
};

export default OrgAnalyticsTab;
