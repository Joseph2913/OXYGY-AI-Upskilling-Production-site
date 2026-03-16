import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { listOrganisations } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Organisation } from '../../types';

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  foundation: { bg: '#E6FFFA', text: '#1A6B5F', label: 'Foundation' },
  accelerator: { bg: '#EBF4FF', text: '#2B6CB0', label: 'Accelerator' },
  catalyst: { bg: '#FAF5FF', text: '#6B46C1', label: 'Catalyst' },
};

type SortField = 'name' | 'tier' | 'userCount' | 'active' | 'createdAt';
type SortDir = 'asc' | 'desc' | null;

interface OrgRow extends Organisation {
  userCount: number;
}

const AdminOrgList: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    setLoading(true);
    try {
      // Fetch orgs with user counts
      const { data, error } = await supabase
        .from('organisations')
        .select('*, user_org_memberships(count)')
        .order('name');

      if (error) {
        console.error('fetchOrgs error:', error);
        // Fallback to simple list
        const simple = await listOrganisations();
        setOrgs(simple.map(o => ({ ...o, userCount: 0 })));
      } else {
        setOrgs((data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          domain: (row.domain as string) || null,
          tier: (row.tier as Organisation['tier']) || null,
          active: row.active as boolean,
          levelAccess: Array.isArray(row.level_access) ? row.level_access as number[] : [1, 2, 3, 4, 5],
          branding: (row.branding as Record<string, unknown>) || {},
          maxUsers: (row.max_users as number) || null,
          contactEmail: (row.contact_email as string) || null,
          contactName: (row.contact_name as string) || null,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          userCount: Array.isArray(row.user_org_memberships) && row.user_org_memberships.length > 0
            ? (row.user_org_memberships[0] as Record<string, number>)?.count ?? 0
            : 0,
        })));
      }
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = orgs;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o => o.name.toLowerCase().includes(s));
    }
    if (tierFilter) {
      result = result.filter(o => o.tier === tierFilter);
    }
    if (sortField && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'tier') cmp = (a.tier || '').localeCompare(b.tier || '');
        else if (sortField === 'userCount') cmp = a.userCount - b.userCount;
        else if (sortField === 'active') cmp = (a.active ? 1 : 0) - (b.active ? 1 : 0);
        else if (sortField === 'createdAt') cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [orgs, search, tierFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortDir(null); setSortField('name'); }
      else { setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortDir) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ marginLeft: 2 }} />
      : <ChevronDown size={12} style={{ marginLeft: 2 }} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#A0AEC0',
    textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px', fontSize: 13, color: '#2D3748',
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: 0 }}>
          Organisations
        </h1>
        <button
          onClick={() => navigate('/admin/organisations/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 24, border: 'none',
            background: '#38B2AC', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={15} /> New Organisation
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} color="#A0AEC0" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organisations..."
            style={{
              width: '100%', padding: '9px 14px 9px 36px',
              border: '1px solid #E2E8F0', borderRadius: 10,
              fontSize: 13, color: '#2D3748', background: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          style={{
            padding: '9px 14px', border: '1px solid #E2E8F0', borderRadius: 10,
            fontSize: 13, background: '#FFFFFF', color: '#2D3748',
            fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }}
        >
          <option value="">All Tiers</option>
          <option value="foundation">Foundation</option>
          <option value="accelerator">Accelerator</option>
          <option value="catalyst">Catalyst</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{
              width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
              borderRadius: '50%', animation: 'app-spin 0.7s linear infinite',
              margin: '0 auto',
            }} />
            <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
              {orgs.length === 0 ? 'No organisations yet' : 'No matching organisations'}
            </div>
            <div style={{ fontSize: 13, color: '#A0AEC0', marginBottom: 16 }}>
              {orgs.length === 0
                ? 'Create your first one to get started.'
                : 'Try adjusting your search or filter.'}
            </div>
            {orgs.length === 0 && (
              <button
                onClick={() => navigate('/admin/organisations/new')}
                style={{
                  padding: '9px 18px', borderRadius: 24, border: 'none',
                  background: '#38B2AC', color: '#FFFFFF',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                New Organisation
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ background: '#F7FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ ...thStyle, width: '30%' }} onClick={() => toggleSort('name')}>
                      Name <SortIcon field="name" />
                    </th>
                    <th style={{ ...thStyle, width: '15%' }} onClick={() => toggleSort('tier')}>
                      Tier <SortIcon field="tier" />
                    </th>
                    <th style={{ ...thStyle, width: '12%' }} onClick={() => toggleSort('userCount')}>
                      Users <SortIcon field="userCount" />
                    </th>
                    <th style={{ ...thStyle, width: '12%' }} onClick={() => toggleSort('active')}>
                      Status <SortIcon field="active" />
                    </th>
                    <th style={{ ...thStyle, width: '16%' }} onClick={() => toggleSort('createdAt')}>
                      Created <SortIcon field="createdAt" />
                    </th>
                    <th style={{ ...thStyle, width: '15%', cursor: 'default' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(org => (
                    <tr
                      key={org.id}
                      onClick={() => navigate(`/admin/organisations/${org.id}`, { state: { orgName: org.name } })}
                      style={{ borderBottom: '1px solid #F7FAFC', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={tdStyle}>
                        <div style={{
                          fontWeight: 600, color: '#1A202C',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250,
                        }}>
                          {org.name}
                        </div>
                        {org.domain && (
                          <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{org.domain}</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {org.tier && TIER_STYLES[org.tier] && (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                            background: TIER_STYLES[org.tier].bg, color: TIER_STYLES[org.tier].text,
                          }}>
                            {TIER_STYLES[org.tier].label}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{org.userCount}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 500,
                          color: org.active ? '#22543D' : '#9B2C2C',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: org.active ? '#48BB78' : '#FC8181',
                          }} />
                          {org.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDate(org.createdAt)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#38B2AC' }}>
                          View &rarr;
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #E2E8F0',
              fontSize: 12, color: '#A0AEC0',
            }}>
              Showing {filtered.length} of {orgs.length} organisations
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrgList;
