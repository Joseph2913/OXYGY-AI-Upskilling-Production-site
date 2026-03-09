import { useState, useEffect } from 'react';

export interface LeaderboardMember {
  name: string;
  initials: string;
  avatarColor: string;
  level: number;
  score: number;           // Aggregate score (completion + use cases + assessments + streak + rate)
  completionPct: number;   // 0–100
  streakDays: number;
  useCasesIdentified: number;
  assessmentAvg: number;   // 0–100
  isCurrentUser: boolean;
}

export interface DashboardData {
  currentLevel: number;
  completedTopics: number;
  totalTopics: number;
  activeTopicIndex: number;
  currentSlide: number;
  totalSlides: number;
  currentPhase: number;

  // Overall journey progress (across all levels)
  overallCompletedTopics: number;
  overallTotalTopics: number;
  levelsCompleted: number;

  streakDays: number;
  activeDaysThisWeek: boolean[];

  // Leaderboard
  leaderboard: LeaderboardMember[];
  activeColleaguesCount: number;
  sameLevelColleaguesCount: number;

  lastActivityAt: Date | null;

  unlockedToolIds: string[];
}

/**
 * DEV MODE: Returns mock dashboard data.
 * TODO: Replace with real Supabase queries when auth is wired up.
 */
export function useDashboardData(): { data: DashboardData | null; loading: boolean } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monBasedToday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const activeDays = Array(7).fill(false).map((_, i) => i < monBasedToday);

      const leaderboard: LeaderboardMember[] = [
        {
          name: 'Joseph Thomas', initials: 'JT', avatarColor: '#A8F0E0',
          level: 5, score: 872, completionPct: 82, streakDays: 5,
          useCasesIdentified: 14, assessmentAvg: 91, isCurrentUser: true,
        },
        {
          name: 'Amira Khalil', initials: 'AK', avatarColor: '#C3D0F5',
          level: 5, score: 910, completionPct: 88, streakDays: 7,
          useCasesIdentified: 16, assessmentAvg: 94, isCurrentUser: false,
        },
        {
          name: 'Sam Burton', initials: 'SB', avatarColor: '#F5B8A0',
          level: 4, score: 745, completionPct: 68, streakDays: 3,
          useCasesIdentified: 11, assessmentAvg: 85, isCurrentUser: false,
        },
        {
          name: 'Priya Nair', initials: 'PN', avatarColor: '#F7E8A4',
          level: 4, score: 720, completionPct: 65, streakDays: 4,
          useCasesIdentified: 10, assessmentAvg: 82, isCurrentUser: false,
        },
        {
          name: 'Marcus Chen', initials: 'MC', avatarColor: '#38B2AC',
          level: 3, score: 580, completionPct: 52, streakDays: 2,
          useCasesIdentified: 8, assessmentAvg: 78, isCurrentUser: false,
        },
        {
          name: 'Rachel James', initials: 'RJ', avatarColor: '#E9D5FF',
          level: 3, score: 540, completionPct: 48, streakDays: 1,
          useCasesIdentified: 7, assessmentAvg: 75, isCurrentUser: false,
        },
        {
          name: 'Tom Okafor', initials: 'TO', avatarColor: '#FED7AA',
          level: 2, score: 390, completionPct: 35, streakDays: 6,
          useCasesIdentified: 5, assessmentAvg: 70, isCurrentUser: false,
        },
        {
          name: 'Lena Fischer', initials: 'LF', avatarColor: '#FECACA',
          level: 2, score: 350, completionPct: 30, streakDays: 0,
          useCasesIdentified: 4, assessmentAvg: 68, isCurrentUser: false,
        },
        {
          name: 'David Park', initials: 'DP', avatarColor: '#D1FAE5',
          level: 1, score: 180, completionPct: 18, streakDays: 1,
          useCasesIdentified: 2, assessmentAvg: 60, isCurrentUser: false,
        },
        {
          name: 'Nina Alvarez', initials: 'NA', avatarColor: '#E0E7FF',
          level: 1, score: 120, completionPct: 12, streakDays: 0,
          useCasesIdentified: 1, assessmentAvg: 55, isCurrentUser: false,
        },
      ];

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);

      setData({
        currentLevel: 5,
        completedTopics: 0,
        totalTopics: 1,
        activeTopicIndex: 0,
        currentSlide: 7,
        totalSlides: 13,
        currentPhase: 1,

        overallCompletedTopics: 4, // levels 1-4 done (1 topic each)
        overallTotalTopics: 5,     // 5 levels, 1 topic each
        levelsCompleted: 4,

        streakDays: 5,
        activeDaysThisWeek: activeDays,

        leaderboard,
        activeColleaguesCount: 12,
        sameLevelColleaguesCount: 4,

        lastActivityAt: new Date(now.getTime() - 2 * 3600000),

        unlockedToolIds: [
          'prompt-playground', 'prompt-library',
          'agent-builder', 'template-library',
          'workflow-canvas', 'integration-sandbox',
          'dashboard-designer', 'journey-mapper',
          'ai-app-evaluator',
        ],
      });
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
}