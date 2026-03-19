import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const OrgCheckGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, orgMemberships, isOxygyAdmin, loading, enrollmentPending } = useAuth();

  if (loading) return null; // AppAuthGuard handles loading state
  if (!user) return <Navigate to="/login" replace />;

  // Admins bypass org check
  if (isOxygyAdmin) return <>{children}</>;

  // Show loading while enrollment is processing (prevents flash of code entry page)
  if (enrollmentPending) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#38B2AC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#FFFFFF',
          }}>
            O
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.02em' }}>OXYGY</span>
        </div>
        <div style={{
          width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'org-spin 0.7s linear infinite', marginBottom: 16,
        }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2D3748' }}>Setting up your account...</div>
        <style>{`@keyframes org-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Allow users through even without org membership — access code entry
  // is now optional and available within the app (cohort section)
  return <>{children}</>;
};

export default OrgCheckGuard;
