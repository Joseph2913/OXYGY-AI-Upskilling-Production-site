import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDown, FileText, Lightbulb, Check, Award, Plus, Pencil } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../hooks/useProjectData';
import { getProfile, upsertProjectArtefact } from '../../lib/database';
import { calculateTier } from '../../lib/scoring';
import { SubmissionFormL1 } from '../../components/app/journey/project/SubmissionFormL1';
import { SubmissionFormL2L3 } from '../../components/app/journey/project/SubmissionFormL2';
import { SubmissionFormL4L5Base } from '../../components/app/journey/project/SubmissionFormL4';
import { CaseStudyCard } from '../../components/app/journey/project/CaseStudyCard';
import { ReviewScorecard } from '../../components/app/journey/project/ReviewScorecard';
import type { ReviewData } from '../../components/app/journey/project/ReviewScorecard';
import { ReviewProcessing } from '../../components/app/journey/project/ReviewProcessing';
import { LEVEL_META } from '../../data/levelTopics';
import type { LocalScreenshot } from '../../components/app/journey/project/ScreenshotUploader';

const FONT = "'DM Sans', sans-serif";

function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url);
}

async function resizeImage(file: File, maxDim: number = 1600, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Demonstrate how you\'ve applied AI prompting to your real work. Reflect on a specific situation, describe what you did, and show the impact it had — this is your proof of applied learning at the Fundamentals level.',
  2: 'Show what you built with AI at the Applied Capability level. Document the agent or tool you created, explain your design decisions, and evidence the impact on your workflow or team.',
  3: 'Present the workflow you designed at the Systemic Integration level. Map out the end-to-end automation, explain your design rationale, and demonstrate measurable impact.',
  4: 'Showcase the interactive dashboard you built at the Dashboards level. Share your design rationale, walk through the user experience, and evidence how it surfaces the right insights to the right people.',
  5: 'Present your full-stack AI application as a structured case study. This is your capstone — document the problem, your solution, the outcome, and what you learned across the entire programme.',
};

/* ── Shared step-card primitives (toolkit pattern) ── */

const StepBadge: React.FC<{ number: number; done: boolean; locked?: boolean; accentColor: string; accentDark: string }> = ({ number, done, locked, accentColor, accentDark }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? accentColor : locked ? '#EDF2F7' : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? accentDark : locked ? '#CBD5E0' : '#718096',
    transition: 'background 0.2s, color 0.2s',
  }}>
    {done ? <Check size={14} /> : number}
  </div>
);

const StepCard: React.FC<{
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  locked?: boolean;
  lockedMessage?: string;
  accentColor: string;
  accentDark: string;
  children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, accentColor, accentDark, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF', borderRadius: 16,
    border: `1px solid ${done ? `${accentColor}88` : '#E2E8F0'}`,
    padding: (collapsed || locked) ? '16px 24px' : '24px 28px',
    transition: 'padding 0.2s ease, border-color 0.2s ease',
    opacity: locked ? 0.7 : 1,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: (collapsed || locked) ? 0 : 20,
    }}>
      <StepBadge number={stepNumber} done={done} locked={locked} accentColor={accentColor} accentDark={accentDark} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: FONT }}>
          {title}
        </div>
        {locked && lockedMessage && (
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>{lockedMessage}</div>
        )}
        {!collapsed && !locked && (
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2, fontFamily: FONT }}>
            {subtitle}
          </div>
        )}
      </div>
      {done && collapsed && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: accentDark,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Check size={13} /> Done
        </div>
      )}
    </div>
    {!collapsed && !locked && children}
  </div>
);

const StepConnector: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 0',
  }}>
    <div style={{
      width: 3, height: 24, borderRadius: 2,
      background: `repeating-linear-gradient(to bottom, ${accentColor} 0px, ${accentColor} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '3px 20px',
      animation: 'ppConnectorFlow 0.8s linear infinite',
    }} />
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${accentColor}20`, border: `2px solid ${accentColor}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    }}>
      <ArrowDown size={14} color={accentColor} />
    </div>
  </div>
);

/* ── Main page ── */

const AppProjectProof: React.FC = () => {
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { hasLearningPlan, userProfile } = useAppContext();
  const { user } = useAuth();
  const levelNum = parseInt(levelParam || '', 10);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
      navigate('/app/journey', { replace: true });
    }
  }, [levelNum, navigate]);

  const validLevel = !isNaN(levelNum) && levelNum >= 1 && levelNum <= 5 ? levelNum : 1;
  const { submission, projectBrief, loading, saving, saveDraft, submitForReview, uploadScreenshot, removeScreenshot, getSignedUrl } = useProjectData(validLevel);
  const meta = LEVEL_META.find(m => m.number === validLevel)!;
  const LEVEL_ACCENT = meta.accentColor;
  const LEVEL_ACCENT_DARK = meta.accentDark;

  // Form state
  const [toolName, setToolName] = useState('');
  const [platformUsed, setPlatformUsed] = useState('');
  const [toolLink, setToolLink] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [adoptionScope, setAdoptionScope] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [caseStudyProblem, setCaseStudyProblem] = useState('');
  const [caseStudySolution, setCaseStudySolution] = useState('');
  const [caseStudyOutcome, setCaseStudyOutcome] = useState('');
  const [caseStudyLearnings, setCaseStudyLearnings] = useState('');
  const [linkError, setLinkError] = useState('');

  // Screenshot state
  const [localScreenshots, setLocalScreenshots] = useState<LocalScreenshot[]>([]);
  const [existingPaths, setExistingPaths] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<Record<string, string>>({});

  // Auto-save + review state
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formInitializedRef = useRef(false);
  const triggerSaveRef = useRef<() => void>(() => {});
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [previousTier, setPreviousTier] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // 'picker' = show landing cards, 'form' = show the submission form/review
  const [pageView, setPageView] = useState<'picker' | 'form'>('form');

  // Populate form from existing submission
  useEffect(() => {
    if (submission && !formInitializedRef.current) {
      setToolName(submission.toolName || '');
      setPlatformUsed(submission.platformUsed || '');
      setToolLink(submission.toolLink || '');
      setReflectionText(submission.reflectionText || '');
      setAdoptionScope(submission.adoptionScope);
      setOutcomeText(submission.outcomeText || '');
      setCaseStudyProblem(submission.caseStudyProblem || '');
      setCaseStudySolution(submission.caseStudySolution || '');
      setCaseStudyOutcome(submission.caseStudyOutcome || '');
      setCaseStudyLearnings(submission.caseStudyLearnings || '');
      formInitializedRef.current = true;

      // Load existing review data
      if (submission.reviewDimensions && submission.reviewSummary) {
        setReviewData({
          dimensions: submission.reviewDimensions as ReviewData['dimensions'],
          overallPassed: submission.reviewPassed ?? false,
          summary: submission.reviewSummary || '',
          encouragement: submission.reviewEncouragement || '',
        });
        // If status is 'passed', the submission was previously confirmed
        if (submission.status === 'passed') {
          setIsConfirmed(true);
          setPageView('picker'); // Show the landing picker, not the locked form
          // Repair: if confirmed but no artefact linked, create one now
          if (!submission.artefactId && user) {
            const dims = submission.reviewDimensions as ReviewData['dimensions'];
            const tier = calculateTier(dims);
            upsertProjectArtefact(user.id, submission, tier.label, tier.tier);
          }
        }
        // Also show picker for needs_revision submissions that have review data
        if (submission.status === 'needs_revision') {
          setPageView('picker');
        }
      }

      if (submission.screenshotPaths?.length > 0) {
        setExistingPaths(submission.screenshotPaths);
        Promise.all(
          submission.screenshotPaths.map(async (p) => {
            const url = await getSignedUrl(p);
            return [p, url || ''] as [string, string];
          })
        ).then((pairs) => {
          const urlMap: Record<string, string> = {};
          pairs.forEach(([p, u]) => { urlMap[p] = u; });
          setExistingUrls(urlMap);
        });
      }
    }
    if (!submission && !loading) {
      formInitializedRef.current = true;
    }
  }, [submission, loading, getSignedUrl]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    switch (field) {
      case 'toolName': setToolName(value); break;
      case 'platformUsed': setPlatformUsed(value); break;
      case 'toolLink':
        setToolLink(value);
        if (linkError && (isValidUrl(value) || value === '')) setLinkError('');
        break;
      case 'reflectionText': setReflectionText(value); break;
      case 'adoptionScope': setAdoptionScope(value); break;
      case 'outcomeText': setOutcomeText(value); break;
      case 'caseStudyProblem': setCaseStudyProblem(value); break;
      case 'caseStudySolution': setCaseStudySolution(value); break;
      case 'caseStudyOutcome': setCaseStudyOutcome(value); break;
      case 'caseStudyLearnings': setCaseStudyLearnings(value); break;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { triggerSaveRef.current(); }, 3000);
  }, []);

  const triggerSave = useCallback(async () => {
    await saveDraft({
      toolName: toolName || null,
      platformUsed: platformUsed || null,
      toolLink: toolLink || null,
      reflectionText: reflectionText || null,
      adoptionScope,
      outcomeText: outcomeText || null,
      caseStudyProblem: caseStudyProblem || null,
      caseStudySolution: caseStudySolution || null,
      caseStudyOutcome: caseStudyOutcome || null,
      caseStudyLearnings: caseStudyLearnings || null,
    } as any);
    setSavedAt(Date.now());
  }, [saveDraft, toolName, platformUsed, toolLink, reflectionText, adoptionScope, outcomeText, caseStudyProblem, caseStudySolution, caseStudyOutcome, caseStudyLearnings]);

  triggerSaveRef.current = triggerSave;

  // Show "Draft saved" briefly
  useEffect(() => {
    if (savedAt) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2300);
      return () => clearTimeout(t);
    }
  }, [savedAt]);

  useEffect(() => {
    const handleBeforeUnload = () => { triggerSaveRef.current(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Validation — require fields to be non-empty, no mandatory word counts
  const totalScreenshots = existingPaths.length + localScreenshots.length;
  const isValid = (() => {
    if (validLevel === 1) {
      return reflectionText.trim().length > 0 && !!adoptionScope && outcomeText.trim().length > 0;
    }
    if (validLevel === 2 || validLevel === 3) {
      return !!toolName && !!platformUsed && totalScreenshots >= 1 &&
        reflectionText.trim().length > 0 && !!adoptionScope && outcomeText.trim().length > 0;
    }
    if (validLevel === 4) {
      return !!toolName && !!platformUsed && !!toolLink && isValidUrl(toolLink) &&
        totalScreenshots >= 2 && reflectionText.trim().length > 0 &&
        !!adoptionScope && outcomeText.trim().length > 0;
    }
    if (validLevel === 5) {
      return !!toolName && !!platformUsed && !!toolLink && isValidUrl(toolLink) &&
        totalScreenshots >= 2 && reflectionText.trim().length > 0 &&
        !!adoptionScope && outcomeText.trim().length > 0 &&
        caseStudyProblem.trim().length > 0 && caseStudySolution.trim().length > 0 &&
        caseStudyOutcome.trim().length > 0 && caseStudyLearnings.trim().length > 0;
    }
    return false;
  })();

  const handleSubmit = async () => {
    if (validLevel >= 4 && toolLink && !isValidUrl(toolLink)) {
      setLinkError('Please enter a valid URL'); return;
    }
    if (validLevel >= 4 && !toolLink) {
      setLinkError('A link to your dashboard is required for Level ' + validLevel + ' submissions.'); return;
    }

    setIsReviewing(true);
    setReviewError(null);
    setReviewData(null);
    setIsEditing(false);

    // Scroll to Step 2 after a brief delay
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    // Upload local screenshots to Supabase Storage
    const uploadedPaths = [...existingPaths];
    for (const ls of localScreenshots) {
      const path = await uploadScreenshot(ls.file);
      if (path) uploadedPaths.push(path);
    }
    await saveDraft({ screenshotPaths: uploadedPaths } as any);

    // Prepare base64 data URIs for the review API
    const screenshotDataUris: string[] = [];
    for (const ls of localScreenshots) {
      try {
        const dataUri = await resizeImage(ls.file);
        screenshotDataUris.push(dataUri);
      } catch { /* skip failed images */ }
    }
    for (const path of existingPaths) {
      try {
        const url = existingUrls[path] || await getSignedUrl(path);
        if (url) {
          const dataUri = await fetchImageAsBase64(url);
          screenshotDataUris.push(dataUri);
        }
      } catch { /* skip failed images */ }
    }

    // Get learner profile
    let learnerProfile = { role: '', function: '', seniority: '', aiExperience: '' };
    if (user) {
      const profile = await getProfile(user.id);
      if (profile) {
        learnerProfile = {
          role: profile.role || '',
          function: profile.function || '',
          seniority: profile.seniority || '',
          aiExperience: profile.aiExperience || '',
        };
      }
    }

    const result = await submitForReview(screenshotDataUris, learnerProfile);
    setIsReviewing(false);

    if (result.success && result.review) {
      // Track previous tier for improvement display
      if (reviewData) {
        const oldTier = calculateTier(reviewData.dimensions);
        setPreviousTier(oldTier.tier);
      }
      setReviewData(result.review);
      setLocalScreenshots([]);
      setExistingPaths(uploadedPaths);

      // Auto-create/update artefact
      if (user && submission) {
        const tier = calculateTier(result.review.dimensions);
        // Refresh submission to get latest data including review results
        const freshSubmission = { ...submission, reviewDimensions: result.review.dimensions, reviewSummary: result.review.summary, reviewEncouragement: result.review.encouragement, reviewPassed: result.review.overallPassed };
        upsertProjectArtefact(user.id, freshSubmission, tier.label, tier.tier);
      }
    } else {
      setReviewError(result.error || 'Something went wrong reviewing your submission. Your draft has been saved — please try again.');
    }
  };

  const handleEditResubmit = () => {
    setIsEditing(true);
    setIsConfirmed(false);
    setReviewError(null);
    // Scroll back to Step 1
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSubmission = async () => {
    setIsConfirmed(true);
    // Mark as passed in DB
    if (user && submission) {
      const { supabase } = await import('../../lib/supabase');
      await supabase
        .from('project_submissions')
        .update({ status: 'passed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', submission.id)
        .eq('user_id', user.id);

      // Create/update artefact
      if (reviewData) {
        const tier = calculateTier(reviewData.dimensions);
        const freshSubmission = {
          ...submission,
          status: 'passed' as const,
          reviewDimensions: reviewData.dimensions,
          reviewSummary: reviewData.summary,
          reviewEncouragement: reviewData.encouragement,
          reviewPassed: reviewData.overallPassed,
        };
        await upsertProjectArtefact(user.id, freshSubmission, tier.label, tier.tier);
      }
    }
    // After confirming, go straight to the picker view
    setPageView('picker');
  };

  /* ── Step state derivation (toolkit pattern) ── */
  // Step 1 is "done" and collapses when reviewing or has review data (and not editing)
  const step1Done = (isReviewing || !!reviewData || !!reviewError) && !isEditing;
  const step1Collapsed = step1Done;

  // Step 2 is locked until Step 1 has been submitted at least once
  const step2Locked = !isReviewing && !reviewData && !reviewError;

  // Guards
  if (loading) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: FONT }}>
        <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: LEVEL_ACCENT_DARK, borderRadius: '50%', animation: 'ppSpin 0.7s linear infinite' }} />
        <style>{`@keyframes ppSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hasLearningPlan) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: FONT, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 16, color: '#718096', marginBottom: 16 }}>Generate a learning plan to access project submissions.</div>
        <button onClick={() => navigate('/app/journey')} style={{ background: '#38B2AC', color: '#FFF', border: 'none', borderRadius: 24, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go to My Journey</button>
      </div>
    );
  }

  if (!projectBrief) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: FONT }}>
        <span onClick={() => navigate('/app/journey')} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Back to My Journey</span>
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 16, color: '#718096' }}>No project has been assigned for this level.</div>
        </div>
      </div>
    );
  }

  const currentLevel = userProfile?.currentLevel ?? 1;
  if (validLevel > currentLevel + 1) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: FONT }}>
        <span onClick={() => navigate('/app/journey')} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Back to My Journey</span>
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 16, color: '#718096' }}>Complete Level {validLevel - 1} to unlock this project.</div>
        </div>
      </div>
    );
  }

  const screenshotProps = {
    localScreenshots,
    existingPaths,
    existingUrls,
    onAddScreenshots: (files: LocalScreenshot[]) => setLocalScreenshots(prev => [...prev, ...files]),
    onRemoveLocalScreenshot: (idx: number) => {
      setLocalScreenshots(prev => {
        const next = [...prev];
        URL.revokeObjectURL(next[idx].preview);
        next.splice(idx, 1);
        return next;
      });
    },
    onRemoveExistingScreenshot: async (path: string) => {
      await removeScreenshot(path);
      setExistingPaths(prev => prev.filter(p => p !== path));
      setExistingUrls(prev => { const n = { ...prev }; delete n[path]; return n; });
      await saveDraft({ screenshotPaths: existingPaths.filter(p => p !== path) } as any);
    },
  };

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: FONT }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppConnectorFlow { from { background-position-y: 0; } to { background-position-y: 20px; } }
        @keyframes saveFade { 0% { opacity: 0; } 10% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>

      {/* Back Link */}
      <div style={{ marginBottom: 16, animation: 'ppFadeIn 0.3s ease 0ms both' }}>
        <span onClick={() => { triggerSave(); navigate('/app/journey'); }} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4A5568'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
        ><ArrowLeft size={14} /> Back to My Journey</span>
      </div>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.4px', margin: 0, marginBottom: 6, animation: 'ppFadeIn 0.3s ease 40ms both' }}>
        Level {validLevel} Project Proof
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 24, animation: 'ppFadeIn 0.3s ease 60ms both' }}>
        {LEVEL_DESCRIPTIONS[validLevel]}
      </p>

      {/* Project Brief (always visible) */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`, padding: '24px 28px', marginBottom: 20, animation: 'ppFadeIn 0.3s ease 80ms both' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>LEVEL {validLevel} — {meta.name}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginTop: 8 }}>{projectBrief.projectTitle}</div>
        <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, marginTop: 8 }}>{projectBrief.projectDescription}</div>
        {projectBrief.deliverable && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <FileText size={14} color={LEVEL_ACCENT_DARK} style={{ marginTop: 2, flexShrink: 0 }} />
            <div><span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>Deliverable: </span><span style={{ fontSize: 13, color: '#4A5568' }}>{projectBrief.deliverable}</span></div>
          </div>
        )}
        {projectBrief.challengeConnection && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Lightbulb size={14} color={LEVEL_ACCENT_DARK} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#718096', fontStyle: 'italic', lineHeight: 1.5 }}>{projectBrief.challengeConnection}</div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PICKER VIEW — shown when returning to a completed sub */}
      {/* ═══════════════════════════════════════════════════════ */}
      {pageView === 'picker' && submission && reviewData && (
        <div style={{ animation: 'ppFadeIn 0.3s ease 100ms both' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 14 }}>
            What would you like to do?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Card 1: Resume existing */}
            <div
              onClick={() => {
                setPageView('form');
                setIsEditing(true);
                setIsConfirmed(false);
              }}
              style={{
                background: '#FFFFFF', borderRadius: 16,
                border: `1px solid ${LEVEL_ACCENT}88`, padding: '24px',
                cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${LEVEL_ACCENT}18`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${LEVEL_ACCENT}88`; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${LEVEL_ACCENT}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Pencil size={16} color={LEVEL_ACCENT_DARK} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
                  Edit existing submission
                </div>
              </div>
              {/* Mini summary */}
              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginBottom: 10 }}>
                {submission.reflectionText
                  ? submission.reflectionText.slice(0, 120) + (submission.reflectionText.length > 120 ? '…' : '')
                  : 'Your previous submission'}
              </div>
              {/* Tier badge inline */}
              {(() => {
                const tier = calculateTier(reviewData.dimensions);
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: tier.color }}>
                    <Award size={13} color={tier.darkColor} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: tier.darkColor }}>{tier.tier} Tier</span>
                    <span style={{ fontSize: 11, color: '#718096' }}>· {tier.points}/{tier.maxPoints} pts</span>
                  </div>
                );
              })()}
            </div>

            {/* Card 2: Start new */}
            <div
              onClick={() => {
                // Reset form state for a fresh submission
                setToolName('');
                setPlatformUsed('');
                setToolLink('');
                setReflectionText('');
                setAdoptionScope(null);
                setOutcomeText('');
                setCaseStudyProblem('');
                setCaseStudySolution('');
                setCaseStudyOutcome('');
                setCaseStudyLearnings('');
                setLocalScreenshots([]);
                setExistingPaths([]);
                setExistingUrls({});
                setReviewData(null);
                setReviewError(null);
                setIsConfirmed(false);
                setIsEditing(false);
                setPreviousTier(null);
                setPageView('form');
              }}
              style={{
                background: '#FFFFFF', borderRadius: 16,
                border: '1px solid #E2E8F0', padding: '24px',
                cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#F7FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed #CBD5E0',
                }}>
                  <Plus size={16} color="#718096" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
                  Start a new submission
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>
                Add another example of how you've applied this level's skills to your work.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STEP 1 — Your Submission (form, collapses on submit)  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {pageView === 'form' && <>
      <div style={{ animation: 'ppFadeIn 0.3s ease 100ms both' }}>
        <StepCard
          stepNumber={1}
          title="Your Submission"
          subtitle="Describe what you built, how you applied it, and the impact it had."
          done={step1Done}
          collapsed={step1Collapsed}
          accentColor={LEVEL_ACCENT}
          accentDark={LEVEL_ACCENT_DARK}
        >
          {/* Form content */}
          {validLevel === 1 && (
            <SubmissionFormL1
              data={{ reflectionText, adoptionScope, outcomeText }}
              onChange={handleFieldChange}
              accentColor={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              disabled={false}
              {...screenshotProps}
            />
          )}
          {(validLevel === 2 || validLevel === 3) && (
            <SubmissionFormL2L3
              level={validLevel}
              data={{ toolName, platformUsed, toolLink, reflectionText, adoptionScope, outcomeText }}
              onChange={handleFieldChange}
              accentColor={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              disabled={false}
              linkError={linkError}
              {...screenshotProps}
            />
          )}
          {(validLevel === 4 || validLevel === 5) && (
            <>
              <SubmissionFormL4L5Base
                level={validLevel}
                data={{ toolName, platformUsed, toolLink, reflectionText, adoptionScope, outcomeText }}
                onChange={handleFieldChange}
                accentColor={LEVEL_ACCENT}
                accentDark={LEVEL_ACCENT_DARK}
                disabled={false}
                linkError={linkError}
                {...screenshotProps}
              />
              {validLevel === 5 && (
                <CaseStudyCard
                  data={{ caseStudyProblem, caseStudySolution, caseStudyOutcome, caseStudyLearnings }}
                  onChange={handleFieldChange}
                  accentDark={LEVEL_ACCENT_DARK}
                  disabled={false}
                />
              )}
            </>
          )}

          {/* Submit controls (inside Step 1) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0 0', marginTop: 8,
          }}>
            {/* Left: auto-save indicator */}
            <div style={{ minHeight: 20 }}>
              {showSaved && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: '#A0AEC0',
                  animation: 'saveFade 2.5s ease both',
                }}>
                  <Check size={12} color="#A0AEC0" />
                  Draft saved
                </div>
              )}
            </div>

            {/* Right: submit button */}
            <button
              onClick={isValid ? handleSubmit : undefined}
              disabled={!isValid || saving}
              title={!isValid ? 'Fill in all required fields to submit' : undefined}
              style={{
                background: isValid ? LEVEL_ACCENT_DARK : '#E2E8F0',
                color: isValid ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: 24,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: isValid ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, transform 0.1s',
                fontFamily: FONT,
              }}
              onMouseEnter={(e) => { if (isValid) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { if (isValid) e.currentTarget.style.opacity = '1'; }}
            >
              {saving ? 'Saving…' : 'Submit for Review'}
            </button>
          </div>

          {/* Review error (show inside Step 1 if editing after error) */}
          {reviewError && isEditing && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 10,
              background: '#FFF5F5', border: '1px solid #FC8181',
              fontSize: 13, color: '#C53030', lineHeight: 1.5,
            }}>
              {reviewError}
            </div>
          )}
        </StepCard>
      </div>

      {/* ── Connector ── */}
      <StepConnector accentColor={LEVEL_ACCENT} />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STEP 2 — Review Feedback (results, never collapses)   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div ref={outputRef} style={{ animation: 'ppFadeIn 0.3s ease 140ms both' }}>
        <StepCard
          stepNumber={2}
          title="Review Feedback"
          subtitle="Your personalised feedback from the OXYGY AI reviewer."
          done={false}
          collapsed={false}
          locked={step2Locked}
          lockedMessage="Complete Step 1 to receive your feedback"
          accentColor={LEVEL_ACCENT}
          accentDark={LEVEL_ACCENT_DARK}
        >
          {isReviewing ? (
            <ReviewProcessing accentDark={LEVEL_ACCENT_DARK} />
          ) : reviewError && !isEditing ? (
            <div>
              <div style={{
                padding: '16px 20px', borderRadius: 12,
                background: '#FFF5F5', border: '1px solid #FC8181',
                fontSize: 13, color: '#C53030', lineHeight: 1.5,
                marginBottom: 16,
              }}>
                {reviewError}
              </div>
              <button
                onClick={handleEditResubmit}
                style={{
                  background: LEVEL_ACCENT_DARK,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 24,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                Edit & Resubmit
              </button>
            </div>
          ) : reviewData ? (
            <ReviewScorecard
              review={reviewData}
              reviewedAt={submission?.reviewedAt || null}
              accentColor={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
              onEditResubmit={handleEditResubmit}
              onConfirmSubmission={handleConfirmSubmission}
              showResubmit={!isEditing && !isConfirmed}
              isConfirmed={isConfirmed}
              previousTier={previousTier}
            />
          ) : null}
        </StepCard>
      </div>
      </>}
    </div>
  );
};

export default AppProjectProof;
