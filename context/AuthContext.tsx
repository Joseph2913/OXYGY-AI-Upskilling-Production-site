import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
});

/** Base URL without any hash — safe for OAuth redirects */
function getBaseUrl(): string {
  return window.location.origin + window.location.pathname;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);

      // After successful sign-in, navigate back to the saved page
      if (event === 'SIGNED_IN' && s) {
        const returnTo = sessionStorage.getItem('oxygy_auth_return');
        if (returnTo) {
          sessionStorage.removeItem('oxygy_auth_return');
          window.location.hash = returnTo;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Save current hash route before redirecting to OAuth */
function saveReturnRoute(): void {
  const hash = window.location.hash;
  // Save the route the user was trying to access (default to dashboard)
  if (hash && hash !== '#') {
    sessionStorage.setItem('oxygy_auth_return', hash.replace('#', ''));
  } else {
    sessionStorage.setItem('oxygy_auth_return', 'dashboard');
  }
}

export async function signInWithMicrosoft(): Promise<void> {
  saveReturnRoute();
  await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email profile',
      redirectTo: getBaseUrl(),
    },
  });
}

export async function signInWithGoogle(): Promise<void> {
  saveReturnRoute();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'email profile',
      redirectTo: getBaseUrl(),
    },
  });
}

export async function signInWithEmail(email: string): Promise<{ error: string | null }> {
  saveReturnRoute();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getBaseUrl(),
    },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  window.location.hash = '';
}
