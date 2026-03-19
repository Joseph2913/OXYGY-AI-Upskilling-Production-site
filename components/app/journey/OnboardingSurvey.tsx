import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronDown, ArrowRight, ArrowLeft, User, Briefcase, Target,
  Sparkles, Clock, MessageSquare, Layers, Zap, BookOpen, Rocket,
  PenTool, BarChart3, Code2, Users, Check, Award, TrendingUp,
  Star, Crown, Cpu, Wrench, Settings, GitBranch,
} from 'lucide-react';
import { usePathwayApi } from '../../../hooks/usePathwayApi';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import { saveLearningPlan, upsertProfile } from '../../../lib/database';
import type { PathwayFormData, PathwayApiResponse, LevelDepth } from '../../../types';
import SurveyProcessing from './SurveyProcessing';
import { LEVEL_META } from '../../../data/levelTopics';

// ---- Demo Sample Profiles ----
const DEMO_PROFILES: { label: string; emoji: string; data: PathwayFormData }[] = [
  {
    label: 'Marketing Manager',
    emoji: '📣',
    data: {
      role: 'Marketing Manager',
      function: 'Marketing',
      functionOther: '',
      seniority: 'mid-level',
      aiExperience: 'comfortable-user',
      ambition: 'build-reusable-tools',
      challenge: 'I spend too much time writing campaign briefs, social copy, and performance reports manually. I want AI to help me move faster on content creation while keeping our brand voice consistent. I also need better ways to analyse campaign data without waiting for the analytics team.',
      availability: '3-5 hours',
      experienceDescription: 'I use ChatGPT for brainstorming headlines and rewriting email copy. I have also tried Midjourney for social media visuals. I mostly copy-paste into the chat — I have not built any custom tools or automations yet.',
      goalDescription: 'Build a reusable AI toolkit that helps my team produce campaign content 3x faster while maintaining quality and brand guidelines.',
    },
  },
  {
    label: 'HR Business Partner',
    emoji: '🤝',
    data: {
      role: 'HR Business Partner',
      function: 'Human Resources',
      functionOther: '',
      seniority: 'senior',
      aiExperience: 'beginner',
      ambition: 'own-ai-processes',
      challenge: 'Our people processes are overwhelmingly manual — from onboarding checklists to performance review summaries to policy questions. I want to understand how AI can streamline these workflows without compromising confidentiality or introducing bias into people decisions.',
      availability: '1-3 hours',
      experienceDescription: 'Very limited — I have tried asking ChatGPT a few general questions but have not used it for any real work tasks. I am curious but cautious about data privacy.',
      goalDescription: 'Design AI-powered processes for employee onboarding, performance summaries, and policy Q&A that my HR team can trust and adopt confidently.',
    },
  },
  {
    label: 'Product Designer',
    emoji: '🎨',
    data: {
      role: 'Senior Product Designer',
      function: 'Design',
      functionOther: '',
      seniority: 'senior',
      aiExperience: 'builder',
      ambition: 'build-full-apps',
      challenge: 'I want to move beyond just using AI for image generation and actually build interactive prototypes and tools that our users can interact with. I am tired of creating static mockups — I want to ship real experiences powered by AI that respond to user input dynamically.',
      availability: '5+ hours',
      experienceDescription: 'I have built several custom GPTs for our design team — one that generates user persona descriptions from research notes and another that critiques UI screenshots. I have also experimented with Cursor for rapid frontend prototyping.',
      goalDescription: 'Build a fully functional AI-powered design critique tool where users upload screenshots and get structured, actionable feedback based on our design system guidelines.',
    },
  },
];

// ---- Depth Matrix ----
type DepthMatrix = Record<string, Record<string, [LevelDepth, LevelDepth, LevelDepth, LevelDepth, LevelDepth]>>;
const DEPTH_MATRIX: DepthMatrix = {
  'beginner': {
    'confident-daily-use': ['full', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['full', 'full', 'awareness', 'skip', 'skip'],
    'own-ai-processes': ['full', 'full', 'full', 'awareness', 'skip'],
    'build-full-apps': ['full', 'full', 'full', 'full', 'full'],
    'lead-ai-strategy': ['full', 'full', 'full', 'full', 'full'],
  },
  'comfortable-user': {
    'confident-daily-use': ['fast-track', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'full', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'full', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'full', 'full', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'full', 'full', 'full', 'full'],
  },
  'builder': {
    'confident-daily-use': ['fast-track', 'fast-track', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'full', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'fast-track', 'full', 'full', 'full'],
  },
  'integrator': {
    'confident-daily-use': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'fast-track', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'fast-track', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'fast-track', 'fast-track', 'full', 'full'],
  },
};
function classifyLevels(aiExperience: string, ambition: string): Record<string, LevelDepth> {
  const depths = DEPTH_MATRIX[aiExperience]?.[ambition] || ['full', 'full', 'full', 'full', 'full'];
  return { L1: depths[0], L2: depths[1], L3: depths[2], L4: depths[3], L5: depths[4] };
}

// ---- Options ----
const FUNCTION_OPTIONS = [
  { value: 'Consulting / Advisory', icon: Users },
  { value: 'Proposal & BD', icon: Target },
  { value: 'Project Management', icon: Layers },
  { value: 'L&D / Training', icon: BookOpen },
  { value: 'Analytics & Insights', icon: BarChart3 },
  { value: 'Ops & SOP Management', icon: Briefcase },
  { value: 'Comms & Change', icon: MessageSquare },
  { value: 'IT & Knowledge Management', icon: Code2 },
  { value: 'Other', icon: Sparkles },
];
const SENIORITY_OPTIONS = [
  { value: 'Junior / early career (0\u20132 years)', label: 'Junior / Early Career', desc: '0\u20132 yrs experience', icon: TrendingUp },
  { value: 'Mid-level / specialist (3\u20136 years)', label: 'Mid-Level / Specialist', desc: '3\u20136 yrs experience', icon: Award },
  { value: 'Senior / lead (7\u201312 years)', label: 'Senior / Lead', desc: '7\u201312 yrs experience', icon: Star },
  { value: 'Director / executive (12+ years)', label: 'Director / Executive', desc: '12+ yrs experience', icon: Crown },
];
const AI_EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: "I've barely used AI tools \u2014 mostly curious but haven't built any habits yet", icon: BookOpen },
  { value: 'comfortable-user', label: 'Comfortable User', desc: 'I use AI tools like ChatGPT regularly for drafting, research, and brainstorming', icon: Cpu },
  { value: 'builder', label: 'Builder', desc: "I've created custom GPTs, prompt templates, or AI agents for specific tasks", icon: Wrench },
  { value: 'integrator', label: 'Integrator', desc: "I've connected AI into multi-step workflows, automations, or business systems", icon: GitBranch },
];
const AMBITION_OPTIONS = [
  { value: 'confident-daily-use', label: 'Confident Daily Use', desc: 'Use AI fluently in my everyday work \u2014 emails, research, planning, and decision-making', icon: Zap },
  { value: 'build-reusable-tools', label: 'Build Reusable Tools', desc: 'Create custom AI agents and tools that my whole team can use without my help', icon: PenTool },
  { value: 'own-ai-processes', label: 'Own AI Processes', desc: 'Design and manage automated AI-powered workflows for my function or department', icon: Settings },
  { value: 'build-full-apps', label: 'Build Full Applications', desc: 'Build complete AI-powered products with personalised experiences and live deployments', icon: Code2 },
  { value: 'lead-ai-strategy', label: 'Lead AI Strategy', desc: 'Lead AI transformation across an organisation \u2014 strategy, governance, and change management', icon: Rocket },
];
const AVAILABILITY_OPTIONS = [
  { value: '1-2 hours', label: '1\u20132 hrs/week', desc: 'Fits around a busy schedule', icon: Clock },
  { value: '3-4 hours', label: '3\u20134 hrs/week', desc: 'Dedicated learning time', icon: BookOpen },
  { value: '5+ hours', label: '5+ hrs/week', desc: 'Intensive \u2014 I want to move fast', icon: Rocket },
];

// 0 = welcome, 1-3 = form steps
const TOTAL_STEPS = 3;
const STEP_META = [
  { title: 'Welcome', subtitle: '' },
  { title: 'Your Role', subtitle: 'Tell us about your role and seniority so we can tailor your pathway.' },
  { title: 'AI Experience & Goals', subtitle: 'Share your current AI skills and where you want to go.' },
  { title: 'Challenges & Goals', subtitle: 'Describe your real-world challenge and how much time you can invest.' },
];

const ANIM = `
@keyframes onbCardIn {
  from { opacity: 0; transform: scale(0.97) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes onbStepIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes onbPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
`;

const focusRing = { borderColor: '#38B2AC', boxShadow: '0 0 0 3px rgba(56, 178, 172, 0.1)' };
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '1.5px solid #E2E8F0',
  borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1A202C',
  fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

// ── Uniform card for selections ──
const CARD_H = 68;
function SelectCard({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <div onClick={onClick} style={{
      height: CARD_H, background: selected ? '#F0FFFC' : '#FFFFFF',
      border: selected ? '2px solid #38B2AC' : '1.5px solid #E2E8F0',
      borderRadius: 12, padding: '0 14px', cursor: 'pointer',
      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
}

// ── Label ──
function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: '#F0FFFC',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{text}</span>
      {required && <span style={{ fontSize: 9, fontWeight: 600, color: '#E53E3E' }}>Required</span>}
    </div>
  );
}

// ── Left Panel ──
function LeftPanel({ step, generating, formData }: {
  step: number;
  generating?: boolean;
  formData?: PathwayFormData;
}) {
  // During generation, show a summary of what the user filled in
  if (generating && formData) {
    const summaryItems = [
      { label: 'Role', value: formData.role },
      { label: 'Function', value: formData.function === 'Other' ? formData.functionOther : formData.function },
      { label: 'Seniority', value: formData.seniority.split('(')[0].trim() },
      { label: 'AI Level', value: formData.aiExperience.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
      { label: 'Goal', value: AMBITION_OPTIONS.find(a => a.value === formData.ambition)?.label || formData.ambition },
      { label: 'Time', value: formData.availability },
    ];

    return (
      <div style={{
        width: 320, flexShrink: 0, borderRadius: '20px 0 0 20px',
        background: 'linear-gradient(165deg, #1A202C 0%, #1A202C 60%, #1C2E38 100%)',
        padding: '36px 28px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(56, 178, 172, 0.1)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 28 }}>
          <img src="/logos/oxygy-logo-darkgray-teal.png" alt="Oxygy"
            style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </div>

        {/* Summary heading */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(56, 178, 172, 0.15)', borderRadius: 16, padding: '4px 12px', marginBottom: 10,
          }}>
            <Sparkles size={12} color="#38B2AC" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#38B2AC' }}>Building your plan</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>
            Personalising your pathway based on your profile
          </div>
        </div>

        {/* Summary items */}
        <div style={{
          position: 'relative', zIndex: 1, width: '100%',
          background: 'rgba(255,255,255,0.04)', borderRadius: 14,
          padding: '16px 18px', flex: 1,
        }}>
          {summaryItems.map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0',
              borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#FFFFFF',
                maxWidth: 170, textAlign: 'right', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Animated teal pulse at bottom */}
        <div style={{
          position: 'relative', zIndex: 1, width: '80%', height: 3,
          borderRadius: 2, marginTop: 20,
          background: 'linear-gradient(90deg, transparent, #38B2AC, transparent)',
          animation: 'onbPulse 1.5s ease-in-out infinite',
        }} />
      </div>
    );
  }

  // Normal step progress view
  return (
    <div style={{
      width: 320, flexShrink: 0, borderRadius: '20px 0 0 20px',
      background: 'linear-gradient(165deg, #1A202C 0%, #1A202C 60%, #1C2E38 100%)',
      padding: '36px 28px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative accent blobs */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 200, height: 200,
        borderRadius: '50%', background: 'rgba(56, 178, 172, 0.07)',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40, width: 140, height: 140,
        borderRadius: '50%', background: 'rgba(168, 240, 224, 0.05)',
      }} />

      {/* Oxygy Logo */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 44 }}>
        <img
          src="/logos/oxygy-logo-darkgray-teal.png"
          alt="Oxygy"
          style={{ height: 32, filter: 'brightness(0) invert(1)', opacity: 0.95 }}
        />
      </div>

      {/* Step progress — vertical, centred */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {[1, 2, 3].map((stepNum, i) => {
          const meta = STEP_META[stepNum];
          const isDone = step > stepNum;
          const isActive = step === stepNum;
          const isLast = i === 2;
          return (
            <div key={stepNum} style={{ display: 'flex', gap: 14, marginBottom: isLast ? 0 : 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#38B2AC' : isActive ? 'rgba(56, 178, 172, 0.15)' : 'rgba(255,255,255,0.06)',
                  border: isDone ? '2px solid #38B2AC' : isActive ? '2.5px solid #38B2AC' : '1.5px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {isDone ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? '#38B2AC' : 'rgba(255,255,255,0.3)',
                    }}>
                      {stepNum}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 24,
                    background: isDone ? '#38B2AC' : 'rgba(255,255,255,0.08)',
                    borderRadius: 1, marginTop: 6,
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
              <div style={{ paddingTop: 5 }}>
                <div style={{
                  fontSize: 14, fontWeight: isActive ? 700 : isDone ? 600 : 500,
                  color: isDone || isActive ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                  transition: 'color 0.3s',
                }}>
                  {meta.title}
                </div>
                <div style={{
                  fontSize: 11, color: isDone || isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                  marginTop: 3, lineHeight: 1.4, maxWidth: 200,
                  transition: 'color 0.3s',
                }}>
                  {meta.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle teal line accent at bottom */}
      <div style={{
        position: 'relative', zIndex: 1, width: '60%', height: 3,
        borderRadius: 2, background: 'linear-gradient(90deg, transparent, #38B2AC, transparent)',
        opacity: 0.3, marginTop: 32,
      }} />
    </div>
  );
}

// ── Main Component ──
interface OnboardingSurveyProps {
  prefillData?: Partial<PathwayFormData> | null;
  onPlanGenerated: (result?: PathwayApiResponse) => void;
  /** Demo mode: skip auth check & Supabase writes, return plan data via onPlanGenerated */
  demoMode?: boolean;
}

const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({ prefillData, onPlanGenerated, demoMode }) => {
  const { user } = useAuth();
  const { refreshLearningPlan, refreshProfile } = useAppContext();
  const { generatePathway, clearError, lastErrorRef } = usePathwayApi();

  // step 0 = welcome, 1-3 = form steps
  // Restore step + form data from sessionStorage so navigating away doesn't lose progress
  const [step, setStep] = useState(() => {
    try {
      const stored = sessionStorage.getItem('oxygy_survey_step');
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  });
  const [formData, setFormData] = useState<PathwayFormData>(() => {
    try {
      const stored = sessionStorage.getItem('oxygy_survey_form');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      role: prefillData?.role || '',
      function: prefillData?.function || '',
      functionOther: prefillData?.functionOther || '',
      seniority: prefillData?.seniority || '',
      aiExperience: prefillData?.aiExperience || '',
      ambition: prefillData?.ambition || '',
      challenge: prefillData?.challenge || '',
      availability: prefillData?.availability || '',
      experienceDescription: prefillData?.experienceDescription || '',
      goalDescription: prefillData?.goalDescription || '',
    };
  });
  const [showOptional, setShowOptional] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [completedPlan, setCompletedPlan] = useState<PathwayApiResponse | null>(null);

  // Persist step + form data to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem('oxygy_survey_step', String(step));
    } catch {}
  }, [step]);
  useEffect(() => {
    try {
      sessionStorage.setItem('oxygy_survey_form', JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const updateField = useCallback((field: keyof PathwayFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const isStep1Complete = useMemo(() => {
    return !!formData.role.trim() && !!formData.function &&
      (formData.function !== 'Other' || !!formData.functionOther.trim()) &&
      !!formData.seniority;
  }, [formData.role, formData.function, formData.functionOther, formData.seniority]);

  const isStep2Complete = useMemo(() => {
    return !!formData.aiExperience && !!formData.ambition && !!formData.experienceDescription.trim();
  }, [formData.aiExperience, formData.ambition, formData.experienceDescription]);

  const isStep3Complete = useMemo(() => {
    return !!formData.challenge.trim() && !!formData.availability && !!formData.goalDescription.trim();
  }, [formData.challenge, formData.availability, formData.goalDescription]);

  const wordCount = useMemo(() => {
    return formData.challenge.trim().split(/\s+/).filter(Boolean).length;
  }, [formData.challenge]);

  const handleGenerate = async () => {
    if (!user && !demoMode) return;
    setGenerating(true);
    setGenError(null);
    clearError();
    try {
      const depths = classifyLevels(formData.aiExperience, formData.ambition);
      const result = await generatePathway(formData, depths);
      if (!result) {
        // Read from ref (synchronously updated) since React state may not have flushed yet
        setGenError(lastErrorRef.current || 'Something went wrong generating your plan. Please try again.');
        setGenerating(false);
        return;
      }

      if (demoMode) {
        // Demo mode: skip Supabase writes, show completion card
        setGenerating(false);
        setCompletedPlan(result);
      } else {
        const [planSaved, profileSaved] = await Promise.all([
          saveLearningPlan(user!.id, result, depths),
          upsertProfile(user!.id, {
            role: formData.role, function: formData.function,
            functionOther: formData.functionOther, seniority: formData.seniority,
            aiExperience: formData.aiExperience, ambition: formData.ambition,
            challenge: formData.challenge, availability: formData.availability,
            experienceDescription: formData.experienceDescription,
            goalDescription: formData.goalDescription,
          } as any),
        ]);
        if (!planSaved || !profileSaved) {
          setGenError('Something went wrong saving your plan. Please try again.');
          setGenerating(false);
          return;
        }
        // Show completion card FIRST, then refresh context in background
        // (refreshing context triggers parent re-renders, so we set UI state before)
        setGenerating(false);
        setCompletedPlan(result);
        // Refresh context in background — non-blocking
        refreshLearningPlan().catch(() => {});
        refreshProfile().catch(() => {});
      }
    } catch (err) {
      console.error('Onboarding generate error:', err);
      setGenError('Something went wrong. Please try again.');
      setGenerating(false);
    }
  };

  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Scroll right panel to top whenever step changes
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }
  }, [step]);

  const handleRetry = () => { setGenError(null); setGenerating(false); clearError(); };
  const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep(s => Math.max(s - 1, step === 1 ? 0 : 1));

  const canProceed = step === 1 ? isStep1Complete : step === 2 ? isStep2Complete : isStep3Complete;

  // ═══════════════ COMPLETION CARD ═══════════════
  if (completedPlan) {
    const assignedLevels = [1, 2, 3, 4, 5].filter(n => !!completedPlan.levels[`L${n}`]);
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{ANIM}</style>
        <div style={{
          width: 640, maxWidth: '92vw', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
          animation: 'onbCardIn 0.4s ease both',
          background: '#FFFFFF',
        }}>
          {/* Header band */}
          <div style={{
            background: 'linear-gradient(135deg, #1A202C 0%, #1C2E38 100%)',
            padding: '36px 40px 32px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              borderRadius: '50%', background: 'rgba(56, 178, 172, 0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
              borderRadius: '50%', background: 'rgba(168, 240, 224, 0.06)',
            }} />
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
              background: 'rgba(56, 178, 172, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
            }}>
              <Check size={24} color="#38B2AC" />
            </div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px',
              position: 'relative', zIndex: 1,
            }}>
              Your Learning Plan is Ready
            </h1>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '8px 0 0', lineHeight: 1.5,
              position: 'relative', zIndex: 1,
            }}>
              Here's what we've put together for you.
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 40px 36px' }}>
            <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, marginBottom: 20 }}>
              You have been assigned to <strong>{assignedLevels.length} level{assignedLevels.length !== 1 ? 's' : ''}</strong> based
              on your experience and goals. Head to your Journey page to explore the topics, toolkit, and projects
              waiting for you at each level.
            </div>

            {/* Assigned level chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {assignedLevels.map(n => {
                const meta = LEVEL_META.find(m => m.number === n)!;
                const planLevel = completedPlan.levels[`L${n}`];
                return (
                  <div key={n} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 12,
                    background: `${meta.accentColor}12`,
                    border: `1px solid ${meta.accentColor}44`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `${meta.accentColor}33`,
                      border: `1.5px solid ${meta.accentColor}88`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, color: meta.accentDark,
                    }}>
                      {n}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
                        {meta.name}
                      </div>
                      {planLevel?.projectTitle && (
                        <div style={{ fontSize: 12, color: '#718096', marginTop: 1 }}>
                          Project: {planLevel.projectTitle}
                        </div>
                      )}
                    </div>
                    {planLevel?.depth && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, flexShrink: 0,
                        color: planLevel.depth === 'full' ? meta.accentDark : '#718096',
                        background: planLevel.depth === 'full' ? `${meta.accentColor}25` : '#F7FAFC',
                        border: `1px solid ${planLevel.depth === 'full' ? meta.accentColor + '66' : '#E2E8F0'}`,
                        borderRadius: 6, padding: '2px 8px',
                        textTransform: 'uppercase' as const,
                      }}>
                        {planLevel.depth === 'full' ? 'Full' : 'Fast-track'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              fontSize: 13, color: '#718096', lineHeight: 1.6, marginBottom: 24,
              fontStyle: 'italic',
            }}>
              Good luck with your learning experience – we're excited to see what you build.
            </div>

            {/* CTA button */}
            <button
              onClick={() => onPlanGenerated(demoMode ? completedPlan : undefined)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #38B2AC, #2D9E99)',
                color: '#FFFFFF', border: 'none', borderRadius: 12,
                padding: '14px 28px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 14px rgba(56, 178, 172, 0.25)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Go to My Journey <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════ WELCOME SCREEN ═══════════════
  if (step === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{ANIM}</style>
        <div style={{
          width: 640, maxWidth: '92vw', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
          animation: 'onbCardIn 0.4s ease both',
          background: '#FFFFFF',
        }}>
          {/* Teal header band */}
          <div style={{
            background: 'linear-gradient(135deg, #1A202C 0%, #1C2E38 100%)',
            padding: '36px 40px 32px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              borderRadius: '50%', background: 'rgba(56, 178, 172, 0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
              borderRadius: '50%', background: 'rgba(168, 240, 224, 0.06)',
            }} />
            <img
              src="/logos/oxygy-logo-darkgray-teal.png"
              alt="Oxygy"
              style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9, marginBottom: 16, position: 'relative', zIndex: 1 }}
            />
            <h1 style={{
              fontSize: 26, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px',
              position: 'relative', zIndex: 1,
            }}>
              Welcome to Your AI Learning Journey
            </h1>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '8px 0 0', lineHeight: 1.5,
              position: 'relative', zIndex: 1,
            }}>
              A personalised pathway designed around your role, skills, and ambitions.
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '32px 40px 36px' }}>
            <div style={{ fontSize: 15, color: '#4A5568', lineHeight: 1.7, marginBottom: 24 }}>
              We don't believe in one-size-fits-all learning. To create a pathway that's genuinely useful
              to <strong>you</strong>, we need to understand where you are today, where you want to go,
              and the real challenges you face in your work.
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28,
            }}>
              {[
                { icon: User, title: 'Your Role', desc: 'We tailor projects and examples to your function and seniority' },
                { icon: Sparkles, title: 'Your Experience', desc: 'We calibrate the right starting level \u2014 no wasted time' },
                { icon: Target, title: 'Your Goals', desc: 'Your challenge shapes the projects you will build at each level' },
              ].map(item => {
                const IIcon = item.icon;
                return (
                  <div key={item.title} style={{
                    background: '#F7FAFC', borderRadius: 14, padding: '20px 16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: '#E6FFFA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}>
                      <IIcon size={20} color="#38B2AC" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: '#F0FFFC', borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
            }}>
              <Clock size={18} color="#38B2AC" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#2D9E99', lineHeight: 1.5 }}>
                <strong>Takes about 2 minutes.</strong> The more specific your answers, the more relevant
                your personalised projects and learning content will be.
              </div>
            </div>

            {/* Demo mode: sample profile quick-fill buttons */}
            {demoMode && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#718096',
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
                }}>
                  Quick-fill a sample profile
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DEMO_PROFILES.map(p => (
                    <button
                      key={p.label}
                      onClick={() => { setFormData(p.data); setStep(1); }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#F7FAFC', color: '#1A202C', border: '1.5px solid #E2E8F0',
                        borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.background = '#F0FFFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F7FAFC'; }}
                    >
                      <span style={{ fontSize: 16 }}>{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #38B2AC, #2D9E99)', color: '#FFFFFF',
                border: 'none', borderRadius: 12, padding: '15px 24px',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 14px rgba(56, 178, 172, 0.3)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════ FORM STEPS (1-3) ═══════════════
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{ANIM}</style>

      <div style={{
        display: 'flex', width: 980, maxWidth: '96vw',
        height: 640, maxHeight: '88vh',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
        animation: 'onbCardIn 0.4s ease both',
      }}>
        {/* Left Panel */}
        <LeftPanel step={step} generating={generating} formData={formData} />

        {/* Right Panel */}
        <div ref={rightPanelRef} style={{
          flex: 1, background: '#FFFFFF', padding: '32px 36px',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          {/* Step badge + title */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F0FFFC', borderRadius: 20, padding: '4px 12px', marginBottom: 10,
            }}>
              <Sparkles size={11} color="#38B2AC" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2D9E99' }}>
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#1A202C', margin: 0, letterSpacing: '-0.3px' }}>
              {STEP_META[step].title}
            </h2>
          </div>

          {/* Step content */}
          <div style={{ flex: 1, animation: 'onbStepIn 0.25s ease both' }} key={step}>

            {/* ═══ STEP 1: Role ═══ */}
            {step === 1 && (<>
              <div style={{ marginBottom: 18 }}>
                <Label icon={<User size={14} color="#38B2AC" />} text="What is your current role?" required />
                <input type="text" value={formData.role}
                  onChange={e => updateField('role', e.target.value)}
                  placeholder="e.g., Project Manager, Senior Analyst"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, focusRing)}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <Label icon={<Briefcase size={14} color="#38B2AC" />} text="Which function do you work in?" required />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {FUNCTION_OPTIONS.map(opt => {
                    const sel = formData.function === opt.value;
                    const FIcon = opt.icon;
                    return (
                      <SelectCard key={opt.value} selected={sel} onClick={() => updateField('function', opt.value)}>
                        <FIcon size={16} color={sel ? '#38B2AC' : '#A0AEC0'} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{opt.value}</span>
                      </SelectCard>
                    );
                  })}
                </div>
                {formData.function === 'Other' && (
                  <input type="text" value={formData.functionOther}
                    onChange={e => updateField('functionOther', e.target.value)}
                    placeholder="Your function" style={{ ...inputStyle, marginTop: 8 }}
                    onFocus={e => Object.assign(e.target.style, focusRing)}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                )}
              </div>

              <div>
                <Label icon={<Target size={14} color="#38B2AC" />} text="Seniority level" required />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {SENIORITY_OPTIONS.map(opt => {
                    const sel = formData.seniority === opt.value;
                    const SIcon = opt.icon;
                    return (
                      <SelectCard key={opt.value} selected={sel} onClick={() => updateField('seniority', opt.value)}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: sel ? '#E6FFFA' : '#F7FAFC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <SIcon size={16} color={sel ? '#38B2AC' : '#A0AEC0'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: '#718096' }}>{opt.desc}</div>
                        </div>
                      </SelectCard>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* ═══ STEP 2: Experience & Goals ═══ */}
            {step === 2 && (<>
              <div style={{ marginBottom: 18 }}>
                <Label icon={<Sparkles size={14} color="#38B2AC" />} text="Your AI experience level" required />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {AI_EXPERIENCE_OPTIONS.map(opt => {
                    const sel = formData.aiExperience === opt.value;
                    const EIcon = opt.icon;
                    return (
                      <div key={opt.value} onClick={() => updateField('aiExperience', opt.value)} style={{
                        height: 80, background: sel ? '#F0FFFC' : '#FFFFFF',
                        border: sel ? '2px solid #38B2AC' : '1.5px solid #E2E8F0',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        transition: 'all 0.15s', boxSizing: 'border-box',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: sel ? '#E6FFFA' : '#F7FAFC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <EIcon size={16} color={sel ? '#38B2AC' : '#A0AEC0'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.3, marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <Label icon={<Rocket size={14} color="#38B2AC" />} text="What do you want to achieve with AI?" required />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {AMBITION_OPTIONS.map(opt => {
                    const sel = formData.ambition === opt.value;
                    const AIcon = opt.icon;
                    return (
                      <SelectCard key={opt.value} selected={sel} onClick={() => updateField('ambition', opt.value)}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: sel ? '#E6FFFA' : '#F7FAFC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AIcon size={16} color={sel ? '#38B2AC' : '#A0AEC0'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.3 }}>{opt.desc}</div>
                        </div>
                        {sel && <Check size={15} color="#38B2AC" strokeWidth={3} style={{ flexShrink: 0 }} />}
                      </SelectCard>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label icon={<MessageSquare size={14} color="#38B2AC" />} text="Describe your experience in more detail" required />
                <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
                  Tell us how you've used AI tools so far, what's worked, and what hasn't. This helps us set the right starting point.
                </div>
                <textarea value={formData.experienceDescription}
                  onChange={e => updateField('experienceDescription', e.target.value)}
                  placeholder="e.g., I use ChatGPT for drafting emails and brainstorming. I tried building a custom GPT but got stuck on the instructions. I haven't used any automation tools yet."
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => Object.assign(e.target.style, focusRing)}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </>)}

            {/* ═══ STEP 3: Challenges & Goals ═══ */}
            {step === 3 && !generating && (<>
              <div style={{ marginBottom: 18 }}>
                <Label icon={<MessageSquare size={14} color="#38B2AC" />}
                  text="What's the biggest challenge AI could help you solve?" required />
                <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
                  Be as specific as you can — this directly shapes the projects in your learning plan.
                </div>
                <textarea value={formData.challenge}
                  onChange={e => updateField('challenge', e.target.value)}
                  placeholder="e.g., I spend hours every week summarising meeting notes and creating status updates. I want to automate this so I can focus on strategic work."
                  style={{ ...inputStyle, minHeight: 85, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => Object.assign(e.target.style, focusRing)}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 3 }}>{wordCount} words</div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <Label icon={<Target size={14} color="#38B2AC" />} text="Describe your goal" required />
                <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
                  What does success look like for you at the end of this programme?
                </div>
                <textarea value={formData.goalDescription}
                  onChange={e => updateField('goalDescription', e.target.value)}
                  placeholder="e.g., I want to be able to build and deploy AI-powered tools that my team uses every day, without needing help from IT."
                  style={{ ...inputStyle, minHeight: 70, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => Object.assign(e.target.style, focusRing)}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <Label icon={<Clock size={14} color="#38B2AC" />} text="Weekly time commitment" required />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {AVAILABILITY_OPTIONS.map(opt => {
                    const sel = formData.availability === opt.value;
                    const AIcon = opt.icon;
                    return (
                      <div key={opt.value} onClick={() => updateField('availability', opt.value)} style={{
                        background: sel ? '#F0FFFC' : '#FFFFFF',
                        border: sel ? '2px solid #38B2AC' : '1.5px solid #E2E8F0',
                        borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s', boxSizing: 'border-box',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, margin: '0 auto 6px',
                          background: sel ? '#E6FFFA' : '#F7FAFC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AIcon size={16} color={sel ? '#38B2AC' : '#A0AEC0'} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {step === 3 && generating && (
              <SurveyProcessing error={genError} onRetry={handleRetry} />
            )}
          </div>

          {/* Footer nav */}
          {!generating && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 18, borderTop: '1px solid #F7FAFC', marginTop: 14,
            }}>
              <button onClick={goBack} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', padding: '8px 4px',
                fontSize: 13, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                <ArrowLeft size={15} /> Back
              </button>
              {step < TOTAL_STEPS ? (
                <button onClick={goNext} disabled={!canProceed} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: canProceed ? '#38B2AC' : '#E2E8F0',
                  color: canProceed ? '#FFFFFF' : '#A0AEC0',
                  border: 'none', borderRadius: 10, padding: '11px 24px',
                  fontSize: 14, fontWeight: 700,
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s', fontFamily: "'DM Sans', sans-serif",
                }}
                  onMouseEnter={e => { if (canProceed) e.currentTarget.style.background = '#2D9E99'; }}
                  onMouseLeave={e => { if (canProceed) e.currentTarget.style.background = '#38B2AC'; }}
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={handleGenerate} disabled={!canProceed} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: canProceed ? 'linear-gradient(135deg, #38B2AC, #2D9E99)' : '#E2E8F0',
                  color: canProceed ? '#FFFFFF' : '#A0AEC0',
                  border: 'none', borderRadius: 10, padding: '12px 28px',
                  fontSize: 15, fontWeight: 700,
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: canProceed ? '0 4px 14px rgba(56, 178, 172, 0.25)' : 'none',
                }}>
                  <Sparkles size={16} /> Generate My Plan
                </button>
              )}
            </div>
          )}
          {!generating && genError && (
            <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>{genError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurvey;
