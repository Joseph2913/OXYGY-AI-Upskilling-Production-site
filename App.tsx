import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppAuthGuard } from './components/app/AppAuthGuard';
import { AppLayout } from './components/app/AppLayout';
import { ScrollToTop } from './components/app/ScrollToTop';
import { MarketingSite } from './MarketingSite';

// Existing toolkit tool components (kept for legacy references)
import { PromptPlayground } from './components/PromptPlayground';
import { AgentBuilder } from './components/AgentBuilder';

/**
 * Wrapper around React.lazy that retries failed dynamic imports.
 * Handles post-deploy chunk hash mismatches by retrying, then reloading.
 */
function lazyRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((err) => {
      if (retries > 0) {
        return new Promise<{ default: T }>((resolve) => {
          setTimeout(() => resolve(lazyRetry(factory, retries - 1) as unknown as { default: T }), 1000);
        });
      }
      console.error('[lazyRetry] Chunk load failed after retries:', err);
      window.location.reload();
      return factory(); // never resolves — page reloads first
    })
  );
}

// Lazy-load app pages
const AppDashboard = lazyRetry(() => import('./pages/app/AppDashboard'));
const AppJourney = lazyRetry(() => import('./pages/app/AppJourney'));
const AppProjectProof = lazyRetry(() => import('./pages/app/AppProjectProof'));
const AppCurrentLevel = lazyRetry(() => import('./pages/app/AppCurrentLevel'));
const AppMyPlan = lazyRetry(() => import('./pages/app/AppMyPlan'));
const AppToolkit = lazyRetry(() => import('./pages/app/AppToolkit'));
const AppArtefacts = lazyRetry(() => import('./pages/app/AppArtefacts'));
const AppWorkspace = lazyRetry(() => import('./pages/app/AppWorkspace'));
const AppCohort = lazyRetry(() => import('./pages/app/AppCohort'));
const PromptLibraryPage = lazyRetry(() => import('./pages/app/AppPromptLibrary'));
const AppPromptPlayground = lazyRetry(() => import('./components/app/toolkit/AppPromptPlayground'));
const AppAgentBuilder = lazyRetry(() => import('./components/app/toolkit/AppAgentBuilder'));
const AppWorkflowCanvas = lazyRetry(() => import('./components/app/toolkit/AppWorkflowCanvas'));
const AppDashboardDesigner = lazyRetry(() => import('./components/app/toolkit/AppDashboardDesigner'));
const AppAppEvaluator = lazyRetry(() => import('./components/app/toolkit/AppAppEvaluator'));
const AppLearningCoach = lazyRetry(() => import('./components/app/toolkit/AppLearningCoach'));
const BuildGuideView = lazyRetry(() => import('./pages/app/BuildGuideView'));

const AudioReview = lazyRetry(() => import('./pages/app/AudioReview'));
const AppAdmin = lazyRetry(() => import('./pages/app/AppAdmin'));
const JoinPage = lazyRetry(() => import('./pages/app/JoinPage'));
const AppJoinCode = lazyRetry(() => import('./pages/app/AppJoinCode'));
const OrgCheckGuard = lazyRetry(() => import('./components/app/OrgCheckGuard'));

// Admin shell (PRD-10/11 — platform administration)
const AdminAuthGuard = lazyRetry(() => import('./components/admin/AdminAuthGuard'));
const AdminLayout = lazyRetry(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazyRetry(() => import('./pages/admin/AdminDashboard'));
const AdminOrgList = lazyRetry(() => import('./pages/admin/AdminOrgList'));
const AdminOrgCreate = lazyRetry(() => import('./pages/admin/AdminOrgCreate'));
const AdminOrgDetail = lazyRetry(() => import('./pages/admin/AdminOrgDetail'));
const AdminOrgEdit = lazyRetry(() => import('./pages/admin/AdminOrgEdit'));
const AdminUsers = lazyRetry(() => import('./pages/admin/AdminUsers'));
const AdminContent = lazyRetry(() => import('./pages/admin/AdminContent'));
const AdminSettings = lazyRetry(() => import('./pages/admin/AdminSettings'));

// Login page (renders AuthModal as full-page view)
const LoginPage = lazyRetry(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));

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
 * Also handles post-OAuth redirect: if user lands on / after sign-in,
 * redirect them to their intended destination.
 */
function HashRedirector() {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;

    // Post-OAuth redirect: user landed on / with tokens in hash
    // Once auth loads and user is signed in, redirect to stored return path
    if (!loading && user) {
      const returnPath = sessionStorage.getItem('oxygy_auth_return_path');
      if (returnPath) {
        sessionStorage.removeItem('oxygy_auth_return_path');
        window.location.href = returnPath;
        return;
      }
    }

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
  }, [location, user, loading]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin shell — platform administration (requires oxygy_admin or super_admin) */}
        <Route
          path="/admin"
          element={
            <AppSuspense>
              <AdminAuthGuard>
                <AdminLayout />
              </AdminAuthGuard>
            </AppSuspense>
          }
        >
          <Route index element={<AppSuspense><AdminDashboardPage /></AppSuspense>} />
          <Route path="organisations" element={<AppSuspense><AdminOrgList /></AppSuspense>} />
          <Route path="organisations/new" element={<AppSuspense><AdminOrgCreate /></AppSuspense>} />
          <Route path="organisations/:id" element={<AppSuspense><AdminOrgDetail /></AppSuspense>} />
          <Route path="organisations/:id/edit" element={<AppSuspense><AdminOrgEdit /></AppSuspense>} />
          <Route path="users" element={<AppSuspense><AdminUsers /></AppSuspense>} />
          <Route path="content" element={<AppSuspense><AdminContent /></AppSuspense>} />
          <Route path="settings" element={<AppSuspense><AdminSettings /></AppSuspense>} />
        </Route>

        {/* Code entry page — auth-protected but outside OrgCheckGuard */}
        <Route
          path="/app/join"
          element={
            <AppAuthGuard>
              <AppSuspense><AppJoinCode /></AppSuspense>
            </AppAuthGuard>
          }
        />

        {/* App shell — all /app/* routes (protected by auth guard + org check) */}
        <Route
          path="/app"
          element={
            <AppAuthGuard>
              <AppSuspense>
                <OrgCheckGuard>
                  <AppLayout />
                </OrgCheckGuard>
              </AppSuspense>
            </AppAuthGuard>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<AppSuspense><AppDashboard /></AppSuspense>} />
          <Route path="journey" element={<AppSuspense><AppJourney /></AppSuspense>} />
          <Route path="journey/project/:level" element={<AppSuspense><AppProjectProof /></AppSuspense>} />
          <Route path="level" element={<AppSuspense><AppCurrentLevel /></AppSuspense>} />
          <Route path="my-plan" element={<AppSuspense><AppMyPlan /></AppSuspense>} />

          {/* Workspace — combined Toolkit + Artefacts */}
          <Route path="workspace" element={<AppSuspense><AppWorkspace /></AppSuspense>} />
          <Route path="workspace/:artefactId" element={<AppSuspense><AppWorkspace /></AppSuspense>} />

          {/* Legacy toolkit index redirects to workspace */}
          <Route path="toolkit" element={<Navigate to="/app/workspace" replace />} />
          <Route path="toolkit/prompt-playground" element={<AppSuspense><AppPromptPlayground /></AppSuspense>} />
          <Route path="toolkit/prompt-library" element={<AppSuspense><PromptLibraryPage /></AppSuspense>} />
          <Route path="toolkit/agent-builder" element={<AppSuspense><AppAgentBuilder /></AppSuspense>} />
          <Route path="toolkit/workflow-canvas" element={<AppSuspense><AppWorkflowCanvas /></AppSuspense>} />
          <Route path="toolkit/dashboard-designer" element={<AppSuspense><AppDashboardDesigner /></AppSuspense>} />
          <Route path="toolkit/app-builder" element={<AppSuspense><AppAppEvaluator /></AppSuspense>} />
          <Route path="toolkit/ai-app-evaluator" element={<AppSuspense><AppAppEvaluator /></AppSuspense>} />
          <Route path="toolkit/learning-coach" element={<AppSuspense><AppLearningCoach /></AppSuspense>} />
          {/* Legacy routes — redirect to new paths */}
          <Route path="toolkit/workflow-designer" element={<Navigate to="/app/toolkit/workflow-canvas" replace />} />
          <Route path="toolkit/dashboard-design" element={<Navigate to="/app/toolkit/dashboard-designer" replace />} />
          <Route path="toolkit/product-architecture" element={<Navigate to="/app/toolkit/app-builder" replace />} />
          {/* Legacy artefacts routes redirect to workspace */}
          <Route path="artefacts" element={<Navigate to="/app/workspace" replace />} />
          <Route path="artefacts/:artefactId" element={<Navigate to="/app/workspace" replace />} />
          <Route path="artefacts/:id/build-guide" element={<AppSuspense><BuildGuideView /></AppSuspense>} />
          <Route path="cohort" element={<AppSuspense><AppCohort /></AppSuspense>} />
          <Route path="audio-review" element={<AppSuspense><AudioReview /></AppSuspense>} />
          <Route path="admin" element={<AppSuspense><AppAdmin /></AppSuspense>} />

        </Route>

        {/* Join org via invite link */}
        <Route path="/join/:slug" element={<AppSuspense><JoinPage /></AppSuspense>} />

        {/* Login page — full-page sign-in view */}
        <Route path="/login" element={<AppSuspense><LoginPage /></AppSuspense>} />

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
    </AuthProvider>
  );
}

export default App;
