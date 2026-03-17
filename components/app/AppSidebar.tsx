import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, BookOpen, Wrench, Folder, Users, Settings, Shield } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useOrg } from '../../context/OrgContext';

const LEVEL_SHORT_NAMES: Record<number, string> = {
  1: 'Fundamentals',
  2: 'Applied',
  3: 'Systemic',
  4: 'Dashboards',
  5: 'Applications',
};

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/app/dashboard' },
  { label: 'My Journey', icon: Map, path: '/app/journey' },
  { label: 'Current Level', icon: BookOpen, path: '/app/level' },
  { label: 'My Toolkit', icon: Wrench, path: '/app/toolkit' },
  { label: 'My Artefacts', icon: Folder, path: '/app/artefacts' },
  { label: 'My Cohort', icon: Users, path: '/app/cohort' },
];

export const SIDEBAR_COLLAPSED_WIDTH = 60;
export const SIDEBAR_EXPANDED_WIDTH = 240;

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useAppContext();
  const { isAdmin } = useOrg();
  const [expanded, setExpanded] = useState(false);

  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';
  const initial = firstName[0]?.toUpperCase() || 'U';
  const level = userProfile?.currentLevel ?? 1;
  const levelName = LEVEL_SHORT_NAMES[level] || 'Fundamentals';

  const isActive = (path: string) => {
    if (path === '/app/toolkit') {
      return location.pathname.startsWith('/app/toolkit');
    }
    if (path === '/app/journey') {
      return location.pathname.startsWith('/app/journey');
    }
    return location.pathname === path;
  };

  const width = expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width,
        height: '100vh',
        background: '#1A202C',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        zIndex: 20,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Section 1 — Logo (54px to match top bar) */}
      <div
        style={{
          height: 54,
          padding: '0 0 0 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#38B2AC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            O
          </div>
          <div
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
            >
              OXYGY
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
              }}
            >
              AI Upskilling
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — User identity */}
      <div
        style={{
          padding: '12px 0 12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#38B2AC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1A202C',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div
            style={{
              opacity: expanded ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 14,
                lineHeight: 1.3,
              }}
            >
              {firstName}
            </div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(247, 232, 164, 0.13)',
                border: '1px solid rgba(247, 232, 164, 0.27)',
                borderRadius: 20,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                color: '#F7E8A4',
                marginTop: 2,
              }}
            >
              Level {level} · {levelName}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — Primary nav */}
      <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0 10px 19px',
                cursor: 'pointer',
                textDecoration: 'none',
                borderLeft: active
                  ? '3px solid #38B2AC'
                  : '3px solid transparent',
                background: active
                  ? 'rgba(56, 178, 172, 0.10)'
                  : 'transparent',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    'transparent';
                }
              }}
            >
              <Icon
                size={18}
                color={active ? '#4FD1C5' : 'rgba(255,255,255,0.40)'}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.50)',
                  opacity: expanded ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        {isAdmin && (() => {
          const adminActive = location.pathname === '/app/admin';
          return (
            <Link
              to="/app/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0 10px 19px',
                cursor: 'pointer',
                textDecoration: 'none',
                borderLeft: adminActive ? '3px solid #38B2AC' : '3px solid transparent',
                background: adminActive ? 'rgba(56, 178, 172, 0.10)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!adminActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
              }}
              onMouseLeave={(e) => {
                if (!adminActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Shield
                size={18}
                color={adminActive ? '#4FD1C5' : 'rgba(255,255,255,0.40)'}
                style={{ flexShrink: 0 }}
              />
              <span style={{
                fontSize: 14,
                fontWeight: adminActive ? 600 : 400,
                color: adminActive ? '#FFFFFF' : 'rgba(255,255,255,0.50)',
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}>
                Admin
              </span>
            </Link>
          );
        })()}
      </div>

      {/* Section 4 — Bottom utilities */}
      <div
        style={{
          padding: '10px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0 10px 19px',
            cursor: 'pointer',
            borderLeft: '3px solid transparent',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'rgba(255, 255, 255, 0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <Settings size={18} color="rgba(255,255,255,0.30)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.30)',
              opacity: expanded ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            Settings
          </span>
        </div>
      </div>
    </div>
  );
};
