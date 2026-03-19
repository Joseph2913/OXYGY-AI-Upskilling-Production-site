import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { getLatestLearningPlan } from '../lib/database';
import { LEVEL_META } from '../data/levelTopics';

export interface ProjectOverview {
  level: number;
  levelName: string;
  accentColor: string;
  accentDark: string;
  projectTitle: string;
  projectDescription: string;
  deliverable: string;
  challengeConnection: string;
  depth: string | null;
  submissionStatus: 'none' | 'draft' | 'submitted' | 'passed' | 'needs_revision';
  completedAt: number | null;
}

export function useAllProjectsData(): {
  projects: ProjectOverview[];
  loading: boolean;
} {
  const { user } = useAuth();
  const { projectSubmissions, hasLearningPlan } = useAppContext();
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const result = await getLatestLearningPlan(user.id);
      if (cancelled) return;

      const items: ProjectOverview[] = [1, 2, 3, 4, 5].map(n => {
        const meta = LEVEL_META.find(m => m.number === n)!;
        const planLevel = result?.plan?.levels?.[`L${n}`];
        const sub = projectSubmissions[n];

        return {
          level: n,
          levelName: meta.name,
          accentColor: meta.accentColor,
          accentDark: meta.accentDark,
          projectTitle: planLevel?.projectTitle || '',
          projectDescription: planLevel?.projectDescription || '',
          deliverable: planLevel?.deliverable || '',
          challengeConnection: planLevel?.challengeConnection || '',
          depth: planLevel?.depth || null,
          submissionStatus: sub?.status || 'none',
          completedAt: sub?.completedAt || null,
        };
      });

      setProjects(items);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, hasLearningPlan, projectSubmissions]);

  return { projects, loading };
}
