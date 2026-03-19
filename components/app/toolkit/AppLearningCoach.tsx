import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowDown, Copy, Check, Download, RotateCcw, UserCog,
  ChevronRight, ChevronDown, Code, Eye, Info, Compass, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import LearningPlanBlocker from '../LearningPlanBlocker';
import { upsertToolUsed, createArtefactFromTool, getLearnerCoachProfile, upsertLearnerCoachProfile } from '../../../lib/database';
import type { LearnerCoachProfile } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import CollapsibleOutputCard from './CollapsibleOutputCard';
import LearningCoachEditPanel from './LearningCoachEditPanel';
import {
  PLATFORMS, LEVEL_OBJECTIVES, LEARNING_PREFERENCES,
  EXAMPLE_CHIPS, GENERIC_EXAMPLE_CHIPS, LEVEL_ACCENTS, DEFAULT_ACCENT,
  LEVEL_SHORT_NAMES,
} from '../../../data/learningCoachContent';

const FONT = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

const DRAFT_KEY = 'oxygy_learning_coach_draft';

/* ── Map Learning Coach objectives → curated video topic IDs ── */
const OBJECTIVE_TO_TOPIC_ID: Record<string, string> = {
  // Level 1
  'Prompt Engineering': '1-1',
  'Context Engineering': '1-2',
  'Responsible AI Use': '1-3',
  'Multimodal AI (Image / Video / Audio)': '1-4',
  'Learning How to Learn with AI': '1-5',
  // Level 2
  'What AI Agents Are & Why They Matter': '2-2',
  'Custom GPT / Agent Building': '2-3',
  'System Prompt & Instruction Design': '2-4',
  'Human-in-the-Loop Design': '2-5',
  'Sharing & Standardising Agents': '2-6',
  // Level 3
  'AI Workflow Mapping': '3-1',
  'Agent Chaining & Orchestration': '3-2',
  'Input Logic & Role Mapping': '3-3',
  'Automated Output Generation': '3-4',
  'Human-in-the-Loop at Scale': '3-5',
  'Performance & Feedback Loops': '3-6',
  // Level 4
  'UX Design for AI Outputs': '4-1',
  'Dashboard Prototyping': '4-2',
  'User Journey Mapping': '4-3',
  'Data Visualisation Principles': '4-5',
  'Role-Specific Front-Ends': '4-6',
  // Level 5
  'Application Architecture': '5-1',
  'Personalisation Engines': '5-2',
  'Knowledge Base Applications': '5-3',
  'Custom Learning Platforms': '5-4',
  'Full-Stack AI Integration': '5-5',
  'User Testing & Scaling': '5-6',
};

/* ── Types ── */
interface PathwayStep {
  stepNumber: number;
  platform: string;
  platformName: string;
  feature: string;
  timeEstimate: string;
  activity: string;
  prompt?: string | null;
  instructions: string[];
}

interface GoDeepResource {
  platform: string;
  title: string;
  description: string;
  url?: string | null;
}

interface LearningCoachResponse {
  gapReflection: string;
  approachSummary: string;
  steps: PathwayStep[];
  goDeeper?: GoDeepResource[];
  refinementQuestions: string[];
}

interface YouTubeVideoRecommendation {
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  channelName: string;
  channelDescription: string;
  durationFormatted: string;
  viewCount: number;
  learningMethodType: string;
  relevanceRationale: string;
  watchingTips: string;
}

interface YouTubeGuideResponse {
  summary: string;
  videos: YouTubeVideoRecommendation[];
}

interface NotebookStudioSettings {
  format?: string;
  visualStyle?: string;
  deckType?: string;
  reportSubType?: string;
  difficulty?: string;
  cardCount?: number;
  tone?: string;
}

interface NotebookStudioConfig {
  feature: string;
  settings: NotebookStudioSettings;
  steeringPrompt: string;
  featureInstructions: string;
}

interface NotebookGuideResponse {
  deepResearchPrompt: string;
  studioConfig: NotebookStudioConfig;
}

interface PerplexitySpaceConfig {
  spaceName: string;
  customInstructions: string;
}

interface PerplexityFocusModeConfig {
  focusMode: string;
  searchType: string;
  rationale: string;
  followUpSearches: string[];
}

interface PerplexityGuideResponse {
  deepResearchPrompt: string;
  spaceConfig: PerplexitySpaceConfig;
  focusModeConfig: PerplexityFocusModeConfig;
  followUpQueries: string[];
}

/* ── Loading steps ── */
const INITIAL_LOADING_STEPS = [
  'Analysing your learning gap…',
  'Mapping platform features to your preferences…',
  'Designing your learning sequence…',
  'Generating platform-specific prompts…',
  'Assembling your pathway…',
  'Finalising recommendations…',
];
const REFINE_LOADING_STEPS = [
  'Processing your refinement context…',
  'Re-evaluating platform features…',
  'Adjusting learning sequence…',
  'Updating prompts and instructions…',
  'Quality checks…',
  'Finalising refined pathway…',
];
const STEP_DELAYS = [800, 1500, 3000, 3500, 4000, -1];

const AppLearningCoach: React.FC = () => {
  const { user } = useAuth();
  const { hasLearningPlan, learningPlanLoading } = useAppContext();

  /* ── Input state ── */
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [gapDescription, setGapDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  /* ── Dynamic accent ── */
  const accent = selectedLevel ? LEVEL_ACCENTS[selectedLevel] : DEFAULT_ACCENT;
  const LEVEL_ACCENT = accent.light;
  const LEVEL_ACCENT_DARK = accent.dark;

  /* ── Derived: platform-specific modes ── */
  const isNotebookOnly = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'notebooklm';
  const isYoutubeOnly = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'youtube';
  const isPerplexityOnly = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'perplexity';

  /* ── Output state ── */
  const [result, setResult] = useState<LearningCoachResponse | null>(null);
  const [notebookResult, setNotebookResult] = useState<NotebookGuideResponse | null>(null);
  const [perplexityResult, setPerplexityResult] = useState<PerplexityGuideResponse | null>(null);
  const [youtubeResult, setYoutubeResult] = useState<YouTubeGuideResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefineLoading, setIsRefineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  /* ── Output interaction state ── */
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
  const [visibleBlocks, setVisibleBlocks] = useState(0);

  /* ── Action state ── */
  const [copied, setCopied] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasTrackedUsage, setHasTrackedUsage] = useState(false);

  /* ── Refinement state ── */
  const [refineExpanded, setRefineExpanded] = useState(false);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);

  /* ── Validation ── */
  const [validationFlash, setValidationFlash] = useState<string | null>(null);

  /* ── Learner coach profile (persisted preferences) ── */
  const [coachProfile, setCoachProfile] = useState<LearnerCoachProfile | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  /* ── Explicit step navigation ── */
  const [currentStep, setCurrentStep] = useState(1);

  /* ── Derived (completion conditions per card) ── */
  const card1Ready = !!(selectedLevel && selectedObjective);
  const card2Ready = !!(selectedPreferences.length > 0);
  const card3Ready = !!(selectedPlatforms.length > 0);
  const allInputsDone = card1Ready && card2Ready && card3Ready;
  // Cards are "done" = user explicitly clicked Done AND the content is valid
  const card1Done = card1Ready && currentStep > 1;
  const card2Done = card2Ready && currentStep > 2;
  const card3Done = card3Ready && currentStep > 3;
  const step1Done = allInputsDone;
  const step2Done = !!result || !!notebookResult || !!perplexityResult || !!youtubeResult;

  /* ── Load coach profile on mount (for Edit Profile panel, no pre-selection) ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const profile = await getLearnerCoachProfile(user.id);
      if (profile) setCoachProfile(profile);
    })();
  }, [user]);

  /* ── Draft + result persistence ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        // Clear stale drafts from old format (missing notebookResult with studioConfig)
        if (draft.notebookResult && !draft.notebookResult.studioConfig) {
          localStorage.removeItem(DRAFT_KEY);
          return;
        }
        if (draft.level) setSelectedLevel(draft.level);
        if (draft.objective) setSelectedObjective(draft.objective);
        if (draft.gap) setGapDescription(draft.gap);
        if (draft.platforms && draft.platforms.length) setSelectedPlatforms(draft.platforms);
        if (draft.preferences && draft.preferences.length) setSelectedPreferences(draft.preferences);
        if (typeof draft.currentStep === 'number' && draft.currentStep > 1) setCurrentStep(draft.currentStep);
        if (draft.result) setResult(draft.result);
        if (draft.notebookResult) setNotebookResult(draft.notebookResult);
        if (draft.perplexityResult) setPerplexityResult(draft.perplexityResult);
        if (draft.youtubeResult) setYoutubeResult(draft.youtubeResult);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const hasAnything = selectedLevel || selectedObjective || gapDescription || selectedPlatforms.length || selectedPreferences.length || result || notebookResult || perplexityResult || youtubeResult;
    if (hasAnything) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        level: selectedLevel,
        objective: selectedObjective,
        gap: gapDescription,
        platforms: selectedPlatforms,
        preferences: selectedPreferences,
        currentStep,
        result: result || undefined,
        notebookResult: notebookResult || undefined,
        perplexityResult: perplexityResult || undefined,
        youtubeResult: youtubeResult || undefined,
        savedAt: Date.now(),
      }));
    }
  }, [selectedLevel, selectedObjective, gapDescription, selectedPlatforms, selectedPreferences, currentStep, result, notebookResult, perplexityResult, youtubeResult]);

  /* ── Loading step progression ── */
  useEffect(() => {
    if (!isLoading) {
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
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  /* ── Staggered block animation ── */
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    const totalSections = 3 + (result.steps?.length || 0) + (result.goDeeper?.length ? 1 : 0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalSections; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  /* ── Auto-grow textarea ── */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGapDescription(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(240, Math.max(100, ta.scrollHeight)) + 'px';
  };

  /* ── Example chip click ── */
  const handleChipClick = (text: string) => {
    setGapDescription(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(240, Math.max(100, textareaRef.current.scrollHeight)) + 'px';
    }
  };

  /* ── Toggle helpers ── */
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const togglePreference = (id: string) => {
    setSelectedPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  /* ── Copy helper ── */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, []);

  /* ── Build full pathway markdown ── */
  const buildFullPathway = useCallback((r: LearningCoachResponse): string => {
    const steps = r.steps.map(s => {
      let stepMd = `## Step ${s.stepNumber}: ${s.platformName} — ${s.feature} (${s.timeEstimate})\n\n`;
      stepMd += `${s.activity}\n\n`;
      if (s.prompt) {
        stepMd += `### Prompt\n\n\`\`\`\n${s.prompt}\n\`\`\`\n\n`;
      }
      stepMd += `### Instructions\n\n${s.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n`;
      return stepMd;
    }).join('\n---\n\n');

    return [
      `# Learning Support Guide: ${selectedObjective}`,
      '',
      `> ${r.gapReflection}`,
      '',
      `*${r.approachSummary}*`,
      '',
      '---',
      '',
      steps,
    ].join('\n');
  }, [selectedObjective]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (isLoading) return;
    if (!step1Done) {
      // Flash first incomplete field
      if (!selectedLevel) setValidationFlash('level');
      else if (!selectedObjective) setValidationFlash('objective');
      else if (selectedPlatforms.length === 0) setValidationFlash('platforms');
      else if (selectedPreferences.length === 0) setValidationFlash('preferences');
      setTimeout(() => setValidationFlash(null), 1500);
      return;
    }

    setIsLoading(true);
    setIsRefineLoading(false);
    setError(null);
    setRefineExpanded(false);

    try {
      if (isYoutubeOnly) {
        // YouTube-specific flow — fetch curated videos from backend
        const topicId = OBJECTIVE_TO_TOPIC_ID[selectedObjective || ''];
        if (!topicId) {
          throw new Error('Could not match your selected topic to our video library. Please try a different topic.');
        }

        // Fetch primary (top 3) + backup pool for potential AI-enhanced substitution
        const [primaryRes, backupRes] = await Promise.all([
          fetch(`/api/curated-videos?topicId=${encodeURIComponent(topicId)}`),
          fetch(`/api/curated-videos?topicId=${encodeURIComponent(topicId)}&includeBackup=true`),
        ]);

        if (!primaryRes.ok) {
          const err = await primaryRes.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Failed to fetch curated videos');
        }

        const primaryData = await primaryRes.json();
        const backupData = backupRes.ok ? await backupRes.json() : { videos: [] };

        // Use top 3 primary videos; if user has a niche gap, check backup pool for better matches
        let videosToShow = primaryData.videos || [];

        // If user specified a niche gap, scan backup pool for better matches
        // (simple keyword match — the primary picks stay unless a backup is clearly more relevant)
        if (gapDescription && gapDescription.trim().length > 10 && backupData.videos?.length > 3) {
          const gapLower = gapDescription.toLowerCase();
          const gapWords = gapLower.split(/\s+/).filter((w: string) => w.length > 3);
          const backupOnly = (backupData.videos || []).filter((v: any) => !v.is_primary);

          for (const backup of backupOnly) {
            const titleLower = (backup.title || '').toLowerCase();
            const rationaleLower = (backup.relevance_rationale || '').toLowerCase();
            const matchScore = gapWords.filter((w: string) => titleLower.includes(w) || rationaleLower.includes(w)).length;

            // Only substitute if backup has strong keyword overlap with the gap
            if (matchScore >= 2 && videosToShow.length < 4) {
              videosToShow.push(backup);
            }
          }
        }

        // Format for the YouTubeGuideOutput component
        const formatDuration = (secs: number) => {
          if (!secs) return '0:00';
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = secs % 60;
          if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          return `${m}:${String(s).padStart(2, '0')}`;
        };

        const formattedVideos: YouTubeVideoRecommendation[] = videosToShow.map((v: any) => ({
          videoId: v.youtube_video_id,
          title: v.title,
          url: v.url,
          thumbnailUrl: v.thumbnail_url || `https://i.ytimg.com/vi/${v.youtube_video_id}/hqdefault.jpg`,
          channelName: v.channel_name,
          channelDescription: '', // Not stored — channel section will gracefully hide
          durationFormatted: formatDuration(v.duration_seconds),
          viewCount: v.view_count || 0,
          learningMethodType: v.learning_method_type || 'tutorial',
          relevanceRationale: v.relevance_rationale || '',
          watchingTips: '', // Not stored — tips section will gracefully hide
        }));

        const youtubeResponse: YouTubeGuideResponse = {
          summary: `Based on your interest in "${selectedObjective}"${gapDescription ? ` and your focus on "${gapDescription}"` : ''}, here are the most relevant videos from our curated library. Watch them in order — each builds on the last.`,
          videos: formattedVideos,
        };

        setYoutubeResult(youtubeResponse);
        setResult(null);
        setNotebookResult(null);
        setPerplexityResult(null);
      } else if (isNotebookOnly) {
        // NotebookLM-specific flow
        const response = await fetch('/api/generate-notebook-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: selectedLevel,
            objective: selectedObjective,
            gap: gapDescription,
            preferences: selectedPreferences,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Request failed');
        }

        const data: NotebookGuideResponse = await response.json();
        setNotebookResult(data);
        setPerplexityResult(null);
        setResult(null);
      } else if (isPerplexityOnly) {
        // Perplexity-specific flow
        const response = await fetch('/api/generate-perplexity-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: selectedLevel,
            objective: selectedObjective,
            gap: gapDescription,
            preferences: selectedPreferences,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Request failed');
        }

        const data: PerplexityGuideResponse = await response.json();
        setPerplexityResult(data);
        setNotebookResult(null);
        setResult(null);
      } else {
        // Standard multi-platform pathway flow
        const response = await fetch('/api/generate-learning-pathway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: selectedLevel,
            objective: selectedObjective,
            gap: gapDescription,
            platforms: selectedPlatforms,
            preferences: selectedPreferences,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Request failed');
        }

        const data: LearningCoachResponse = await response.json();
        setResult(data);
        setNotebookResult(null);
        setPerplexityResult(null);
        setExpandedSteps(new Set([0]));
      }

      if (!hasTrackedUsage && user) {
        upsertToolUsed(user.id, selectedLevel!);
        setHasTrackedUsage(true);
      }

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Copy full pathway ── */
  const handleCopyPathway = async () => {
    if (!result) return;
    await copyToClipboard(buildFullPathway(result));
    setCopied(true);
    setToastMessage('Guide copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Download .md ── */
  const handleDownload = () => {
    if (!result) return;
    const date = new Date().toISOString().split('T')[0];
    const content = buildFullPathway(result);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-support-guide-${selectedLevel}-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded as .md');
  };

  /* ── Save to library ── */
  const handleSaveToLibrary = async () => {
    if (!result || !user) return;
    const saved = await createArtefactFromTool(user.id, {
      name: `Learning Support Guide: ${selectedObjective}`,
      type: 'pathway' as any,
      level: selectedLevel!,
      sourceTool: 'learning-coach',
      content: {
        result,
        inputs: {
          level: selectedLevel,
          objective: selectedObjective,
          gap: gapDescription,
          platforms: selectedPlatforms,
          preferences: selectedPreferences,
        },
        markdown: buildFullPathway(result),
      },
      preview: result.gapReflection,
    });
    if (saved) {
      setSavedToLibrary(true);
      setToastMessage('Guide saved to your artefacts');
    }
  };

  /* ── Start Over ── */
  const handleStartOver = () => {
    setResult(null);
    setNotebookResult(null);
    setPerplexityResult(null);
    setYoutubeResult(null);
    setSelectedLevel(null);
    setSelectedObjective(null);
    setGapDescription('');
    setSelectedPlatforms([]);
    setSelectedPreferences([]);
    setCopied(false);
    setSavedToLibrary(false);
    setViewMode('cards');
    setVisibleBlocks(0);
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefinementCount(0);
    setRefineExpanded(false);
    setError(null);
    setCurrentStep(1);
    localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Handle refinement ── */
  const handleRefine = async () => {
    const hasAnswers = Object.values(refinementAnswers).some(a => (a as string).trim());
    if (!hasAnswers && !additionalContext.trim()) return;
    if (!result) return;

    setIsLoading(true);
    setIsRefineLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-learning-pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: selectedLevel,
          objective: selectedObjective,
          gap: gapDescription,
          platforms: selectedPlatforms,
          preferences: selectedPreferences,
          refinement: {
            previousPathway: buildFullPathway(result),
            answers: Object.fromEntries(
              (result.refinementQuestions || []).map((q, i) => [q, refinementAnswers[i] || ''])
            ),
            additionalContext: additionalContext.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }

      const data: LearningCoachResponse = await response.json();
      setResult(data);
      setSavedToLibrary(false);
      setCopied(false);
      setRefinementAnswers({});
      setAdditionalContext('');
      setRefinementCount(c => c + 1);
      setExpandedSteps(new Set([0]));

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const hasRefinementInput = Object.values(refinementAnswers).some(a => (a as string).trim()) || additionalContext.trim();

  /* ── Gate ── */
  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="Learning Coach" />;

  /* ── Get example chips for current level ── */
  const exampleChips = selectedLevel ? (EXAMPLE_CHIPS[selectedLevel] || []) : GENERIC_EXAMPLE_CHIPS;

  /* ── Get platform icon ── */
  const getPlatformIcon = (platformId: string): string => {
    return PLATFORMS.find(p => p.id === platformId)?.icon || '🔧';
  };

  return (
    <div style={{ padding: '28px 36px', fontFamily: FONT }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes ppFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppConnectorFlow {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        @keyframes ppSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>

      {/* ── Page Header Row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#1A202C',
          letterSpacing: '-0.4px', fontFamily: FONT, margin: 0,
        }}>
          Learning Coach
        </h1>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setEditPanelOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#EDF2F7', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              color: '#2D3748', cursor: 'pointer', fontFamily: FONT,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#EDF2F7'; }}
          >
            <UserCog size={14} /> Edit Profile
          </button>
          <button
            onClick={handleStartOver}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#38B2AC', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2C9A94'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#38B2AC'; }}
          >
            <RotateCcw size={14} /> Start Over
          </button>
        </div>
      </div>
      <p style={{
        fontSize: 14, color: '#718096', lineHeight: 1.7,
        margin: 0, marginBottom: 20, fontFamily: FONT,
      }}>
        Describe your knowledge gap, choose how you prefer to learn, and pick your platform. The Learning Coach generates a personalised learning support guide with step-by-step instructions and copy-paste prompts tailored to the AI tools you use.
      </p>

      {/* ── ToolOverview ── */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Describe your gap', detail: 'Pick level, topic & what you want to learn', done: card1Done },
          { number: 2, label: 'Learning method', detail: 'Choose how you prefer to learn', done: card2Done },
          { number: 3, label: 'Choose platform', detail: 'Pick the tool you want to use', done: card3Done },
          { number: 4, label: 'Your guide', detail: 'A personalised learning support guide', done: step2Done },
        ]}
        outcome="A personalised learning support guide with step-by-step instructions and copy-paste prompts tailored to your preferred tools."
        accentLight={LEVEL_ACCENT}
        accentDark={LEVEL_ACCENT_DARK}
      />

      {/* ── Card 1: Describe what you want to learn ── */}
      <StepCard
        stepNumber={1}
        title="Describe what you want to learn"
        subtitle="Pick your level, topic, and describe what you want to go deeper on"
        done={card1Done}
        collapsed={currentStep !== 1}
        accentLight={LEVEL_ACCENT}
        accentDark={LEVEL_ACCENT_DARK}
        onEdit={currentStep > 1 ? () => setCurrentStep(1) : undefined}
      >
        {/* Level Selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
          }}>
            What level are you working on?
            {validationFlash === 'level' && <span style={{ color: '#E53E3E', marginLeft: 8 }}>← Select a level</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {[1, 2, 3, 4, 5].map(lvl => {
              const sel = selectedLevel === lvl;
              const lvlAccent = LEVEL_ACCENTS[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    setSelectedObjective(null);
                  }}
                  style={{
                    background: sel ? lvlAccent.light : '#F7FAFC',
                    border: sel ? `1px solid ${lvlAccent.dark}40` : '1px solid #E2E8F0',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: sel ? 700 : 600,
                    color: sel ? lvlAccent.dark : '#4A5568',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                  }}
                >
                  L{lvl} · {LEVEL_SHORT_NAMES[lvl]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Objective Selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
          }}>
            What topic do you want to learn about?
            {validationFlash === 'objective' && <span style={{ color: '#E53E3E', marginLeft: 8 }}>← Select an objective</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, opacity: selectedLevel ? 1 : 0.4 }}>
            {(selectedLevel ? LEVEL_OBJECTIVES[selectedLevel] : []).map(obj => {
              const sel = selectedObjective === obj;
              return (
                <button
                  key={obj}
                  onClick={() => selectedLevel && setSelectedObjective(obj)}
                  disabled={!selectedLevel}
                  style={{
                    background: sel ? LEVEL_ACCENT : '#F7FAFC',
                    border: sel ? `1px solid ${LEVEL_ACCENT_DARK}40` : '1px solid #E2E8F0',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: sel ? 700 : 600,
                    color: sel ? LEVEL_ACCENT_DARK : '#4A5568',
                    cursor: selectedLevel ? 'pointer' : 'not-allowed',
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                  }}
                >
                  {obj}
                </button>
              );
            })}
            {/* Other option */}
            {selectedLevel && (
              <button
                onClick={() => {
                  setSelectedObjective('Other');
                  textareaRef.current?.focus();
                }}
                style={{
                  background: selectedObjective === 'Other' ? LEVEL_ACCENT : '#F7FAFC',
                  border: selectedObjective === 'Other' ? `1px solid ${LEVEL_ACCENT_DARK}40` : '1px dashed #CBD5E0',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: selectedObjective === 'Other' ? 700 : 600,
                  color: selectedObjective === 'Other' ? LEVEL_ACCENT_DARK : '#718096',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.15s',
                }}
              >
                Other — I'll describe it below
              </button>
            )}
            {!selectedLevel && (
              <span style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>
                Select a level first
              </span>
            )}
          </div>
        </div>

        {/* Gap Description */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
          }}>
            {selectedObjective === 'Other' ? 'Describe what you want to learn' : 'What specifically do you want to learn about this topic?'}
            <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none' as const, letterSpacing: 0, marginLeft: 6, color: '#A0AEC0' }}>(optional)</span>
          </div>
          <textarea
            ref={textareaRef}
            value={gapDescription}
            onChange={handleTextareaChange}
            placeholder={selectedObjective === 'Other'
              ? "Describe the topic or skill you want to learn about — the more specific, the better your pathway will be."
              : "What specifically are you struggling with or want to go deeper on? The more specific you are, the better your pathway will be."
            }
            style={{
              width: '100%',
              minHeight: 100,
              maxHeight: 240,
              resize: 'none' as const,
              fontSize: 14,
              border: validationFlash === 'gap' ? '1px solid #E53E3E' : '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 16px',
              fontFamily: FONT,
              lineHeight: 1.6,
              color: '#1A202C',
              boxSizing: 'border-box' as const,
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = LEVEL_ACCENT_DARK;
              e.target.style.boxShadow = `0 0 0 3px ${LEVEL_ACCENT}25`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.boxShadow = 'none';
            }}
          />
          {/* Example chips */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500, marginTop: 4 }}>Try an example:</span>
            {exampleChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(chip)}
                style={{
                  background: '#F7FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  color: '#4A5568',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  lineHeight: 1.4,
                  textAlign: 'left' as const,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${LEVEL_ACCENT}18`; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F7FAFC'; }}
              >
                {chip.length > 80 ? chip.slice(0, 80) + '…' : chip}
              </button>
            ))}
          </div>
        </div>

        {/* Done button */}
        <StepNavButtons
          onDone={card1Ready ? () => setCurrentStep(2) : undefined}
          doneDisabled={!card1Ready}
          doneLabel="Next: Choose learning method →"
          accentDark={LEVEL_ACCENT_DARK}
        />
      </StepCard>

      {/* ── StepConnector between Card 1 and Card 2 ── */}
      <StepConnector accentColor={LEVEL_ACCENT} />

      {/* ── Card 2: Learning Method ── */}
      <StepCard
        stepNumber={2}
        title="Choose your learning method"
        subtitle="How would you like to learn this topic today?"
        done={card2Done}
        collapsed={currentStep !== 2}
        locked={currentStep < 2}
        lockedMessage="Complete Step 1 first to choose your learning method"
        accentLight={LEVEL_ACCENT}
        accentDark={LEVEL_ACCENT_DARK}
        onEdit={currentStep > 2 ? () => setCurrentStep(2) : undefined}
      >
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4,
          }}>
            Which learning method do you want to use today?
            {validationFlash === 'preferences' && <span style={{ color: '#E53E3E', marginLeft: 8 }}>← Select at least one</span>}
          </div>
          <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 8 }}>Select all that apply</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {LEARNING_PREFERENCES.map(pref => {
              const sel = selectedPreferences.includes(pref.id);
              return (
                <button
                  key={pref.id}
                  onClick={() => togglePreference(pref.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: sel ? `${LEVEL_ACCENT}18` : '#F7FAFC',
                    border: sel ? `2px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: sel ? 600 : 500,
                    color: sel ? '#1A202C' : '#4A5568',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    textAlign: 'left' as const,
                    transition: 'all 0.15s',
                  }}
                >
                  {sel ? <Check size={14} color={LEVEL_ACCENT_DARK} /> : <span style={{ fontSize: 16 }}>{pref.icon}</span>}
                  <div>
                    <div style={{ fontWeight: sel ? 700 : 600 }}>{pref.label}</div>
                    <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{pref.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <StepNavButtons
          onBack={() => setCurrentStep(1)}
          onDone={card2Ready ? () => setCurrentStep(3) : undefined}
          doneDisabled={!card2Ready}
          doneLabel="Next: Choose platform →"
          accentDark={LEVEL_ACCENT_DARK}
        />
      </StepCard>

      {/* ── StepConnector ── */}
      <StepConnector accentColor={LEVEL_ACCENT} />

      {/* ── Card 3: Choose Platform ── */}
      <StepCard
        stepNumber={3}
        title="Choose your platform"
        subtitle="Which tool would you like to use to learn this topic?"
        done={card3Done}
        collapsed={currentStep !== 3}
        locked={currentStep < 3}
        lockedMessage={currentStep < 2 ? 'Complete Steps 1 and 2 first' : 'Complete Step 2 first to choose your platform'}
        onEdit={currentStep > 3 ? () => setCurrentStep(3) : undefined}
        accentLight={LEVEL_ACCENT}
        accentDark={LEVEL_ACCENT_DARK}
      >
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4,
          }}>
            Of the tools you have access to, which would you like to use?
            {validationFlash === 'platforms' && <span style={{ color: '#E53E3E', marginLeft: 8 }}>← Select at least one</span>}
          </div>
          <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 8 }}>Select all that apply</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {PLATFORMS.map(p => {
              const sel = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    background: sel ? `${LEVEL_ACCENT}18` : '#F7FAFC',
                    border: sel ? `2px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '18px 14px',
                    fontSize: 13,
                    fontWeight: sel ? 600 : 500,
                    color: sel ? '#1A202C' : '#4A5568',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    textAlign: 'center' as const,
                    transition: 'all 0.15s',
                  }}
                >
                  {sel ? (
                    <Check size={28} color={LEVEL_ACCENT_DARK} style={{ flexShrink: 0 }} />
                  ) : p.logo ? (
                    <img src={p.logo} alt={p.name} style={{ width: 32, height: 32, flexShrink: 0, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{p.icon}</span>
                  )}
                  <div>
                    <div style={{ fontWeight: sel ? 700 : 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#718096', marginTop: 4, fontWeight: 400, lineHeight: 1.4 }}>
                      {p.shortDescription}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons + Generate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setCurrentStep(2)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none',
              fontSize: 13, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', fontFamily: FONT, padding: '8px 0',
            }}
          >
            <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /> Back
          </button>
          <button
            onClick={() => {
              if (card3Ready) {
                setCurrentStep(4);
                handleSubmit();
              }
            }}
            disabled={isLoading || !card3Ready}
            style={{
              flex: 1,
              background: card3Ready ? LEVEL_ACCENT_DARK : '#CBD5E0',
              color: '#FFFFFF',
              borderRadius: 24,
              padding: '14px 28px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: FONT,
              border: 'none',
              cursor: card3Ready && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading && !isRefineLoading ? 'Generating…' : 'Generate Learning Support Guide →'}
          </button>
        </div>
      </StepCard>

      {/* ── StepConnector ── */}
      <StepConnector accentColor={LEVEL_ACCENT} />

      {/* ── Card 4: Output Zone ── */}
      <div ref={outputRef}>
        <StepCard
          stepNumber={4}
          title={isNotebookOnly ? 'Your NotebookLM Deep Research Guide' : isPerplexityOnly ? 'Your Perplexity Research Guide' : isYoutubeOnly ? 'Your YouTube Learning Guide' : 'Your Learning Support Guide'}
          subtitle={isNotebookOnly ? 'A Deep Research prompt tailored to your topic and learning style' : isPerplexityOnly ? 'A structured research workflow using Perplexity Spaces, Deep Research, and Focus Modes' : isYoutubeOnly ? 'Curated videos matched to your topic and learning style' : 'A personalised, sequenced learning journey across your selected platforms'}
          done={!!result || !!notebookResult || !!perplexityResult || !!youtubeResult}
          collapsed={false}
          locked={currentStep < 4 && !isLoading && !result && !notebookResult && !perplexityResult && !youtubeResult}
          lockedMessage="Complete Steps 1, 2, and 3 to generate your Learning Support Guide"
          accentLight={LEVEL_ACCENT}
          accentDark={LEVEL_ACCENT_DARK}
        >
          {/* Loading state */}
          {isLoading && (
            <ProcessingProgress
              steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
              currentStep={loadingStep}
              header={isRefineLoading ? 'Refining your guide…' : 'Building your Learning Support Guide…'}
              subtext="This usually takes 15–20 seconds"
              accentDark={LEVEL_ACCENT_DARK}
            />
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div style={{
              background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10,
              padding: '14px 18px', color: '#C53030', fontSize: 13, lineHeight: 1.6,
            }}>
              {error}
              <button
                onClick={() => { setError(null); handleSubmit(); }}
                style={{
                  display: 'block', marginTop: 8, background: '#C53030', color: '#FFF',
                  border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* NotebookLM output */}
          {notebookResult && !isLoading && (
            <NotebookGuideOutput
              result={notebookResult}
              accentLight={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              onStartOver={handleStartOver}
            />
          )}

          {/* Perplexity output */}
          {perplexityResult && !isLoading && (
            <PerplexityGuideOutput
              result={perplexityResult}
              accentLight={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              onStartOver={handleStartOver}
            />
          )}

          {/* YouTube output */}
          {youtubeResult && !isLoading && (
            <YouTubeGuideOutput
              result={youtubeResult}
              accentLight={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              onStartOver={handleStartOver}
            />
          )}

          {/* Placeholder state */}
          {!result && !notebookResult && !perplexityResult && !youtubeResult && !isLoading && !error && (
            <div style={{
              textAlign: 'center' as const, padding: '40px 20px', color: '#A0AEC0',
            }}>
              <Sparkles size={16} color="#A0AEC0" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                Your personalised Learning Support Guide will appear here
              </div>
              <div style={{ fontSize: 13, color: '#CBD5E0', marginTop: 4, lineHeight: 1.6 }}>
                Complete the steps above and click 'Generate Learning Support Guide' to get a sequenced, multi-platform learning guide with copy-paste prompts and step-by-step instructions.
              </div>
            </div>
          )}

          {/* Generated content */}
          {result && !isLoading && (
            <div>
              {/* Next Step Banner */}
              <div style={{
                background: `${LEVEL_ACCENT}15`,
                borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`,
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 16,
                opacity: visibleBlocks > 0 ? 1 : 0,
                transform: visibleBlocks > 0 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>
                <Compass size={16} color={LEVEL_ACCENT_DARK} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 2 }}>
                    Follow the steps below in order — each one builds on the last.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>
                    Start with Step 1 and work through the sequence. Copy each prompt directly into the recommended platform and follow the instructions. Come back and refine your pathway if your gap evolves.
                  </div>
                </div>
              </div>

              {/* Top Action Row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap' as const, gap: 8,
              }}>
                {/* Left: Cards / Markdown toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ToggleBtn active={viewMode === 'cards'} onClick={() => setViewMode('cards')} icon={<Eye size={13} />} label="Cards" />
                  <ToggleBtn active={viewMode === 'markdown'} onClick={() => setViewMode('markdown')} icon={<Code size={13} />} label="Markdown" />
                  <div style={{ position: 'relative' as const, display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                    <Info size={12} color="#A0AEC0" />
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <ActionBtn
                    onClick={handleCopyPathway}
                    label={copied ? 'Copied ✓' : 'Copy Full Guide'}
                    primary
                    accentDark={LEVEL_ACCENT_DARK}
                  />
                  <ActionBtn onClick={handleDownload} label="Download (.md)" />
                  <ActionBtn
                    onClick={handleSaveToLibrary}
                    label={savedToLibrary ? 'Saved ✓' : 'Save to Library'}
                    accent="#5A67D8"
                    disabled={savedToLibrary}
                  />
                </div>
              </div>

              {/* Cards View */}
              {viewMode === 'cards' && (
                <div>
                  {/* Zone A — Pathway Header */}
                  <div style={{
                    background: `${LEVEL_ACCENT}15`,
                    borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`,
                    borderRadius: 12,
                    padding: '18px 22px',
                    marginBottom: 16,
                    opacity: visibleBlocks > 1 ? 1 : 0,
                    transform: visibleBlocks > 1 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{
                        background: LEVEL_ACCENT,
                        color: LEVEL_ACCENT_DARK,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontFamily: FONT,
                      }}>
                        Level {selectedLevel}
                      </span>
                      <span style={{ fontSize: 13, color: '#4A5568', fontFamily: FONT }}>
                        {selectedObjective}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 500, color: '#1A202C',
                      lineHeight: 1.6, fontFamily: FONT,
                    }}>
                      {result.gapReflection}
                    </div>
                  </div>

                  {/* Zone B — Approach Summary */}
                  <div style={{
                    borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`,
                    background: `${LEVEL_ACCENT}08`,
                    borderRadius: '0 10px 10px 0',
                    padding: '14px 18px',
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#2D3748',
                    lineHeight: 1.7,
                    fontStyle: 'italic' as const,
                    fontFamily: FONT,
                    marginBottom: 20,
                    opacity: visibleBlocks > 2 ? 1 : 0,
                    transform: visibleBlocks > 2 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }}>
                    {result.approachSummary}
                  </div>

                  {/* Zone C — Sequenced Steps */}
                  {result.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div style={{
                        opacity: visibleBlocks > 3 + idx ? 1 : 0,
                        transform: visibleBlocks > 3 + idx ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                      }}>
                        <CollapsibleOutputCard
                          sectionKey={`step-${idx}`}
                          icon={getPlatformIcon(step.platform)}
                          title={`Step ${step.stepNumber} · ${step.platformName} · ${step.feature} · ${step.timeEstimate}`}
                          summary={step.activity.split('.')[0] + '.'}
                          expanded={expandedSteps.has(idx)}
                          onToggle={() => {
                            setExpandedSteps(prev => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            });
                          }}
                          copyContent={step.prompt || undefined}
                          accentColor={LEVEL_ACCENT_DARK}
                        >
                          {/* Activity */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{
                              fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
                            }}>
                              Activity
                            </div>
                            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, fontFamily: FONT }}>
                              {step.activity}
                            </div>
                          </div>

                          {/* Prompt (conditional) */}
                          {step.prompt && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{
                                fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                                textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
                              }}>
                                Your Prompt
                              </div>
                              <PromptBox text={step.prompt} accentDark={LEVEL_ACCENT_DARK} />
                            </div>
                          )}

                          {/* Instructions */}
                          <div>
                            <div style={{
                              fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
                            }}>
                              How to use this
                            </div>
                            <ol style={{
                              fontSize: 13, color: '#4A5568', lineHeight: 1.7,
                              fontFamily: FONT, paddingLeft: 20, margin: 0,
                            }}>
                              {step.instructions.map((inst, i) => (
                                <li key={i} style={{ marginBottom: 4 }}>{inst}</li>
                              ))}
                            </ol>
                          </div>
                        </CollapsibleOutputCard>
                      </div>

                      {/* StepConnector between step cards */}
                      {idx < result.steps.length - 1 && (
                        <MiniStepConnector accentColor={LEVEL_ACCENT} />
                      )}
                    </React.Fragment>
                  ))}

                  {/* Zone D — Go Deeper (Optional) */}
                  {result.goDeeper && result.goDeeper.length > 0 && (
                    <div style={{
                      borderTop: '1px solid #E2E8F0',
                      paddingTop: 20,
                      marginTop: 24,
                      opacity: visibleBlocks > 3 + result.steps.length ? 1 : 0,
                      transform: visibleBlocks > 3 + result.steps.length ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 12 }}>
                        Reinforce Your Learning
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                        {result.goDeeper.map((res, i) => (
                          <div key={i} style={{
                            background: '#F7FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 10,
                            padding: '12px 16px',
                            flex: '1 1 200px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>{getPlatformIcon(res.platform)}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                                {res.title}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>
                              {res.description}
                            </div>
                            {res.url && (
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: LEVEL_ACCENT_DARK, fontSize: 12, fontWeight: 600, fontFamily: FONT, marginTop: 4, display: 'inline-block' }}
                              >
                                Learn more →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Markdown View */}
              {viewMode === 'markdown' && (
                <div style={{
                  background: '#1A202C',
                  borderRadius: 12,
                  padding: '22px 24px',
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: '#E2E8F0',
                  whiteSpace: 'pre-wrap' as const,
                  wordBreak: 'break-word' as const,
                  overflowX: 'auto' as const,
                }}>
                  {buildFullPathway(result)}
                </div>
              )}

              {/* OutputActionsPanel */}
              <div style={{ marginTop: 24 }}>
                <OutputActionsPanel
                  workflowName="Learning Support Guide"
                  fullMarkdown={buildFullPathway(result)}
                  onSaveToArtefacts={handleSaveToLibrary}
                  isSaved={savedToLibrary}
                />
              </div>

              {/* Refinement Card */}
              <div style={{
                marginTop: 20,
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setRefineExpanded(!refineExpanded)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: LEVEL_ACCENT_DARK }}>
                    Would you like to refine this pathway further?
                    {refinementCount > 0 && (
                      <span style={{
                        background: LEVEL_ACCENT,
                        color: LEVEL_ACCENT_DARK,
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: '2px 8px',
                        marginLeft: 8,
                      }}>
                        {refinementCount} {refinementCount === 1 ? 'refinement' : 'refinements'}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    size={14}
                    color="#A0AEC0"
                    style={{
                      transform: refineExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {refineExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #EDF2F7' }}>
                    {/* Caveat */}
                    <div style={{
                      fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT,
                      fontStyle: 'italic' as const, marginTop: 12, marginBottom: 16,
                    }}>
                      This pathway is a starting point tailored to your described gap. As you work through it, you may discover your gap is different from what you initially thought — that's normal and expected. Come back and refine.
                    </div>

                    {/* Refinement questions */}
                    {result.refinementQuestions?.map((q, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, marginBottom: 4 }}>
                          {q}
                        </div>
                        <textarea
                          value={refinementAnswers[i] || ''}
                          onChange={e => setRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Your answer (optional)"
                          style={{
                            width: '100%',
                            minHeight: 48,
                            resize: 'vertical' as const,
                            fontSize: 13,
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontFamily: FONT,
                            lineHeight: 1.5,
                            color: '#1A202C',
                            boxSizing: 'border-box' as const,
                          }}
                        />
                      </div>
                    ))}

                    {/* Additional context */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', fontFamily: FONT, marginBottom: 4 }}>
                        Anything else to add?
                      </div>
                      <textarea
                        value={additionalContext}
                        onChange={e => setAdditionalContext(e.target.value)}
                        placeholder="Any additional context or changes you'd like…"
                        style={{
                          width: '100%',
                          minHeight: 48,
                          resize: 'vertical' as const,
                          fontSize: 13,
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontFamily: FONT,
                          lineHeight: 1.5,
                          color: '#1A202C',
                          boxSizing: 'border-box' as const,
                        }}
                      />
                    </div>

                    {/* Refine button */}
                    <button
                      onClick={handleRefine}
                      disabled={!hasRefinementInput || isLoading}
                      style={{
                        background: hasRefinementInput ? LEVEL_ACCENT_DARK : '#CBD5E0',
                        color: '#FFFFFF',
                        borderRadius: 20,
                        padding: '10px 24px',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: FONT,
                        border: 'none',
                        cursor: hasRefinementInput && !isLoading ? 'pointer' : 'not-allowed',
                        transition: 'background 0.15s',
                      }}
                    >
                      {isLoading && isRefineLoading ? 'Refining…' : 'Refine Pathway'}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Navigation Row */}
              <div style={{
                display: 'flex', justifyContent: 'flex-start', marginTop: 20, gap: 12,
              }}>
                <ActionBtn onClick={handleStartOver} label="Start Over" icon={<RotateCcw size={12} />} />
              </div>

              {/* Pathway Metadata Footer */}
              <div style={{
                borderTop: '1px solid #E2E8F0',
                paddingTop: 12,
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap' as const,
              }}>
                <span style={{
                  background: LEVEL_ACCENT,
                  color: LEVEL_ACCENT_DARK,
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontFamily: FONT,
                }}>
                  L{selectedLevel}
                </span>
                <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>{selectedObjective}</span>
                <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
                  {selectedPlatforms.map(id => getPlatformIcon(id)).join(' ')}
                </span>
                <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
                  {selectedPreferences.map(id => LEARNING_PREFERENCES.find(p => p.id === id)?.label || id).join(', ')}
                </span>
                <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </StepCard>
      </div>

      {/* ── Toast ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed' as const,
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A202C',
          color: '#FFFFFF',
          padding: '10px 24px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          zIndex: 1000,
          animation: 'ppFadeIn 0.2s ease both',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toastMessage}
        </div>
      )}

      {/* ── Edit Profile Panel ── */}
      <LearningCoachEditPanel
        open={editPanelOpen}
        onClose={() => setEditPanelOpen(false)}
        preferences={coachProfile?.preferences || selectedPreferences}
        platforms={coachProfile?.platforms || selectedPlatforms}
        additionalContext={coachProfile?.additionalContext || ''}
        onSave={async (data) => {
          if (!user) return;
          const ok = await upsertLearnerCoachProfile(user.id, data);
          if (ok) {
            const updated = await getLearnerCoachProfile(user.id);
            if (updated) setCoachProfile(updated);
            setSelectedPlatforms(data.platforms);
            setSelectedPreferences(data.preferences);
            setEditPanelOpen(false);
            setToastMessage('Learning profile updated');
          }
        }}
      />
    </div>
  );
};

export default AppLearningCoach;

/* ═════════════════════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════════════════════ */

const FONT_SUB = "'DM Sans', sans-serif";

/* ── ToolOverview (matches Prompt Playground pattern) ── */
const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean }[];
  outcome: string;
  accentLight: string;
  accentDark: string;
}> = ({ steps, outcome, accentLight, accentDark }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
    padding: '20px 24px', marginBottom: 24,
  }}>
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#A0AEC0',
      textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 14,
      fontFamily: FONT_SUB,
    }}>
      How it works
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.number}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: s.done ? accentLight : '#F7FAFC',
              border: s.done ? 'none' : '2px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: s.done ? accentDark : '#718096',
              transition: 'all 0.3s ease',
            }}>
              {s.done ? <Check size={12} /> : s.number}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 2, fontFamily: FONT_SUB }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT_SUB }}>
                {s.detail}
              </div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} color="#CBD5E0" style={{ flexShrink: 0, margin: '0 10px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
    <div style={{
      background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10,
      padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#276749',
        textTransform: 'uppercase' as const, letterSpacing: '0.04em', flexShrink: 0, marginTop: 1,
        fontFamily: FONT_SUB,
      }}>
        Outcome
      </div>
      <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.5, fontFamily: FONT_SUB }}>
        {outcome}
      </div>
    </div>
  </div>
);

/* ── Channel description lookup (extracted from scored video data) ── */
const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  "AI Engineer": "Talks, workshops, events, and training for AI Engineers.",
  "Anthropic": "AI safety and research company. Creators of Claude — focused on building reliable, interpretable AI systems.",
  "Aurelius Tjin": "Simplifies digital tech so you can become a productive digital creator. Covers AI tools, productivity tips, and digital marketing.",
  "Cole Medin": "Teaches how to build impactful AI agents and use AI coding assistants. Focused on practical AI agent development.",
  "Dewain Robinson": "Helps people leverage Copilot Studio to build powerful Copilots and business automations.",
  "Dylan Davis": "Professional AI Whisperer at Gradient Labs. Shows practical AI automation tricks and workflows.",
  "ElevenLabs": "Transforming how we interact with technology through advanced AI voice and audio generation.",
  "Google for Developers": "Educational content on the latest in Google technology — from AI and cloud, to mobile and web development.",
  "IBM Technology": "Educational content on AI, automation, cybersecurity, data science, DevOps, and quantum computing.",
  "Jeff Su": "Practical career and productivity tips for working professionals — no fluff. Created by a Product Marketer.",
  "Kevin Stratvert": "High-quality how-to videos teaching millions of students practical technology skills across platforms.",
  "Lenny's Podcast": "Interviews with world-class product leaders and growth experts for concrete, actionable advice.",
  "Liam Ottley": "AI entrepreneur and creator of the AI Automation Agency model. Teaches building AI-powered businesses.",
  "Matthew Berman": "Makes AI and emerging technology accessible to everyone. Translates frontier research into practical understanding.",
  "Microsoft Community Learning": "Technical skilling content on Copilot experiences, Microsoft 365, Power Platform, and Microsoft Viva.",
  "n8n": "Workflow automation platform combining AI capabilities with business process automation. Connect any app or API.",
  "Nate Herk": "Helps businesses unlock the power of AI Automations to save time, cut costs, and stay competitive.",
  "OpenAI": "Creators of ChatGPT. Mission is to ensure artificial general intelligence benefits all of humanity.",
  "Skill Leap AI": "Step-by-step AI tutorials and tool reviews. Making AI accessible with easy-to-follow walkthroughs.",
  "Tina Huang": "Ex-Meta data scientist. Teaches AI concepts and data science skills in accessible, practical formats.",
  "Y Combinator": "The world's leading startup accelerator. Content on building and scaling technology companies.",
};

/* ── YouTubeGuideOutput — 3-column card layout ── */
const YouTubeGuideOutput: React.FC<{
  result: YouTubeGuideResponse;
  accentLight: string;
  accentDark: string;
  onStartOver: () => void;
}> = ({ result, accentLight, accentDark, onStartOver }) => {
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);

  const formatViews = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M views`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K views`;
    return `${n} views`;
  };

  const methodLabels: Record<string, { label: string; color: string }> = {
    tutorial: { label: 'Tutorial', color: '#5A67D8' },
    explainer: { label: 'Explainer', color: '#D69E2E' },
    walkthrough: { label: 'Walkthrough', color: '#38A169' },
    commentary: { label: 'Commentary', color: '#718096' },
    primer: { label: 'Primer', color: '#DD6B20' },
  };

  const getChannelDesc = (name: string) => CHANNEL_DESCRIPTIONS[name] || '';

  const YT_RED = '#FF0000';

  return (
    <div>
      {/* Summary */}
      <div style={{
        background: `${accentLight}15`,
        borderLeft: `4px solid ${accentDark}`,
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 20,
        fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT_SUB,
      }}>
        {result.summary}
      </div>

      {/* 3-column video cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(result.videos.length, 3)}, 1fr)`,
        gap: 16,
        marginBottom: 16,
      }}>
        {result.videos.slice(0, 3).map((video, idx) => {
          const isExpanded = expandedVideo === idx;
          const method = methodLabels[video.learningMethodType] || methodLabels.tutorial;

          return (
            <div
              key={video.videoId}
              style={{
                background: '#FFFFFF',
                border: isExpanded ? `2px solid ${YT_RED}` : '1px solid #E2E8F0',
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: isExpanded ? `0 4px 20px ${YT_RED}18` : '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column' as const,
              }}
              onClick={() => setExpandedVideo(isExpanded ? null : idx)}
            >
              {/* Thumbnail — use maxresdefault for HD, fallback to hqdefault */}
              <div style={{ position: 'relative' as const }}>
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`; }}
                  style={{
                    width: '100%', display: 'block',
                    aspectRatio: '16/9', objectFit: 'cover',
                  }}
                />
                {/* Rank badge — YouTube red */}
                <div style={{
                  position: 'absolute' as const, top: 10, left: 10,
                  width: 28, height: 28, borderRadius: '50%',
                  background: YT_RED, color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}>
                  {idx + 1}
                </div>
                {/* Duration badge */}
                <span style={{
                  position: 'absolute' as const, bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.75)', color: '#FFF',
                  fontSize: 11, fontWeight: 600, borderRadius: 4,
                  padding: '2px 6px', fontFamily: FONT_SUB,
                }}>
                  {video.durationFormatted}
                </span>
                {/* Play overlay on hover */}
                <div style={{
                  position: 'absolute' as const, inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: YT_RED,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 0, height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderLeft: '14px solid #FFFFFF',
                      marginLeft: 2,
                    }} />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                {/* Title */}
                <div style={{
                  fontSize: 14, fontWeight: 700, fontFamily: FONT_SUB,
                  color: '#1A202C', lineHeight: 1.4, marginBottom: 8,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                  overflow: 'hidden',
                }}>
                  {video.title}
                </div>

                {/* Channel + meta */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#4A5568', fontFamily: FONT_SUB,
                    marginBottom: 2,
                  }}>
                    {video.channelName}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const,
                  }}>
                    <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT_SUB }}>
                      {formatViews(video.viewCount)}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: method.color,
                      background: `${method.color}12`,
                      borderRadius: 8, padding: '2px 7px',
                      textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                    }}>
                      {method.label}
                    </span>
                  </div>
                </div>

                {/* Why this video — always visible as a teaser */}
                {video.relevanceRationale && (
                  <div style={{
                    fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT_SUB,
                    flex: 1,
                    display: '-webkit-box', WebkitLineClamp: isExpanded ? 99 : 2, WebkitBoxOrient: 'vertical' as any,
                    overflow: 'hidden',
                  }}>
                    {video.relevanceRationale}
                  </div>
                )}

                {/* Footer actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 10, paddingTop: 8,
                  borderTop: '1px solid #F0F0F0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 11, color: YT_RED, fontWeight: 600, fontFamily: FONT_SUB,
                    }}>
                      {isExpanded ? 'Less' : 'More details'}
                    </span>
                    <ChevronDown
                      size={14}
                      color={YT_RED}
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#FFFFFF', color: YT_RED,
                      border: `1px solid ${YT_RED}`,
                      borderRadius: 6, padding: '5px 12px',
                      fontSize: 11, fontWeight: 600,
                      fontFamily: FONT_SUB, textDecoration: 'none',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <img src="/logos/brands/youtube.svg" alt="" style={{ width: 14, height: 14 }} />
                    Watch
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded detail panel — below the cards */}
      {expandedVideo !== null && result.videos[expandedVideo] && (() => {
        const video = result.videos[expandedVideo];
        const channelDesc = getChannelDesc(video.channelName);

        return (
          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${YT_RED}25`,
            borderRadius: 14,
            padding: '24px',
            marginBottom: 16,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: YT_RED, color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {expandedVideo + 1}
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, fontFamily: FONT_SUB, color: '#1A202C',
              }}>
                {video.title}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
            }}>
              {/* Left column — Why + Watching tips */}
              <div>
                {video.relevanceRationale && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: accentDark,
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
                      fontFamily: FONT_SUB,
                    }}>
                      Why this video
                    </div>
                    <div style={{
                      fontSize: 13, color: '#2D3748', lineHeight: 1.6, fontFamily: FONT_SUB,
                    }}>
                      {video.relevanceRationale}
                    </div>
                  </div>
                )}

                {video.watchingTips && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: accentDark,
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
                      fontFamily: FONT_SUB,
                    }}>
                      Watching tips
                    </div>
                    <div style={{
                      fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT_SUB,
                      fontStyle: 'italic' as const,
                    }}>
                      {video.watchingTips}
                    </div>
                  </div>
                )}

                {/* Watch on YouTube button */}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#FFFFFF', color: YT_RED,
                    border: `1px solid ${YT_RED}`, borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: FONT_SUB, textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <img src="/logos/brands/youtube.svg" alt="" style={{ width: 16, height: 16 }} />
                  Watch on YouTube
                </a>
              </div>

              {/* Right column — About the channel */}
              <div style={{
                background: '#F7FAFC',
                border: '1px solid #EDF2F7',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: accentDark,
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
                  fontFamily: FONT_SUB,
                }}>
                  About the channel
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: '#1A202C', fontFamily: FONT_SUB,
                  marginBottom: 6,
                }}>
                  {video.channelName}
                </div>
                {channelDesc && (
                  <div style={{
                    fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
                    marginBottom: 12,
                  }}>
                    {channelDesc}
                  </div>
                )}
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap' as const,
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 2, fontFamily: FONT_SUB }}>
                      Duration
                    </div>
                    <div style={{ fontSize: 13, color: '#2D3748', fontWeight: 600, fontFamily: FONT_SUB }}>
                      {video.durationFormatted}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 2, fontFamily: FONT_SUB }}>
                      Views
                    </div>
                    <div style={{ fontSize: 13, color: '#2D3748', fontWeight: 600, fontFamily: FONT_SUB }}>
                      {formatViews(video.viewCount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 2, fontFamily: FONT_SUB }}>
                      Type
                    </div>
                    <div style={{ fontSize: 13, color: '#2D3748', fontWeight: 600, fontFamily: FONT_SUB, textTransform: 'capitalize' as const }}>
                      {video.learningMethodType}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Extra videos (4+) shown as a compact list below */}
      {result.videos.length > 3 && (
        <div style={{
          background: '#FAFBFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#A0AEC0',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
            fontFamily: FONT_SUB,
          }}>
            Additional recommendations
          </div>
          {result.videos.slice(3).map((video, rawIdx) => {
            const idx = rawIdx + 3;
            const method = methodLabels[video.learningMethodType] || methodLabels.tutorial;
            return (
              <div
                key={video.videoId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderTop: rawIdx > 0 ? '1px solid #EDF2F7' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedVideo(expandedVideo === idx ? null : idx)}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: expandedVideo === idx ? accentDark : '#E2E8F0',
                  color: expandedVideo === idx ? '#FFFFFF' : '#718096',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT_SUB,
                    whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT_SUB }}>
                    {video.channelName} · {video.durationFormatted}
                  </div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: method.color,
                  background: `${method.color}12`,
                  borderRadius: 8, padding: '2px 7px', flexShrink: 0,
                  textTransform: 'uppercase' as const,
                }}>
                  {method.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Over */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={onStartOver}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 8,
            padding: '8px 14px', fontSize: 12, fontWeight: 600,
            color: '#4A5568', cursor: 'pointer', fontFamily: FONT_SUB,
          }}
        >
          <RotateCcw size={12} /> Start Over
        </button>
      </div>
    </div>
  );
};

/* ── CopyButton (small reusable copy button) ── */
const CopyButton: React.FC<{ text: string; label?: string; accentDark: string }> = ({ text, label = 'Copy Prompt', accentDark }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 12,
        background: copied ? '#38A169' : accentDark,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: FONT_SUB,
        transition: 'background 0.15s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
};

/* ── ProcessStep (collapsible step in the notebook guide) ── */
const ProcessStep: React.FC<{
  number: number;
  title: string;
  summary: string;
  expanded: boolean;
  completed: boolean;
  onToggle: () => void;
  onComplete: () => void;
  accentDark: string;
  accentLight: string;
  isLast?: boolean;
  children: React.ReactNode;
}> = ({ number, title, summary, expanded, completed, onToggle, onComplete, accentDark, accentLight, isLast, children }) => (
  <div>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '16px 0',
    }}>
      {/* Step number / check circle — clickable to mark complete */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        title={completed ? 'Mark as incomplete' : 'Mark as complete'}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: completed ? '#38A169' : expanded ? accentDark : accentLight,
          color: completed ? '#FFFFFF' : expanded ? '#FFFFFF' : accentDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1,
          border: 'none', cursor: 'pointer', padding: 0,
          transition: 'all 0.2s',
        }}
      >
        {completed ? <Check size={14} /> : number}
      </button>

      {/* Title + summary — clickable to expand/collapse */}
      <button
        onClick={onToggle}
        style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'flex-start',
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: FONT_SUB,
          textAlign: 'left' as const,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: FONT_SUB,
            color: completed ? '#A0AEC0' : '#1A202C',
            textDecoration: completed ? 'line-through' : 'none',
          }}>
            {title}
          </div>
          {!completed && (
            <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5, fontFamily: FONT_SUB, marginTop: 2 }}>
              {summary}
            </div>
          )}
        </div>
        <ChevronDown
          size={16}
          color="#A0AEC0"
          style={{
            flexShrink: 0, marginTop: 4, marginLeft: 8,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
    </div>

    {/* Expandable detail */}
    {expanded && (
      <div style={{
        marginLeft: 42,
        paddingBottom: 16,
      }}>
        {children}
      </div>
    )}

    {/* Connector line */}
    {!isLast && (
      <div style={{
        width: 2, height: 20, background: completed ? '#C6F6D5' : '#E2E8F0',
        marginLeft: 13, borderRadius: 1,
        transition: 'background 0.2s',
      }} />
    )}
  </div>
);

/* ── NotebookGuideOutput ── */
/* ── PerplexityGuideOutput ── */
const PerplexityGuideOutput: React.FC<{
  result: PerplexityGuideResponse;
  accentLight: string;
  accentDark: string;
  onStartOver: () => void;
}> = ({ result, accentLight, accentDark, onStartOver }) => {
  const [expandedStep, setExpandedStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const sc = result.spaceConfig;
  const fm = result.focusModeConfig;

  const toggleComplete = (step: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
        for (let i = step + 1; i <= 4; i++) {
          if (!next.has(i)) { setExpandedStep(i); break; }
        }
      }
      return next;
    });
  };

  return (
    <div>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '8px 24px 4px',
      }}>
        {/* Step 1: Create a Space */}
        <ProcessStep
          number={1}
          title="Create a Perplexity Space"
          summary="Set up a dedicated Space for this learning topic with custom instructions."
          expanded={expandedStep === 1}
          completed={completedSteps.has(1)}
          onToggle={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
          onComplete={() => toggleComplete(1)}
          accentDark={accentDark}
          accentLight={accentLight}
        >
          {sc && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
                fontFamily: FONT_SUB,
              }}>
                Space Name
              </div>
              <div style={{
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderLeft: `3px solid ${accentDark}`,
                borderRadius: '0 8px 8px 0',
                padding: '12px 16px',
                fontSize: 14,
                fontFamily: FONT_SUB,
                fontWeight: 600,
                color: '#1A202C',
              }}>
                {sc.spaceName}
              </div>

              <div style={{
                fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 16, marginBottom: 8,
                fontFamily: FONT_SUB,
              }}>
                Custom Instructions
              </div>
              <div style={{
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderLeft: `3px solid ${accentDark}`,
                borderRadius: '0 8px 8px 0',
                padding: '14px 16px',
                fontSize: 13,
                fontFamily: FONT_SUB,
                color: '#2D3748',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap' as const,
              }}>
                {sc.customInstructions}
              </div>
              <CopyButton text={sc.customInstructions} label="Copy Instructions" accentDark={accentDark} />
              <div style={{
                fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
                marginTop: 14, fontStyle: 'italic' as const,
              }}>
                Go to perplexity.ai → Spaces → Create New Space. Name it as above, then paste the custom instructions into the Space settings.
              </div>
            </div>
          )}
        </ProcessStep>

        {/* Step 2: Run Deep Research */}
        <ProcessStep
          number={2}
          title="Run Deep Research"
          summary="Paste this prompt into your Space to run a comprehensive Deep Research query."
          expanded={expandedStep === 2}
          completed={completedSteps.has(2)}
          onToggle={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
          onComplete={() => toggleComplete(2)}
          accentDark={accentDark}
          accentLight={accentLight}
        >
          <div style={{
            background: '#F7FAFC',
            border: '1px solid #E2E8F0',
            borderLeft: `3px solid ${accentDark}`,
            borderRadius: '0 8px 8px 0',
            padding: '16px 18px',
            fontSize: 14,
            fontFamily: FONT_SUB,
            color: '#2D3748',
            lineHeight: 1.7,
            wordBreak: 'break-word' as const,
            whiteSpace: 'pre-wrap' as const,
          }}>
            {result.deepResearchPrompt}
          </div>
          <CopyButton text={result.deepResearchPrompt} accentDark={accentDark} />
          <div style={{
            fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
            marginTop: 14, fontStyle: 'italic' as const,
          }}>
            Inside your Space, click the search bar and select "Deep Research" from the search type options. Paste the prompt above and run it. This will take a few minutes — Perplexity will search dozens of sources and compile a comprehensive report.
          </div>
        </ProcessStep>

        {/* Step 3: Explore with Focus Mode */}
        {fm && (
          <ProcessStep
            number={3}
            title={`Explore with ${fm.focusMode} Focus Mode`}
            summary={fm.rationale}
            expanded={expandedStep === 3}
            completed={completedSteps.has(3)}
            onToggle={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
            onComplete={() => toggleComplete(3)}
            accentDark={accentDark}
            accentLight={accentLight}
          >
            {/* Settings */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
                fontFamily: FONT_SUB,
              }}>
                Settings
              </div>
              <div style={{
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '10px 16px',
                  borderBottom: '1px solid #EDF2F7',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#718096', width: 140, flexShrink: 0, fontFamily: FONT_SUB }}>
                    Focus Mode
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT_SUB }}>
                    {fm.focusMode}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '10px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#718096', width: 140, flexShrink: 0, fontFamily: FONT_SUB }}>
                    Search Type
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT_SUB }}>
                    {fm.searchType}
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up searches */}
            {fm.followUpSearches?.length > 0 && (
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
                  fontFamily: FONT_SUB,
                }}>
                  Follow-Up Searches
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fm.followUpSearches.map((q, i) => (
                    <div key={i} style={{
                      background: '#F7FAFC',
                      border: '1px solid #E2E8F0',
                      borderLeft: `3px solid ${accentDark}`,
                      borderRadius: '0 8px 8px 0',
                      padding: '10px 14px',
                      fontSize: 13,
                      fontFamily: FONT_SUB,
                      color: '#2D3748',
                      lineHeight: 1.5,
                    }}>
                      {q}
                    </div>
                  ))}
                </div>
                <div style={{
                  fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
                  marginTop: 14, fontStyle: 'italic' as const,
                }}>
                  Switch to {fm.focusMode} Focus Mode using the dropdown next to the search bar, then run each query above. These are designed to deepen your understanding from different angles.
                </div>
              </div>
            )}
          </ProcessStep>
        )}

        {/* Step 4: Deepen with Follow-Up Queries */}
        {result.followUpQueries?.length > 0 && (
          <ProcessStep
            number={4}
            title="Deepen Your Understanding"
            summary="Run these follow-up queries to explore foundational, practical, and advanced angles."
            expanded={expandedStep === 4}
            completed={completedSteps.has(4)}
            onToggle={() => setExpandedStep(expandedStep === 4 ? 0 : 4)}
            onComplete={() => toggleComplete(4)}
            accentDark={accentDark}
            accentLight={accentLight}
            isLast
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.followUpQueries.map((q, i) => {
                const labels = ['Foundational', 'Practical / Applied', 'Advanced / Nuanced'];
                return (
                  <div key={i}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: accentDark,
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4,
                      fontFamily: FONT_SUB,
                    }}>
                      {labels[i] || `Query ${i + 1}`}
                    </div>
                    <div style={{
                      background: '#F7FAFC',
                      border: '1px solid #E2E8F0',
                      borderLeft: `3px solid ${accentDark}`,
                      borderRadius: '0 8px 8px 0',
                      padding: '10px 14px',
                      fontSize: 13,
                      fontFamily: FONT_SUB,
                      color: '#2D3748',
                      lineHeight: 1.5,
                    }}>
                      {q}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
              marginTop: 14, fontStyle: 'italic' as const,
            }}>
              Run these queries inside your Space using Pro Search. Each targets a different depth — together they give you a well-rounded understanding of the topic.
            </div>
          </ProcessStep>
        )}
      </div>

      {/* Start Over */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={onStartOver}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 8,
            padding: '8px 14px', fontSize: 12, fontWeight: 600,
            color: '#4A5568', cursor: 'pointer', fontFamily: FONT_SUB,
          }}
        >
          <RotateCcw size={12} /> Start Over
        </button>
      </div>
    </div>
  );
};

const NotebookGuideOutput: React.FC<{
  result: NotebookGuideResponse;
  accentLight: string;
  accentDark: string;
  onStartOver: () => void;
}> = ({ result, accentLight, accentDark, onStartOver }) => {
  const [expandedStep, setExpandedStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const sc = result.studioConfig;
  const settings = sc?.settings || {};

  const totalSteps = sc?.steeringPrompt ? 4 : 2;
  const toggleComplete = (step: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
        // Auto-advance: expand the next uncompleted step
        for (let i = step + 1; i <= totalSteps; i++) {
          if (!next.has(i)) { setExpandedStep(i); break; }
        }
      }
      return next;
    });
  };

  /* Sub-step checklist state */
  const [checkedInstructions, setCheckedInstructions] = useState<Set<number>>(new Set());
  const toggleInstruction = (idx: number) => {
    setCheckedInstructions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  /* Build settings rows */
  const settingRows: { label: string; value: string }[] = [];
  if (settings.format) settingRows.push({ label: 'Format', value: settings.format });
  if (settings.visualStyle) settingRows.push({ label: 'Visual Style', value: settings.visualStyle });
  if (settings.deckType) settingRows.push({ label: 'Deck Type', value: settings.deckType });
  if (settings.reportSubType) settingRows.push({ label: 'Report Type', value: settings.reportSubType });
  if (settings.difficulty) settingRows.push({ label: 'Difficulty', value: settings.difficulty });
  if (settings.cardCount) settingRows.push({ label: 'Number of Cards', value: String(settings.cardCount) });
  if (settings.tone) settingRows.push({ label: 'Tone', value: settings.tone });

  return (
    <div>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '8px 24px 4px',
      }}>
        {/* Step 1: Deep Research */}
        <ProcessStep
          number={1}
          title="Run Deep Research"
          summary="Paste this prompt into NotebookLM's Deep Research feature to build your source material."
          expanded={expandedStep === 1}
          completed={completedSteps.has(1)}
          onToggle={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
          onComplete={() => toggleComplete(1)}
          accentDark={accentDark}
          accentLight={accentLight}
        >
          <div style={{
            background: '#F7FAFC',
            border: '1px solid #E2E8F0',
            borderLeft: `3px solid ${accentDark}`,
            borderRadius: '0 8px 8px 0',
            padding: '16px 18px',
            fontSize: 14,
            fontFamily: FONT_SUB,
            color: '#2D3748',
            lineHeight: 1.7,
            wordBreak: 'break-word' as const,
            whiteSpace: 'pre-wrap' as const,
          }}>
            {result.deepResearchPrompt}
          </div>
          <CopyButton text={result.deepResearchPrompt} accentDark={accentDark} />
          <div style={{
            fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
            marginTop: 14, fontStyle: 'italic' as const,
          }}>
            Deep Research will search the web and compile sources into a structured notebook. Wait for it to finish before moving to Step 2.
          </div>
        </ProcessStep>

        {/* Step 2: Open Studio Feature & Choose Settings */}
        {sc && (
          <ProcessStep
            number={2}
            title={`Open ${sc.feature}`}
            summary={`Open the Studio panel and select the ${sc.feature} tile. Apply these settings before generating.`}
            expanded={expandedStep === 2}
            completed={completedSteps.has(2)}
            onToggle={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
            onComplete={() => toggleComplete(2)}
            accentDark={accentDark}
            accentLight={accentLight}
            isLast={!sc.steeringPrompt}
          >
            {/* Settings table */}
            {settingRows.length > 0 && (
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
                  fontFamily: FONT_SUB,
                }}>
                  Settings
                </div>
                <div style={{
                  background: '#F7FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}>
                  {settingRows.map((row, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: i < settingRows.length - 1 ? '1px solid #EDF2F7' : 'none',
                    }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: '#718096', width: 140,
                        flexShrink: 0, fontFamily: FONT_SUB,
                      }}>
                        {row.label}
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT_SUB,
                      }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{
              fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
              marginTop: 14, fontStyle: 'italic' as const,
            }}>
              Click the {sc.feature} tile in the Studio panel, then apply the settings above. Do not click Generate yet — add the Steering Prompt first.
            </div>
          </ProcessStep>
        )}

        {/* Step 3: Paste the Steering Prompt */}
        {sc?.steeringPrompt && (
          <ProcessStep
            number={3}
            title="Paste the Steering Prompt"
            summary={`Click the pencil/customise icon on the ${sc.feature} tile to open the Steering Prompt field, then paste this prompt.`}
            expanded={expandedStep === 3}
            completed={completedSteps.has(3)}
            onToggle={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
            onComplete={() => toggleComplete(3)}
            accentDark={accentDark}
            accentLight={accentLight}
          >
            <div style={{
              background: '#F7FAFC',
              border: '1px solid #E2E8F0',
              borderLeft: `3px solid ${accentDark}`,
              borderRadius: '0 8px 8px 0',
              padding: '14px 16px',
              fontSize: 13,
              fontFamily: FONT_SUB,
              color: '#2D3748',
              lineHeight: 1.6,
              wordBreak: 'break-word' as const,
              whiteSpace: 'pre-wrap' as const,
            }}>
              {sc.steeringPrompt}
            </div>
            <CopyButton text={sc.steeringPrompt} label="Copy Steering Prompt" accentDark={accentDark} />
          </ProcessStep>
        )}

        {/* Step 4: Click Generate */}
        {sc?.steeringPrompt && (
          <ProcessStep
            number={4}
            title="Click Generate"
            summary={`Once your settings and Steering Prompt are in place, click 'Generate' to create your ${sc.feature}.`}
            expanded={expandedStep === 4}
            completed={completedSteps.has(4)}
            onToggle={() => setExpandedStep(expandedStep === 4 ? 0 : 4)}
            onComplete={() => toggleComplete(4)}
            accentDark={accentDark}
            accentLight={accentLight}
            isLast
          >
            <div style={{
              fontSize: 13, color: '#2D3748', lineHeight: 1.6, fontFamily: FONT_SUB,
            }}>
              With your settings configured and Steering Prompt pasted, click the <strong>Generate</strong> button on the {sc.feature} tile. NotebookLM will use your Deep Research sources and steering prompt to create a tailored {sc.feature.toLowerCase()}.
            </div>
            <div style={{
              fontSize: 12, color: '#718096', lineHeight: 1.6, fontFamily: FONT_SUB,
              marginTop: 14, fontStyle: 'italic' as const,
            }}>
              Generation typically takes 1–3 minutes depending on source length. You can close and return — NotebookLM will keep generating in the background.
            </div>
          </ProcessStep>
        )}
      </div>

      {/* Start Over */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={onStartOver}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 8,
            padding: '8px 14px', fontSize: 12, fontWeight: 600,
            color: '#4A5568', cursor: 'pointer', fontFamily: FONT_SUB,
          }}
        >
          <RotateCcw size={12} /> Start Over
        </button>
      </div>
    </div>
  );
};

/* ── StepCard (supports locked state per Toolkit Standard §1.3) ── */
const StepCard: React.FC<{
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  locked?: boolean;
  lockedMessage?: string;
  onEdit?: () => void;
  accentLight: string;
  accentDark: string;
  children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, onEdit, accentLight, accentDark, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF',
    border: done ? `2px solid ${accentDark}30` : '1px solid #E2E8F0',
    borderRadius: 14,
    padding: '20px 24px',
    marginBottom: 0,
    opacity: locked ? 0.7 : 1,
    transition: 'border-color 0.3s ease, opacity 0.3s ease',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (collapsed || locked) ? 0 : 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? accentDark : locked ? '#EDF2F7' : '#EDF2F7',
        color: done ? '#FFFFFF' : locked ? '#CBD5E0' : '#A0AEC0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, fontFamily: FONT_SUB, flexShrink: 0,
        transition: 'all 0.3s ease',
      }}>
        {done ? <Check size={14} /> : stepNumber}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: FONT_SUB }}>{title}</div>
        {locked && lockedMessage ? (
          <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT_SUB }}>{lockedMessage}</div>
        ) : (
          <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT_SUB }}>{subtitle}</div>
        )}
      </div>
      {/* Edit button when collapsed & done */}
      {collapsed && done && onEdit && (
        <button
          onClick={onEdit}
          style={{
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#4A5568',
            cursor: 'pointer', fontFamily: FONT_SUB, flexShrink: 0,
          }}
        >
          Edit
        </button>
      )}
    </div>
    {!collapsed && !locked && children}
  </div>
);

/* ── StepNavButtons (Done + Back for step navigation) ── */
const StepNavButtons: React.FC<{
  onBack?: () => void;
  onDone?: () => void;
  doneDisabled?: boolean;
  doneLabel: string;
  accentDark: string;
}> = ({ onBack, onDone, doneDisabled, doneLabel, accentDark }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none',
          fontSize: 13, fontWeight: 600, color: '#4A5568',
          cursor: 'pointer', fontFamily: FONT_SUB, padding: '8px 0',
        }}
      >
        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
      </button>
    )}
    <button
      onClick={onDone}
      disabled={doneDisabled}
      style={{
        flex: 1,
        background: doneDisabled ? '#CBD5E0' : accentDark,
        color: '#FFFFFF',
        borderRadius: 24,
        padding: '12px 24px',
        fontSize: 14,
        fontWeight: 700,
        fontFamily: FONT_SUB,
        border: 'none',
        cursor: doneDisabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {doneLabel}
    </button>
  </div>
);

/* ── StepConnector ── */
const StepConnector: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div style={{
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    padding: '8px 0', gap: 4,
  }}>
    <div style={{
      width: 2, height: 28,
      backgroundImage: `repeating-linear-gradient(to bottom, ${accentColor} 0px, ${accentColor} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '2px 8px',
      animation: 'ppConnectorFlow 1s linear infinite',
    }} />
    <ArrowDown size={14} color={accentColor} />
  </div>
);

/* ── MiniStepConnector (between output step cards) ── */
const MiniStepConnector: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div style={{
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    padding: '4px 0', gap: 2,
  }}>
    <div style={{
      width: 2, height: 16,
      backgroundImage: `repeating-linear-gradient(to bottom, ${accentColor} 0px, ${accentColor} 3px, transparent 3px, transparent 6px)`,
      backgroundSize: '2px 6px',
      animation: 'ppConnectorFlow 1s linear infinite',
    }} />
  </div>
);

/* ── ProcessingProgress ── */
const ProcessingProgress: React.FC<{
  steps: string[];
  currentStep: number;
  header: string;
  subtext: string;
  accentDark: string;
}> = ({ steps, currentStep, header, subtext, accentDark }) => (
  <div style={{ padding: '24px 0' }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', fontFamily: FONT_SUB, marginBottom: 4 }}>
      {header}
    </div>
    <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT_SUB, marginBottom: 20 }}>
      {subtext}
    </div>
    {steps.map((step, i) => {
      const isDone = i < currentStep;
      const isActive = i === currentStep;
      return (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 0',
          opacity: isDone || isActive ? 1 : 0.35,
          transition: 'opacity 0.3s ease',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: isDone ? accentDark : isActive ? '#EDF2F7' : '#F7FAFC',
            border: isActive ? `2px solid ${accentDark}` : isDone ? 'none' : '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isDone ? (
              <Check size={10} color="#FFFFFF" />
            ) : isActive ? (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                border: `2px solid ${accentDark}`,
                borderTopColor: 'transparent',
                animation: 'ppSpin 0.7s linear infinite',
              }} />
            ) : null}
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isDone ? '#38A169' : isActive ? '#1A202C' : '#A0AEC0',
            fontFamily: FONT_SUB,
          }}>
            {step}
          </span>
        </div>
      );
    })}
    <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT_SUB, marginTop: 12 }}>
      {currentStep} of {steps.length}
    </div>
  </div>
);

/* ── PromptBox ── */
const PromptBox: React.FC<{ text: string; accentDark: string }> = ({ text, accentDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative' as const,
      background: '#F7FAFC',
      border: '1px solid #E2E8F0',
      borderLeft: `3px solid ${accentDark}`,
      borderRadius: '0 8px 8px 0',
      padding: '12px 16px',
      fontSize: 13,
      fontFamily: FONT_SUB,
      fontStyle: 'italic' as const,
      color: '#2D3748',
      lineHeight: 1.6,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      width: '100%',
      boxSizing: 'border-box' as const,
    }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute' as const,
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          fontSize: 11,
          color: copied ? '#38A169' : '#A0AEC0',
          cursor: 'pointer',
          fontFamily: FONT_SUB,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '2px 4px',
        }}
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
      {text}
    </div>
  );
};

/* ── ActionBtn ── */
const ActionBtn: React.FC<{
  onClick: () => void;
  label: string;
  primary?: boolean;
  accent?: string;
  accentDark?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}> = ({ onClick, label, primary, accent, accentDark, disabled, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: primary ? (accentDark || '#1A7A76') : accent ? accent : '#FFFFFF',
      color: primary ? '#FFFFFF' : accent ? '#FFFFFF' : '#4A5568',
      border: primary || accent ? 'none' : '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '7px 14px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: FONT_SUB,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'background 0.15s',
    }}
  >
    {icon}
    {label}
  </button>
);

/* ── ToggleBtn ── */
const ToggleBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: active ? '#EDF2F7' : 'transparent',
      border: '1px solid #E2E8F0',
      borderRadius: 6,
      padding: '5px 10px',
      fontSize: 11,
      fontWeight: active ? 700 : 500,
      color: active ? '#1A202C' : '#A0AEC0',
      cursor: 'pointer',
      fontFamily: FONT_SUB,
      transition: 'all 0.15s',
    }}
  >
    {icon}
    {label}
  </button>
);

