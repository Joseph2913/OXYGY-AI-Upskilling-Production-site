import React, { createContext, useContext } from 'react';

interface TourModeContextValue {
  isTourMode: boolean;
}

const TourModeContext = createContext<TourModeContextValue>({ isTourMode: false });

export const TourModeProvider: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <TourModeContext.Provider value={{ isTourMode: active }}>
    {children}
  </TourModeContext.Provider>
);

export function useTourMode(): boolean {
  return useContext(TourModeContext).isTourMode;
}
