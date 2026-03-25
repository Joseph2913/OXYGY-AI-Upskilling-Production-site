import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTourMode } from '../context/TourModeContext';
import { LEVEL_TOPICS } from '../data/levelTopics';
import {
  getTopicProgress,
  updateSlidePosition as dbUpdateSlide,
  completePhaseDb,
  completeTopicDb,
  completeToolkitPhase,
  logActivity,
} from '../lib/database';

export interface TopicProgress {
  topicId: number;
  phase: number;           // 1 = E-Learning, 2 = Toolkit, 3 = Project
  slide: number;
  completedAt: Date | null;
  phaseCompletions: [boolean, boolean, boolean]; // [elearn, toolkit, project]
  visitedSlides: Set<number>;
  elearnCompletedAt: Date | null;    // needed by phase gate logic
  toolkitCompletedAt: Date | null;   // read from read_completed_at
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
  markToolkitComplete: (topicId: number) => void;
}

export const TOTAL_PHASES = 3;
export const PHASE_LABELS = ['E-Learning', 'Toolkit', 'Project'];
export const PHASE_ICONS  = ['▶', '⚙', '◈'];

// Returns true if the user can access phase 2 (Toolkit) for a given topic
export function isToolkitUnlocked(tp: TopicProgress): boolean {
  return !!tp.elearnCompletedAt || tp.phaseCompletions[0];
}

// Returns true if the user can access phase 3 (Project) for a given topic
export function isProjectUnlocked(tp: TopicProgress): boolean {
  return !!tp.toolkitCompletedAt || tp.phaseCompletions[1];
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
        phaseCompletions: [false, false, false],
        visitedSlides: new Set<number>(),
        elearnCompletedAt: null,
        toolkitCompletedAt: null,
      }));
      setLevelData({ topicProgress, activeTopicId: topics[0]?.id ?? 1 });
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const rows = await getTopicProgress(user.id, currentLevel);
      const rowMap = new Map(rows.map(r => [r.topic_id, r]));

      const topicProgress: TopicProgress[] = topics.map(topic => {
        const row = rowMap.get(topic.id);
        const visited = new Set(row?.visited_slides || []);
        visitedSlidesRef.current[topic.id] = visited;

        // Backward compatibility: if practise_completed_at is set but read_completed_at
        // (toolkit) is null, treat toolkit as complete using the practise timestamp.
        // This prevents existing users from being locked out of phases they've passed.
        const toolkitCompletedAt =
          row?.read_completed_at
            ? new Date(row.read_completed_at)
            : row?.practise_completed_at   // migration fallback for pre-PRD users
              ? new Date(row.practise_completed_at)
              : null;

        return {
          topicId: topic.id,
          phase: row?.current_phase ?? 1,
          slide: Math.max(1, row?.current_slide ?? 1),
          completedAt: row?.completed_at ? new Date(row.completed_at) : null,
          phaseCompletions: [
            !!row?.elearn_completed_at,
            !!row?.read_completed_at || !!row?.practise_completed_at,  // toolkit (with fallback)
            !!row?.practise_completed_at,   // project
          ] as [boolean, boolean, boolean],
          visitedSlides: visited,
          elearnCompletedAt: row?.elearn_completed_at ? new Date(row.elearn_completed_at) : null,
          toolkitCompletedAt,
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
          const newPhase = Math.max(tp.phase, 2); // at least advance past e-learning
          const newCompletions = [...tp.phaseCompletions] as [boolean, boolean, boolean];
          newCompletions[0] = true; // e-learning is always index 0
          return {
            ...tp,
            phase: newPhase,
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

  // ── Mark toolkit complete (local state — DB write is done by tool page) ──
  const markToolkitComplete = useCallback((topicId: number) => {
    if (!user) return;

    setLevelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        topicProgress: prev.topicProgress.map(tp => {
          if (tp.topicId !== topicId) return tp;
          return {
            ...tp,
            phase: 3,
            toolkitCompletedAt: new Date(),
            phaseCompletions: [tp.phaseCompletions[0], true, tp.phaseCompletions[2]],
          };
        }),
      };
    });

    completeToolkitPhase(user.id, currentLevel, topicId);
    logActivity(user.id, 'phase_completed', currentLevel, topicId, { phase: 2 });
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

  return { levelData, loading, advanceSlide, completePhase, completeTopic, markToolkitComplete };
}
