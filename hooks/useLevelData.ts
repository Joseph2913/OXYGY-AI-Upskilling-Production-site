import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTourMode } from '../context/TourModeContext';
import { LEVEL_TOPICS } from '../data/levelTopics';
import {
  getTopicProgress,
  getLevelProgress,
  updateSlidePosition as dbUpdateSlide,
  completePhaseDb,
  completeTopicDb,
  logActivity,
} from '../lib/database';

export interface TopicProgress {
  topicId: number;
  phase: number;           // 1 = E-Learning, 2 = Practice (completed by using toolkit)
  slide: number;
  completedAt: Date | null;
  phaseCompletions: [boolean, boolean]; // [elearn, practice]
  visitedSlides: Set<number>;
  elearnCompletedAt: Date | null;
  practiceCompletedAt: Date | null;  // derived from level_progress.tool_used_at
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

export const TOTAL_PHASES = 2;
export const PHASE_LABELS = ['E-Learning', 'Practice'];
export const PHASE_ICONS  = ['▶', '◈'];

// Practice (phase 2) unlocked once e-learning is done
export function isPracticeUnlocked(tp: TopicProgress): boolean {
  return tp.phaseCompletions[0];
}

export function useLevelData(currentLevel: number): UseLevelDataReturn {
  const { user } = useAuth();
  const { invalidateProgress } = useAppContext();
  const isTourMode = useTourMode();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitedSlidesRef = useRef<Record<number, Set<number>>>({});

  // ── Fetch on mount / level change ──
  useEffect(() => {
    if (isTourMode) {
      import('../data/tourDemoData').then(m => {
        setLevelData(m.DEMO_LEVEL_DATA);
        setLoading(false);
      });
      return;
    }

    const topics = LEVEL_TOPICS[currentLevel] || [];

    // No user — build fallback data so the page renders without auth
    if (!user) {
      const topicProgress: TopicProgress[] = topics.map(topic => ({
        topicId: topic.id,
        phase: 1,
        slide: 1,
        completedAt: null,
        phaseCompletions: [false, false],
        visitedSlides: new Set<number>(),
        elearnCompletedAt: null,
        practiceCompletedAt: null,
      }));
      setLevelData({ topicProgress, activeTopicId: topics[0]?.id ?? 1 });
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const [rows, levelProgressRows] = await Promise.all([
        getTopicProgress(user.id, currentLevel),
        getLevelProgress(user.id),
      ]);
      const rowMap = new Map(rows.map(r => [r.topic_id, r]));

      // Practice done = toolkit tool opened/used for this level (tool_used_at in level_progress)
      // Also accept legacy read_completed_at on any topic row as fallback for existing users
      const levelRow = levelProgressRows.find(r => r.level === currentLevel);
      const practiceDone = !!levelRow?.tool_used_at
        || rows.some(r => !!r.read_completed_at);
      const practiceCompletedAt = levelRow?.tool_used_at
        ? new Date(levelRow.tool_used_at)
        : null;

      const topicProgress: TopicProgress[] = topics.map(topic => {
        const row = rowMap.get(topic.id);
        const visited = new Set(row?.visited_slides || []);
        visitedSlidesRef.current[topic.id] = visited;

        const elearnDone = !!row?.elearn_completed_at;
        const phase = Math.min(
          elearnDone ? 2 : (row?.current_phase ?? 1),
          2,
        );

        return {
          topicId: topic.id,
          phase,
          slide: Math.max(1, row?.current_slide ?? 1),
          completedAt: row?.completed_at ? new Date(row.completed_at) : null,
          phaseCompletions: [elearnDone, practiceDone] as [boolean, boolean],
          visitedSlides: visited,
          elearnCompletedAt: elearnDone ? new Date(row!.elearn_completed_at!) : null,
          practiceCompletedAt,
        };
      });

      // Active topic = first incomplete topic, or last topic
      const activeTopicId =
        topicProgress.find(tp => !tp.completedAt)?.topicId
        ?? topics[topics.length - 1]?.id
        ?? 1;

      setLevelData({ topicProgress, activeTopicId });
      setLoading(false);

      // Log session start
      logActivity(user.id, 'session_started', currentLevel);
    })();
  }, [user, currentLevel, isTourMode]);

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

  // ── Complete E-Learning phase ──
  // This is ONLY called when e-learning finishes, so it always writes phase 1
  // (elearn_completed_at). The local phase number may already be >1 if the user
  // saved a toolkit artefact before finishing e-learning — we must ignore that
  // and always mark e-learning as done.
  const completePhase = useCallback(async (topicId: number) => {
    if (!user) return;

    setLevelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map(tp => {
          if (tp.topicId !== topicId) return tp;
          const newCompletions: [boolean, boolean] = [true, tp.phaseCompletions[1]];
          return {
            ...tp,
            phase: 2,
            slide: 0,
            phaseCompletions: newCompletions,
            elearnCompletedAt: new Date(),
          };
        }),
      };
    });

    // Always write phase 1 (elearn_completed_at) regardless of local phase state
    await completePhaseDb(user.id, currentLevel, topicId, 1);
    logActivity(user.id, 'phase_completed', currentLevel, topicId, { phase: 1 });
    invalidateProgress();
  }, [user, currentLevel, invalidateProgress]);

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
    invalidateProgress();
  }, [user, currentLevel, levelData, invalidateProgress]);

  return { levelData, loading, advanceSlide, completePhase, completeTopic };
}
