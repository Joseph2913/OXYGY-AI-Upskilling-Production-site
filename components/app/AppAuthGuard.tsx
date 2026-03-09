import React from 'react';

// DEV MODE: Auth bypass — always renders children without checking login.
// TODO: Re-enable auth guard when Supabase auth is wired up.
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

export const AppAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
