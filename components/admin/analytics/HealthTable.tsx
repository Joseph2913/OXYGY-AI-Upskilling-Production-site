import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OrgHealthRow } from '../../../lib/analytics';
import AdminCard from '../AdminCard';
import MicroBar from './MicroBar';

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  foundation: { bg: '#E6FFFA', text: '#1A6B5F', label: 'Foundation' },
  accelerator: { bg: '#EBF4FF', text: '#2B6CB0', label: 'Accelerator' },
  catalyst: { bg: '#FAF5FF', text: '#6B46C1', label: 'Catalyst' },
};

const HEALTH_COLOURS: Record<string, string> = {
  green: '#48BB78',
  amber: '#ECC94B',
  red: '#E53E3E',
};

interface HealthTableProps {
  rows: OrgHealthRow[];
}

type SortKey = 'name' | 'enrolled' | 'activeRate' | 'completionRate' | 'toolUsageRate' | 'health';

const HealthTable: React.FC<HealthTableProps> = ({ rows }) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'health' || key === 'name');
    }
  };

  const healthOrder = { red: 0, amber: 1, green: 2 };
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'health') {
      cmp = healthOrder[a.health] - healthOrder[b.health];
    } else if (sortKey === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortAsc ? cmp : -cmp;
  });

  function relativeTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  const headerStyle = (key: SortKey): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    cursor: 'pointer', userSelect: 'none',
    padding: '12px 8px',
  });

  return (
    <AdminCard padding="0" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
          Organisation Health
        </span>
        <a
          href="/admin/organisations"
          onClick={e => { e.preventDefault(); navigate('/admin/organisations'); }}
          style={{ fontSize: 13, fontWeight: 600, color: '#38B2AC', textDecoration: 'none' }}
        >
          View all →
        </a>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#718096' }}>
          No organisations to display.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EDF2F7' }}>
                <th style={{ ...headerStyle('health'), width: '5%' }} onClick={() => handleSort('health')}>
                  {sortKey === 'health' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('name'), width: '22%', textAlign: 'left' }} onClick={() => handleSort('name')}>
                  Organisation {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('enrolled'), width: '10%' }} onClick={() => handleSort('enrolled')}>
                  Enrolled {sortKey === 'enrolled' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('activeRate'), width: '13%' }} onClick={() => handleSort('activeRate')}>
                  Active Rate {sortKey === 'activeRate' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('completionRate'), width: '13%' }} onClick={() => handleSort('completionRate')}>
                  Completion {sortKey === 'completionRate' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('toolUsageRate'), width: '13%' }} onClick={() => handleSort('toolUsageRate')}>
                  Tool Usage {sortKey === 'toolUsageRate' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ ...headerStyle('health'), width: '12%' }}>Last Activity</th>
                <th style={{ ...headerStyle('health'), width: '12%' }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => {
                const tier = TIER_STYLES[row.tier];
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: '1px solid #F7FAFC', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/organisations/${row.id}?tab=analytics`)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFBFC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: HEALTH_COLOURS[row.health],
                      }} />
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{row.name}</span>
                      {tier && (
                        <span style={{
                          display: 'inline-block', marginLeft: 8, padding: '1px 6px', borderRadius: 10,
                          fontSize: 10, fontWeight: 600, background: tier.bg, color: tier.text,
                        }}>
                          {tier.label}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                      {row.enrolled}
                    </td>
                    <td style={{ padding: '12px 8px' }}><MicroBar value={row.activeRate} /></td>
                    <td style={{ padding: '12px 8px' }}><MicroBar value={row.completionRate} /></td>
                    <td style={{ padding: '12px 8px' }}><MicroBar value={row.toolUsageRate} /></td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#718096' }}>
                      {relativeTime(row.lastActivity)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#38B2AC' }}>View →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
};

export default HealthTable;
