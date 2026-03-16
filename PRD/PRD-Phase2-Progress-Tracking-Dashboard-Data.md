# PRD: Phase 2 — Progress Tracking, AppContext & Dashboard Data

> **Status:** Ready for implementation
> **Author:** Oxygy Design Agent
> **Date:** 2026-03-16
> **Depends on:** Phase 1 (Auth, Onboarding, Artefacts)
> **Codebase ref:** `https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site.git`

---

## 1. Overview

### Purpose

Replace all mock data hooks with real Supabase queries. Build the progress tracking infrastructure that records user activity as they move through the learning journey — every slide viewed, every phase completed, every topic finished. Wire the dashboard, journey page, and level page to display real, personalised data.

### What this phase delivers

1. **Topic progress tracking** — new `topic_progress` table that records per-topic, per-phase completion with slide-level granularity
2. **Real AppContext** — fetches the authenticated user's profile from Supabase instead of returning hardcoded mock data
3. **Real dashboard data** — progress rings, streak counts, tool usage, level completion, and artefact counts all derived from live database queries
4. **Real journey data** — per-level completion status, topic counts, and artefact counts from the database
5. **Real level data** — slide position, phase progress, and topic completion persisted to Supabase and restored on return visits
6. **Derived level completion** — a level is "complete" when all topics within it have all four phases completed

### What this phase does NOT include

- Leaderboard with real cohort data (Phase 4 — requires org scoping)
- Streak tracking infrastructure (requires an `activity_log` table — scoped below but implementation deferred to Phase 4)
- Workshop code validation against real org (Phase 4)

---

## 2. New Database Schema

### 2.1 New Table: `topic_progress`

This is the core tracking table. One row per user per topic. Records which phase the user is on, which slide they're up to within that phase, and timestamps for each phase completion.

```sql
-- 11. TOPIC PROGRESS
create table if not exists topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 5),
  topic_id integer not null,

  -- Current position
  current_phase integer not null default 1 check (current_phase between 1 and 4),
  current_slide integer not null default 0,

  -- Phase completion timestamps (null = not yet completed)
  elearn_completed_at timestamptz,
  read_completed_at timestamptz,
  watch_completed_at timestamptz,
  practise_completed_at timestamptz,

  -- Topic-level completion
  completed_at timestamptz,

  -- Slide visit tracking (array of visited slide indices for the e-learning phase)
  visited_slides integer[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One row per user per topic
  constraint topic_progress_unique unique (user_id, level, topic_id)
);

alter table topic_progress enable row level security;

create policy "Users can read own topic progress"
  on topic_progress for select using (auth.uid() = user_id);
create policy "Users can insert own topic progress"
  on topic_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own topic progress"
  on topic_progress for update using (auth.uid() = user_id);

create index topic_progress_user_level
  on topic_progress(user_id, level);
```

### 2.2 New Table: `activity_log` (schema only — querying deferred to Phase 4)

This table records every meaningful user action. Used for streak calculation and engagement analytics. We create the table now so progress events can be logged from day one, but the streak/analytics queries are Phase 4 scope.

```sql
-- 12. ACTIVITY LOG
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in (
    'slide_viewed',
    'phase_completed',
    'topic_completed',
    'level_completed',
    'tool_used',
    'artefact_saved',
    'artefact_opened',
    'reflection_submitted',
    'quiz_answered',
    'session_started'
  )),
  level integer check (level between 1 and 5),
  topic_id integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

create policy "Users can read own activity"
  on activity_log for select using (auth.uid() = user_id);
create policy "Users can insert own activity"
  on activity_log for insert with check (auth.uid() = user_id);

create index activity_log_user_date
  on activity_log(user_id, created_at desc);
create index activity_log_user_action
  on activity_log(user_id, action);
```

### 2.3 Schema Modifications to `profiles`

These columns were added in Phase 1 (§3.3). Confirm they exist:

```sql
alter table profiles add column if not exists onboarding_completed boolean default false;
alter table profiles add column if not exists current_level integer default 1;
alter table profiles add column if not exists streak_days integer default 0;
```

### 2.4 Derived Completion Rules

These rules define how completion is determined. They are not stored — they are computed from the data at query time.

| Entity | Complete When |
|--------|-------------|
| **E-Learning phase** | `elearn_completed_at` is not null (set when user clicks "Finish E-Learning →") |
| **Read phase** | `read_completed_at` is not null (set when user clicks "Continue to Watch →" after all reflections) |
| **Watch phase** | `watch_completed_at` is not null (set when all knowledge checks are answered) |
| **Practise phase** | `practise_completed_at` is not null (set when user clicks "Complete Topic" after using the toolkit tool) |
| **Topic** | `completed_at` is not null (set when all 4 phases are complete) |
| **Level** | All topics within the level have `completed_at` set |
| **Overall journey** | All 5 levels are complete |

---

## 3. File Changes — Complete List

| File | Action | Summary |
|------|--------|---------|
| `supabase/schema.sql` | **Modify** | Add `topic_progress` and `activity_log` tables |
| `lib/database.ts` | **Modify** | Add topic progress CRUD, activity logging, dashboard query functions |
| `context/AppContext.tsx` | **Rewrite** | Fetch real profile from Supabase; provide `setCurrentLevel` that writes to DB |
| `hooks/useLevelData.ts` | **Rewrite** | Read/write topic progress from Supabase |
| `hooks/useDashboardData.ts` | **Rewrite** | Derive all dashboard metrics from real Supabase queries |
| `hooks/useJourneyData.ts` | **Rewrite** | Derive per-level progress from `topic_progress` table |
| `hooks/useToolkitData.ts` | **Modify** | Derive tool unlock status from level completion |
| `pages/app/AppCurrentLevel.tsx` | **Minor modify** | No structural changes — the `useLevelData` hook handles persistence |
| `pages/app/AppDashboard.tsx` | **Minor modify** | Leaderboard section shows placeholder until Phase 4 |

---

## 4. Database Functions — `lib/database.ts`

### 4.1 Topic Progress CRUD

```typescript
// ─── TOPIC PROGRESS ───

export interface TopicProgressRow {
  user_id: string;
  level: number;
  topic_id: number;
  current_phase: number;
  current_slide: number;
  elearn_completed_at: string | null;
  read_completed_at: string | null;
  watch_completed_at: string | null;
  practise_completed_at: string | null;
  completed_at: string | null;
  visited_slides: number[];
}

/**
 * Get all topic progress rows for a user within a specific level.
 */
export async function getTopicProgress(
  userId: string,
  level: number,
): Promise<TopicProgressRow[]> {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level);
  if (error) { console.error('getTopicProgress error:', error); return []; }
  return (data || []) as TopicProgressRow[];
}

/**
 * Get all topic progress rows for a user across ALL levels.
 * Used by the dashboard and journey pages.
 */
export async function getAllTopicProgress(
  userId: string,
): Promise<TopicProgressRow[]> {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('getAllTopicProgress error:', error); return []; }
  return (data || []) as TopicProgressRow[];
}

/**
 * Upsert a topic progress row. Creates the row if it doesn't exist,
 * updates it if it does. Uses the unique constraint (user_id, level, topic_id).
 */
export async function upsertTopicProgress(
  userId: string,
  level: number,
  topicId: number,
  updates: Partial<{
    current_phase: number;
    current_slide: number;
    elearn_completed_at: string;
    read_completed_at: string;
    watch_completed_at: string;
    practise_completed_at: string;
    completed_at: string;
    visited_slides: number[];
  }>,
): Promise<boolean> {
  const row = {
    user_id: userId,
    level,
    topic_id: topicId,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('topic_progress')
    .upsert(row, { onConflict: 'user_id,level,topic_id' });
  if (error) { console.error('upsertTopicProgress error:', error); return false; }
  return true;
}

/**
 * Update the current slide position for a topic.
 * Called on every slide navigation (debounced in the hook).
 */
export async function updateSlidePosition(
  userId: string,
  level: number,
  topicId: number,
  slide: number,
  visitedSlides: number[],
): Promise<boolean> {
  return upsertTopicProgress(userId, level, topicId, {
    current_slide: slide,
    visited_slides: visitedSlides,
  });
}

/**
 * Mark a phase as completed for a topic.
 * Advances current_phase to the next phase.
 * If all 4 phases are now complete, also sets completed_at.
 */
export async function completePhaseDb(
  userId: string,
  level: number,
  topicId: number,
  phaseNumber: number,
): Promise<boolean> {
  const phaseColumns: Record<number, string> = {
    1: 'elearn_completed_at',
    2: 'read_completed_at',
    3: 'watch_completed_at',
    4: 'practise_completed_at',
  };
  const column = phaseColumns[phaseNumber];
  if (!column) return false;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    [column]: now,
    current_phase: Math.min(phaseNumber + 1, 4),
    current_slide: 0,
    updated_at: now,
  };

  // If completing phase 4, also mark the topic as complete
  if (phaseNumber === 4) {
    updates.completed_at = now;
  }

  return upsertTopicProgress(userId, level, topicId, updates);
}

/**
 * Mark an entire topic as completed.
 * Sets completed_at and all incomplete phase timestamps.
 */
export async function completeTopicDb(
  userId: string,
  level: number,
  topicId: number,
): Promise<boolean> {
  const now = new Date().toISOString();
  return upsertTopicProgress(userId, level, topicId, {
    completed_at: now,
    practise_completed_at: now,
  });
}
```

### 4.2 Activity Logging

```typescript
// ─── ACTIVITY LOG ───

export async function logActivity(
  userId: string,
  action: string,
  level?: number,
  topicId?: number,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      action,
      level: level ?? null,
      topic_id: topicId ?? null,
      metadata: metadata ?? {},
    });
  if (error) console.error('logActivity error:', error);
}
```

### 4.3 Dashboard Query Functions

```typescript
// ─── DASHBOARD QUERIES ───

/**
 * Count artefacts per level for a user.
 */
export async function getArtefactCountsByLevel(
  userId: string,
): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('level')
    .eq('user_id', userId)
    .is('archived_at', null);
  if (error) { console.error('getArtefactCountsByLevel error:', error); return {}; }
  const counts: Record<number, number> = {};
  (data || []).forEach((row: { level: number }) => {
    counts[row.level] = (counts[row.level] || 0) + 1;
  });
  return counts;
}

/**
 * Get level progress rows for a user (tool_used, workshop_attended).
 * These remain in the existing level_progress table.
 */
export { getLevelProgress } from './database';  // already exists

/**
 * Get full profile for AppContext.
 * Extended to include onboarding_completed, current_level, streak_days.
 */
export async function getFullProfile(userId: string): Promise<{
  fullName: string;
  role: string;
  function: string;
  functionOther: string;
  seniority: string;
  aiExperience: string;
  ambition: string;
  challenge: string;
  availability: string;
  experienceDescription: string;
  goalDescription: string;
  onboardingCompleted: boolean;
  currentLevel: number;
  streakDays: number;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('getFullProfile error:', error); return null; }
  return {
    fullName: data.full_name || '',
    role: data.role || '',
    function: data.function || '',
    functionOther: data.function_other || '',
    seniority: data.seniority || '',
    aiExperience: data.ai_experience || '',
    ambition: data.ambition || '',
    challenge: data.challenge || '',
    availability: data.availability || '',
    experienceDescription: data.experience_description || '',
    goalDescription: data.goal_description || '',
    onboardingCompleted: data.onboarding_completed ?? false,
    currentLevel: data.current_level ?? 1,
    streakDays: data.streak_days ?? 0,
  };
}

/**
 * Update the user's current active level in their profile.
 */
export async function updateCurrentLevel(
  userId: string,
  level: number,
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ current_level: level, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return !error;
}
```

---

## 5. AppContext.tsx — Rewrite

### Replace the mock profile with real Supabase data.

```typescript
// context/AppContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFullProfile, updateCurrentLevel as dbUpdateLevel } from '../lib/database';

interface UserProfile {
  fullName: string;
  currentLevel: number;
  streakDays: number;
  onboardingCompleted: boolean;
  role: string;
  aiExperience: string;
  ambition: string;
}

interface AppContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
  setCurrentLevel: (level: number) => void;
  refreshProfile: () => void;
}

const AppContext = createContext<AppContextValue>({
  userProfile: null,
  loading: true,
  setCurrentLevel: () => {},
  refreshProfile: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getFullProfile(user.id);
    if (data) {
      setProfile({
        fullName: data.fullName,
        currentLevel: data.currentLevel,
        streakDays: data.streakDays,
        onboardingCompleted: data.onboardingCompleted,
        role: data.role,
        aiExperience: data.aiExperience,
        ambition: data.ambition,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const setCurrentLevel = useCallback((level: number) => {
    if (!user) return;
    setProfile(prev => prev ? { ...prev, currentLevel: level } : prev);
    dbUpdateLevel(user.id, level);
  }, [user]);

  return (
    <AppContext.Provider value={{
      userProfile: profile,
      loading,
      setCurrentLevel,
      refreshProfile: fetchProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext);
}
```

### Key changes from current implementation

- Reads from Supabase instead of returning a hardcoded object
- `loading` is `true` until the profile fetch completes
- Depends on `useAuth()` — re-fetches when the user changes
- Exposes `refreshProfile()` so the onboarding wizard can trigger a re-fetch after saving
- Includes `onboardingCompleted` for the onboarding gate (Phase 1 §11)
- `setCurrentLevel` writes to Supabase in addition to updating local state

---

## 6. useLevelData.ts — Rewrite

### Replace mock data with Supabase reads and writes.

The hook's public interface stays the same. Internal implementation changes.

```typescript
// hooks/useLevelData.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LEVEL_TOPICS } from '../data/levelTopics';
import {
  getTopicProgress,
  upsertTopicProgress,
  updateSlidePosition as dbUpdateSlide,
  completePhaseDb,
  completeTopicDb,
  logActivity,
} from '../lib/database';

export interface TopicProgress {
  topicId: number;
  phase: number;       // 1–4
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
    const visited = visitedSlidesRef.current[topicId] || new Set();
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

    // Get the current phase number before advancing
    const currentPhase = levelData?.topicProgress.find(tp => tp.topicId === topicId)?.phase ?? 1;
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
```

### Key changes from current implementation

- Fetches from `topic_progress` table on mount instead of generating mock data
- `advanceSlide` debounces Supabase writes (500ms) to avoid excessive DB calls during rapid slide navigation
- Tracks `visitedSlides` as a Set — persisted as an integer array in the database
- `completePhase` and `completeTopic` write to Supabase immediately (not debounced — these are definitive user actions)
- `phaseCompletions` array added to `TopicProgress` — enables the UI to show which specific phases are done
- Logs all significant actions to `activity_log` for future streak/analytics use

### Impact on `pages/app/AppCurrentLevel.tsx`

**No structural changes needed.** The component already calls:
- `advanceSlide(topicId, slide)` on slide navigation
- `completePhase(topicId)` when a phase finishes
- `completeTopic(topicId)` when the final phase finishes

These callbacks are provided by `useLevelData`, which now persists to Supabase internally. The component doesn't know or care where the data is stored.

**One minor addition:** The `phaseCompletions` array is now available on each `TopicProgress` object. `AppCurrentLevel` can optionally use this to enhance the `PhaseProgressStrip` — showing which specific phases have been completed vs. just the current phase number. This is a UI polish item, not a blocker.

---

## 7. useDashboardData.ts — Rewrite

### Replace all mock data with Supabase queries.

```typescript
// hooks/useDashboardData.ts

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
  getLevelProgress,
} from '../lib/database';
import { LEVEL_TOPICS } from '../data/levelTopics';
import { ALL_TOOLS } from '../data/toolkitData';

// Keep existing interfaces (LeaderboardMember, LevelProgress, ToolUsage, DashboardData)
// ... unchanged ...

export function useDashboardData(): { data: DashboardData | null; loading: boolean } {
  const { user } = useAuth();
  const { userProfile } = useAppContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      // Parallel fetch all data sources
      const [topicProgressRows, artefactCounts, levelProgressRows] = await Promise.all([
        getAllTopicProgress(user.id),
        getArtefactCountsByLevel(user.id),
        getLevelProgress(user.id),
      ]);

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

        // For single-topic levels, derive phase completion from the topic's phases
        // For multi-topic levels, aggregate: a phase is "complete" when all topics have it complete
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

      // ── Derive unlocked tools ──
      // A tool is unlocked when the user has reached that level
      // (i.e., all previous levels complete, or it's their current level)
      const unlockedToolIds: string[] = [];
      ALL_TOOLS.forEach(tool => {
        if (tool.levelRequired <= currentLevel) {
          unlockedToolIds.push(tool.id);
        }
      });

      // ── Active days this week (placeholder — real implementation in Phase 4) ──
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monBasedToday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const activeDays = Array(7).fill(false);
      // Mark today as active since the user is viewing the dashboard
      activeDays[monBasedToday] = true;

      // ── Leaderboard (placeholder — real implementation in Phase 4) ──
      const leaderboard: LeaderboardMember[] = [{
        name: userProfile.fullName || 'You',
        initials: getInitials(userProfile.fullName),
        avatarColor: '#38B2AC',
        level: currentLevel,
        score: overallCompletedTopics * 100,
        completionPct: overallTotalTopics > 0
          ? Math.round((overallCompletedTopics / overallTotalTopics) * 100) : 0,
        streakDays: userProfile.streakDays,
        useCasesIdentified: 0,
        assessmentAvg: 0,
        isCurrentUser: true,
      }];

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

        streakDays: userProfile.streakDays,
        activeDaysThisWeek: activeDays,

        leaderboard,
        activeColleaguesCount: 0,    // Phase 4
        sameLevelColleaguesCount: 0,  // Phase 4

        lastActivityAt: new Date(),
        unlockedToolIds,
      });
      setLoading(false);
    })();
  }, [user, userProfile]);

  return { data, loading };
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
```

### Key changes from current implementation

- All data derived from three parallel Supabase queries: `getAllTopicProgress`, `getArtefactCountsByLevel`, `getLevelProgress`
- Phase completion per level is computed from `topic_progress` rows
- Artefact counts come from the `artefacts` table (Phase 1)
- Tool usage reads from `level_progress` (existing table)
- Leaderboard and streak are placeholders — only the current user's entry is shown, derived from their profile. Real cohort leaderboard is Phase 4.
- `activeDaysThisWeek` is a placeholder — real calculation from `activity_log` is Phase 4.

---

## 8. useJourneyData.ts — Rewrite

### Replace mock data with Supabase queries.

```typescript
// hooks/useJourneyData.ts

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllTopicProgress,
  getArtefactCountsByLevel,
} from '../lib/database';
import { LEVEL_TOPICS } from '../data/levelTopics';
import { ALL_TOOLS } from '../data/toolkitData';

// Keep existing interfaces (LevelProgress, JourneyData)
// ... unchanged ...

export function useJourneyData(): {
  data: JourneyData | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
} {
  const { user } = useAuth();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const [topicProgressRows, artefactCounts] = await Promise.all([
          getAllTopicProgress(user.id),
          getArtefactCountsByLevel(user.id),
        ]);

        const levels: LevelProgress[] = [1, 2, 3, 4, 5].map(levelNumber => {
          const topics = LEVEL_TOPICS[levelNumber] || [];
          const progressForLevel = topicProgressRows.filter(r => r.level === levelNumber);
          const progressMap = new Map(progressForLevel.map(r => [r.topic_id, r]));
          const toolsForLevel = ALL_TOOLS.filter(t => t.levelRequired === levelNumber).length;

          let completedTopics = 0;
          let activeTopicIndex = 0;
          let currentSlide = 0;
          let currentPhase = 1;

          topics.forEach((topic, idx) => {
            const row = progressMap.get(topic.id);
            if (row?.completed_at) {
              completedTopics++;
            } else if (!row?.completed_at && activeTopicIndex === 0) {
              activeTopicIndex = idx;
              currentSlide = row?.current_slide ?? 0;
              currentPhase = row?.current_phase ?? 1;
            }
          });

          const isComplete = completedTopics === topics.length && topics.length > 0;

          // Derive completed_at from the latest topic completion in this level
          let completedAt: Date | null = null;
          if (isComplete) {
            const timestamps = progressForLevel
              .map(r => r.completed_at)
              .filter(Boolean)
              .map(t => new Date(t!).getTime());
            if (timestamps.length > 0) {
              completedAt = new Date(Math.max(...timestamps));
            }
          }

          return {
            levelNumber,
            status: isComplete ? 'completed' as const
              : completedTopics > 0 || progressForLevel.length > 0 ? 'active' as const
              : 'not-started' as const,
            completedTopics,
            totalTopics: topics.length,
            completedAt,
            artefactsCreated: artefactCounts[levelNumber] || 0,
            toolsUnlocked: toolsForLevel,
            activeTopicIndex,
            currentSlide,
            currentPhase,
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
  }, [user, retryCount]);

  const retry = () => setRetryCount(c => c + 1);
  return { data, loading, error, retry };
}
```

### Key changes

- Derives level status from `topic_progress` rows: all topics complete → "completed", any progress → "active", no progress → "not-started"
- `completedAt` for a level is the latest `completed_at` timestamp among its topics
- Artefact counts from the `artefacts` table
- Error handling with retry support (existing interface)

---

## 9. useToolkitData.ts — Modify

### Derive tool unlock status from real progress

Currently this hook returns mock data about which tools are available. Update it to derive unlock status from the user's current level:

**Rule:** A toolkit tool is unlocked when the user's `currentLevel` (from their profile) is greater than or equal to the tool's `levelRequired`.

**Change:** Import `useAppContext` and use `userProfile.currentLevel` instead of a hardcoded value.

This is a minimal change — the hook's return shape stays the same.

---

## 10. Dashboard Page — Leaderboard Handling

### Problem

The dashboard currently renders a 10-person leaderboard from mock data. In Phase 2, we only have the current user's data — no cohort/org data.

### Solution

Replace the leaderboard section with a **"Coming Soon" placeholder card** that explains the feature requires a cohort:

```
┌─────────────────────────────────────────────────────┐
│  🏆  Cohort Leaderboard                             │
│                                                      │
│  Your ranking will appear here once your             │
│  organisation's cohort is set up.                    │
│                                                      │
│  For now, track your own progress above.             │
└─────────────────────────────────────────────────────┘
```

**Specs:**
- `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 14`, `padding: 24px`
- Trophy icon: `color: #A0AEC0`, 24px
- Heading: `fontSize: 15`, `fontWeight: 700`, `color: #1A202C`
- Body: `fontSize: 13`, `color: #718096`, `lineHeight: 1.6`

The full leaderboard component remains in the code but is conditionally rendered only when `data.leaderboard.length > 1` (i.e., when there are real cohort members — Phase 4).

---

## 11. Progress Recording Points

This table maps every user action to the database write it triggers. Use this as a reference when verifying the implementation.

| User Action | Where It Happens | Database Write | Table |
|------------|------------------|---------------|-------|
| Navigate to a slide | `ELearningView` → `onSlideChange` → `advanceSlide()` | Update `current_slide` + add to `visited_slides` (debounced 500ms) | `topic_progress` |
| Click "Finish E-Learning →" | `ELearningView` → `onCompletePhase` → `completePhase()` | Set `elearn_completed_at`, advance `current_phase` to 2 | `topic_progress` |
| Submit all reflections + click "Continue to Watch →" | `ReadView` → `onCompletePhase` → `completePhase()` | Set `read_completed_at`, advance `current_phase` to 3 | `topic_progress` |
| Answer all knowledge checks | `WatchView` → `onCompletePhase` → `completePhase()` | Set `watch_completed_at`, advance `current_phase` to 4 | `topic_progress` |
| Click "Complete Topic" in Practise phase | `PractiseView` → `onCompleteTopic` → `completeTopic()` | Set `practise_completed_at` + `completed_at` | `topic_progress` |
| Generate output in a toolkit tool | Each toolkit component → `upsertToolUsed()` | Set `tool_used = true` | `level_progress` |
| Save to Library in a toolkit tool | Each toolkit component → `dbSavePrompt()` | Insert row | `artefacts` |
| Any of the above | All hooks | Insert row | `activity_log` |

---

## 12. Data Flow Diagram

```
User interacts with UI
        │
        ▼
┌──────────────────────┐
│  AppCurrentLevel.tsx  │──── calls ────► useLevelData hook
│  (E-Learn, Read,     │                     │
│   Watch, Practise)    │                     │ reads from / writes to
│                       │                     ▼
└──────────────────────┘              ┌──────────────┐
                                      │ topic_progress │ ◄── Supabase
                                      │ activity_log   │
                                      └──────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                     useDashboardData  useJourneyData  useToolkitData
                              │              │              │
                              ▼              ▼              ▼
                     AppDashboard.tsx  AppJourney.tsx  AppToolkit.tsx
```

All three consumer hooks (`useDashboardData`, `useJourneyData`, `useToolkitData`) read from the same underlying tables. They don't write — only the `useLevelData` hook and the toolkit page components write progress data.

---

## 13. Testing Checklist

### AppContext

- [ ] A signed-in user's `fullName`, `currentLevel`, and `streakDays` come from the Supabase `profiles` table
- [ ] Changing `currentLevel` via `setCurrentLevel()` persists to Supabase
- [ ] A user who hasn't completed onboarding (`onboarding_completed = false`) gets `onboardingCompleted: false` in the profile
- [ ] If the profile fetch fails, `userProfile` is `null` and `loading` becomes `false`

### Level Progress Tracking

- [ ] Navigating to a new slide records the slide index in `visited_slides` (debounced)
- [ ] The slide position persists across page refreshes — returning to the level page resumes at the last viewed slide
- [ ] Clicking "Finish E-Learning →" sets `elearn_completed_at` and advances `current_phase` to 2
- [ ] Completing the Read phase sets `read_completed_at` and advances to phase 3
- [ ] Completing the Watch phase sets `watch_completed_at` and advances to phase 4
- [ ] Clicking "Complete Topic" sets `practise_completed_at`, `completed_at`, and topic is marked done
- [ ] Returning to a completed topic shows it in the completed state (no regression)
- [ ] Starting a new topic that has no `topic_progress` row creates one on first interaction

### Dashboard

- [ ] The progress ring shows real completed topics / total topics
- [ ] Level cards show correct per-level phase completion
- [ ] Artefact counts per level reflect real data from the `artefacts` table
- [ ] Tool usage "last used" timestamps come from `level_progress.tool_used_at`
- [ ] The leaderboard section shows a "Coming Soon" placeholder (not mock users)
- [ ] `overallCompletedTopics` and `levelsCompleted` are accurate

### Journey Page

- [ ] Each level card shows correct status: "completed", "active", or "not-started"
- [ ] Completed levels show the real completion date
- [ ] Active level shows the correct slide/phase position
- [ ] Artefact counts per level are accurate
- [ ] The "Review →" button on completed levels navigates correctly with `?level=N`

### Activity Log

- [ ] `session_started` is logged when a user navigates to the level page
- [ ] `phase_completed` is logged with the correct phase number
- [ ] `topic_completed` is logged when a topic finishes
- [ ] `level_completed` is logged when all topics in a level are done
- [ ] `tool_used` is logged when a toolkit tool generates output (existing `upsertToolUsed`)

---

## 14. Implementation Order

1. **Schema first** — Run the SQL for `topic_progress` and `activity_log` tables
2. **Database functions** — Add all new functions to `lib/database.ts` (§4)
3. **AppContext** — Rewrite to fetch real profile (§5)
4. **useLevelData** — Rewrite with Supabase persistence (§6)
5. **useDashboardData** — Rewrite with real queries (§7)
6. **useJourneyData** — Rewrite with real queries (§8)
7. **useToolkitData** — Minor update for real unlock derivation (§9)
8. **Dashboard leaderboard** — Replace with placeholder (§10)
9. **Test end-to-end** against the checklist in §13

---

## 15. Phase 4 Deferred Items

The following items are explicitly deferred to Phase 4 and should not be attempted in this phase:

| Item | Why Deferred |
|------|-------------|
| Real streak calculation from `activity_log` | Requires defining "active day" rules and running aggregate queries — Phase 4 |
| Cohort leaderboard | Requires org scoping via `user_org_memberships` — Phase 4 |
| `activeDaysThisWeek` from real data | Requires `activity_log` aggregate queries — Phase 4 |
| Workshop code validation against org | Requires org context — Phase 4 |
| `activeColleaguesCount` / `sameLevelColleaguesCount` | Requires org-scoped queries — Phase 4 |
