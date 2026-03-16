import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LEVEL_TOPICS } from '../data/levelTopics';
import {
  getTopicProgress,
  updateSlidePosition as dbUpdateSlide,
  completePhaseDb,
  completeTopicDb,
  logActivity,
} from '../lib/database';

export interface TopicProgress {
  topicId: number;
  phase: number; // 1–4 (E-Learn, Read, Watch, Practise)
  slide: number;
  completedAt: Date | null;
  phaseCompletions: [boolean, boolean, boolean, boolean]; // [elearn, read, watch, practise]
  visitedSlides: Set<number>;
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

export function useLevelData(currentLevel: number): UseLevelDataReturn {
  const { user } = useAuth();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitedSlidesRef = useRef<Record<number, Set<number>>>({});

  // ── Fetch on mount / level change ──
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const topics = LEVEL_TOPICS[currentLevel] || [];

    (async () => {
      const rows = await getTopicProgress(user.id, currentLevel);
      const rowMap = new Map(rows.map(r => [r.topic_id, r]));

      const topicProgress: TopicProgress[] = topics.map(topic => {
        const row = rowMap.get(topic.id);
        const visited = new Set(row?.visited_slides || []);
        visitedSlidesRef.current[topic.id] = visited;

        return {
          topicId: topic.id,
          phase: row?.current_phase ?? 1,
          slide: row?.current_slide ?? 0,
          completedAt: row?.completed_at ? new Date(row.completed_at) : null,
          phaseCompletions: [
            !!row?.elearn_completed_at,
            !!row?.read_completed_at,
            !!row?.watch_completed_at,
            !!row?.practise_completed_at,
          ],
          visitedSlides: visited,
        };
      });

      // Active topic = first incomplete, or last topic
      const activeTopicId =
        topicProgress.find(tp => !tp.completedAt)?.topicId
        ?? topics[topics.length - 1]?.id
        ?? 1;

      setLevelData({ topicProgress, activeTopicId });
      setLoading(false);

      // Log session start
      logActivity(user.id, 'session_started', currentLevel);
    })();
  }, [user, currentLevel]);

  // ── Advance slide (debounced write) ──
  const advanceSlide = useCallback((topicId: number, newSlide: number) => {
    if (!user) return;

    // Update local state immediately
    const visited = visitedSlidesRef.current[topicId] || new Set<number>();
    visited.add(newSlide);
    visitedSlidesRef.current[topicId] = visited;

    setLevelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map(tp =>
          tp.topicId === topicId
            ? { ...tp, slide: newSlide, visitedSlides: new Set(visited) }
            : tp
        ),
      };
    });

    // Debounced Supabase write
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dbUpdateSlide(
        user.id, currentLevel, topicId,
        newSlide, Array.from(visited),
      );
    }, 500);
  }, [user, currentLevel]);

  // ── Complete phase ──
  const completePhase = useCallback((topicId: number) => {
    if (!user) return;

    // Get the current phase number before advancing
    const currentPhase = levelData?.topicProgress.find(tp => tp.topicId === topicId)?.phase ?? 1;

    setLevelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map(tp => {
          if (tp.topicId !== topicId) return tp;
          const newPhase = Math.min(tp.phase + 1, TOTAL_PHASES);
          const newCompletions = [...tp.phaseCompletions] as [boolean, boolean, boolean, boolean];
          newCompletions[tp.phase - 1] = true;
          return {
            ...tp,
            phase: newPhase,
            slide: 0,
            phaseCompletions: newCompletions,
          };
        }),
      };
    });

    completePhaseDb(user.id, currentLevel, topicId, currentPhase);
    logActivity(user.id, 'phase_completed', currentLevel, topicId, { phase: currentPhase });
  }, [user, currentLevel, levelData]);

  // ── Complete topic ──
  const completeTopic = useCallback((topicId: number) => {
    if (!user) return;

    setLevelData(prev => {
      if (!prev) return prev;
      const updated = prev.topicProgress.map(tp =>
        tp.topicId === topicId ? { ...tp, completedAt: new Date() } : tp
      );
      const nextActive = updated.find(tp => !tp.completedAt)?.topicId ?? prev.activeTopicId;
      return { ...prev, topicProgress: updated, activeTopicId: nextActive };
    });

    completeTopicDb(user.id, currentLevel, topicId);
    logActivity(user.id, 'topic_completed', currentLevel, topicId);

    // Check if all topics in this level are now complete
    const allComplete = levelData?.topicProgress.every(tp =>
      tp.topicId === topicId ? true : !!tp.completedAt
    );
    if (allComplete) {
      logActivity(user.id, 'level_completed', currentLevel);
    }
  }, [user, currentLevel, levelData]);

  return { levelData, loading, advanceSlide, completePhase, completeTopic };
}
