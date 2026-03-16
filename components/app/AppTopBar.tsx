import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

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
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const label = getPageLabel(location.pathname);
  const streakDays = userProfile?.streakDays ?? 0;
  const fullName = user?.user_metadata?.full_name || userProfile?.fullName || 'User';
  const email = user?.email || '';
  const initial = (fullName?.[0] || 'U').toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

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

        {/* Avatar with dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
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
              cursor: 'pointer',
            }}
          >
            {initial}
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '12px 16px',
                minWidth: 200,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 20,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>
                {fullName}
              </div>
              {email && (
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  {email}
                </div>
              )}
              <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                style={{
                  fontSize: 13,
                  color: '#718096',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '4px 0',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#E53E3E';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#718096';
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
