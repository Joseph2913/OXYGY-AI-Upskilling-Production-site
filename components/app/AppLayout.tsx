import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { OrgProvider } from '../../context/OrgContext';
import { AppSidebar, SIDEBAR_COLLAPSED_WIDTH } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import LearningPlanGate from './LearningPlanGate';

export const AppLayout: React.FC = () => {
  return (
    <AppProvider>
      <OrgProvider>
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
              <LearningPlanGate>
                <Outlet />
              </LearningPlanGate>
            </div>
          </div>
        </div>
      </OrgProvider>
    </AppProvider>
  );
};
