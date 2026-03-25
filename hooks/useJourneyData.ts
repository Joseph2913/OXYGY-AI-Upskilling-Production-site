import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTourMode } from '../context/TourModeContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
  getLevelProgress,
  getAllProjectSubmissions,
  getLatestLearningPlan,
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
  // Sequential phase unlock additions
  isAssigned: boolean;   // true if this level is in the user's learning plan
  topicPhases: Array<{   // per-topic phase breakdown for LevelCard display
    topicId: number;
    topicTitle: string;
    elearnDone: boolean;
    toolkitDone: boolean;
    projectDone: boolean;
    isLocked: boolean;  // true if previous topic is not yet complete
  }>;
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
  const { dataVersion } = useAppContext();
  const isTourMode = useTourMode();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isTourMode) {
      import('../data/tourDemoData').then(m => {
        setData(m.DEMO_JOURNEY_DATA);
        setLoading(false);
      });
      return;
    }
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const [topicProgressRows, artefactCounts, levelProgressRows, projectSubs, learningPlanData] = await Promise.all([
          getAllTopicProgress(user.id),
          getArtefactCountsByLevel(user.id),
          getLevelProgress(user.id),
          getAllProjectSubmissions(user.id),
          getLatestLearningPlan(user.id),
        ]);

        const lpMap = new Map<number, LevelProgressRow>(levelProgressRows.map(r => [r.level, r]));
        const psMap = new Map<number, ProjectSubmission>(projectSubs.map(s => [s.level, s]));

        // Determine which levels are assigned from learning plan
        const assignedLevelKeys = learningPlanData?.plan?.levels
          ? Object.keys(learningPlanData.plan.levels)    // e.g. ['L1', 'L2', 'L3']
          : ['L1', 'L2', 'L3', 'L4', 'L5'];             // fallback: all assigned if no plan

        // ── Build completedLevelSet using canonical 3-phase check ──
        // MUST match useDashboardData.ts logic exactly.
        const completedLevelSet = new Set<number>();
        for (let lvl = 1; lvl <= 5; lvl++) {
          const lvlTopics = LEVEL_TOPICS[lvl] || [];
          const activeTopics = lvlTopics;
          const progressForLvl = topicProgressRows.filter(r => r.level === lvl);
          const progressMapLvl = new Map(progressForLvl.map(r => [r.topic_id, r]));
          const lvlProjectPassed = psMap.get(lvl)?.status === 'passed';
          const lvlToolkitDone = (artefactCounts[lvl] || 0) > 0;
          let completedCount = 0;
          lvlTopics.forEach(topic => {
            const row = progressMapLvl.get(topic.id);
            // NEVER use completed_at — may be set prematurely. 3-phase check is the only truth.
          const isDone = !!row?.elearn_completed_at && lvlToolkitDone && lvlProjectPassed;
            if (isDone) completedCount++;
          });
          if (completedCount === activeTopics.length && activeTopics.length > 0) {
            completedLevelSet.add(lvl);
          }
        }
        // Derive current level = first level not yet complete
        let derivedCurrentLevel = 5;
        for (let lvl = 1; lvl <= 5; lvl++) {
          if (!completedLevelSet.has(lvl)) { derivedCurrentLevel = lvl; break; }
        }

        const levels: LevelProgress[] = [1, 2, 3, 4, 5].map(levelNumber => {
          const topics = LEVEL_TOPICS[levelNumber] || [];
          const progressForLevel = topicProgressRows.filter(r => r.level === levelNumber);
          const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));
          const toolsForLevel = ALL_TOOLS.filter(t => t.levelRequired === levelNumber).length;
          const lp = lpMap.get(levelNumber);
          const ps = psMap.get(levelNumber) || null;
          const isAssigned = assignedLevelKeys.includes(`L${levelNumber}`);

          let completedTopics = 0;
          let activeTopicIndex = 0;
          let currentSlide = 0;
          let currentPhase = 1;
          let foundActive = false;

          // Check if this level's project passed
          const levelProjectPassed = ps?.status === 'passed';
          // Toolkit = artefacts created for this level
          const levelToolkitDone = (artefactCounts[levelNumber] || 0) > 0;

          topics.forEach((topic, idx) => {
            const row = progressMap.get(topic.id);
            // A topic is complete ONLY when all 3 user-visible phases are done:
            //   1. E-Learning: elearn_completed_at is set
            //   2. Toolkit: artefact count > 0 for this level
            //   3. Project: project submission status === 'passed'
            // NEVER use completed_at — it may be set prematurely in the DB.
            // The 3-phase check is the single source of truth.
            const isTopicComplete = !!row?.elearn_completed_at && levelToolkitDone && levelProjectPassed;
            if (isTopicComplete) {
              completedTopics++;
            } else if (!foundActive) {
              activeTopicIndex = idx;
              currentSlide = row?.current_slide ?? 0;
              currentPhase = row?.current_phase ?? 1;
              foundActive = true;
            }
          });

          // Build per-topic phase breakdown
          const topicPhases = LEVEL_TOPICS[levelNumber]
            .map((topic, idx) => {
              const tp = topicProgressRows.find(
                r => r.level === levelNumber && r.topic_id === topic.id
              );
              const prevTopic = idx > 0
                ? topicProgressRows.find(r => r.level === levelNumber && r.topic_id === LEVEL_TOPICS[levelNumber][idx - 1].id)
                : null;
              // Previous topic is complete using the same 3-phase check — never use completed_at
              const prevComplete = idx === 0 ||
                (!!prevTopic?.elearn_completed_at && levelToolkitDone && levelProjectPassed);
              return {
                topicId: topic.id,
                topicTitle: topic.title,
                elearnDone: !!tp?.elearn_completed_at,
                toolkitDone: levelToolkitDone,
                projectDone: levelProjectPassed,
                isLocked: !prevComplete,
              };
            });

          const allTopicsDone = completedTopics === topics.length && topics.length > 0;
          const toolUsed = lp?.tool_used ?? false;
          const workshopAttended = lp?.workshop_attended ?? false;
          const projectCompleted = lp?.project_completed ?? false;

          let completedAt: Date | null = null;
          if (allTopicsDone) {
            // Use any available timestamp — completed_at, elearn_completed_at, or now
            const timestamps = progressForLevel
              .map(r => r.completed_at || r.elearn_completed_at)
              .filter(Boolean)
              .map(t => new Date(t!).getTime());
            completedAt = timestamps.length > 0
              ? new Date(Math.max(...timestamps))
              : new Date(); // fallback: all topics done but no timestamp
          }

          // Determine status using the same 3-phase completion logic:
          // - completed: all active topics pass the broad check (elearn + artefacts + project)
          // - project-pending / active: ONLY if all previous levels are complete (sequential unlock)
          // - not-started: previous levels not yet complete, or no progress
          //
          // A level can only be active/project-pending if every level before it is in completedLevelSet.
          const allPreviousComplete = Array.from({ length: levelNumber - 1 }, (_, i) => i + 1)
            .every(prev => completedLevelSet.has(prev));

          let status: LevelProgress['status'];
          if (allTopicsDone) {
            status = 'completed';
          } else if (!allPreviousComplete) {
            // Previous levels not finished — this level stays locked regardless of any stale progress
            status = 'not-started';
          } else {
            // All previous levels are complete — this level is unlockable
            const allElearnToolkitDone = topics.every(topic => {
              const row = progressMap.get(topic.id);
              return !!row?.elearn_completed_at;
            }) && levelToolkitDone;
            if (allElearnToolkitDone && !levelProjectPassed && topics.length > 0) {
              status = 'project-pending';
            } else if (completedTopics > 0 || progressForLevel.length > 0) {
              status = 'active';
            } else if (levelNumber === derivedCurrentLevel && isAssigned) {
              // This is the current active level (all previous levels complete) — unlock it
              // even if no progress rows exist yet in the database.
              status = 'active';
            } else {
              status = 'not-started';
            }
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
            isAssigned,
            topicPhases,
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
  }, [user, retryCount, isTourMode, dataVersion]);

  const retry = () => setRetryCount(c => c + 1);
  return { data, loading, error, retry };
}
