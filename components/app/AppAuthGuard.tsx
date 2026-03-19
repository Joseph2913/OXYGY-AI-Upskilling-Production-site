import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AppAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Local dev bypass — skip auth when Supabase is not configured
  if (!isSupabaseConfigured) return <>{children}</>;

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F7FAFC',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%',
          animation: 'app-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    const returnTo = location.pathname + location.search;
    // Save return path so OAuth callback can redirect back after sign-in
    sessionStorage.setItem('oxygy_auth_return_path', returnTo);
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
};
