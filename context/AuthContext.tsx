// context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { lookupLinkChannel, isChannelUsable, enrollUser, checkDomainAutoEnroll } from '../lib/enrollment';
import type { User, Session } from '@supabase/supabase-js';
import type { PlatformRole, OrgMemberRole } from '../types';

export interface AuthOrgMembership {
  orgId: string;
  orgName: string;
  role: OrgMemberRole;
  cohortId: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  platformRole: PlatformRole | null;
  orgMemberships: AuthOrgMembership[];
  primaryOrg: AuthOrgMembership | null;
  isOxygyAdmin: boolean;
  isClientAdmin: boolean;
  enrollmentPending: boolean;
  enrollmentError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  platformRole: null,
  orgMemberships: [],
  primaryOrg: null,
  isOxygyAdmin: false,
  isClientAdmin: false,
  enrollmentPending: false,
  enrollmentError: null,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);
  const [orgMemberships, setOrgMemberships] = useState<AuthOrgMembership[]>([]);
  const [enrollmentPending, setEnrollmentPending] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const isOxygyAdmin = platformRole === 'oxygy_admin' || platformRole === 'super_admin';
  const isClientAdmin = platformRole === 'client_admin';
  const primaryOrg = orgMemberships.length > 0 ? orgMemberships[0] : null;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured — running in mock mode');
      setLoading(false);
      return;
    }

    // Step 1: Listen for future auth changes (sign-in, sign-out, token refresh)
    // Keep the callback synchronous — no async work here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setPlatformRole(null);
          setOrgMemberships([]);
        }

        // For sign-in events (not initial), reload context
        if (event === 'SIGNED_IN' && newSession?.user) {
          initUserContext(newSession.user);
        }
      }
    );

    // Step 2: Explicitly restore session and load user context
    initSession();

    async function initSession() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await initUserContext(s.user);
        }
      } catch (err) {
        console.error('[AuthContext] initSession error:', err);
      } finally {
        setLoading(false);
      }
    }

    async function initUserContext(u: User) {
      try {
        await ensureProfileExists(u);
        await loadUserContext(u.id);

        // Check for pending enrollment from invite link flow
        const pendingSlug = sessionStorage.getItem('oxygy_enrollment_channel');
        if (pendingSlug) {
          sessionStorage.removeItem('oxygy_enrollment_channel');
          setEnrollmentPending(true);
          try {
            const { channel } = await lookupLinkChannel(pendingSlug);
            if (channel) {
              const { usable } = isChannelUsable(channel);
              if (usable) {
                const result = await enrollUser(u.id, channel as Parameters<typeof enrollUser>[1]);
                if (!result.success) {
                  setEnrollmentError(result.error || 'Enrollment failed.');
                }
              }
            }
            // Reload memberships after enrollment
            await loadUserContext(u.id);
          } catch (err) {
            console.error('[AuthContext] enrollment error:', err);
            setEnrollmentError('Enrollment failed. Please try again.');
          } finally {
            setEnrollmentPending(false);
          }
          return; // Skip domain auto-assign if we just processed an invite link
        }

        // Domain auto-assign for new users with no org membership
        const email = u.email;
        if (email && orgMemberships.length === 0) {
          const enrolled = await checkDomainAutoEnroll(u.id, email);
          if (enrolled) {
            await loadUserContext(u.id);
          }
        }
      } catch (err) {
        console.error('[AuthContext] initUserContext error:', err);
      }
    }

    return () => { subscription.unsubscribe(); };
  }, []);

  async function loadUserContext(userId: string) {
    try {
      // Force-sync auth state so postgrest headers include the JWT
      await supabase.auth.getUser();

      // Fetch platform_role from profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('platform_role')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        console.error('[AuthContext] profile fetch failed:', profileErr.message);
      }

      if (profile?.platform_role) {
        setPlatformRole(profile.platform_role as PlatformRole);
      } else {
        setPlatformRole('learner');
      }

      // Fetch org memberships with org name
      const { data: memberships } = await supabase
        .from('user_org_memberships')
        .select('org_id, role, cohort_id, organisations(name)')
        .eq('user_id', userId)
        .eq('active', true);

      if (memberships && memberships.length > 0) {
        setOrgMemberships(memberships.map((m: Record<string, unknown>) => ({
          orgId: m.org_id as string,
          orgName: ((m.organisations as Record<string, unknown>)?.name as string) || '',
          role: m.role as OrgMemberRole,
          cohortId: (m.cohort_id as string) || null,
        })));
      } else {
        setOrgMemberships([]);
      }
    } catch (err) {
      console.error('loadUserContext error:', err);
      setPlatformRole('learner');
      setOrgMemberships([]);
    }
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      platformRole, orgMemberships, primaryOrg,
      isOxygyAdmin, isClientAdmin,
      enrollmentPending, enrollmentError,
      signInWithGoogle, signInWithMicrosoft, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

// ── Auth actions ──

async function signInWithGoogle(): Promise<void> {
  // Save intended return path so AuthModal can redirect after OAuth callback
  const returnPath = sessionStorage.getItem('oxygy_auth_return_path') || '/app/dashboard';
  sessionStorage.setItem('oxygy_auth_return_path', returnPath);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` },
  });
  if (error) console.error('Google sign-in error:', error);
}

async function signInWithMicrosoft(): Promise<void> {
  const returnPath = sessionStorage.getItem('oxygy_auth_return_path') || '/app/dashboard';
  sessionStorage.setItem('oxygy_auth_return_path', returnPath);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/login`,
      scopes: 'email profile openid',
    },
  });
  if (error) console.error('Microsoft sign-in error:', error);
}

async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign-out error:', error);
  window.location.href = '/';
}

// ── Profile auto-creation ──

async function ensureProfileExists(user: User): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profile check error:', error);
    return;
  }

  if (!data) {
    // Create skeleton profile for new user
    const fullName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || '';
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        email: user.email || '',
        onboarding_completed: false,
      });
    if (insertError) console.error('Profile creation error:', insertError);
  } else {
    // Patch missing email or empty full_name on subsequent logins
    const patches: Record<string, string> = {};
    if (!data.email && user.email) patches.email = user.email;
    if (!data.full_name) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (name) patches.full_name = name;
    }
    if (Object.keys(patches).length > 0) {
      await supabase.from('profiles').update(patches).eq('id', user.id);
    }
  }
}
