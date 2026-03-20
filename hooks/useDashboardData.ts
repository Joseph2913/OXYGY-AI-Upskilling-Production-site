import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
  getLevelProgress,
  getOrgLeaderboard,
  updateStreak,
  getActiveDaysThisWeek,
  getAllProjectSubmissions,
  getLatestLearningPlan,
} from '../lib/database';
import type { ProjectSubmission } from '../lib/database';
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
  insightCount: number;
  activeDays30: number;
}

export interface LevelProgress {
  level: number;
  phasesCompleted: boolean[];  // [elearn, read, watch, practise]
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
  const { userProfile } = useAppContext();
  const { orgId } = useOrg();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
      setLoading(true);

      // Parallel fetch all data sources
      const [topicProgressRows, artefactCounts, levelProgressRows, activeDaysThisWeek, projectSubRows, learningPlanResult] = await Promise.all([
        getAllTopicProgress(user.id),
        getArtefactCountsByLevel(user.id),
        getLevelProgress(user.id),
        getActiveDaysThisWeek(user.id),
        getAllProjectSubmissions(user.id),
        getLatestLearningPlan(user.id),
      ]);

      // Fetch leaderboard if user has an org
      const scoredMembers = orgId
        ? await getOrgLeaderboard(orgId, user.id)
        : [];

      // Update streak from real activity data
      const streak = await updateStreak(user.id);

      // ── Derive per-level progress ──
      const levelProgress: Record<number, LevelProgress> = {};
      let overallCompletedTopics = 0;
      let overallTotalTopics = 0;
      let levelsCompleted = 0;

      for (let lvl = 1; lvl <= 5; lvl++) {
        const topics = LEVEL_TOPICS[lvl] || [];
        const totalTopics = topics.length;
        overallTotalTopics += totalTopics;

        const progressForLevel = topicProgressRows.filter(r => r.level === lvl);
        const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));

        const phasesCompleted: boolean[] = [false, false, false, false];
        let completedTopics = 0;

        topics.forEach(topic => {
          const row = progressMap.get(topic.id);
          if (row?.completed_at) completedTopics++;
          if (row?.elearn_completed_at) phasesCompleted[0] = true;
          if (row?.read_completed_at) phasesCompleted[1] = true;
          if (row?.watch_completed_at) phasesCompleted[2] = true;
          if (row?.practise_completed_at) phasesCompleted[3] = true;
        });

        overallCompletedTopics += completedTopics;
        const isLevelComplete = completedTopics === totalTopics && totalTopics > 0;
        if (isLevelComplete) levelsCompleted++;

        levelProgress[lvl] = {
          level: lvl,
          phasesCompleted,
          artefactCount: artefactCounts[lvl] || 0,
        };
      }

      // ── Derive current level topic state ──
      const currentLevel = userProfile.currentLevel;
      const currentLevelTopics = LEVEL_TOPICS[currentLevel] || [];
      const currentLevelProgress = topicProgressRows.filter(r => r.level === currentLevel);

      const completedTopicsInCurrentLevel = currentLevelProgress.filter(r => r.completed_at).length;
      const activeTopicRow = currentLevelProgress.find(r => !r.completed_at);

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
          useCasesIdentified: m.insightCount,
          assessmentAvg: 0,
          isCurrentUser: m.isCurrentUser,
          artefactCount: m.artefactCount,
          insightCount: m.insightCount,
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
          insightCount: 0,
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
            insightCount: 0,
            activeDays30: 0,
          }],
          activeColleaguesCount: 0,
          sameLevelColleaguesCount: 0,
          lastActivityAt: new Date(),
          unlockedToolIds: [],
        });
        setLoading(false);
      }
    })();
  }, [user, userProfile, orgId]);

  return { data, loading };
}
