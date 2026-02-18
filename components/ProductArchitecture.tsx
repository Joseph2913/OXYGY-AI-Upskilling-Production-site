import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, ChevronRight, ChevronDown, ChevronUp,
  Copy, Check, FileText, Download, Loader2, RotateCcw,
  Mic, MicOff, AlertCircle,
} from 'lucide-react';
import { ArtifactClosing } from './ArtifactClosing';
import {
  TOOLS, LEVEL_INFO,
  generateTextExport, generateMarkdownExport,
} from '../data/product-architecture-content';
import { useArchitectureApi } from '../hooks/useArchitectureApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { ProductArchitectureAnswers, ToolAnalysisResult } from '../types';

// ---- L5 Color Constants ----
const ACCENT = '#38B2AC';
const ACCENT_DARK = '#2C9A94';
const LIGHT_TEAL_BG = '#E6FFFA';

// ---- Example apps for quick-fill ----
const EXAMPLE_APPS = [
  {
    label: 'Knowledge Base',
    emoji: '\uD83E\uDDE0',
    appDescription: 'An internal knowledge base where our consulting team can search through past project deliverables, case studies, and templates using AI-powered search.',
    problemAndUsers: 'Our team of 50 consultants wastes hours searching shared drives for past work. This tool would let them find relevant materials in seconds and surface related projects they didn\u2019t know existed.',
    dataAndContent: 'PDFs, PowerPoint decks, and Word documents from past projects. Key features: AI-powered search, document tagging, favorites/bookmarks, and an admin upload interface.',
  },
  {
    label: 'Client Portal',
    emoji: '\uD83C\uDF10',
    appDescription: 'A client-facing portal where external stakeholders can track project progress, view deliverables, and provide feedback in one place.',
    problemAndUsers: 'Our clients currently rely on email chains and scattered docs to follow project status. Project managers spend 20% of their time on status update emails. Clients want real-time visibility.',
    dataAndContent: 'Project milestones, deliverable files, feedback threads, and timeline data. Key features: role-based access (client vs. team), progress dashboard, file sharing, and comment threads.',
  },
  {
    label: 'Training Platform',
    emoji: '\uD83D\uDCDA',
    appDescription: 'A learning platform for onboarding new hires with structured training modules, quizzes, and progress tracking personalized to each employee\u2019s role.',
    problemAndUsers: 'New hires take 3 months to become productive. HR and team leads spend weeks on repetitive onboarding. We need a self-serve platform that adapts content based on role and department.',
    dataAndContent: 'Training videos, reading materials, interactive quizzes, and completion records. Key features: role-based learning paths, progress tracking, quiz scoring, and manager dashboards.',
  },
];

const LEVEL_PILL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#E6FFFA', text: '#2C7A7B', border: '#38B2AC' },
  2: { bg: '#EBF0FF', text: '#4A5AB0', border: '#5B6DC2' },
  3: { bg: '#FFFBEB', text: '#92700C', border: '#C4A934' },
  4: { bg: '#FFF5F0', text: '#C05621', border: '#D97B4A' },
};

const CLASSIFICATION_STYLES = {
  essential: { bg: '#E6FFFA', color: '#2C7A7B', border: '#81E6D9', label: 'Essential' },
  recommended: { bg: '#FFFFF0', color: '#B7791F', border: '#F6E05E', label: 'Recommended' },
  optional: { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0', label: 'Optional' },
};

// ---- Utility: parse "Level N" into clickable links ----

const LEVEL_LINK_MAP: Record<string, string> = {
  'Level 1': '#playground',
  'Level 2': '#agent-builder',
  'Level 3': '#workflow-designer',
  'Level 4': '#',
};

function renderWithLevelLinks(text: string): React.ReactNode[] {
  const parts = text.split(/(Level [1-4])/g);
  return parts.map((part, i) => {
    const href = LEVEL_LINK_MAP[part];
    if (href) {
      return (
        <a
          key={i}
          href={href}
          onClick={href === '#' ? (e: React.MouseEvent) => {
            e.preventDefault();
            window.location.hash = '';
            setTimeout(() => {
              const el = document.getElementById('journey');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } : undefined}
          className="font-bold underline decoration-2 underline-offset-2 transition-colors hover:opacity-80"
          style={{ color: ACCENT_DARK, textDecorationColor: `${ACCENT}80` }}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ---- Sub-components ----

function ClassificationBadge({ classification }: { classification: keyof typeof CLASSIFICATION_STYLES }) {
  const style = CLASSIFICATION_STYLES[classification];
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {style.label}
    </span>
  );
}

function ToolLogo({ toolId, size = 'md' }: { toolId: string; size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'sm' ? 32 : size === 'lg' ? 56 : 40;
  const iconPx = size === 'sm' ? 20 : size === 'lg' ? 34 : 26;

  const svgByTool: Record<string, React.ReactNode> = {
    'google-ai-studio': (
      <svg fill="#4285F4" fillRule="evenodd" height={iconPx} viewBox="0 0 24 24" width={iconPx} xmlns="http://www.w3.org/2000/svg">
        <path d="M9.921 4.196H6.328A2.705 2.705 0 003.623 6.9v11.362a2.705 2.705 0 002.705 2.705h11.363a2.705 2.705 0 002.705-2.705v-4.756l1.623-1.113v5.87a4.329 4.329 0 01-4.328 4.328H6.328A4.329 4.329 0 012 18.263V6.901a4.328 4.328 0 014.328-4.329h4.545l-.952 1.624z" />
        <path d="M17.82 0c.145 0 .268.104.299.246a7 7 0 001.9 3.484 7 7 0 003.485 1.901c.142.031.246.154.246.3a.308.308 0 01-.246.298A7 7 0 0020.02 8.13a7 7 0 00-1.912 3.535.297.297 0 01-.288.238.297.297 0 01-.288-.238A7 7 0 0015.62 8.13a7 7 0 00-3.535-1.912.297.297 0 01-.238-.288c0-.14.1-.26.238-.288A7 7 0 0015.62 3.73 7.001 7.001 0 0017.521.246.308.308 0 0117.82 0z" />
      </svg>
    ),
    'github': (
      <svg fill="#24292E" fillRule="evenodd" height={iconPx} viewBox="0 0 24 24" width={iconPx} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0c6.63 0 12 5.276 12 11.79-.001 5.067-3.29 9.567-8.175 11.187-.6.118-.825-.25-.825-.56 0-.398.015-1.665.015-3.242 0-1.105-.375-1.813-.81-2.181 2.67-.295 5.475-1.297 5.475-5.822 0-1.297-.465-2.344-1.23-3.169.12-.295.54-1.503-.12-3.125 0 0-1.005-.324-3.3 1.209a11.32 11.32 0 00-3-.398c-1.02 0-2.04.133-3 .398-2.295-1.518-3.3-1.209-3.3-1.209-.66 1.622-.24 2.83-.12 3.125-.765.825-1.23 1.887-1.23 3.169 0 4.51 2.79 5.527 5.46 5.822-.345.294-.66.81-.765 1.577-.69.31-2.415.81-3.495-.973-.225-.354-.9-1.223-1.845-1.209-1.005.015-.405.56.015.781.51.28 1.095 1.327 1.23 1.666.24.663 1.02 1.93 4.035 1.385 0 .988.015 1.916.015 2.196 0 .31-.225.664-.825.56C3.303 21.374-.003 16.867 0 11.791 0 5.276 5.37 0 12 0z" />
      </svg>
    ),
    'claude-code': (
      <svg height={iconPx} viewBox="0 0 24 24" width={iconPx} xmlns="http://www.w3.org/2000/svg">
        <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fillRule="nonzero" />
      </svg>
    ),
    'supabase': (
      <svg height={iconPx} viewBox="0 0 109 113" fill="none" width={iconPx} xmlns="http://www.w3.org/2000/svg">
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear_sb)" />
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear_sb)" fillOpacity="0.2" />
        <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" />
        <defs>
          <linearGradient id="paint0_linear_sb" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
            <stop stopColor="#249361" />
            <stop offset="1" stopColor="#3ECF8E" />
          </linearGradient>
          <linearGradient id="paint1_linear_sb" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
            <stop />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'vercel': (
      <svg fill="#000000" fillRule="evenodd" height={iconPx} viewBox="0 0 24 24" width={iconPx} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0l12 20.785H0L12 0z" />
      </svg>
    ),
  };

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: px, height: px }}
    >
      {svgByTool[toolId] || null}
    </div>
  );
}

// ---- Pipeline Card ----

function PipelineCard({ tool }: { tool: typeof TOOLS[0] }) {
  return (
    <div
      className="bg-white rounded-xl p-5 h-full transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
      style={{ border: '1px solid #E2E8F0' }}
    >
      <div className="mb-3">
        <ToolLogo toolId={tool.id} size="lg" />
      </div>
      <p className="text-sm font-bold text-[#1A202C] mb-1.5">{tool.name}</p>
      <p className="text-[12px] italic leading-relaxed flex-1" style={{ color: ACCENT_DARK }}>
        {tool.officeAnalogy}
      </p>
      <p className="text-[11px] text-[#A0AEC0] leading-relaxed mt-2">
        {tool.tagline}
      </p>
    </div>
  );
}

// ---- Connected Level Row (for right panel) ----
// Tooltip is rendered inline below the button instead of absolute-positioned,
// so it naturally fits within the card and cannot overflow.

const ConnectedLevelRow: React.FC<{
  level: number;
  connectionText: string;
  stateB: boolean;
}> = ({ level, connectionText, stateB }) => {
  const [showDetail, setShowDetail] = useState(false);
  const colors = LEVEL_PILL_COLORS[level] || { bg: LIGHT_TEAL_BG, text: '#2D3748', border: ACCENT };
  const info = LEVEL_INFO[level] || { name: '', href: '#' };

  return (
    <div>
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-2.5 w-full text-left p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ backgroundColor: colors.bg, color: colors.text, border: `1.5px solid ${colors.border}` }}
        >
          L{level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#2D3748] truncate">{info.name}</p>
        </div>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: '#A0AEC0', transform: showDetail ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>

      {/* Inline expandable detail — no overflow issues */}
      {showDetail && (
        <div
          className="mt-1 mx-1 p-3 rounded-lg text-left"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${colors.border}40`,
          }}
        >
          <p className="text-[12px] text-[#4A5568] leading-[1.6] mb-2">
            {stateB ? renderWithLevelLinks(connectionText) : connectionText}
          </p>
          <a
            href={info.href}
            onClick={info.href === '#' ? (e: React.MouseEvent) => {
              e.preventDefault();
              window.location.hash = '';
              setTimeout(() => {
                const el = document.getElementById('journey');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } : undefined}
            className="inline-block text-[11px] font-semibold transition-colors hover:opacity-80"
            style={{ color: colors.text }}
          >
            Visit Level {level} artifact &rarr;
          </a>
        </div>
      )}
    </div>
  );
};

// ---- Tool Detail Card ----

const ToolDetailCard: React.FC<{
  tool: typeof TOOLS[0];
  analysis?: ToolAnalysisResult;
  stateB: boolean;
  visible: boolean;
}> = ({ tool, analysis, stateB, visible }) => {
  const [showMore, setShowMore] = useState(false);

  const connLevels = stateB && analysis ? analysis.connectedLevels : tool.educational.connectedLevels;
  const fullConnText = stateB && analysis ? analysis.levelConnection : tool.educational.levelConnection;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${ACCENT}40`,
        backgroundColor: `${tool.avatarColor}08`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div className="flex flex-col md:flex-row">
        {/* LEFT: Logo + Content */}
        <div className="flex-1 min-w-0 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <ToolLogo toolId={tool.id} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#1A202C]">{tool.name}</h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${tool.avatarColor}20`, color: tool.avatarColor }}
                >
                  Stage {tool.step}
                </span>
                {stateB && analysis && (
                  <ClassificationBadge classification={analysis.classification} />
                )}
              </div>
              <p className="text-[13px] italic mt-0.5" style={{ color: '#718096' }}>
                &ldquo;{tool.officeAnalogy}&rdquo;
              </p>
            </div>
          </div>

          {/* Body */}
          {!stateB ? (
            <>
              <p className="text-sm text-[#4A5568] leading-relaxed mb-3">
                {tool.educational.whatItDoes}
              </p>
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors mb-1"
                style={{ color: ACCENT_DARK }}
              >
                {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMore ? 'Show less' : 'When to use & tips'}
              </button>
              {showMore && (
                <div className="space-y-3 mt-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">When You&rsquo;d Use It</p>
                    <p className="text-[13px] text-[#4A5568] leading-relaxed">{tool.educational.whenYoudUseIt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">Tips</p>
                    <div className="space-y-1.5">
                      {tool.educational.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[10px] mt-1 flex-shrink-0" style={{ color: ACCENT }}>{'\u25CF'}</span>
                          <p className="text-[13px] text-[#4A5568] leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : analysis ? (
            <>
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">For Your Project</p>
                <p className="text-sm text-[#4A5568] leading-relaxed">
                  {renderWithLevelLinks(analysis.forYourProject)}
                </p>
              </div>
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">How to Approach It</p>
                <p className="text-sm text-[#4A5568] leading-relaxed">
                  {renderWithLevelLinks(analysis.howToApproach)}
                </p>
              </div>
              {/* Tips & Level Connection — collapsed by default */}
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: ACCENT_DARK }}
              >
                {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMore ? 'Hide tips & level connection' : 'Show tips & level connection'}
              </button>
              {showMore && (
                <div className="space-y-3 mt-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">Tips</p>
                    <div className="space-y-1.5">
                      {analysis.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[10px] mt-1 flex-shrink-0" style={{ color: ACCENT }}>{'\u25CF'}</span>
                          <p className="text-[13px] text-[#4A5568] leading-relaxed">
                            {renderWithLevelLinks(tip)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">Level Connection</p>
                    <p className="text-sm text-[#4A5568] leading-relaxed">
                      {renderWithLevelLinks(analysis.levelConnection)}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* RIGHT: Connected Levels with divider */}
        <div
          className="card-level-panel flex-shrink-0 w-full md:w-56 p-4 md:p-5 flex flex-col gap-2"
          style={{
            borderTop: '1px solid #E2E8F0',
            borderLeft: 'none',
            backgroundColor: '#F7FAFC',
          }}
        >
          <style>{`
            @media (min-width: 768px) {
              .card-level-panel {
                border-top: none !important;
                border-left: 1px solid #E2E8F0 !important;
              }
            }
          `}</style>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">
            Connected Levels
          </p>
          {connLevels.map(level => (
            <ConnectedLevelRow
              key={level}
              level={level}
              connectionText={fullConnText}
              stateB={stateB}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Main Component ----

export function ProductArchitecture() {
  // State
  const [answers, setAnswers] = useState<ProductArchitectureAnswers>({
    appDescription: '',
    problemAndUsers: '',
    dataAndContent: '',
    technicalLevel: '',
  });
  const [analysis, setAnalysis] = useState<Record<string, ToolAnalysisResult> | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(0);
  const [answersChanged, setAnswersChanged] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeMicField, setActiveMicField] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // API
  const { analyzeArchitecture, isLoading, error, clearError } = useArchitectureApi();

  // Speech recognition
  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition();

  // Refs
  const questionnaireRef = useRef<HTMLDivElement>(null);
  const toolCardsRef = useRef<HTMLDivElement>(null);

  // Responsive
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Loading step animation
  const LOADING_STEPS = [
    'Reading your project details...',
    'Analyzing tool requirements...',
    'Mapping to the 5-tool pipeline...',
    'Generating personalized recommendations...',
    'Finalizing your build plan...',
  ];

  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Staggered card reveal
  useEffect(() => {
    if (!analysis || cardsRevealed >= TOOLS.length) return;
    const timer = setTimeout(
      () => setCardsRevealed(prev => prev + 1),
      cardsRevealed === 0 ? 200 : 150
    );
    return () => clearTimeout(timer);
  }, [analysis, cardsRevealed]);

  // Derived
  const textFields = [answers.appDescription, answers.problemAndUsers, answers.dataAndContent];
  const filledTextFields = textFields.filter(v => (v || '').trim().length > 10).length;
  const hasDropdown = !!answers.technicalLevel;
  const progressPercent = Math.round(((filledTextFields + (hasDropdown ? 1 : 0)) / 4) * 100);
  const canGenerate = filledTextFields >= 1 && hasDropdown; // At least 1 open-ended + dropdown
  const isStateB = analysis !== null && !isLoading;

  // Handlers
  const handleMicToggle = useCallback((field: string) => {
    if (isListening) {
      stopListening();
      setActiveMicField(null);
    } else {
      setActiveMicField(field);
      startListening((text: string) => {
        setAnswers(prev => ({
          ...prev,
          [field]: (prev[field as keyof ProductArchitectureAnswers] || '') + ((prev[field as keyof ProductArchitectureAnswers] || '').length > 0 ? ' ' : '') + text,
        }));
      });
    }
  }, [isListening, startListening, stopListening]);

  const handleTextChange = useCallback((field: keyof ProductArchitectureAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    if (analysis) setAnswersChanged(true);
  }, [analysis]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setCardsRevealed(0);
    setAnswersChanged(false);
    clearError();

    const result = await analyzeArchitecture(answers);
    if (result) {
      setAnalysis(result);
      setTimeout(() => {
        toolCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [canGenerate, answers, analyzeArchitecture, clearError]);

  const handleReset = useCallback(() => {
    setAnswers({ appDescription: '', problemAndUsers: '', dataAndContent: '', technicalLevel: '' });
    setAnalysis(null);
    setCardsRevealed(0);
    setAnswersChanged(false);
    setTimeout(() => {
      questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const copyToClipboard = useCallback((text: string, label: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setToastMessage(label);
      setShowToast(true);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setShowToast(false), 2500);
    });
  }, []);

  const handleDownloadMd = useCallback(() => {
    if (!analysis) return;
    const md = generateMarkdownExport(answers, analysis);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Build_Plan_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, [analysis, answers]);

  // ---- Render helpers ----

  const renderTextarea = (
    field: keyof ProductArchitectureAnswers,
    label: string,
    subtitle: string,
    placeholder: string,
    stepNum: number,
  ) => (
    <div className="mb-6">
      <p className="text-base sm:text-lg font-bold text-[#1A202C] mb-1">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white mr-2" style={{ backgroundColor: ACCENT_DARK }}>
          {stepNum}
        </span>
        {label}
      </p>
      <p className="text-sm text-[#718096] mb-3 ml-9">{subtitle}</p>
      <div className="relative ml-9">
        <textarea
          value={answers[field] || ''}
          onChange={e => handleTextChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-white px-4 py-3.5 text-[14px] text-[#2D3748] placeholder-[#A0AEC0] resize-none focus:outline-none transition-colors"
          style={{
            border: `2px solid ${ACCENT}`,
            minHeight: '100px',
            maxHeight: '180px',
          }}
          onFocus={e => { e.target.style.borderColor = ACCENT_DARK; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}1a`; }}
          onBlur={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = 'none'; }}
        />
        {isSupported && (
          <button
            onClick={() => handleMicToggle(field)}
            aria-label={activeMicField === field && isListening ? 'Stop voice input' : 'Start voice input'}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border transition-all"
            style={
              activeMicField === field && isListening
                ? { backgroundColor: ACCENT, borderColor: ACCENT }
                : { backgroundColor: '#F7FAFC', borderColor: '#E2E8F0' }
            }
          >
            {activeMicField === field && isListening
              ? <MicOff size={16} className="text-white" />
              : <Mic size={16} className="text-[#718096]" />
            }
          </button>
        )}
      </div>
      {activeMicField === field && isListening && (
        <span className="text-[12px] mt-1 block ml-9" style={{ color: ACCENT_DARK }}>Listening...</span>
      )}
    </div>
  );

  // ---- Render ----
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <a
          href="#"
          onClick={e => { e.preventDefault(); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] transition-colors mb-8"
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT_DARK)}
          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
        >
          <ArrowLeft size={16} /> Back to Level 5
        </a>

        {/* Centered Title */}
        <div className="mb-8 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]">
            Build Your First AI-Powered
            <br />
            <span className="relative inline-block">
              Application
              <span
                className="absolute left-0 -bottom-1 w-full h-[4px] rounded-full"
                style={{ backgroundColor: ACCENT_DARK, opacity: 0.8 }}
              />
            </span>
          </h1>
        </div>

        {/* Did You Know? Card */}
        <div
          className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden mb-16"
          style={{
            background: `linear-gradient(135deg, rgba(56,178,172,0.15) 0%, rgba(44,154,148,0.08) 50%, rgba(56,178,172,0.12) 100%)`,
            border: `1.5px solid ${ACCENT}`,
          }}
        >
          <div className="absolute top-3 left-4 flex gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT_DARK, opacity: 0.4 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B2F5EA', opacity: 0.6 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT_DARK, opacity: 0.3 }} />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: ACCENT_DARK }}>
            Did you know?
          </p>
          <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2 max-w-3xl mx-auto">
            In 2019, shipping a web app required{' '}
            <span className="font-bold" style={{ color: ACCENT_DARK }}>5&ndash;8 developers and months of work</span>.
            Today, one person can prototype, build, and deploy a working application in days.
          </p>
          <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto">
            The barrier to building software has never been lower.
          </p>
          <p className="text-[12px] text-[#A0AEC0] mt-2 italic">
            &mdash; GitHub Octoverse Report, 2024
          </p>
        </div>

        {/* Pipeline Overview */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A202C] mb-3 text-center">
            From Idea to Live Product
          </h2>
          <p className="text-sm text-[#718096] leading-relaxed text-center max-w-2xl mx-auto mb-8">
            Below are five representative stages of building an AI application. Each stage has many tools
            that fit &mdash; the ones shown here are examples to illustrate the general pattern, not a rigid recipe.
          </p>

          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-stretch gap-0`}>
            {TOOLS.map((tool, idx) => (
              <React.Fragment key={tool.id}>
                <div className={isMobile ? '' : 'flex-1 min-w-0'}>
                  <PipelineCard tool={tool} />
                </div>
                {idx < TOOLS.length - 1 && (
                  <div className={`flex items-center justify-center ${isMobile ? 'py-1' : 'px-1'}`}>
                    {isMobile ? (
                      <ChevronDown size={20} style={{ color: ACCENT }} />
                    ) : (
                      <ChevronRight size={20} style={{ color: ACCENT }} />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Questionnaire Section */}
        <div ref={questionnaireRef} className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-[#1A202C] mb-3 text-center">
            What Are You Building?
          </h2>
          <p className="text-sm text-[#718096] leading-relaxed text-center max-w-xl mx-auto mb-4">
            Tell us about your project and we&rsquo;ll create a personalized build plan mapping which tools matter most for you.
          </p>

          {/* Example pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="text-[12px] text-[#A0AEC0] mr-1 self-center">Try an example:</span>
            {EXAMPLE_APPS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setAnswers({
                    appDescription: ex.appDescription,
                    problemAndUsers: ex.problemAndUsers,
                    dataAndContent: ex.dataAndContent,
                    technicalLevel: 'semi-technical',
                  });
                  if (analysis) setAnswersChanged(true);
                }}
                className="text-[12px] px-3 py-1.5 rounded-full font-medium transition-all duration-200 hover:scale-105"
                style={{
                  border: `1.5px solid ${ACCENT}`,
                  color: ACCENT_DARK,
                  backgroundColor: '#F0FFFC',
                }}
              >
                {ex.emoji} {ex.label}
              </button>
            ))}
          </div>

          {/* Input Card */}
          <div
            className="rounded-2xl p-6 sm:p-8 scroll-mt-24"
            style={{
              background: `linear-gradient(135deg, rgba(56,178,172,0.12) 0%, rgba(56,178,172,0.06) 100%)`,
              border: `1.5px solid ${ACCENT}`,
            }}
          >
            {/* Animated Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#1A202C]">Your Progress</span>
                <span
                  className="text-[13px] font-bold transition-all duration-500"
                  style={{ color: progressPercent === 100 ? '#2C7A7B' : ACCENT_DARK }}
                >
                  {progressPercent === 100 ? 'Ready!' : `${progressPercent}%`}
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-visible relative" style={{ backgroundColor: '#E2E8F0' }}>
                <div
                  className="h-full rounded-full relative"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DARK})`
                      : `linear-gradient(90deg, ${ACCENT}90, ${ACCENT})`,
                    transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s ease',
                    boxShadow: progressPercent > 0 ? `0 0 8px ${ACCENT}40` : 'none',
                  }}
                >
                  {progressPercent > 0 && progressPercent < 100 && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full border-2 border-white"
                      style={{
                        backgroundColor: ACCENT,
                        boxShadow: `0 0 0 3px ${ACCENT}30`,
                        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                  )}
                  {progressPercent === 100 && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                      style={{
                        backgroundColor: ACCENT_DARK,
                        boxShadow: `0 0 0 4px ${ACCENT}40`,
                        animation: 'pulse-glow 1.5s ease-in-out infinite',
                      }}
                    >
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
              {/* Step indicators */}
              <div className="flex justify-between mt-2.5 px-0.5">
                {['App Idea', 'Users', 'Data', 'Level'].map((label, i) => {
                  const stepFilled = i === 0 ? (answers.appDescription || '').trim().length > 10
                    : i === 1 ? (answers.problemAndUsers || '').trim().length > 10
                    : i === 2 ? (answers.dataAndContent || '').trim().length > 10
                    : !!answers.technicalLevel;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: stepFilled ? ACCENT : '#CBD5E0',
                          boxShadow: stepFilled ? `0 0 6px ${ACCENT}50` : 'none',
                          transform: stepFilled ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                      <span className="text-[10px] text-[#A0AEC0] font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <style>{`
              @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 0 0 4px rgba(56,178,172,0.4); }
                50% { box-shadow: 0 0 0 8px rgba(56,178,172,0.15); }
              }
            `}</style>

            {/* Question 1: Describe your app */}
            {renderTextarea(
              'appDescription',
              'Describe the application you want to build',
              'In a few sentences, tell us about your idea. What will it do?',
              'e.g. I want to build an internal knowledge base where our consulting team can search through past project deliverables, case studies, and templates using AI-powered search...',
              1,
            )}

            {/* Question 2: Problem & Users */}
            {renderTextarea(
              'problemAndUsers',
              'What problem does this solve, and who are the users?',
              'Who will use this app and what pain point does it address?',
              'e.g. Our team of 50 consultants currently wastes hours searching through shared drives for past work. This tool would let them find relevant materials in seconds...',
              2,
            )}

            {/* Question 3: Data & Key Features */}
            {renderTextarea(
              'dataAndContent',
              'What data or content will the app manage?',
              'Describe the types of information and must-have features.',
              'e.g. It needs to handle PDFs, PowerPoint decks, and Word documents. Key features: AI search, document tagging, favorites, and an admin upload interface...',
              3,
            )}

            {/* Question 4: Technical Level (dropdown) */}
            <div className="mb-8">
              <p className="text-base sm:text-lg font-bold text-[#1A202C] mb-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white mr-2" style={{ backgroundColor: ACCENT_DARK }}>
                  4
                </span>
                What&rsquo;s your technical comfort level?
              </p>
              <p className="text-sm text-[#718096] mb-3 ml-9">This helps us tailor the guidance to your experience.</p>
              <div className="ml-9">
                <select
                  value={answers.technicalLevel || ''}
                  onChange={e => handleTextChange('technicalLevel', e.target.value)}
                  className="w-full sm:w-80 rounded-xl bg-white px-4 py-3 text-[14px] text-[#2D3748] focus:outline-none transition-colors appearance-none cursor-pointer"
                  style={{
                    border: `2px solid ${answers.technicalLevel ? ACCENT_DARK : ACCENT}`,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23718096' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="" disabled>Select your level...</option>
                  <option value="non-technical">Non-technical — I&apos;ve never written code</option>
                  <option value="semi-technical">Semi-technical — Comfortable with no-code tools</option>
                  <option value="technical">Technical — Some coding experience or willing to learn</option>
                </select>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 ml-9 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={clearError} className="text-xs text-red-500 underline mt-1">Dismiss</button>
                </div>
              </div>
            )}

            {/* Generate CTA */}
            <div className="text-center mt-2">
              {answersChanged && !isLoading && (
                <p className="text-sm text-[#B7791F] mb-3">Your answers have changed &mdash; regenerate your plan?</p>
              )}

              {/* Loading progress animation */}
              {isLoading && (
                <div className="mb-6 max-w-md mx-auto">
                  <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                    {/* Step indicators */}
                    <div className="space-y-2.5 mb-4">
                      {LOADING_STEPS.map((step, i) => {
                        const isActive = i === loadingStep;
                        const isDone = i < loadingStep;
                        return (
                          <div key={i} className="flex items-center gap-3 transition-all duration-300" style={{ opacity: isDone ? 0.5 : isActive ? 1 : 0.3 }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                              style={{
                                backgroundColor: isDone ? `${ACCENT}20` : isActive ? ACCENT : '#E2E8F0',
                                border: isActive ? `2px solid ${ACCENT}` : 'none',
                              }}
                            >
                              {isDone ? (
                                <Check size={12} style={{ color: ACCENT_DARK }} />
                              ) : isActive ? (
                                <Loader2 size={12} className="animate-spin text-white" />
                              ) : (
                                <span className="text-[9px] text-[#A0AEC0] font-bold">{i + 1}</span>
                              )}
                            </div>
                            <span className={`text-[13px] transition-all duration-300 ${isActive ? 'font-semibold text-[#1A202C]' : 'text-[#718096]'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Animated bar */}
                    <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DARK})`,
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && (
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[15px] font-semibold text-white transition-all duration-300"
                  style={{
                    backgroundColor: canGenerate ? ACCENT_DARK : '#CBD5E0',
                    cursor: canGenerate ? 'pointer' : 'not-allowed',
                  }}
                >
                  Generate Your Build Plan <ArrowRight size={16} />
                </button>
              )}
              {!canGenerate && !isLoading && (
                <p className="text-[12px] text-[#A0AEC0] mt-2">
                  Fill in at least one description and select your technical level to continue.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tool Cards Section */}
        <div ref={toolCardsRef} className="scroll-mt-24">

          {/* Export Bar */}
          {isStateB && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
              style={{ opacity: isStateB ? 1 : 0, transition: 'opacity 0.5s ease' }}
            >
              <h2 className="text-lg font-bold text-[#1A202C]">Your Personalized Build Plan</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(
                    generateTextExport(answers, analysis!),
                    'Copied as text', 'text'
                  )}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors"
                  style={{ border: '1px solid #1A202C', color: '#1A202C' }}
                >
                  {copiedId === 'text' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === 'text' ? 'Copied!' : 'Copy as Text'}
                </button>
                <button
                  onClick={() => copyToClipboard(
                    generateMarkdownExport(answers, analysis!),
                    'Copied as Markdown', 'markdown'
                  )}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors"
                  style={{ border: '1px solid #1A202C', color: '#1A202C' }}
                >
                  {copiedId === 'markdown' ? <Check size={14} /> : <FileText size={14} />}
                  {copiedId === 'markdown' ? 'Copied!' : 'Copy as Markdown'}
                </button>
                <button
                  onClick={handleDownloadMd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors"
                  style={{ border: '1px solid #1A202C', color: '#1A202C' }}
                >
                  <Download size={14} /> Download .md
                </button>
              </div>
            </div>
          )}

          {/* 5 Tool Detail Cards */}
          <div className="space-y-6">
            {TOOLS.map((tool, idx) => (
              <ToolDetailCard
                key={tool.id}
                tool={tool}
                analysis={analysis?.[tool.id]}
                stateB={isStateB}
                visible={!isStateB || idx < cardsRevealed}
              />
            ))}
          </div>

          {/* Reset */}
          {isStateB && (
            <div className="text-center mt-8">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm underline transition-colors"
                style={{ color: ACCENT_DARK }}
              >
                <RotateCcw size={14} />
                Start over with different answers
              </button>
            </div>
          )}
        </div>

        {/* ArtifactClosing */}
        <ArtifactClosing
          summaryText="You've mapped the complete 5-tool pipeline for building AI-powered applications — from prototyping to deployment."
          ctaLabel="Explore All Five Levels"
          ctaHref="#"
          accentColor={ACCENT_DARK}
          ctaScrollTo="journey"
        />
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 whitespace-nowrap">
          {toastMessage} &#10003;
        </div>
      )}
    </div>
  );
}
