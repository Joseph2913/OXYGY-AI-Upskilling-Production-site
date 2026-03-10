import React, { createContext, useContext } from 'react';

/**
 * Auth completely removed — useAuth() returns a mock user so all
 * downstream components work without changes.
 */

interface MockUser {
  id: string;
  email: string;
  user_metadata: { full_name: string };
}

interface AuthContextValue {
  user: MockUser | null;
  session: null;
  loading: boolean;
}

const MOCK_USER: MockUser = {
  id: 'mock-user-001',
  email: 'user@oxygy.ai',
  user_metadata: { full_name: 'Joseph Thomas' },
};

const AuthContext = createContext<AuthContextValue>({
  user: MOCK_USER,
  session: null,
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: MOCK_USER, session: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// No-op stubs so existing imports don't break
export async function signInWithMicrosoft(): Promise<void> {}
export async function signInWithGoogle(): Promise<void> {}
export async function signInWithEmail(_email: string): Promise<{ error: string | null }> {
  return { error: null };
}
export async function signOut(): Promise<void> {}
