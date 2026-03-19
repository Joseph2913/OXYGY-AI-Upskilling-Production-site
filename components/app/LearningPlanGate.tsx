import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

interface LearningPlanGateProps {
  children: React.ReactNode;
}

const LearningPlanGate: React.FC<LearningPlanGateProps> = ({ children }) => {
  const { hasLearningPlan, learningPlanLoading } = useAppContext();
  const location = useLocation();

  // /app/journey is always accessible — it handles both states internally
  // Check this FIRST so the journey page is never blocked during loading
  if (location.pathname === '/app/journey') return <>{children}</>;

  // Show a spinner while loading — never return null (causes blank white screen)
  if (learningPlanLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%',
          animation: 'gate-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes gate-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Redirect to journey if no learning plan
  if (!hasLearningPlan) {
    return <Navigate to="/app/journey" replace />;
  }

  return <>{children}</>;
};

export default LearningPlanGate;
