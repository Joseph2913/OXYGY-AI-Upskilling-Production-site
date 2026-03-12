import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, ArrowLeft, Check, RotateCcw, Copy, Download, Library,
  Info, ChevronRight, ChevronDown, Sparkles, X,
  Loader2, Eye, Code,
  FileText, Key, ListChecks, Clock, Layers, GitBranch,
} from 'lucide-react';
import type {
  WorkflowNode, WorkflowGenerateResult, WorkflowFeedbackResult,
  WorkflowIntermediate,
} from '../../../types';
import { useWorkflowDesignApi } from '../../../hooks/useWorkflowDesignApi';
import {
  NODE_MAP, LAYER_COLORS, WORKFLOW_EXAMPLES, ICON_MAP,
} from '../../../data/workflow-designer-content';
import { buildIntermediate } from '../../../utils/assembleN8nWorkflow';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';
import PlatformSelector from '../workflow/PlatformSelector';
import ExportSummaryCard from '../workflow/ExportSummaryCard';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import NextStepBanner from './NextStepBanner';

/* ─── Constants ─── */

const FONT = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";
const LEVEL_ACCENT = '#38B2AC';
const LEVEL_ACCENT_DARK = '#1A7A76';

/* ── Loading progress steps (matches L1 pattern) ── */
const INITIAL_LOADING_STEPS = [
  'Analysing your workflow nodes and connections…',
  'Translating to platform terminology…',
  'Writing step-by-step configuration instructions…',
  'Generating credential requirements…',
  'Building test checklist…',
  'Documenting edge cases…',
  'Finalising your Build Guide…',
];
const REFINE_LOADING_STEPS = [
  'Processing your refinement context…',
  'Re-evaluating workflow steps…',
  'Updating configuration instructions…',
  'Revising credential requirements…',
  'Refreshing test checklist…',
  'Applying quality checks…',
  'Finalising refined Build Guide…',
];
// Build guide generation takes longer than other tools (~20-30s)
// Last step = -1 (open-ended buffer — stays spinning until API returns)
const STEP_DELAYS = [800, 2000, 4000, 5000, 5000, 4500, -1];

/* ── Educational sections for Build Guide (Step 4 default) ── */
const BUILD_GUIDE_SECTIONS = [
  {
    key: 'overview',
    icon: FileText,
    label: 'Workflow Overview',
    description: 'A plain-language summary of what the automation does, the trigger event, and the expected output — so anyone reading the guide can quickly understand the purpose.',
    example: 'e.g. "When a new survey response is submitted, extract key themes, score sentiment, and email a summary to the team lead."',
  },
  {
    key: 'credentials',
    icon: Key,
    label: 'Credentials & Prerequisites',
    description: 'A table of every API key, OAuth token, or service account needed — with where to find it, which step uses it, and why it\'s required.',
    example: 'e.g. Google Sheets API key → OAuth consent screen → Used in "Read Survey" step',
  },
  {
    key: 'steps',
    icon: Layers,
    label: 'Step-by-Step Instructions',
    description: 'Numbered configuration instructions for each node in your workflow — from trigger setup through to the final output step, with field-level detail.',
    example: 'e.g. Step 1 — Configure Webhook trigger: Set URL to /survey-complete, method POST, authentication: Header Auth',
  },
  {
    key: 'connections',
    icon: GitBranch,
    label: 'Connection Map',
    description: 'How each node connects to the next — including data mapping, field references, and any transformations applied between steps.',
    example: 'e.g. Webhook → AI Agent: Pass {{$json.response_text}} as the input prompt field',
  },
  {
    key: 'testing',
    icon: ListChecks,
    label: 'Test Checklist',
    description: 'A pre-flight checklist of items to verify before going live — covering data flow, error handling, edge cases, and expected outputs.',
    example: 'e.g. [ ] Verify webhook fires on form submit  [ ] Check AI output contains expected JSON fields',
  },
  {
    key: 'timing',
    icon: Clock,
    label: 'Build Time & Complexity',
    description: 'An estimated build time and complexity rating based on the number of nodes, integrations, and conditional logic in your workflow.',
    example: 'e.g. Estimated build time: 45–60 minutes | Complexity: Intermediate (6 nodes, 2 API integrations)',
  },
];

const NODE_W = 140;
const NODE_H = 72;
const GAP_X = 40;
const GAP_Y = 40;
const BAND_H = 6;

const DRAFT_KEY = 'oxygy_workflow-canvas_draft';

/* ─── Build Guide markdown extraction helpers ─── */

function extractOverview(md: string): string {
  const match = md.match(/\*\*What this workflow does\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n---)/);
  return match ? match[1].trim() : '';
}

function extractStepCount(md: string): number {
  const matches = md.match(/### Step \d+/g);
  return matches ? matches.length : 0;
}

function extractBuildTime(md: string): string {
  const match = md.match(/\*\*Estimated build time\*\*\s*`([^`]+)`/);
  return match ? match[1] : '1–2 hours';
}

function extractCredentials(md: string): Array<{ what: string; whereToFind: string; usedIn: string; why: string }> {
  const section = md.match(/## Before You Start[\s\S]*?(?=\n## )/);
  if (!section) return [];
  const rows: Array<{ what: string; whereToFind: string; usedIn: string; why: string }> = [];
  const tableLines = section[0].split('\n').filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('What'));
  for (const line of tableLines) {
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
    if (cells.length >= 3) {
      // Infer a short description of why this credential is needed based on what it is
      const why = inferCredentialPurpose(cells[0], cells[2]);
      rows.push({ what: cells[0], whereToFind: cells[1], usedIn: cells[2], why });
    }
  }
  return rows;
}

function inferCredentialPurpose(what: string, usedIn: string): string {
  const w = what.toLowerCase();
  if (w.includes('api key') || w.includes('api token')) {
    const service = what.replace(/api\s*(key|token)/i, '').replace(/[^a-zA-Z ]/g, '').trim();
    return service
      ? `Authenticates your connection to ${service} so the automation can make API calls on your behalf.`
      : `Authenticates API requests from your workflow to this service.`;
  }
  if (w.includes('oauth') || w.includes('client id') || w.includes('client secret')) {
    return `Enables secure OAuth authentication so the platform can access this service without storing your password.`;
  }
  if (w.includes('webhook') || w.includes('url')) {
    return `Provides the endpoint that triggers this workflow when an external event occurs.`;
  }
  if (w.includes('password') || w.includes('credentials')) {
    return `Grants the workflow access to this service. Store securely — never hard-code in your automation.`;
  }
  if (w.includes('account') || w.includes('workspace')) {
    return `Identifies which account or workspace the workflow should operate in.`;
  }
  if (w.includes('database') || w.includes('connection string')) {
    return `Connects your workflow to the database where data is read or written.`;
  }
  return `Required for the "${usedIn}" step to connect and communicate with this service.`;
}

function extractSteps(md: string): Array<{ number: number; name: string }> {
  const matches = [...md.matchAll(/### Step (\d+)\s*—\s*(.+)/g)];
  return matches.map(m => ({ number: parseInt(m[1], 10), name: m[2].trim() }));
}

function extractTestChecklist(md: string): string[] {
  const section = md.match(/## Test Checklist[\s\S]*?(?=\n## |$)/);
  if (!section) return [];
  const items: string[] = [];
  for (const line of section[0].split('\n')) {
    const match = line.match(/^- \[ \]\s*(.+)/);
    if (match) items.push(match[1].trim());
  }
  return items;
}

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

function getNodeIcon(iconName: string) {
  return ICON_MAP[iconName] || Info;
}

/* ─── Shared sub-components ─── */

const StepBadge: React.FC<{ number: number; done: boolean; locked?: boolean }> = ({ number, done, locked }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? LEVEL_ACCENT : locked ? '#EDF2F7' : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? LEVEL_ACCENT_DARK : locked ? '#CBD5E0' : '#718096',
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
  locked?: boolean;
  lockedMessage?: string;
  children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF', borderRadius: 16,
    border: done ? `1px solid ${LEVEL_ACCENT}88` : '1px solid #E2E8F0',
    padding: (collapsed || locked) ? '16px 24px' : '24px 28px',
    opacity: locked ? 0.7 : 1,
    transition: 'border-color 0.3s, padding 0.3s, opacity 0.3s',
    fontFamily: FONT,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: (collapsed || locked) ? 0 : 20 }}>
      <StepBadge number={stepNumber} done={done} locked={locked} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: FONT }}>{title}</div>
        {locked && lockedMessage && (
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>{lockedMessage}</div>
        )}
        {!collapsed && !locked && <div style={{ fontSize: 13, color: '#718096', fontFamily: FONT, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {collapsed && done && (
        <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>Done ✓</span>
      )}
    </div>
    {!collapsed && !locked && children}
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

/* ── Processing Progress Indicator (matches L1 pattern) ── */
const ProcessingProgress: React.FC<{
  steps: string[];
  currentStep: number;
  header: string;
  subtext: string;
}> = ({ steps, currentStep, header, subtext }) => {
  const completedSteps = Math.min(currentStep, steps.length);
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #E2E8F0', padding: '28px 32px',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4, fontFamily: FONT }}>
        {header}
      </div>
      <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 24, fontFamily: FONT }}>
        {subtext}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum <= completedSteps;
          const isActive = stepNum === completedSteps + 1 && completedSteps < steps.length;
          const isPending = !isComplete && !isActive;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'opacity 0.2s', opacity: isPending ? 0.5 : 1,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isComplete ? LEVEL_ACCENT : '#F7FAFC',
                border: isActive ? `2px solid ${LEVEL_ACCENT}` : isComplete ? 'none' : '2px solid #E2E8F0',
                position: 'relative',
              }}>
                {isComplete && <Check size={10} color={LEVEL_ACCENT_DARK} strokeWidth={3} />}
                {isActive && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid transparent', borderTopColor: LEVEL_ACCENT_DARK,
                    animation: 'ppSpin 0.7s linear infinite',
                    position: 'absolute', top: -2, left: -2,
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isPending ? '#A0AEC0' : '#2D3748', fontFamily: FONT,
                transition: 'color 0.2s',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: '#EDF2F7', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: LEVEL_ACCENT,
          width: `${progressPercent}%`, transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'right' as const, marginTop: 6, fontFamily: FONT }}>
        {completedSteps} of {steps.length}
      </div>
    </div>
  );
};

/* ── Toggle Button (Cards / Markdown) ── */
const ToggleBtn: React.FC<{
  icon: React.ReactNode; label: string; active: boolean;
  onClick: () => void; highlight?: boolean;
}> = ({ icon, label, active, onClick, highlight }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
    border: 'none', cursor: 'pointer', borderRadius: 8,
    background: active ? (highlight ? '#2B6CB0' : '#1A202C') : 'transparent',
    color: active ? '#FFFFFF' : '#718096',
    transition: 'background 0.15s, color 0.15s',
  }}>
    {icon}{label}
  </button>
);

/* ── Info Tooltip ── */
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#F7FAFC', border: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', padding: 0,
        }}
      >
        <Info size={12} color="#A0AEC0" />
      </button>
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)', marginBottom: 6,
          background: '#1A202C', color: '#E2E8F0',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 11, lineHeight: 1.5, width: 240,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 20, fontFamily: FONT,
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

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
  const [selectedPath, setSelectedPath] = useState<'a' | null>(null);

  /* ── Step 2 State (canvas) ── */
  const [generateResult, setGenerateResult] = useState<WorkflowGenerateResult | null>(null);
  const [feedbackResolutions, setFeedbackResolutions] = useState<Record<string, {
    resolution: 'applied' | 'disputed' | 'dismissed';
    disputeText?: string;
    disputeOutcome?: 'concede' | 'maintain';
    disputeResponse?: string;
  }>>({});
  const [nodesAnimated, setNodesAnimated] = useState(0);
  const [connectionsAnimated, setConnectionsAnimated] = useState(0);

  /* ── Path A review/approval state ── */
  const [pathAApproved, setPathAApproved] = useState(false);
  const [pathAFeedbackText, setPathAFeedbackText] = useState('');
  const [pathAFeedbackResult, setPathAFeedbackResult] = useState<WorkflowFeedbackResult | null>(null);
  const [pathAShowingRevised, setPathAShowingRevised] = useState(false);

  /* ── Step 2.5 State (platform selector) ── */
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformStepDone, setPlatformStepDone] = useState(false);

  /* ── Step 3 State (build guide export) ── */
  const [buildGuideMarkdown, setBuildGuideMarkdown] = useState<string | null>(null);
  const [buildGuideIntermediate, setBuildGuideIntermediate] = useState<WorkflowIntermediate | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [savedToArtefacts, setSavedToArtefacts] = useState(false);

  /* ── Step 4 output state (matches L1 pattern) ── */
  const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRefineLoading, setIsRefineLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);
  const [refineExpanded, setRefineExpanded] = useState(false);

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
  const step2Done = pathAApproved;

  const displayedNodes: WorkflowNode[] = (() => {
    if (selectedPath === 'a') {
      if (pathAShowingRevised && pathAFeedbackResult) return pathAFeedbackResult.suggested_workflow;
      return generateResult?.nodes || [];
    }
    return [];
  })();

  const positions = calculatePositions(displayedNodes.length, nodesPerRow, nw, nh, gx, gy);
  const canvasWidth = nodesPerRow * (nw + gx) - gx;
  const totalRows = displayedNodes.length > 0 ? positions[positions.length - 1].row + 1 : 0;
  const canvasHeight = totalRows > 0 ? totalRows * (nh + gy) - gy : 200;

  const workflowName = generateResult ? generateResult.workflow_name : 'Custom Workflow';
  const workflowDescription = generateResult ? generateResult.workflow_description : taskDescription;
  const finalNodes = pathAFeedbackResult ? pathAFeedbackResult.suggested_workflow : generateResult?.nodes || [];

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

  /* ── Loading step progression (matches L1 pattern) ── */
  useEffect(() => {
    if (!exportLoading) {
      if (loadingStep > 0) {
        const steps = isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS;
        setLoadingStep(steps.length);
        const timer = setTimeout(() => setLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return; // -1 = open-ended buffer, don't auto-advance
      cumulative += delay;
      timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [exportLoading]);

  /* ── Staggered block animation for Step 4 output ── */
  useEffect(() => {
    if (!buildGuideMarkdown) return;
    setVisibleBlocks(0);
    const totalSections = BUILD_GUIDE_SECTIONS.length + 2; // summary + sections + refinement
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalSections; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [buildGuideMarkdown]);

  /* ── Build Guide generation (triggered after platform selection) ── */
  const handleGenerateBuildGuide = useCallback(async () => {
    if (!selectedPlatform || buildGuideMarkdown) return;

    // Assemble rich context from all prior steps
    const activeFeedbackResult = pathAFeedbackResult;
    const activeFeedbackChanges = activeFeedbackResult?.changes || [];

    const richContext: NonNullable<import('../../../types').WorkflowIntermediate['context']> = {
      originalTaskDescription: taskDescription,
      toolsAndSystems: toolsAndSystems || 'Not specified',
      pathUsed: 'a' as const,
      // Feedback items with resolution outcomes
      feedbackItems: activeFeedbackChanges.map(c => {
        const itemId = c.node_id || `feedback-${activeFeedbackChanges.indexOf(c)}`;
        const res = feedbackResolutions[itemId];
        return {
          nodeName: c.node_name,
          type: c.type,
          rationale: c.rationale,
          resolution: res?.resolution || 'applied',
          ...(res?.disputeText ? { disputeText: res.disputeText } : {}),
          ...(res?.disputeOutcome ? { disputeOutcome: res.disputeOutcome } : {}),
          ...(res?.disputeResponse ? { disputeResponse: res.disputeResponse } : {}),
        };
      }),
      // Path A refinement text (if user wrote free-text feedback)
      ...(pathAFeedbackText ? { pathARefinementText: pathAFeedbackText } : {}),
      // Overall assessment from the feedback agent
      ...(activeFeedbackResult?.overall_assessment ? { overallAssessment: activeFeedbackResult.overall_assessment } : {}),
      // Canvas layout with connections
      canvasLayout: finalNodes.map((node, idx) => {
        const nextNode = idx < finalNodes.length - 1 ? finalNodes[idx + 1] : null;
        return {
          nodeName: node.name,
          layer: node.layer,
          position: idx + 1,
          connections: nextNode ? [nextNode.name] : [],
        };
      }),
    };

    const intermediate = buildIntermediate(workflowName, workflowDescription, finalNodes, richContext);
    setBuildGuideIntermediate(intermediate);
    setExportLoading(true);
    setPlatformStepDone(true);

    try {
      const response = await fetch('/api/generate-build-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intermediate, platform: selectedPlatform }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      setBuildGuideMarkdown(data.markdown || '');
      setExportLoading(false);
    } catch (err) {
      console.error('[build-guide] Generation error:', err);
      setExportLoading(false);
    }
  }, [selectedPlatform, buildGuideMarkdown, workflowName, workflowDescription, finalNodes, taskDescription, toolsAndSystems, feedbackResolutions, pathAFeedbackText, pathAFeedbackResult]);

  /* ── beforeunload warning for unsaved workflows ── */
  useEffect(() => {
    const hasUnsavedWork = (step2Done || buildGuideIntermediate) && !savedToArtefacts;
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step2Done, buildGuideIntermediate, savedToArtefacts]);

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

  const handleStartOver = () => {
    setTaskDescription('');
    setToolsAndSystems('');
    setSelectedPath(null);
    setGenerateResult(null);
    setNodesAnimated(0);
    setConnectionsAnimated(0);
    setSelectedPlatform(null);
    setPlatformStepDone(false);
    setBuildGuideMarkdown(null);
    setBuildGuideIntermediate(null);
    setFeedbackResolutions({});
    setExportLoading(false);
    setSavedToArtefacts(false);
    setPathAApproved(false);
    setPathAFeedbackText('');
    setPathAFeedbackResult(null);
    setPathAShowingRevised(false);
    setViewMode('cards');
    setVisibleBlocks(0);
    setLoadingStep(0);
    setIsRefineLoading(false);
    setCopied(false);
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefinementCount(0);
    setRefineExpanded(false);
    clearError();
    localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Step-back navigation ── */
  const handleGoBackToStep1 = () => {
    setSelectedPath(null);
    setPathAApproved(false);
    setPlatformStepDone(false);
    setSelectedPlatform(null);
    setBuildGuideMarkdown(null);
    setBuildGuideIntermediate(null);
    setSavedToArtefacts(false);
    setExportLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToStep2 = () => {
    setPathAApproved(false);
    setPlatformStepDone(false);
    setSelectedPlatform(null);
    setBuildGuideMarkdown(null);
    setBuildGuideIntermediate(null);
    setSavedToArtefacts(false);
    setExportLoading(false);
  };

  const handleGoBackToStep3 = () => {
    // Reopen step 3 — keep platform pre-selected, clear build guide
    setBuildGuideMarkdown(null);
    setBuildGuideIntermediate(null);
    setPlatformStepDone(false);
    setSavedToArtefacts(false);
    setExportLoading(false);
    setViewMode('cards');
    setVisibleBlocks(0);
    setLoadingStep(0);
    setCopied(false);
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefinementCount(0);
    setRefineExpanded(false);
  };

  const handleSaveToArtefacts = async () => {
    if (!user || savedToArtefacts || !buildGuideIntermediate || !buildGuideMarkdown) return;
    const artefactId = `wf_${Date.now()}`;
    // Store in localStorage for share link access (TODO: Supabase)
    localStorage.setItem(`build_guide_${artefactId}`, JSON.stringify({
      intermediate: buildGuideIntermediate,
      buildGuide: buildGuideMarkdown,
      platform: selectedPlatform,
      generatedAt: new Date().toISOString(),
    }));
    const result = await dbSavePrompt(user.id, {
      level: 3,
      title: `Workflow: ${workflowName}`,
      content: JSON.stringify({
        intermediate: buildGuideIntermediate,
        buildGuide: buildGuideMarkdown,
        platform: selectedPlatform,
      }, null, 2),
      source_tool: 'workflow-canvas',
    });
    if (result) {
      setSavedToArtefacts(true);
      toast('Saved to Library');
    } else {
      toast('Failed to save — please try again');
    }
  };


  /* ── Copy / Download handlers (matches L1 pattern) ── */
  const handleCopyBuildGuide = useCallback(() => {
    if (!buildGuideMarkdown) return;
    navigator.clipboard.writeText(buildGuideMarkdown);
    setCopied(true);
    toast('Copied Build Guide');
    setTimeout(() => setCopied(false), 2000);
  }, [buildGuideMarkdown, toast]);

  const handleDownloadBuildGuide = useCallback(() => {
    if (!buildGuideMarkdown) return;
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([buildGuideMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-guide-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded as .md');
  }, [buildGuideMarkdown, toast]);

  /* ── Refinement handler (matches L1 pattern) ── */
  const hasRefinementInput = Object.values(refinementAnswers).some((v: string) => v.trim()) || additionalContext.trim();

  const handleRefine = useCallback(async () => {
    if (!hasRefinementInput || !buildGuideMarkdown || !buildGuideIntermediate || !selectedPlatform) return;

    // Build refinement message
    const answeredQuestions = (buildGuideRefinementQuestions || [])
      .map((q: string, i: number) => {
        const answer = refinementAnswers[i]?.trim();
        return answer ? `Q: ${q}\nA: ${answer}` : null;
      })
      .filter(Boolean).join('\n\n');

    const refinementContext = [
      `[REFINEMENT]\n\nOriginal workflow: ${workflowName}`,
      `Platform: ${selectedPlatform}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
      additionalContext.trim() ? `\nAdditional context: ${additionalContext.trim()}` : '',
    ].filter(Boolean).join('\n');

    setIsRefineLoading(true);
    setExportLoading(true);

    try {
      const intermediate = buildGuideIntermediate;
      const enrichedIntermediate = {
        ...intermediate,
        context: {
          ...intermediate.context,
          refinementContext,
        },
      };

      const response = await fetch('/api/generate-build-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intermediate: enrichedIntermediate, platform: selectedPlatform }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      setBuildGuideMarkdown(data.markdown || '');
      setRefinementCount(prev => prev + 1);
      setRefinementAnswers({});
      setAdditionalContext('');
    } catch (err) {
      console.error('[build-guide] Refinement error:', err);
      toast('Refinement failed — please try again');
    } finally {
      setExportLoading(false);
      setIsRefineLoading(false);
    }
  }, [hasRefinementInput, buildGuideMarkdown, buildGuideIntermediate, selectedPlatform, refinementAnswers, additionalContext, workflowName, toast]);

  // Derive refinement questions from build guide markdown
  const buildGuideRefinementQuestions = buildGuideMarkdown ? [
    `Are there specific error scenarios for this ${selectedPlatform || 'platform'} workflow you want the guide to address?`,
    'Should any steps include alternative approaches or fallback options?',
    'Are there team-specific naming conventions or folder structures to follow?',
    `What level of detail do you need for the ${selectedPlatform || 'platform'} configuration — beginner-friendly or advanced?`,
    'Are there any compliance or security requirements to document?',
  ] : [];

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
        @keyframes ppSlideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
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
          { number: 2, label: 'Build & review your canvas', detail: 'Review, refine, and approve your workflow', done: step2Done },
          { number: 3, label: 'Choose the platform', detail: 'Select your automation tool', done: platformStepDone },
          { number: 4, label: 'Download your Build Guide', detail: 'Get your implementation document', done: !!buildGuideMarkdown },
        ]}
        outcome="A downloadable Build Guide — a complete, platform-specific implementation document ready to build from."
      />

      {/* ─── STEP 1: Define your workflow ─── */}
      <StepCard
        stepNumber={1}
        title="Define your workflow"
        subtitle="Describe the process you want to automate, the tools involved, and how you'd like to build it."
        done={step1Done}
        collapsed={step1Done}
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

        {/* Design workflow button */}
        {!selectedPath && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
            <button
              onClick={handlePathA}
              disabled={!taskDescription.trim() || isLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: taskDescription.trim() ? LEVEL_ACCENT : '#CBD5E0',
                color: '#FFFFFF', border: 'none',
                cursor: (!taskDescription.trim() || isLoading) ? 'not-allowed' : 'pointer',
                fontFamily: FONT, transition: 'background-color 0.15s',
              }}
            >
              <Sparkles size={16} /> Design Workflow For Me
            </button>
          </div>
        )}
      </StepCard>

      <StepConnector />

      {/* ─── STEP 2: Build your canvas ─── */}
      <div ref={canvasRef}>
        <StepCard
          stepNumber={2}
          title="Build & review your canvas"
          subtitle={pathAApproved ? 'Workflow approved — proceed to export.' : generateResult ? 'Review the generated workflow. Approve it or give feedback to refine.' : selectedPath ? 'AI is designing your workflow based on your description.' : 'Describe your workflow above to get started.'}
          done={step2Done}
          collapsed={step2Done}
          locked={!selectedPath}
          lockedMessage="Complete Step 1 to start building your canvas"
        >
          {selectedPath && (
            <>
              {/* Back to Step 1 */}
              {!step2Done && (
                <button
                  onClick={handleGoBackToStep1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', padding: '0 0 12px',
                    fontSize: 13, fontWeight: 500, color: '#718096',
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = LEVEL_ACCENT; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#718096'; }}
                >
                  <ArrowLeft size={14} /> Back to Step 1
                </button>
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

                {/* Rendered nodes */}
                {displayedNodes.length > 0 && !isLoading && (
                  <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight, margin: selectedPath === 'a' ? '0 auto' : undefined }}>
                    <ConnectionLines positions={positions} nw={nw} nh={nh} animatedCount={connectionsAnimated} />
                    {displayedNodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <CanvasNode
                          node={node} position={positions[i]} nw={nw} nh={nh}
                          animated={i < nodesAnimated + 1} index={i}
                        />
                      </React.Fragment>
                    ))}
                  </div>
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

      {/* ─── STEP 3: Choose the platform ─── */}
      <StepCard
        stepNumber={3}
        title="Choose the platform"
        subtitle="Select the automation tool you'll use to build this workflow."
        done={platformStepDone}
        collapsed={platformStepDone}
        locked={!step2Done}
        lockedMessage="Complete Step 2 to choose your platform"
      >
        {!platformStepDone ? (
          <div style={{ animation: 'ppFadeIn 0.4s ease-out' }}>
            <button
              onClick={handleGoBackToStep2}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', padding: '0 0 12px',
                fontSize: 13, fontWeight: 500, color: '#718096',
                cursor: 'pointer', fontFamily: FONT,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = LEVEL_ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#718096'; }}
            >
              <ArrowLeft size={14} /> Back to Step 2
            </button>
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onSelectPlatform={setSelectedPlatform}
              onGenerate={handleGenerateBuildGuide}
              loading={exportLoading}

            />
          </div>
        ) : null}
      </StepCard>

      <StepConnector />

      {/* ─── STEP 4: Download Build Guide ─── */}
      <div ref={step3Ref}>
        <StepCard
          stepNumber={4}
          title="Download your Build Guide"
          subtitle="Your complete, platform-specific implementation document."
          done={!!buildGuideMarkdown}
          collapsed={false}
          locked={!buildGuideMarkdown && !exportLoading}
          lockedMessage="Complete Step 3 to generate your Build Guide"
        >
          {exportLoading && !buildGuideMarkdown ? (
            <ProcessingProgress
              steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
              currentStep={loadingStep}
              header={isRefineLoading ? 'Refining your Build Guide…' : 'Generating your Build Guide…'}
              subtext="This usually takes 20–30 seconds"
            />
          ) : buildGuideMarkdown && buildGuideIntermediate ? (
            /* ── Generated output (matches L1 pattern) ── */
            <div>
              {/* Next Step Banner (§4.8) */}
              <NextStepBanner
                accentColor={LEVEL_ACCENT}
                accentDark={LEVEL_ACCENT_DARK}
                text="Download your Build Guide and follow the steps in your chosen platform. Use the test checklist to verify each step."
              />

              {/* Top row: View toggle (left) + Copy (right) */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'inline-flex', background: '#F7FAFC',
                    borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden',
                  }}>
                    <ToggleBtn icon={<Eye size={13} />} label="Cards" active={viewMode === 'cards'} onClick={() => setViewMode('cards')} />
                    <ToggleBtn icon={<Code size={13} />} label="Markdown" active={viewMode === 'markdown'} onClick={() => setViewMode('markdown')} highlight />
                  </div>
                  <InfoTooltip text="Markdown view shows the raw Build Guide ready to paste into any tool or docs system. Cards view provides an interactive breakdown of each section." />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    label={copied ? 'Copied!' : 'Copy Build Guide'}
                    onClick={handleCopyBuildGuide}
                    primary
                  />
                  <ActionBtn
                    icon={<Download size={13} />}
                    label="Download (.md)"
                    onClick={handleDownloadBuildGuide}
                  />
                  <ActionBtn
                    icon={<Library size={13} />}
                    label={savedToArtefacts ? 'Saved!' : 'Save to Library'}
                    onClick={handleSaveToArtefacts}
                    accent
                    disabled={savedToArtefacts}
                  />
                </div>
              </div>

              {viewMode === 'markdown' ? (
                /* ── Markdown view ── */
                <div style={{
                  background: '#1A202C', borderRadius: 12, padding: '22px 24px',
                  fontFamily: MONO, fontSize: 13, lineHeight: 1.8, color: '#E2E8F0',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const,
                  opacity: visibleBlocks >= 1 ? 1 : 0,
                  transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.3s, transform 0.3s',
                  maxHeight: 600, overflow: 'auto',
                }}>
                  {buildGuideMarkdown}
                </div>
              ) : (
                /* ── Cards view ── */
                <div style={{
                  opacity: visibleBlocks >= 1 ? 1 : 0,
                  transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.3s, transform 0.3s',
                }}>
                  <ExportSummaryCard
                    workflowName={workflowName}
                    platform={selectedPlatform || 'Not sure yet'}
                    overview={extractOverview(buildGuideMarkdown)}
                    stepCount={extractStepCount(buildGuideMarkdown)}
                    complexity={buildGuideIntermediate.complexity}
                    estimatedBuildTime={extractBuildTime(buildGuideMarkdown)}
                    credentials={extractCredentials(buildGuideMarkdown)}
                    steps={extractSteps(buildGuideMarkdown)}
                    testChecklist={extractTestChecklist(buildGuideMarkdown)}
                    fullMarkdown={buildGuideMarkdown}
                  />
                </div>
              )}

              {/* ── Output Actions Panel (download .md, .doc, save to library) ── */}
              <div style={{
                marginTop: 20,
                opacity: visibleBlocks >= 2 ? 1 : 0,
                transform: visibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <OutputActionsPanel
                  workflowName={workflowName}
                  fullMarkdown={buildGuideMarkdown}
                  onSaveToArtefacts={handleSaveToArtefacts}
                  isSaved={savedToArtefacts}
                />
              </div>

              {/* ── Caveat + Refinement (collapsed card) ── */}
              {visibleBlocks >= 3 && buildGuideRefinementQuestions.length > 0 && (
                <div style={{
                  background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0',
                  padding: '20px 24px', marginTop: 20,
                  opacity: visibleBlocks >= 3 ? 1 : 0,
                  transform: visibleBlocks >= 3 ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.3s, transform 0.3s',
                }}>
                  {/* Caveat text */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: refineExpanded ? 20 : 0 }}>
                    <Info size={16} color="#A0AEC0" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                        This Build Guide is a strong starting point, but every environment is different.
                        Test each step in your actual {selectedPlatform || 'platform'} workspace, and adjust
                        field mappings or credentials as needed.
                      </div>

                      {/* Expand CTA */}
                      {!refineExpanded && (
                        <button
                          onClick={() => setRefineExpanded(true)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none', padding: '8px 0 0',
                            fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                            cursor: 'pointer', fontFamily: FONT,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = LEVEL_ACCENT; }}
                          onMouseLeave={e => { e.currentTarget.style.color = LEVEL_ACCENT_DARK; }}
                        >
                          Would you like to refine this Build Guide further?
                          <ChevronDown size={14} />
                          {refinementCount > 0 && (
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                              borderRadius: 20, padding: '2px 10px', fontFamily: FONT,
                              marginLeft: 4,
                            }}>
                              Refinement #{refinementCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded refinement questions */}
                  {refineExpanded && (
                    <div style={{ animation: 'ppSlideDown 0.3s ease-out' }}>
                      <div style={{
                        borderTop: '1px solid #E2E8F0', paddingTop: 16,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{
                            fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                            textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: FONT,
                          }}>
                            Refine Your Build Guide
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {refinementCount > 0 && (
                              <div style={{
                                fontSize: 11, fontWeight: 600,
                                background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                                borderRadius: 20, padding: '2px 10px', fontFamily: FONT,
                              }}>
                                Refinement #{refinementCount}
                              </div>
                            )}
                            <button
                              onClick={() => setRefineExpanded(false)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                                color: '#A0AEC0', display: 'flex', alignItems: 'center',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#4A5568'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#A0AEC0'; }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                          Answer any of these to add context and get a more targeted Build Guide. You don't need to answer all of them — even one helps.
                        </p>

                        {buildGuideRefinementQuestions.map((question: string, i: number) => (
                          <div key={i} style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                              {question}
                            </label>
                            <input
                              type="text"
                              value={refinementAnswers[i] || ''}
                              onChange={e => setRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                              placeholder="Your answer…"
                              style={{
                                width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
                                padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C',
                                outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                                background: '#FFFFFF',
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                            />
                          </div>
                        ))}

                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                            Anything else to add?
                          </label>
                          <textarea
                            value={additionalContext}
                            onChange={e => setAdditionalContext(e.target.value)}
                            placeholder="Any additional requirements, constraints, or context you'd like to include…"
                            style={{
                              width: '100%', minHeight: 60, resize: 'none',
                              border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                              fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none',
                              boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                              background: '#FFFFFF', lineHeight: 1.5,
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                            onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                          />
                        </div>

                        <ActionBtn
                          icon={exportLoading ? (
                            <div style={{
                              width: 13, height: 13, border: '2px solid #FFFFFF40',
                              borderTopColor: '#FFFFFF', borderRadius: '50%',
                              animation: 'ppSpin 0.6s linear infinite',
                            }} />
                          ) : (
                            <ArrowRight size={13} />
                          )}
                          label={exportLoading ? 'Refining…' : 'Refine Build Guide'}
                          onClick={handleRefine}
                          primary
                          disabled={!hasRefinementInput || exportLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom navigation row (per PRD §4.2) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                <ActionBtn icon={<ArrowLeft size={14} />} label="Back to Step 3" onClick={handleGoBackToStep3} />
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
