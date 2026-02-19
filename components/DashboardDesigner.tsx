import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Monitor, Sparkles, FileText, Loader2, Check,
  RotateCcw, Copy, ChevronDown, X, Plus, Info,
  Download, Maximize2, Minimize2, ExternalLink, ClipboardList,
  ThumbsUp, MessageSquare, Upload,
  LayoutDashboard, Users, Layers, BarChart3, Palette, Code2,
  Database, SlidersHorizontal, Smartphone, ShieldCheck, CheckSquare,
} from 'lucide-react';
import {
  useDashboardDesignApi,
  MAX_REGENERATIONS,
  MAX_PRD_GENERATIONS,
  type DashboardImageResult,
} from '../hooks/useDashboardDesignApi';
import { ArtifactClosing } from './ArtifactClosing';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { upsertToolUsed } from '../lib/database';
import type { DashboardBrief, NewPRDResult } from '../types';
import {
  DASHBOARD_STEPS,
  EXAMPLE_BRIEFS,
  DASHBOARD_TYPE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  PRD_SECTIONS,
  WHY_MOCKUP_TOOLTIP,
  INSPIRATION_SITES,
  INSPIRATION_TOOLTIP_CONTENT,
} from '../data/dashboard-designer-content';

// ─── Constants ───
const ACCENT = '#F5B8A0';
const DARK_ACCENT = '#D47B5A';

const INITIAL_BRIEF: DashboardBrief = {
  q1_purpose: '', q2_audience: '', q3_type: '',
  q4_metrics: '', q5_dataSources: [], q5_otherSource: '',
  q6_frequency: '', q7_visualStyle: '', q8_colorScheme: '', q8_customColor: '',
  q9_inspirationUrls: [], q9_uploadedImages: [],
};

// ─── PRD Section Icon Map ───
const PRD_SECTION_ICONS: Record<string, React.ElementType> = {
  dashboard_overview: LayoutDashboard,
  target_users: Users,
  information_architecture: Layers,
  widget_specifications: BarChart3,
  visual_design: Palette,
  tech_stack: Code2,
  data_integration: Database,
  interactions_filtering: SlidersHorizontal,
  responsive_behavior: Smartphone,
  human_checkpoints: ShieldCheck,
  acceptance_criteria: CheckSquare,
};

// ─── SVG Fallback ───
function generateDashboardSVG(metricsText: string, title: string): string {
  const colors = ['#38B2AC', '#D47B5A', '#5B6DC2', '#C4A934', '#2BA89C', '#D4A017'];
  const metrics = metricsText ? metricsText.split(',').map(m => m.trim()).filter(Boolean).slice(0, 6) : ['Revenue', 'Users', 'Growth', 'Engagement'];
  return `<svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="800" fill="#F8FAFC"/>
  <rect width="1200" height="70" fill="#FFFFFF"/>
  <rect width="1200" height="1" y="70" fill="#E2E8F0"/>
  <text x="40" y="45" font-family="DM Sans, sans-serif" font-size="24" font-weight="800" fill="#1A202C">${title || 'Dashboard'}</text>
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

// ─── JSON Prompt Builder ───
function buildJsonPrompt(brief: DashboardBrief): object {
  return {
    image_generation_prompt: {
      subject: 'Professional dashboard UI mockup',
      dashboard_metadata: {
        title: brief.q1_purpose.slice(0, 80),
        type: brief.q3_type || 'General Dashboard',
        target_user: brief.q2_audience || 'Business users',
        primary_purpose: brief.q1_purpose,
      },
      layout: {
        style: VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'Clean & Minimal',
      },
      metrics: brief.q4_metrics || 'Key business metrics',
      data_sources: brief.q5_dataSources.join(', ') || 'To be determined',
      rendering_instructions: 'Render as a high-fidelity UI mockup screenshot of a web dashboard application. Show realistic placeholder data in all charts and metrics.',
    },
  };
}

// ─── Simple PRD Fallback ───
function generateFallbackPRD(brief: DashboardBrief): NewPRDResult {
  const metrics = brief.q4_metrics || 'key metrics';
  const dataSources = brief.q5_dataSources.join(', ') || 'To be determined';
  return {
    prd_content: `PRD: ${brief.q1_purpose.slice(0, 60)} Dashboard`,
    sections: {
      dashboard_overview: `This dashboard provides ${brief.q2_audience || 'business users'} with real-time visibility into ${metrics}. Its primary purpose is: ${brief.q1_purpose}`,
      target_users: `Primary users: ${brief.q2_audience || 'Business stakeholders'}. As a user, I want to see ${metrics} so that I can make data-driven decisions.`,
      information_architecture: `The dashboard uses a ${VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'clean'} layout with KPI cards at the top, trend charts in the middle, and detailed data tables below.`,
      widget_specifications: `Metrics to display: ${metrics}. Each metric should have a KPI card with current value, trend arrow, and sparkline.`,
      visual_design: `Style: ${VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'Clean & Minimal'}. Typography: DM Sans. Cards use 1px solid borders with 16px border radius.`,
      tech_stack: 'React + TypeScript for frontend. Recharts or Tremor for charts. Supabase or similar for backend. Vercel for hosting.',
      data_integration: `Data sources: ${dataSources}.`,
      interactions_filtering: 'Date range picker, metric filtering dropdown, and drill-down capability on each widget.',
      responsive_behavior: 'Desktop: 3-column grid. Tablet: 2-column grid. Mobile: single column stack with collapsible sections.',
      human_checkpoints: 'Data accuracy review before publishing. Stakeholder sign-off on metric definitions. QA review of responsive behavior.',
      acceptance_criteria: '1. All listed metrics display with current values. 2. Charts render with realistic placeholder data. 3. Page loads in under 2 seconds. 4. Responsive on mobile, tablet, desktop.',
    },
  };
}

// ─── Inline Sub-Components ───

// Info Tooltip (hover-based)
function InfoTooltip({ content }: { content: string }) {
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
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-[#A0AEC0] hover:text-[#718096] transition-colors ml-1.5"
        aria-label="More information"
      >
        <Info size={15} />
      </button>
      {open && (
        <div
          className="absolute z-50 left-0 top-full mt-2 bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm"
          style={{ maxWidth: '340px', minWidth: '260px' }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="text-[13px] text-[#4A5568] leading-[1.6]">{content}</div>
        </div>
      )}
    </div>
  );
}

// JSON Syntax Highlighted Code Block
function JsonCodeBlock({ data, onCopy }: { data: object; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = json.replace(
    /(".*?")\s*:/g,
    '<span style="color:#4FD1C5">$1</span>:'
  ).replace(
    /:\s*(".*?")/g,
    ': <span style="color:#F5B8A0">$1</span>'
  ).replace(
    /([[\]{}])/g,
    '<span style="color:#A0AEC0">$1</span>'
  );

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: '#1A202C' }}>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-1.5 transition-colors z-10"
        style={{ backgroundColor: '#2D3748', color: '#A0AEC0' }}
      >
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
      </button>
      <pre
        className="p-5 text-[12px] leading-[1.7] overflow-x-auto max-h-[360px] overflow-y-auto"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: '#E2E8F0' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
        role="code"
        aria-label="Generated JSON prompt"
      />
    </div>
  );
}

// ─── Main Component ───
export const DashboardDesigner: React.FC = () => {
  const { user } = useAuth();
  // Brief state
  const [brief, setBrief] = useState<DashboardBrief>({ ...INITIAL_BRIEF });
  const [dataSourcesText, setDataSourcesText] = useState('');

  // Mockup state
  const [imageUrl, setImageUrl] = useState('');
  const [dashboardHtml, setDashboardHtml] = useState('');
  const [dashboardSvg, setDashboardSvg] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [jsonPrompt, setJsonPrompt] = useState<object | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'gemini-image' | 'imagen' | 'html' | 'svg' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Refinement tracking
  const [isRefinement, setIsRefinement] = useState(false);

  // Approve / Feedback state
  const [mockupApproved, setMockupApproved] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // PRD state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [prdResult, setPrdResult] = useState<NewPRDResult | null>(null);
  const [showFullPrd, setShowFullPrd] = useState(false);
  const [showPrdSectionsOverview, setShowPrdSectionsOverview] = useState(false);
  const [prdProgressStep, setPrdProgressStep] = useState(0);

  // Inspiration analysis state
  const [isAnalyzingInspiration, setIsAnalyzingInspiration] = useState(false);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // UI
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Refs
  const mockupRef = useRef<HTMLDivElement>(null);
  const prdRef = useRef<HTMLDivElement>(null);

  // API
  const {
    generateDashboardImage, generatePRD,
    isLoading, isPrdLoading, error, clearError,
    regenerationCount, prdGenerationCount, resetCounts,
  } = useDashboardDesignApi();

  // ─── Helpers ───
  const hasMockup = imageUrl !== '' || dashboardHtml !== '' || dashboardSvg !== '';

  const filledFieldsCount = [
    brief.q1_purpose.trim().length > 0,
    brief.q2_audience.trim().length > 0,
    brief.q3_type.length > 0,
    brief.q4_metrics.trim().length > 0,
    dataSourcesText.trim().length > 0,
    brief.q7_visualStyle.length > 0,
  ].filter(Boolean).length;

  const canGenerate = brief.q1_purpose.trim().length > 0;

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  const copyToClipboard = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Copied to clipboard');
    }
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, [toast]);

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

  // ─── Image Upload Handlers ───
  const handleImageFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages(prev => [...prev, ...newImages]);

    // Also store filenames in the brief
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  }, [handleImageFiles]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // PRD loading progress simulation
  useEffect(() => {
    if (!isPrdLoading) {
      setPrdProgressStep(0);
      return;
    }
    setPrdProgressStep(0);
    const interval = setInterval(() => {
      setPrdProgressStep(prev => {
        if (prev >= PRD_SECTIONS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [isPrdLoading]);

  // ─── Scroll to mockup helper ───
  const scrollToMockup = useCallback(() => {
    setTimeout(() => {
      mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // ─── Generation Handlers ───
  const handleGenerateMockup = async () => {
    if (!canGenerate) return;
    clearError();
    setIsRefinement(false);

    // Sync data sources text into brief
    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);

    const prompt = buildJsonPrompt(updatedBrief);
    setJsonPrompt(prompt);

    // Reset previous results
    setImageUrl('');
    setDashboardHtml('');
    setDashboardSvg('');
    setMockupApproved(false);
    setShowFeedbackInput(false);
    setFeedbackText('');
    setPrdResult(null);
    setShowFullPrd(false);

    // Scroll to mockup section immediately to show loading
    scrollToMockup();

    const hasInspirationImages = uploadedImages.length > 0;
    setIsAnalyzingInspiration(hasInspirationImages);

    // Convert uploaded inspiration images to base64 for AI analysis
    const inspirationBase64 = uploadedImages.length > 0 ? await convertImagesToBase64(uploadedImages) : undefined;
    const result = await generateDashboardImage(updatedBrief, undefined, undefined, inspirationBase64);

    setIsAnalyzingInspiration(false);

    if (result) {
      setImagePrompt(result.image_prompt || '');

      if ((result.generation_method === 'gemini-image' || result.generation_method === 'imagen') && result.image_url) {
        setImageUrl(result.image_url);
        setGenerationMethod(result.generation_method);
      } else if (result.html_content) {
        setDashboardHtml(result.html_content);
        setGenerationMethod('html');
      } else if (result.image_url) {
        setImageUrl(result.image_url);
        setGenerationMethod('gemini-image');
      } else {
        console.warn('API returned result without usable content:', result);
        const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
        setDashboardSvg(svg);
        setImagePrompt(`Dashboard mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
        setGenerationMethod('svg');
      }
    } else {
      console.warn('Dashboard API returned null — using SVG fallback.');
      const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
      setDashboardSvg(svg);
      setImagePrompt(`Dashboard mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
      setGenerationMethod('svg');
    }

    setTimeout(() => {
      mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleApproveMockup = async () => {
    setMockupApproved(true);
    setShowFeedbackInput(false);
    toast('Design approved! Generating your PRD...');

    // Scroll to PRD section immediately to show loading
    setTimeout(() => {
      prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Auto-generate PRD
    clearError();
    const result = await generatePRD(brief, imagePrompt);
    if (result) {
      setPrdResult(result as NewPRDResult);
    } else {
      setPrdResult(generateFallbackPRD(brief));
    }
    if (user) upsertToolUsed(user.id, 4);

    setTimeout(() => {
      prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    const feedback = feedbackText.trim();
    const previousPrompt = imagePrompt;

    setShowFeedbackInput(false);
    setIsRefinement(true);
    clearError();

    // Sync data sources text into brief
    const updatedBrief = { ...brief, q5_dataSources: dataSourcesText.trim() ? [dataSourcesText.trim()] : [] };
    setBrief(updatedBrief);

    const prompt = buildJsonPrompt(updatedBrief);
    setJsonPrompt(prompt);

    // Reset previous results
    setImageUrl('');
    setDashboardHtml('');
    setDashboardSvg('');
    setMockupApproved(false);
    setPrdResult(null);
    setShowFullPrd(false);

    // Scroll to mockup section immediately to show loading
    scrollToMockup();

    // Convert uploaded inspiration images so they're also analyzed during feedback regeneration
    const inspirationBase64 = uploadedImages.length > 0 ? await convertImagesToBase64(uploadedImages) : undefined;
    if (inspirationBase64) {
      setIsAnalyzingInspiration(true);
    }

    const result = await generateDashboardImage(updatedBrief, feedback, previousPrompt, inspirationBase64);

    setIsAnalyzingInspiration(false);

    if (result) {
      setImagePrompt(result.image_prompt || '');

      if ((result.generation_method === 'gemini-image' || result.generation_method === 'imagen') && result.image_url) {
        setImageUrl(result.image_url);
        setGenerationMethod(result.generation_method);
      } else if (result.html_content) {
        setDashboardHtml(result.html_content);
        setGenerationMethod('html');
      } else if (result.image_url) {
        setImageUrl(result.image_url);
        setGenerationMethod('gemini-image');
      } else {
        console.warn('API returned result without usable content:', result);
        const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
        setDashboardSvg(svg);
        setImagePrompt(`Dashboard mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
        setGenerationMethod('svg');
      }
    } else {
      console.warn('Dashboard API returned null — using SVG fallback.');
      const svg = generateDashboardSVG(updatedBrief.q4_metrics, updatedBrief.q1_purpose.slice(0, 40));
      setDashboardSvg(svg);
      setImagePrompt(`Dashboard mockup for ${updatedBrief.q2_audience || 'users'}: ${updatedBrief.q4_metrics || updatedBrief.q1_purpose.slice(0, 60)}`);
      setGenerationMethod('svg');
    }

    setFeedbackText('');
    setIsRefinement(false);

    setTimeout(() => {
      mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleGeneratePRD = async () => {
    if (prdGenerationCount >= MAX_PRD_GENERATIONS) {
      toast(`Maximum ${MAX_PRD_GENERATIONS} PRD generations reached for this session.`);
      return;
    }
    clearError();

    // Scroll to PRD section immediately to show loading
    setTimeout(() => {
      prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const result = await generatePRD(brief, imagePrompt);
    if (result) {
      setPrdResult(result as NewPRDResult);
    } else {
      setPrdResult(generateFallbackPRD(brief));
    }
    if (user) upsertToolUsed(user.id, 4);

    setTimeout(() => {
      prdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

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

  const handleStartOver = () => {
    setBrief({ ...INITIAL_BRIEF });
    setDataSourcesText('');
    setImageUrl('');
    setDashboardHtml('');
    setDashboardSvg('');
    setImagePrompt('');
    setJsonPrompt(null);
    setGenerationMethod(null);
    setIsRefinement(false);
    setMockupApproved(false);
    setShowFeedbackInput(false);
    setFeedbackText('');
    setPrdResult(null);
    setShowFullPrd(false);
    setShowPrdSectionsOverview(false);
    setUploadedImages(prev => {
      prev.forEach(img => URL.revokeObjectURL(img.preview));
      return [];
    });
    resetCounts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportMarkdown = () => {
    if (!prdResult) return;
    const md = Object.entries(prdResult.sections)
      .map(([key, val]) => {
        const def = PRD_SECTIONS.find(s => s.key === key);
        return `## ${def?.title || key}\n\n${val}`;
      })
      .join('\n\n---\n\n');
    const fullMd = `# ${prdResult.prd_content}\n\n${md}`;
    const blob = new Blob([fullMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-prd.md';
    a.click();
    URL.revokeObjectURL(url);
    setCopiedId('export-md');
    toast('Markdown exported');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* ═══════════════════════════════════════════
            SECTION A — Breadcrumb + Centered Title
        ═══════════════════════════════════════════ */}
        <a href="#" onClick={e => { e.preventDefault(); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] hover:text-[#D47B5A] transition-colors mb-8">
          <ArrowLeft size={16} /> Home
        </a>

        <div className="mb-8 text-center">
          <div
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#FFF0EB', color: DARK_ACCENT, border: `1px solid ${ACCENT}` }}
          >
            Level 4 &mdash; Interactive Dashboards
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15] mb-6">
            Dashboard<br />
            <span className="relative inline-block">
              Designer
              <span className="absolute left-0 -bottom-1 w-full h-[4px] rounded-full opacity-80" style={{ backgroundColor: DARK_ACCENT }} />
            </span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[700px] mx-auto mt-2">
            Share your needs, generate an AI-powered mockup, refine it with feedback, and export a production-ready PRD &mdash; all in one tool.
          </p>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION B — Fun Fact Card
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <div
            className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,184,160,0.15) 0%, rgba(212,123,90,0.08) 50%, rgba(245,184,160,0.12) 100%)',
              border: '1.5px solid #F5B8A0',
            }}
          >
            <div className="absolute top-3 left-4 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D47B5A] opacity-40" />
              <span className="w-2 h-2 rounded-full bg-[#F5B8A0] opacity-60" />
              <span className="w-2 h-2 rounded-full bg-[#D47B5A] opacity-30" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D47B5A] mb-3">Did you know?</p>
            <p className="text-[17px] md:text-[19px] text-[#2D3748] font-bold leading-tight">
              <span className="text-[#D47B5A]">73%</span> of AI projects fail to deliver value because outputs never reach decision-makers.
            </p>
            <p className="text-[15px] text-[#718096] leading-tight mt-2">
              Design your dashboard below &mdash; from audience brief to AI-generated mockup to a handoff-ready PRD.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION C — 3-Card Step Overview
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DASHBOARD_STEPS.map(step => (
              <div key={step.num} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(245,184,160,0.25)', color: DARK_ACCENT }}
                  >
                    {step.num}
                  </div>
                  <span className="text-[16px] font-bold text-[#1A202C]">{step.label}</span>
                </div>
                <p className="text-[14px] font-medium text-[#2D3748] mb-2">{step.question}</p>
                <p className="text-[13px] text-[#718096] leading-[1.5] mb-3">{step.desc}</p>
                <p className="text-[12px] leading-snug" style={{ color: '#A0AEC0' }}>
                  <span className="font-semibold" style={{ color: '#718096' }}>Examples:</span> {step.examples}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION D — Step 1: Single Condensed Input Card
        ═══════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(245,184,160,0.12) 0%, rgba(245,184,160,0.06) 100%)',
            border: '1.5px solid #F5B8A0',
          }}
        >
          <h2 className="text-[20px] md:text-[24px] font-bold text-[#1A202C] mb-4">Define Your Dashboard Brief</h2>

          {/* Example pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mr-1">Try an Example</span>
            {EXAMPLE_BRIEFS.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(ex)}
                className="px-3 py-1 rounded-full text-[13px] transition-colors"
                style={{ border: '1px solid #F5B8A0', backgroundColor: 'rgba(245,184,160,0.08)', color: '#92530A' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = DARK_ACCENT; (e.target as HTMLElement).style.backgroundColor = 'rgba(245,184,160,0.2)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#F5B8A0'; (e.target as HTMLElement).style.backgroundColor = 'rgba(245,184,160,0.08)'; }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Two-column grid for questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Q1: Dashboard Purpose (full width) — REQUIRED */}
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                What is the primary purpose of this dashboard? <span className="text-[#D47B5A]">*</span>
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Required</span>
              </label>
              <textarea
                value={brief.q1_purpose}
                onChange={e => updateBrief('q1_purpose', e.target.value)}
                placeholder="e.g., Track real-time sales performance across regions and flag underperforming territories for the VP of Sales"
                className="w-full rounded-xl text-[15px] resize-none focus:outline-none transition-all"
                style={{ minHeight: 80, padding: 16, border: `2px solid #F5B8A0`, color: '#1A202C', backgroundColor: '#FFFFFF' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(212,123,90,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Q2: Target Audience — OPTIONAL */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                Who will use this dashboard?
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
              </label>
              <textarea
                value={brief.q2_audience}
                onChange={e => updateBrief('q2_audience', e.target.value)}
                placeholder="e.g., Regional sales managers, VP of Sales"
                className="w-full rounded-xl text-[15px] resize-none focus:outline-none transition-all"
                style={{ minHeight: 64, padding: 16, border: `2px solid #F5B8A0`, color: '#1A202C', backgroundColor: '#FFFFFF' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(212,123,90,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Q3: Dashboard Type (dropdown) — OPTIONAL */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                Dashboard type
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
              </label>
              <select
                value={brief.q3_type}
                onChange={e => updateBrief('q3_type', e.target.value)}
                className="w-full rounded-xl text-[15px] focus:outline-none transition-all bg-white appearance-none cursor-pointer"
                style={{ padding: '12px 16px', border: `2px solid #F5B8A0`, color: '#1A202C' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; }}
              >
                <option value="">Select a type...</option>
                {DASHBOARD_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Q4: Key Metrics (free-form text field, full width) — OPTIONAL */}
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                Key metrics to display
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
              </label>
              <textarea
                value={brief.q4_metrics}
                onChange={e => updateBrief('q4_metrics', e.target.value)}
                placeholder="Describe the metrics you want on the dashboard (e.g., Revenue, Conversion Rate, Pipeline Value, Win Rate, Average Deal Size, monthly trends by region)"
                className="w-full rounded-xl text-[15px] resize-none focus:outline-none transition-all"
                style={{ minHeight: 72, padding: 16, border: `2px solid #F5B8A0`, color: '#1A202C', backgroundColor: '#FFFFFF' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(212,123,90,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; e.target.style.boxShadow = 'none'; }}
              />
              <p className="text-[11px] text-[#A0AEC0] mt-1">The AI will interpret your description and create relevant visualizations.</p>
            </div>

            {/* Q5: Data Sources (single textarea) — OPTIONAL */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                Data sources &amp; systems
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
              </label>
              <textarea
                value={dataSourcesText}
                onChange={e => {
                  setDataSourcesText(e.target.value);
                  updateBrief('q5_dataSources', e.target.value.trim() ? [e.target.value.trim()] : []);
                }}
                placeholder="e.g., CRM (Salesforce), SQL database, Google Sheets"
                className="w-full rounded-xl text-[15px] resize-none focus:outline-none transition-all"
                style={{ minHeight: 64, padding: 16, border: `2px solid #F5B8A0`, color: '#1A202C', backgroundColor: '#FFFFFF' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(212,123,90,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Q7: Visual Style (dropdown) — OPTIONAL */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
                Visual style
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
              </label>
              <select
                value={brief.q7_visualStyle}
                onChange={e => updateBrief('q7_visualStyle', e.target.value)}
                className="w-full rounded-xl text-[15px] focus:outline-none transition-all bg-white appearance-none cursor-pointer"
                style={{ padding: '12px 16px', border: `2px solid #F5B8A0`, color: '#1A202C' }}
                onFocus={e => { e.target.style.borderColor = DARK_ACCENT; }}
                onBlur={e => { e.target.style.borderColor = '#F5B8A0'; }}
              >
                <option value="">Select a style...</option>
                {VISUAL_STYLE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Q9: Inspiration — with clickable site links (full width) — OPTIONAL */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-1.5">
                <label className="text-[13px] font-semibold text-[#1A202C]">Inspiration examples</label>
                <span className="text-[11px] font-normal text-[#A0AEC0] ml-2">Optional</span>
                <InfoTooltip content={INSPIRATION_TOOLTIP_CONTENT} />
              </div>

              {/* Clickable inspiration site links */}
              <div className="flex flex-wrap gap-2 mb-3">
                {INSPIRATION_SITES.map(site => (
                  <a
                    key={site.name}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-[rgba(245,184,160,0.2)]"
                    style={{ border: '1px solid #E2E8F0', color: '#4A5568' }}
                  >
                    <ExternalLink size={11} /> {site.name}
                  </a>
                ))}
              </div>

              {/* Image Upload Drop Zone */}
              <div
                className={cn(
                  'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer',
                  isDragOver ? 'border-[#D47B5A] bg-[rgba(245,184,160,0.12)]' : 'border-[#E2E8F0] bg-[rgba(245,184,160,0.04)] hover:border-[#F5B8A0] hover:bg-[rgba(245,184,160,0.08)]'
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) handleImageFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-col items-center justify-center py-6 px-4">
                  <Upload size={24} className="mb-2" style={{ color: isDragOver ? DARK_ACCENT : '#A0AEC0' }} />
                  <p className="text-[13px] text-[#718096] text-center">
                    Drop dashboard examples here or click to browse
                  </p>
                  <p className="text-[11px] text-[#A0AEC0] mt-1">PNG, JPG, or WebP</p>
                </div>
              </div>

              {/* Uploaded image thumbnails */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Uploaded inspiration ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-[#E2E8F0]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(i);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1A202C] bg-opacity-70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                      <p className="text-[10px] text-[#A0AEC0] mt-1 max-w-[80px] truncate">{img.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg text-[13px]" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030' }}>
              {error}
            </div>
          )}

          {/* Generate CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => handleGenerateMockup()}
              disabled={!canGenerate || isLoading}
              className="px-8 py-3 text-white font-semibold rounded-full transition-all duration-150 disabled:cursor-not-allowed flex items-center gap-2 text-[15px]"
              style={{
                backgroundColor: canGenerate && !isLoading ? DARK_ACCENT : '#E2E8F0',
                color: canGenerate && !isLoading ? '#FFFFFF' : '#A0AEC0',
              }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Generating Mockup...</>
              ) : hasMockup ? (
                <><Sparkles size={18} /> Regenerate Mockup</>
              ) : (
                <><Sparkles size={18} /> Generate Dashboard Mockup &rarr;</>
              )}
            </button>
            <span className="text-[12px] text-[#A0AEC0]">
              {filledFieldsCount} of 6 fields completed &middot; Only the purpose is required to start
              {regenerationCount > 0 && ` \u00b7 Generation ${regenerationCount} of ${MAX_REGENERATIONS}`}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION E — Step 2: Dashboard Mockup
        ═══════════════════════════════════════════ */}
        <div
          ref={mockupRef}
          className="mb-8 -mx-6 px-6 py-12 md:py-16 scroll-mt-24"
          style={{ backgroundColor: '#F7FAFC' }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: DARK_ACCENT }}>
                02
              </div>
              <h2 className="text-[24px] font-bold text-[#1A202C]">Your Dashboard Mockup</h2>
              {hasMockup && (
                <span className="flex items-center gap-1 ml-2 text-[13px] text-[#718096]">
                  Why mockup first?
                  <InfoTooltip content={WHY_MOCKUP_TOOLTIP} />
                </span>
              )}
            </div>

            {/* Empty State */}
            {!hasMockup && !isLoading && (
              <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '2px dashed #E2E8F0' }}>
                <Monitor size={48} className="mx-auto mb-4" style={{ color: '#E2E8F0' }} />
                <p className="text-[15px] text-[#A0AEC0]">
                  Your dashboard mockup will appear here once you complete your brief above.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !hasMockup && (
              <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '1px solid #E2E8F0' }}>
                <div className="space-y-3 max-w-lg mx-auto mb-6">
                  <div className="h-8 bg-gray-100 rounded-lg animate-skeleton-pulse" />
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-skeleton-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                  <div className="h-32 bg-gray-100 rounded-lg animate-skeleton-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
                <Loader2 size={24} className="mx-auto animate-spin mb-2" style={{ color: DARK_ACCENT }} />
                {isRefinement ? (
                  <>
                    <p className="text-[14px] text-[#718096]">Refining your dashboard based on feedback...</p>
                    <p className="text-[12px] text-[#A0AEC0] mt-1 max-w-md mx-auto">The AI is interpreting your changes and generating a new mockup. This usually takes 20&ndash;30 seconds</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-[#718096]">
                      {isAnalyzingInspiration ? 'Analyzing your inspiration and generating mockup...' : 'Generating your dashboard mockup...'}
                    </p>
                    <p className="text-[12px] text-[#A0AEC0] mt-1">
                      {isAnalyzingInspiration ? 'The AI is studying your reference images to match the style. This usually takes 25\u201340 seconds' : 'This usually takes 15\u201325 seconds'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Loaded State — Two Columns: Image Left, Prompt Right */}
            {hasMockup && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">

                {/* Left: Dashboard Image (60%) */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="AI-generated dashboard mockup"
                        className="w-full h-auto"
                        style={{ minHeight: '300px', objectFit: 'contain', backgroundColor: '#F8FAFC' }}
                      />
                    )}
                    {!imageUrl && dashboardHtml && (
                      <div style={{ position: 'relative', width: '100%', paddingBottom: '66.67%', overflow: 'hidden' }}>
                        <iframe
                          srcDoc={dashboardHtml}
                          className="border-0"
                          style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '800px', transformOrigin: 'top left' }}
                          title="Generated Dashboard"
                          ref={(el) => {
                            if (el) {
                              const updateScale = () => {
                                const w = el.parentElement?.clientWidth || 1200;
                                el.style.transform = `scale(${w / 1200})`;
                              };
                              updateScale();
                              window.addEventListener('resize', updateScale);
                            }
                          }}
                        />
                      </div>
                    )}
                    {!imageUrl && !dashboardHtml && dashboardSvg && (
                      <div className="w-full p-4">
                        <div dangerouslySetInnerHTML={{ __html: dashboardSvg }} />
                      </div>
                    )}
                  </div>

                  {/* Image toolbar */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {generationMethod && (
                        <span className="text-[11px] text-[#A0AEC0] px-2 py-0.5 rounded bg-[#F7FAFC] border border-[#E2E8F0]">
                          {generationMethod === 'gemini-image' ? 'Generated with Gemini' : generationMethod === 'imagen' ? 'Generated with Imagen' : generationMethod === 'html' ? 'Interactive HTML Preview' : 'SVG Placeholder'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsFullScreen(true)}
                      className="px-3 py-1.5 border border-[#E2E8F0] rounded-full text-[13px] text-[#4A5568] flex items-center gap-1.5 hover:bg-white transition-colors"
                    >
                      <Maximize2 size={14} /> Full Screen
                    </button>
                  </div>
                </div>

                {/* Right: Prompt Architecture (40%) */}
                <div className="lg:col-span-2">
                  <h3 className="text-[16px] font-bold text-[#1A202C] mb-3">Prompt Architecture</h3>
                  <p className="text-[13px] text-[#718096] leading-[1.5] mb-4">
                    This is the structured JSON prompt that generated your mockup. Copy it to use with other AI tools.
                  </p>
                  {jsonPrompt && (
                    <JsonCodeBlock data={jsonPrompt} onCopy={() => copyToClipboard(JSON.stringify(jsonPrompt, null, 2))} />
                  )}
                </div>

                {/* ═══ Full-width Feedback Card ═══ */}
                <div className="lg:col-span-5">
                  {/* Approve / Give Feedback Buttons */}
                  {!mockupApproved && !isLoading && (
                    <div>
                      {!showFeedbackInput ? (
                        <div className="flex gap-3">
                          <button
                            onClick={handleApproveMockup}
                            className="flex-1 px-6 py-3 rounded-full font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-colors"
                            style={{ backgroundColor: '#38B2AC' }}
                          >
                            <ThumbsUp size={16} /> Approve Design
                          </button>
                          <button
                            onClick={() => setShowFeedbackInput(true)}
                            className="flex-1 px-6 py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors"
                            style={{ border: `1.5px solid ${DARK_ACCENT}`, color: DARK_ACCENT, backgroundColor: 'rgba(245,184,160,0.08)' }}
                          >
                            <MessageSquare size={16} /> Give Feedback
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-6 sm:p-8" style={{ border: `1.5px solid ${ACCENT}` }}>
                          <p className="text-[15px] font-semibold text-[#1A202C] mb-3">What would you like to change?</p>
                          <textarea
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder="e.g., Make the KPI cards larger, add a donut chart for category breakdown, use a darker color scheme..."
                            className="w-full rounded-lg text-[14px] resize-none focus:outline-none transition-all mb-4"
                            style={{ minHeight: 100, padding: 16, border: `2px solid #F5B8A0`, color: '#1A202C', backgroundColor: '#FFFFFF' }}
                            onFocus={e => { e.target.style.borderColor = DARK_ACCENT; }}
                            onBlur={e => { e.target.style.borderColor = '#F5B8A0'; }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSubmitFeedback}
                              disabled={!feedbackText.trim() || isLoading}
                              className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-white disabled:opacity-50 flex items-center gap-1.5"
                              style={{ backgroundColor: DARK_ACCENT }}
                            >
                              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Regenerating...</> : <><Sparkles size={14} /> Regenerate with Feedback</>}
                            </button>
                            <button
                              onClick={() => { setShowFeedbackInput(false); setFeedbackText(''); }}
                              className="px-4 py-2.5 rounded-full text-[13px] text-[#718096] border border-[#E2E8F0] hover:bg-[#F7FAFC]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-[#A0AEC0] mt-2 text-center">
                        Approving will automatically generate your PRD. Feedback will refine the mockup.
                      </p>
                    </div>
                  )}

                  {mockupApproved && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(56,178,172,0.08)', border: '1px solid rgba(56,178,172,0.3)' }}>
                      <Check size={14} className="text-[#38B2AC]" />
                      <span className="text-[13px] text-[#38B2AC] font-medium">Design approved</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION F — Step 3: Generate Your PRD
        ═══════════════════════════════════════════ */}
        <div ref={prdRef} className="mb-16 scroll-mt-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: DARK_ACCENT }}>
              03
            </div>
            <h2 className="text-[24px] font-bold text-[#1A202C]">Your Dashboard PRD</h2>
          </div>
          <p className="text-[15px] text-[#4A5568] mb-6 ml-[48px]">
            A comprehensive Product Requirements Document &mdash; ready to hand off to developers or AI coding tools.
          </p>

          {/* State 1: Before Generation — Educational Overview + Sections Dropdown */}
          {!prdResult && !isPrdLoading && (
            <div>
              {/* Full-width overview card */}
              <div
                className="rounded-2xl p-6 sm:p-8 mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,184,160,0.10) 0%, rgba(212,123,90,0.05) 100%)',
                  border: '1.5px solid #F5B8A0',
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* What is a PRD? */}
                  <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245,184,160,0.25)' }}>
                        <FileText size={16} style={{ color: DARK_ACCENT }} />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#1A202C]">What is a PRD?</h4>
                    </div>
                    <p className="text-[13px] text-[#4A5568] leading-[1.6]">
                      A Product Requirements Document defines exactly what your dashboard should do, who it serves, and how it should behave. It bridges the gap between your design vision and the development reality.
                    </p>
                  </div>

                  {/* Why does your dashboard need one? */}
                  <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245,184,160,0.25)' }}>
                        <ClipboardList size={16} style={{ color: DARK_ACCENT }} />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#1A202C]">Why your dashboard needs one</h4>
                    </div>
                    <p className="text-[13px] text-[#4A5568] leading-[1.6]">
                      Without a PRD, dashboards get built on assumptions. A PRD specifies the exact widgets, data sources, user interactions, and visual design &mdash; so the final product matches the vision.
                    </p>
                  </div>

                  {/* What's included? */}
                  <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245,184,160,0.25)' }}>
                        <Sparkles size={16} style={{ color: DARK_ACCENT }} />
                      </div>
                      <h4 className="text-[15px] font-bold text-[#1A202C]">What you'll get</h4>
                    </div>
                    <p className="text-[13px] text-[#4A5568] leading-[1.6]">
                      An {PRD_SECTIONS.length}-section document covering everything from user stories and widget specs to tech stack recommendations, data integration, and acceptance criteria.
                    </p>
                  </div>
                </div>

                {/* PRD Sections Dropdown */}
                <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(245,184,160,0.3)' }}>
                  <button
                    onClick={() => setShowPrdSectionsOverview(!showPrdSectionsOverview)}
                    className="flex items-center gap-2 text-[14px] font-semibold transition-colors"
                    style={{ color: DARK_ACCENT }}
                  >
                    <ChevronDown size={16} className={cn('transition-transform', showPrdSectionsOverview && 'rotate-180')} />
                    {showPrdSectionsOverview ? 'Hide PRD Sections Overview' : `View all ${PRD_SECTIONS.length} PRD sections`}
                  </button>

                  {showPrdSectionsOverview && (
                    <div className="mt-4 flex flex-col gap-3">
                      {PRD_SECTIONS.map((section) => {
                        const IconComponent = PRD_SECTION_ICONS[section.key] || FileText;
                        return (
                          <div key={section.key} className="bg-white rounded-lg p-4" style={{ border: '1px solid #E2E8F0' }}>
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'rgba(245,184,160,0.25)' }}
                              >
                                <IconComponent size={16} style={{ color: DARK_ACCENT }} />
                              </div>
                              <h5 className="text-[14px] font-bold text-[#1A202C]">{section.title}</h5>
                            </div>
                            <p className="text-[13px] text-[#4A5568] leading-[1.6] mb-2 ml-11">{section.description}</p>
                            <p className="text-[11px] text-[#A0AEC0] leading-[1.5] ml-11">
                              <span className="font-semibold text-[#718096]">Example:</span> {section.example}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Generate CTA */}
                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    onClick={handleGeneratePRD}
                    disabled={!hasMockup || isPrdLoading || prdGenerationCount >= MAX_PRD_GENERATIONS}
                    className="px-8 py-3 font-semibold rounded-full transition-all duration-150 disabled:cursor-not-allowed flex items-center gap-2 text-[15px]"
                    style={{
                      backgroundColor: hasMockup ? DARK_ACCENT : '#E2E8F0',
                      color: hasMockup ? '#FFFFFF' : '#A0AEC0',
                    }}
                  >
                    <FileText size={18} /> Generate PRD
                  </button>
                  {!hasMockup && (
                    <p className="text-[13px] text-[#A0AEC0]">Complete and approve your dashboard mockup above to generate a PRD.</p>
                  )}
                  {hasMockup && (
                    <p className="text-[13px] text-[#A0AEC0]">Your brief and mockup details will be used to generate a personalized PRD.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isPrdLoading && (
            <div className="flex flex-col items-center py-12 scroll-mt-24">
              <Loader2 size={28} className="animate-spin mb-4" style={{ color: '#D47B5A' }} />
              <p className="text-[16px] font-semibold text-[#1A202C] mb-1">Generating your PRD...</p>
              <p className="text-[13px] text-[#A0AEC0] mb-8">This usually takes 20&ndash;30 seconds</p>

              <div className="w-full max-w-xl space-y-2">
                {PRD_SECTIONS.map((section, idx) => {
                  const IconComponent = PRD_SECTION_ICONS[section.key] || FileText;
                  const isActive = idx === prdProgressStep;
                  const isComplete = idx < prdProgressStep;
                  return (
                    <div
                      key={section.key}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300',
                        isActive && 'bg-[rgba(245,184,160,0.12)] border border-[#F5B8A0]',
                        isComplete && 'opacity-60',
                        !isActive && !isComplete && 'opacity-30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors duration-300',
                          isComplete ? 'bg-[rgba(56,178,172,0.15)]' : isActive ? 'bg-[rgba(245,184,160,0.3)]' : 'bg-[#F7FAFC]',
                        )}
                      >
                        {isComplete ? (
                          <Check size={14} className="text-[#38B2AC]" />
                        ) : isActive ? (
                          <Loader2 size={14} className="animate-spin text-[#D47B5A]" />
                        ) : (
                          <IconComponent size={14} className="text-[#A0AEC0]" />
                        )}
                      </div>
                      <span className={cn(
                        'text-[13px] transition-colors duration-300',
                        isActive ? 'font-semibold text-[#1A202C]' : isComplete ? 'text-[#718096]' : 'text-[#A0AEC0]',
                      )}>
                        {section.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* State 2: After Generation — Full PRD */}
          {prdResult && !isPrdLoading && (
            <div>
              {/* PRD Toolbar */}
              <div className="bg-white rounded-t-xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ border: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0' }}>
                <span className="text-[16px] font-bold text-[#1A202C]">{prdResult.prd_content}</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => {
                    const fullText = Object.entries(prdResult.sections).map(([key, val]) => {
                      const def = PRD_SECTIONS.find(s => s.key === key);
                      return `## ${def?.title || key}\n\n${val}`;
                    }).join('\n\n');
                    copyToClipboard(`# ${prdResult.prd_content}\n\n${fullText}`, 'copy-prd');
                  }}
                    className="px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors"
                    style={copiedId === 'copy-prd'
                      ? { backgroundColor: '#D47B5A', color: '#fff', border: '1px solid #D47B5A' }
                      : { border: '1px solid #E2E8F0', color: '#2D3748' }
                    }
                  >
                    {copiedId === 'copy-prd' ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy PRD</>}
                  </button>
                  <button onClick={handleExportMarkdown}
                    className="px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors"
                    style={copiedId === 'export-md'
                      ? { backgroundColor: '#D47B5A', color: '#fff', border: '1px solid #D47B5A' }
                      : { border: '1px solid #E2E8F0', color: '#2D3748' }
                    }
                  >
                    {copiedId === 'export-md' ? <><Check size={13} /> Exported!</> : <><Download size={13} /> Export Markdown</>}
                  </button>
                  {jsonPrompt && (
                    <button onClick={() => copyToClipboard(JSON.stringify(jsonPrompt, null, 2), 'copy-json')}
                      className="px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors"
                      style={copiedId === 'copy-json'
                        ? { backgroundColor: '#D47B5A', color: '#fff', border: '1px solid #D47B5A' }
                        : { border: '1px solid #E2E8F0', color: '#2D3748' }
                      }
                    >
                      {copiedId === 'copy-json' ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy JSON</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white p-6" style={{ border: '1px solid #E2E8F0', borderTop: 'none' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Purpose</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">{brief.q1_purpose.slice(0, 100)}{brief.q1_purpose.length > 100 ? '...' : ''}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Dashboard Type</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">{brief.q3_type || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Target Users</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">{brief.q2_audience || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Key Metrics</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">{brief.q4_metrics || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Visual Style</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">
                      {VISUAL_STYLE_OPTIONS.find(v => v.id === brief.q7_visualStyle)?.label || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#A0AEC0]">Data Sources</span>
                    <p className="text-[14px] font-medium text-[#1A202C] mt-1">{dataSourcesText || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* View Full PRD Toggle */}
              <div className="text-center mt-5">
                <button
                  onClick={() => setShowFullPrd(!showFullPrd)}
                  className="px-6 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2 mx-auto transition-colors"
                  style={{ border: `1px solid ${DARK_ACCENT}`, color: DARK_ACCENT }}
                >
                  {showFullPrd ? 'Hide Full PRD' : 'View Full PRD'}
                  <ChevronDown size={16} className={cn('transition-transform', showFullPrd && 'rotate-180')} />
                </button>
              </div>

              {/* Full PRD Content */}
              {showFullPrd && (
                <div className="bg-white rounded-xl p-8 md:p-10 mt-4" style={{ border: '1px solid #E2E8F0' }}>
                  {Object.entries(prdResult.sections).map(([key, value], idx) => {
                    const def = PRD_SECTIONS.find(s => s.key === key);
                    const displayValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
                    return (
                      <div key={key} className={idx > 0 ? 'mt-8 pt-6 border-t border-[#E2E8F0]' : ''}>
                        <h4 className="text-[18px] font-bold text-[#1A202C] mb-3">{def?.title || key}</h4>
                        <div className="text-[14px] text-[#4A5568] leading-[1.7] whitespace-pre-wrap">{displayValue}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            Bottom Actions
        ═══════════════════════════════════════════ */}
        {hasMockup && (
          <div className="flex justify-center mb-12">
            <button
              onClick={handleStartOver}
              className="px-6 py-3 border border-[#E2E8F0] text-[#4A5568] font-semibold rounded-full hover:bg-[#F7FAFC] transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} /> Start Over
            </button>
          </div>
        )}

        {/* Closing */}
        <ArtifactClosing
          summaryText="You've designed a dashboard prototype and generated a PRD ready for AI-assisted development."
          ctaLabel="Continue to Level 5: Full AI Applications"
          ctaHref="#product-architecture"
          accentColor={DARK_ACCENT}
        />
      </div>

      {/* ═══════════════════════════════════════════
          Full Screen Modal
      ═══════════════════════════════════════════ */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4" onClick={() => setIsFullScreen(false)}>
          <div className="relative max-w-[95vw] max-h-[95vh] bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#1A202C] bg-opacity-70 flex items-center justify-center text-white hover:bg-opacity-90 transition-colors"
            >
              <Minimize2 size={16} />
            </button>
            {imageUrl ? (
              <img src={imageUrl} alt="Full screen dashboard mockup" className="max-w-full max-h-[90vh] object-contain" />
            ) : dashboardHtml ? (
              <iframe srcDoc={dashboardHtml} className="w-[1200px] h-[800px] border-0" title="Full Screen Dashboard" />
            ) : dashboardSvg ? (
              <div className="p-8" style={{ width: '1200px' }} dangerouslySetInnerHTML={{ __html: dashboardSvg }} />
            ) : null}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 animate-toast-enter">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
