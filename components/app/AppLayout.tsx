import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { AppSidebar, SIDEBAR_COLLAPSED_WIDTH } from './AppSidebar';
import { AppTopBar } from './AppTopBar';

export const AppLayout: React.FC = () => {
  return (
    <AppProvider>
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
    </AppProvider>
  );
};
