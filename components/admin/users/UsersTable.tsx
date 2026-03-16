import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fetchAdminUsers } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';
import type { AdminUserRow } from '../../../lib/database';
import { LEVEL_PILL_STYLES } from '../../../data/dashboard-content';
import AdminEmptyState from '../AdminEmptyState';
import UserSearchBar from './UserSearchBar';
import UserDetailDrawer from './UserDetailDrawer';

const PAGE_SIZE = 20;

interface UsersTableProps {
  orgId?: string;
  showOrgColumn?: boolean;
  onInvite?: () => void;
}

interface OrgOption { id: string; name: string; }

function getUserStatus(lastActive: Date | null): { label: string; color: string; bg: string } {
  if (!lastActive) return { label: 'Never Active', color: '#A0AEC0', bg: '#EDF2F7' };
  const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 30) return { label: 'Active', color: '#22543D', bg: '#C6F6D5' };
  return { label: 'Stalled', color: '#975A16', bg: '#FEFCBF' };
}

function relativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return `${mins}m ago`;
  const days = Math.floor(ms / 86400000);
  if (days < 1) return `${hrs}h ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 1) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 1) return `${weeks}w ago`;
  return `${months}mo ago`;
}

// Enriched row with computed fields
export interface EnrichedUser extends AdminUserRow {
  toolsUsed: number;
  lastActive: Date | null;
}

const UsersTable: React.FC<UsersTableProps> = ({ orgId, showOrgColumn = true }) => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgs, setOrgs] = useState<OrgOption[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState(orgId || '');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sort
  const [sortCol, setSortCol] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // Drawer
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  // Fetch orgs for filter dropdown
  useEffect(() => {
    if (orgId) return; // skip if scoped to one org
    supabase.from('organisations').select('id, name').eq('active', true).order('name')
      .then(({ data }) => {
        if (data) setOrgs(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: r.name as string })));
      });
  }, [orgId]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminUsers({
        page,
        pageSize: PAGE_SIZE,
        orgId: orgId || orgFilter || undefined,
        levelFilter: levelFilter ? Number(levelFilter) : undefined,
        searchTerm: searchTerm || undefined,
        sortColumn: sortCol || undefined,
        sortAsc,
      });

      // Enrich with tools used + last activity (V1 batch approach)
      const enriched: EnrichedUser[] = await Promise.all(
        result.users.map(async (u) => {
          try {
            const [progressRes, promptsRes] = await Promise.all([
              supabase.from('level_progress').select('level, tool_used, updated_at').eq('user_id', u.userId),
              supabase.from('saved_prompts').select('saved_at').eq('user_id', u.userId).order('saved_at', { ascending: false }).limit(1),
            ]);
            const progress = progressRes.data || [];
            const toolsUsed = progress.filter((r: Record<string, unknown>) => r.tool_used).length;

            // Compute last activity
            const timestamps: number[] = [];
            progress.forEach((r: Record<string, unknown>) => {
              if (r.updated_at) timestamps.push(new Date(r.updated_at as string).getTime());
            });
            if (promptsRes.data?.[0]) {
              timestamps.push(new Date((promptsRes.data[0] as Record<string, unknown>).saved_at as string).getTime());
            }
            const lastActive = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

            return { ...u, toolsUsed, lastActive };
          } catch {
            return { ...u, toolsUsed: 0, lastActive: null };
          }
        }),
      );

      // Client-side status filter
      let filtered = enriched;
      if (statusFilter === 'active') {
        filtered = enriched.filter(u => {
          if (!u.lastActive) return false;
          return (Date.now() - u.lastActive.getTime()) / 86400000 <= 30;
        });
      } else if (statusFilter === 'stalled') {
        filtered = enriched.filter(u => {
          if (!u.lastActive) return false;
          return (Date.now() - u.lastActive.getTime()) / 86400000 > 30;
        });
      } else if (statusFilter === 'never') {
        filtered = enriched.filter(u => !u.lastActive);
      }

      // Client-side sort for derived columns
      if (sortCol === 'tools_used') {
        filtered.sort((a, b) => sortAsc ? a.toolsUsed - b.toolsUsed : b.toolsUsed - a.toolsUsed);
      } else if (sortCol === 'last_active') {
        filtered.sort((a, b) => {
          const aT = a.lastActive?.getTime() || 0;
          const bT = b.lastActive?.getTime() || 0;
          return sortAsc ? aT - bT : bT - aT;
        });
      }

      setUsers(filtered);
      setTotal(statusFilter ? filtered.length : result.total);
    } catch (err) {
      console.error('UsersTable loadUsers error:', err);
      setError('Failed to load users. Check the console for details.');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, orgId, orgFilter, levelFilter, searchTerm, sortCol, sortAsc, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, orgFilter, levelFilter, statusFilter]);

  function handleSort(col: string) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const all = await fetchAdminUsers({
        page: 1,
        pageSize: 10000,
        orgId: orgId || orgFilter || undefined,
        levelFilter: levelFilter ? Number(levelFilter) : undefined,
        searchTerm: searchTerm || undefined,
      });

      const headers = ['name', 'organisation', 'cohort', 'current_level', 'org_role', 'enrolled_at'];
      const rows = all.users.map(u => [
        u.fullName, u.orgName, u.cohortName || '', u.currentLevel, u.orgRole, u.enrolledAt,
      ]);
      const csv = [headers.join(','), ...rows.map(r =>
        r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
      )].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `oxygy-users-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(page * PAGE_SIZE, total);

  const columns = [
    { key: 'profiles.full_name', label: 'Name', width: showOrgColumn ? '18%' : '22%', sortable: true },
    ...(showOrgColumn ? [{ key: 'organisations.name', label: 'Organisation', width: '14%', sortable: true }] : []),
    { key: '', label: 'Cohort', width: '10%', sortable: false },
    { key: 'profiles.current_level', label: 'Level', width: '8%', sortable: true },
    { key: 'tools_used', label: 'Tool Usage', width: '10%', sortable: true },
    { key: 'last_active', label: 'Last Active', width: '10%', sortable: true },
    { key: '', label: 'Status', width: '10%', sortable: false },
  ];

  return (
    <>
      <UserSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        orgFilter={orgFilter}
        onOrgFilterChange={setOrgFilter}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        organisations={orgs}
        hideOrgFilter={!!orgId}
        onExport={handleExport}
        exporting={exporting}
      />

      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: columns.map(c => c.width).join(' '),
          background: '#F7FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 16px',
        }}>
          {columns.map(col => (
            <div
              key={col.label}
              onClick={() => col.sortable && col.key && handleSort(col.key)}
              style={{
                fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
                letterSpacing: '0.06em', cursor: col.sortable ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none',
              }}
            >
              {col.label}
              {col.sortable && sortCol === col.key && (
                sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
              )}
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{
              width: 20, height: 20, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
              borderRadius: '50%', animation: 'app-spin 0.7s linear infinite', margin: '0 auto',
            }} />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E53E3E', marginBottom: 8 }}>
              {error}
            </div>
            <button
              onClick={loadUsers}
              style={{
                padding: '6px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#4A5568',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && users.length === 0 && (
          <div style={{ padding: '32px 16px' }}>
            <AdminEmptyState
              icon={<Users size={20} color="#A0AEC0" />}
              title="No users found"
              description={
                searchTerm || orgFilter || levelFilter || statusFilter
                  ? 'No users match your current filters. Try adjusting your search.'
                  : 'No users have enrolled yet. Create an enrollment channel to get started.'
              }
            />
          </div>
        )}

        {/* Rows */}
        {!loading && !error && users.map(u => {
          const initial = (u.fullName || '?')[0].toUpperCase();
          const levelStyle = LEVEL_PILL_STYLES[u.currentLevel] || { bg: '#EDF2F7', text: '#4A5568' };
          const status = getUserStatus(u.lastActive);

          return (
            <div
              key={u.membershipId}
              onClick={() => setSelectedUser(u)}
              style={{
                display: 'grid',
                gridTemplateColumns: columns.map(c => c.width).join(' '),
                padding: '14px 16px', borderBottom: '1px solid #F7FAFC',
                cursor: 'pointer', fontSize: 13, alignItems: 'center',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#4A5568', flexShrink: 0,
                }}>
                  {initial}
                </div>
                <span style={{ fontWeight: 600, color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.fullName || 'Unnamed'}
                </span>
              </div>

              {/* Org */}
              {showOrgColumn && (
                <div style={{ color: '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.orgName || '\u2014'}
                </div>
              )}

              {/* Cohort */}
              <div style={{ color: u.cohortName ? '#4A5568' : '#CBD5E0' }}>
                {u.cohortName || '\u2014'}
              </div>

              {/* Level */}
              <div>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                  fontSize: 11, fontWeight: 700, background: levelStyle.bg, color: levelStyle.text,
                }}>
                  L{u.currentLevel}
                </span>
              </div>

              {/* Tool Usage */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>{u.toolsUsed}/5</span>
                <div style={{ width: 48, height: 3, borderRadius: 2, background: '#EDF2F7', marginTop: 3 }}>
                  <div style={{
                    width: `${(u.toolsUsed / 5) * 100}%`, height: '100%', borderRadius: 2, background: '#38B2AC',
                  }} />
                </div>
              </div>

              {/* Last Active */}
              <div style={{ color: u.lastActive ? '#4A5568' : '#CBD5E0' }}>
                {relativeTime(u.lastActive)}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: status.bg, color: status.color,
                }}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: 12, color: '#A0AEC0' }}>
              Showing {showFrom}\u2013{showTo} of {total} users
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                  fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1, background: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif", color: '#4A5568',
                }}
              >
                &larr; Previous
              </button>
              <span style={{ fontSize: 12, color: '#718096' }}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                  fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.4 : 1, background: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif", color: '#4A5568',
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={loadUsers}
        />
      )}
    </>
  );
};

export default UsersTable;
