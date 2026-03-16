import React, { useState, useEffect } from 'react';
import MetricCardRow from '../../components/admin/analytics/MetricCardRow';
import DateRangeSelector from '../../components/admin/analytics/DateRangeSelector';
import HealthTable from '../../components/admin/analytics/HealthTable';
import HorizontalBarChart from '../../components/admin/analytics/HorizontalBarChart';
import {
  fetchDashboardAnalytics,
  getDateRange,
  getFunnelInsight,
  type DashboardMetrics,
} from '../../lib/analytics';

const FUNNEL_OPACITIES = [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

const AdminDashboard: React.FC = () => {
  const [days, setDays] = useState<number | null>(30);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dateRange = getDateRange(days);
    fetchDashboardAnalytics(dateRange).then(data => {
      if (!cancelled) {
        setMetrics(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [days]);

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: 0, marginBottom: 4 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>
            Cross-client metrics and programme health.
          </p>
        </div>
        <DateRangeSelector value={days} onChange={setDays} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{
            width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
            borderRadius: '50%', animation: 'app-spin 0.7s linear infinite', margin: '0 auto',
          }} />
          <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : metrics ? (
        <>
          {/* Metric Cards */}
          <MetricCardRow metrics={[
            {
              label: 'Organisations',
              value: metrics.totalOrgs,
              format: 'integer',
              trend: metrics.trends.totalOrgs,
            },
            {
              label: 'Total Users',
              value: metrics.totalUsers,
              format: 'integer',
              trend: metrics.trends.totalUsers,
            },
            {
              label: `Active (${days || 'All'}${days ? 'd' : ''})`,
              value: `${metrics.activeUsers} (${metrics.activeRate}%)`,
              format: 'integer',
              trend: metrics.trends.activeUsers,
            },
            {
              label: 'Avg Completion',
              value: metrics.avgCompletionRate,
              format: 'percentage',
              trend: metrics.trends.avgCompletionRate,
            },
            {
              label: 'Tool Usage',
              value: metrics.toolUsageRate,
              format: 'percentage',
              trend: metrics.trends.toolUsageRate,
            },
          ]} />

          {/* Health Table */}
          <div style={{ marginTop: 24 }}>
            <HealthTable rows={metrics.orgHealthRows} />
          </div>

          {/* Funnel + Feature Adoption */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
            <HorizontalBarChart
              title="Engagement Funnel"
              subtitle="User progression across the learning journey"
              bars={metrics.funnelStages.map((stage, i) => ({
                label: stage.label,
                value: stage.count,
                maxValue: metrics.funnelStages[0]?.count || 1,
                colour: `rgba(56, 178, 172, ${FUNNEL_OPACITIES[i] || 0.2})`,
                displayValue: `${stage.count} (${stage.percentage}%)`,
              }))}
              insightLine={getFunnelInsight(metrics.funnelStages)}
            />

            <HorizontalBarChart
              title="Feature Adoption"
              bars={metrics.featureAdoption.map(row => ({
                label: row.label,
                value: row.percentage,
                maxValue: 100,
                colour: row.colour,
                displayValue: `${row.percentage}% (${row.userCount})`,
              }))}
            />
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, fontSize: 14, color: '#718096' }}>
          Failed to load analytics data.
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
