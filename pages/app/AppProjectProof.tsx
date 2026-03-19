import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Lightbulb } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../hooks/useProjectData';
import { getProfile } from '../../lib/database';
import { SubmissionFormL1 } from '../../components/app/journey/project/SubmissionFormL1';
import { SubmissionFormL2L3 } from '../../components/app/journey/project/SubmissionFormL2';
import { SubmissionFormL4L5Base } from '../../components/app/journey/project/SubmissionFormL4';
import { CaseStudyCard } from '../../components/app/journey/project/CaseStudyCard';
import { SubmissionControls } from '../../components/app/journey/project/SubmissionControls';
import { ReviewScorecard } from '../../components/app/journey/project/ReviewScorecard';
import type { ReviewData } from '../../components/app/journey/project/ReviewScorecard';
import { ReviewProcessing } from '../../components/app/journey/project/ReviewProcessing';
import { LEVEL_META } from '../../data/levelTopics';
import type { LocalScreenshot } from '../../components/app/journey/project/ScreenshotUploader';

const FONT = "'DM Sans', sans-serif";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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

const AppProjectProof: React.FC = () => {
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromProjects = searchParams.get('from') === 'projects';
  const { hasLearningPlan, userProfile } = useAppContext();
  const { user } = useAuth();
  const levelNum = parseInt(levelParam || '', 10);

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
    saveTimerRef.current = setTimeout(() => { triggerSave(); }, 3000);
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

  // Keep ref in sync so the stable useEffect can call the latest version
  triggerSaveRef.current = triggerSave;

  useEffect(() => {
    const handleBeforeUnload = () => { triggerSaveRef.current(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Validation
  const totalScreenshots = existingPaths.length + localScreenshots.length;
  const isValid = (() => {
    if (validLevel === 1) {
      return countWords(reflectionText) >= 150 && !!adoptionScope && countWords(outcomeText) >= 80;
    }
    if (validLevel === 2 || validLevel === 3) {
      return !!toolName && !!platformUsed && totalScreenshots >= 1 &&
        countWords(reflectionText) >= 150 && !!adoptionScope && countWords(outcomeText) >= 80;
    }
    if (validLevel === 4) {
      return !!toolName && !!platformUsed && !!toolLink && isValidUrl(toolLink) &&
        totalScreenshots >= 2 && countWords(reflectionText) >= 200 &&
        !!adoptionScope && countWords(outcomeText) >= 100;
    }
    if (validLevel === 5) {
      return !!toolName && !!platformUsed && !!toolLink && isValidUrl(toolLink) &&
        totalScreenshots >= 2 && countWords(reflectionText) >= 200 &&
        !!adoptionScope && countWords(outcomeText) >= 100 &&
        countWords(caseStudyProblem) >= 100 && countWords(caseStudySolution) >= 100 &&
        countWords(caseStudyOutcome) >= 100 && countWords(caseStudyLearnings) >= 100;
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

    // Upload local screenshots to Supabase Storage
    const uploadedPaths = [...existingPaths];
    for (const ls of localScreenshots) {
      const path = await uploadScreenshot(ls.file);
      if (path) uploadedPaths.push(path);
    }
    await saveDraft({ screenshotPaths: uploadedPaths } as any);

    // Prepare base64 data URIs for the review API
    const screenshotDataUris: string[] = [];

    // New local files: resize and convert
    for (const ls of localScreenshots) {
      try {
        const dataUri = await resizeImage(ls.file);
        screenshotDataUris.push(dataUri);
      } catch { /* skip failed images */ }
    }

    // Existing uploaded images: fetch signed URLs and convert
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
      setReviewData(result.review);
      setLocalScreenshots([]);
      setExistingPaths(uploadedPaths);
      setIsEditing(false);
    } else {
      setReviewError(result.error || 'Something went wrong reviewing your submission. Your draft has been saved — please try again.');
    }
  };

  const handleEditResubmit = () => {
    setIsEditing(true);
    setReviewError(null);
  };

  // Determine read-only state
  const isReadOnly = (() => {
    if (isEditing) return false; // user clicked "Edit & Resubmit"
    if (submission?.status === 'passed') return true;
    if (submission?.status === 'needs_revision' && !isEditing) return true;
    if (submission?.status === 'submitted') return true;
    return false;
  })();

  // Show submit controls when: draft, or editing after needs_revision
  const showSubmitControls = !submission?.status || submission.status === 'draft' || isEditing;

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
        <span onClick={() => navigate(fromProjects ? '/app/projects' : '/app/journey')} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> {fromProjects ? 'Back to My Projects' : 'Back to My Journey'}</span>
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
        <span onClick={() => navigate(fromProjects ? '/app/projects' : '/app/journey')} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> {fromProjects ? 'Back to My Projects' : 'Back to My Journey'}</span>
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
      `}</style>

      {/* Back Link */}
      <div style={{ marginBottom: 16, animation: 'ppFadeIn 0.3s ease 0ms both' }}>
        <span onClick={() => { triggerSave(); navigate(fromProjects ? '/app/projects' : '/app/journey'); }} style={{ fontSize: 13, fontWeight: 500, color: '#718096', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4A5568'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
        ><ArrowLeft size={14} /> {fromProjects ? 'Back to My Projects' : 'Back to My Journey'}</span>
      </div>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.4px', margin: 0, marginBottom: 6, animation: 'ppFadeIn 0.3s ease 40ms both' }}>
        Level {validLevel} Project Proof
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 24, animation: 'ppFadeIn 0.3s ease 60ms both' }}>
        {LEVEL_DESCRIPTIONS[validLevel]}
      </p>

      {/* Zone 1: Project Brief */}
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

      {/* Zone 4: Review Scorecard */}
      {reviewData && (
        <ReviewScorecard
          review={reviewData}
          reviewedAt={submission?.reviewedAt || null}
          accentColor={LEVEL_ACCENT}
          accentDark={LEVEL_ACCENT_DARK}
          onEditResubmit={handleEditResubmit}
          showResubmit={submission?.status === 'needs_revision' && !isEditing}
        />
      )}

      {/* Zone 4 placeholder for PRD 18 backwards compat */}
      {!reviewData && <div data-testid="review-scorecard-zone" />}

      {/* Zone 2: Submission Form */}
      <div style={{ animation: 'ppFadeIn 0.3s ease 120ms both' }}>
        {validLevel === 1 && (
          <SubmissionFormL1
            data={{ reflectionText, adoptionScope, outcomeText }}
            onChange={handleFieldChange}
            accentColor={LEVEL_ACCENT}
            accentDark={LEVEL_ACCENT_DARK}
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
              disabled={isReadOnly}
              linkError={linkError}
              {...screenshotProps}
            />
            {validLevel === 5 && (
              <CaseStudyCard
                data={{ caseStudyProblem, caseStudySolution, caseStudyOutcome, caseStudyLearnings }}
                onChange={handleFieldChange}
                accentDark={LEVEL_ACCENT_DARK}
                disabled={isReadOnly}
              />
            )}
          </>
        )}
      </div>

      {/* Zone 3: Submission Controls / Processing / Completion */}
      <div style={{ animation: 'ppFadeIn 0.3s ease 260ms both' }}>
        {isReviewing ? (
          <ReviewProcessing accentDark={LEVEL_ACCENT_DARK} />
        ) : reviewError ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#E53E3E', marginBottom: 12, lineHeight: 1.5 }}>
              {reviewError}
            </div>
            <SubmissionControls
              status="draft"
              isValid={isValid}
              saving={saving}
              savedAt={savedAt}
              submittedAt={null}
              onSubmit={handleSubmit}
              accentColor={LEVEL_ACCENT}
              accentDark={LEVEL_ACCENT_DARK}
            />
          </div>
        ) : showSubmitControls ? (
          <SubmissionControls
            status={isEditing ? 'draft' : (submission?.status || null)}
            isValid={isValid}
            saving={saving}
            savedAt={savedAt}
            submittedAt={submission?.submittedAt || null}
            onSubmit={handleSubmit}
            accentColor={LEVEL_ACCENT}
            accentDark={LEVEL_ACCENT_DARK}
          />
        ) : submission?.status === 'passed' && !reviewData ? (
          /* Legacy PRD-17 auto-completed submissions (no review data) */
          <SubmissionControls
            status="passed"
            isValid={isValid}
            saving={saving}
            savedAt={savedAt}
            submittedAt={submission?.submittedAt || null}
            onSubmit={handleSubmit}
            accentColor={LEVEL_ACCENT}
            accentDark={LEVEL_ACCENT_DARK}
          />
        ) : null}
      </div>
    </div>
  );
};

export default AppProjectProof;
