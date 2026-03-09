import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, ArrowUpDown,
  Zap, Bot, GitBranch, LayoutDashboard, Layers,
} from 'lucide-react';
import { LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS, LEVEL_SHORT_NAMES } from '../../../data/levelTopics';
import type { ArtefactType } from '../../../hooks/useArtefactsData';

const TYPE_CONFIG: { type: ArtefactType; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { type: 'prompt', label: 'Prompt', Icon: Zap },
  { type: 'agent', label: 'Agent', Icon: Bot },
  { type: 'workflow', label: 'Workflow', Icon: GitBranch },
  { type: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { type: 'app_spec', label: 'App Spec', Icon: Layers },
];

export type SortMode = 'recent' | 'oldest' | 'az';
const SORT_LABELS: Record<SortMode, string> = { recent: 'Recent', oldest: 'Oldest', az: 'A–Z' };
const SORT_CYCLE: SortMode[] = ['recent', 'oldest', 'az'];

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTypes: Set<ArtefactType>;
  onToggleType: (t: ArtefactType) => void;
  activeLevels: Set<number>;
  onToggleLevel: (l: number) => void;
  availableLevels: number[];
  sortMode: SortMode;
  onSortChange: (s: SortMode) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const SearchFilterBar: React.FC<Props> = ({
  searchQuery, onSearchChange,
  activeTypes, onToggleType,
  activeLevels, onToggleLevel,
  availableLevels, sortMode, onSortChange,
  hasActiveFilters, onClearFilters,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalQuery(searchQuery); }, [searchQuery]);

  const handleInputChange = useCallback((val: string) => {
    setLocalQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(val), 150);
  }, [onSearchChange]);

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    onSortChange(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  return (
    <div
      style={{
        position: 'sticky', top: 0,
        background: '#F7FAFC', padding: '0 0 16px 0', zIndex: 5,
      }}
    >
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search
          size={16} color="#A0AEC0"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search artefacts by name or content…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0', borderRadius: 12,
            padding: '12px 40px 12px 44px',
            fontSize: 14, color: '#1A202C',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.15s', outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        />
        {localQuery && (
          <button
            onClick={() => { handleInputChange(''); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} color="#A0AEC0" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Type chips */}
        {TYPE_CONFIG.map(({ type, label, Icon }) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'inherit',
                border: `1px solid ${active ? '#1A202C' : '#E2E8F0'}`,
                background: active ? '#1A202C' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#718096',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          );
        })}

        {/* Divider */}
        {availableLevels.length > 0 && (
          <div style={{ width: 1, height: 20, background: '#E2E8F0', flexShrink: 0 }} />
        )}

        {/* Level chips */}
        {availableLevels.map((lvl) => {
          const active = activeLevels.has(lvl);
          const accent = LEVEL_ACCENT_COLORS[lvl];
          const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
          return (
            <button
              key={lvl}
              onClick={() => onToggleLevel(lvl)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'inherit',
                background: active ? accent : `${accent}22`,
                border: `1px solid ${active ? accentDark : `${accent}66`}`,
                color: accentDark,
              }}
            >
              L{lvl} · {LEVEL_SHORT_NAMES[lvl]}
            </button>
          );
        })}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#38B2AC', fontWeight: 600, fontFamily: 'inherit',
              padding: '4px 8px',
            }}
          >
            Clear filters
          </button>
        )}

        {/* Sort control */}
        <button
          onClick={cycleSort}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#718096', fontWeight: 600, fontFamily: 'inherit',
            padding: '4px 0',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1A202C'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; }}
        >
          <ArrowUpDown size={12} />
          {SORT_LABELS[sortMode]}
        </button>
      </div>
    </div>
  );
};

export default SearchFilterBar;