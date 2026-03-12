import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, ArrowLeft, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, Sparkles,
  X, Eye,
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

function summariseSection(val: string): string {
  const lines = val.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  const first = lines[0] || '';
  return first.length > 120 ? first.slice(0, 117) + '…' : first;
}

/* ────────────────────────────────────────────────────────────
   Shared UI Primitives
   ──────────────────────────────────────────────────────────── */

const StepBadge: React.FC<{ num: number; done: boolean; active?: boolean }> = ({ num, done, active }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 13, fontFamily: FONT, flexShrink: 0,
    ...(done
      ? { background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK }
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
    background: '#FFFFFF', borderRadius: 16,
    border: done ? `1px solid ${LEVEL_ACCENT}88` : '1px solid #E2E8F0',
    padding: collapsed ? '16px 24px' : '24px 28px',
    transition: 'border-color 0.3s',
    opacity: locked ? 0.5 : 1,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StepBadge num={stepNumber} done={done} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{title}</span>
        {!collapsed && (
          <span style={{ fontSize: 13, color: '#718096', fontFamily: FONT, marginLeft: 10 }}>{subtitle}</span>
        )}
      </div>
      {collapsed && (
        <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>Done ✓</span>
      )}
    </div>
    {locked && lockedMessage && (
      <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT, marginTop: 8, fontStyle: 'italic' }}>
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
  icon: React.ReactNode; label: string; onClick: () => void;
  primary?: boolean; accent?: boolean; disabled?: boolean;
}> = ({ icon, label, onClick, primary, accent, disabled }) => {
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
      {icon} {label}
    </button>
  );
};

/* ─── Info Tooltip ─── */
const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'inline-block', position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 6, color: '#A0AEC0' }}
        aria-label="More information"
      >
        <Info size={15} />
      </button>
      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'absolute', zIndex: 50, left: 0, top: '100%', marginTop: 8,
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
            padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxWidth: 340, minWidth: 260,
          }}
        >
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>{content}</div>
        </div>
      )}
    </div>
  );
};

/* ─── Educational defaults for PRD sections ─── */
const EDUCATIONAL_PRD_SECTIONS = PRD_SECTIONS.map((s) => ({
  ...s,
  color: LEVEL_ACCENT_DARK,
}));

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
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  // ─── Platform + Build Guide (Step 3) ───
  const [prdApproved, setPrdApproved] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [buildGuide, setBuildGuide] = useState<{ steps: { title: string; instruction: string }[]; tips: string[]; limitations: string } | null>(null);
  const [buildGuideLoadingStep, setBuildGuideLoadingStep] = useState(0);

  // ─── Refs ───
  const prdRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
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
  const step3Done = buildGuide !== null;

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

  // ─── PRD staggered animation ───
  useEffect(() => {
    if (!prdResult) return;
    setVisibleBlocks(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sectionCount = Object.keys(prdResult.sections).length;
    for (let i = 0; i < sectionCount; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [prdResult]);

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

  /* ─── Textarea auto-height helper ─── */
  const autoHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  // ─── Generate PRD directly from brief ───
  const handleGeneratePRD = async () => {
    if (!canGenerate) return;
    clearError();

    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);

    setPrdResult(null); setShowMarkdown(false); setExpandedPrdSections(new Set());
    setPrdApproved(false); setSelectedPlatform(null); setBuildGuide(null);
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
    setPrdResult(null); setShowMarkdown(false); setExpandedPrdSections(new Set());
    setPrdRefinementAnswers({}); setPrdAdditionalContext(''); setPrdRefinementCount(0);
    setIsPrdRefineLoading(false); setPrdRefineExpanded(false);
    setPrdApproved(false); setSelectedPlatform(null); setBuildGuide(null);
    setSavedToLibrary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToStep2 = () => {
    setPrdApproved(false);
    setSelectedPlatform(null); setBuildGuide(null);
  };

  // ─── Start over ───
  const handleStartOver = () => {
    setBrief({ ...INITIAL_BRIEF });
    setDataSourcesText('');
    setPrdResult(null); setShowMarkdown(false); setExpandedPrdSections(new Set());
    setPrdRefinementAnswers({}); setPrdAdditionalContext(''); setPrdRefinementCount(0);
    setIsPrdRefineLoading(false); setPrdRefineExpanded(false);
    setPrdApproved(false); setSelectedPlatform(null); setBuildGuide(null);
    setSavedToLibrary(false);
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
  const handleGenerateBuildGuide = async () => {
    if (!prdResult || !selectedPlatform) return;
    clearError();

    const platformLabel = VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || selectedPlatform;
    const fullPrd = buildFullPRD(prdResult);

    const guide = await generateBuildGuide({
      platform: platformLabel,
      prd_content: fullPrd,
      app_description: brief.q1_purpose,
    });

    if (guide) {
      setBuildGuide(guide);
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  // ─── PRD refinement handler ───
  const hasPrdRefinementInput = Object.values(prdRefinementAnswers).some(a => typeof a === 'string' && a.trim()) || prdAdditionalContext.trim() !== '';

  const handleRefinePRD = async () => {
    if (!hasPrdRefinementInput || !prdResult || isPrdLoading) return;

    const questions = [
      'Are there specific features or screens that need more detail in the PRD?',
      'What third-party integrations or APIs should be included?',
      'Are there specific performance requirements or constraints?',
      'What authentication or permission model does the app need?',
      'Any design system preferences (colors, typography, component library)?',
    ];
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

  const handleCopySection = async (key: string, val: string) => {
    await copyText(val);
    setCopiedSection(key);
    toast('Section copied');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadPRD = () => {
    if (!prdResult) return;
    const md = buildFullPRD(prdResult);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-prd.md';
    a.click();
    URL.revokeObjectURL(url);
    toast('PRD downloaded as Markdown');
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
          { number: 1, label: 'Complete your brief', detail: 'Describe what you\'re building, who it\'s for, and what it needs to do', done: step1Done, active: !step1Done },
          { number: 2, label: 'Your app PRD', detail: '12-section product requirements document', done: step2Done, active: step1Done && !step2Done },
          { number: 3, label: 'Build guide', detail: 'Platform-specific instructions to start building', done: step3Done, active: step2Done && !step3Done },
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
        collapsed={step1Done && step2Done}
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
              value={brief.q1_purpose}
              onChange={e => { updateBrief('q1_purpose', e.target.value); autoHeight(e.target); }}
              placeholder="Describe the app's purpose — what problem does it solve and what will it do?"
              rows={3}
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
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
              value={brief.q4_metrics}
              onChange={e => { updateBrief('q4_metrics', e.target.value); autoHeight(e.target); }}
              placeholder="List the main features, screens, or data points (e.g., user auth, CRUD for recipes, streak tracking, charts)"
              rows={2}
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
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
          collapsed={step2Done && step3Done}
        >
          {!step1Done && !isPrdLoading ? (
            /* ─── Educational default ─── */
            <div>
              <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, marginBottom: 16, fontFamily: FONT }}>
                Your PRD will be structured using <strong>12 production-grade sections</strong> optimised for AI coding tools like Cursor, Lovable, Bolt.new, and Claude Code. Each section gives the AI the exact constraints and specifications it needs — tech stack, data models, feature behaviours, design tokens, and acceptance criteria. Complete your brief above and each section will be filled with content tailored to your specific app.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {EDUCATIONAL_PRD_SECTIONS.map((s, i) => {
                  const Icon = PRD_SECTION_ICONS[s.key];
                  return (
                    <div
                      key={s.key}
                      style={{
                        borderLeft: `4px solid ${s.color}`,
                        background: `${s.color}08`,
                        borderRadius: 10, padding: '16px 18px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {Icon && <Icon size={14} color={s.color} />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FONT }}>
                          {s.title}
                        </span>
                        <span style={{ fontSize: 10, color: '#A0AEC0', fontFamily: FONT, marginLeft: 'auto' }}>
                          {i + 1}/{EDUCATIONAL_PRD_SECTIONS.length}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>
                        {s.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isPrdLoading ? (
            /* ─── PRD Loading ─── */
            <ProcessingProgress
              steps={isPrdRefineLoading ? PRD_REFINE_LOADING_STEPS : PRD_LOADING_STEPS}
              currentStep={prdLoadingStep}
              header={isPrdRefineLoading ? 'Refining your PRD…' : 'Generating your PRD…'}
              subtext="This usually takes 15–20 seconds"
            />
          ) : prdResult ? (
            /* ─── PRD Result ─── */
            <div>
              {/* Top action row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Cards / Markdown toggle */}
                <div style={{
                  display: 'inline-flex', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setShowMarkdown(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                      border: 'none', cursor: 'pointer', borderRadius: 8,
                      background: !showMarkdown ? '#1A202C' : 'transparent',
                      color: !showMarkdown ? '#FFFFFF' : '#718096',
                    }}
                  >
                    <Eye size={13} /> Cards
                  </button>
                  <button
                    onClick={() => setShowMarkdown(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                      border: 'none', cursor: 'pointer', borderRadius: 8,
                      background: showMarkdown ? '#2B6CB0' : 'transparent',
                      color: showMarkdown ? '#FFFFFF' : '#718096',
                    }}
                  >
                    <Code size={13} /> Markdown
                  </button>
                </div>
                <InfoTooltip content="Markdown view shows the cohesive PRD deliverable — ready to paste into AI coding tools. Cards view shows all sections for individual review." />

                <div style={{ flex: 1 }} />

                <ActionBtn
                  icon={copied ? <Check size={13} /> : <Copy size={13} />}
                  label={copied ? 'Copied!' : 'Copy Full PRD'}
                  onClick={handleCopyFullPRD}
                  primary
                />
                <ActionBtn
                  icon={<Download size={13} />}
                  label="Download (.md)"
                  onClick={handleDownloadPRD}
                />
                <ActionBtn
                  icon={<Library size={13} />}
                  label={savedToLibrary ? 'Saved!' : 'Save to Prompt Library'}
                  onClick={handleSaveToLibrary}
                  accent
                  disabled={savedToLibrary}
                />
              </div>

              {/* Next Step Banner */}
              {!prdApproved && (
                <NextStepBanner
                  accentColor={LEVEL_ACCENT}
                  accentDark={LEVEL_ACCENT_DARK}
                  title="Review your PRD"
                  text="Scroll through each section below. When you're happy, approve the PRD and choose your coding platform to get a step-by-step build guide."
                />
              )}

              {showMarkdown ? (
                /* ─── Markdown view ─── */
                <div style={{
                  background: '#1A202C', borderRadius: 12, padding: '22px 24px',
                  position: 'relative',
                }}>
                  <button
                    onClick={handleCopyFullPRD}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      background: '#2D3748', color: '#A0AEC0', border: 'none', borderRadius: 6,
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT,
                    }}
                  >
                    {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                  </button>
                  <pre style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 13, lineHeight: 1.8, color: '#E2E8F0',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                  }}>
                    {buildFullPRD(prdResult)}
                  </pre>
                </div>
              ) : (
                /* ─── Cards view — all collapsed by default ─── */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(prdResult.sections).map(([key, rawVal], i) => {
                    const val = rawVal as string;
                    const def = PRD_SECTIONS.find(s => s.key === key);
                    const color = LEVEL_ACCENT_DARK;
                    const Icon = PRD_SECTION_ICONS[key];
                    const isVisible = i < visibleBlocks;
                    const isExpanded = expandedPrdSections.has(key);
                    return (
                      <div
                        key={key}
                        style={{
                          borderLeft: `4px solid ${color}`,
                          background: `${color}12`,
                          borderRadius: 10, padding: '14px 16px',
                          position: 'relative',
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                          transition: 'opacity 0.3s, transform 0.3s',
                        }}
                      >
                        <button
                          onClick={() => setExpandedPrdSections(prev => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key); else next.add(key);
                            return next;
                          })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            textAlign: 'left',
                          }}
                        >
                          {Icon && <Icon size={14} color={color} />}
                          <span style={{
                            fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase',
                            letterSpacing: '0.04em', fontFamily: FONT, flex: 1,
                          }}>
                            {def?.title || key}
                          </span>
                          <span
                            onClick={e => { e.stopPropagation(); handleCopySection(key, val); }}
                            style={{ color: '#A0AEC0', padding: 2, flexShrink: 0, display: 'flex' }}
                          >
                            {copiedSection === key ? <Check size={13} color="#38A169" /> : <Copy size={13} />}
                          </span>
                          <ChevronDown size={14} color="#A0AEC0" style={{
                            flexShrink: 0,
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }} />
                        </button>

                        {!isExpanded && (
                          <div style={{
                            fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT,
                            marginTop: 6,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                          }}>
                            {summariseSection(val)}
                          </div>
                        )}

                        {isExpanded && (
                          <div style={{
                            fontSize: 13, color: '#2D3748', lineHeight: 1.7, fontFamily: FONT,
                            whiteSpace: 'pre-wrap', marginTop: 10,
                            animation: 'ppSlideDown 0.2s ease both',
                          }}>
                            {val}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Output Actions Panel */}
              <div style={{ marginTop: 24 }}>
                <OutputActionsPanel
                  workflowName={`PRD: ${prdResult.prd_content?.slice(0, 50) || 'App PRD'}`}
                  fullMarkdown={buildFullPRD(prdResult)}
                  onSaveToArtefacts={handleSaveToLibrary}
                  isSaved={savedToLibrary}
                />
              </div>

              {/* Refinement Card (collapsible per §4.5) */}
              <div style={{
                background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0',
                padding: '20px 24px', marginTop: 20, marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: prdRefineExpanded ? 16 : 12 }}>
                  <Info size={16} color="#718096" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                    This PRD is a strong starting point built from your brief — not the final word.
                    Review each section, refine the areas that matter most, and adapt it to your specific tools and constraints.
                  </div>
                </div>

                {!prdRefineExpanded && (
                  <button
                    onClick={() => setPrdRefineExpanded(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, fontSize: 13, fontWeight: 600,
                      color: LEVEL_ACCENT_DARK, fontFamily: FONT,
                    }}
                  >
                    <ChevronDown size={14} />
                    Would you like to refine this PRD further?
                    {prdRefinementCount > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                        borderRadius: 20, padding: '2px 10px', marginLeft: 6,
                      }}>
                        Refinement #{prdRefinementCount}
                      </span>
                    )}
                  </button>
                )}

                {prdRefineExpanded && (
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, animation: 'ppSlideDown 0.3s ease-out both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>
                          Refine Your PRD
                        </div>
                      </div>
                      <button onClick={() => setPrdRefineExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0' }}>
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                      Answer any of these to add context and get a more targeted PRD. You don't need to answer all of them — even one helps.
                    </p>

                    {[
                      'Are there specific features or screens that need more detail in the PRD?',
                      'What third-party integrations or APIs should be included?',
                      'Are there specific performance requirements or constraints?',
                      'What authentication or permission model does the app need?',
                      'Any design system preferences (colors, typography, component library)?',
                    ].map((question, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                          {question}
                        </label>
                        <input
                          type="text"
                          value={prdRefinementAnswers[i] || ''}
                          onChange={e => setPrdRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Your answer…"
                          style={{
                            width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                            fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const,
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
                        value={prdAdditionalContext}
                        onChange={e => setPrdAdditionalContext(e.target.value)}
                        placeholder="Any additional requirements, constraints, or context…"
                        style={{
                          width: '100%', minHeight: 60, resize: 'none', border: '1px solid #E2E8F0', borderRadius: 10,
                          padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none',
                          boxSizing: 'border-box' as const, background: '#FFFFFF', lineHeight: 1.5,
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                      />
                    </div>

                    <ActionBtn
                      icon={isPrdLoading ? (
                        <div style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'ppSpin 0.6s linear infinite' }} />
                      ) : <ArrowRight size={13} />}
                      label={isPrdLoading ? 'Refining…' : 'Refine PRD'}
                      onClick={handleRefinePRD}
                      primary
                      disabled={!hasPrdRefinementInput || isPrdLoading}
                    />
                  </div>
                )}
              </div>

              {/* Approve / Back / Start Over */}
              {!prdApproved && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleApprovePRD}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#38A169', color: '#FFFFFF', border: 'none', borderRadius: 24,
                      padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={15} /> Approve PRD
                  </button>
                  <ActionBtn icon={<ArrowLeft size={13} />} label="Back to Brief" onClick={handleGoBackToStep1} />
                  <ActionBtn icon={<RotateCcw size={13} />} label="Start Over" onClick={handleStartOver} />
                </div>
              )}
            </div>
          ) : null}
        </StepCard>
      </div>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 3 — Choose platform & build guide
      ═══════════════════════════════════════════ */}
      <div ref={step3Ref}>
        <StepCard
          stepNumber={3}
          title="Build guide"
          subtitle={selectedPlatform ? `Setup guide for ${VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label}` : 'Choose your AI coding platform and get a step-by-step build guide.'}
          done={step3Done}
          collapsed={false}
          locked={!step2Done}
          lockedMessage="Approve your PRD above to choose your platform"
        >
          {/* Platform selection grid */}
          {!buildGuide && !isBuildGuideLoading && (
            <div>
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
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: '#718096', fontFamily: FONT }}>{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleGenerateBuildGuide}
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
            </div>
          )}

          {/* Build guide loading */}
          {isBuildGuideLoading && (
            <ProcessingProgress
              steps={BUILD_GUIDE_LOADING_STEPS}
              currentStep={buildGuideLoadingStep}
              header="Generating your build guide…"
              subtext={`Tailoring instructions for ${VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform'}`}
            />
          )}

          {/* Build guide result */}
          {buildGuide && !isBuildGuideLoading && (
            <div>
              <NextStepBanner
                accentColor={LEVEL_ACCENT}
                accentDark={LEVEL_ACCENT_DARK}
                title={`Build with ${VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform'}`}
                text="Follow these steps to turn your PRD into a working app. Copy the PRD first, then follow each step below."
              />

              {/* Steps */}
              <div style={{
                background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
                padding: '20px 24px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Code2 size={16} color={LEVEL_ACCENT_DARK} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>
                    Build Plan — {VIBE_CODING_PLATFORMS.find(p => p.id === selectedPlatform)?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {buildGuide.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: `${LEVEL_ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: LEVEL_ACCENT_DARK, fontFamily: FONT,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4, fontFamily: FONT }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, fontFamily: FONT, whiteSpace: 'pre-wrap' }}>
                          {step.instruction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {buildGuide.tips.length > 0 && (
                <div style={{
                  background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
                  padding: '20px 24px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={16} color={LEVEL_ACCENT_DARK} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Pro Tips</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {buildGuide.tips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%', background: LEVEL_ACCENT,
                          flexShrink: 0, marginTop: 7,
                        }} />
                        <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {buildGuide.limitations && (
                <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', fontFamily: FONT, marginBottom: 16 }}>
                  {buildGuide.limitations}
                </div>
              )}

              {/* Bottom actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ActionBtn icon={<ArrowLeft size={13} />} label="Back to PRD" onClick={handleGoBackToStep2} />
                <ActionBtn icon={<RotateCcw size={13} />} label="Start Over" onClick={handleStartOver} />
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

/* ─── ProcessingProgress (matches L1 Prompt Playground pattern) ─── */
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

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
              opacity: isComplete || isActive ? 1 : 0.4,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                ...(isComplete
                  ? { background: '#38A169', color: '#FFFFFF' }
                  : isActive
                    ? { border: `2px solid ${LEVEL_ACCENT}`, background: '#FFFFFF' }
                    : { border: '2px solid #E2E8F0', background: '#FFFFFF' }),
              }}>
                {isComplete ? (
                  <Check size={11} />
                ) : isActive ? (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', border: `2px solid ${LEVEL_ACCENT}`,
                    borderTopColor: LEVEL_ACCENT_DARK, animation: 'ppSpin 0.8s linear infinite',
                  }} />
                ) : null}
              </div>
              <span style={{
                fontSize: 13, fontFamily: FONT,
                fontWeight: isActive ? 600 : 400,
                color: isComplete ? '#38A169' : isActive ? '#1A202C' : '#A0AEC0',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{
        height: 4, background: '#EDF2F7', borderRadius: 2,
        overflow: 'hidden',
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
