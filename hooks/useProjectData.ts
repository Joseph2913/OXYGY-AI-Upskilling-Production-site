import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import {
  getProjectSubmission,
  upsertProjectDraft,
  submitProject,
  uploadProjectScreenshot,
  deleteProjectScreenshot,
  getScreenshotUrl,
  getLatestLearningPlan,
} from '../lib/database';
import type { ProjectSubmission, ReviewProjectResponse } from '../lib/database';

export interface ProjectBrief {
  projectTitle: string;
  projectDescription: string;
  deliverable: string;
  challengeConnection: string;
}

export interface SubmitResult {
  success: boolean;
  review: ReviewProjectResponse | null;
  error: string | null;
}

export interface UseProjectDataReturn {
  submission: ProjectSubmission | null;
  projectBrief: ProjectBrief | null;
  loading: boolean;
  saving: boolean;
  saveDraft: (data: Partial<ProjectSubmission>) => Promise<void>;
  submitForReview: (
    screenshotDataUris: string[],
    learnerProfile: { role: string; function: string; seniority: string; aiExperience: string },
  ) => Promise<SubmitResult>;
  uploadScreenshot: (file: File) => Promise<string | null>;
  removeScreenshot: (path: string) => Promise<boolean>;
  getSignedUrl: (path: string) => Promise<string | null>;
}

export function useProjectData(level: number): UseProjectDataReturn {
  const { user } = useAuth();
  const { refreshProjectSubmissions } = useAppContext();
  const [submission, setSubmission] = useState<ProjectSubmission | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || level < 1 || level > 5) {
      setLoading(false);
      return;
    }
    setLoading(true);

    (async () => {
      const [sub, planData] = await Promise.all([
        getProjectSubmission(user.id, level),
        getLatestLearningPlan(user.id),
      ]);

      setSubmission(sub);

      if (planData?.plan?.levels) {
        const levelKey = `L${level}`;
        const levelResult = planData.plan.levels[levelKey];
        if (levelResult) {
          setProjectBrief({
            projectTitle: levelResult.projectTitle || '',
            projectDescription: levelResult.projectDescription || '',
            deliverable: levelResult.deliverable || '',
            challengeConnection: levelResult.challengeConnection || '',
          });
        } else {
          setProjectBrief(null);
        }
      } else {
        setProjectBrief(null);
      }

      setLoading(false);
    })();
  }, [user, level]);

  const saveDraft = useCallback(async (data: Partial<ProjectSubmission>) => {
    if (!user) return;
    setSaving(true);
    await upsertProjectDraft(user.id, level, {
      toolName: data.toolName ?? undefined,
      platformUsed: data.platformUsed ?? undefined,
      toolLink: data.toolLink ?? undefined,
      screenshotPaths: data.screenshotPaths ?? undefined,
      reflectionText: data.reflectionText ?? undefined,
      adoptionScope: data.adoptionScope ?? undefined,
      outcomeText: data.outcomeText ?? undefined,
      caseStudyProblem: data.caseStudyProblem ?? undefined,
      caseStudySolution: data.caseStudySolution ?? undefined,
      caseStudyOutcome: data.caseStudyOutcome ?? undefined,
      caseStudyLearnings: data.caseStudyLearnings ?? undefined,
    });
    const updated = await getProjectSubmission(user.id, level);
    if (updated) setSubmission(updated);
    setSaving(false);
  }, [user, level]);

  const submitForReview = useCallback(async (
    screenshotDataUris: string[],
    learnerProfile: { role: string; function: string; seniority: string; aiExperience: string },
  ): Promise<SubmitResult> => {
    if (!user || !submission || !projectBrief) {
      return { success: false, review: null, error: 'Missing required data' };
    }
    setSaving(true);

    const result = await submitProject(
      user.id,
      level,
      submission,
      screenshotDataUris,
      projectBrief,
      learnerProfile,
    );

    // Refresh submission from DB
    const updated = await getProjectSubmission(user.id, level);
    if (updated) setSubmission(updated);
    await refreshProjectSubmissions();

    setSaving(false);
    return result;
  }, [user, level, submission, projectBrief, refreshProjectSubmissions]);

  const uploadScreenshotFn = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    return uploadProjectScreenshot(user.id, level, file);
  }, [user, level]);

  const removeScreenshot = useCallback(async (path: string): Promise<boolean> => {
    return deleteProjectScreenshot(path);
  }, []);

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    return getScreenshotUrl(path);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    submission,
    projectBrief,
    loading,
    saving,
    saveDraft,
    submitForReview,
    uploadScreenshot: uploadScreenshotFn,
    removeScreenshot,
    getSignedUrl,
  };
}
