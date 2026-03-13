import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, ArrowLeft, Copy, Check, RotateCcw, Code,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles,
  X, Eye, Download, FileText, BookOpen,
  LayoutDashboard, Users, Layers, BarChart3, Palette, Code2,
  Database, SlidersHorizontal, ShieldCheck, CheckSquare,
} from 'lucide-react';
import {
  EXAMPLE_BRIEFS,
  VISUAL_STYLE_OPTIONS, PRD_SECTIONS,
  VIBE_CODING_PLATFORMS, BUILD_GUIDE_LOADING_STEPS, BUILD_GUIDE_STEP_DELAYS,
} from '../../../data/dashboard-designer-content';
import {
  useDashboardDesignApi, MAX_PRD_GENERATIONS,
} from '../../../hooks/useDashboardDesignApi';
import type { DashboardBrief, NewPRDResult } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import NextStepBanner from './NextStepBanner';

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#F5B8A0';
const LEVEL_ACCENT_DARK = '#8C3A1A';

/* ─── ProcessingProgress step labels ─── */
const PRD_LOADING_STEPS = [
  'Analysing your brief…',
  'Defining tech stack and architecture…',
  'Mapping features and data models…',
  'Writing API routes and UI specs…',
  'Generating design tokens…',
  'Generating acceptance criteria…',
  'Building implementation phases…',
  'Finalising your PRD…',
];
const PRD_REFINE_LOADING_STEPS = [
  'Processing your refinement feedback…',
  'Re-evaluating architecture decisions…',
  'Updating features and data models…',
  'Refining API routes and UI specs…',
  'Revising acceptance criteria…',
  'Rebuilding implementation phases…',
  'Finalising refined PRD…',
];
const PRD_STEP_DELAYS = [800, 1500, 3500, 4000, 3500, 4000, 4000, -1];

const INITIAL_BRIEF: DashboardBrief = {
  q1_purpose: '', q2_audience: '', q3_type: '',
  q4_metrics: '', q5_dataSources: [], q5_otherSource: '',
  q6_frequency: '', q7_visualStyle: '', q8_colorScheme: '', q8_customColor: '',
  q9_inspirationUrls: [], q9_uploadedImages: [],
};

/* ─── PRD Section Icons ─── */
const PRD_SECTION_ICONS: Record<string, React.ElementType> = {
  project_overview: LayoutDashboard,
  tech_stack: Code2,
  file_structure: Layers,
  data_models: Database,
  feature_requirements: CheckSquare,
  api_routes: SlidersHorizontal,
  ui_specifications: Palette,
  auth_permissions: ShieldCheck,
  scope_boundaries: Users,
  acceptance_criteria: BarChart3,
  design_tokens: Palette,
  implementation_plan: ArrowRight,
};

/* ─── PRD Section Color Map (neutral card bg, Level 4 peach gradient on left border) ─── */
const PRD_SECTION_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  project_overview:    { bg: '#FAFBFC', border: '#F5DDD0', label: 'Overview' },
  tech_stack:          { bg: '#FAFBFC', border: '#F2CEBC', label: 'Tech Stack' },
  file_structure:      { bg: '#FAFBFC', border: '#EEC0A8', label: 'File Structure' },
  data_models:         { bg: '#FAFBFC', border: '#EBB294', label: 'Data Models' },
  feature_requirements:{ bg: '#FAFBFC', border: '#E7A480', label: 'Features' },
  api_routes:          { bg: '#FAFBFC', border: '#E3966C', label: 'API Routes' },
  ui_specifications:   { bg: '#FAFBFC', border: '#DF8858', label: 'UI Specs' },
  auth_permissions:    { bg: '#FAFBFC', border: '#D87A44', label: 'Auth' },
  scope_boundaries:    { bg: '#FAFBFC', border: '#CF6C34', label: 'Scope' },
  acceptance_criteria: { bg: '#FAFBFC', border: '#C55E26', label: 'Acceptance' },
  design_tokens:       { bg: '#FAFBFC', border: '#B85218', label: 'Design Tokens' },
  implementation_plan: { bg: '#FAFBFC', border: '#A84810', label: 'Impl. Plan' },
};

/* ─── Score color helper (matches Agent Builder) ─── */
function getScoreColor(score: number): string {
  if (score >= 80) return '#38B2AC';
  if (score >= 50) return '#C4A934';
  return '#E57A5A';
}

/* ─── Criteria labels for readiness display ─── */
const CRITERIA_LABELS: Record<string, string> = {
  feasibility: 'Feasibility',
  scope_clarity: 'Scope Clarity',
  user_value: 'User Value',
  technical_complexity: 'Tech Complexity',
  data_requirements: 'Data Reqs',
};

/* ─── Fallback PRD ─── */
function generateFallbackPRD(brief: DashboardBrief): NewPRDResult {
  const features = brief.q4_metrics || 'key features';
  const dataSources = brief.q5_dataSources.join(', ') || 'To be determined';
  return {
    prd_content: `PRD: ${brief.q1_purpose.slice(0, 60)}`,
    sections: {
      project_overview: `This app provides ${brief.q2_audience || 'users'} with ${features}. Its primary purpose is: ${brief.q1_purpose}. Type: ${brief.q3_type || 'Web application'}.`,
      tech_stack: 'React 18 + TypeScript strict + Vite. Supabase for auth and database. Vercel for hosting. Tailwind CSS or inline styles.',
      file_structure: 'src/pages/ for routes, src/components/ for reusable UI, src/hooks/ for custom hooks, src/lib/ for utilities, src/types/ for TypeScript interfaces.',
      data_models: `Core entities to be defined based on: ${features}. Each entity should have id, timestamps, and relationships.`,
      feature_requirements: `Key features: ${features}. Each feature should have clear "When X, do Y" behaviour with error handling for edge cases.`,
      api_routes: `Data sources: ${dataSources}. API routes or data layer to be defined based on features.`,
      ui_specifications: `Style: ${VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'Clean & Minimal'}. Typography: DM Sans. Cards: white bg, 16px radius, 1px #E2E8F0 border.`,
      auth_permissions: 'Authentication approach to be determined based on project scope. Single-user apps may use localStorage.',
      scope_boundaries: 'Phase 1 focuses on core functionality. Mobile native app, payment processing, and advanced analytics are out of scope.',
      acceptance_criteria: '1. Core features work as described. 2. UI matches the approved mockup. 3. Page loads in <2s. 4. Responsive on mobile. 5. npm run build succeeds.',
      design_tokens: `:root {\n  --color-primary: #38B2AC;\n  --color-secondary: #5A67D8;\n  --color-accent: #D47B5A;\n  --color-background: #F7FAFC;\n  --color-card: #FFFFFF;\n  --color-text: #1A202C;\n  --color-text-muted: #718096;\n  --font-family: 'DM Sans', sans-serif;\n  --radius-card: 16px;\n  --radius-button: 24px;\n  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);\n}`,
      implementation_plan: 'Phase 1: Project setup + core data model. Phase 2: Main CRUD features. Phase 3: Search, filter, polish. Phase 4: Responsive and deploy.',
    },
    readiness: {
      overall_score: 65,
      verdict: 'Good starting point — add more detail for best results',
      rationale: 'The brief covers the core purpose but could benefit from more specific feature descriptions, data model details, and acceptance criteria to produce a stronger PRD.',
      criteria: {
        feasibility: { label: 'Feasibility', score: 70, assessment: 'Scope appears achievable with standard web technologies' },
        scope_clarity: { label: 'Scope Clarity', score: 55, assessment: 'Some features need more specific definitions' },
        user_value: { label: 'User Value', score: 75, assessment: 'Clear target audience and purpose identified' },
        technical_complexity: { label: 'Technical Complexity', score: 65, assessment: 'Moderate complexity, well-suited for AI coding tools' },
        data_requirements: { label: 'Data Requirements', score: 60, assessment: 'Data sources and models need more definition' },
      },
    },
    refinement_questions: [
      'Are there specific features or screens that need more detail in the PRD?',
      'What third-party integrations or APIs should be included?',
      'Are there specific performance requirements or constraints?',
      'What authentication or permission model does the app need?',
      'Any design system preferences (colors, typography, component library)?',
    ],
    screen_map: 'Screen map not available for fallback PRD.',
    data_model: 'Data model not available for fallback PRD.',
  };
}

/* ─── Build cohesive PRD deliverable (Markdown) ─── */
function buildFullPRD(result: NewPRDResult): string {
  const sectionBlocks = Object.entries(result.sections).map(([key, val]) => {
    const def = PRD_SECTIONS.find(s => s.key === key);
    return `## ${def?.title || key}\n\n${val}`;
  });
  return [`# ${result.prd_content}`, '', ...sectionBlocks].join('\n\n---\n\n');
}

/* ─── Copyable code block for build guide steps ─── */
const BuildGuideCodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: copied ? '#38B2AC' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '4px 8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.15s ease',
        }}
        title="Copy code"
      >
        {copied ? <Check size={13} color="#fff" /> : <Copy size={13} color="#A0AEC0" />}
        <span style={{ fontSize: 11, color: copied ? '#fff' : '#A0AEC0', fontFamily: FONT }}>
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
      <pre style={{
        background: '#1A202C', color: '#E2E8F0', padding: '14px 18px',
        borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Render inline markdown: bold, italic, code, links ─── */
function renderInlineParts(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: '#1A202C' }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} style={{ fontStyle: 'italic' }}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={key++} style={{
          background: '#EDF2F7', padding: '1px 6px', borderRadius: 4,
          fontSize: '0.92em', fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          color: '#8C3A1A',
        }}>{match[4]}</code>
      );
    } else if (match[5] && match[6]) {
      parts.push(
        <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer" style={{
          color: '#2B6CB0', textDecoration: 'underline', fontWeight: 600,
        }}>{match[5]}</a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }
  return parts;
}

/* ─── Rich markdown renderer for build guide steps ─── */
/* Supports: **bold**, *italic*, `code`, [links](url), ```code blocks```, and unfenced JSON/code blocks */
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks (``` delimited)
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(<BuildGuideCodeBlock key={key++} code={codeLines.join('\n')} />);
      continue;
    }

    // Heuristic: unfenced JSON blocks (line starts with { and a matching } exists)
    if (line.trim() === '{') {
      const codeLines: string[] = [line];
      let depth = 1;
      let j = i + 1;
      while (j < lines.length && depth > 0) {
        codeLines.push(lines[j]);
        const trimmed = lines[j].trim();
        for (const ch of trimmed) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        j++;
      }
      if (depth === 0) {
        elements.push(<BuildGuideCodeBlock key={key++} code={codeLines.join('\n')} />);
        i = j;
        continue;
      }
    }

    // Empty lines
    if (line.trim() === '' || line.trim() === '---') { i++; continue; }

    // Regular paragraph with inline formatting
    elements.push(
      <p key={key++} style={{ margin: '4px 0', lineHeight: 1.7 }}>
        {renderInlineParts(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

/* ────────────────────────────────────────────────────────────
   Shared UI Primitives
   ──────────────────────────────────────────────────────────── */

const StepBadge: React.FC<{ num: number; done: boolean; active?: boolean; locked?: boolean }> = ({ num, done, active, locked }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 13, fontFamily: FONT, flexShrink: 0,
    ...(done
      ? { background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK }
      : locked
        ? { background: '#EDF2F7', border: '2px solid #E2E8F0', color: '#CBD5E0' }
        : active
          ? { background: '#FFFFFF', border: `2px solid ${LEVEL_ACCENT}`, color: LEVEL_ACCENT_DARK, animation: 'ppPulse 2s ease-in-out infinite' }
          : { background: '#F7FAFC', border: '2px solid #E2E8F0', color: '#718096' }),
  }}>
    {done ? <Check size={15} /> : num}
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
    }}>
      <ArrowDown size={14} color={LEVEL_ACCENT} />
    </div>
  </div>
);

const StepCard: React.FC<{
  stepNumber: number; title: string; subtitle: string;
  done: boolean; collapsed: boolean; locked?: boolean; lockedMessage?: string; children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF', borderRadius: 16,
    border: done ? `1px solid ${LEVEL_ACCENT}88` : '1px solid #E2E8F0',
    padding: collapsed || locked ? '16px 24px' : '24px 28px',
    transition: 'border-color 0.3s',
    opacity: locked ? 0.7 : 1,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StepBadge num={stepNumber} done={done} locked={locked} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: FONT }}>{title}</span>
        {!collapsed && !locked && (
          <span style={{ fontSize: 13, color: '#718096', fontFamily: FONT, marginLeft: 10 }}>{subtitle}</span>
        )}
      </div>
      {collapsed && done && (
        <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>Done ✓</span>
      )}
    </div>
    {locked && lockedMessage && (
      <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT, marginTop: 8 }}>
        {lockedMessage}
      </div>
    )}
    {!collapsed && !locked && <div style={{ marginTop: 20 }}>{children}</div>}
  </div>
);

const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean; active?: boolean }[];
  outcome: string;
}> = ({ steps, outcome }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
    padding: '20px 24px', marginBottom: 20,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, fontFamily: FONT }}>
      HOW IT WORKS
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.number}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', flex: 1 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, fontFamily: FONT, flexShrink: 0,
              ...(s.done
                ? { background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK }
                : s.active
                  ? { background: '#FFFFFF', border: `2px solid ${LEVEL_ACCENT}`, color: LEVEL_ACCENT_DARK, animation: 'ppPulse 2s ease-in-out infinite' }
                  : { background: '#F7FAFC', border: '2px solid #E2E8F0', color: '#718096' }),
            }}>
              {s.done ? <Check size={12} /> : s.number}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{s.label}</div>
              <div style={{ fontSize: 12, color: s.active ? '#4A5568' : '#718096', fontFamily: FONT }}>{s.detail}</div>
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
      borderRadius: 10, padding: '10px 16px',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#276749', fontFamily: FONT }}>OUTCOME </span>
      <span style={{ fontSize: 12, color: '#2F855A', fontFamily: FONT }}>{outcome}</span>
    </div>
  </div>
);

const ActionBtn: React.FC<{
  icon?: React.ReactNode; label: string; onClick: () => void;
  primary?: boolean; accent?: boolean; disabled?: boolean; iconAfter?: React.ReactNode;
}> = ({ icon, label, onClick, primary, accent, disabled, iconAfter }) => {
  const bg = primary ? '#38B2AC' : accent ? '#5A67D8' : '#FFFFFF';
  const fg = primary || accent ? '#FFFFFF' : '#4A5568';
  const border = primary || accent ? 'none' : '1px solid #E2E8F0';
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: bg, color: fg, border, borderRadius: 24,
        padding: '8px 16px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {icon} {label} {iconAfter}
    </button>
  );
};

/* ─── Build guide refinement questions (platform-aware) ─── */
function getBuildPlanRefinementQuestions(platformLabel: string): string[] {
  return [
    `Are there specific error scenarios for this ${platformLabel} workflow you want the guide to address?`,
    'Should any steps include alternative approaches or fallback options?',
    'Are there team-specific naming conventions or folder structures to follow?',
    `What level of detail do you need for the ${platformLabel} configuration — beginner-friendly or advanced?`,
    'Are there any compliance or security requirements to document?',
  ];
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */

const AppDashboardDesigner: React.FC = () => {
  const { user } = useAuth();

  // ─── Brief state ───
  const [brief, setBrief] = useState<DashboardBrief>({ ...INITIAL_BRIEF });
  const [dataSourcesText, setDataSourcesText] = useState('');

  // ─── PRD state ───
  const [prdResult, setPrdResult] = useState<NewPRDResult | null>(null);
  const [activeView, setActiveView] = useState<'cards' | 'markdown'>('cards');
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedPrdSections, setExpandedPrdSections] = useState<Set<string>>(new Set());
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Loading step progression ───
  const [prdLoadingStep, setPrdLoadingStep] = useState(0);
  const [isPrdRefineLoading, setIsPrdRefineLoading] = useState(false);

  // ─── PRD refinement ───
  const [prdRefinementAnswers, setPrdRefinementAnswers] = useState<Record<number, string>>({});
  const [prdAdditionalContext, setPrdAdditionalContext] = useState('');
  const [prdRefinementCount, setPrdRefinementCount] = useState(0);
  const [prdRefineExpanded, setPrdRefineExpanded] = useState(false);

  // ─── Platform (Step 3) ───
  const [prdApproved, setPrdApproved] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platformStepDone, setPlatformStepDone] = useState(false);

  // ─── Build Guide output (Step 4) ───
  const [buildGuide, setBuildGuide] = useState<{ steps: { title: string; instruction: string }[]; tips: string[]; limitations: string; prd_snippet: string } | null>(null);
  const [buildGuideLoadingStep, setBuildGuideLoadingStep] = useState(0);
  const [buildPlanViewMode, setBuildPlanViewMode] = useState<'cards' | 'markdown'>('cards');
  const [buildPlanVisibleBlocks, setBuildPlanVisibleBlocks] = useState(0);
  const [buildPlanCopied, setBuildPlanCopied] = useState(false);
  const [expandedBuildSteps, setExpandedBuildSteps] = useState<Set<number>>(new Set());
  const [buildPlanSaved, setBuildPlanSaved] = useState(false);
  const [buildPlanRefineExpanded, setBuildPlanRefineExpanded] = useState(false);
  const [buildPlanRefinementAnswers, setBuildPlanRefinementAnswers] = useState<Record<number, string>>({});
  const [buildPlanAdditionalContext, setBuildPlanAdditionalContext] = useState('');
  const [checkedTests, setCheckedTests] = useState<Set<number>>(new Set());

  // ─── Refs ───
  const prdRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const toolUsedRef = useRef(false);

  // ─── API ───
  const {
    generatePRD, generateBuildGuide,
    isPrdLoading, isBuildGuideLoading, error, clearError,
    prdGenerationCount, resetCounts,
  } = useDashboardDesignApi();

  // ─── Derived step state ───
  const step1Done = prdResult !== null || isPrdLoading;
  const step2Done = prdApproved;
  const step3Done = platformStepDone;
  const step4Done = buildGuide !== null;

  const canGenerate = brief.q1_purpose.trim().length > 0;

  // ─── Draft persistence ───
  useEffect(() => {
    const draft = localStorage.getItem('oxygy_dashboard-designer_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.brief) setBrief(parsed.brief);
        if (parsed.dataSourcesText) setDataSourcesText(parsed.dataSourcesText);
      } catch { /* ignore */ }
      localStorage.removeItem('oxygy_dashboard-designer_draft');
    }
  }, []);

  useEffect(() => {
    if (brief.q1_purpose.trim() || brief.q2_audience.trim() || brief.q4_metrics.trim()) {
      localStorage.setItem('oxygy_dashboard-designer_draft', JSON.stringify({ brief, dataSourcesText }));
    }
  }, [brief, dataSourcesText]);

  // ─── PRD loading step progression ───
  useEffect(() => {
    if (!isPrdLoading) {
      if (prdLoadingStep > 0) {
        const steps = isPrdRefineLoading ? PRD_REFINE_LOADING_STEPS : PRD_LOADING_STEPS;
        setPrdLoadingStep(steps.length);
        const timer = setTimeout(() => setPrdLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setPrdLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    PRD_STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setPrdLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isPrdLoading]);

  // ─── Build guide loading step progression ───
  useEffect(() => {
    if (!isBuildGuideLoading) {
      if (buildGuideLoadingStep > 0) {
        setBuildGuideLoadingStep(BUILD_GUIDE_LOADING_STEPS.length);
        const timer = setTimeout(() => setBuildGuideLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setBuildGuideLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    BUILD_GUIDE_STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setBuildGuideLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isBuildGuideLoading]);

  // ─── PRD staggered animation (Design Review Output Standard §9) ───
  useEffect(() => {
    if (!prdResult) return;
    setVisibleBlocks(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const totalBlocks = 7; // score banner, primary output, actions, refinement, buffer
    for (let i = 0; i < totalBlocks; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 120));
    }
    return () => timers.forEach(clearTimeout);
  }, [prdResult]);

  // ─── Build plan staggered animation (Step 4) ───
  useEffect(() => {
    if (!buildGuide) return;
    setBuildPlanVisibleBlocks(0);
    setBuildPlanViewMode('cards');
    const totalBlocks = 4; // content + actions + refinement + buffer
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      timers.push(setTimeout(() => setBuildPlanVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [buildGuide]);

  // ─── Helpers ───
  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, []);

  const updateBrief = useCallback(<K extends keyof DashboardBrief>(key: K, val: DashboardBrief[K]) => {
    setBrief(prev => ({ ...prev, [key]: val }));
  }, []);

  /* ─── Toggle expanded sections (readiness detail) ─── */
  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  /* ─── Textarea auto-height helper ─── */
  const autoHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  /* Auto-resize textareas when brief changes (e.g., example fill, draft restore) */
  useEffect(() => {
    document.querySelectorAll<HTMLTextAreaElement>('[data-autoheight]').forEach(autoHeight);
  }, [brief.q1_purpose, brief.q4_metrics]);

  // ─── Generate PRD directly from brief ───
  const handleGeneratePRD = async () => {
    if (!canGenerate) return;
    clearError();

    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);

    setPrdResult(null); setActiveView('cards');    setPrdApproved(false); setSelectedPlatform(null); setBuildGuide(null);
    setSavedToLibrary(false);

    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    // Build a descriptive prompt from the brief fields
    const briefSummary = [
      `App purpose: ${updatedBrief.q1_purpose}`,
      updatedBrief.q2_audience ? `Target users: ${updatedBrief.q2_audience}` : '',
      updatedBrief.q3_type ? `App type: ${updatedBrief.q3_type}` : '',
      updatedBrief.q4_metrics ? `Key features/metrics: ${updatedBrief.q4_metrics}` : '',
      updatedBrief.q5_dataSources.length > 0 ? `Data sources: ${updatedBrief.q5_dataSources.join(', ')}` : '',
      updatedBrief.q7_visualStyle ? `Visual style: ${VISUAL_STYLE_OPTIONS.find(v => v.id === updatedBrief.q7_visualStyle)?.label || updatedBrief.q7_visualStyle}` : '',
    ].filter(Boolean).join('. ');

    const result = await generatePRD(updatedBrief, briefSummary);
    if (result) {
      setPrdResult(result as NewPRDResult);
    } else {
      setPrdResult(generateFallbackPRD(updatedBrief));
    }

    if (user && !toolUsedRef.current) {
      upsertToolUsed(user.id, 4);
      toolUsedRef.current = true;
    }

    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  // ─── Example click ───
  const handleExampleClick = (example: typeof EXAMPLE_BRIEFS[0]) => {
    setBrief({
      ...INITIAL_BRIEF,
      q1_purpose: example.q1_purpose,
      q2_audience: example.q2_audience,
      q3_type: example.q3_type,
      q4_metrics: example.q4_metrics,
      q5_dataSources: [example.q5_dataSources],
      q7_visualStyle: example.q7_visualStyle,
    });
    setDataSourcesText(example.q5_dataSources);
  };

  // ─── Step-back navigation ───
  const handleGoBackToStep1 = () => {
    setPrdResult(null); setActiveView('cards');    setPrdRefinementAnswers({}); setPrdAdditionalContext(''); setPrdRefinementCount(0);
    setIsPrdRefineLoading(false); setPrdRefineExpanded(false);
    setPrdApproved(false); setSelectedPlatform(null); setPlatformStepDone(false); setBuildGuide(null);
    setSavedToLibrary(false); resetBuildPlanState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToStep2 = () => {
    setPrdApproved(false);
    setSelectedPlatform(null); setPlatformStepDone(false); setBuildGuide(null);
    resetBuildPlanState();
  };

  const handleGoBackToStep3 = () => {
    setBuildGuide(null);
    setPlatformStepDone(false);
    resetBuildPlanState();
  };

  const resetBuildPlanState = () => {
    setBuildPlanViewMode('cards'); setBuildPlanVisibleBlocks(0);
    setBuildPlanCopied(false); setBuildPlanSaved(false);
    setExpandedBuildSteps(new Set()); setCheckedTests(new Set());
    setBuildPlanRefineExpanded(false); setBuildPlanRefinementAnswers({});
    setBuildPlanAdditionalContext('');
  };

  // ─── Start over ───
  const handleStartOver = () => {
    setBrief({ ...INITIAL_BRIEF });
    setDataSourcesText('');
    setPrdResult(null); setActiveView('cards');    setPrdRefinementAnswers({}); setPrdAdditionalContext(''); setPrdRefinementCount(0);
    setIsPrdRefineLoading(false); setPrdRefineExpanded(false);
    setPrdApproved(false); setSelectedPlatform(null); setPlatformStepDone(false); setBuildGuide(null);
    setSavedToLibrary(false); resetBuildPlanState();
    resetCounts();
    localStorage.removeItem('oxygy_dashboard-designer_draft');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Approve PRD → move to Step 3 ───
  const handleApprovePRD = () => {
    setPrdApproved(true);
    toast('PRD approved! Choose your platform.');
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  // ─── Generate Build Guide ───
  const handleGenerateBuildGuide = async (refinementNote?: string) => {
    if (!prdResult || !selectedPlatform) return;
    clearError();

    setPlatformStepDone(true);

    const platformLabel = VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || selectedPlatform;
    const fullPrd = buildFullPRD(prdResult);

    const appDesc = refinementNote
      ? `${brief.q1_purpose}\n\n[REFINEMENT CONTEXT]\n${refinementNote}`
      : brief.q1_purpose;

    setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const guide = await generateBuildGuide({
      platform: platformLabel,
      prd_content: fullPrd,
      app_description: appDesc,
    });

    if (guide) {
      setBuildGuide(guide);
      setBuildPlanCopied(false);
      setBuildPlanSaved(false);
      setCheckedTests(new Set());
      setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  // ─── Build full markdown for build guide ───
  const buildFullBuildGuide = (): string => {
    if (!buildGuide || !prdResult) return '';
    const platformLabel = VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform';
    const parts: string[] = [
      `# Build Guide`,
      `## ${brief.q1_purpose.slice(0, 80)}`,
      `**Platform:** ${platformLabel}`,
      `**Steps:** ${buildGuide.steps.length}`,
      `---`,
      `## Setup Steps`,
    ];
    buildGuide.steps.forEach((step: { title: string; instruction: string }, i: number) => {
      parts.push(`### Step ${i + 1} — ${step.title}`);
      parts.push(step.instruction);
    });
    if (buildGuide.prd_snippet) {
      parts.push(`---`, `## PRD — Ready to Paste`, '```', buildGuide.prd_snippet, '```');
    }
    if (buildGuide.tips.length > 0) {
      parts.push(`---`, `## Pro Tips`);
      buildGuide.tips.forEach((tip: string) => parts.push(`- ${tip}`));
    }
    if (buildGuide.limitations) {
      parts.push(`---`, `> **Note:** ${buildGuide.limitations}`);
    }
    return parts.join('\n\n');
  };

  // ─── Build guide refinement ───
  const hasBuildPlanRefinementInput = Object.values(buildPlanRefinementAnswers).some(a => typeof a === 'string' && a.trim()) || buildPlanAdditionalContext.trim() !== '';

  const handleRefineBuildGuide = async () => {
    if (!hasBuildPlanRefinementInput || isBuildGuideLoading) return;
    const platformLabel = VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || selectedPlatform || '';
    const buildPlanRefinementQuestions = getBuildPlanRefinementQuestions(platformLabel);
    const refinementParts = buildPlanRefinementQuestions
      .map((q: string, idx: number) => {
        const a = buildPlanRefinementAnswers[idx]?.trim();
        return a ? `Q: ${q}\nA: ${a}` : null;
      })
      .filter(Boolean)
      .join('\n\n');
    const extra = buildPlanAdditionalContext.trim();
    const refinementNote = [refinementParts, extra ? `Additional: ${extra}` : ''].filter(Boolean).join('\n\n');

    setBuildPlanRefinementAnswers({});
    setBuildPlanAdditionalContext('');
    setBuildPlanRefineExpanded(false);

    await handleGenerateBuildGuide(refinementNote);
  };

  // ─── Build guide copy handler ───
  const handleCopyBuildGuide = async () => {
    const md = buildFullBuildGuide();
    if (!md) return;
    await copyText(md);
    setBuildPlanCopied(true);
    toast('Build Guide copied to clipboard');
    setTimeout(() => setBuildPlanCopied(false), 2000);
  };

  // ─── Build guide save handler ───
  const handleSaveBuildGuide = async () => {
    if (!buildGuide || !user) return;
    const md = buildFullBuildGuide();
    await dbSavePrompt(user.id, {
      level: 4,
      title: `Build Guide: ${brief.q1_purpose.slice(0, 50)}`,
      content: md,
      source_tool: 'dashboard-designer',
    });
    setBuildPlanSaved(true);
    toast('Build Guide saved to library');
  };

  // ─── PRD refinement handler ───
  const hasPrdRefinementInput = Object.values(prdRefinementAnswers).some(a => typeof a === 'string' && a.trim()) || prdAdditionalContext.trim() !== '';

  const handleRefinePRD = async () => {
    if (!hasPrdRefinementInput || !prdResult || isPrdLoading) return;

    const questions = prdResult.refinement_questions || [];
    const answeredQuestions = questions
      .map((q, i) => {
        const answer = prdRefinementAnswers[i]?.trim();
        return answer ? `Q: ${q}\nA: ${answer}` : null;
      })
      .filter(Boolean).join('\n\n');

    const refinementMsg = [
      `[REFINEMENT]\n\nOriginal brief: ${brief.q1_purpose}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
      prdAdditionalContext.trim() ? `\nAdditional context: ${prdAdditionalContext.trim()}` : '',
    ].filter(Boolean).join('\n');

    setIsPrdRefineLoading(true);
    clearError();
    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const enrichedPrompt = `${brief.q1_purpose}\n\n--- REFINEMENT FEEDBACK ---\n${refinementMsg}`;
    const result = await generatePRD(brief, enrichedPrompt);

    if (result) {
      setPrdResult(result as NewPRDResult);
    }

    setPrdRefinementCount(prev => prev + 1);
    setPrdRefinementAnswers({});
    setPrdAdditionalContext('');
    setIsPrdRefineLoading(false);
    setCopied(false);
    setSavedToLibrary(false);
    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  // ─── Copy / Download / Save handlers ───
  const handleCopyFullPRD = async () => {
    if (!prdResult) return;
    const md = buildFullPRD(prdResult);
    await copyText(md);
    setCopied(true);
    toast('Full PRD copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };


  const handleSaveToLibrary = async () => {
    if (!prdResult || !user) return;
    const md = buildFullPRD(prdResult);
    await dbSavePrompt(user.id, {
      level: 4,
      title: prdResult.prd_content || 'App PRD',
      content: md,
      source_tool: 'dashboard-designer',
    });
    setSavedToLibrary(true);
    toast('Saved to Prompt Library');
  };

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */
  return (
    <div style={{ padding: '28px 36px', background: '#F7FAFC', minHeight: '100%', fontFamily: FONT }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes ppFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppConnectorFlow { 0% { background-position: 0 0; } 100% { background-position: 0 20px; } }
        @keyframes ppSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ─── Page Title ─── */}
      <h1 style={{
        fontSize: 28, fontWeight: 800, color: '#1A202C',
        letterSpacing: '-0.4px', margin: 0, marginBottom: 6, fontFamily: FONT,
      }}>
        App Designer
      </h1>

      {/* ─── Description ─── */}
      <p style={{
        fontSize: 14, color: '#718096', lineHeight: 1.7,
        margin: 0, marginBottom: 20, fontFamily: FONT,
      }}>
        Stakeholders and AI coding tools need the same thing: a clear, complete specification of what to build. Most teams skip this and waste cycles on rework. The App Designer walks you through a structured brief and produces a production-ready PRD — covering layout, tech stack, data models, and acceptance criteria — then gives you platform-specific guidance to build it with <strong style={{ color: '#2D3748' }}>Cursor, Lovable, Bolt.new, Claude Code</strong>, or your tool of choice.
      </p>

      {/* ─── How It Works Overview ─── */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Complete your brief', detail: 'Describe what you\'re building', done: step1Done, active: !step1Done },
          { number: 2, label: 'Your app PRD', detail: '12-section product requirements document', done: step2Done, active: step1Done && !step2Done },
          { number: 3, label: 'Choose platform', detail: 'Pick your AI coding tool', done: step3Done, active: step2Done && !step3Done },
          { number: 4, label: 'Build guide', detail: 'Platform-specific build instructions', done: step4Done, active: step3Done && !step4Done },
        ]}
        outcome="A production-ready PRD plus a step-by-step build guide tailored to your chosen AI coding tool."
      />

      {/* ═══════════════════════════════════════════
          STEP 1 — Complete your brief
      ═══════════════════════════════════════════ */}
      <StepCard
        stepNumber={1}
        title="Complete your brief"
        subtitle="Describe what you're building, who it's for, and what it needs to do."
        done={step1Done}
        collapsed={step1Done}
      >
        {/* Example quick-fills */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, fontFamily: FONT }}>Try an example:</span>
            {EXAMPLE_BRIEFS.map(ex => (
              <button
                key={ex.label}
                onClick={() => handleExampleClick(ex)}
                style={{
                  background: `${LEVEL_ACCENT}12`, border: `1px solid ${LEVEL_ACCENT}`, borderRadius: 10,
                  padding: '7px 14px', fontSize: 13, fontWeight: 500, color: LEVEL_ACCENT_DARK,
                  cursor: 'pointer', fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK; e.currentTarget.style.background = `${LEVEL_ACCENT}30`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.background = `${LEVEL_ACCENT}12`; }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brief form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Q1: Purpose */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              What does this app do? <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <textarea
              data-autoheight
              value={brief.q1_purpose}
              onChange={e => { updateBrief('q1_purpose', e.target.value); autoHeight(e.target); }}
              placeholder="Describe the app's purpose — what problem does it solve and what will it do?"
              rows={1}
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box', overflow: 'hidden',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Q2: Audience */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              Who is this app for?
            </label>
            <input
              type="text"
              value={brief.q2_audience}
              onChange={e => updateBrief('q2_audience', e.target.value)}
              placeholder="e.g., Sales managers, students, home cooks, just me"
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Q3: App type */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              What type of app is this?
            </label>
            <input
              type="text"
              value={brief.q3_type}
              onChange={e => updateBrief('q3_type', e.target.value)}
              placeholder="e.g., Dashboard, CRUD app, content platform, personal tool"
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Q4: Key features */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              Key features or metrics to display
            </label>
            <textarea
              data-autoheight
              value={brief.q4_metrics}
              onChange={e => { updateBrief('q4_metrics', e.target.value); autoHeight(e.target); }}
              placeholder="List the main features, screens, or data points (e.g., user auth, CRUD for recipes, streak tracking, charts)"
              rows={1}
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box', overflow: 'hidden',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Q5: Data sources */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              Data sources
            </label>
            <input
              type="text"
              value={dataSourcesText}
              onChange={e => setDataSourcesText(e.target.value)}
              placeholder="e.g., Supabase, REST API, local storage, user input"
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Q7: Visual style */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
              Visual style preference
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VISUAL_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateBrief('q7_visualStyle', opt.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: FONT,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: brief.q7_visualStyle === opt.id ? `${LEVEL_ACCENT}30` : '#FFFFFF',
                    border: brief.q7_visualStyle === opt.id ? `1.5px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                    color: brief.q7_visualStyle === opt.id ? LEVEL_ACCENT_DARK : '#4A5568',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate PRD button */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={handleGeneratePRD}
              disabled={!canGenerate || isPrdLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: canGenerate ? LEVEL_ACCENT_DARK : '#CBD5E0',
                color: '#FFFFFF', border: 'none', borderRadius: 24,
                padding: '12px 28px', fontSize: 14, fontWeight: 700, fontFamily: FONT,
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {isPrdLoading ? (
                <div style={{ width: 16, height: 16, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'ppSpin 0.6s linear infinite' }} />
              ) : (
                <Sparkles size={16} />
              )}
              {isPrdLoading ? 'Generating PRD…' : prdGenerationCount > 0 ? 'Regenerate PRD' : 'Generate PRD'}
            </button>
            {prdGenerationCount > 0 && (
              <span style={{ fontSize: 11, color: '#A0AEC0', alignSelf: 'center', fontFamily: FONT }}>
                {prdGenerationCount}/{MAX_PRD_GENERATIONS} generations used
              </span>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10, fontSize: 13, color: '#C53030', fontFamily: FONT }}>
              {error}
            </div>
          )}
        </div>
      </StepCard>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 2 — Your app PRD
      ═══════════════════════════════════════════ */}
      <div ref={prdRef}>
        <StepCard
          stepNumber={2}
          title="Your app PRD"
          subtitle="A comprehensive product requirements document for development handoff."
          done={step2Done}
          collapsed={step2Done}
          locked={!step1Done && !isPrdLoading}
          lockedMessage="Complete Step 1 to generate your app PRD"
        >
          {isPrdLoading ? (
            /* ─── PRD Loading ─── */
            <ProcessingProgress
              steps={isPrdRefineLoading ? PRD_REFINE_LOADING_STEPS : PRD_LOADING_STEPS}
              currentStep={prdLoadingStep}
              header={isPrdRefineLoading ? 'Refining your PRD…' : 'Generating your PRD…'}
              subtext="This usually takes 15–20 seconds"
            />
          ) : prdResult ? (
            /* ═══ Design Review Output (per DESIGN-REVIEW-OUTPUT-STANDARD) ═══ */
            <>
              {/* ── §2.2 Quality Score Banner ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: '#F7FAFC', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: '18px 22px',
                marginBottom: 16,
                opacity: visibleBlocks >= 1 ? 1 : 0,
                transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${getScoreColor(prdResult.readiness?.overall_score || 0)} ${(prdResult.readiness?.overall_score || 0) * 3.6}deg, #E2E8F0 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#F7FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: getScoreColor(prdResult.readiness?.overall_score || 0),
                    fontFamily: FONT,
                  }}>
                    {prdResult.readiness?.overall_score || 0}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: FONT, lineHeight: 1.3 }}>
                    {prdResult.readiness?.verdict || 'PRD Generated'}
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5, fontFamily: FONT, marginTop: 4 }}>
                    {(prdResult.readiness?.rationale || '').length > 200
                      ? prdResult.readiness.rationale.slice(0, 200) + '…'
                      : prdResult.readiness?.rationale || ''}
                  </div>
                </div>
                <button
                  onClick={() => toggleSection('readiness')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT, flexShrink: 0, padding: '4px 0',
                  }}
                >
                  {expandedSections.has('readiness') ? 'Hide' : 'Learn more'}
                  <ChevronDown size={13} style={{
                    transform: expandedSections.has('readiness') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>

              {/* Expanded readiness detail */}
              {expandedSections.has('readiness') && prdResult.readiness?.criteria && (
                <div style={{
                  background: '#FFFFFF', borderRadius: 12,
                  border: '1px solid #E2E8F0', padding: '18px 20px',
                  marginBottom: 16, marginTop: -8,
                  animation: 'ppSlideDown 0.2s ease both',
                }}>
                  {Object.entries(prdResult.readiness.criteria).map(([key, val]) => (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                      borderBottom: '1px solid #F7FAFC',
                    }}>
                      <div style={{ width: 120, flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                        {CRITERIA_LABELS[key] || val.label || key}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: '#718096', fontFamily: FONT }}>{val.assessment}</div>
                      <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${val.score}%`, background: getScoreColor(val.score),
                            transition: 'width 0.7s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', width: 28, textAlign: 'right' as const }}>{val.score}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.6, marginTop: 12, fontFamily: FONT }}>
                    {prdResult.readiness.rationale}
                  </div>
                </div>
              )}

              {/* ── §2.3 Primary Output Section ── */}
              <div style={{
                marginBottom: 16,
                opacity: visibleBlocks >= 2 ? 1 : 0,
                transform: visibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                {/* Section header */}
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1A202C',
                  textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                }}>
                  <span style={{ fontSize: 15 }}>📄</span> Your App PRD
                </div>

                {/* View Toggle Row — Cards/Markdown toggle + Copy inline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex', background: '#F7FAFC', borderRadius: 8,
                    border: '1px solid #E2E8F0', overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setActiveView('cards')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', fontSize: 12, fontWeight: activeView === 'cards' ? 700 : 600, fontFamily: FONT,
                        border: 'none', cursor: 'pointer', borderRadius: 8,
                        background: activeView === 'cards' ? '#1A202C' : 'transparent',
                        color: activeView === 'cards' ? '#FFFFFF' : '#718096',
                      }}
                    >
                      <Eye size={12} /> Review
                    </button>
                    <button
                      onClick={() => setActiveView('markdown')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', fontSize: 12, fontWeight: activeView === 'markdown' ? 700 : 600, fontFamily: FONT,
                        border: 'none', cursor: 'pointer', borderRadius: 8,
                        background: activeView === 'markdown' ? '#2B6CB0' : 'transparent',
                        color: activeView === 'markdown' ? '#FFFFFF' : '#718096',
                      }}
                    >
                      <Code size={12} /> Markdown
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
                    {Object.keys(prdResult.sections).length} sections
                  </span>
                  <div style={{ marginLeft: 'auto' }}>
                    <ActionBtn
                      icon={copied ? <Check size={13} /> : <Copy size={13} />}
                      label={copied ? 'Copied!' : 'Copy PRD'}
                      onClick={handleCopyFullPRD}
                      primary
                    />
                  </div>
                </div>

                {/* Content area */}
                {activeView === 'markdown' ? (
                  <div style={{
                    background: '#1A202C', borderRadius: 12,
                    padding: '20px 22px', overflow: 'auto', maxHeight: 600,
                  }}>
                    <pre style={{
                      color: '#E2E8F0', fontSize: 13, lineHeight: 1.7,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      whiteSpace: 'pre-wrap', margin: 0,
                    }}>
                      {buildFullPRD(prdResult)}
                    </pre>
                  </div>
                ) : (
                  /* Review view — summary + expandable sections */
                  <div style={{
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                    padding: '20px 24px',
                  }}>
                    {/* Summary paragraph from project_overview */}
                    {prdResult.sections.project_overview && (
                      <div style={{
                        fontSize: 14, color: '#2D3748', lineHeight: 1.8,
                        fontFamily: FONT, marginBottom: 20,
                      }}>
                        {prdResult.sections.project_overview.length > 400
                          ? prdResult.sections.project_overview.slice(0, 400).replace(/\s+\S*$/, '') + '…'
                          : prdResult.sections.project_overview}
                      </div>
                    )}

                    {/* Section list — collapsed by default, expandable */}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: '#718096',
                      textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontFamily: FONT,
                      marginBottom: 10,
                    }}>
                      {Object.keys(prdResult.sections).length} sections in this PRD
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(prdResult.sections).map(([key, rawVal]) => {
                        const val = rawVal as string;
                        const def = PRD_SECTIONS.find(s => s.key === key);
                        const sectionColor = PRD_SECTION_COLORS[key] || { bg: '#F7FAFC', border: '#E2E8F0', label: key };
                        const Icon = PRD_SECTION_ICONS[key];
                        const isOpen = expandedPrdSections.has(key);
                        return (
                          <div key={key}>
                            <button
                              onClick={() => setExpandedPrdSections(prev => {
                                const next = new Set(prev);
                                if (next.has(key)) next.delete(key); else next.add(key);
                                return next;
                              })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                background: isOpen ? sectionColor.bg : '#FAFBFC',
                                borderLeft: `3px solid ${isOpen ? sectionColor.border : '#E2E8F0'}`,
                                borderRadius: isOpen ? '8px 8px 0 0' : 8,
                                transition: 'background 0.15s, border-color 0.15s',
                              }}
                            >
                              {Icon && <Icon size={13} color={isOpen ? LEVEL_ACCENT_DARK : '#A0AEC0'} style={{ flexShrink: 0 }} />}
                              <span style={{
                                flex: 1, fontSize: 13, fontWeight: 600, fontFamily: FONT,
                                color: isOpen ? '#1A202C' : '#4A5568',
                              }}>
                                {def?.title || key}
                              </span>
                              {isOpen ? <ChevronUp size={14} color="#718096" /> : <ChevronDown size={14} color="#A0AEC0" />}
                            </button>
                            {isOpen && (
                              <div style={{
                                padding: '14px 18px', background: sectionColor.bg,
                                borderLeft: `3px solid ${sectionColor.border}`,
                                borderRadius: '0 0 8px 8px', marginBottom: 2,
                              }}>
                                <div style={{
                                  fontSize: 13, color: '#2D3748', lineHeight: 1.7,
                                  fontFamily: FONT, whiteSpace: 'pre-wrap',
                                }}>
                                  {val}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* View full PRD hint */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 16,
                      paddingTop: 14, borderTop: '1px solid #EDF2F7',
                    }}>
                      <Info size={13} color="#A0AEC0" />
                      <span style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT }}>
                        Switch to <strong>Markdown</strong> view to see the full PRD document.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Actions Panel */}
              <div style={{ marginBottom: 16, opacity: visibleBlocks >= 3 ? 1 : 0, transform: visibleBlocks >= 3 ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s' }}>
                <OutputActionsPanel
                  workflowName={`PRD: ${prdResult.prd_content?.slice(0, 50) || 'App PRD'}`}
                  fullMarkdown={buildFullPRD(prdResult)}
                  onSaveToArtefacts={handleSaveToLibrary}
                  isSaved={savedToLibrary}
                />
              </div>

              {/* ── §2.4 Refinement Section ── */}
              {(() => {
                const questions = prdResult.refinement_questions || [];
                return (
                  <div style={{
                    background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0',
                    padding: '20px 24px', marginBottom: 16,
                    opacity: visibleBlocks >= 4 ? 1 : 0, transform: visibleBlocks >= 4 ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: prdRefineExpanded ? 20 : 0 }}>
                      <Info size={16} color="#A0AEC0" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                          This PRD is a strong starting point built from your brief — not the final word.
                          Review each section, test assumptions against your actual requirements,
                          and refine the areas that matter most before building.
                        </div>
                        {!prdRefineExpanded && (
                          <button
                            onClick={() => setPrdRefineExpanded(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '8px 0 0', fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK, cursor: 'pointer', fontFamily: FONT }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                          >
                            Would you like to refine this PRD further?
                            <ChevronDown size={14} />
                            {prdRefinementCount > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', fontFamily: FONT, marginLeft: 4 }}>
                                Refinement #{prdRefinementCount}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {prdRefineExpanded && (
                      <div style={{ animation: 'ppSlideDown 0.3s ease-out' }}>
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: FONT }}>
                                Refine Your PRD
                              </div>
                              {prdRefinementCount > 0 && (
                                <div style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', fontFamily: FONT }}>
                                  Refinement #{prdRefinementCount}
                                </div>
                              )}
                            </div>
                            <button onClick={() => setPrdRefineExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#A0AEC0', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#4A5568'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#A0AEC0'; }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                            {questions.length > 0 ? "Answer any of these to add context and get a more targeted PRD. You don't need to answer all of them — even one helps." : 'Add any additional context below to refine your PRD.'}
                          </p>
                          {questions.map((question: string, i: number) => (
                            <div key={i} style={{ marginBottom: 16 }}>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>{question}</label>
                              <input type="text" value={prdRefinementAnswers[i] || ''} onChange={e => setPrdRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))} placeholder="Your answer…"
                                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s', background: '#FFFFFF' }}
                                onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                              />
                            </div>
                          ))}
                          <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>Anything else to add?</label>
                            <textarea value={prdAdditionalContext} onChange={e => setPrdAdditionalContext(e.target.value)} placeholder="Any additional requirements, constraints, or context…"
                              style={{ width: '100%', minHeight: 60, resize: 'none', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s', background: '#FFFFFF', lineHeight: 1.5 }}
                              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                            />
                          </div>
                          <ActionBtn label={isPrdLoading ? 'Refining…' : 'Refine PRD'} onClick={handleRefinePRD} primary disabled={!hasPrdRefinementInput || isPrdLoading}
                            iconAfter={isPrdLoading ? <div style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'ppSpin 0.6s linear infinite' }} /> : <ArrowRight size={13} />}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── §2.5 Bottom Navigation Row ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <ActionBtn icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />} label="Back to Step 1" onClick={handleGoBackToStep1} />
                <ActionBtn label="Approve PRD" onClick={handleApprovePRD} iconAfter={<ArrowRight size={13} />} primary />
                <ActionBtn icon={<RotateCcw size={13} />} label="Start Over" onClick={handleStartOver} />
              </div>
            </>
          ) : null}
        </StepCard>
      </div>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 3 — Choose your platform
      ═══════════════════════════════════════════ */}
      <div ref={step3Ref}>
        <StepCard
          stepNumber={3}
          title="Choose your platform"
          subtitle="Pick the AI coding tool you'll use to build this app."
          done={step3Done}
          collapsed={step3Done}
          locked={!step2Done}
          lockedMessage="Approve your PRD above to choose your platform"
        >
          <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, marginBottom: 16, fontFamily: FONT }}>
            Which AI coding tool will you use to build this app? We'll generate a step-by-step guide tailored to your platform.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {VIBE_CODING_PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                  background: selectedPlatform === p.id ? '#FFFDF5' : '#FFFFFF',
                  border: selectedPlatform === p.id ? `1.5px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
              >
                <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {p.logo ? (
                    <img src={p.logo} alt={p.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#718096', fontFamily: FONT }}>{p.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => handleGenerateBuildGuide()}
              disabled={!selectedPlatform || isBuildGuideLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: selectedPlatform ? LEVEL_ACCENT_DARK : '#CBD5E0',
                color: '#FFFFFF', border: 'none', borderRadius: 24,
                padding: '12px 28px', fontSize: 14, fontWeight: 700, fontFamily: FONT,
                cursor: selectedPlatform ? 'pointer' : 'not-allowed',
              }}
            >
              <Sparkles size={16} />
              Generate Build Guide
            </button>
          </div>
        </StepCard>
      </div>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 4 — Download your Build Guide
      ═══════════════════════════════════════════ */}
      {(() => {
        const platformObj = VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform);
        const platformLabel = platformObj?.label || 'your platform';
        const platformLogo = platformObj?.logo || '';
        const platformIcon = platformObj?.icon || '';
        const fullBuildGuideMd = buildFullBuildGuide();
        const MONO = "'JetBrains Mono', 'Fira Code', Consolas, monospace";
        const buildPlanRefinementQuestions = getBuildPlanRefinementQuestions(platformLabel);

        return (
          <div ref={step4Ref}>
            <StepCard
              stepNumber={4}
              title="Download your Build Guide"
              subtitle="Your complete, platform-specific implementation document."
              done={!!buildGuide}
              collapsed={false}
              locked={!buildGuide && !isBuildGuideLoading}
              lockedMessage="Complete Step 3 to generate your Build Guide"
            >
              {/* §2.1 Loading State */}
              {isBuildGuideLoading && (
                <ProcessingProgress
                  steps={BUILD_GUIDE_LOADING_STEPS}
                  currentStep={buildGuideLoadingStep}
                  header="Generating your build guide…"
                  subtext={`Tailoring instructions for ${platformLabel}`}
                />
              )}

              {/* §2.2–2.7 Generated Output */}
              {buildGuide && !isBuildGuideLoading && (
                <div>
                  {/* §2.2 Next Step Banner */}
                  <NextStepBanner
                    accentColor={LEVEL_ACCENT}
                    accentDark={LEVEL_ACCENT_DARK}
                    title="What's next"
                    text={`Download your Build Guide and follow the steps in ${platformLabel}. Use the test checklist to verify each step.`}
                  />

                  {/* §2.3 Top Action Row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap',
                    opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0,
                    transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    {/* View toggle */}
                    <div style={{
                      display: 'inline-flex', background: '#F7FAFC', borderRadius: 10,
                      border: '1px solid #E2E8F0',
                    }}>
                      <button
                        onClick={() => setBuildPlanViewMode('cards')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                          border: 'none', cursor: 'pointer', borderRadius: 10,
                          background: buildPlanViewMode === 'cards' ? '#1A202C' : 'transparent',
                          color: buildPlanViewMode === 'cards' ? '#FFFFFF' : '#718096',
                        }}
                      >
                        <Eye size={13} /> Cards
                      </button>
                      <button
                        onClick={() => setBuildPlanViewMode('markdown')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                          border: 'none', cursor: 'pointer', borderRadius: 10,
                          background: buildPlanViewMode === 'markdown' ? '#2B6CB0' : 'transparent',
                          color: buildPlanViewMode === 'markdown' ? '#FFFFFF' : '#718096',
                        }}
                      >
                        <Code size={13} /> Markdown
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <ActionBtn
                        icon={buildPlanCopied ? <Check size={13} /> : <Copy size={13} />}
                        label={buildPlanCopied ? 'Copied!' : 'Copy Build Guide'}
                        onClick={handleCopyBuildGuide}
                        primary
                      />
                      <ActionBtn
                        icon={<Download size={13} />}
                        label="Download (.md)"
                        onClick={() => {
                          const blob = new Blob([fullBuildGuideMd], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `build-guide-${new Date().toISOString().slice(0, 10)}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      />
                      <ActionBtn
                        icon={<BookOpen size={13} />}
                        label={buildPlanSaved ? 'Saved!' : 'Save to Library'}
                        onClick={handleSaveBuildGuide}
                        accent
                        disabled={buildPlanSaved}
                      />
                    </div>
                  </div>

                  {/* §2.4 Build Guide Content */}
                  <div style={{
                    marginBottom: 16,
                    opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0,
                    transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    {buildPlanViewMode === 'markdown' ? (
                      /* §2.4b Markdown View */
                      <div style={{
                        background: '#1A202C', borderRadius: 12, padding: '22px 24px',
                        maxHeight: 600, overflow: 'auto',
                      }}>
                        <pre style={{
                          color: '#E2E8F0', fontSize: 13, lineHeight: 1.8,
                          fontFamily: MONO, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                        }}>
                          {fullBuildGuideMd}
                        </pre>
                      </div>
                    ) : (
                      /* §2.4a Cards View */
                      <div style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
                        padding: '28px 32px',
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={20} color={LEVEL_ACCENT} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: FONT }}>
                              BUILD GUIDE
                            </span>
                          </div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: '#E6FFFA', color: '#1A7A76', border: '1px solid #38B2AC44',
                            borderRadius: 99, padding: '6px 16px', fontSize: 14, fontWeight: 700, fontFamily: FONT,
                          }}>
                            {platformLogo ? (
                              <img src={platformLogo} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }} />
                            ) : platformIcon ? (
                              <span style={{ fontSize: 18, lineHeight: 1 }}>{platformIcon}</span>
                            ) : null}
                            {platformLabel}
                          </span>
                        </div>

                        {/* Title & overview */}
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C', margin: '0 0 12px 0', fontFamily: FONT }}>
                          {brief.q1_purpose.slice(0, 80)}
                        </h2>
                        <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, margin: '0 0 20px 0', fontFamily: FONT }}>
                          Step-by-step instructions for building your app with {platformLabel}. Follow each step, then use the test checklist to verify.
                        </p>

                        {/* Stat pills */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                          <span style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>
                            {buildGuide.steps.length} steps
                          </span>
                          <span style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>
                            {platformLabel}
                          </span>
                          {buildGuide.tips.length > 0 && (
                            <span style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>
                              {buildGuide.tips.length} pro tips
                            </span>
                          )}
                        </div>

                        {/* Steps section */}
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 12 }}>
                          {buildGuide.steps.length} steps in this build guide
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                          {buildGuide.steps.map((step: { title: string; instruction: string }, i: number) => {
                            const isExpanded = expandedBuildSteps.has(i);
                            return (
                              <div key={i}>
                                <button
                                  onClick={() => setExpandedBuildSteps(prev => {
                                    const next = new Set(prev);
                                    if (next.has(i)) next.delete(i); else next.add(i);
                                    return next;
                                  })}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                    padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: isExpanded ? '#F0FFF4' : '#F7FAFC',
                                    borderWidth: 1, borderStyle: 'solid',
                                    borderColor: isExpanded ? '#C6F6D5' : '#E2E8F0',
                                    borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                                    transition: 'background 0.15s, border-color 0.15s',
                                  }}
                                >
                                  <div style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    background: LEVEL_ACCENT, color: '#FFFFFF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                                    {step.title}
                                  </span>
                                  {isExpanded ? <ChevronUp size={16} color="#718096" /> : <ChevronDown size={16} color="#718096" />}
                                </button>
                                {isExpanded && (
                                  <div style={{
                                    padding: '16px 18px', background: '#FAFFFE',
                                    border: '1px solid #C6F6D5', borderTop: 'none',
                                    borderRadius: '0 0 10px 10px',
                                  }}>
                                    <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, fontFamily: FONT }}>
                                      {renderFormattedText(step.instruction)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* PRD Snippet — Ready to Paste */}
                        {buildGuide.prd_snippet && (
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 12 }}>
                              Your PRD — Ready to Paste
                            </div>
                            <div style={{
                              background: '#1A202C', borderRadius: 10, overflow: 'hidden',
                            }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 14px', background: '#2D3748', borderBottom: '1px solid #4A5568',
                              }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', fontFamily: FONT }}>
                                  Copy this into {platformLabel}
                                </span>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(buildGuide.prd_snippet);
                                    setBuildPlanCopied(true);
                                    setTimeout(() => setBuildPlanCopied(false), 2000);
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4, background: 'none',
                                    border: '1px solid #4A5568', borderRadius: 6, padding: '4px 10px',
                                    fontSize: 11, fontWeight: 600, color: '#E2E8F0', cursor: 'pointer', fontFamily: FONT,
                                  }}
                                >
                                  {buildPlanCopied ? <Check size={12} /> : <Copy size={12} />}
                                  {buildPlanCopied ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <pre style={{
                                padding: '16px 18px', margin: 0, fontSize: 12, lineHeight: 1.7,
                                color: '#E2E8F0', fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                maxHeight: 400, overflowY: 'auto',
                              }}>
                                {buildGuide.prd_snippet}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Pro Tips */}
                        {buildGuide.tips.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 12 }}>
                              Pro Tips
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {buildGuide.tips.map((tip: string, i: number) => (
                                <div key={i} style={{
                                  display: 'flex', gap: 10, alignItems: 'flex-start',
                                  padding: '10px 14px', background: '#F7FAFC',
                                  border: '1px solid #E2E8F0', borderRadius: 10,
                                }}>
                                  <Sparkles size={14} color={LEVEL_ACCENT_DARK} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>{tip}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Limitations */}
                        {buildGuide.limitations && (
                          <div style={{
                            fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', fontFamily: FONT,
                            marginBottom: 24,
                          }}>
                            {buildGuide.limitations}
                          </div>
                        )}

                        {/* Want the full guide? CTA */}
                        <div style={{
                          background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
                          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <Download size={18} color="#718096" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>Want the full guide?</div>
                            <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT, marginTop: 2 }}>Download as a Markdown or Word document using the buttons below.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* §2.5 Output Actions Panel */}
                  <div style={{
                    marginBottom: 16,
                    opacity: buildPlanVisibleBlocks >= 2 ? 1 : 0,
                    transform: buildPlanVisibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <OutputActionsPanel
                      workflowName={`Build Guide: ${brief.q1_purpose.slice(0, 50)}`}
                      fullMarkdown={fullBuildGuideMd}
                      onSaveToArtefacts={handleSaveBuildGuide}
                      isSaved={buildPlanSaved}
                    />
                  </div>

                  {/* §2.6 Refinement Section */}
                  <div style={{
                    background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0',
                    padding: '20px 24px', marginBottom: 16,
                    opacity: buildPlanVisibleBlocks >= 3 ? 1 : 0,
                    transform: buildPlanVisibleBlocks >= 3 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: buildPlanRefineExpanded ? 20 : 0 }}>
                      <Info size={16} color="#A0AEC0" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                          This Build Guide is a strong starting point, but every environment is different.
                          Test each step in your actual {platformLabel} workspace, and adjust field mappings or credentials as needed.
                        </div>
                        {!buildPlanRefineExpanded && (
                          <button
                            onClick={() => setBuildPlanRefineExpanded(true)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: 'none', border: 'none', padding: '8px 0 0',
                              fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                              cursor: 'pointer', fontFamily: FONT,
                            }}
                          >
                            Would you like to refine this Build Guide further?
                            <ChevronDown size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {buildPlanRefineExpanded && (
                      <div style={{ animation: 'ppSlideDown 0.3s ease-out' }}>
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: FONT }}>
                              Refine Your Build Guide
                            </div>
                            <button
                              onClick={() => setBuildPlanRefineExpanded(false)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#A0AEC0', display: 'flex', alignItems: 'center' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                            Answer any of these to add context and get a more targeted Build Guide. You don't need to answer all.
                          </p>
                          {buildPlanRefinementQuestions.map((question: string, i: number) => (
                            <div key={i} style={{ marginBottom: 16 }}>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                                {question}
                              </label>
                              <input
                                type="text"
                                value={buildPlanRefinementAnswers[i] || ''}
                                onChange={e => setBuildPlanRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                placeholder="Your answer…"
                                style={{
                                  width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
                                  padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C',
                                  outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF',
                                  transition: 'border-color 0.15s',
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
                              value={buildPlanAdditionalContext}
                              onChange={e => setBuildPlanAdditionalContext(e.target.value)}
                              placeholder="Any additional requirements, constraints, or context…"
                              style={{
                                width: '100%', minHeight: 60, resize: 'none',
                                border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                                fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none',
                                boxSizing: 'border-box' as const, background: '#FFFFFF', lineHeight: 1.5,
                                transition: 'border-color 0.15s',
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                            />
                          </div>
                          <ActionBtn
                            label={isBuildGuideLoading ? 'Refining…' : 'Refine Build Guide'}
                            onClick={handleRefineBuildGuide}
                            primary
                            disabled={!hasBuildPlanRefinementInput || isBuildGuideLoading}
                            iconAfter={isBuildGuideLoading
                              ? <div style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'ppSpin 0.6s linear infinite' }} />
                              : <ArrowRight size={13} />
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* §2.7 Bottom Navigation Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                    <ActionBtn icon={<ArrowLeft size={14} />} label="Back to Step 3" onClick={handleGoBackToStep3} />
                    <ActionBtn icon={<RotateCcw size={14} />} label="Start Over" onClick={handleStartOver} />
                  </div>
                </div>
              )}

              {error && !isBuildGuideLoading && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10, fontSize: 13, color: '#C53030', fontFamily: FONT }}>
                  {error}
                </div>
              )}
            </StepCard>
          </div>
        );
      })()}

      {/* ─── Toast notification ─── */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 500, fontFamily: FONT,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
          animation: 'ppFadeIn 0.3s ease-out',
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

/* ─── ProcessingProgress (matches L1 Prompt Playground gold standard) ─── */
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
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
      padding: '28px 32px',
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
              transition: 'opacity 0.2s',
              opacity: isPending ? 0.5 : 1,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isComplete ? LEVEL_ACCENT : '#F7FAFC',
                border: isActive
                  ? `2px solid ${LEVEL_ACCENT}`
                  : isComplete ? 'none' : '2px solid #E2E8F0',
                position: 'relative',
              }}>
                {isComplete && (
                  <Check size={10} color={LEVEL_ACCENT_DARK} strokeWidth={3} />
                )}
                {isActive && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: LEVEL_ACCENT_DARK,
                    animation: 'ppSpin 0.7s linear infinite',
                    position: 'absolute', top: -2, left: -2,
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isPending ? '#A0AEC0' : '#2D3748',
                fontFamily: FONT,
                transition: 'color 0.2s, font-weight 0.2s',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        width: '100%', height: 4, borderRadius: 2,
        background: '#EDF2F7', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: LEVEL_ACCENT,
          width: `${progressPercent}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: 11, color: '#A0AEC0',
        textAlign: 'right', marginTop: 6,
        fontFamily: FONT,
      }}>
        {completedSteps} of {steps.length}
      </div>
    </div>
  );
};

export default AppDashboardDesigner;
