import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { useTourMode } from '../context/TourModeContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
  getArtefactBreakdown,
  getLevelProgress,
  getOrgLeaderboard,
  updateStreak,
  getActiveDaysThisWeek,
  getAllProjectSubmissions,
  getLatestLearningPlan,
} from '../lib/database';
import type { ProjectSubmission, ArtefactBreakdown } from '../lib/database';
import type { LevelDepth } from '../types';
import { LEVEL_TOPICS } from '../data/levelTopics';
import { ALL_TOOLS } from '../data/toolkitData';

export interface LeaderboardMember {
  name: string;
  initials: string;
  avatarColor: string;
  level: number;
  score: number;
  completionPct: number;
  streakDays: number;
  useCasesIdentified: number;
  assessmentAvg: number;
  isCurrentUser: boolean;
  artefactCount: number;
  activeDays30: number;
}

export interface LevelProgress {
  level: number;
  phasesCompleted: boolean[];  // [elearn, practice]
  artefactCount: number;
}

export interface ToolUsage {
  toolId: string;
  artefactsCreated: number;
  lastUsedAt: Date | null;
}

export interface DashboardData {
  currentLevel: number;
  completedTopics: number;
  totalTopics: number;
  activeTopicIndex: number;
  currentSlide: number;
  totalSlides: number;
  currentPhase: number;

  overallCompletedTopics: number;
  overallTotalTopics: number;
  levelsCompleted: number;

  // Phase-level granularity: 2 phases per level × 5 levels = 10 total
  overallCompletedPhases: number;
  overallTotalPhases: number;
  // Per-level phase completion: level → { elearn, practice }
  levelPhaseCompletion: Record<number, { elearn: boolean; toolkit: boolean; project: boolean }>;

  levelProgress: Record<number, LevelProgress>;
  toolUsage: Record<string, ToolUsage>;

  projectSubmissions: Record<number, ProjectSubmission>;
  levelDepths: Record<string, LevelDepth>;

  streakDays: number;
  activeDaysThisWeek: boolean[];

  leaderboard: LeaderboardMember[];
  activeColleaguesCount: number;
  sameLevelColleaguesCount: number;

  lastActivityAt: Date | null;
  unlockedToolIds: string[];
  assignedLevels: Set<number>;  // levels in the user's learning plan
  completedLevelSet: Set<number>; // levels where all topics have completed_at
  artefactBreakdown: ArtefactBreakdown;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

export function useDashboardData(): { data: DashboardData | null; loading: boolean } {
  const { user } = useAuth();
  const { userProfile, dataVersion } = useAppContext();
  const { orgId } = useOrg();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isTourMode = useTourMode();

  useEffect(() => {
    if (isTourMode) {
      import('../data/tourDemoData').then(m => {
        setData(m.DEMO_DASHBOARD_DATA);
        setLoading(false);
      });
      return;
    }

    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
      setLoading(true);

      // Parallel fetch all data sources
      const [topicProgressRows, artefactCounts, levelProgressRows, activeDaysThisWeek, projectSubRows, learningPlanResult, artefactBreakdown] = await Promise.all([
        getAllTopicProgress(user.id),
        getArtefactCountsByLevel(user.id),
        getLevelProgress(user.id),
        getActiveDaysThisWeek(user.id),
        getAllProjectSubmissions(user.id),
        getLatestLearningPlan(user.id),
        getArtefactBreakdown(user.id),
      ]);

      // Fetch leaderboard if user has an org
      const scoredMembers = orgId
        ? await getOrgLeaderboard(orgId, user.id)
        : [];

      // Update streak from real activity data
      const streak = await updateStreak(user.id);

      // ── Build project submission map early (needed for level completion fallback) ──
      const projectSubMap = new Map<number, typeof projectSubRows[0]>();
      for (const sub of projectSubRows) {
        projectSubMap.set(sub.level, sub);
      }

      // ── Derive per-level progress ──
      const levelProgress: Record<number, LevelProgress> = {};
      let overallCompletedTopics = 0;
      let overallTotalTopics = 0;
      let levelsCompleted = 0;
      const completedLevelSet = new Set<number>();
      let overallCompletedPhases = 0;
      const overallTotalPhases = 5 * 2; // 5 levels × 2 phases (e-learn, practice)
      const levelPhaseCompletion: Record<number, { elearn: boolean; toolkit: boolean; project: boolean }> = {};

      for (let lvl = 1; lvl <= 5; lvl++) {
        const topics = LEVEL_TOPICS[lvl] || [];
        const totalTopics = topics.length;
        overallTotalTopics += totalTopics;

        const progressForLevel = topicProgressRows.filter(r => r.level === lvl);
        const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));

        const phasesCompleted: boolean[] = [false, false]; // [elearn, practice]
        let completedTopics = 0;

        const levelProjectPassed = projectSubMap.get(lvl)?.reviewPassed === true;

        // Practice completion = toolkit tool opened/used for this level (tool_used_at)
        const levelLpRow = levelProgressRows.find(r => r.level === lvl);
        const levelToolkitDone = !!levelLpRow?.tool_used_at;

        topics.forEach(topic => {
          const row = progressMap.get(topic.id);
          // A topic is complete when both phases are done:
          //   1. E-Learning: elearn_completed_at is set
          //   2. Practice: toolkit tool opened (tool_used_at set in level_progress)
          // NEVER use completed_at alone — it may be set prematurely in the DB.
          const eLearnDone = !!row?.elearn_completed_at;
          const isTopicComplete = eLearnDone && levelToolkitDone && levelProjectPassed;
          if (isTopicComplete) completedTopics++;
          if (row?.elearn_completed_at) phasesCompleted[0] = true;  // E-Learning
          if (levelToolkitDone) phasesCompleted[1] = true;          // Practice (tool_used_at)
        });

        overallCompletedTopics += completedTopics;
        const isLevelComplete = completedTopics === topics.length && topics.length > 0;
        if (isLevelComplete) { levelsCompleted++; completedLevelSet.add(lvl); }

        levelProgress[lvl] = {
          level: lvl,
          phasesCompleted,
          artefactCount: artefactCounts[lvl] || 0,
        };

        // Phase-level granularity: count each of 2 phases per level independently
        const lvlElearnDone = phasesCompleted[0]; // any topic in this level has elearn done
        const lvlToolkitDone = levelToolkitDone;
        const lvlProjectDone = !!levelProjectPassed; // kept for display purposes only
        levelPhaseCompletion[lvl] = { elearn: lvlElearnDone, toolkit: lvlToolkitDone, project: lvlProjectDone };
        if (lvlElearnDone) overallCompletedPhases++;
        if (lvlToolkitDone) overallCompletedPhases++;
      }

      // ── Derive current level from progress (auto-advance) ──
      // Uses completedLevelSet (broad completion check: completed_at OR all phases done
      // OR elearn+toolkit done with project passed) to find the first incomplete level.
      // IMPORTANT: This MUST use the same completion logic as the per-level loop above.
      // Never use only `completed_at` here — topics can be complete via phase completion
      // without having `completed_at` set in the database.
      let derivedLevel = 5;
      for (let lvl = 1; lvl <= 5; lvl++) {
        if (!completedLevelSet.has(lvl)) {
          derivedLevel = lvl;
          break;
        }
      }
      const currentLevel = derivedLevel;

      // Sync DB if profile is behind
      if (currentLevel !== userProfile.currentLevel) {
        import('../lib/database').then(db => db.updateCurrentLevel(user.id, currentLevel));
      }

      const currentLevelTopics = LEVEL_TOPICS[currentLevel] || [];
      const currentLevelProgress = topicProgressRows.filter(r => r.level === currentLevel);
      const currentLevelLpRow = levelProgressRows.find(r => r.level === currentLevel);
      const currentLevelToolkitDone = !!currentLevelLpRow?.tool_used_at;
      const currentLevelProjectPassed = projectSubMap.get(currentLevel)?.reviewPassed === true;

      // Same 3-signal check as the per-level loop above.
      // NEVER use completed_at — it may be stale/premature.
      const isTopicRowComplete = (r: typeof topicProgressRows[0]) =>
        !!r.elearn_completed_at && currentLevelToolkitDone && currentLevelProjectPassed;

      const completedTopicsInCurrentLevel = currentLevelProgress.filter(isTopicRowComplete).length;
      const activeTopicRow = currentLevelProgress.find(r => !isTopicRowComplete(r));

      // ── Derive tool usage from level_progress ──
      const toolUsage: Record<string, ToolUsage> = {};
      const toolLevelMap: Record<string, number> = {
        'prompt-playground': 1,
        'agent-builder': 2,
        'workflow-canvas': 3,
        'dashboard-designer': 4,
        'ai-app-evaluator': 5,
      };

      Object.entries(toolLevelMap).forEach(([toolId, lvl]) => {
        const row = levelProgressRows.find(r => r.level === lvl);
        toolUsage[toolId] = {
          toolId,
          artefactsCreated: artefactCounts[lvl] || 0,
          lastUsedAt: row?.tool_used_at ? new Date(row.tool_used_at) : null,
        };
      });

      // ── All tools unlocked by default ──
      const unlockedToolIds: string[] = ALL_TOOLS.map(tool => tool.id);

      // ── Map leaderboard ──
      let leaderboard: LeaderboardMember[];
      let activeColleaguesCount = 0;
      let sameLevelColleaguesCount = 0;

      if (scoredMembers.length > 0) {
        leaderboard = scoredMembers.map(m => ({
          name: m.fullName,
          initials: m.initials,
          avatarColor: m.avatarColor,
          level: m.level,
          score: m.score,
          completionPct: m.completionPct,
          streakDays: m.streakDays,
          useCasesIdentified: 0,
          assessmentAvg: 0,
          isCurrentUser: m.isCurrentUser,
          artefactCount: m.artefactCount,
          activeDays30: m.activeDays30,
        }));
        activeColleaguesCount = scoredMembers.length;
        sameLevelColleaguesCount = scoredMembers.filter(m => m.level === currentLevel).length;
      } else {
        // No org — show only current user
        leaderboard = [{
          name: userProfile.fullName || 'You',
          initials: getInitials(userProfile.fullName),
          avatarColor: '#38B2AC',
          level: currentLevel,
          score: overallCompletedTopics * 100,
          completionPct: overallTotalTopics > 0
            ? Math.round((overallCompletedTopics / overallTotalTopics) * 100) : 0,
          streakDays: streak,
          useCasesIdentified: 0,
          assessmentAvg: 0,
          isCurrentUser: true,
          artefactCount: 0,
          activeDays30: 0,
        }];
      }

      // ── Build project submissions map (level → submission) ──
      const projectSubmissions: Record<number, ProjectSubmission> = {};
      for (const sub of projectSubRows) {
        projectSubmissions[sub.level] = sub;
      }

      // ── Build level depths from learning plan ──
      const levelDepths: Record<string, LevelDepth> = learningPlanResult?.level_depths || {};

      // Determine which levels are assigned from learning plan.
      // Always enforce a contiguous sequence from L1 — fill any gaps up to the highest assigned level.
      const assignedLevelKeys = learningPlanResult?.plan?.levels
        ? (() => {
            const keys = Object.keys(learningPlanResult.plan.levels);
            const highest = Math.max(...keys.map(k => parseInt(k.replace('L', ''), 10)));
            return Array.from({ length: highest }, (_, i) => `L${i + 1}`);
          })()
        : ['L1', 'L2', 'L3', 'L4', 'L5'];
      // Bonus unlock: L4 and L5 unlock automatically once L1, L2, and L3 are all complete
      const bonusUnlocked = [1, 2, 3].every(l => completedLevelSet.has(l));
      const assignedLevels = new Set(
        assignedLevelKeys.map(k => parseInt(k.replace('L', ''), 10))
          .concat(bonusUnlocked ? [4, 5] : [])
      );

      setData({
        currentLevel,
        completedTopics: completedTopicsInCurrentLevel,
        totalTopics: currentLevelTopics.length,
        activeTopicIndex: activeTopicRow
          ? currentLevelTopics.findIndex(t => t.id === activeTopicRow.topic_id)
          : 0,
        currentSlide: activeTopicRow?.current_slide ?? 0,
        totalSlides: 0, // derived per-topic in the component
        currentPhase: activeTopicRow?.current_phase ?? 1,

        overallCompletedTopics,
        overallTotalTopics,
        levelsCompleted,

        overallCompletedPhases,
        overallTotalPhases,
        levelPhaseCompletion,

        levelProgress,
        toolUsage,

        projectSubmissions,
        levelDepths,

        streakDays: streak,
        activeDaysThisWeek,

        leaderboard,
        activeColleaguesCount,
        sameLevelColleaguesCount,

        lastActivityAt: new Date(),
        unlockedToolIds,
        assignedLevels,
        completedLevelSet,
        artefactBreakdown,
      });
      setLoading(false);
      } catch (err) {
        console.error('useDashboardData error:', err);
        const currentLevel = userProfile.currentLevel;
        const currentLevelTopics = LEVEL_TOPICS[currentLevel] || [];
        setData({
          currentLevel,
          completedTopics: 0,
          totalTopics: currentLevelTopics.length,
          activeTopicIndex: 0,
          currentSlide: 0,
          totalSlides: 0,
          currentPhase: 1,
          overallCompletedTopics: 0,
          overallTotalTopics: 0,
          levelsCompleted: 0,
          overallCompletedPhases: 0,
          overallTotalPhases: 10,
          levelPhaseCompletion: {},
          levelProgress: {},
          toolUsage: {},
          projectSubmissions: {},
          levelDepths: {},
          streakDays: 0,
          activeDaysThisWeek: Array(7).fill(false) as boolean[],
          leaderboard: [{
            name: userProfile.fullName || 'You',
            initials: getInitials(userProfile.fullName),
            avatarColor: '#38B2AC',
            level: currentLevel,
            score: 0,
            completionPct: 0,
            streakDays: 0,
            useCasesIdentified: 0,
            assessmentAvg: 0,
            isCurrentUser: true,
            artefactCount: 0,
            activeDays30: 0,
          }],
          activeColleaguesCount: 0,
          sameLevelColleaguesCount: 0,
          lastActivityAt: new Date(),
          unlockedToolIds: [],
          assignedLevels: new Set([1, 2, 3, 4, 5]),
          completedLevelSet: new Set<number>(),
          artefactBreakdown: { coach: {}, toolkit: {}, project: {} },
        });
        setLoading(false);
      }
    })();
  }, [user, userProfile, orgId, isTourMode, dataVersion]);

  return { data, loading };
}
