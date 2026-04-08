import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Send, Sparkles, ArrowRight, Lock,
  LayoutGrid, List, ChevronLeft, FolderOpen, Loader2,
  FileText, Award, Star, Copy, Trash2, ExternalLink,
  ChevronDown, ChevronUp, ChevronRight, Check, X, Pencil,
} from 'lucide-react';
import { TOOL_ICON_MAP } from '../../components/app/workspace/ToolIcons';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import LearningPlanBlocker from '../../components/app/LearningPlanBlocker';
import { useArtefactsData } from '../../hooks/useArtefactsData';
import type { ArtefactContent, Artefact, ArtefactType } from '../../hooks/useArtefactsData';
import { useToolkitData } from '../../hooks/useToolkitData';
import SearchFilterBar from '../../components/app/artefacts/SearchFilterBar';
import type { SortMode, ArtefactCategory } from '../../components/app/artefacts/SearchFilterBar';
import { CATEGORY_TO_TYPES } from '../../components/app/artefacts/SearchFilterBar';
import ArtefactGrid from '../../components/app/artefacts/ArtefactGrid';
import QuickUsePanel from '../../components/app/artefacts/QuickUsePanel';
import { ToastContainer, showToast } from '../../components/app/Toast';
import { timeAgo } from '../../utils/timeAgo';
import { ALL_TOOLS, PRIMARY_TOOL_IDS } from '../../data/toolkitData';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
  LEVEL_SHORT_NAMES,
  LEVEL_FULL_NAMES,
  LEVEL_TOPICS,
} from '../../data/levelTopics';
import { getLatestLearningPlan } from '../../lib/database';
import type { PathwayLevelResult } from '../../types';
import WorkspaceChat from '../../components/app/workspace/WorkspaceChat';

/* ── Chat session storage key ── */
const CHAT_STORAGE_KEY = 'oxygy_workspace_chat';

/* ── Prompt starters — one per template tool ── */
const PROMPT_STARTERS = [
  {
    toolId: 'prompt-playground',
    label: 'Write a prompt',
    template: 'I want to write a well-structured prompt for a specific task.',
  },
  {
    toolId: 'agent-builder',
    label: 'Design an AI agent',
    template: 'I want to design a reusable AI agent for a process in my team.',
  },
  {
    toolId: 'workflow-canvas',
    label: 'Map a workflow',
    template: 'I want to map and automate an end-to-end workflow.',
  },
  {
    toolId: 'dashboard-designer',
    label: 'Design an app',
    template: 'I want to design and scope an application.',
  },
  {
    toolId: 'ai-app-evaluator',
    label: 'Evaluate an AI app',
    template: 'I want to evaluate the architecture and feasibility of an AI application idea.',
  },
  {
    toolId: 'learning-coach',
    label: 'Get learning guidance',
    template: 'I want personalised learning resources on a specific AI topic.',
  },
];

/* ── Template cards data (primary tools + learning coach) ── */
const TEMPLATE_CARDS = [
  ...ALL_TOOLS.filter((t) =>
    ['prompt-playground', 'agent-builder', 'workflow-canvas', 'dashboard-designer', 'ai-app-evaluator'].includes(t.id)
  ),
  {
    id: 'learning-coach',
    name: 'Learning Coach',
    icon: '🎓',
    levelRequired: 0,
    levelName: 'Adaptive',
    toolType: 'Coach',
    description: 'Get personalised guidance on your AI learning journey. The coach adapts to your level and goals.',
    route: '/app/toolkit/learning-coach',
    accentColor: '#38B2AC',
    accentDark: '#2C9A94',
    capabilities: [],
  },
];

/* ── Artefact list view type label helper ── */
const TYPE_DISPLAY: Record<ArtefactType, string> = {
  prompt: 'Prompt', agent: 'Agent', workflow: 'Workflow', dashboard: 'Dashboard',
  app_spec: 'App Spec', build_guide: 'Build Guide', prd: 'PRD',
  pathway: 'Learning Coach', project_proof: 'Project Proof',
};

/* Map artefact types → tool icon components for list view */
const TYPE_TO_TOOL_ICON: Record<ArtefactType, string> = {
  prompt: 'prompt-playground',
  agent: 'agent-builder',
  workflow: 'workflow-canvas',
  dashboard: 'dashboard-designer',
  app_spec: 'ai-app-evaluator',
  build_guide: 'dashboard-designer',
  prd: 'ai-app-evaluator',
  pathway: 'learning-coach',
  project_proof: '',
};

/* ── ListRow — single row in the enhanced list view ── */
interface ListRowProps {
  artefact: Artefact;
  isLast: boolean;
  isSelected: boolean;
  isFavourite: boolean;
  isEditing: boolean;
  editValue: string;
  editInputRef?: React.RefObject<HTMLInputElement | null>;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onToggleFavourite: (id: string, e: React.MouseEvent) => void;
  onOpen: (id: string) => void;
  onStartRename: (id: string, name: string, e: React.MouseEvent) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onEditNameChange: (v: string) => void;
  onDuplicate: (id: string, name: string, e: React.MouseEvent) => void;
  onArchive: (id: string, name: string, e: React.MouseEvent) => void;
}

const ListRow: React.FC<ListRowProps> = React.memo(({
  artefact: a, isLast, isSelected, isFavourite, isEditing,
  editValue, editInputRef,
  onToggleSelect, onToggleFavourite, onOpen, onStartRename,
  onCommitRename, onCancelRename, onEditNameChange,
  onDuplicate, onArchive,
}) => {
  const toolIconId = TYPE_TO_TOOL_ICON[a.type];
  const IconComp = toolIconId ? TOOL_ICON_MAP[toolIconId] : null;
  const accent = LEVEL_ACCENT_COLORS[a.level] || '#E2E8F0';
  const accentDark = LEVEL_ACCENT_DARK_COLORS[a.level] || '#4A5568';

  return (
    <div
      className={`ws-list-row${isSelected ? ' ws-row-selected' : ''}`}
      onClick={() => onOpen(a.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 28px 1fr 130px 110px 120px 120px 100px',
        gap: 8,
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid #F0F0F0',
        cursor: 'pointer',
        transition: 'background 0.12s',
        alignItems: 'center',
      }}
    >
      {/* Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={(e) => onToggleSelect(a.id, e)}
          style={{
            width: 18, height: 18, borderRadius: 4,
            border: `1.5px solid ${isSelected ? '#38B2AC' : '#CBD5E0'}`,
            background: isSelected ? '#38B2AC' : '#FFFFFF',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s',
          }}
        >
          {isSelected && <Check size={12} color="#FFFFFF" />}
        </button>
      </div>

      {/* Star */}
      <button
        className={`ws-star-btn${isFavourite ? ' ws-starred' : ''}`}
        onClick={(e) => onToggleFavourite(a.id, e)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        title={isFavourite ? 'Unpin' : 'Pin to top'}
      >
        <Star size={15} fill={isFavourite ? '#ECC94B' : 'none'} />
      </button>

      {/* Name + icon + preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {IconComp ? (
            <IconComp size={20} color={accentDark} />
          ) : a.type === 'project_proof' ? (
            <Award size={20} color={accentDark} />
          ) : (
            <FileText size={20} color={accentDark} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {isEditing ? (
            <input
              ref={editInputRef as React.RefObject<HTMLInputElement>}
              className="ws-inline-input"
              value={editValue}
              onChange={(e) => onEditNameChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onCommitRename(); }
                if (e.key === 'Escape') onCancelRename();
              }}
              onBlur={onCommitRename}
              autoFocus
            />
          ) : (
            <>
              <div
                onDoubleClick={(e) => onStartRename(a.id, a.name, e)}
                style={{
                  fontSize: 14, fontWeight: 600, color: '#1A202C',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                title="Double-click to rename"
              >
                {a.name}
              </div>
              {a.preview && (
                <div style={{
                  fontSize: 12, color: '#A0AEC0', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {a.preview}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Type */}
      <div style={{ fontSize: 13, color: '#4A5568' }}>
        {TYPE_DISPLAY[a.type] || a.type}
      </div>

      {/* Level chip */}
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 12, fontWeight: 600,
          color: accentDark,
          background: `${accent}20`,
          padding: '3px 10px', borderRadius: 20,
          whiteSpace: 'nowrap',
        }}>
          Level {a.level}
        </span>
      </div>

      {/* Created */}
      <div style={{ fontSize: 13, color: '#718096' }}>
        {timeAgo(a.createdAt)}
      </div>

      {/* Last opened */}
      <div style={{ fontSize: 13, color: '#718096' }}>
        {a.lastOpenedAt ? timeAgo(a.lastOpenedAt) : '–'}
      </div>

      {/* Hover actions */}
      <div className="ws-row-actions" style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <button
          className="ws-action-btn"
          title="Rename"
          onClick={(e) => onStartRename(a.id, a.name, e)}
        >
          <Pencil size={14} />
        </button>
        <button
          className="ws-action-btn"
          title="Duplicate"
          onClick={(e) => onDuplicate(a.id, a.name, e)}
        >
          <Copy size={14} />
        </button>
        <button
          className="ws-action-btn"
          title="Archive"
          onClick={(e) => onArchive(a.id, a.name, e)}
          style={{ color: '#E53E3E' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

/* ── ListGroup — collapsible level group ── */
interface ListGroupProps {
  level: number;
  items: Artefact[];
  selectedRows: Set<string>;
  favourites: Set<string>;
  editingNameId: string | null;
  editingNameValue: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onToggleFavourite: (id: string, e: React.MouseEvent) => void;
  onOpen: (id: string) => void;
  onStartRename: (id: string, name: string, e: React.MouseEvent) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onEditNameChange: (v: string) => void;
  onDuplicate: (id: string, name: string, e: React.MouseEvent) => void;
  onArchive: (id: string, name: string, e: React.MouseEvent) => void;
}

const ListGroup: React.FC<ListGroupProps> = ({ level, items, ...rowProps }) => {
  const [collapsed, setCollapsed] = useState(false);
  const accent = LEVEL_ACCENT_COLORS[level] || '#E2E8F0';
  const accentDark = LEVEL_ACCENT_DARK_COLORS[level] || '#4A5568';

  return (
    <div>
      <div
        className="ws-group-header"
        onClick={() => setCollapsed((p) => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 20px',
          background: `${accent}08`,
          borderBottom: '1px solid #E2E8F0',
          transition: 'background 0.12s',
        }}
      >
        {collapsed ? <ChevronRight size={16} color={accentDark} /> : <ChevronDown size={16} color={accentDark} />}
        <span style={{
          fontSize: 12, fontWeight: 700, color: accentDark,
          background: `${accent}20`,
          padding: '2px 10px', borderRadius: 20,
        }}>
          Level {level}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
          {LEVEL_SHORT_NAMES[level]}
        </span>
        <span style={{ fontSize: 12, color: '#A0AEC0', marginLeft: 'auto' }}>
          {items.length} artefact{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      {!collapsed && items.map((a, idx) => (
        <ListRow
          key={a.id}
          artefact={a}
          isLast={idx === items.length - 1}
          isSelected={rowProps.selectedRows.has(a.id)}
          isFavourite={rowProps.favourites.has(a.id)}
          isEditing={rowProps.editingNameId === a.id}
          editValue={rowProps.editingNameValue}
          editInputRef={rowProps.editingNameId === a.id ? rowProps.editInputRef : undefined}
          onToggleSelect={rowProps.onToggleSelect}
          onToggleFavourite={rowProps.onToggleFavourite}
          onOpen={rowProps.onOpen}
          onStartRename={rowProps.onStartRename}
          onCommitRename={rowProps.onCommitRename}
          onCancelRename={rowProps.onCancelRename}
          onEditNameChange={rowProps.onEditNameChange}
          onDuplicate={rowProps.onDuplicate}
          onArchive={rowProps.onArchive}
        />
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   AppWorkspace — combined Toolkit + Artefacts page
   ════════════════════════════════════════════════════════════════════ */
const AppWorkspace: React.FC = () => {
  const { artefactId } = useParams<{ artefactId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasLearningPlan, learningPlanLoading, userProfile, orgContext } = useAppContext();

  /* ── Artefacts data ── */
  const {
    artefacts, archivedArtefacts, loading: artefactsLoading, loadContent,
    renameArtefact, duplicateArtefact, archiveArtefact,
    restoreArtefact, loadArchived,
    markOpened, updateContent,
  } = useArtefactsData();

  /* ── Toolkit data (for unlock status) ── */
  const { data: toolkitData } = useToolkitData();

  /* ── Chat mode state (workspace vs chat view) ── */
  const [chatMode, setChatMode] = useState<{
    active: boolean; toolId: string; prompt: string; initialReply?: string;
  }>({ active: false, toolId: '', prompt: '' });

  /* ── Chat state (persisted to sessionStorage) ── */
  const [chatInput, setChatInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownView, setDropdownView] = useState<'prompts' | 'levels'>('prompts');
  const [prefillLoading, setPrefillLoading] = useState(false);
  const chatRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  /* ── Learning plan data (for project help) ── */
  const [learningPlanLevels, setLearningPlanLevels] = useState<Record<string, PathwayLevelResult>>({});

  useEffect(() => {
    if (!user) return;
    getLatestLearningPlan(user.id).then((result) => {
      if (result?.plan?.levels) {
        setLearningPlanLevels(result.plan.levels as Record<string, PathwayLevelResult>);
      }
    });
  }, [user]);

  // (No sessionStorage persistence — fresh state each visit)

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setDropdownView('prompts');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);



  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [chatInput]);

  /* ── View mode (grid vs list) ── */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  /* ── List view enhancements ── */
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('oxygy_artefact_favourites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [listSortCol, setListSortCol] = useState<'name' | 'type' | 'level' | 'created' | 'opened'>('created');
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByLevel, setGroupByLevel] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'archive' | 'duplicate';
    ids: string[];
    name?: string;
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Persist favourites
  useEffect(() => {
    localStorage.setItem('oxygy_artefact_favourites', JSON.stringify([...favourites]));
  }, [favourites]);

  const toggleFavourite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleRowSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedRows((prev) => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  }, []);

  const handleBulkArchive = useCallback(() => {
    setConfirmAction({ type: 'archive', ids: [...selectedRows] });
  }, [selectedRows]);

  const handleBulkDuplicate = useCallback(() => {
    setConfirmAction({ type: 'duplicate', ids: [...selectedRows] });
  }, [selectedRows]);

  const confirmArchiveSingle = useCallback((id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction({ type: 'archive', ids: [id], name });
  }, []);

  const confirmDuplicateSingle = useCallback((id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction({ type: 'duplicate', ids: [id], name });
  }, []);

  const executeConfirmedAction = useCallback(async () => {
    if (!confirmAction) return;
    const { type, ids } = confirmAction;
    if (type === 'archive') {
      for (const id of ids) await archiveArtefact(id);
      setSelectedRows((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      showToast(`${ids.length} artefact${ids.length > 1 ? 's' : ''} archived.`);
    } else {
      for (const id of ids) await duplicateArtefact(id);
      showToast(`${ids.length} artefact${ids.length > 1 ? 's' : ''} duplicated.`);
    }
    setConfirmAction(null);
  }, [confirmAction, archiveArtefact, duplicateArtefact]);

  const startInlineRename = useCallback((id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(id);
    setEditingNameValue(currentName);
    setTimeout(() => editInputRef.current?.select(), 50);
  }, []);

  const commitRename = useCallback(async () => {
    if (editingNameId && editingNameValue.trim()) {
      const success = await renameArtefact(editingNameId, editingNameValue.trim());
      if (!success) showToast("Couldn't save name. Try again.", 'error');
    }
    setEditingNameId(null);
    setEditingNameValue('');
  }, [editingNameId, editingNameValue, renameArtefact]);

  const cancelRename = useCallback(() => {
    setEditingNameId(null);
    setEditingNameValue('');
  }, []);

  const handleColumnSort = useCallback((col: 'name' | 'type' | 'level' | 'created' | 'opened') => {
    setListSortCol((prev) => {
      if (prev === col) {
        setListSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setListSortDir(col === 'name' || col === 'type' ? 'asc' : 'desc');
      return col;
    });
  }, []);

  /* ── Filter/search state ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<ArtefactCategory>>(new Set());
  const [activeLevels, setActiveLevels] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  /* ── Panel state ── */
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelContent, setPanelContent] = useState<ArtefactContent | null>(null);

  const availableLevels = useMemo(() => [1, 2, 3, 4, 5], []);

  /* ── Filtered artefacts ── */
  const filteredArtefacts = useMemo(() => {
    let result = [...artefacts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.preview && a.preview.toLowerCase().includes(q))
      );
    }
    if (activeCategories.size > 0) {
      const allowedTypes = new Set(
        Array.from(activeCategories).flatMap((cat) => CATEGORY_TO_TYPES[cat])
      );
      result = result.filter((a) => allowedTypes.has(a.type));
    }
    if (activeLevels.size > 0) {
      result = result.filter((a) => activeLevels.has(a.level));
    }
    if (sortMode === 'recent') {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortMode === 'oldest') {
      result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [artefacts, searchQuery, activeCategories, activeLevels, sortMode]);

  /* ── List-view sorted artefacts (favourites pinned, then column sort) ── */
  const listSortedArtefacts = useMemo(() => {
    const result = [...filteredArtefacts];
    // Column sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (listSortCol) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'type': cmp = (TYPE_DISPLAY[a.type] || a.type).localeCompare(TYPE_DISPLAY[b.type] || b.type); break;
        case 'level': cmp = a.level - b.level; break;
        case 'created': cmp = a.createdAt.getTime() - b.createdAt.getTime(); break;
        case 'opened': cmp = (a.lastOpenedAt?.getTime() || 0) - (b.lastOpenedAt?.getTime() || 0); break;
      }
      return listSortDir === 'asc' ? cmp : -cmp;
    });
    // Pin favourites to top
    result.sort((a, b) => {
      const af = favourites.has(a.id) ? 0 : 1;
      const bf = favourites.has(b.id) ? 0 : 1;
      return af - bf;
    });
    return result;
  }, [filteredArtefacts, listSortCol, listSortDir, favourites]);

  /* ── Grouped by level (for group view) ── */
  const groupedArtefacts = useMemo(() => {
    if (!groupByLevel) return null;
    const groups: Record<number, Artefact[]> = {};
    for (const a of listSortedArtefacts) {
      if (!groups[a.level]) groups[a.level] = [];
      groups[a.level].push(a);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, items]) => ({ level: Number(level), items }));
  }, [listSortedArtefacts, groupByLevel]);

  const hasActiveFilters = searchQuery.length > 0 || activeCategories.size > 0 || activeLevels.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategories(new Set());
    setActiveLevels(new Set());
  }, []);

  const toggleCategory = useCallback((c: ArtefactCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }, []);

  const toggleLevel = useCallback((l: number) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l); else next.add(l);
      return next;
    });
  }, []);

  /* ── Panel actions ── */
  const openPanel = useCallback(async (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
    setPanelContent(null);
    navigate(`/app/workspace/${id}`, { replace: true });
    markOpened(id);
    const content = await loadContent(id);
    setPanelContent(content);
  }, [navigate, loadContent, markOpened]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedId(null);
    setPanelContent(null);
    setTimeout(() => navigate('/app/workspace', { replace: true }), 250);
  }, [navigate]);

  useEffect(() => {
    if (artefactId && artefacts.length > 0 && !panelOpen) {
      const exists = artefacts.find((a) => a.id === artefactId);
      if (exists) openPanel(artefactId);
    }
  }, [artefactId, artefacts, panelOpen, openPanel]);

  const handleRename = useCallback(async (id: string, newName: string) => {
    const success = await renameArtefact(id, newName);
    if (!success) showToast("Couldn't save name. Try again.", 'error');
  }, [renameArtefact]);

  const handleDuplicate = useCallback(async (id: string) => {
    const result = await duplicateArtefact(id);
    if (result) showToast('Artefact duplicated.');
  }, [duplicateArtefact]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveArtefact(id);
    if (selectedId === id) closePanel();
    showToast('Artefact archived.');
  }, [archiveArtefact, selectedId, closePanel]);

  const handleUpdateContent = useCallback(async (id: string, content: ArtefactContent) => {
    await updateContent(id, content);
    setPanelContent(content);
    showToast('Changes saved.');
  }, [updateContent]);

  /* ── Chat submit: route freeform input via intent classifier ── */
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setPrefillLoading(true);
    setDropdownOpen(false);

    try {
      const res = await fetch('/api/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          userData: {
            name: userProfile?.fullName || '',
            role: userProfile?.role || '',
            level: userProfile?.currentLevel || 1,
            aiExperience: userProfile?.aiExperience || '',
            orgName: orgContext?.orgName || '',
            assignedLevels: assignedLevels,
          },
          isRouting: true,
        }),
      });

      if (!res.ok) throw new Error('routing failed');
      const data = await res.json();

      if (data.intent === 'tool' && data.toolId) {
        // Route to the guided toolkit flow
        setChatMode({ active: true, toolId: data.toolId, prompt: text });
      } else {
        // General or ambiguous — enter general chat
        const initialReply = data.reply || data.followUpQuestion || undefined;
        setChatMode({ active: true, toolId: 'general', prompt: text, initialReply });
      }
    } catch {
      // Fallback: enter general chat
      setChatMode({ active: true, toolId: 'general', prompt: text });
    } finally {
      setPrefillLoading(false);
    }
  }, [chatInput, userProfile, orgContext, assignedLevels]);

  /* ── Project help: call Cloud Function to get pre-fill, then navigate ── */
  const handleProjectHelp = useCallback(async (level: number) => {
    const levelKey = `L${level}`;
    const levelData = learningPlanLevels[levelKey];
    if (!levelData) {
      showToast('No project found for this level.', 'error');
      return;
    }

    const toolId = PRIMARY_TOOL_IDS[level];
    const toolRoute = ALL_TOOLS.find((t) => t.id === toolId)?.route;
    if (!toolId || !toolRoute) return;

    setPrefillLoading(true);
    setDropdownOpen(false);

    try {
      const res = await fetch('/api/project-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          projectTitle: levelData.projectTitle,
          projectDescription: levelData.projectDescription,
          deliverable: levelData.deliverable,
          userRole: userProfile?.role || '',
          userChallenge: userProfile?.challenge || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('workspace_prefill', JSON.stringify({
          toolId,
          level,
          projectTitle: levelData.projectTitle,
          fields: data.fields,
        }));
      } else {
        // Fallback: store project description as the primary field
        sessionStorage.setItem('workspace_prefill', JSON.stringify({
          toolId,
          level,
          projectTitle: levelData.projectTitle,
          fields: { userInput: levelData.projectDescription, taskDescription: levelData.projectDescription, appDescription: levelData.projectDescription, q1_purpose: levelData.projectDescription },
        }));
      }
    } catch {
      // Fallback on network error
      sessionStorage.setItem('workspace_prefill', JSON.stringify({
        toolId,
        level,
        projectTitle: levelData.projectTitle,
        fields: { userInput: levelData.projectDescription, taskDescription: levelData.projectDescription, appDescription: levelData.projectDescription, q1_purpose: levelData.projectDescription },
      }));
    } finally {
      setPrefillLoading(false);
      navigate(toolRoute);
    }
  }, [learningPlanLevels, userProfile, navigate]);

  /* ── Assigned levels for project help dropdown ── */
  const assignedLevels = useMemo(() => {
    return [1, 2, 3, 4, 5].filter((lvl) => {
      const levelData = toolkitData?.levelStats.find((l) => l.levelNumber === lvl);
      return levelData?.isAssigned;
    });
  }, [toolkitData]);

  /* ── Unlock check for templates ──
     A template is accessible if the level is assigned in the user's learning plan.
     You don't need to complete e-learning first — assignment alone grants access. */
  const isToolUnlocked = useCallback((levelRequired: number) => {
    if (levelRequired === 0) return true; // Learning coach always unlocked
    if (!toolkitData) return false;
    const levelData = toolkitData.levelStats.find((l) => l.levelNumber === levelRequired);
    return levelData?.isAssigned ?? false;
  }, [toolkitData]);

  /* ── Stats ── */
  const totalCount = artefacts.length;
  const selectedArtefact = selectedId ? artefacts.find((a) => a.id === selectedId) || null : null;

  /* ── Guards ── */
  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="Workspace" />;

  if (artefactsLoading) {
    return (
      <div style={{ padding: '28px 36px', background: '#F7FAFC', minHeight: '100%' }}>
        <div style={{
          width: 24, height: 24,
          border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'wsSpin 0.7s linear infinite',
        }} />
        <style>{`@keyframes wsSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Chat mode: render full-screen chat view ── */
  if (chatMode.active) {
    return (
      <WorkspaceChat
        toolId={chatMode.toolId}
        initialPrompt={chatMode.prompt}
        onBack={() => setChatMode({ active: false, toolId: '', prompt: '' })}
        {...(chatMode.toolId === 'project-help' ? {
          projectMode: {
            assignedLevels,
            learningPlanLevels,
            userRole: userProfile?.role || '',
            userChallenge: userProfile?.challenge || '',
          },
        } : {})}
        {...(chatMode.toolId === 'general' ? {
          generalMode: {
            initialReply: chatMode.initialReply,
            userData: {
              name: userProfile?.fullName || '',
              role: userProfile?.role || '',
              level: userProfile?.currentLevel || 1,
              aiExperience: userProfile?.aiExperience || '',
              orgName: orgContext?.orgName || '',
              assignedLevels,
              learningPlanLevels,
            },
          },
        } : {})}
      />
    );
  }

  return (
    <div style={{ padding: '28px 36px', background: '#F7FAFC', minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ws-chat-bar:focus-within {
          border-color: #38B2AC !important;
          box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.12) !important;
        }
        .ws-template-card:hover {
          border-color: currentColor !important;
          box-shadow: 0 0 0 1px currentColor !important;
        }
        .ws-chat-bar textarea::placeholder { color: #A0AEC0; }
        .ws-view-btn:hover { background: #EDF2F7 !important; }
        .ws-list-row:hover { background: #F7FAFC !important; }
        .ws-list-row .ws-row-actions { opacity: 0; transition: opacity 0.15s; }
        .ws-list-row:hover .ws-row-actions { opacity: 1; }
        .ws-list-row.ws-row-selected { background: #EBF8FF !important; }
        .ws-action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.12s; color: #718096; }
        .ws-action-btn:hover { background: #EDF2F7; color: #1A202C; }
        .ws-star-btn { color: #CBD5E0; transition: color 0.15s; }
        .ws-star-btn:hover, .ws-star-btn.ws-starred { color: #ECC94B; }
        .ws-col-header { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 4px; transition: color 0.12s; }
        .ws-col-header:hover { color: #4A5568 !important; }
        .ws-bulk-bar { animation: fadeSlideUp 0.2s ease-out both; }
        .ws-group-header { cursor: pointer; user-select: none; }
        .ws-group-header:hover { background: #F7FAFC; }
        .ws-inline-input { border: 1.5px solid #38B2AC; border-radius: 6px; outline: none; font-size: 14px; font-weight: 600; color: #1A202C; padding: 2px 8px; font-family: 'DM Sans', sans-serif; width: 100%; }
        .ws-inline-input:focus { box-shadow: 0 0 0 3px rgba(56,178,172,0.15); }
        @keyframes wsPrefillSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ─── Section 1: Chat Bar ─── */}
      <div style={{ animation: 'fadeSlideUp 0.3s ease-out both', marginBottom: 28, position: 'relative' as const, zIndex: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: '#1A202C',
            letterSpacing: -0.4, margin: 0,
          }}>
            Workspace
          </h1>
          <p style={{ fontSize: 14, color: '#718096', marginTop: 5, margin: '5px 0 0' }}>
            Describe what you want to build, or pick a template to get started.
          </p>
        </div>

        {/* Chat input + dropdown — fixed-height wrapper so expanding textarea overlays content below */}
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' as const, height: 62 }}>
        <div
          ref={chatContainerRef}
          style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, zIndex: 20 }}
        >
          {/* Input bar */}
          <div
            className="ws-chat-bar"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: dropdownOpen ? '16px 16px 0 0' : 16,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              position: 'relative' as const,
              zIndex: 12,
            }}
          >
            <Sparkles size={18} color="#38B2AC" style={{ marginTop: 2, flexShrink: 0 }} />
            <textarea
              ref={chatRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                  setDropdownOpen(false);
                }
                if (e.key === 'Escape') {
                  setDropdownOpen(false);
                  chatRef.current?.blur();
                }
              }}
              placeholder="Describe what you want to build with AI..."
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                color: '#1A202C',
                lineHeight: 1.5,
                background: 'transparent',
              }}
            />
            <button
              onClick={() => { handleChatSubmit(); setDropdownOpen(false); }}
              disabled={!chatInput.trim()}
              style={{
                width: 34, height: 34,
                borderRadius: 10,
                border: 'none',
                background: chatInput.trim() ? '#38B2AC' : '#E2E8F0',
                color: chatInput.trim() ? '#FFFFFF' : '#A0AEC0',
                cursor: chatInput.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <Send size={16} />
            </button>
          </div>

          {/* Dropdown — appears on focus */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderTop: 'none',
                borderRadius: '0 0 16px 16px',
                padding: '6px 0 10px',
                zIndex: 11,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              {dropdownView === 'prompts' ? (
                <>
                  {/* ── Suggested prompts — pill layout ── */}
                  <div style={{
                    padding: '10px 18px 4px',
                    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                  }}>
                    Suggested prompts
                  </div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8,
                    padding: '6px 18px 10px',
                  }}>
                    {PROMPT_STARTERS.map((starter) => {
                      const tool = TEMPLATE_CARDS.find((t) => t.id === starter.toolId);
                      const IconComponent = TOOL_ICON_MAP[starter.toolId];
                      const accent = tool?.accentColor || '#E2E8F0';
                      const accentDark = tool?.accentDark || '#4A5568';
                      return (
                        <button
                          key={starter.toolId}
                          onClick={() => {
                            setDropdownOpen(false);
                            setDropdownView('prompts');
                            setChatMode({ active: true, toolId: starter.toolId, prompt: starter.template });
                          }}
                          className="ws-dropdown-pill"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '7px 14px 7px 10px',
                            borderRadius: 20,
                            border: `1px solid ${accent}`,
                            background: '#FFFFFF',
                            color: '#4A5568',
                            fontSize: 13,
                            fontWeight: 500,
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${accent}20`;
                            e.currentTarget.style.color = '#1A202C';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.color = '#4A5568';
                          }}
                        >
                          {IconComponent && <IconComponent size={16} color={accentDark} />}
                          {starter.label}
                        </button>
                      );
                    })}
                    {/* Project help pill */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setDropdownView('prompts');
                        setChatMode({ active: true, toolId: 'project-help', prompt: 'I need help with my project.' });
                      }}
                      className="ws-dropdown-pill"
                      style={{
                        padding: '7px 16px',
                        borderRadius: 20,
                        border: '1px solid #38B2AC50',
                        background: '#E6FFFA',
                        color: '#2C7A7B',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#38B2AC';
                        e.currentTarget.style.background = '#B2F5EA';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#38B2AC50';
                        e.currentTarget.style.background = '#E6FFFA';
                      }}
                    >
                      Help me with my project <ArrowRight size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Level selection view ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px 4px',
                  }}>
                    <button
                      onClick={() => setDropdownView('prompts')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12, fontWeight: 600, color: '#718096',
                        padding: 0, transition: 'color 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1A202C'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; }}
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                      · Choose a level
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8,
                    padding: '8px 18px 12px',
                  }}>
                    {assignedLevels.map((lvl) => {
                      const accent = LEVEL_ACCENT_COLORS[lvl];
                      const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
                      const toolId = PRIMARY_TOOL_IDS[lvl];
                      const LevelIcon = TOOL_ICON_MAP[toolId];
                      return (
                        <button
                          key={lvl}
                          onClick={() => handleProjectHelp(lvl)}
                          disabled={prefillLoading}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '7px 14px 7px 10px',
                            borderRadius: 20,
                            border: `1.5px solid ${accent}`,
                            background: '#FFFFFF',
                            cursor: prefillLoading ? 'wait' : 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'background 0.15s, box-shadow 0.15s',
                            opacity: prefillLoading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!prefillLoading) {
                              e.currentTarget.style.background = `${accent}20`;
                              e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {LevelIcon && <LevelIcon size={16} color={accentDark} />}
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#1A202C', whiteSpace: 'nowrap' }}>
                            L{lvl} · {LEVEL_SHORT_NAMES[lvl]}
                          </span>
                        </button>
                      );
                    })}
                    {assignedLevels.length === 0 && (
                      <span style={{ fontSize: 13, color: '#A0AEC0' }}>No levels assigned yet.</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </div>{/* close fixed-height wrapper */}
      </div>

      {/* Prefill loading overlay */}
      {prefillLoading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)',
          zIndex: 50, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <Loader2 size={28} color="#38B2AC" style={{ animation: 'wsPrefillSpin 0.8s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A202C' }}>Preparing your project...</div>
          <div style={{ fontSize: 13, color: '#718096' }}>Generating pre-filled inputs for your toolkit</div>
        </div>
      )}

      {/* ─── Section 2: Templates Row ─── */}
      <div style={{ animation: 'fadeSlideUp 0.3s ease-out 80ms both', marginBottom: 32, position: 'relative' as const, zIndex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#718096',
          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
          marginBottom: 12,
        }}>
          Templates
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
        }}>
          {TEMPLATE_CARDS.map((tool) => {
            const unlocked = isToolUnlocked(tool.levelRequired);
            const accent = tool.accentColor;
            const accentDark = tool.accentDark;
            const IconComponent = TOOL_ICON_MAP[tool.id];

            return (
              <div
                key={tool.id}
                className="ws-template-card"
                onClick={() => {
                  if (unlocked) navigate(tool.route);
                }}
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${unlocked ? accent : '#E2E8F0'}`,
                  borderRadius: 14,
                  padding: '20px 16px 16px',
                  cursor: unlocked ? 'pointer' : 'default',
                  opacity: unlocked ? 1 : 0.5,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  position: 'relative' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 10,
                  color: unlocked ? accentDark : '#A0AEC0',
                }}
              >
                {/* Lock overlay */}
                {!unlocked && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <Lock size={14} color="#A0AEC0" />
                  </div>
                )}

                {/* SVG Icon */}
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 14,
                  background: unlocked ? `${accent}20` : '#F7FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {IconComponent ? (
                    <IconComponent size={28} color={unlocked ? accentDark : '#A0AEC0'} />
                  ) : (
                    <span style={{ fontSize: 22 }}>{tool.icon}</span>
                  )}
                </div>

                {/* Name */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#1A202C',
                  lineHeight: 1.3,
                }}>
                  {tool.name}
                </div>

                {/* Level badge */}
                <div style={{
                  display: 'inline-flex', alignSelf: 'flex-start',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: unlocked ? accentDark : '#A0AEC0',
                    background: unlocked ? `${accent}25` : '#F7FAFC',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}>
                    {tool.levelRequired === 0 ? 'Adaptive' : `L${tool.levelRequired} · ${tool.levelName}`}
                  </span>
                </div>

                {/* Arrow */}
                {unlocked && (
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, color: accentDark,
                  }}>
                    Open <ArrowRight size={13} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Section 3: Artefacts ─── */}
      <div style={{ animation: 'fadeSlideUp 0.3s ease-out 160ms both' }}>
        {/* Header with view toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#718096',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            }}>
              My Artefacts
            </div>
            {totalCount > 0 && (
              <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500 }}>
                {totalCount} item{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Grid / List toggle */}
          <div style={{ display: 'flex', gap: 2, background: '#EDF2F7', borderRadius: 8, padding: 2 }}>
            <button
              className="ws-view-btn"
              onClick={() => setViewMode('grid')}
              style={{
                width: 32, height: 28,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'background 0.12s',
              }}
            >
              <LayoutGrid size={15} color={viewMode === 'grid' ? '#1A202C' : '#A0AEC0'} />
            </button>
            <button
              className="ws-view-btn"
              onClick={() => setViewMode('list')}
              style={{
                width: 32, height: 28,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'background 0.12s',
              }}
            >
              <List size={15} color={viewMode === 'list' ? '#1A202C' : '#A0AEC0'} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ position: 'relative', zIndex: 10, marginBottom: 4 }}>
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
            activeLevels={activeLevels}
            onToggleLevel={toggleLevel}
            availableLevels={availableLevels}
            sortMode={sortMode}
            onSortChange={setSortMode}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            groupByLevel={viewMode === 'list' ? groupByLevel : undefined}
            onToggleGroupByLevel={viewMode === 'list' ? () => setGroupByLevel((p) => !p) : undefined}
          />
        </div>

        {/* Grid or List view */}
        {viewMode === 'grid' ? (
          <ArtefactGrid
            artefacts={filteredArtefacts}
            selectedId={selectedId}
            hasArtefacts={artefacts.length > 0}
            hasActiveFilters={hasActiveFilters}
            searchQuery={searchQuery}
            onOpen={openPanel}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onRename={handleRename}
            onClearFilters={clearFilters}
          />
        ) : (
          /* ── Enhanced List view ── */
          <div style={{ marginTop: 8 }}>
            {/* Bulk action bar */}
            {selectedRows.size > 0 && (
              <div className="ws-bulk-bar" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', marginBottom: 8,
                background: '#EBF8FF', borderRadius: 10, border: '1px solid #BEE3F8',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2B6CB0' }}>
                  {selectedRows.size} selected
                </span>
                <button onClick={handleBulkDuplicate} className="ws-action-btn" title="Duplicate selected" style={{ color: '#2B6CB0' }}>
                  <Copy size={15} />
                </button>
                <button onClick={handleBulkArchive} className="ws-action-btn" title="Archive selected" style={{ color: '#E53E3E' }}>
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setSelectedRows(new Set())} className="ws-action-btn" title="Clear selection" style={{ marginLeft: 'auto' }}>
                  <X size={15} />
                </button>
              </div>
            )}

            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              {/* Sticky table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 28px 1fr 130px 110px 120px 120px 100px',
                gap: 8,
                padding: '12px 20px',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky' as const, top: 54, zIndex: 5,
                background: '#FFFFFF', borderRadius: '12px 12px 0 0',
              }}>
                {/* Select all checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={() => toggleSelectAll(listSortedArtefacts.map((a) => a.id))}
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `1.5px solid ${selectedRows.size > 0 && selectedRows.size === listSortedArtefacts.length ? '#38B2AC' : '#CBD5E0'}`,
                      background: selectedRows.size > 0 && selectedRows.size === listSortedArtefacts.length ? '#38B2AC' : '#FFFFFF',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    {selectedRows.size > 0 && selectedRows.size === listSortedArtefacts.length && <Check size={12} color="#FFFFFF" />}
                  </button>
                </div>
                {/* Star column header */}
                <div />
                {/* Sortable column headers */}
                {([
                  { key: 'name' as const, label: 'Name' },
                  { key: 'type' as const, label: 'Type' },
                  { key: 'level' as const, label: 'Level' },
                  { key: 'created' as const, label: 'Created' },
                  { key: 'opened' as const, label: 'Last Opened' },
                ]).map(({ key, label }) => (
                  <div
                    key={key}
                    className="ws-col-header"
                    onClick={() => handleColumnSort(key)}
                    style={{
                      fontSize: 11, fontWeight: 700, color: listSortCol === key ? '#4A5568' : '#A0AEC0',
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                    }}
                  >
                    {label}
                    {listSortCol === key && (
                      listSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                ))}
                {/* Actions column */}
                <div />
              </div>

              {/* Empty state */}
              {listSortedArtefacts.length === 0 ? (
                <div style={{
                  padding: '60px 20px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#EDF2F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FolderOpen size={32} color="#A0AEC0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>
                      {artefacts.length === 0 ? 'No artefacts yet' : 'No matches found'}
                    </div>
                    <div style={{ fontSize: 14, color: '#718096', maxWidth: 360, lineHeight: 1.6 }}>
                      {artefacts.length === 0
                        ? 'Use one of the templates above to create your first artefact. Every prompt, agent, workflow, or app you build will appear here.'
                        : 'Try adjusting your search or filters to find what you\'re looking for.'}
                    </div>
                  </div>
                  {artefacts.length === 0 ? (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{
                        marginTop: 4, padding: '8px 20px',
                        borderRadius: 20, border: 'none',
                        background: '#38B2AC', color: '#FFFFFF',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Get started with a template
                    </button>
                  ) : (
                    <button
                      onClick={clearFilters}
                      style={{
                        marginTop: 4, padding: '8px 20px',
                        borderRadius: 20, border: '1px solid #E2E8F0',
                        background: '#FFFFFF', color: '#4A5568',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : groupByLevel && groupedArtefacts ? (
                /* ── Grouped by level ── */
                groupedArtefacts.map((group) => (
                  <ListGroup
                    key={group.level}
                    level={group.level}
                    items={group.items}
                    selectedRows={selectedRows}
                    favourites={favourites}
                    editingNameId={editingNameId}
                    editingNameValue={editingNameValue}
                    editInputRef={editInputRef}
                    onToggleSelect={toggleRowSelect}
                    onToggleFavourite={toggleFavourite}
                    onOpen={openPanel}
                    onStartRename={startInlineRename}
                    onCommitRename={commitRename}
                    onCancelRename={cancelRename}
                    onEditNameChange={setEditingNameValue}
                    onDuplicate={confirmDuplicateSingle}
                    onArchive={confirmArchiveSingle}
                  />
                ))
              ) : (
                /* ── Flat list ── */
                listSortedArtefacts.map((a, idx) => (
                  <ListRow
                    key={a.id}
                    artefact={a}
                    isLast={idx === listSortedArtefacts.length - 1}
                    isSelected={selectedRows.has(a.id)}
                    isFavourite={favourites.has(a.id)}
                    isEditing={editingNameId === a.id}
                    editValue={editingNameValue}
                    editInputRef={editingNameId === a.id ? editInputRef : undefined}
                    onToggleSelect={toggleRowSelect}
                    onToggleFavourite={toggleFavourite}
                    onOpen={openPanel}
                    onStartRename={startInlineRename}
                    onCommitRename={commitRename}
                    onCancelRename={cancelRename}
                    onEditNameChange={setEditingNameValue}
                    onDuplicate={confirmDuplicateSingle}
                    onArchive={confirmArchiveSingle}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Section 4: Archived Artefacts ─── */}
      <div style={{ marginTop: 24, animation: 'fadeSlideUp 0.3s ease-out 240ms both' }}>
        <button
          onClick={() => {
            const next = !showArchived;
            setShowArchived(next);
            if (next) loadArchived();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            padding: '4px 0', transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#718096'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
        >
          {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Archived
          {archivedArtefacts.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#A0AEC0',
              background: '#EDF2F7', padding: '1px 7px', borderRadius: 10,
            }}>
              {archivedArtefacts.length}
            </span>
          )}
        </button>

        {showArchived && (
          <div style={{
            marginTop: 8, background: '#FFFFFF', borderRadius: 12,
            border: '1px solid #E2E8F0',
          }}>
            {archivedArtefacts.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#A0AEC0', fontSize: 14 }}>
                No archived artefacts.
              </div>
            ) : (
              archivedArtefacts.map((a, idx) => {
                const toolIconId = TYPE_TO_TOOL_ICON[a.type];
                const IconComp = toolIconId ? TOOL_ICON_MAP[toolIconId] : null;
                const accent = LEVEL_ACCENT_COLORS[a.level] || '#E2E8F0';
                const accentDark = LEVEL_ACCENT_DARK_COLORS[a.level] || '#4A5568';

                return (
                  <div
                    key={a.id}
                    className="ws-list-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 130px 110px 100px',
                      gap: 8,
                      padding: '12px 20px',
                      borderBottom: idx < archivedArtefacts.length - 1 ? '1px solid #F0F0F0' : 'none',
                      alignItems: 'center',
                      opacity: 0.7,
                      transition: 'background 0.12s, opacity 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  >
                    {/* Name + icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${accent}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {IconComp ? (
                          <IconComp size={20} color={accentDark} />
                        ) : a.type === 'project_proof' ? (
                          <Award size={20} color={accentDark} />
                        ) : (
                          <FileText size={20} color={accentDark} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: '#718096',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: 'line-through',
                        }}>
                          {a.name}
                        </div>
                        {a.preview && (
                          <div style={{
                            fontSize: 12, color: '#A0AEC0', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {a.preview}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div style={{ fontSize: 13, color: '#718096' }}>
                      {TYPE_DISPLAY[a.type] || a.type}
                    </div>

                    {/* Level chip */}
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 12, fontWeight: 600,
                        color: accentDark,
                        background: `${accent}20`,
                        padding: '3px 10px', borderRadius: 20,
                        whiteSpace: 'nowrap',
                      }}>
                        Level {a.level}
                      </span>
                    </div>

                    {/* Restore button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={async () => {
                          const ok = await restoreArtefact(a.id);
                          if (ok) showToast('Artefact restored.');
                          else showToast('Failed to restore.', 'error');
                        }}
                        style={{
                          padding: '5px 14px', borderRadius: 20,
                          border: '1px solid #38B2AC', background: '#FFFFFF',
                          color: '#2C9A94', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#38B2AC';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF';
                          e.currentTarget.style.color = '#2C9A94';
                        }}
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick-Use Panel */}
      <QuickUsePanel
        artefact={selectedArtefact}
        content={panelContent}
        isOpen={panelOpen}
        onClose={closePanel}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onUpdateContent={handleUpdateContent}
        filteredArtefacts={filteredArtefacts}
        onNavigate={openPanel}
      />

      {/* ── Confirmation Dialog ── */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeSlideUp 0.15s ease-out',
          }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: 16,
              padding: '28px 32px', maxWidth: 420, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 10 }}>
              {confirmAction.type === 'archive' ? 'Archive' : 'Duplicate'} artefact{confirmAction.ids.length > 1 ? 's' : ''}?
            </div>
            <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, marginBottom: 24 }}>
              {confirmAction.type === 'archive'
                ? confirmAction.ids.length > 1
                  ? `Are you sure you want to archive ${confirmAction.ids.length} artefacts? You can restore them later from the Archived section.`
                  : `Are you sure you want to archive "${confirmAction.name}"? You can restore it later from the Archived section.`
                : confirmAction.ids.length > 1
                  ? `Are you sure you want to duplicate ${confirmAction.ids.length} artefacts? This will create a copy of each.`
                  : `Are you sure you want to duplicate "${confirmAction.name}"? This will create a copy.`}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  padding: '9px 20px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', background: '#FFFFFF',
                  color: '#4A5568', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F7FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                style={{
                  padding: '9px 20px', borderRadius: 10,
                  border: 'none',
                  background: confirmAction.type === 'archive' ? '#E53E3E' : '#38B2AC',
                  color: '#FFFFFF', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {confirmAction.type === 'archive' ? 'Archive' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AppWorkspace;
