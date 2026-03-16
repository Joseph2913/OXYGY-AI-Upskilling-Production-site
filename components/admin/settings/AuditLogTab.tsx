import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search } from 'lucide-react';
import AdminCard from '../AdminCard';
import AdminEmptyState from '../AdminEmptyState';
import AuditLogEntryComponent from './AuditLogEntry';
import { supabase } from '../../../lib/supabase';

const PAGE_SIZE = 25;

interface AuditRow {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  org_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActorInfo { id: string; name: string }
interface OrgInfo { id: string; name: string }

const AuditLogTab: React.FC = () => {
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  const [actors, setActors] = useState<ActorInfo[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [actorMap, setActorMap] = useState<Record<string, string>>({});

  // Fetch filter options on mount
  useEffect(() => {
    (async () => {
      const { data: orgData } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (orgData) setOrgs(orgData);

      // Get distinct actor IDs from audit log + their names
      const { data: logActors } = await supabase
        .from('audit_log')
        .select('actor_id');
      if (logActors) {
        const uniqueIds = [...new Set(logActors.map(r => r.actor_id))];
        if (uniqueIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', uniqueIds);
          if (profiles) {
            const map: Record<string, string> = {};
            const list: ActorInfo[] = [];
            profiles.forEach(p => {
              map[p.id] = p.full_name || p.id.slice(0, 8);
              list.push({ id: p.id, name: p.full_name || p.id.slice(0, 8) });
            });
            setActorMap(map);
            setActors(list);
          }
        }
      }
    })();
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (actorFilter) query = query.eq('actor_id', actorFilter);
    if (actionFilter) query = query.eq('action', actionFilter);
    if (orgFilter) query = query.eq('org_id', orgFilter);
    if (search) {
      query = query.or(`action.ilike.%${search}%,metadata->>'org_name'.ilike.%${search}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (!error) {
      setEntries((data as AuditRow[]) || []);
      setTotal(count || 0);

      // Fetch any new actor names we don't have yet
      const newIds = (data || [])
        .map(r => (r as AuditRow).actor_id)
        .filter(id => !actorMap[id]);
      if (newIds.length > 0) {
        const uniqueNew = [...new Set(newIds)];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uniqueNew);
        if (profiles) {
          const newMap = { ...actorMap };
          profiles.forEach(p => { newMap[p.id] = p.full_name || p.id.slice(0, 8); });
          setActorMap(newMap);
        }
      }
    }
    setLoading(false);
  }, [page, search, actorFilter, actionFilter, orgFilter, actorMap]);

  useEffect(() => { fetchEntries(); }, [page, search, actorFilter, actionFilter, orgFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const ACTION_OPTIONS = [
    { group: 'Organisation', actions: ['org.create', 'org.update', 'org.deactivate', 'org.reactivate'] },
    { group: 'User', actions: ['user.invite', 'user.enroll', 'user.deactivate', 'user.role_change'] },
    { group: 'Channel', actions: ['channel.create', 'channel.deactivate'] },
    { group: 'Workshop', actions: ['workshop.create', 'workshop.deactivate'] },
    { group: 'Flags', actions: ['flag.toggle', 'flag.override_create', 'flag.override_delete'] },
  ];

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
    fontSize: 12, color: '#2D3748', background: '#FFFFFF',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  if (!loading && total === 0 && !search && !actorFilter && !actionFilter && !orgFilter) {
    return (
      <AdminEmptyState
        icon={<ScrollText size={20} color="#A0AEC0" />}
        title="No activity recorded yet"
        description="Admin actions will appear here as they happen — creating organisations, enrolling users, and managing the platform."
      />
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color="#A0AEC0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actions..."
            style={{
              ...selectStyle, width: '100%', paddingLeft: 34,
            }}
          />
        </div>
        <select value={actorFilter} onChange={e => { setActorFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Actors</option>
          {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.actions.map(a => <option key={a} value={a}>{a}</option>)}
            </optgroup>
          ))}
        </select>
        <select value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* Entries */}
      <AdminCard padding="0">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 20, height: 20, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
              borderRadius: '50%', animation: 'app-spin 0.7s linear infinite',
              margin: '0 auto',
            }} />
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#A0AEC0' }}>
            No matching entries found.
          </div>
        ) : (
          entries.map(entry => (
            <AuditLogEntryComponent
              key={entry.id}
              entry={{
                id: entry.id,
                actorId: entry.actor_id,
                action: entry.action,
                targetType: entry.target_type || undefined,
                targetId: entry.target_id || undefined,
                orgId: entry.org_id || undefined,
                metadata: entry.metadata || {},
                createdAt: entry.created_at,
              }}
              actorName={actorMap[entry.actor_id] || entry.actor_id.slice(0, 8)}
            />
          ))
        )}
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 16, fontSize: 12, color: '#718096',
        }}>
          <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} entries</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid #E2E8F0',
                background: '#FFFFFF', fontSize: 12, fontWeight: 600,
                color: page === 1 ? '#CBD5E0' : '#2D3748', cursor: page === 1 ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ← Previous
            </button>
            <span style={{ padding: '6px 0', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid #E2E8F0',
                background: '#FFFFFF', fontSize: 12, fontWeight: 600,
                color: page === totalPages ? '#CBD5E0' : '#2D3748', cursor: page === totalPages ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
