import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../../context/AppContext';
import { OrgProvider } from '../../context/OrgContext';
import { TourModeProvider } from '../../context/TourModeContext';
import { AppSidebar, SIDEBAR_COLLAPSED_WIDTH } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import LearningPlanGate from './LearningPlanGate';
import { ProductTour } from './ProductTour';

/**
 * Inner layout that has access to AppContext (for hasLearningPlan check).
 * Tour logic lives here so it can read context values.
 * TourModeProvider wraps everything so hooks can detect tour mode.
 */
const AppLayoutInner: React.FC = () => {
  const location = useLocation();
  const { hasLearningPlan } = useAppContext();

  const [tourActive, setTourActive] = useState(false);
  const tourTriggeredRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  /* ── Auto-trigger logic ── */
  useEffect(() => {
    // Wait until context has resolved hasLearningPlan
    if (!hasLearningPlan) return;
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const completed = localStorage.getItem('oxygy_tour_completed');

    // If tour was already completed/skipped, nothing to do
    if (completed === 'true') return;

    // For existing users who already have a learning plan and were active
    // before the tour was deployed: silently mark tour as done so it doesn't
    // auto-trigger unexpectedly. The replay option in Settings remains available.
    const hasArtefacts = localStorage.getItem('oxygy_has_artefacts') === 'true';
    const hasToolUsage = localStorage.getItem('oxygy_has_tool_usage') === 'true';
    // Also check if they've visited more than once (returning user heuristic)
    const visitCount = parseInt(localStorage.getItem('oxygy_visit_count') || '0', 10);
    if (visitCount > 1 || hasArtefacts || hasToolUsage) {
      localStorage.setItem('oxygy_tour_completed', 'true');
      return;
    }

    // Track visits for the heuristic above
    localStorage.setItem('oxygy_visit_count', String(visitCount + 1));

    // Only auto-trigger on the Journey page (post-onboarding landing)
    if (location.pathname !== '/app/journey') return;
    if (tourTriggeredRef.current) return;
    tourTriggeredRef.current = true;

    const timer = setTimeout(() => setTourActive(true), 1500);
    return () => clearTimeout(timer);
  }, [hasLearningPlan, location.pathname]);

  /* ── Replay listener (from AppSidebar settings) ── */
  useEffect(() => {
    const handler = () => {
      tourTriggeredRef.current = true;
      setTourActive(true);
    };
    window.addEventListener('oxygy:replay-tour', handler);
    return () => window.removeEventListener('oxygy:replay-tour', handler);
  }, []);

  const handleTourComplete = useCallback(() => {
    setTourActive(false);
  }, []);

  return (
    <TourModeProvider active={tourActive}>
      <AppSidebar />
      <div style={{ marginLeft: SIDEBAR_COLLAPSED_WIDTH }}>
        <AppTopBar />
        <div
          style={{
            background: '#F7FAFC',
            minHeight: 'calc(100vh - 54px)',
          }}
        >
          <LearningPlanGate>
            <Outlet />
          </LearningPlanGate>
        </div>
      </div>
      {tourActive && <ProductTour onComplete={handleTourComplete} />}
    </TourModeProvider>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <AppProvider>
      <OrgProvider>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <AppLayoutInner />
        </div>
      </OrgProvider>
    </AppProvider>
  );
};
