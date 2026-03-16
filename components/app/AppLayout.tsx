import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../../context/AppContext';
import { OrgProvider } from '../../context/OrgContext';
import { AppSidebar, SIDEBAR_COLLAPSED_WIDTH } from './AppSidebar';
import { AppTopBar } from './AppTopBar';

export const AppLayout: React.FC = () => {
  return (
    <AppProvider>
      <OrgProvider>
        <OnboardingGate>
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <AppSidebar />
            <div style={{ marginLeft: SIDEBAR_COLLAPSED_WIDTH }}>
              <AppTopBar />
              <div
                style={{
                  background: '#F7FAFC',
                  minHeight: 'calc(100vh - 54px)',
                }}
              >
                <Outlet />
              </div>
            </div>
          </div>
        </OnboardingGate>
      </OrgProvider>
    </AppProvider>
  );
};

/** Redirects to /app/onboarding if profile.onboarding_completed is false
 *  AND the user has no existing profile data (role, aiExperience).
 *  Existing users who already filled in their profile are treated as onboarded.
 *  Also redirects AWAY from /app/onboarding if user is already onboarded. */
const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, loading } = useAppContext();
  const location = useLocation();

  // Don't gate while loading
  if (loading) {
    return <>{children}</>;
  }

  const isOnboardingPage = location.pathname === '/app/onboarding';
  const isOnboarded = userProfile?.onboardingCompleted;
  const hasExistingData = !!(userProfile?.role || userProfile?.aiExperience || userProfile?.ambition);

  // If user is already onboarded (or has existing data), redirect AWAY from onboarding
  if (isOnboardingPage && (isOnboarded || hasExistingData)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // If user needs onboarding and is NOT on the onboarding page, redirect TO it
  if (!isOnboardingPage && userProfile && !isOnboarded && !hasExistingData) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <>{children}</>;
};
