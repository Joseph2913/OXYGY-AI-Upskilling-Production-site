import React, { createContext, useContext, useState, useCallback } from 'react';

/*
 * SQL MIGRATION — Run this in the Supabase SQL editor if columns don't exist:
 *
 * alter table profiles add column if not exists current_level integer default 1;
 * alter table profiles add column if not exists streak_days integer default 0;
 */

interface UserProfile {
  fullName: string;
  currentLevel: number; // 1–5
  streakDays: number;
}

interface AppContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
  setCurrentLevel: (level: number) => void;
}

// DEV MODE: Mock user profile — no Supabase fetch required.
// TODO: Replace with real Supabase fetch when auth is wired up.
const INITIAL_PROFILE: UserProfile = {
  fullName: 'Joseph Thomas',
  currentLevel: 1,
  streakDays: 5,
};

const AppContext = createContext<AppContextValue>({
  userProfile: INITIAL_PROFILE,
  loading: false,
  setCurrentLevel: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);

  const setCurrentLevel = useCallback((level: number) => {
    setProfile((prev) => ({ ...prev, currentLevel: level }));
    // TODO: Write to Supabase profiles table when auth is wired up
  }, []);

  return (
    <AppContext.Provider value={{ userProfile: profile, loading: false, setCurrentLevel }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
