import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ROUTE_LABELS: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/journey': 'My Journey',
  '/app/level': 'Current Level',
  '/app/toolkit': 'My Toolkit',
  '/app/artefacts': 'My Artefacts',
  '/app/cohort': 'My Cohort',
};

function getPageLabel(pathname: string): string {
  if (pathname.startsWith('/app/toolkit')) return 'My Toolkit';
  return ROUTE_LABELS[pathname] || 'Dashboard';
}

export const AppTopBar: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useAppContext();

  const label = getPageLabel(location.pathname);
  const streakDays = userProfile?.streakDays ?? 0;
  const initial = (userProfile?.fullName?.[0] || 'U').toUpperCase();

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        height: 54,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Left — Breadcrumb */}
      <span style={{ fontSize: 13, color: '#718096', fontWeight: 400 }}>
        {label}
      </span>

      {/* Right — User strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Streak */}
        {streakDays > 0 && (
          <span style={{ fontSize: 13, color: '#718096' }}>
            🔥{' '}
            <span style={{ fontWeight: 700, color: '#1A202C' }}>
              {streakDays}
            </span>{' '}
            day streak
          </span>
        )}

        {/* Divider — only show if streak is visible */}
        {streakDays > 0 && (
          <div
            style={{
              width: 1,
              height: 18,
              background: '#E2E8F0',
            }}
          />
        )}

        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#38B2AC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A202C',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initial}
        </div>
      </div>
    </div>
  );
};
