import React, { useEffect, useRef } from 'react';
import { Search, Download } from 'lucide-react';

interface Organisation { id: string; name: string; }

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  orgFilter: string;
  onOrgFilterChange: (v: string) => void;
  levelFilter: string;
  onLevelFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  organisations: Organisation[];
  hideOrgFilter?: boolean;
  onExport: () => void;
  exporting?: boolean;
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  fontSize: 13, color: '#4A5568', background: '#FFFFFF', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", outline: 'none',
};

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  searchTerm, onSearchChange, orgFilter, onOrgFilterChange,
  levelFilter, onLevelFilterChange, statusFilter, onStatusFilterChange,
  organisations, hideOrgFilter, onExport, exporting,
}) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [localSearch, setLocalSearch] = React.useState(searchTerm);

  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

  function handleSearch(v: string) {
    setLocalSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(v), 300);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      {/* Search input */}
      <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
        <Search size={14} color="#A0AEC0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by name..."
          value={localSearch}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
            border: '1px solid #E2E8F0', fontSize: 13, color: '#2D3748',
            fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Org filter */}
      {!hideOrgFilter && (
        <select value={orgFilter} onChange={e => onOrgFilterChange(e.target.value)} style={selectStyle}>
          <option value="">All Organisations</option>
          {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      )}

      {/* Level filter */}
      <select value={levelFilter} onChange={e => onLevelFilterChange(e.target.value)} style={selectStyle}>
        <option value="">All Levels</option>
        {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
      </select>

      {/* Status filter */}
      <select value={statusFilter} onChange={e => onStatusFilterChange(e.target.value)} style={selectStyle}>
        <option value="">All</option>
        <option value="active">Active (30d)</option>
        <option value="stalled">Stalled (30d+)</option>
        <option value="never">Never Active</option>
      </select>

      {/* CSV Export */}
      <button
        onClick={onExport}
        disabled={exporting}
        title="Export filtered users as CSV"
        style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
          background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: exporting ? 'wait' : 'pointer', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F7FAFC'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}
      >
        <Download size={14} color="#718096" />
      </button>
    </div>
  );
};

export default UserSearchBar;
