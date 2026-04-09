import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTourMode } from '../context/TourModeContext';
import { getArtefactCountsByLevel, getAllTopicProgress, getAllProjectSubmissions, getLatestLearningPlan, getLevelProgress, SCORING } from '../lib/database';
import { getPrimaryTool } from '../data/toolkitData';
import { LEVEL_TOPICS } from '../data/levelTopics';

export interface ToolLevelStats {
  levelNumber: number;
  toolId: string;
  artefactsCreated: number;
  pointsEarned: number;
  timesUsed: number;
  unlocked: boolean;       // elearn done → toolkit is unlocked
  toolkitCompleted: boolean; // read_completed_at is set
  isAssigned: boolean;       // level is in learning plan
}

export interface ToolkitData {
  currentLevel: number;
  totalArtefacts: number;
  totalPoints: number;
  totalUsage: number;
  levelStats: ToolLevelStats[];
}

export function useToolkitData(): { data: ToolkitData | null; loading: boolean } {
  const { user } = useAuth();
  const { userProfile, dataVersion } = useAppContext();
  const isTourMode = useTourMode();
  const [data, setData] = useState<ToolkitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTourMode) {
      import('../data/tourDemoData').then(m => {
        setData(m.DEMO_TOOLKIT_DATA);
        setLoading(false);
      });
      return;
    }

    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const [artefactCounts, topicRows, projectSubs, learningPlanData, levelProgressRows] = await Promise.all([
        getArtefactCountsByLevel(user.id),
        getAllTopicProgress(user.id),
        getAllProjectSubmissions(user.id),
        getLatestLearningPlan(user.id),
        getLevelProgress(user.id),
      ]);

      // Build project submission map
      const projectSubMap = new Map(projectSubs.map(s => [s.level, s]));

      // Determine which levels are assigned from learning plan.
      // Always enforce a contiguous sequence from L1 — fill any gaps up to the highest assigned level.
      const assignedLevelKeys = learningPlanData?.plan?.levels
        ? (() => {
            const keys = Object.keys(learningPlanData.plan.levels);
            const highest = Math.max(...keys.map(k => parseInt(k.replace('L', ''), 10)));
            return Array.from({ length: highest }, (_, i) => `L${i + 1}`);
          })()
        : ['L1', 'L2', 'L3', 'L4', 'L5'];

      // Build completed level set using the canonical 3-phase check
      // (elearn + artefacts > 0 + project passed) — same logic as useDashboardData
      const completedLevelSet = new Set<number>();
      for (let lvl = 1; lvl <= 5; lvl++) {
        const topics = LEVEL_TOPICS[lvl] || [];
        const activeTopics = topics;
        const progressForLevel = topicRows.filter(r => r.level === lvl);
        const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));
        const levelProjectPassed = projectSubMap.get(lvl)?.status === 'passed';
        const levelToolkitDone = !!levelProgressRows.find(r => r.level === lvl)?.tool_used_at;

        let completedTopics = 0;
        topics.forEach(topic => {
          const row = progressMap.get(topic.id);
          // All 3 required: elearn + toolkit (tool_used_at) + project passed
          const isComplete = !!row?.elearn_completed_at && levelToolkitDone && levelProjectPassed;
          if (isComplete) completedTopics++;
        });
        if (completedTopics === activeTopics.length && activeTopics.length > 0) {
          completedLevelSet.add(lvl);
        }
      }

      // Derive current level from completed levels (same as dashboard)
      let currentLevel = 5;
      for (let lvl = 1; lvl <= 5; lvl++) {
        if (!completedLevelSet.has(lvl)) {
          currentLevel = lvl;
          break;
        }
      }

      // Bonus unlock: L4 and L5 unlock automatically once L1, L2, and L3 are all complete
      const bonusUnlocked = [1, 2, 3].every(l => completedLevelSet.has(l));

      const levelStats: ToolLevelStats[] = [1, 2, 3, 4, 5].map(lvl => {
        const tool = getPrimaryTool(lvl);
        const primaryTopicId = 1;
        const topicRow = topicRows.find(r => r.level === lvl && r.topic_id === primaryTopicId);
        const artefactsCreated = artefactCounts[lvl] || 0;
        const elearnDone = !!topicRow?.elearn_completed_at;
        const toolkitDone = !!levelProgressRows.find(r => r.level === lvl)?.tool_used_at;
        const isAssigned = assignedLevelKeys.includes(`L${lvl}`)
          || (bonusUnlocked && (lvl === 4 || lvl === 5));

        // A toolkit is unlocked if:
        // 1. The level's own elearn is done, OR
        // 2. All previous levels are complete (user has progressed past this level)
        const prevLevelsComplete = lvl === 1 || Array.from({ length: lvl - 1 }, (_, i) => i + 1).every(l => completedLevelSet.has(l));
        const unlocked = elearnDone || prevLevelsComplete;

        return {
          levelNumber: lvl,
          toolId: tool?.id || '',
          artefactsCreated,
          pointsEarned: artefactsCreated * (SCORING.TOOLKIT_SESSION + SCORING.TOOLKIT_SAVE_BONUS),
          timesUsed: artefactsCreated,
          unlocked,
          toolkitCompleted: toolkitDone,
          isAssigned,
        };
      });

      const totalArtefacts = levelStats.reduce((s, l) => s + l.artefactsCreated, 0);
      const totalPoints = levelStats.reduce((s, l) => s + l.pointsEarned, 0);
      const totalUsage = levelStats.reduce((s, l) => s + l.timesUsed, 0);

      setData({ currentLevel, totalArtefacts, totalPoints, totalUsage, levelStats });
      setLoading(false);
    })();
  }, [user, userProfile, isTourMode, dataVersion]);

  return { data, loading };
}
