import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface OrgMember {
  userId: string;
  fullName: string;
  role: 'learner' | 'facilitator' | 'admin';
  currentLevel: number;
  enrolledAt: Date;
}

interface OrgContextValue {
  orgId: string | null;
  orgName: string | null;
  orgTier: string | null;
  userRole: 'learner' | 'facilitator' | 'admin' | null;
  members: OrgMember[];
  loading: boolean;
  isAdmin: boolean;
  isFacilitator: boolean;
  levelAccess: number[];
  cohortId: string | null;
  cohortName: string | null;
  refreshOrg: () => void;
}

const OrgContext = createContext<OrgContextValue>({
  orgId: null, orgName: null, orgTier: null, userRole: null,
  members: [], loading: true, isAdmin: false, isFacilitator: false,
  levelAccess: [1, 2, 3, 4, 5], cohortId: null, cohortName: null,
  refreshOrg: () => {},
});

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<OrgContextValue, 'refreshOrg'>>({
    orgId: null, orgName: null, orgTier: null, userRole: null,
    members: [], loading: true, isAdmin: false, isFacilitator: false,
    levelAccess: [1, 2, 3, 4, 5], cohortId: null, cohortName: null,
  });

  const fetchOrg = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // 1. Get user's org membership (include cohort_id)
      const { data: membership, error: memErr } = await supabase
        .from('user_org_memberships')
        .select('org_id, role, cohort_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (memErr) {
        console.error('OrgContext membership query error:', memErr);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (!membership) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // 2. Get org details (include level_access)
      const { data: org } = await supabase
        .from('organisations')
        .select('name, tier, level_access')
        .eq('id', membership.org_id)
        .single();

      // 3. Get all active members with their profiles
      const { data: members } = await supabase
        .from('user_org_memberships')
        .select(`
          user_id, role, enrolled_at,
          profiles!inner(full_name, current_level)
        `)
        .eq('org_id', membership.org_id)
        .eq('active', true);

      const memberList: OrgMember[] = (members || []).map((m: Record<string, unknown>) => ({
        userId: m.user_id as string,
        fullName: (m.profiles as Record<string, unknown>)?.full_name as string || 'Unknown',
        role: m.role as 'learner' | 'facilitator' | 'admin',
        currentLevel: (m.profiles as Record<string, unknown>)?.current_level as number || 1,
        enrolledAt: new Date(m.enrolled_at as string),
      }));

      const userRole = membership.role as 'learner' | 'facilitator' | 'admin';

      // Parse level_access from org (default all levels if missing)
      const rawLevelAccess = org?.level_access;
      const levelAccess = Array.isArray(rawLevelAccess) ? rawLevelAccess as number[] : [1, 2, 3, 4, 5];

      // Fetch cohort name if user has a cohort
      let cohortName: string | null = null;
      if (membership.cohort_id) {
        const { data: cohort } = await supabase
          .from('cohorts')
          .select('name')
          .eq('id', membership.cohort_id)
          .single();
        cohortName = cohort?.name || null;
      }

      setState({
        orgId: membership.org_id,
        orgName: org?.name || null,
        orgTier: org?.tier || null,
        userRole,
        members: memberList,
        loading: false,
        isAdmin: userRole === 'admin',
        isFacilitator: userRole === 'facilitator' || userRole === 'admin',
        levelAccess,
        cohortId: membership.cohort_id || null,
        cohortName,
      });
    } catch (err) {
      console.error('OrgContext fetchOrg error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  return (
    <OrgContext.Provider value={{ ...state, refreshOrg: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
};

export function useOrg() {
  return useContext(OrgContext);
}
