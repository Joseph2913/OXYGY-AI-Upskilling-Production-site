import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
// DEV MODE: Auth disabled — no AuthProvider wrapping
// import { AuthProvider } from './context/AuthContext';
// import { AppAuthGuard } from './components/app/AppAuthGuard';
import { AppLayout } from './components/app/AppLayout';
import { MarketingSite } from './MarketingSite';

// Existing toolkit tool components (kept for legacy references)
import { PromptPlayground } from './components/PromptPlayground';
import { AgentBuilder } from './components/AgentBuilder';

// Lazy-load app pages
const AppDashboard = React.lazy(() => import('./pages/app/AppDashboard'));
const AppJourney = React.lazy(() => import('./pages/app/AppJourney'));
const AppCurrentLevel = React.lazy(() => import('./pages/app/AppCurrentLevel'));
const AppToolkit = React.lazy(() => import('./pages/app/AppToolkit'));
const AppArtefacts = React.lazy(() => import('./pages/app/AppArtefacts'));
const AppCohort = React.lazy(() => import('./pages/app/AppCohort'));
const PromptLibraryPage = React.lazy(() => import('./pages/app/AppPromptLibrary'));
const AppPromptPlayground = React.lazy(() => import('./components/app/toolkit/AppPromptPlayground'));
const AppAgentBuilder = React.lazy(() => import('./components/app/toolkit/AppAgentBuilder'));
const AppWorkflowCanvas = React.lazy(() => import('./components/app/toolkit/AppWorkflowCanvas'));
const AppDashboardDesigner = React.lazy(() => import('./components/app/toolkit/AppDashboardDesigner'));
const AppAppEvaluator = React.lazy(() => import('./components/app/toolkit/AppAppEvaluator'));

function AppSuspense({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: 36, background: '#F7FAFC', minHeight: '100%' }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: '3px solid #E2E8F0',
              borderTopColor: '#38B2AC',
              borderRadius: '50%',
              animation: 'app-spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}

/**
 * Redirect old hash-based toolkit routes to new /app/toolkit/* paths.
 */
function HashRedirector() {
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    const redirectMap: Record<string, string> = {
      '#playground': '/app/toolkit/prompt-playground',
      '#workflow-designer': '/app/toolkit/workflow-canvas',
      '#agent-builder': '/app/toolkit/agent-builder',
      '#dashboard-design': '/app/toolkit/dashboard-designer',
      '#product-architecture': '/app/toolkit/app-builder',
      '#dashboard': '/app/dashboard',
    };
    const target = redirectMap[hash];
    if (target) {
      window.history.replaceState(null, '', target);
      window.location.reload();
    }
  }, [location]);

  return null;
}

/**
 * Login redirect: sends user to the marketing site auth flow,
 * saving the intended /app/* destination for after login.
 */
function LoginRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      sessionStorage.setItem('oxygy_auth_return_path', redirect);
    }
    // Send to marketing site login flow (hash-based dashboard shows AuthModal)
    window.location.replace('/#dashboard');
  }, []);

  return null;
}

function App() {
  return (
      <Routes>
        {/* App shell — all /app/* routes (auth disabled for dev) */}
        <Route
          path="/app"
          element={<AppLayout />}
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<AppSuspense><AppDashboard /></AppSuspense>} />
          <Route path="journey" element={<AppSuspense><AppJourney /></AppSuspense>} />
          <Route path="level" element={<AppSuspense><AppCurrentLevel /></AppSuspense>} />
          <Route path="toolkit" element={<AppSuspense><AppToolkit /></AppSuspense>} />
          <Route path="toolkit/prompt-playground" element={<AppSuspense><AppPromptPlayground /></AppSuspense>} />
          <Route path="toolkit/prompt-library" element={<AppSuspense><PromptLibraryPage /></AppSuspense>} />
          <Route path="toolkit/agent-builder" element={<AppSuspense><AppAgentBuilder /></AppSuspense>} />
          <Route path="toolkit/workflow-canvas" element={<AppSuspense><AppWorkflowCanvas /></AppSuspense>} />
          <Route path="toolkit/dashboard-designer" element={<AppSuspense><AppDashboardDesigner /></AppSuspense>} />
          <Route path="toolkit/app-builder" element={<AppSuspense><AppAppEvaluator /></AppSuspense>} />
          <Route path="toolkit/ai-app-evaluator" element={<AppSuspense><AppAppEvaluator /></AppSuspense>} />
          {/* Legacy routes — redirect to new paths */}
          <Route path="toolkit/workflow-designer" element={<Navigate to="/app/toolkit/workflow-canvas" replace />} />
          <Route path="toolkit/dashboard-design" element={<Navigate to="/app/toolkit/dashboard-designer" replace />} />
          <Route path="toolkit/product-architecture" element={<Navigate to="/app/toolkit/app-builder" replace />} />
          <Route path="artefacts" element={<AppSuspense><AppArtefacts /></AppSuspense>} />
          <Route path="artefacts/:artefactId" element={<AppSuspense><AppArtefacts /></AppSuspense>} />
          <Route path="cohort" element={<AppSuspense><AppCohort /></AppSuspense>} />
        </Route>

        {/* Login handler — bridges /login path to existing hash-based auth */}
        <Route path="/login" element={<LoginRedirect />} />

        {/* Marketing site — all other paths use existing hash-based routing */}
        <Route
          path="*"
          element={
            <>
              <HashRedirector />
              <MarketingSite />
            </>
          }
        />
      </Routes>
  );
}

export default App;
