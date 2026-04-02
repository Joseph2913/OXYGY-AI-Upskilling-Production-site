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
 * Error boundary that resets when the route changes (via key prop).
 * Prevents an unhandled render error in any page from crashing the entire
 * app shell and leaving a blank white screen that requires a browser refresh.
 */
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RouteErrorBoundary] Page render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column' as const,
          alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 36, textAlign: 'center' as const,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>
            Something went wrong loading this page
          </div>
          <div style={{ fontSize: 14, color: '#718096', marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
            There was an unexpected error. Try navigating to another page, or click below to retry.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#38B2AC', color: '#FFFFFF', border: 'none',
              borderRadius: 24, padding: '10px 28px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

    const completed = localStorage.getItem('oxygy_tour_completed');

    // If tour was already completed/skipped, nothing to do. Close the gate.
    if (completed === 'true') {
      initialLoadDoneRef.current = true;
      return;
    }

    // For existing users who were active before the tour was deployed:
    // silently mark tour as done so it doesn't auto-trigger unexpectedly.
    // The replay option in Settings remains available.
    const visitCount = parseInt(localStorage.getItem('oxygy_visit_count') || '0', 10);
    if (visitCount > 1) {
      localStorage.setItem('oxygy_tour_completed', 'true');
      initialLoadDoneRef.current = true;
      return;
    }

    // Only auto-trigger on the Dashboard page (post-survey landing).
    // Do NOT close the gate yet — keep watching until user reaches dashboard.
    if (location.pathname !== '/app/dashboard') return;

    // On dashboard and tour not yet seen — close the gate and trigger.
    initialLoadDoneRef.current = true;
    localStorage.setItem('oxygy_visit_count', String(visitCount + 1));

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
          {/* Key by pathname so the error boundary resets on every navigation */}
          <RouteErrorBoundary key={location.pathname}>
            <LearningPlanGate>
              <Outlet />
            </LearningPlanGate>
          </RouteErrorBoundary>
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
