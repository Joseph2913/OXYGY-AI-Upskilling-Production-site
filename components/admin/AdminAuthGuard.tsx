import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isOxygyAdmin, platformRole } = useAuth();

  // Still loading auth, OR auth loaded but role not yet fetched (user exists but platformRole is null)
  const stillResolving = loading || (user && platformRole === null);

  if (stillResolving) {
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
    return <Navigate to="/login" replace />;
  }

  if (!isOxygyAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
