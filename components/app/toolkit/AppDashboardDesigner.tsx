import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, Sparkles, ThumbsUp, MessageSquare,
  Upload, X, Plus, Maximize2, Minimize2,
  LayoutDashboard, Users, Layers, BarChart3, Palette, Code2,
  Database, SlidersHorizontal, Smartphone, ShieldCheck, CheckSquare,
} from 'lucide-react';
import {
  DASHBOARD_STEPS, EXAMPLE_BRIEFS,
  VISUAL_STYLE_OPTIONS, PRD_SECTIONS, WHY_MOCKUP_TOOLTIP,
  INSPIRATION_SITES, INSPIRATION_TOOLTIP_CONTENT,
} from '../../../data/dashboard-designer-content';
import {
  useDashboardDesignApi, MAX_REGENERATIONS, MAX_PRD_GENERATIONS,
  type DashboardImageResult,
} from '../../../hooks/useDashboardDesignApi';
import type { DashboardBrief, NewPRDResult } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#F5B8A0';
const LEVEL_ACCENT_DARK = '#8C3A1A';

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
  implementation_plan: ArrowRight,
};

/* ─── SVG Fallback ─── */
function generateDashboardSVG(metricsText: string, title: string): string {
  const colors = ['#38B2AC', '#D47B5A', '#5B6DC2', '#C4A934', '#2BA89C', '#D4A017'];
  const metrics = metricsText ? metricsText.split(',').map(m => m.trim()).filter(Boolean).slice(0, 6) : ['Revenue', 'Users', 'Growth', 'Engagement'];
  return `<svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="800" fill="#F8FAFC"/>
  <rect width="1200" height="70" fill="#FFFFFF"/>
  <rect width="1200" height="1" y="70" fill="#E2E8F0"/>
  <text x="40" y="45" font-family="DM Sans, sans-serif" font-size="24" font-weight="800" fill="#1A202C">${title || 'App'}</text>
  ${metrics.map((m, i) => {
    const x = 40 + (i % 4) * 285;
    const y = 100 + Math.floor(i / 4) * 170;
    const c = colors[i % colors.length];
    const val = Math.floor(Math.random() * 9000 + 1000);
    const chg = (Math.random() * 20 - 5).toFixed(1);
    return `<g>
      <rect x="${x}" y="${y}" width="260" height="140" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="${x + 20}" y="${y + 30}" font-family="DM Sans, sans-serif" font-size="11" font-weight="700" fill="#718096" letter-spacing="0.5px">${m.toUpperCase()}</text>
      <text x="${x + 20}" y="${y + 70}" font-family="DM Sans, sans-serif" font-size="36" font-weight="800" fill="#1A202C">${val.toLocaleString()}</text>
      <rect x="${x + 20}" y="${y + 90}" width="70" height="26" rx="6" fill="${c}18"/>
      <text x="${x + 28}" y="${y + 108}" font-family="DM Sans, sans-serif" font-size="12" font-weight="700" fill="${c}">${Number(chg) > 0 ? '+' : ''}${chg}%</text>
    </g>`;
  }).join('')}
  <rect x="40" y="440" width="740" height="320" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
  <text x="60" y="475" font-family="DM Sans, sans-serif" font-size="18" font-weight="700" fill="#1A202C">Performance Trends</text>
  <polyline points="60,560 120,530 200,500 280,510 360,470 440,450 520,430 600,410 680,400 740,380" fill="none" stroke="#38B2AC" stroke-width="3" stroke-linecap="round"/>
  <rect x="810" y="440" width="350" height="320" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
  <text x="830" y="475" font-family="DM Sans, sans-serif" font-size="18" font-weight="700" fill="#1A202C">Recent Activity</text>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="820" y="${500 + i * 50}" width="330" height="40" rx="8" fill="${i % 2 === 0 ? '#F7FAFC' : '#FFFFFF'}"/>
  <text x="835" y="${525 + i * 50}" font-family="DM Sans, sans-serif" font-size="13" fill="#4A5568">Activity item ${i + 1}</text>`).join('')}
</svg>`;
}

/* ─── JSON Prompt Builder ─── */
function buildJsonPrompt(brief: DashboardBrief, inspirationAnalysis?: string): object {
  const prompt: Record<string, unknown> = {
    image_generation_prompt: {
      subject: 'Web application / single-page app UI mockup',
      app_metadata: {
        title: brief.q1_purpose.slice(0, 80),
        type: brief.q3_type || 'Web Application',
        target_user: brief.q2_audience || 'End users',
        primary_purpose: brief.q1_purpose,
      },
      layout: {
        style: VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'Clean & Minimal',
      },
      key_features: brief.q4_metrics || 'Key features and screens',
      data_sources: brief.q5_dataSources.join(', ') || 'To be determined',
      ...(inspirationAnalysis ? {
        design_reference: {
          source: 'Extracted from uploaded inspiration image(s)',
          patterns: inspirationAnalysis,
          priority: 'CRITICAL — the visual design must closely follow these patterns',
        },
      } : {}),
      rendering_instructions: 'Render as a high-fidelity UI mockup screenshot of a web application. Show realistic placeholder data and content.' +
        (inspirationAnalysis ? ' Apply the design_reference patterns (colours, layout, typography, card styles, spacing) to this mockup.' : ''),
    },
  };
  return prompt;
}

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
      implementation_plan: 'Phase 1: Project setup + core data model. Phase 2: Main CRUD features. Phase 3: Search, filter, polish. Phase 4: Responsive and deploy.',
    },
  };
}

/* ─── Build cohesive PRD deliverable (Markdown) ─── */
function buildFullPRD(result: NewPRDResult): string {
  return [
    `# ${result.prd_content}`,
    '',
    ...Object.entries(result.sections).map(([key, val]) => {
      const def = PRD_SECTIONS.find(s => s.key === key);
      return `## ${def?.title || key}\n\n${val}`;
    }).join('\n\n---\n\n'),
  ].join('\n');
}

/* ────────────────────────────────────────────────────────────
   Shared UI Primitives (inline, per TOOLKIT-PAGE-STANDARD)
   ──────────────────────────────────────────────────────────── */

const StepBadge: React.FC<{ num: number; done: boolean }> = ({ num, done }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 13, fontFamily: FONT, flexShrink: 0,
    ...(done
      ? { background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK }
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
  done: boolean; collapsed: boolean; children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, children }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 16,
    border: done ? `1px solid ${LEVEL_ACCENT}88` : '1px solid #E2E8F0',
    padding: collapsed ? '16px 24px' : '24px 28px',
    transition: 'border-color 0.3s',
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
    {!collapsed && <div style={{ marginTop: 20 }}>{children}</div>}
  </div>
);

const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean }[];
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
              ...(s.done ? { background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK } : { background: '#F7FAFC', border: '2px solid #E2E8F0', color: '#718096' }),
            }}>
              {s.done ? <Check size={12} /> : s.number}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>{s.detail}</div>
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

const StepPlaceholder: React.FC<{
  icon: React.ReactNode; message: string; detail: string;
}> = ({ icon, message, detail }) => (
  <div style={{
    background: '#F7FAFC', borderRadius: 12, border: '1px dashed #E2E8F0',
    padding: '24px 28px', textAlign: 'center',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: '#EDF2F7',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#4A5568', fontFamily: FONT, marginBottom: 6 }}>
      {message}
    </div>
    <div style={{ fontSize: 13, color: '#A0AEC0', fontFamily: FONT, maxWidth: 480, margin: '0 auto' }}>
      {detail}
    </div>
  </div>
);

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

  // ─── Mockup state ───
  const [imageUrl, setImageUrl] = useState('');
  const [dashboardHtml, setDashboardHtml] = useState('');
  const [dashboardSvg, setDashboardSvg] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [jsonPrompt, setJsonPrompt] = useState<object | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'gemini-image' | 'imagen' | 'html' | 'svg' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ─── Approve / feedback ───
  const [mockupApproved, setMockupApproved] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // ─── PRD state ───
  const [prdResult, setPrdResult] = useState<NewPRDResult | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Image upload ───
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzingInspiration, setIsAnalyzingInspiration] = useState(false);
  const [inspirationAnalysis, setInspirationAnalysis] = useState<string | null>(null);

  // ─── Refs ───
  const mockupRef = useRef<HTMLDivElement>(null);
  const prdRef = useRef<HTMLDivElement>(null);
  const toolUsedRef = useRef(false);

  // ─── API ───
  const {
    generateDashboardImage, generatePRD,
    isLoading, isPrdLoading, error, clearError,
    regenerationCount, prdGenerationCount, resetCounts,
  } = useDashboardDesignApi();

  // ─── Derived step state ───
  const hasMockup = imageUrl !== '' || dashboardHtml !== '' || dashboardSvg !== '';
  const step1Done = hasMockup || isLoading;
  const step2Done = mockupApproved;
  const step3Done = prdResult !== null;

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

  const convertImagesToBase64 = useCallback(async (images: { file: File; preview: string }[]): Promise<string[]> => {
    const promises = images.map(img => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(img.file);
    }));
    return Promise.all(promises);
  }, []);

  // ─── Image upload handlers ───
  const handleImageFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    const newImages = validFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setUploadedImages(prev => [...prev, ...newImages]);
    const newNames = validFiles.map(f => f.name);
    updateBrief('q9_uploadedImages', [...brief.q9_uploadedImages, ...newNames]);
  }, [brief.q9_uploadedImages, updateBrief]);

  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
    updateBrief('q9_uploadedImages', brief.q9_uploadedImages.filter((_, i) => i !== index));
  }, [brief.q9_uploadedImages, updateBrief]);

  useEffect(() => {
    return () => { uploadedImages.forEach(img => URL.revokeObjectURL(img.preview)); };
  }, []);

  // ─── Clipboard paste handler for inspiration images ───
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleImageFiles(imageFiles);
        toast('Image pasted from clipboard');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleImageFiles, toast]);

  // ─── Mockup generation ───
  const handleGenerateMockup = async () => {
    if (!canGenerate) return;
    clearError();

    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);

    // Build initial JSON prompt (without inspiration — will be enriched after API returns)
    setJsonPrompt(buildJsonPrompt(updatedBrief));

    setImageUrl(''); setDashboardHtml(''); setDashboardSvg('');
    setMockupApproved(false); setShowFeedbackInput(false); setFeedbackText('');
    setPrdResult(null); setInspirationAnalysis(null);

    setTimeout(() => mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const hasInspirationImages = uploadedImages.length > 0;
    setIsAnalyzingInspiration(hasInspirationImages);

    const inspirationBase64 = uploadedImages.length > 0 ? await convertImagesToBase64(uploadedImages) : undefined;
    const result = await generateDashboardImage(updatedBrief, undefined, undefined, inspirationBase64);
    setIsAnalyzingInspiration(false);

    if (result) {
      setImagePrompt(result.image_prompt || '');

      // Always rebuild JSON prompt with inspiration analysis when available
      const analysis = result.inspiration_analysis || null;
      setInspirationAnalysis(analysis);
      setJsonPrompt(buildJsonPrompt(updatedBrief, analysis || undefined));

      if ((result.generation_method === 'gemini-image' || result.generation_method === 'imagen') && result.image_url) {
        setImageUrl(result.image_url); setGenerationMethod(result.generation_method);
      } else if (result.html_content) {
        setDashboardHtml(result.html_content); setGenerationMethod('html');
      } else if (result.image_url) {
        setImageUrl(result.image_url); setGenerationMethod('gemini-image');
      } else {
        const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
        setDashboardSvg(svg); setGenerationMethod('svg');
        setImagePrompt(`App mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
      }
    } else {
      const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
      setDashboardSvg(svg); setGenerationMethod('svg');
      setImagePrompt(`App mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
    }

    setTimeout(() => mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  // ─── Approve mockup → auto-generate PRD ───
  const handleApproveMockup = async () => {
    setMockupApproved(true);
    setShowFeedbackInput(false);
    toast('Design approved! Generating your PRD...');

    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    clearError();
    const result = await generatePRD(brief, imagePrompt);
    if (result) {
      setPrdResult(result as NewPRDResult);
    } else {
      setPrdResult(generateFallbackPRD(brief));
    }

    if (user && !toolUsedRef.current) {
      upsertToolUsed(user.id, 4);
      toolUsedRef.current = true;
    }

    setTimeout(() => prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  // ─── Submit feedback for refinement ───
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    const feedback = feedbackText.trim();
    const previousPrompt = imagePrompt;

    setShowFeedbackInput(false);
    clearError();

    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);
    // Initial JSON prompt — carry forward previous inspiration analysis
    setJsonPrompt(buildJsonPrompt(updatedBrief, inspirationAnalysis || undefined));

    setImageUrl(''); setDashboardHtml(''); setDashboardSvg('');
    setMockupApproved(false); setPrdResult(null);

    setTimeout(() => mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const inspirationBase64 = uploadedImages.length > 0 ? await convertImagesToBase64(uploadedImages) : undefined;
    if (inspirationBase64) setIsAnalyzingInspiration(true);

    const result = await generateDashboardImage(updatedBrief, feedback, previousPrompt, inspirationBase64);
    setIsAnalyzingInspiration(false);

    if (result) {
      setImagePrompt(result.image_prompt || '');

      // Always rebuild JSON prompt with inspiration analysis
      const analysis = result.inspiration_analysis || inspirationAnalysis || null;
      setInspirationAnalysis(analysis);
      setJsonPrompt(buildJsonPrompt(updatedBrief, analysis || undefined));

      if ((result.generation_method === 'gemini-image' || result.generation_method === 'imagen') && result.image_url) {
        setImageUrl(result.image_url); setGenerationMethod(result.generation_method);
      } else if (result.html_content) {
        setDashboardHtml(result.html_content); setGenerationMethod('html');
      } else if (result.image_url) {
        setImageUrl(result.image_url); setGenerationMethod('gemini-image');
      } else {
        const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
        setDashboardSvg(svg); setGenerationMethod('svg');
        setImagePrompt(`App mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
      }
    } else {
      const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
      setDashboardSvg(svg); setGenerationMethod('svg');
      setImagePrompt(`App mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
    }

    setFeedbackText('');
    setTimeout(() => mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
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

  // ─── Start over ───
  const handleStartOver = () => {
    setBrief({ ...INITIAL_BRIEF });
    setDataSourcesText('');
    setImageUrl(''); setDashboardHtml(''); setDashboardSvg('');
    setImagePrompt(''); setJsonPrompt(null); setGenerationMethod(null); setInspirationAnalysis(null);
    setMockupApproved(false); setShowFeedbackInput(false); setFeedbackText('');
    setPrdResult(null); setShowMarkdown(false);
    setUploadedImages(prev => { prev.forEach(img => URL.revokeObjectURL(img.preview)); return []; });
    resetCounts();
    localStorage.removeItem('oxygy_dashboard-designer_draft');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  /* ─── Textarea auto-height helper ─── */
  const autoHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
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
        margin: 0, marginBottom: 10, fontFamily: FONT,
      }}>
        A <strong style={{ color: '#2D3748' }}>Product Requirements Document (PRD)</strong> is the single most important artefact you need before building any app with AI coding tools. It's the detailed specification — covering purpose, users, layout, features, data, and tech stack — that you paste into tools like <strong style={{ color: '#2D3748' }}>Cursor, Lovable, Bolt.new, or V0</strong> so they know exactly what to build. Without a PRD, vibe coding tools guess; with one, they execute.
      </p>
      <p style={{
        fontSize: 14, color: '#718096', lineHeight: 1.7,
        margin: 0, marginBottom: 20, fontFamily: FONT,
      }}>
        The App Designer walks you through a structured brief, generates a visual mockup you can refine, and produces a production-ready PRD — whether you're building a professional dashboard, a personal side project, or just exploring what's possible. The goal isn't for us to build it for you; it's to give you the confidence and understanding to do it yourself.
      </p>

      {/* ─── How It Works Overview ─── */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Complete your brief', detail: 'Describe what you\'re building, who it\'s for, and what it needs to do', done: step1Done },
          { number: 2, label: 'Review your mockup', detail: 'Approve, refine, or regenerate the visual design', done: step2Done },
          { number: 3, label: 'Your app PRD', detail: '11-section product requirements document', done: step3Done },
        ]}
        outcome="A production-ready PRD you can paste directly into AI coding tools like Cursor, Lovable, or Bolt.new to build your app."
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: FONT }}>
            Quick-fill from an example
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLE_BRIEFS.map(ex => (
              <button
                key={ex.label}
                onClick={() => handleExampleClick(ex)}
                style={{
                  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
                  cursor: 'pointer', fontFamily: FONT, transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
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
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              What does this app or tool need to do? <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <textarea
              value={brief.q1_purpose}
              onChange={e => { updateBrief('q1_purpose', e.target.value); autoHeight(e.target); }}
              placeholder="e.g., Track my daily habits and show streaks over time, or Build a sales dashboard that flags underperforming regions..."
              rows={2}
              style={{
                width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q2: Audience */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              Who will use this? Describe the target users.
            </label>
            <textarea
              value={brief.q2_audience}
              onChange={e => { updateBrief('q2_audience', e.target.value); autoHeight(e.target); }}
              placeholder="e.g., Just me — I want a simple personal tool, or HR managers who need to track team training progress"
              rows={2}
              style={{
                width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q3: Type */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              What type of app or tool is this?
            </label>
            <textarea
              value={brief.q3_type}
              onChange={e => { updateBrief('q3_type', e.target.value); autoHeight(e.target); }}
              placeholder="e.g., A personal habit tracker with a calendar view, or An operational dashboard with KPI cards and charts"
              rows={2}
              style={{
                width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q4: Metrics */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              Key features, screens, or metrics
            </label>
            <textarea
              value={brief.q4_metrics}
              onChange={e => { updateBrief('q4_metrics', e.target.value); autoHeight(e.target); }}
              placeholder="e.g., Daily check-in view, streak counter, weekly summary chart — or Revenue, Conversion Rate, Pipeline Value"
              rows={2}
              style={{
                width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q5: Data sources */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              Where does the data come from? (optional)
            </label>
            <input
              value={dataSourcesText}
              onChange={e => setDataSourcesText(e.target.value)}
              placeholder="e.g., User input, local storage, Supabase, Google Sheets, Salesforce API"
              style={{
                width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px',
                fontSize: 13, fontFamily: FONT, color: '#2D3748', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q7: Visual style (optional) */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              Visual style <span style={{ fontWeight: 400, color: '#A0AEC0' }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VISUAL_STYLE_OPTIONS.map(vs => (
                <button
                  key={vs.id}
                  onClick={() => updateBrief('q7_visualStyle', vs.id)}
                  style={{
                    background: brief.q7_visualStyle === vs.id ? `${LEVEL_ACCENT}30` : '#F7FAFC',
                    border: brief.q7_visualStyle === vs.id ? `2px solid ${LEVEL_ACCENT}` : '1px solid #E2E8F0',
                    borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600,
                    color: brief.q7_visualStyle === vs.id ? LEVEL_ACCENT_DARK : '#4A5568',
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  {vs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q9: Inspiration (images) */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
              Inspiration images (optional)
              <InfoTooltip content={INSPIRATION_TOOLTIP_CONTENT} />
            </label>

            {/* Inspiration sites */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {INSPIRATION_SITES.map(site => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11, fontWeight: 600, color: '#5A67D8', fontFamily: FONT,
                    background: '#EBF4FF', borderRadius: 6, padding: '3px 8px',
                    textDecoration: 'none',
                  }}
                >
                  {site.name}
                </a>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
                if (e.dataTransfer.files.length > 0) handleImageFiles(e.dataTransfer.files);
              }}
              style={{
                border: isDragOver ? `2px dashed ${LEVEL_ACCENT}` : '2px dashed #E2E8F0',
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                cursor: 'pointer', background: isDragOver ? `${LEVEL_ACCENT}08` : '#F7FAFC',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} color="#A0AEC0" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 13, color: '#718096', fontFamily: FONT }}>
                Drop screenshots here, click to upload, or <strong style={{ color: '#4A5568' }}>paste from clipboard</strong> (Ctrl+V / Cmd+V)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) handleImageFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* Uploaded previews */}
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {uploadedImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveImage(i); }}
                      style={{
                        position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                        background: '#1A202C', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleGenerateMockup}
            disabled={!canGenerate || isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: canGenerate && !isLoading ? '#38B2AC' : '#CBD5E0',
              color: '#FFFFFF', border: 'none', borderRadius: 24,
              padding: '10px 22px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: canGenerate && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'ppSpin 0.7s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate Mockup
              </>
            )}
          </button>
          {regenerationCount > 0 && (
            <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
              {regenerationCount}/{MAX_REGENERATIONS} generations used
            </span>
          )}
        </div>

        {error && !hasMockup && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10, fontSize: 13, color: '#C53030', fontFamily: FONT }}>
            {error}
          </div>
        )}
      </StepCard>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 2 — Review your mockup
      ═══════════════════════════════════════════ */}
      <div ref={mockupRef}>
        <StepCard
          stepNumber={2}
          title="Review your mockup"
          subtitle="Approve, refine with feedback, or regenerate the visual design."
          done={step2Done}
          collapsed={step2Done && step3Done}
        >
          {!hasMockup && !isLoading ? (
            <StepPlaceholder
              icon={<ArrowRight size={16} color="#A0AEC0" />}
              message="Complete your brief above to generate a mockup"
              detail="Once you describe your app's purpose and features, we'll generate a visual mockup you can review and approve before generating the full PRD."
            />
          ) : (
            <>
              {/* Loading state */}
              {isLoading && (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: LEVEL_ACCENT,
                    borderRadius: '50%', animation: 'ppSpin 0.7s linear infinite',
                    margin: '0 auto 16px',
                  }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>
                    {isAnalyzingInspiration ? 'Analyzing inspiration images...' : 'Generating your app mockup...'}
                  </div>
                  <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT, marginTop: 4 }}>
                    This typically takes 15-30 seconds
                  </div>
                </div>
              )}

              {/* Mockup display */}
              {hasMockup && !isLoading && (
                <div>
                  {/* Side-by-side: Mockup (left) + JSON Prompt (right) */}
                  <div style={{
                    display: 'flex', gap: 16, marginBottom: 16,
                    ...(isFullScreen ? {
                      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
                      zIndex: 100, margin: 0, background: '#FFFFFF', padding: 0,
                    } : {}),
                  }}>
                    {/* LEFT — Mockup */}
                    <div style={{
                      flex: isFullScreen ? 1 : '0 0 62%',
                      borderRadius: isFullScreen ? 0 : 12, overflow: 'hidden',
                      border: '1px solid #E2E8F0', background: '#FFFFFF',
                    }}>
                      {/* Top bar */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 14px', background: '#F7FAFC', borderBottom: '1px solid #E2E8F0',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', fontFamily: FONT }}>
                          {generationMethod === 'html' ? 'HTML Mockup' : generationMethod === 'svg' ? 'SVG Preview' : 'AI-Generated Mockup'}
                        </span>
                        <button
                          onClick={() => setIsFullScreen(!isFullScreen)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: 0 }}
                        >
                          {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                      </div>

                      {/* Mockup content */}
                      <div style={{
                        height: isFullScreen ? 'calc(100vh - 40px)' : 460, overflow: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {imageUrl && (
                          <img src={imageUrl} alt="App mockup" style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                        )}
                        {dashboardHtml && (
                          <iframe
                            srcDoc={dashboardHtml}
                            title="App mockup"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            sandbox="allow-scripts"
                          />
                        )}
                        {dashboardSvg && (
                          <div
                            style={{ width: '100%', height: '100%' }}
                            dangerouslySetInnerHTML={{ __html: dashboardSvg }}
                          />
                        )}
                      </div>
                    </div>

                    {/* RIGHT — JSON Prompt */}
                    {!isFullScreen && jsonPrompt && (
                      <div style={{
                        flex: '0 0 36%',
                        borderRadius: 12, overflow: 'hidden',
                        border: '1px solid #E2E8F0', background: '#1A202C',
                        display: 'flex', flexDirection: 'column',
                      }}>
                        {/* Header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 14px', background: '#2D3748', borderBottom: '1px solid #4A5568',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Code size={13} color="#A0AEC0" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', fontFamily: FONT }}>
                              JSON Prompt
                            </span>
                            <InfoTooltip content="A structured JSON prompt is the most effective way to instruct image generation models. Unlike free-text prompts, JSON organises your requirements into clear fields — purpose, layout, features, style — so the AI can interpret each dimension precisely. This is the exact prompt that was sent to generate your mockup." />
                          </div>
                          <button
                            onClick={async () => {
                              await copyText(JSON.stringify(jsonPrompt, null, 2));
                              toast('JSON prompt copied');
                            }}
                            style={{
                              background: '#4A5568', color: '#E2E8F0', border: 'none', borderRadius: 6,
                              padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT,
                            }}
                          >
                            <Copy size={10} /> Copy
                          </button>
                        </div>

                        {/* JSON content */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
                          <pre style={{
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            fontSize: 11, lineHeight: 1.7, color: '#E2E8F0',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                          }}>
                            {JSON.stringify(jsonPrompt, null, 2)}
                          </pre>
                        </div>

                        {/* Image prompt (text) if different from JSON */}
                        {imagePrompt && (
                          <div style={{
                            borderTop: '1px solid #4A5568', padding: '10px 16px',
                            background: '#2D3748',
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: FONT }}>
                              Generated text prompt
                            </div>
                            <div style={{
                              fontSize: 11, color: '#A0AEC0', lineHeight: 1.5, fontFamily: FONT,
                              maxHeight: 80, overflow: 'auto',
                            }}>
                              {imagePrompt.length > 300 ? imagePrompt.slice(0, 300) + '...' : imagePrompt}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* "Why mockup first?" tooltip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                    <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>Why generate a mockup first?</span>
                    <InfoTooltip content={WHY_MOCKUP_TOOLTIP} />
                  </div>

                  {/* Action buttons */}
                  {!mockupApproved && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleApproveMockup}
                        disabled={isPrdLoading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#38A169', color: '#FFFFFF', border: 'none', borderRadius: 24,
                          padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
                          cursor: 'pointer',
                        }}
                      >
                        <ThumbsUp size={15} /> Approve Design
                      </button>
                      <button
                        onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#FFFFFF', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: 24,
                          padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
                          cursor: 'pointer',
                        }}
                      >
                        <MessageSquare size={15} /> Give Feedback
                      </button>
                      <button
                        onClick={handleGenerateMockup}
                        disabled={isLoading || regenerationCount >= MAX_REGENERATIONS}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#FFFFFF', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: 24,
                          padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
                          cursor: 'pointer', opacity: regenerationCount >= MAX_REGENERATIONS ? 0.5 : 1,
                        }}
                      >
                        <RotateCcw size={15} /> Regenerate
                      </button>
                    </div>
                  )}

                  {/* Feedback input */}
                  {showFeedbackInput && !mockupApproved && (
                    <div style={{ marginTop: 14, background: '#F7FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                      <textarea
                        value={feedbackText}
                        onChange={e => { setFeedbackText(e.target.value); autoHeight(e.target); }}
                        placeholder="Describe what you'd like changed, e.g., 'Make the KPI cards bigger', 'Add a pie chart for category breakdown', 'Use a darker color scheme'..."
                        rows={3}
                        style={{
                          width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px',
                          fontSize: 13, fontFamily: FONT, color: '#2D3748', resize: 'none', lineHeight: 1.6,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={!feedbackText.trim() || isLoading}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: feedbackText.trim() ? '#38B2AC' : '#CBD5E0',
                            color: '#FFFFFF', border: 'none', borderRadius: 24,
                            padding: '8px 18px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                            cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Sparkles size={13} /> Refine Mockup
                        </button>
                        <button
                          onClick={() => { setShowFeedbackInput(false); setFeedbackText(''); }}
                          style={{
                            background: '#FFFFFF', color: '#718096', border: '1px solid #E2E8F0',
                            borderRadius: 24, padding: '8px 14px', fontSize: 12, fontWeight: 600,
                            fontFamily: FONT, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10, fontSize: 13, color: '#C53030', fontFamily: FONT }}>
                      {error}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </StepCard>
      </div>

      <StepConnector />

      {/* ═══════════════════════════════════════════
          STEP 3 — Your app PRD
      ═══════════════════════════════════════════ */}
      <div ref={prdRef}>
        <StepCard
          stepNumber={3}
          title="Your app PRD"
          subtitle="A comprehensive product requirements document for development handoff."
          done={step3Done}
          collapsed={false}
        >
          {!step2Done && !isPrdLoading ? (
            /* ─── Educational default ─── */
            <div>
              <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, marginBottom: 16, fontFamily: FONT }}>
                Your PRD will be structured using <strong>11 production-grade sections</strong> optimised for AI coding tools like Cursor, Lovable, Bolt.new, and V0. Each section gives the AI the exact constraints and specifications it needs — tech stack, data models, feature behaviours, and acceptance criteria. Approve your mockup above and each section will be filled with content tailored to your specific app.
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
                        opacity: 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {Icon && <Icon size={14} color={s.color} />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FONT }}>
                          {s.title}
                        </span>
                        <span style={{ fontSize: 10, color: '#A0AEC0', fontFamily: FONT, marginLeft: 'auto' }}>
                          {i + 1}/11
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>
                        {s.description}
                      </div>
                      {s.example && (
                        <div style={{
                          marginTop: 8, padding: '8px 12px', borderRadius: 6,
                          background: `${s.color}18`, borderLeft: `3px solid ${s.color}`,
                          fontSize: 12, color: '#4A5568', fontStyle: 'italic', lineHeight: 1.5, fontFamily: FONT,
                        }}>
                          {s.example}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Summary footer */}
              <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: 10, marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {EDUCATIONAL_PRD_SECTIONS.map(s => {
                  const Icon = PRD_SECTION_ICONS[s.key];
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {Icon && <Icon size={11} color={s.color} />}
                      <span style={{ fontSize: 10, color: '#718096', fontFamily: FONT }}>{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isPrdLoading ? (
            /* ─── PRD Loading skeleton ─── */
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4A5568', fontFamily: FONT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, border: '2px solid #E2E8F0', borderTopColor: LEVEL_ACCENT, borderRadius: '50%', animation: 'ppSpin 0.7s linear infinite' }} />
                Generating your PRD...
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {PRD_SECTIONS.map((s, i) => (
                  <div key={s.key} style={{
                    borderRadius: 10, padding: '16px 18px', background: '#F7FAFC',
                    border: '1px solid #E2E8F0', animation: 'ppPulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}>
                    <div style={{ width: 120, height: 12, borderRadius: 4, background: '#E2E8F0', marginBottom: 8 }} />
                    <div style={{ width: '90%', height: 10, borderRadius: 4, background: '#EDF2F7' }} />
                    <div style={{ width: '70%', height: 10, borderRadius: 4, background: '#EDF2F7', marginTop: 4 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : prdResult ? (
            /* ─── PRD Result ─── */
            <div>
              {/* Top action row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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

              {/* Cards / Markdown toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setShowMarkdown(false)}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                      border: 'none', cursor: 'pointer',
                      background: !showMarkdown ? '#1A202C' : 'transparent',
                      color: !showMarkdown ? '#FFFFFF' : '#718096',
                    }}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setShowMarkdown(true)}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT,
                      border: 'none', cursor: 'pointer',
                      background: showMarkdown ? '#2B6CB0' : 'transparent',
                      color: showMarkdown ? '#FFFFFF' : '#718096',
                    }}
                  >
                    Markdown
                  </button>
                </div>
                <InfoTooltip content="Markdown view shows the cohesive PRD deliverable — ready to paste into AI coding tools like Cursor, Lovable, or Bolt.new. Cards view shows all sections for individual review." />
              </div>

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
                /* ─── Cards view ─── */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(prdResult.sections).map(([key, val], i) => {
                    const def = PRD_SECTIONS.find(s => s.key === key);
                    const color = LEVEL_ACCENT_DARK;
                    const Icon = PRD_SECTION_ICONS[key];
                    const isVisible = i < visibleBlocks;
                    return (
                      <div
                        key={key}
                        style={{
                          borderLeft: `4px solid ${color}`,
                          background: `${color}12`,
                          borderRadius: 10, padding: '16px 18px',
                          position: 'relative',
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                          transition: 'opacity 0.3s, transform 0.3s',
                        }}
                      >
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          {Icon && <Icon size={14} color={color} />}
                          <span style={{
                            fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase',
                            letterSpacing: '0.04em', fontFamily: FONT,
                          }}>
                            {def?.title || key}
                          </span>
                          {/* Copy section button */}
                          <button
                            onClick={() => handleCopySection(key, val)}
                            style={{
                              marginLeft: 'auto', background: 'none', border: 'none',
                              cursor: 'pointer', padding: 2, color: '#A0AEC0',
                            }}
                          >
                            {copiedSection === key ? <Check size={13} color="#38A169" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {/* Section content */}
                        <div style={{
                          fontSize: 13, color: '#2D3748', lineHeight: 1.7, fontFamily: FONT,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom action row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                <ActionBtn
                  icon={<RotateCcw size={13} />}
                  label="Start Over"
                  onClick={handleStartOver}
                />
                <ActionBtn
                  icon={<Library size={13} />}
                  label={savedToLibrary ? 'Saved!' : 'Save to Prompt Library'}
                  onClick={handleSaveToLibrary}
                  accent
                  disabled={savedToLibrary}
                />
              </div>
            </div>
          ) : null}
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

export default AppDashboardDesigner;