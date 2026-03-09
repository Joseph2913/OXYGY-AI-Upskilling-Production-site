import { useState, useEffect } from 'react';
import { LEVEL_TOPICS } from '../data/levelTopics';
import { ALL_TOOLS } from '../data/toolkitData';

export interface LevelProgress {
  levelNumber: number;
  status: 'completed' | 'active' | 'not-started';
  completedTopics: number;
  totalTopics: number;
  completedAt: Date | null;
  artefactsCreated: number;
  toolsUnlocked: number;
  activeTopicIndex: number;
  currentSlide: number;
  currentPhase: number;
}

export interface JourneyData {
  levels: LevelProgress[];
  completedLevelsCount: number;
}

/**
 * DEV MODE: Returns mock journey data.
 * TODO: Replace with real Supabase queries when auth is wired up.
 */
export function useJourneyData(): { data: JourneyData | null; loading: boolean; error: boolean; retry: () => void } {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const timer = setTimeout(() => {
      // Mock data: All levels unlocked for dev. Levels 1-4 completed, Level 5 active.
      // TODO: Replace with real Supabase queries when auth is wired up.
      const completedDates = [
        new Date('2026-01-14'),
        new Date('2026-01-28'),
        new Date('2026-02-11'),
        new Date('2026-02-25'),
      ];
      const levels: LevelProgress[] = [1, 2, 3, 4, 5].map((levelNumber) => {
        const topics = LEVEL_TOPICS[levelNumber] || [];
        const toolsForLevel = ALL_TOOLS.filter(t => t.levelRequired === levelNumber).length;

        if (levelNumber <= 4) {
          return {
            levelNumber,
            status: 'completed' as const,
            completedTopics: topics.length,
            totalTopics: topics.length,
            completedAt: completedDates[levelNumber - 1],
            artefactsCreated: levelNumber + 2,
            toolsUnlocked: toolsForLevel,
            activeTopicIndex: 0,
            currentSlide: 0,
            currentPhase: 0,
          };
        }

        // Level 5 — active
        return {
          levelNumber,
          status: 'active' as const,
          completedTopics: 0,
          totalTopics: topics.length,
          completedAt: null,
          artefactsCreated: 1,
          toolsUnlocked: toolsForLevel,
          activeTopicIndex: 0,
          currentSlide: 7,
          currentPhase: 1,
        };
      });

      const completedLevelsCount = levels.filter(l => l.status === 'completed').length;

      setData({ levels, completedLevelsCount });
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [retryCount]);

  const retry = () => setRetryCount(c => c + 1);

  return { data, loading, error, retry };
}
