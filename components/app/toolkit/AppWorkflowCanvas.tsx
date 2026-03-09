import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Download,
  Info, ChevronRight, ChevronDown, Sparkles, Wrench, Plus, Undo2, Trash2, X,
  Lightbulb, Loader2,
} from 'lucide-react';
import type {
  WorkflowNode, WorkflowPath, WorkflowGenerateResult, WorkflowFeedbackResult,
  NodeLayer, NodeDefinition, WorkflowIntermediate,
} from '../../../types';
import { useWorkflowDesignApi } from '../../../hooks/useWorkflowDesignApi';
import {
  INPUT_NODES, PROCESSING_NODES, OUTPUT_NODES, NODE_MAP,
  LAYER_COLORS, WORKFLOW_EXAMPLES, ICON_MAP,
} from '../../../data/workflow-designer-content';
import { N8N_NODE_TEMPLATES } from '../../../data/n8nNodeTemplates';
import { assembleN8nWorkflow, buildIntermediate } from '../../../utils/assembleN8nWorkflow';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';

/* ─── Constants ─── */

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#38B2AC';
const LEVEL_ACCENT_DARK = '#1A7A76';

const NODE_W = 140;
const NODE_H = 72;
const GAP_X = 40;
const GAP_Y = 40;
const BAND_H = 6;

const DRAFT_KEY = 'oxygy_workflow-canvas_draft';

/* ─── (educational sections removed — now using n8n Export Card) ─── */

/* ─── Layout helpers (from original WorkflowDesigner) ─── */

interface NodePosition { x: number; y: number; row: number; posInRow: number; direction: 'ltr' | 'rtl'; }

function useNodesPerRow(): number {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  if (width >= 1200) return 4;
  if (width >= 768) return 3;
  return 2;
}

function calculatePositions(count: number, nodesPerRow: number, nw: number, nh: number, gx: number, gy: number): NodePosition[] {
  const positions: NodePosition[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / nodesPerRow);
    const posInRow = i % nodesPerRow;
    const direction: 'ltr' | 'rtl' = row % 2 === 0 ? 'ltr' : 'rtl';
    const x = direction === 'ltr' ? posInRow * (nw + gx) : (nodesPerRow - 1 - posInRow) * (nw + gx);
    const y = row * (nh + gy);
    positions.push({ x, y, row, posInRow, direction });
  }
  return positions;
}

function generateConnectionPaths(positions: NodePosition[], nw: number, nh: number): string[] {
  const paths: string[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const curr = positions[i];
    const next = positions[i + 1];
    if (curr.row === next.row) {
      const isLtr = curr.direction === 'ltr';
      const fromX = isLtr ? curr.x + nw : curr.x;
      const toX = isLtr ? next.x : next.x + nw;
      const y = curr.y + nh / 2;
      paths.push(`M ${fromX} ${y} L ${toX} ${y}`);
    } else {
      const fromX = curr.x + nw / 2;
      const fromY = curr.y + nh;
      const toX = next.x + nw / 2;
      const toY = next.y;
      paths.push(`M ${fromX} ${fromY} L ${toX} ${toY}`);
    }
  }
  return paths;
}

function getNodesForLayer(layer: NodeLayer): NodeDefinition[] {
  if (layer === 'input') return INPUT_NODES;
  if (layer === 'processing') return PROCESSING_NODES;
  return OUTPUT_NODES;
}

function getNodeIcon(iconName: string) {
  return ICON_MAP[iconName] || Info;
}

/* ─── Shared sub-components ─── */

const StepBadge: React.FC<{ number: number; done: boolean }> = ({ number, done }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? LEVEL_ACCENT : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? '#FFFFFF' : '#718096',
    transition: 'background 0.2s, color 0.2s',
    fontFamily: FONT,
  }}>
    {done ? <Check size={14} /> : number}
  </div>
);

const StepConnector: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
    <div style={{
      width: 3, height: 24, borderRadius: 2,
      background: `repeating-linear-gradient(to bottom, ${LEVEL_ACCENT} 0px, ${LEVEL_ACCENT} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '3px 20px',
      animation: 'ppConnectorFlow 0.8s linear infinite',
    }} />
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${LEVEL_ACCENT}20`, border: `2px solid ${LEVEL_ACCENT}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    }}>
      <ArrowDown size={14} color={LEVEL_ACCENT} />
    </div>
  </div>
);

interface StepCardProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, subtitle, done, collapsed, children }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 16,
    border: done ? `1px solid ${LEVEL_ACCENT}88` : '1px solid #E2E8F0',
    padding: collapsed ? '16px 24px' : '24px 28px',
    transition: 'border-color 0.3s, padding 0.3s',
    fontFamily: FONT,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StepBadge number={stepNumber} done={done} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{title}</div>
        {!collapsed && <div style={{ fontSize: 13, color: '#718096', fontFamily: FONT }}>{subtitle}</div>}
      </div>
      {collapsed && done && (
        <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>Done ✓</span>
      )}
    </div>
    {!collapsed && <div style={{ marginTop: 20 }}>{children}</div>}
  </div>
);

const ActionBtn: React.FC<{
  icon: React.ReactNode; label: string; onClick: () => void;
  primary?: boolean; accent?: boolean; disabled?: boolean;
}> = ({ icon, label, onClick, primary, accent, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '8px 16px', borderRadius: 24,
      fontSize: 12, fontWeight: 600, fontFamily: FONT,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      border: primary || accent ? 'none' : '1px solid #E2E8F0',
      background: primary ? '#38B2AC' : accent ? '#5A67D8' : '#FFFFFF',
      color: primary || accent ? '#FFFFFF' : '#4A5568',
      transition: 'opacity 0.15s',
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = disabled ? '0.5' : '1'; }}
  >
    {icon}{label}
  </button>
);

/* ─── ToolOverview ─── */

const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean }[];
  outcome: string;
}> = ({ steps, outcome }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
    padding: '20px 24px', marginBottom: 20, fontFamily: FONT,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 14 }}>
      HOW IT WORKS
    </div>
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.number}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: s.done ? LEVEL_ACCENT : '#F7FAFC',
              border: s.done ? 'none' : '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: s.done ? '#FFFFFF' : '#718096',
            }}>
              {s.done ? <Check size={12} /> : s.number}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#A0AEC0' }}>{s.detail}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} color="#CBD5E0" style={{ margin: '0 12px', flexShrink: 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
    <div style={{
      marginTop: 14, background: '#F0FFF4', border: '1px solid #C6F6D5',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#276749', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>OUTCOME</span>
      <div style={{ fontSize: 12, color: '#2F855A', marginTop: 2 }}>{outcome}</div>
    </div>
  </div>
);

/* ─── StepPlaceholder ─── */

const StepPlaceholder: React.FC<{ icon: React.ReactNode; message: string; detail: string }> = ({ icon, message, detail }) => (
  <div style={{
    background: '#F7FAFC', borderRadius: 12, border: '1px dashed #E2E8F0',
    padding: '24px 28px', textAlign: 'center' as const, fontFamily: FONT,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: '#EDF2F7',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#4A5568', marginBottom: 4 }}>{message}</div>
    <div style={{ fontSize: 13, color: '#A0AEC0', maxWidth: 480, margin: '0 auto' }}>{detail}</div>
  </div>
);

/* ─── Canvas sub-components ─── */

const CanvasNode: React.FC<{
  node: WorkflowNode; position: NodePosition; nw: number; nh: number;
  animated: boolean; index: number; onClick?: (nodeId: string) => void;
}> = ({ node, position, nw, nh, animated, index, onClick }) => {
  const def = NODE_MAP[node.node_id];
  const layer = node.layer;
  const colors = LAYER_COLORS[layer];
  const IconComp = def ? getNodeIcon(def.icon) : Info;
  const isAdded = node.status === 'added';
  const isRemoved = node.status === 'removed';

  return (
    <div
      style={{
        position: 'absolute', left: position.x, top: position.y,
        width: nw, height: nh,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transition: 'all 0.15s',
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(8px)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
      onClick={() => onClick?.(node.id)}
      tabIndex={0}
      aria-label={`${node.name} — ${layer} node`}
    >
      <div style={{
        width: '100%', height: '100%', background: '#FFFFFF',
        borderRadius: 8, overflow: 'hidden', position: 'relative',
        border: isAdded ? '2px dashed #48BB78' : isRemoved ? '2px dashed #FC8181' : '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        opacity: isRemoved ? 0.4 : 1,
      }}>
        <div style={{ height: BAND_H, backgroundColor: colors.band, borderRadius: '8px 8px 0 0' }} />
        <div style={{
          height: nh - BAND_H, padding: '4px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp size={20} color={colors.dark} strokeWidth={1.5} />
          <span style={{
            textAlign: 'center' as const, fontWeight: 600, lineHeight: 1.2, marginTop: 4,
            fontSize: 11, color: '#1A202C', maxWidth: nw - 16,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            textDecoration: isRemoved ? 'line-through' : 'none',
          }}>
            {node.name}
          </span>
        </div>
      </div>
    </div>
  );
};

const ConnectionLines: React.FC<{
  positions: NodePosition[]; nw: number; nh: number; animatedCount: number;
}> = ({ positions, nw, nh, animatedCount }) => {
  if (positions.length < 2) return null;
  const paths = generateConnectionPaths(positions, nw, nh);
  const maxX = Math.max(...positions.map(p => p.x)) + nw;
  const maxY = Math.max(...positions.map(p => p.y)) + nh;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: maxX, height: maxY, pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <marker id="wf-app-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#A0AEC0" />
        </marker>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="#A0AEC0" strokeWidth={2} fill="none" markerEnd="url(#wf-app-arrowhead)"
          style={{ opacity: i < animatedCount ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      ))}
    </svg>
  );
};

const CanvasSkeleton: React.FC<{ nodesPerRow: number }> = ({ nodesPerRow }) => {
  const count = 6;
  const positions = calculatePositions(count, nodesPerRow, NODE_W, NODE_H, GAP_X, GAP_Y);
  const totalRows = positions.length > 0 ? positions[positions.length - 1].row + 1 : 1;
  return (
    <div style={{ position: 'relative', margin: '0 auto', width: nodesPerRow * (NODE_W + GAP_X) - GAP_X, height: totalRows * (NODE_H + GAP_Y) - GAP_Y }}>
      {positions.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', left: pos.x, top: pos.y, width: NODE_W, height: NODE_H,
          borderRadius: 8, backgroundColor: '#EDF2F7',
          animation: `ppPulse 1.2s ease-in-out infinite`, animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
};

/* ─── NodeLibraryPanel ─── */

const NodeLibraryPanel: React.FC<{
  activeTab: NodeLayer; onTabChange: (t: NodeLayer) => void;
  onAddNode: (def: NodeDefinition) => void; onClose: () => void;
}> = ({ activeTab, onTabChange, onAddNode, onClose }) => {
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const nodes = getNodesForLayer(activeTab);
  const tabs: { key: NodeLayer; label: string }[] = [
    { key: 'input', label: 'Data Input' },
    { key: 'processing', label: 'Processing' },
    { key: 'output', label: 'Data Output' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, height: '100%', background: '#FFFFFF',
      width: 340, borderLeft: '1px solid #E2E8F0', boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
      zIndex: 20, display: 'flex', flexDirection: 'column', fontFamily: FONT,
      animation: 'ppFadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1A202C' }}>Add Node</span>
        <button onClick={onClose} style={{ color: '#A0AEC0', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }} aria-label="Close panel"><X size={20} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          const c = LAYER_COLORS[t.key];
          return (
            <button key={t.key} onClick={() => onTabChange(t.key)} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              backgroundColor: isActive ? c.bg : 'transparent',
              color: isActive ? c.dark : '#718096',
              fontWeight: isActive ? 600 : 400,
              border: `1px solid ${isActive ? c.border : '#E2E8F0'}`,
              cursor: 'pointer', fontFamily: FONT,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {nodes.map(def => {
          const c = LAYER_COLORS[def.layer];
          const IconComp = getNodeIcon(def.icon);
          return (
            <div key={def.nodeId} style={{ position: 'relative' }}>
              <button onClick={() => onAddNode(def)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', textAlign: 'left' as const,
                borderBottom: '1px solid #F7FAFC', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: FONT,
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7FAFC')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.band, flexShrink: 0 }} />
                <IconComp size={18} color={c.dark} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1A202C', flex: 1 }}>{def.name}</span>
                <span
                  style={{ color: '#A0AEC0', cursor: 'pointer', flexShrink: 0, padding: 2 }}
                  onClick={(e) => { e.stopPropagation(); setTooltipId(tooltipId === def.nodeId ? null : def.nodeId); }}
                >
                  <Info size={16} />
                </span>
              </button>
              {tooltipId === def.nodeId && (
                <div style={{
                  position: 'absolute', right: 16, zIndex: 10, width: 224, padding: 12,
                  borderRadius: 8, fontSize: 12, lineHeight: 1.6,
                  backgroundColor: '#1A202C', color: '#E2E8F0', top: '100%', marginTop: -4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: FONT,
                }}>
                  {def.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════ */

const AppWorkflowCanvas: React.FC = () => {
  const { user } = useAuth();

  /* ── Step 1 State ── */
  const [taskDescription, setTaskDescription] = useState('');
  const [toolsAndSystems, setToolsAndSystems] = useState('');
  const [flashTask, setFlashTask] = useState(false);
  const [flashTools, setFlashTools] = useState(false);
  const [selectedPath, setSelectedPath] = useState<WorkflowPath | null>(null);

  /* ── Step 2 State (canvas) ── */
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>([]);
  const [undoStack, setUndoStack] = useState<WorkflowNode[][]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<NodeLayer>('input');
  const [orderWarningDismissed, setOrderWarningDismissed] = useState(false);
  const [showOrderWarning, setShowOrderWarning] = useState(false);
  const [nodeClickMenu, setNodeClickMenu] = useState<string | null>(null);
  const [userRationale, setUserRationale] = useState('');
  const [feedbackResult, setFeedbackResult] = useState<WorkflowFeedbackResult | null>(null);
  const [comparisonView, setComparisonView] = useState<'user' | 'ai'>('user');
  const [generateResult, setGenerateResult] = useState<WorkflowGenerateResult | null>(null);
  const [nodesAnimated, setNodesAnimated] = useState(0);
  const [connectionsAnimated, setConnectionsAnimated] = useState(0);

  /* ── Path A review/approval state ── */
  const [pathAApproved, setPathAApproved] = useState(false);
  const [pathAFeedbackText, setPathAFeedbackText] = useState('');
  const [pathAFeedbackResult, setPathAFeedbackResult] = useState<WorkflowFeedbackResult | null>(null);
  const [pathAShowingRevised, setPathAShowingRevised] = useState(false);

  /* ── Step 3 State (n8n export) ── */
  const [n8nJson, setN8nJson] = useState<string | null>(null);
  const [n8nIntermediate, setN8nIntermediate] = useState<WorkflowIntermediate | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportLoadingMsg, setExportLoadingMsg] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);
  const [savedToArtefacts, setSavedToArtefacts] = useState(false);
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);

  /* ── Shared State ── */
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  const { designWorkflow, isLoading, error, clearError } = useWorkflowDesignApi();
  const nodesPerRow = useNodesPerRow();
  const nw = NODE_W;
  const nh = NODE_H;
  const gx = GAP_X;
  const gy = GAP_Y;

  /* ── Derived state ── */
  const step1Done = selectedPath !== null;
  const hasResult = selectedPath === 'a' ? !!generateResult : !!feedbackResult;
  const step2Done = selectedPath === 'a' ? pathAApproved : hasResult;
  // step3Done derived from n8nJson state — used inline as !!n8nJson

  const displayedNodes: WorkflowNode[] = (() => {
    if (selectedPath === 'a') {
      if (pathAShowingRevised && pathAFeedbackResult) return pathAFeedbackResult.suggested_workflow;
      return generateResult?.nodes || [];
    }
    if (selectedPath === 'b') {
      if (feedbackResult && comparisonView === 'ai') return feedbackResult.suggested_workflow;
      return canvasNodes;
    }
    return [];
  })();

  const positions = calculatePositions(displayedNodes.length, nodesPerRow, nw, nh, gx, gy);
  const canvasWidth = nodesPerRow * (nw + gx) - gx;
  const totalRows = displayedNodes.length > 0 ? positions[positions.length - 1].row + 1 : 0;
  const canvasHeight = totalRows > 0 ? totalRows * (nh + gy) - gy : 200;

  const workflowName = selectedPath === 'a' && generateResult ? generateResult.workflow_name : 'Custom Workflow';
  const workflowDescription = selectedPath === 'a' && generateResult ? generateResult.workflow_description : taskDescription;
  const finalNodes = selectedPath === 'a'
    ? (pathAFeedbackResult ? pathAFeedbackResult.suggested_workflow : generateResult?.nodes || [])
    : (feedbackResult ? feedbackResult.suggested_workflow : canvasNodes);

  /* ── Draft persistence ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.taskDescription) setTaskDescription(draft.taskDescription);
        if (draft.toolsAndSystems) setToolsAndSystems(draft.toolsAndSystems);
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (taskDescription.trim() || toolsAndSystems.trim()) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ taskDescription, toolsAndSystems }));
    }
  }, [taskDescription, toolsAndSystems]);

  /* ── Canvas node animation ── */
  useEffect(() => {
    if (displayedNodes.length > 0 && nodesAnimated < displayedNodes.length) {
      const timer = setTimeout(() => setNodesAnimated(prev => prev + 1), 150);
      return () => clearTimeout(timer);
    }
  }, [displayedNodes.length, nodesAnimated]);

  useEffect(() => {
    if (nodesAnimated > 1 && connectionsAnimated < nodesAnimated - 1) {
      const timer = setTimeout(() => setConnectionsAnimated(prev => prev + 1), 150);
      return () => clearTimeout(timer);
    }
  }, [nodesAnimated, connectionsAnimated]);

  useEffect(() => {
    setNodesAnimated(0);
    setConnectionsAnimated(0);
  }, [comparisonView]);

  /* ── Generate n8n JSON when approved ── */
  useEffect(() => {
    if (!step2Done || n8nJson) return;
    const intermediate = buildIntermediate(workflowName, workflowDescription, finalNodes);
    setN8nIntermediate(intermediate);

    // Simulate export loading with cycling messages
    setExportLoading(true);
    const msgs = [
      'Building your n8n workflow\u2026',
      'Wiring node connections\u2026',
      'Configuring node parameters\u2026',
      'Validating JSON schema\u2026',
      'Preparing export package\u2026',
    ];
    let msgIdx = 0;
    setExportLoadingMsg(msgs[0]);
    const msgTimer = setInterval(() => {
      msgIdx++;
      if (msgIdx < msgs.length) setExportLoadingMsg(msgs[msgIdx]);
    }, 400);

    // Assembly is instant but we animate for UX
    setTimeout(() => {
      clearInterval(msgTimer);
      const json = assembleN8nWorkflow(intermediate);
      setN8nJson(json);
      setExportLoading(false);
      setExportLoadingMsg('');
    }, 2000);

    return () => clearInterval(msgTimer);
  }, [step2Done]);

  /* ── Close node menu on outside click ── */
  useEffect(() => {
    if (!nodeClickMenu) return;
    const handler = () => setNodeClickMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [nodeClickMenu]);

  /* ── beforeunload warning for unsaved workflows ── */
  useEffect(() => {
    const hasUnsavedWork = (step2Done || n8nIntermediate) && !savedToArtefacts;
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step2Done, n8nIntermediate, savedToArtefacts]);

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  /* ── Handlers ── */

  const handleExampleClick = (idx: number) => {
    const ex = WORKFLOW_EXAMPLES[idx];
    setTaskDescription(ex.task);
    setToolsAndSystems(ex.tools);
    setFlashTask(true);
    setFlashTools(true);
    setTimeout(() => { setFlashTask(false); setFlashTools(false); }, 300);
    clearError();
  };

  const handlePathA = async () => {
    setSelectedPath('a');
    setNodesAnimated(0);
    setConnectionsAnimated(0);
    setGenerateResult(null);
    setTimeout(() => canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const result = await designWorkflow({
      mode: 'auto_generate',
      task_description: taskDescription,
      tools_and_systems: toolsAndSystems || 'Not specified',
    });
    if (result && 'workflow_name' in result) {
      setGenerateResult(result);
      if (user) upsertToolUsed(user.id, 3);
    }
  };

  const handlePathB = () => {
    setSelectedPath('b');
    setCanvasNodes([]);
    setUndoStack([]);
    setPanelOpen(true);
    setActiveLibraryTab('input');
    setFeedbackResult(null);
    setComparisonView('user');
    setNodesAnimated(0);
    setConnectionsAnimated(0);
    setTimeout(() => canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handlePathAApprove = () => {
    setPathAApproved(true);
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handlePathARevise = async () => {
    if (!pathAFeedbackText.trim() || !generateResult) return;
    setPathAShowingRevised(false);
    setNodesAnimated(0);
    setConnectionsAnimated(0);

    const currentNodes = pathAFeedbackResult
      ? pathAFeedbackResult.suggested_workflow
      : generateResult.nodes;

    const result = await designWorkflow({
      mode: 'feedback',
      task_description: taskDescription,
      tools_and_systems: toolsAndSystems || 'Not specified',
      user_workflow: currentNodes.map(n => ({ id: n.id, node_id: n.node_id, name: n.name, layer: n.layer })),
      user_rationale: pathAFeedbackText,
    });

    if (result && 'suggested_workflow' in result) {
      setPathAFeedbackResult(result);
      setPathAShowingRevised(true);
      setPathAFeedbackText('');
      setNodesAnimated(0);
      setConnectionsAnimated(0);
      if (user) upsertToolUsed(user.id, 3);
    }
  };

  const handleAddNode = (def: NodeDefinition) => {
    setUndoStack(prev => [...prev, [...canvasNodes]]);
    const newNode: WorkflowNode = {
      id: `user-node-${canvasNodes.length + 1}`,
      node_id: def.nodeId,
      name: def.name,
      layer: def.layer,
    };
    const updated = [...canvasNodes, newNode];
    setCanvasNodes(updated);
    setNodesAnimated(updated.length - 1);
    setConnectionsAnimated(Math.max(0, updated.length - 2));

    if (!orderWarningDismissed) {
      const hasInput = updated.some(n => n.layer === 'input');
      const hasProcessing = updated.some(n => n.layer === 'processing');
      if (def.layer === 'output' && (!hasInput || !hasProcessing)) setShowOrderWarning(true);
    }

    if (def.layer === 'input') setActiveLibraryTab('processing');
    else if (def.layer === 'processing') setActiveLibraryTab('output');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setCanvasNodes(prev);
    setNodesAnimated(prev.length);
    setConnectionsAnimated(Math.max(0, prev.length - 1));
  };

  const handleClearAll = () => {
    setUndoStack([]);
    setCanvasNodes([]);
    setNodesAnimated(0);
    setConnectionsAnimated(0);
    setFeedbackResult(null);
    setComparisonView('user');
  };

  const handleRemoveNode = (nodeId: string) => {
    setUndoStack(prev => [...prev, [...canvasNodes]]);
    const updated = canvasNodes.filter(n => n.id !== nodeId);
    setCanvasNodes(updated);
    setNodesAnimated(updated.length);
    setConnectionsAnimated(Math.max(0, updated.length - 1));
    setNodeClickMenu(null);
  };

  const handleGetFeedback = async () => {
    if (canvasNodes.length < 2) return;
    setFeedbackResult(null);
    setComparisonView('user');

    const result = await designWorkflow({
      mode: 'feedback',
      task_description: taskDescription,
      tools_and_systems: toolsAndSystems || 'Not specified',
      user_workflow: canvasNodes.map(n => ({ id: n.id, node_id: n.node_id, name: n.name, layer: n.layer })),
      user_rationale: userRationale || 'Not provided',
    });

    if (result && 'suggested_workflow' in result) {
      setFeedbackResult(result);
      setComparisonView('ai');
      setNodesAnimated(0);
      setConnectionsAnimated(0);
      if (user) upsertToolUsed(user.id, 3);
    }
  };

  const handleStartOver = () => {
    setTaskDescription('');
    setToolsAndSystems('');
    setSelectedPath(null);
    setCanvasNodes([]);
    setUndoStack([]);
    setPanelOpen(false);
    setActiveLibraryTab('input');
    setOrderWarningDismissed(false);
    setShowOrderWarning(false);
    setNodeClickMenu(null);
    setUserRationale('');
    setFeedbackResult(null);
    setComparisonView('user');
    setGenerateResult(null);
    setNodesAnimated(0);
    setConnectionsAnimated(0);
    setN8nJson(null);
    setN8nIntermediate(null);
    setExportLoading(false);
    setExportLoadingMsg('');
    setJsonCopied(false);
    setSavedToArtefacts(false);
    setJsonPreviewOpen(false);
    setPathAApproved(false);
    setPathAFeedbackText('');
    setPathAFeedbackResult(null);
    setPathAShowingRevised(false);
    clearError();
    localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyJson = async () => {
    if (!n8nJson) return;
    try {
      await navigator.clipboard.writeText(n8nJson);
      setJsonCopied(true);
      toast('n8n JSON copied to clipboard');
      setTimeout(() => setJsonCopied(false), 2000);
    } catch { toast('Failed to copy'); }
  };

  const handleDownloadJson = () => {
    if (!n8nJson) return;
    const blob = new Blob([n8nJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded workflow.json');
  };

  const handleSaveToArtefacts = async () => {
    if (!user || savedToArtefacts || !n8nIntermediate) return;
    const result = await dbSavePrompt(user.id, {
      level: 3,
      title: `Workflow: ${workflowName}`,
      content: JSON.stringify(n8nIntermediate, null, 2),
      source_tool: 'workflow-canvas',
    });
    if (result) {
      setSavedToArtefacts(true);
      toast('Saved to Artefacts');
    } else {
      toast('Failed to save — please try again');
    }
  };

  /* ── Render helper: layer label ── */
  // layerLabel removed — no longer needed in n8n export view

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div style={{ padding: '28px 36px', fontFamily: FONT }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes ppFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppConnectorFlow { 0% { background-position: 0 0; } 100% { background-position: 0 20px; } }
      `}</style>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.4px', margin: 0, marginBottom: 6, fontFamily: FONT }}>
        Workflow Canvas
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 20, fontFamily: FONT }}>
        Most AI workflows break down at handoff points — where human judgement is needed, data changes format, or decisions branch. The Workflow Canvas lets you map multi-step AI processes visually, define triggers and checkpoints, and design workflows that are reliable, auditable, and ready to implement.
      </p>

      {/* How It Works */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Define your workflow', detail: 'Describe the process and choose your path', done: step1Done },
          { number: 2, label: 'Build & review', detail: 'Review, refine, and approve your workflow', done: step2Done },
          { number: 3, label: 'Export your workflow', detail: 'Download your importable n8n workflow JSON', done: !!n8nJson },
        ]}
        outcome="A downloadable n8n workflow JSON file — importable directly into n8n Cloud or self-hosted with no manual editing."
      />

      {/* ─── STEP 1: Define your workflow ─── */}
      <StepCard
        stepNumber={1}
        title="Define your workflow"
        subtitle="Describe the process you want to automate, the tools involved, and how you'd like to build it."
        done={step1Done}
        collapsed={step1Done && step2Done}
      >
        {/* Example pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, alignSelf: 'center' }}>Try an example:</span>
          {WORKFLOW_EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => handleExampleClick(i)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12,
              border: '1px solid #E2E8F0', background: '#F7FAFC', color: '#4A5568',
              cursor: 'pointer', fontFamily: FONT, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              {ex.name}
            </button>
          ))}
        </div>

        {/* Task description */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
          What process do you want to automate?
        </label>
        <textarea
          value={taskDescription}
          onChange={e => { setTaskDescription(e.target.value); clearError(); }}
          placeholder="e.g., When our team completes a client engagement survey, I want the responses automatically analyzed for themes and sentiment, with a summary report emailed to the project lead..."
          style={{
            width: '100%', minHeight: 100, padding: 14, borderRadius: 12, fontSize: 14,
            border: `1.5px solid ${flashTask ? LEVEL_ACCENT : '#E2E8F0'}`,
            color: '#1A202C', fontFamily: FONT, resize: 'none',
            backgroundColor: flashTask ? `${LEVEL_ACCENT}15` : '#FFFFFF',
            outline: 'none', transition: 'border-color 0.2s, background-color 0.3s',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = LEVEL_ACCENT; e.target.style.boxShadow = `0 0 0 3px ${LEVEL_ACCENT}18`; }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
        />

        {/* Tools & systems */}
        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
            What tools or systems are already involved?
            <span style={{ fontSize: 10, fontWeight: 600, color: LEVEL_ACCENT_DARK, background: `${LEVEL_ACCENT}30`, borderRadius: 10, padding: '2px 8px' }}>Recommended</span>
          </label>
          <textarea
            value={toolsAndSystems}
            onChange={e => setToolsAndSystems(e.target.value)}
            placeholder="e.g., We currently collect surveys via Microsoft Forms, store data in SharePoint, and communicate via Teams and email..."
            style={{
              width: '100%', minHeight: 72, padding: 14, borderRadius: 12, fontSize: 14,
              border: `1.5px solid ${flashTools ? LEVEL_ACCENT : '#E2E8F0'}`,
              color: '#1A202C', fontFamily: FONT, resize: 'none',
              backgroundColor: flashTools ? `${LEVEL_ACCENT}15` : '#FFFFFF',
              outline: 'none', transition: 'border-color 0.2s, background-color 0.3s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = LEVEL_ACCENT; e.target.style.boxShadow = `0 0 0 3px ${LEVEL_ACCENT}18`; }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Error */}
        {error && !selectedPath && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, fontSize: 13, backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030', fontFamily: FONT }}>
            {error}
          </div>
        )}

        {/* Path choice */}
        {!selectedPath && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', marginBottom: 12, fontFamily: FONT }}>
              How would you like to build this workflow?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Path A */}
              <button
                onClick={handlePathA}
                disabled={!taskDescription.trim() || isLoading}
                style={{
                  background: '#FFFFFF', borderRadius: 14, padding: 20,
                  border: '1px solid #E2E8F0', cursor: !taskDescription.trim() ? 'not-allowed' : 'pointer',
                  opacity: !taskDescription.trim() ? 0.5 : 1,
                  textAlign: 'left' as const, fontFamily: FONT,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { if (taskDescription.trim()) { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.boxShadow = `0 2px 8px ${LEVEL_ACCENT}20`; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Sparkles size={20} color={LEVEL_ACCENT} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>Design It For Me</div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>Get an AI-designed workflow based on your description.</div>
              </button>
              {/* Path B */}
              <button
                onClick={handlePathB}
                disabled={!taskDescription.trim()}
                style={{
                  background: '#FFFFFF', borderRadius: 14, padding: 20,
                  border: '1px solid #E2E8F0', cursor: !taskDescription.trim() ? 'not-allowed' : 'pointer',
                  opacity: !taskDescription.trim() ? 0.5 : 1,
                  textAlign: 'left' as const, fontFamily: FONT,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { if (taskDescription.trim()) { e.currentTarget.style.borderColor = '#5B6DC2'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(91,109,194,0.12)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Wrench size={20} color="#5B6DC2" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>I'll Build It Myself</div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>Build your own workflow and get AI feedback.</div>
              </button>
            </div>
          </div>
        )}

        {/* Selected path indicator */}
        {selectedPath && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: FONT,
              background: selectedPath === 'a' ? `${LEVEL_ACCENT}15` : 'rgba(91,109,194,0.1)',
              color: selectedPath === 'a' ? LEVEL_ACCENT_DARK : '#5B6DC2',
              border: `1px solid ${selectedPath === 'a' ? `${LEVEL_ACCENT}50` : 'rgba(91,109,194,0.3)'}`,
            }}>
              {selectedPath === 'a' ? <Sparkles size={12} /> : <Wrench size={12} />}
              {selectedPath === 'a' ? 'AI-Generated' : 'Manual Builder'}
            </div>
          </div>
        )}
      </StepCard>

      <StepConnector />

      {/* ─── STEP 2: Build your canvas ─── */}
      <div ref={canvasRef}>
        <StepCard
          stepNumber={2}
          title="Build & review your canvas"
          subtitle={selectedPath === 'a'
            ? (pathAApproved ? 'Workflow approved — proceed to export.' : generateResult ? 'Review the generated workflow. Approve it or give feedback to refine.' : 'AI is designing your workflow based on your description.')
            : selectedPath === 'b' ? 'Add nodes from the library to build your workflow, then get AI feedback.'
            : 'Choose a path above to start building.'}
          done={step2Done}
          collapsed={step2Done && pathAApproved}
        >
          {!selectedPath ? (
            <StepPlaceholder
              icon={<ArrowRight size={16} color="#A0AEC0" />}
              message="Complete Step 1 first"
              detail="Describe your workflow and choose a build path to start designing your canvas."
            />
          ) : (
            <>
              {/* Comparison toggle (Path B with feedback) */}
              {selectedPath === 'b' && feedbackResult && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'inline-flex', borderRadius: 20, padding: 3, border: '1px solid #E2E8F0', background: '#F7FAFC' }}>
                    {(['user', 'ai'] as const).map(v => (
                      <button key={v} onClick={() => { setComparisonView(v); setNodesAnimated(0); setConnectionsAnimated(0); }} style={{
                        padding: '6px 16px', borderRadius: 18, fontSize: 13, fontFamily: FONT,
                        background: comparisonView === v ? '#FFFFFF' : 'transparent',
                        color: comparisonView === v ? '#1A202C' : '#718096',
                        fontWeight: comparisonView === v ? 700 : 400,
                        boxShadow: comparisonView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        border: 'none', cursor: 'pointer',
                      }}>
                        {v === 'user' ? 'Your Workflow' : 'AI Suggestion'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall assessment */}
              {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && (
                <p style={{ textAlign: 'center' as const, fontSize: 14, color: '#4A5568', maxWidth: 600, margin: '0 auto 16px', fontFamily: FONT }}>
                  {feedbackResult.overall_assessment}
                </p>
              )}

              {/* Path B toolbar */}
              {selectedPath === 'b' && !feedbackResult && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button onClick={handleUndo} disabled={undoStack.length === 0} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    borderRadius: 6, fontSize: 12, fontFamily: FONT,
                    border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#718096',
                    opacity: undoStack.length === 0 ? 0.4 : 1, cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
                  }}>
                    <Undo2 size={14} /> Undo
                  </button>
                  <button onClick={() => setPanelOpen(!panelOpen)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    borderRadius: 6, fontSize: 12, fontFamily: FONT,
                    border: `1px solid ${panelOpen ? LEVEL_ACCENT : '#E2E8F0'}`,
                    background: '#FFFFFF', color: panelOpen ? LEVEL_ACCENT : '#718096',
                    cursor: 'pointer',
                  }}>
                    <Plus size={14} /> Add Node
                  </button>
                  <button onClick={handleClearAll} disabled={canvasNodes.length === 0} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    borderRadius: 6, fontSize: 12, fontFamily: FONT,
                    border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#718096',
                    opacity: canvasNodes.length === 0 ? 0.4 : 1, cursor: canvasNodes.length === 0 ? 'not-allowed' : 'pointer',
                  }}>
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
              )}

              {/* Canvas container */}
              <div style={{
                position: 'relative', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E2E8F0', background: '#FAFBFC', padding: 32, minHeight: 240,
                backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}>
                {/* Loading (Path A) */}
                {selectedPath === 'a' && isLoading && (
                  <>
                    <CanvasSkeleton nodesPerRow={nodesPerRow} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                      <Loader2 size={20} color={LEVEL_ACCENT} style={{ animation: 'ppSpin 0.7s linear infinite' }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#4A5568', fontFamily: FONT }}>Designing your workflow...</span>
                    </div>
                  </>
                )}

                {/* Empty state (Path B) */}
                {selectedPath === 'b' && canvasNodes.length === 0 && !isLoading && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', cursor: 'pointer' }}
                    onClick={() => { setPanelOpen(true); setActiveLibraryTab('input'); }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', border: '2px dashed #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                    }}>
                      <Plus size={28} color="#A0AEC0" />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#718096', fontFamily: FONT }}>Add Your First Node</span>
                    <span style={{ fontSize: 13, color: '#A0AEC0', marginTop: 4, fontFamily: FONT }}>Start with a data input — where does your data come from?</span>
                  </div>
                )}

                {/* Rendered nodes */}
                {displayedNodes.length > 0 && !isLoading && (
                  <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight, margin: selectedPath === 'a' ? '0 auto' : undefined }}>
                    <ConnectionLines positions={positions} nw={nw} nh={nh} animatedCount={connectionsAnimated} />
                    {displayedNodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <CanvasNode
                          node={node} position={positions[i]} nw={nw} nh={nh}
                          animated={i < nodesAnimated + 1} index={i}
                          onClick={selectedPath === 'b' && !feedbackResult ? id => setNodeClickMenu(nodeClickMenu === id ? null : id) : undefined}
                        />
                        {selectedPath === 'b' && !feedbackResult && nodeClickMenu === node.id && (
                          <div
                            style={{
                              position: 'absolute', zIndex: 30, background: '#FFFFFF', borderRadius: 8,
                              border: '1px solid #E2E8F0', padding: '4px 0',
                              left: positions[i].x + nw / 2 - 50, top: positions[i].y + nh + 4,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 100, fontFamily: FONT,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleRemoveNode(node.id)}
                              style={{ width: '100%', textAlign: 'left' as const, padding: '6px 12px', fontSize: 13, color: '#E53E3E', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF5F5')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >Remove</button>
                            <button
                              onClick={() => { setNodeClickMenu(null); toast(NODE_MAP[node.node_id]?.description || node.name); }}
                              style={{ width: '100%', textAlign: 'left' as const, padding: '6px 12px', fontSize: 13, color: '#4A5568', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7FAFC')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >Info</button>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Legend for comparison view */}
                {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && (
                  <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4A5568', fontFamily: FONT }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, border: '2px dashed #48BB78', background: 'rgba(72,187,120,0.08)' }} />
                      Added
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4A5568', fontFamily: FONT }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, border: '2px dashed #FC8181', background: 'rgba(252,129,129,0.08)' }} />
                      Removed
                    </span>
                  </div>
                )}

                {/* Node library side panel (Path B) */}
                {selectedPath === 'b' && panelOpen && !feedbackResult && (
                  <NodeLibraryPanel
                    activeTab={activeLibraryTab}
                    onTabChange={setActiveLibraryTab}
                    onAddNode={handleAddNode}
                    onClose={() => setPanelOpen(false)}
                  />
                )}
              </div>

              {/* Workflow name/description (Path A result) */}
              {selectedPath === 'a' && generateResult && !isLoading && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 4, fontFamily: FONT }}>{generateResult.workflow_name}</h3>
                  <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>{generateResult.workflow_description}</p>
                </div>
              )}

              {/* Path A: AI feedback result — comparison toggle & changes */}
              {selectedPath === 'a' && pathAFeedbackResult && !isLoading && (
                <>
                  {/* Toggle original vs revised */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <div style={{ display: 'inline-flex', borderRadius: 20, padding: 3, border: '1px solid #E2E8F0', background: '#F7FAFC' }}>
                      {([false, true] as const).map(showRevised => (
                        <button key={String(showRevised)} onClick={() => { setPathAShowingRevised(showRevised); setNodesAnimated(0); setConnectionsAnimated(0); }} style={{
                          padding: '6px 16px', borderRadius: 18, fontSize: 13, fontFamily: FONT,
                          background: pathAShowingRevised === showRevised ? '#FFFFFF' : 'transparent',
                          color: pathAShowingRevised === showRevised ? '#1A202C' : '#718096',
                          fontWeight: pathAShowingRevised === showRevised ? 700 : 400,
                          boxShadow: pathAShowingRevised === showRevised ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          border: 'none', cursor: 'pointer',
                        }}>
                          {showRevised ? 'Revised Workflow' : 'Original Workflow'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assessment */}
                  {pathAShowingRevised && (
                    <p style={{ textAlign: 'center' as const, fontSize: 14, color: '#4A5568', maxWidth: 600, margin: '12px auto 0', fontFamily: FONT }}>
                      {pathAFeedbackResult.overall_assessment}
                    </p>
                  )}

                  {/* Changes */}
                  {pathAShowingRevised && pathAFeedbackResult.changes.length > 0 && (
                    <div style={{ marginTop: 16, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, fontFamily: FONT }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 12, margin: 0 }}>Changes Made</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                        {pathAFeedbackResult.changes.filter(c => c.type === 'added').length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #48BB78', background: 'rgba(72,187,120,0.1)' }} />
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#38A169' }}>Nodes Added</span>
                            </div>
                            {pathAFeedbackResult.changes.filter(c => c.type === 'added').map((c, i) => (
                              <div key={i} style={{ marginBottom: 10, paddingLeft: 22 }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#1A202C' }}>{c.node_name}</span>
                                <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '2px 0 0' }}>{c.rationale}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {pathAFeedbackResult.changes.filter(c => c.type === 'removed').length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #FC8181', background: 'rgba(252,129,129,0.1)' }} />
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#E53E3E' }}>Nodes Removed</span>
                            </div>
                            {pathAFeedbackResult.changes.filter(c => c.type === 'removed').map((c, i) => (
                              <div key={i} style={{ marginBottom: 10, paddingLeft: 22 }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#1A202C' }}>{c.node_name}</span>
                                <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '2px 0 0' }}>{c.rationale}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Path A: Review & approval section */}
              {selectedPath === 'a' && generateResult && !isLoading && !pathAApproved && (
                <div style={{
                  marginTop: 20, padding: 20, borderRadius: 12,
                  background: '#F7FAFC', border: '1px solid #E2E8F0',
                  fontFamily: FONT,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                    Review Your Workflow
                  </div>
                  <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, marginBottom: 16, margin: '0 0 16px' }}>
                    Review the workflow above. If it looks good, approve it to proceed to export. If you'd like changes, describe what you want adjusted and we'll revise it.
                  </p>

                  {/* Feedback input */}
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4A5568', marginBottom: 6, fontFamily: FONT }}>
                    Feedback (optional — describe any changes you'd like)
                  </label>
                  <textarea
                    value={pathAFeedbackText}
                    onChange={e => setPathAFeedbackText(e.target.value)}
                    placeholder="e.g., Add a human review step before sending the email, and remove the translation node — we don't need it for this workflow..."
                    style={{
                      width: '100%', minHeight: 72, padding: 12, borderRadius: 10, fontSize: 13,
                      border: '1.5px solid #E2E8F0', color: '#1A202C', fontFamily: FONT,
                      resize: 'none', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = LEVEL_ACCENT; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
                  />

                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button
                      onClick={handlePathARevise}
                      disabled={!pathAFeedbackText.trim() || isLoading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600,
                        background: '#FFFFFF', color: '#4A5568',
                        border: '1px solid #E2E8F0',
                        cursor: (!pathAFeedbackText.trim() || isLoading) ? 'not-allowed' : 'pointer',
                        opacity: (!pathAFeedbackText.trim() || isLoading) ? 0.5 : 1,
                        fontFamily: FONT, transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (pathAFeedbackText.trim() && !isLoading) e.currentTarget.style.borderColor = LEVEL_ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      {isLoading ? <><Loader2 size={14} style={{ animation: 'ppSpin 0.7s linear infinite' }} /> Revising...</> : <>Revise Workflow</>}
                    </button>
                    <button
                      onClick={handlePathAApprove}
                      disabled={isLoading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600,
                        background: LEVEL_ACCENT, color: '#FFFFFF', border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        fontFamily: FONT,
                      }}
                    >
                      <Check size={14} /> Approve & Export
                    </button>
                  </div>
                </div>
              )}

              {/* Path A: Loading during revision */}
              {selectedPath === 'a' && isLoading && generateResult && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: `1px solid ${LEVEL_ACCENT}50`, background: `${LEVEL_ACCENT}08`, fontFamily: FONT }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Loader2 size={18} color={LEVEL_ACCENT} style={{ animation: 'ppSpin 0.7s linear infinite' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>Revising your workflow...</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>Incorporating your feedback and redesigning the workflow...</p>
                </div>
              )}

              {/* Order warning */}
              {selectedPath === 'b' && showOrderWarning && !orderWarningDismissed && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 8, background: '#FFFFF0', border: '1px solid #F6E05E', fontFamily: FONT }}>
                  <Lightbulb size={16} color="#B7791F" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ flex: 1, fontSize: 13, color: '#B7791F', margin: 0 }}>
                    <strong>Tip:</strong> Most workflows follow the pattern Input → Processing → Output. Consider adding a processing step between your data source and destination.
                  </p>
                  <button onClick={() => { setShowOrderWarning(false); setOrderWarningDismissed(true); }} style={{ flexShrink: 0, color: '#B7791F', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Get AI Feedback button (Path B) */}
              {selectedPath === 'b' && canvasNodes.length >= 2 && !feedbackResult && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#718096', marginBottom: 6, display: 'block', fontFamily: FONT }}>
                    Why did you design it this way? (Optional)
                  </label>
                  <textarea
                    value={userRationale}
                    onChange={e => setUserRationale(e.target.value)}
                    placeholder="e.g., I put the human review step before the email because this output goes directly to the client..."
                    style={{
                      width: '100%', minHeight: 56, padding: 12, borderRadius: 12, fontSize: 13,
                      border: '1.5px solid #E2E8F0', color: '#1A202C', fontFamily: FONT,
                      resize: 'none', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = LEVEL_ACCENT; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      onClick={handleGetFeedback}
                      disabled={isLoading || canvasNodes.length < 2}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600,
                        background: LEVEL_ACCENT, color: '#FFFFFF', border: 'none',
                        cursor: (isLoading || canvasNodes.length < 2) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || canvasNodes.length < 2) ? 0.5 : 1,
                        fontFamily: FONT,
                      }}
                    >
                      {isLoading ? <><Loader2 size={14} style={{ animation: 'ppSpin 0.7s linear infinite' }} /> Analyzing...</> : <>Get AI Feedback <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* Loading indicator (Path B feedback) */}
              {selectedPath === 'b' && isLoading && canvasNodes.length >= 2 && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: `1px solid ${LEVEL_ACCENT}50`, background: `${LEVEL_ACCENT}08`, fontFamily: FONT }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Loader2 size={18} color={LEVEL_ACCENT} style={{ animation: 'ppSpin 0.7s linear infinite' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>Analyzing your workflow...</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>Reviewing your node selection and suggesting improvements...</p>
                </div>
              )}

              {/* Changes panel (Path B feedback) */}
              {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && feedbackResult.changes.length > 0 && (
                <div style={{ marginTop: 16, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, fontFamily: FONT }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 12, margin: 0 }}>Changes Suggested</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                    {feedbackResult.changes.filter(c => c.type === 'added').length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #48BB78', background: 'rgba(72,187,120,0.1)' }} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#38A169' }}>Nodes Added</span>
                        </div>
                        {feedbackResult.changes.filter(c => c.type === 'added').map((c, i) => (
                          <div key={i} style={{ marginBottom: 10, paddingLeft: 22 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#1A202C' }}>{c.node_name}</span>
                            <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '2px 0 0' }}>{c.rationale}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {feedbackResult.changes.filter(c => c.type === 'removed').length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #FC8181', background: 'rgba(252,129,129,0.1)' }} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#E53E3E' }}>Nodes Removed</span>
                        </div>
                        {feedbackResult.changes.filter(c => c.type === 'removed').map((c, i) => (
                          <div key={i} style={{ marginBottom: 10, paddingLeft: 22 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#1A202C' }}>{c.node_name}</span>
                            <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '2px 0 0' }}>{c.rationale}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && selectedPath && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, fontSize: 13, backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030', fontFamily: FONT }}>
                  {error}
                </div>
              )}
            </>
          )}
        </StepCard>
      </div>

      <StepConnector />

      {/* ─── STEP 3: Export n8n Workflow ─── */}
      <div ref={step3Ref}>
        <StepCard
          stepNumber={3}
          title="Export your n8n workflow"
          subtitle="Download your importable n8n workflow JSON file."
          done={!!n8nJson}
          collapsed={false}
        >
          {!step2Done ? (
            /* Pre-export placeholder */
            <StepPlaceholder
              icon={<Download size={18} color="#A0AEC0" />}
              message="Your n8n workflow file will appear here"
              detail="Complete the steps above to generate a downloadable n8n workflow JSON file that you can import directly into n8n Cloud or self-hosted."
            />
          ) : exportLoading ? (
            /* Export loading state */
            <div style={{ padding: '32px 0', textAlign: 'center' as const, fontFamily: FONT }}>
              <div style={{
                width: '100%', height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden', marginBottom: 16,
              }}>
                <div style={{
                  height: '100%', background: LEVEL_ACCENT, borderRadius: 2,
                  animation: 'ppExportBar 2s ease-in-out forwards',
                }} />
              </div>
              <div style={{ fontSize: 13, color: '#718096', fontFamily: FONT }}>
                {exportLoadingMsg}
              </div>
              <style>{`@keyframes ppExportBar { from { width: 0%; } to { width: 100%; } }`}</style>
            </div>
          ) : n8nJson && n8nIntermediate ? (
            /* Export Card — PRD Section 7 */
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth >= 768 ? '55% 45%' : '1fr',
              gap: 24, fontFamily: FONT,
              animation: 'ppFadeIn 0.5s ease-out',
            }}>
              {/* LEFT COLUMN — Download & Import */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Panel 1: Download block */}
                <div style={{
                  background: '#E6FFFA', border: '1.5px solid #38B2AC44', borderRadius: 16, padding: 28,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#38B2AC20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={18} color="#38B2AC" />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{n8nIntermediate.workflowName}</div>
                      <div style={{ fontSize: 13, color: '#718096' }}>{n8nIntermediate.summary}</div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#38B2AC20', color: '#1A7A76' }}>
                      {n8nIntermediate.nodes.length} nodes
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#38B2AC20', color: '#1A7A76' }}>
                      {n8nIntermediate.complexity}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#38B2AC20', color: '#1A7A76' }}>
                      {n8nIntermediate.estimatedRunTime}
                    </span>
                  </div>

                  {/* Download button */}
                  <button onClick={handleDownloadJson} style={{
                    width: '100%', padding: '12px 0', borderRadius: 99, border: 'none',
                    background: '#38B2AC', color: '#FFFFFF', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', fontFamily: FONT, transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <Download size={15} style={{ marginRight: 8, verticalAlign: 'middle', marginTop: -2 }} />
                    Download workflow.json
                  </button>
                  <div style={{ fontSize: 11, color: '#718096', textAlign: 'center' as const, marginTop: 8 }}>
                    Compatible with n8n Cloud and n8n self-hosted
                  </div>
                </div>

                {/* Panel 2: How to import into n8n */}
                <div style={{
                  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '22px 24px',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1A202C', marginBottom: 16 }}>How to import into n8n</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      <>Open your n8n instance and click <strong>Create new workflow</strong></>,
                      <>Click the <strong>&#x22EF;</strong> menu in the top-right corner of the canvas</>,
                      <>Select <strong>Import from File</strong> and choose <code style={{ fontSize: 12, background: '#F7FAFC', padding: '1px 6px', borderRadius: 4 }}>{workflowName.replace(/\s+/g, '-').toLowerCase()}.json</code></>,
                      <>Reconnect credentials for each node that requires authentication</>,
                      <>Click <strong>Execute once</strong> with test data to validate the workflow runs correctly</>,
                    ].map((text, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: '#E6FFFA', border: '1px solid #38B2AC44',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#1A7A76',
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — Setup Guide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Panel 3: Variables to configure */}
                <div style={{
                  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '22px 24px',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1A202C', marginBottom: 4 }}>What you'll need to configure</div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 14 }}>
                    After importing, you'll need to connect these to your own accounts and settings.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {n8nIntermediate.nodes
                      .filter(node => node.configRequirements.length > 0)
                      .map((node, i) => {
                        const templateMeta = N8N_NODE_TEMPLATES[node.n8nNodeKey];
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', background: '#F7FAFC', borderRadius: 8,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14 }}>{templateMeta?.emoji || '🔧'}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{node.service || node.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {node.configRequirements.map((req, j) => (
                                <span key={j} style={{
                                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                  background: '#FFFFF0', border: '1px solid #D69E2E44', color: '#8A6A00',
                                }}>{req}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Human-in-the-loop advisory */}
                {n8nIntermediate.humanInTheLoop && (
                  <div style={{
                    background: '#FFFFF0', border: '1px solid #D69E2E44', borderRadius: 12, padding: '14px 20px',
                  }}>
                    <div style={{ fontSize: 13, color: '#744210', lineHeight: 1.5 }}>
                      This workflow performs irreversible actions (sending messages, writing to databases). Consider adding a manual review step before the output. n8n's "Wait" node can pause execution for human approval.
                    </div>
                  </div>
                )}

                {/* Panel 4: Cross-tool references */}
                <div style={{
                  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A202C', marginBottom: 12 }}>Want to go further?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Card A: Prompt Playground */}
                    <div style={{
                      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px',
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: '#E6FFFA', color: '#1A7A76', marginBottom: 6, display: 'inline-block',
                      }}>L1</span>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginTop: 4 }}>
                        Use the Prompt Playground to test and refine any AI prompts in this workflow before locking them in.
                      </div>
                      <a href="/app/toolkit/prompt-playground" style={{
                        fontSize: 12, fontWeight: 700, color: '#38B2AC', textDecoration: 'none', marginTop: 6, display: 'inline-block',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >Open Prompt Playground →</a>
                    </div>

                    {/* Card B: Agent Builder */}
                    <div style={{
                      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px',
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: '#E6FFFA', color: '#1A7A76', marginBottom: 6, display: 'inline-block',
                      }}>L2</span>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginTop: 4 }}>
                        If any step uses an AI model, replace it with a custom agent built in the Agent Builder for better control.
                      </div>
                      <a href="/app/toolkit/agent-builder" style={{
                        fontSize: 12, fontWeight: 700, color: '#38B2AC', textDecoration: 'none', marginTop: 6, display: 'inline-block',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >Open Agent Builder →</a>
                    </div>

                    {/* Card C: Save to Artefacts */}
                    <div style={{
                      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px',
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: '#E6FFFA', color: '#1A7A76', marginBottom: 6, display: 'inline-block',
                      }}>L3</span>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginTop: 4 }}>
                        This workflow feeds directly into your Level 5 Business Case evaluation. Save it to your Artefacts library.
                      </div>
                      <button onClick={handleSaveToArtefacts} disabled={savedToArtefacts} style={{
                        marginTop: 8, padding: '7px 16px', borderRadius: 99, border: 'none',
                        background: savedToArtefacts ? '#48BB78' : '#38B2AC',
                        color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: savedToArtefacts ? 'default' : 'pointer',
                        fontFamily: FONT, transition: 'opacity 0.15s',
                      }}
                        onMouseEnter={e => { if (!savedToArtefacts) e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        {savedToArtefacts ? <><Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Saved</> : 'Save to Artefacts →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel 5: JSON preview (collapsible) */}
                <div style={{
                  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setJsonPreviewOpen(!jsonPreviewOpen)}
                    style={{
                      width: '100%', padding: '14px 24px', border: 'none', background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', fontFamily: FONT,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#718096' }}>View raw n8n JSON</span>
                    <ChevronDown size={16} color="#718096" style={{
                      transform: jsonPreviewOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }} />
                  </button>
                  {jsonPreviewOpen && (
                    <div style={{ position: 'relative', padding: '0 24px 16px' }}>
                      <button
                        onClick={handleCopyJson}
                        style={{
                          position: 'absolute', top: 4, right: 32, background: '#F7FAFC',
                          border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 10px',
                          fontSize: 11, fontWeight: 600, color: '#718096', cursor: 'pointer',
                          fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        {jsonCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                      </button>
                      <pre style={{
                        fontSize: 11, color: '#4A5568', background: '#F7FAFC', borderRadius: 8,
                        padding: 16, maxHeight: 280, overflowY: 'auto', overflowX: 'auto',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineHeight: 1.5, margin: 0, whiteSpace: 'pre',
                      }}>
                        {n8nJson}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action row (full width) */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                <ActionBtn icon={<RotateCcw size={14} />} label="Start Over" onClick={handleStartOver} />
              </div>
            </div>
          ) : null}
        </StepCard>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
          fontFamily: FONT, animation: 'ppFadeIn 0.2s ease',
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

export default AppWorkflowCanvas;
