import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, Sparkles, Wrench, Plus, Undo2, Trash2, X,
  Info, Lightbulb, ChevronDown, Loader2,
} from 'lucide-react';
import type { WorkflowNode, WorkflowPath, WorkflowGenerateResult, WorkflowFeedbackResult, NodeLayer, NodeDefinition } from '../types';
import { useWorkflowDesignApi } from '../hooks/useWorkflowDesignApi';
import {
  INPUT_NODES, PROCESSING_NODES, OUTPUT_NODES, NODE_MAP,
  LAYER_COLORS, WORKFLOW_EXAMPLES, ICON_MAP,
} from '../data/workflow-designer-content';
import { ArtifactClosing } from './ArtifactClosing';

/* ─── Constants ──────────────────────────────────────────────────── */

const NODE_W = 140;
const NODE_H = 72;
const GAP_X = 40;
const GAP_Y = 40;
const BAND_H = 6;

const NODE_W_MOBILE = 120;
const NODE_H_MOBILE = 64;
const GAP_X_MOBILE = 24;
const GAP_Y_MOBILE = 24;

/* ─── Hooks ──────────────────────────────────────────────────────── */

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

function useMobile(): boolean {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

/* ─── Layout helpers ─────────────────────────────────────────────── */

interface NodePosition { x: number; y: number; row: number; posInRow: number; direction: 'ltr' | 'rtl'; }

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

/* ─── CanvasNode ─────────────────────────────────────────────────── */

function CanvasNode({ node, position, nw, nh, animated, index, onClick, isMobile }: {
  node: WorkflowNode; position: NodePosition; nw: number; nh: number;
  animated: boolean; index: number; onClick?: (nodeId: string) => void; isMobile: boolean;
}) {
  const def = NODE_MAP[node.node_id];
  const layer = node.layer;
  const colors = LAYER_COLORS[layer];
  const IconComp = def ? getNodeIcon(def.icon) : Info;
  const iconSize = isMobile ? 16 : 20;
  const nameSize = isMobile ? '10px' : '11px';
  const isAdded = node.status === 'added';
  const isRemoved = node.status === 'removed';

  return (
    <div
      className={`absolute flex flex-col items-center transition-all duration-150 ${animated ? 'animate-node-appear' : 'opacity-0'}`}
      style={{
        left: position.x,
        top: position.y,
        width: nw,
        height: nh,
        animationDelay: `${index * 0.15}s`,
        animationFillMode: 'forwards',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={() => onClick?.(node.id)}
      tabIndex={0}
      aria-label={`${node.name} — ${layer} node`}
    >
      <div
        className="w-full h-full bg-white rounded-lg overflow-hidden relative"
        style={{
          border: isAdded ? '2px dashed #48BB78' : isRemoved ? '2px dashed #FC8181' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          opacity: isRemoved ? 0.4 : 1,
        }}
      >
        <div style={{ height: BAND_H, backgroundColor: colors.band, borderRadius: '8px 8px 0 0' }} />
        <div className="flex flex-col items-center justify-center" style={{ height: nh - BAND_H, padding: '4px 8px' }}>
          <IconComp size={iconSize} color={colors.dark} strokeWidth={1.5} />
          <span
            className="text-center font-semibold leading-tight mt-1"
            style={{
              fontSize: nameSize, color: '#1A202C', maxWidth: nw - 16,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              textDecoration: isRemoved ? 'line-through' : 'none',
            }}
          >
            {node.name}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── ConnectionLines ────────────────────────────────────────────── */

function ConnectionLines({ positions, nw, nh, animatedCount }: {
  positions: NodePosition[]; nw: number; nh: number; animatedCount: number;
}) {
  if (positions.length < 2) return null;
  const paths = generateConnectionPaths(positions, nw, nh);
  const maxX = Math.max(...positions.map(p => p.x)) + nw;
  const maxY = Math.max(...positions.map(p => p.y)) + nh;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: maxX, height: maxY }} aria-hidden="true">
      <defs>
        <marker id="wf-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#A0AEC0" />
        </marker>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="#A0AEC0" strokeWidth={2} fill="none" markerEnd="url(#wf-arrowhead)"
          style={{ opacity: i < animatedCount ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      ))}
    </svg>
  );
}

/* ─── CanvasSkeleton ─────────────────────────────────────────────── */

function CanvasSkeleton({ nodesPerRow, nw, nh, gx, gy }: { nodesPerRow: number; nw: number; nh: number; gx: number; gy: number }) {
  const count = 6;
  const positions = calculatePositions(count, nodesPerRow, nw, nh, gx, gy);
  const totalRows = positions.length > 0 ? positions[positions.length - 1].row + 1 : 1;
  return (
    <div className="relative mx-auto" style={{ width: nodesPerRow * (nw + gx) - gx, height: totalRows * (nh + gy) - gy }}>
      {positions.map((pos, i) => (
        <div key={i} className="absolute rounded-lg animate-skeleton"
          style={{ left: pos.x, top: pos.y, width: nw, height: nh, backgroundColor: '#EDF2F7', animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

/* ─── NodeLibraryPanel ───────────────────────────────────────────── */

function NodeLibraryPanel({ activeTab, onTabChange, onAddNode, onClose, isMobile }: {
  activeTab: NodeLayer; onTabChange: (t: NodeLayer) => void;
  onAddNode: (def: NodeDefinition) => void; onClose: () => void; isMobile: boolean;
}) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const nodes = getNodesForLayer(activeTab);
  const tabs: { key: NodeLayer; label: string }[] = [
    { key: 'input', label: 'Data Input' },
    { key: 'processing', label: 'Processing' },
    { key: 'output', label: 'Data Output' },
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-bold text-[16px]" style={{ color: '#1A202C' }}>Add Node</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close panel"><X size={20} /></button>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          const c = LAYER_COLORS[t.key];
          return (
            <button key={t.key} onClick={() => onTabChange(t.key)}
              className="text-[12px] px-3 py-1 rounded-full transition-all"
              style={{ backgroundColor: isActive ? c.bg : 'transparent', color: isActive ? c.dark : '#718096', fontWeight: isActive ? 600 : 400, border: `1px solid ${isActive ? c.border : '#E2E8F0'}` }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {nodes.map(def => {
          const c = LAYER_COLORS[def.layer];
          const IconComp = getNodeIcon(def.icon);
          return (
            <div key={def.nodeId} className="relative">
              <button onClick={() => onAddNode(def)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                style={{ borderBottom: '1px solid #F7FAFC' }}>
                <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, backgroundColor: c.band }} />
                <IconComp size={18} color={c.dark} strokeWidth={1.5} className="shrink-0" />
                <span className="font-semibold text-[13px]" style={{ color: '#1A202C' }}>{def.name}</span>
                <span className="ml-auto shrink-0 text-gray-400 hover:text-gray-600"
                  onClick={(e) => { e.stopPropagation(); setTooltipId(tooltipId === def.nodeId ? null : def.nodeId); }}>
                  <Info size={16} />
                </span>
              </button>
              {tooltipId === def.nodeId && (
                <div className="absolute right-4 z-10 w-56 p-3 rounded-lg text-[12px] leading-relaxed"
                  style={{ backgroundColor: '#1A202C', color: '#E2E8F0', top: '100%', marginTop: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  {def.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl animate-slide-up-sheet"
          style={{ maxHeight: '60vh', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="absolute top-0 right-0 h-full bg-white animate-slide-in-right z-20"
      style={{ width: 340, borderLeft: '1px solid #E2E8F0', boxShadow: '-2px 0 8px rgba(0,0,0,0.04)' }}>
      {content}
    </div>
  );
}

/* ─── CanvasToolbar ──────────────────────────────────────────────── */

function CanvasToolbar({ onUndo, onAddNode, onClear, canUndo, hasNodes, panelOpen }: {
  onUndo: () => void; onAddNode: () => void; onClear: () => void;
  canUndo: boolean; hasNodes: boolean; panelOpen: boolean;
}) {
  const isMobile = useMobile();
  const [showConfirm, setShowConfirm] = useState(false);
  const btnClass = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white transition-colors text-[12px]';
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    border: '1px solid #E2E8F0', color: '#718096',
    opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div className="flex items-center gap-2 mb-3">
      <button className={btnClass} style={btnStyle(!canUndo)} onClick={onUndo} disabled={!canUndo} aria-label="Undo last action">
        <Undo2 size={16} />{!isMobile && 'Undo'}
      </button>
      <button className={btnClass}
        style={{ ...btnStyle(false), color: panelOpen ? '#38B2AC' : '#718096', borderColor: panelOpen ? '#38B2AC' : '#E2E8F0' }}
        onClick={onAddNode}>
        <Plus size={16} />{!isMobile && 'Add Node'}
      </button>
      <div className="relative">
        <button className={btnClass} style={btnStyle(!hasNodes)} onClick={() => hasNodes && setShowConfirm(true)} disabled={!hasNodes}>
          <Trash2 size={16} />{!isMobile && 'Clear'}
        </button>
        {showConfirm && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 p-3 z-30"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 180 }}>
            <p className="text-[13px] font-medium mb-2" style={{ color: '#1A202C' }}>Clear all nodes?</p>
            <div className="flex gap-2">
              <button onClick={() => { onClear(); setShowConfirm(false); }} className="px-3 py-1 rounded-md text-white text-[12px] font-medium" style={{ backgroundColor: '#FC8181' }}>Yes</button>
              <button onClick={() => setShowConfirm(false)} className="px-3 py-1 rounded-md text-[12px] font-medium" style={{ border: '1px solid #E2E8F0', color: '#718096' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PathChoiceInterstitial ─────────────────────────────────────── */

function PathChoiceInterstitial({ onSelectA, onSelectB }: { onSelectA: () => void; onSelectB: () => void }) {
  return (
    <div className="animate-slide-down-fade mx-auto" style={{ maxWidth: 720, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 32, marginTop: 24 }}>
      <h2 className="text-center font-bold text-[22px] mb-6" style={{ color: '#1A202C' }}>How would you like to build this workflow?</h2>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Path A */}
        <div className="flex-1 bg-white rounded-xl p-6 text-center cursor-pointer transition-all"
          style={{ border: '1px solid #E2E8F0' }}
          onClick={onSelectA}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#38B2AC'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(56,178,172,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div className="flex justify-center mb-3"><Sparkles size={24} color="#38B2AC" /></div>
          <h3 className="font-bold text-[18px] mb-2" style={{ color: '#1A202C' }}>Design It For Me</h3>
          <p className="text-[14px] mx-auto" style={{ color: '#718096', maxWidth: 240 }}>Get an AI-designed workflow based on your description.</p>
          <button className="mt-5 px-5 py-2.5 rounded-full text-white text-[14px] font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#38B2AC' }}
            onClick={e => { e.stopPropagation(); onSelectA(); }}>
            Generate Workflow <ArrowRight size={14} />
          </button>
        </div>
        {/* Path B */}
        <div className="flex-1 bg-white rounded-xl p-6 text-center cursor-pointer transition-all"
          style={{ border: '1px solid #E2E8F0' }}
          onClick={onSelectB}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#38B2AC'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(56,178,172,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div className="flex justify-center mb-3"><Wrench size={24} color="#5B6DC2" /></div>
          <h3 className="font-bold text-[18px] mb-2" style={{ color: '#1A202C' }}>I'll Build It Myself</h3>
          <p className="text-[14px] mx-auto" style={{ color: '#718096', maxWidth: 240 }}>Build your own workflow and get AI feedback on your design.</p>
          <button className="mt-5 px-5 py-2.5 rounded-full text-[14px] inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ border: '1px solid #2D3748', color: '#2D3748' }}
            onClick={e => { e.stopPropagation(); onSelectB(); }}>
            Open Builder <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ComparisonToggle ───────────────────────────────────────────── */

function ComparisonToggle({ active, onChange }: { active: 'user' | 'ai'; onChange: (v: 'user' | 'ai') => void }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex rounded-full p-1" style={{ border: '1px solid #E2E8F0', backgroundColor: '#F7FAFC' }} role="tablist">
        {(['user', 'ai'] as const).map(v => (
          <button key={v} role="tab" aria-selected={active === v} onClick={() => onChange(v)}
            className="px-5 py-2 rounded-full text-[14px] transition-all"
            style={{
              backgroundColor: active === v ? '#FFFFFF' : 'transparent',
              color: active === v ? '#1A202C' : '#718096',
              fontWeight: active === v ? 700 : 400,
              boxShadow: active === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {v === 'user' ? 'Your Workflow' : 'AI Suggestion'}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── ChangesPanel ───────────────────────────────────────────────── */

function ChangesPanel({ changes }: { changes: WorkflowFeedbackResult['changes'] }) {
  const addedChanges = changes.filter(c => c.type === 'added');
  const removedChanges = changes.filter(c => c.type === 'removed');

  return (
    <div className="mt-6" style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
      <h3 className="font-bold text-[18px] mb-4" style={{ color: '#1A202C' }}>Changes Made</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addedChanges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-4 rounded" style={{ border: '2px solid #48BB78', backgroundColor: 'rgba(72,187,120,0.1)' }} />
              <span className="font-semibold text-[14px]" style={{ color: '#38A169' }}>Nodes Added</span>
            </div>
            {addedChanges.map((c, i) => (
              <div key={i} className="mb-3 pl-6">
                <span className="font-semibold text-[14px]" style={{ color: '#1A202C' }}>{c.node_name}</span>
                <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: '#4A5568' }}>{c.rationale}</p>
              </div>
            ))}
          </div>
        )}
        {removedChanges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-4 rounded" style={{ border: '2px solid #FC8181', backgroundColor: 'rgba(252,129,129,0.1)' }} />
              <span className="font-semibold text-[14px]" style={{ color: '#E53E3E' }}>Nodes Removed</span>
            </div>
            {removedChanges.map((c, i) => (
              <div key={i} className="mb-3 pl-6">
                <span className="font-semibold text-[14px]" style={{ color: '#1A202C' }}>{c.node_name}</span>
                <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: '#4A5568' }}>{c.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── NodeLibrarySection (below canvas reference) ────────────────── */

function NodeLibrarySection() {
  const [activeTab, setActiveTab] = useState<NodeLayer>('input');
  const nodes = getNodesForLayer(activeTab);
  const tabs: { key: NodeLayer; label: string }[] = [
    { key: 'input', label: 'Data Input' },
    { key: 'processing', label: 'Processing' },
    { key: 'output', label: 'Data Output' },
  ];

  return (
    <div id="node-library" style={{ marginTop: 64 }}>
      <h2 className="font-bold text-[28px] mb-1" style={{ color: '#1A202C' }}>Node Library</h2>
      <p className="text-[15px] mb-6" style={{ color: '#4A5568' }}>
        Explore the building blocks for your workflows — inspired by tools like n8n and Zapier.
      </p>
      <div className="inline-flex rounded-full p-1 mb-6" style={{ border: '1.5px solid #FBE8A6', backgroundColor: 'rgba(251,232,166,0.08)' }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="px-5 py-2 rounded-full text-[14px] transition-all"
              style={{
                backgroundColor: isActive ? 'rgba(251,232,166,0.2)' : 'transparent',
                color: isActive ? '#C4A934' : '#718096',
                fontWeight: isActive ? 600 : 400,
                border: isActive ? '1px solid #FBE8A6' : '1px solid transparent',
              }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {nodes.map(def => {
          const IconComp = getNodeIcon(def.icon);
          return (
            <div key={def.nodeId} className="flex flex-col items-center bg-white rounded-xl p-4 transition-all hover:shadow-sm text-center"
              style={{ border: '1px solid #E2E8F0', minHeight: 120 }}>
              <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: 'rgba(251,232,166,0.2)', border: '1.5px solid #FBE8A6' }}>
                <IconComp size={24} color="#C4A934" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-[13px] leading-tight mb-1" style={{ color: '#1A202C' }}>{def.name}</span>
              <p className="text-[11px] leading-[1.4]" style={{
                color: '#718096',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>
                {def.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function WorkflowDesigner() {
  /* ── State ── */
  const [taskDescription, setTaskDescription] = useState('');
  const [toolsAndSystems, setToolsAndSystems] = useState('');
  const [flashTask, setFlashTask] = useState(false);
  const [flashTools, setFlashTools] = useState(false);

  const [showPathChoice, setShowPathChoice] = useState(false);
  const [selectedPath, setSelectedPath] = useState<WorkflowPath | null>(null);
  const [inputMuted, setInputMuted] = useState(false);

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

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const pathChoiceRef = useRef<HTMLDivElement>(null);

  const { designWorkflow, isLoading, error, clearError } = useWorkflowDesignApi();

  const nodesPerRow = useNodesPerRow();
  const isMobile = useMobile();
  const nw = isMobile ? NODE_W_MOBILE : NODE_W;
  const nh = isMobile ? NODE_H_MOBILE : NODE_H;
  const gx = isMobile ? GAP_X_MOBILE : GAP_X;
  const gy = isMobile ? GAP_Y_MOBILE : GAP_Y;

  /* ── Derived ── */
  const displayedNodes: WorkflowNode[] = (() => {
    if (selectedPath === 'a') return generateResult?.nodes || [];
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

  /* ── Animation effects ── */
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

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  useEffect(() => {
    if (!nodeClickMenu) return;
    const handler = () => setNodeClickMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [nodeClickMenu]);

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

  const handleContinue = () => {
    if (!taskDescription.trim()) return;
    setShowPathChoice(true);
    setInputMuted(true);
    setTimeout(() => pathChoiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const handlePathA = async () => {
    setShowPathChoice(false);
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
    }
  };

  const handlePathB = () => {
    setShowPathChoice(false);
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
    }
  };

  const handleStartOver = () => {
    setTaskDescription('');
    setToolsAndSystems('');
    setShowPathChoice(false);
    setSelectedPath(null);
    setInputMuted(false);
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
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb */}
        <a href="#home" className="inline-flex items-center gap-1.5 text-[14px] mb-8 transition-colors hover:text-[#C4A934]" style={{ color: '#718096' }}>
          <ArrowLeft size={16} /> Back to Level 3
        </a>

        {/* Centered Title */}
        <div className="mb-8 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15] mb-6">
            Design Your
            <br />
            <span className="relative inline-block">
              AI Workflow
              <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#C4A934] opacity-80 rounded-full" />
            </span>
          </h1>
        </div>

        {/* Fun Fact Card */}
        <div className="mb-4">
          <div className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(251,232,166,0.15) 0%, rgba(196,169,52,0.08) 50%, rgba(251,232,166,0.12) 100%)',
              border: '1.5px solid #FBE8A6',
            }}>
            <div className="absolute top-3 left-4 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C4A934] opacity-40" />
              <span className="w-2 h-2 rounded-full bg-[#FBE8A6] opacity-60" />
              <span className="w-2 h-2 rounded-full bg-[#C4A934] opacity-30" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C4A934] mb-3">Did you know?</p>
            <p className="text-[18px] md:text-[20px] text-[#2D3748] font-bold leading-tight whitespace-nowrap">
              Connected AI workflows deliver up to <span className="text-[#C4A934]">5x more ROI</span> than isolated tools.
            </p>
            <p className="text-[15px] text-[#718096] leading-tight mt-2 whitespace-nowrap">
              Describe a process below and we'll help you map it as an end-to-end, node-based automation workflow.
            </p>
          </div>
        </div>

        {/* Three-Layer Model Overview Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: 1, label: 'Data Input', color: LAYER_COLORS.input,
                question: 'Where does your data come from?',
                desc: 'Think about the triggers and sources that kick off your process — forms, emails, spreadsheets, CRM updates, or scheduled pulls.',
                examples: 'Survey forms, email triggers, file uploads, API calls',
              },
              {
                num: 2, label: 'Processing', color: LAYER_COLORS.processing,
                question: 'What needs to happen to the data?',
                desc: 'Consider the analysis, transformation, and review steps — AI agents, classifiers, filters, and human review checkpoints.',
                examples: 'AI analysis, sentiment scoring, summarization, validation',
              },
              {
                num: 3, label: 'Data Output', color: LAYER_COLORS.output,
                question: 'Where do the results need to go?',
                desc: 'Think about where processed data lands — reports, dashboards, emails, Slack messages, or back into your systems.',
                examples: 'PDF reports, email delivery, Slack alerts, dashboards',
              },
            ].map(layer => (
              <div key={layer.num} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ backgroundColor: layer.color.band, color: layer.color.dark }}>
                    {layer.num}
                  </div>
                  <span className="text-[16px] font-bold text-[#1A202C]">{layer.label}</span>
                </div>
                <p className="text-[14px] font-medium text-[#2D3748] mb-2">{layer.question}</p>
                <p className="text-[13px] text-[#718096] leading-[1.5] mb-3">{layer.desc}</p>
                <p className="text-[12px] leading-snug" style={{ color: '#A0AEC0' }}>
                  <span className="font-semibold" style={{ color: '#718096' }}>Examples:</span> {layer.examples}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => document.getElementById('node-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:text-[#C4A934]"
              style={{ color: '#92770A' }}>
              Curious to explore all available nodes? <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Input Section — Pale Yellow accent card */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 scroll-mt-24 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(251,232,166,0.12) 0%, rgba(251,232,166,0.06) 100%)',
            border: '1.5px solid #FBE8A6',
            opacity: inputMuted && selectedPath ? 0.7 : 1,
          }}>

          <h2 className="text-[20px] md:text-[24px] font-bold text-[#1A202C] mb-4">Describe the process you want to automate</h2>

          {/* Example pills */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {WORKFLOW_EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleExampleClick(i)}
                className="px-3 py-1 rounded-full text-[13px] transition-colors"
                style={{ border: '1px solid #FBE8A6', backgroundColor: 'rgba(251,232,166,0.08)', color: '#92770A' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#C4A934'; (e.target as HTMLElement).style.backgroundColor = 'rgba(251,232,166,0.2)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#FBE8A6'; (e.target as HTMLElement).style.backgroundColor = 'rgba(251,232,166,0.08)'; }}>
                {ex.name}
              </button>
            ))}
          </div>

          {/* Textarea 1 */}
          <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">What process do you want to automate?</label>
          <textarea value={taskDescription}
            onChange={e => { setTaskDescription(e.target.value); clearError(); }}
            placeholder="e.g., When our team completes a client engagement survey, I want the responses automatically analyzed for themes and sentiment, with a summary report emailed to the project lead and the raw data stored in our project database..."
            className="w-full rounded-xl text-[15px] resize-none focus:outline-none transition-all"
            style={{
              minHeight: 100, maxHeight: 160, padding: 16,
              border: `2px solid ${flashTask ? '#C4A934' : '#FBE8A6'}`,
              color: '#1A202C',
              backgroundColor: flashTask ? 'rgba(251,232,166,0.2)' : '#FFFFFF',
              transition: 'background-color 0.3s, border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#C4A934'; e.target.style.boxShadow = '0 0 0 3px rgba(196,169,52,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#FBE8A6'; e.target.style.boxShadow = 'none'; }}
          />

          {/* Textarea 2 */}
          <div className="mt-4">
            <label className="text-[13px] font-semibold text-[#1A202C] mb-1.5 flex items-center gap-2">
              What tools or systems are already involved?
              <span className="text-[11px] font-semibold text-[#C4A934] bg-[rgba(251,232,166,0.3)] rounded-[10px] px-2 py-0.5">Recommended</span>
            </label>
            <textarea value={toolsAndSystems}
              onChange={e => setToolsAndSystems(e.target.value)}
              placeholder="e.g., We currently collect surveys via Microsoft Forms, store data in SharePoint, and communicate via Teams and email..."
              className="w-full mt-2 rounded-xl text-[15px] resize-none focus:outline-none transition-all"
              style={{
                minHeight: 72, maxHeight: 120, padding: 16,
                border: `2px solid ${flashTools ? '#C4A934' : '#FBE8A6'}`,
                color: '#1A202C',
                backgroundColor: flashTools ? 'rgba(251,232,166,0.2)' : '#FFFFFF',
                transition: 'background-color 0.3s, border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#C4A934'; e.target.style.boxShadow = '0 0 0 3px rgba(196,169,52,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#FBE8A6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-lg text-[13px]" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030' }}>{error}</div>
          )}

          {/* Callout + CTA */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#C4A934] rounded-lg px-4 py-3">
              <p className="text-[13px] font-semibold text-[#1A202C] mb-0.5 flex items-center gap-1.5">
                <Info size={14} className="text-[#C4A934]" />
                Why connect agents into workflows?
              </p>
              <p className="text-[12px] text-[#4A5568] leading-[1.5]">
                Individual AI agents solve single tasks. Workflows connect them end-to-end — so data flows automatically from input through processing to output, with human oversight where it matters.
              </p>
            </div>
            <button onClick={handleContinue}
              disabled={!taskDescription.trim() || !!selectedPath}
              className="flex items-center justify-center gap-2 px-7 py-3 rounded-full text-[15px] font-semibold text-white transition-all shrink-0"
              style={{ backgroundColor: '#C4A934', opacity: (!taskDescription.trim() || !!selectedPath) ? 0.5 : 1, cursor: (!taskDescription.trim() || !!selectedPath) ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Processing...' : <>Continue <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>

        {/* Path Choice */}
        {showPathChoice && !selectedPath && (
          <div ref={pathChoiceRef}>
            <PathChoiceInterstitial onSelectA={handlePathA} onSelectB={handlePathB} />
          </div>
        )}

        {/* Workflow Canvas — always visible */}
        <div className="mt-8" ref={canvasRef}>
          {/* Comparison toggle */}
          {selectedPath === 'b' && feedbackResult && (
            <ComparisonToggle active={comparisonView} onChange={v => { setComparisonView(v); setNodesAnimated(0); setConnectionsAnimated(0); }} />
          )}

          {/* Overall assessment */}
          {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && (
            <p className="text-center text-[14px] mb-4 mx-auto" style={{ color: '#4A5568', maxWidth: 600 }}>{feedbackResult.overall_assessment}</p>
          )}

          {/* Canvas container */}
          <div className="canvas-dotted-grid relative rounded-xl overflow-hidden"
            style={{ border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC', padding: 32, minHeight: 300 }}>

            {/* Default placeholder — no path selected yet */}
            {!selectedPath && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowUp size={28} color="#C4A934" className="mb-3 animate-bounce-down" />
                <span className="font-semibold text-[18px] mb-2" style={{ color: '#2D3748' }}>
                  Your workflow will appear here
                </span>
                <p className="text-[14px] mb-8 mx-auto" style={{ color: '#718096', maxWidth: 480 }}>
                  Fill in the description above and click Continue to start building your workflow.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ maxWidth: 520 }}>
                  <div className="rounded-xl p-4 bg-white" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} color="#C4A934" />
                      <span className="font-semibold text-[14px] text-[#1A202C]">Option 1</span>
                    </div>
                    <p className="text-[13px] text-[#718096] leading-[1.5]">
                      Describe your process and let AI design the workflow nodes for you automatically.
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-white" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={16} color="#5B6DC2" />
                      <span className="font-semibold text-[14px] text-[#1A202C]">Option 2</span>
                    </div>
                    <p className="text-[13px] text-[#718096] leading-[1.5]">
                      Build the workflow yourself from our node library, then get AI feedback on your design.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Path B toolbar */}
            {selectedPath === 'b' && !feedbackResult && (
              <CanvasToolbar onUndo={handleUndo} onAddNode={() => setPanelOpen(!panelOpen)} onClear={handleClearAll}
                canUndo={undoStack.length > 0} hasNodes={canvasNodes.length > 0} panelOpen={panelOpen} />
            )}

            {/* Loading (Path A) */}
            {selectedPath === 'a' && isLoading && (
              <>
                <CanvasSkeleton nodesPerRow={nodesPerRow} nw={nw} nh={nh} gx={gx} gy={gy} />
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Loader2 size={20} className="animate-spin" color="#C4A934" />
                  <span className="text-[15px] font-medium" style={{ color: '#4A5568' }}>Designing your workflow...</span>
                </div>
              </>
            )}

            {/* Empty state (Path B) */}
            {selectedPath === 'b' && canvasNodes.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 cursor-pointer"
                onClick={() => { setPanelOpen(true); setActiveLibraryTab('input'); }}>
                <div className="flex items-center justify-center rounded-full mb-3" style={{ width: 64, height: 64, border: '2px dashed #E2E8F0' }}>
                  <Plus size={32} color="#A0AEC0" />
                </div>
                <span className="font-semibold text-[16px]" style={{ color: '#718096' }}>Add Your First Node</span>
                <span className="text-[13px] mt-1" style={{ color: '#A0AEC0' }}>Start with a data input — where does your data come from?</span>
              </div>
            )}

            {/* Rendered nodes */}
            {displayedNodes.length > 0 && !isLoading && (
              <div className={`relative ${selectedPath === 'a' ? 'mx-auto' : ''}`} style={{ width: canvasWidth, height: canvasHeight }}>
                <ConnectionLines positions={positions} nw={nw} nh={nh} animatedCount={connectionsAnimated} />
                {displayedNodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <CanvasNode node={node} position={positions[i]} nw={nw} nh={nh}
                      animated={i < nodesAnimated + 1} index={i} isMobile={isMobile}
                      onClick={selectedPath === 'b' && !feedbackResult ? id => setNodeClickMenu(nodeClickMenu === id ? null : id) : undefined}
                    />
                    {selectedPath === 'b' && !feedbackResult && nodeClickMenu === node.id && (
                      <div className="absolute z-30 bg-white rounded-lg border border-gray-200 py-1"
                        style={{ left: positions[i].x + nw / 2 - 50, top: positions[i].y + nh + 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 100 }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleRemoveNode(node.id)}
                          className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-red-50 transition-colors" style={{ color: '#E53E3E' }}>Remove</button>
                        <button onClick={() => { setNodeClickMenu(null); toast(NODE_MAP[node.node_id]?.description || node.name); }}
                          className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 transition-colors" style={{ color: '#4A5568' }}>Info</button>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Legend for comparison view */}
            {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && (
              <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                <span className="flex items-center gap-2 text-[13px]" style={{ color: '#4A5568' }}>
                  <span className="w-4 h-4 rounded" style={{ border: '2px dashed #48BB78', backgroundColor: 'rgba(72,187,120,0.08)' }} />
                  Added
                </span>
                <span className="flex items-center gap-2 text-[13px]" style={{ color: '#4A5568' }}>
                  <span className="w-4 h-4 rounded" style={{ border: '2px dashed #FC8181', backgroundColor: 'rgba(252,129,129,0.08)' }} />
                  Removed
                </span>
              </div>
            )}

            {/* Node library side panel (Path B) */}
            {selectedPath === 'b' && panelOpen && !feedbackResult && (
              <NodeLibraryPanel activeTab={activeLibraryTab} onTabChange={setActiveLibraryTab}
                onAddNode={handleAddNode} onClose={() => setPanelOpen(false)} isMobile={isMobile} />
            )}
          </div>

          {/* Workflow info (Path A) */}
          {selectedPath === 'a' && generateResult && !isLoading && (
            <div className="mt-6">
              <h3 className="font-bold text-[20px] mb-2" style={{ color: '#1A202C' }}>{generateResult.workflow_name}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: '#4A5568' }}>{generateResult.workflow_description}</p>
            </div>
          )}

          {/* Order warning */}
          {selectedPath === 'b' && showOrderWarning && !orderWarningDismissed && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FFFFF0', border: '1px solid #F6E05E' }}>
              <Lightbulb size={16} color="#B7791F" className="shrink-0 mt-0.5" />
              <p className="flex-1 text-[13px]" style={{ color: '#B7791F' }}>
                <strong>Tip:</strong> Most workflows follow the pattern Input &rarr; Processing &rarr; Output. Consider adding a processing step between your data source and destination.
              </p>
              <button onClick={() => { setShowOrderWarning(false); setOrderWarningDismissed(true); }} className="shrink-0 text-yellow-600 hover:text-yellow-800"><X size={14} /></button>
            </div>
          )}

          {/* Get AI Feedback (Path B) */}
          {selectedPath === 'b' && canvasNodes.length >= 2 && !feedbackResult && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[13px] font-medium" style={{ color: '#718096' }}>Why did you design it this way? (Optional)</label>
                <div className="relative group">
                  <Info size={15} className="cursor-help" style={{ color: '#C4A934' }} />
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg text-[12px] leading-relaxed z-10"
                    style={{ width: 280, backgroundColor: '#1A202C', color: '#E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    Every workflow reflects design decisions. There's no single "right" way — the best workflow depends on your team's needs and how much human oversight is appropriate. Sharing your rationale helps AI give more targeted feedback.
                  </div>
                </div>
              </div>
              <textarea value={userRationale} onChange={e => setUserRationale(e.target.value)}
                placeholder="e.g., I put the human review step before the email because this output goes directly to the client..."
                className="w-full rounded-xl text-[14px] resize-none transition-all mb-3"
                style={{ minHeight: 60, padding: 14, border: '2px solid #FBE8A6', color: '#1A202C', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#C4A934'; e.target.style.boxShadow = '0 0 0 3px rgba(196,169,52,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#FBE8A6'; e.target.style.boxShadow = 'none'; }}
              />
              <div className="flex justify-end">
                <button onClick={handleGetFeedback}
                  disabled={isLoading || canvasNodes.length < 2}
                  className="px-7 py-3 rounded-full text-white text-[15px] font-semibold inline-flex items-center gap-1.5 transition-all hover:opacity-90"
                  style={{ backgroundColor: '#C4A934', opacity: (isLoading || canvasNodes.length < 2) ? 0.5 : 1, cursor: (isLoading || canvasNodes.length < 2) ? 'not-allowed' : 'pointer' }}>
                  {isLoading ? 'Analyzing...' : 'Get AI Feedback'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* AI Processing Progress */}
          {selectedPath === 'b' && isLoading && canvasNodes.length >= 2 && (
            <div className="mt-6 rounded-xl p-5" style={{ border: '1px solid #FBE8A6', backgroundColor: 'rgba(251,232,166,0.06)' }}>
              <div className="flex items-center gap-3 mb-3">
                <Loader2 size={20} className="animate-spin" color="#C4A934" />
                <span className="text-[15px] font-semibold" style={{ color: '#1A202C' }}>Analyzing your workflow...</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                <div className="h-full rounded-full progress-bar-fill-yellow" style={{ width: '70%' }} />
              </div>
              <p className="text-[13px] mt-2" style={{ color: '#718096' }}>Reviewing your node selection and suggesting improvements...</p>
            </div>
          )}

          {/* Changes panel */}
          {selectedPath === 'b' && feedbackResult && comparisonView === 'ai' && feedbackResult.changes.length > 0 && (
            <ChangesPanel changes={feedbackResult.changes} />
          )}

          {/* Start Over */}
          {(generateResult || feedbackResult || (selectedPath === 'b' && canvasNodes.length > 0)) && (
            <div className="mt-8 flex items-center justify-between">
              <button onClick={handleStartOver}
                className="text-[14px] font-medium px-5 py-2 rounded-full transition-all hover:bg-gray-50"
                style={{ border: '1px solid #E2E8F0', color: '#718096' }}>
                Start Over
              </button>
            </div>
          )}
        </div>

        {/* Node Library Reference */}
        <NodeLibrarySection />

        {/* ─── PAGE CLOSING ─── */}
        <ArtifactClosing
          summaryText="Your workflow outputs don't have to live in spreadsheets. In Level 4, you'll learn to design interactive dashboards that turn automated data into designed intelligence — built for the people who need it."
          ctaLabel="Continue to Level 4: Interactive Dashboards"
          ctaHref="#dashboard-design"
          accentColor="#C4A934"
        />
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-[14px] font-medium animate-toast-enter z-50"
          style={{ backgroundColor: '#1A202C', maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
