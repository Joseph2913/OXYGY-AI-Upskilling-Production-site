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

  // Don't make redirect decisions until the check completes
  if (learningPlanLoading) return null;

  // Redirect to journey if no learning plan
  if (!hasLearningPlan) {
    return <Navigate to="/app/journey" replace />;
  }

  return <>{children}</>;
};

export default LearningPlanGate;
