import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFullProfile, updateCurrentLevel as dbUpdateLevel, getAllProjectSubmissions } from '../lib/database';
import type { ProjectSubmission } from '../lib/database';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface UserProfile {
  fullName: string;
  currentLevel: number; // 1–5
  streakDays: number;
  onboardingCompleted: boolean;
  role: string;
  aiExperience: string;
  ambition: string;
}

interface OrgContextData {
  orgId: string | null;
  orgName: string | null;
  levelAccess: number[];
  cohortId: string | null;
  cohortName: string | null;
}

interface ProjectSubmissionSummary {
  status: 'draft' | 'submitted' | 'passed' | 'needs_revision';
  completedAt: number | null;
}

interface AppContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
  hasLearningPlan: boolean;
  learningPlanLoading: boolean;
  refreshLearningPlan: () => Promise<void>;
  setCurrentLevel: (level: number) => void;
  refreshProfile: () => void;
  orgContext: OrgContextData | null;
  projectSubmissions: Record<number, ProjectSubmissionSummary>;
  refreshProjectSubmissions: () => Promise<void>;
}

// Fallback profile when Supabase is not configured
const FALLBACK_PROFILE: UserProfile = {
  fullName: 'Demo User',
  currentLevel: 1,
  streakDays: 0,
  onboardingCompleted: true,
  role: '',
  aiExperience: '',
  ambition: '',
};

const AppContext = createContext<AppContextValue>({
  userProfile: null,
  loading: true,
  hasLearningPlan: false,
  learningPlanLoading: true,
  refreshLearningPlan: async () => {},
  setCurrentLevel: () => {},
  refreshProfile: () => {},
  orgContext: null,
  projectSubmissions: {},
  refreshProjectSubmissions: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgContext, setOrgContext] = useState<OrgContextData | null>(null);
  const [hasLearningPlan, setHasLearningPlan] = useState(false);
  const [learningPlanLoading, setLearningPlanLoading] = useState(true);
  const [projectSubmissions, setProjectSubmissions] = useState<Record<number, ProjectSubmissionSummary>>({});

  const fetchProjectSubmissions = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setProjectSubmissions({});
      return;
    }
    try {
      const subs = await getAllProjectSubmissions(user.id);
      const map: Record<number, ProjectSubmissionSummary> = {};
      for (const s of subs) {
        map[s.level] = { status: s.status, completedAt: s.completedAt };
      }
      setProjectSubmissions(map);
    } catch {
      setProjectSubmissions({});
    }
  }, [user]);

  const checkLearningPlan = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setHasLearningPlan(false);
      setLearningPlanLoading(false);
      return;
    }
    setLearningPlanLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('id')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        setHasLearningPlan(false);
      } else {
        setHasLearningPlan(!!data);
      }
    } catch {
      setHasLearningPlan(false);
    }
    setLearningPlanLoading(false);
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setProfile(FALLBACK_PROFILE);
      setOrgContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getFullProfile(user.id);
    if (data) {
      setProfile({
        fullName: data.fullName || user.user_metadata?.full_name || '',
        currentLevel: data.currentLevel,
        streakDays: data.streakDays,
        onboardingCompleted: data.onboardingCompleted,
        role: data.role,
        aiExperience: data.aiExperience,
        ambition: data.ambition,
      });
    } else {
      const isReturningUser = !!(user.user_metadata?.full_name || user.user_metadata?.name);
      setProfile({
        fullName: user.user_metadata?.full_name || '',
        currentLevel: 1,
        streakDays: 0,
        onboardingCompleted: isReturningUser,
        role: '',
        aiExperience: '',
        ambition: '',
      });
    }

    // Fetch org context (levelAccess, cohort info)
    try {
      const { data: membership } = await supabase
        .from('user_org_memberships')
        .select('org_id, cohort_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (membership) {
        const { data: org } = await supabase
          .from('organisations')
          .select('name, level_access')
          .eq('id', membership.org_id)
          .single();

        let cohortName: string | null = null;
        if (membership.cohort_id) {
          const { data: cohort } = await supabase
            .from('cohorts')
            .select('name')
            .eq('id', membership.cohort_id)
            .single();
          cohortName = cohort?.name || null;
        }

        const rawLevelAccess = org?.level_access;
        setOrgContext({
          orgId: membership.org_id,
          orgName: org?.name || null,
          levelAccess: Array.isArray(rawLevelAccess) ? rawLevelAccess as number[] : [1, 2, 3, 4, 5],
          cohortId: membership.cohort_id || null,
          cohortName,
        });
      } else {
        setOrgContext(null);
      }
    } catch (err) {
      console.error('AppContext orgContext fetch error:', err);
      setOrgContext(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
    checkLearningPlan();
    fetchProjectSubmissions();
  }, [fetchProfile, checkLearningPlan, fetchProjectSubmissions]);

  const setCurrentLevel = useCallback((level: number) => {
    if (!user) return;
    setProfile(prev => prev ? { ...prev, currentLevel: level } : prev);
    dbUpdateLevel(user.id, level);
  }, [user]);

  return (
    <AppContext.Provider value={{
      userProfile: profile,
      loading,
      hasLearningPlan,
      learningPlanLoading,
      refreshLearningPlan: checkLearningPlan,
      setCurrentLevel,
      refreshProfile: fetchProfile,
      orgContext,
      projectSubmissions,
      refreshProjectSubmissions: fetchProjectSubmissions,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
