import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
  getLevelProgress,
  getAllProjectSubmissions,
} from '../lib/database';
import type { LevelProgressRow, ProjectSubmission } from '../lib/database';
import { LEVEL_TOPICS } from '../data/levelTopics';
import { ALL_TOOLS } from '../data/toolkitData';

export interface LevelProgress {
  levelNumber: number;
  status: 'completed' | 'active' | 'not-started' | 'project-pending';
  completedTopics: number;
  totalTopics: number;
  completedAt: Date | null;
  artefactsCreated: number;
  toolsUnlocked: number;
  activeTopicIndex: number;
  currentSlide: number;
  currentPhase: number;
  // PRD 17 additions
  toolUsed: boolean;
  workshopAttended: boolean;
  projectCompleted: boolean;
  projectSubmission: ProjectSubmission | null;
}

export interface JourneyData {
  levels: LevelProgress[];
  completedLevelsCount: number;
}

export function useJourneyData(): {
  data: JourneyData | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
} {
  const { user } = useAuth();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const [topicProgressRows, artefactCounts, levelProgressRows, projectSubs] = await Promise.all([
          getAllTopicProgress(user.id),
          getArtefactCountsByLevel(user.id),
          getLevelProgress(user.id),
          getAllProjectSubmissions(user.id),
        ]);

        const lpMap = new Map<number, LevelProgressRow>(levelProgressRows.map(r => [r.level, r]));
        const psMap = new Map<number, ProjectSubmission>(projectSubs.map(s => [s.level, s]));

        const levels: LevelProgress[] = [1, 2, 3, 4, 5].map(levelNumber => {
          const topics = LEVEL_TOPICS[levelNumber] || [];
          const progressForLevel = topicProgressRows.filter(r => r.level === levelNumber);
          const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));
          const toolsForLevel = ALL_TOOLS.filter(t => t.levelRequired === levelNumber).length;
          const lp = lpMap.get(levelNumber);
          const ps = psMap.get(levelNumber) || null;

          let completedTopics = 0;
          let activeTopicIndex = 0;
          let currentSlide = 0;
          let currentPhase = 1;
          let foundActive = false;

          topics.forEach((topic, idx) => {
            const row = progressMap.get(topic.id);
            if (row?.completed_at) {
              completedTopics++;
            } else if (!foundActive) {
              activeTopicIndex = idx;
              currentSlide = row?.current_slide ?? 0;
              currentPhase = row?.current_phase ?? 1;
              foundActive = true;
            }
          });

          const allTopicsDone = completedTopics === topics.length && topics.length > 0;
          const toolUsed = lp?.tool_used ?? false;
          const workshopAttended = lp?.workshop_attended ?? false;
          const projectCompleted = lp?.project_completed ?? false;

          // Two-tier progression: content done = topics + tool + workshop
          const contentDone = allTopicsDone && toolUsed && workshopAttended;

          let completedAt: Date | null = null;
          if (allTopicsDone) {
            const timestamps = progressForLevel
              .map(r => r.completed_at)
              .filter(Boolean)
              .map(t => new Date(t!).getTime());
            if (timestamps.length > 0) {
              completedAt = new Date(Math.max(...timestamps));
            }
          }

          // Determine status: completed (all 4 activities), project-pending (content done but no project),
          // active (in progress), not-started
          let status: LevelProgress['status'];
          if (allTopicsDone && projectCompleted) {
            status = 'completed';
          } else if (contentDone && !projectCompleted) {
            status = 'project-pending';
          } else if (completedTopics > 0 || progressForLevel.length > 0) {
            status = 'active';
          } else {
            status = 'not-started';
          }

          return {
            levelNumber,
            status,
            completedTopics,
            totalTopics: topics.length,
            completedAt,
            artefactsCreated: artefactCounts[levelNumber] || 0,
            toolsUnlocked: toolsForLevel,
            activeTopicIndex,
            currentSlide,
            currentPhase,
            toolUsed,
            workshopAttended,
            projectCompleted,
            projectSubmission: ps,
          };
        });

        const completedLevelsCount = levels.filter(l => l.status === 'completed').length;
        setData({ levels, completedLevelsCount });
        setLoading(false);
      } catch (err) {
        console.error('useJourneyData error:', err);
        setError(true);
        setLoading(false);
      }
    })();
  }, [user, retryCount]);

  const retry = () => setRetryCount(c => c + 1);
  return { data, loading, error, retry };
}
