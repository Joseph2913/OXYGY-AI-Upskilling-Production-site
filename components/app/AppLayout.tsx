import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
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
 * Inner layout wrapping the app shell.
 * Tour logic lives here, triggered by navigation state from onboarding.
 * TourModeProvider wraps everything so hooks can detect tour mode.
 */
const AppLayoutInner: React.FC = () => {
  const location = useLocation();

  const [tourActive, setTourActive] = useState(false);
  const tourTriggeredRef = useRef(false);

  /* ── Auto-trigger tour after onboarding ──
   * The onboarding survey passes { showTour: true } via navigation state
   * when redirecting to the dashboard. We check for that signal AND that
   * the user hasn't already completed/skipped the tour previously.
   */
  useEffect(() => {
    if (tourTriggeredRef.current) return;
    if (location.pathname !== '/app/dashboard') return;

    const navState = location.state as { showTour?: boolean } | null;
    if (!navState?.showTour) return;

    // Don't show again if already completed/skipped in a prior session
    if (localStorage.getItem('oxygy_tour_completed') === 'true') return;

    tourTriggeredRef.current = true;

    const timer = setTimeout(() => setTourActive(true), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname, location.state]);

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
