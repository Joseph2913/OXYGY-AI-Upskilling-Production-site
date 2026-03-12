import { useState, useEffect, useCallback, useRef } from 'react';
import { LEVEL_TOPICS } from '../data/levelTopics';

/*
 * SQL MIGRATION — Run in Supabase SQL editor:
 *
 * alter table progress add constraint progress_unique
 *   unique (user_id, level, topic_id);
 */

export interface TopicProgress {
  topicId: number;
  phase: number; // 1–4 (E-Learn, Read, Watch, Practise)
  slide: number;
  completedAt: Date | null;
}

export interface LevelData {
  topicProgress: TopicProgress[];
  activeTopicId: number;
}

export interface UseLevelDataReturn {
  levelData: LevelData | null;
  loading: boolean;
  advanceSlide: (topicId: number, newSlide: number) => void;
  completePhase: (topicId: number) => void;
  completeTopic: (topicId: number) => void;
}

export const TOTAL_PHASES = 4;
export const PHASE_LABELS = ['E-Learn', 'Read', 'Watch', 'Practise'];
export const PHASE_ICONS = ['📖', '📄', '🎬', '🛠️'];

/**
 * DEV MODE: Returns mock level progress data.
 * TODO: Replace with real Supabase queries when auth is wired up.
 */
export function useLevelData(currentLevel: number): UseLevelDataReturn {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      const topics = LEVEL_TOPICS[currentLevel] || [];

      // Mock: active level has the single topic in progress at phase 1 slide 1
      const topicProgress: TopicProgress[] = topics.map((topic) => {
        return {
          topicId: topic.id,
          phase: 1,
          slide: 1,
          completedAt: null,
        };
      });

      const activeTopicId =
        topicProgress.find((tp) => !tp.completedAt)?.topicId ?? topics[topics.length - 1]?.id ?? 1;

      setLevelData({ topicProgress, activeTopicId });
      setLoading(false);

      // TODO: Insert session record in Supabase
    }, 300);

    return () => clearTimeout(timer);
  }, [currentLevel]);

  const advanceSlide = useCallback((topicId: number, newSlide: number) => {
    setLevelData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map((tp) =>
          tp.topicId === topicId ? { ...tp, slide: newSlide } : tp,
        ),
      };
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // TODO: Supabase write
    }, 300);
  }, []);

  const completePhase = useCallback((topicId: number) => {
    setLevelData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map((tp) =>
          tp.topicId === topicId
            ? { ...tp, phase: Math.min(tp.phase + 1, TOTAL_PHASES), slide: 1 }
            : tp,
        ),
      };
    });
    // TODO: Supabase write
  }, []);

  const completeTopic = useCallback((topicId: number) => {
    setLevelData((prev) => {
      if (!prev) return prev;
      const updated = prev.topicProgress.map((tp) =>
        tp.topicId === topicId ? { ...tp, completedAt: new Date() } : tp,
      );
      const nextActive = updated.find((tp) => !tp.completedAt)?.topicId ?? prev.activeTopicId;
      return {
        ...prev,
        topicProgress: updated,
        activeTopicId: nextActive,
      };
    });
    // TODO: Supabase write
  }, []);

  return { levelData, loading, advanceSlide, completePhase, completeTopic };
}
