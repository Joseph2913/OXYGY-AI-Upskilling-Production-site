import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, ArrowUpDown, ChevronDown, Check,
  Zap, Bot, GitBranch, LayoutDashboard, Layers,
  BookOpen, FileText,
} from 'lucide-react';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
  LEVEL_SHORT_NAMES,
} from '../../../data/levelTopics';
import type { ArtefactType } from '../../../hooks/useArtefactsData';

const TYPE_CONFIG: { type: ArtefactType; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { type: 'prompt', label: 'Prompt', Icon: Zap },
  { type: 'agent', label: 'Agent', Icon: Bot },
  { type: 'workflow', label: 'Workflow', Icon: GitBranch },
  { type: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { type: 'app_spec', label: 'App Spec', Icon: Layers },
  { type: 'build_guide', label: 'Build Guide', Icon: BookOpen },
  { type: 'prd', label: 'PRD', Icon: FileText },
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

/* ── Dropdown wrapper (used for both Level and Type) ── */
function FilterDropdown({
  label,
  selectedCount,
  accentColor,
  children,
}: {
  label: string;
  selectedCount: number;
  accentColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasSelection = selectedCount > 0;
  const borderColor = hasSelection ? (accentColor || '#38B2AC') : '#E2E8F0';
  const bgColor = hasSelection ? `${accentColor || '#38B2AC'}12` : '#FFFFFF';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s',
          border: `1.5px solid ${borderColor}`,
          background: bgColor,
          color: hasSelection ? (accentColor ? LEVEL_ACCENT_DARK_COLORS[1] : '#1A202C') : '#4A5568',
        }}
      >
        {label}
        {hasSelection && (
          <span
            style={{
              background: accentColor || '#38B2AC',
              color: '#FFF',
              fontSize: 10, fontWeight: 700,
              borderRadius: 10, padding: '1px 6px',
              lineHeight: '16px',
            }}
          >
            {selectedCount}
          </span>
        )}
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            minWidth: 220, background: '#FFFFFF',
            border: '1px solid #E2E8F0', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            zIndex: 1000, padding: '6px 0',
            animation: 'dropFadeIn 0.12s ease-out',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const SearchFilterBar: React.FC<Props> = ({
  searchQuery, onSearchChange,
  activeTypes, onToggleType,
  activeLevels, onToggleLevel,
  sortMode, onSortChange,
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

  const allLevels = [1, 2, 3, 4, 5];

  return (
    <div
      style={{
        position: 'relative',
        background: '#F7FAFC', padding: '0 0 16px 0', zIndex: 1000,
      }}
    >
      <style>{`
        @keyframes dropFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
            onClick={() => handleInputChange('')}
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

      {/* Filter row: dropdowns + sort */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* ── Level Dropdown ── */}
        <FilterDropdown
          label="Level"
          selectedCount={activeLevels.size}
          accentColor="#38B2AC"
        >
          {allLevels.map((lvl) => {
            const active = activeLevels.has(lvl);
            const accent = LEVEL_ACCENT_COLORS[lvl];
            const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
            return (
              <button
                key={lvl}
                onClick={() => onToggleLevel(lvl)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px 10px 0',
                  background: active ? `${accent}30` : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit',
                  color: '#1A202C', fontWeight: active ? 600 : 400,
                  transition: 'background 0.1s',
                  borderLeft: `4px solid ${accent}`,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = `${accent}14`; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Color dot */}
                <span
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: accent,
                    border: `2px solid ${accentDark}`,
                    flexShrink: 0,
                    marginLeft: 10,
                  }}
                />
                {/* Label */}
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ fontWeight: 700, color: accentDark }}>L{lvl}</span>
                  <span style={{ color: '#4A5568', marginLeft: 6 }}>{LEVEL_SHORT_NAMES[lvl]}</span>
                </span>
                {/* Check */}
                {active && <Check size={14} color={accentDark} strokeWidth={3} />}
              </button>
            );
          })}
        </FilterDropdown>

        {/* ── Type Dropdown ── */}
        <FilterDropdown
          label="Asset Type"
          selectedCount={activeTypes.size}
        >
          {TYPE_CONFIG.map(({ type, label, Icon }) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px',
                  background: active ? '#EDF2F7' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit',
                  color: '#1A202C', fontWeight: active ? 600 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F7FAFC'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={14} color={active ? '#1A202C' : '#718096'} />
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {active && <Check size={14} color="#1A202C" strokeWidth={3} />}
              </button>
            );
          })}
        </FilterDropdown>

        {/* Active filter tags */}
        {activeLevels.size > 0 && Array.from(activeLevels).sort().map((lvl) => (
          <span
            key={`tag-l${lvl}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px 4px 8px', borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              background: LEVEL_ACCENT_COLORS[lvl],
              color: LEVEL_ACCENT_DARK_COLORS[lvl],
              border: `1px solid ${LEVEL_ACCENT_DARK_COLORS[lvl]}33`,
            }}
          >
            L{lvl}
            <button
              onClick={() => onToggleLevel(lvl)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center',
                marginLeft: 2,
              }}
            >
              <X size={12} color={LEVEL_ACCENT_DARK_COLORS[lvl]} />
            </button>
          </span>
        ))}

        {activeTypes.size > 0 && Array.from(activeTypes).map((type) => {
          const cfg = TYPE_CONFIG.find((t) => t.type === type);
          if (!cfg) return null;
          return (
            <span
              key={`tag-${type}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px 4px 8px', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                background: '#EDF2F7', color: '#1A202C',
                border: '1px solid #CBD5E0',
              }}
            >
              {cfg.label}
              <button
                onClick={() => onToggleType(type)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', alignItems: 'center',
                  marginLeft: 2,
                }}
              >
                <X size={12} color="#4A5568" />
              </button>
            </span>
          );
        })}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#38B2AC', fontWeight: 600, fontFamily: 'inherit',
              padding: '4px 8px',
            }}
          >
            Clear all
          </button>
        )}

        {/* Sort control — pushed right */}
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
