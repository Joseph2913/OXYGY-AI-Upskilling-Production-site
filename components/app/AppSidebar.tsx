import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, BookOpen, Wrench, Folder, Users, Settings, Shield, GraduationCap } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/app/dashboard' },
  { label: 'My Journey', icon: Map, path: '/app/journey' },
  { label: 'Current Level', icon: BookOpen, path: '/app/level' }, // path overridden dynamically below
  { label: 'My Toolkit', icon: Wrench, path: '/app/toolkit' },
  { label: 'Learning Coach', icon: GraduationCap, path: '/app/toolkit/learning-coach' },
  { label: 'My Artefacts', icon: Folder, path: '/app/artefacts' },
  { label: 'My Cohort', icon: Users, path: '/app/cohort' },
];

export const SIDEBAR_COLLAPSED_WIDTH = 60;
export const SIDEBAR_EXPANDED_WIDTH = 240;

const HIDE_SCROLLBAR_CSS = `
.sidebar-nav-scroll::-webkit-scrollbar { display: none; }
.sidebar-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useOrg();
  const { userProfile } = useAppContext();
  const { signOut } = useAuth();
  const level = userProfile?.current_level ?? 1;
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/app/toolkit/learning-coach') {
      return location.pathname === '/app/toolkit/learning-coach';
    }
    if (path === '/app/toolkit') {
      return location.pathname.startsWith('/app/toolkit') && location.pathname !== '/app/toolkit/learning-coach';
    }
    if (path === '/app/journey') {
      return location.pathname.startsWith('/app/journey');
    }
    return location.pathname === path;
  };

  const width = expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <>
    <style>{HIDE_SCROLLBAR_CSS}</style>
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

      {/* Section 2 — Primary nav */}
      <div
        className="sidebar-nav-scroll"
        style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}
      >
        {NAV_ITEMS.map((item) => {
          const resolvedPath = item.path;
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={resolvedPath}
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
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0 10px 19px',
            cursor: 'pointer',
            borderLeft: '3px solid transparent',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
            background: 'none',
            border: 'none',
            fontFamily: 'inherit',
            width: '100%',
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
        </button>
      </div>
    </div>

    {/* Settings slide-in panel */}
    {settingsOpen && (
      <>
        <div
          onClick={() => setSettingsOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100 }}
        />
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
          background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
          zIndex: 101, display: 'flex', flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C' }}>Settings</div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Manage your account and preferences</div>
            </div>
            <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#A0AEC0', padding: 4, lineHeight: 1, fontFamily: 'inherit' }}>{'\u00D7'}</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Account section */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Edit Profile & Regenerate Plan', desc: 'Update your role, goals, and availability', action: () => { setSettingsOpen(false); window.location.href = '/app/journey'; } },
                  { label: 'Sign Out', desc: 'Sign out of your Oxygy account', action: () => { setSettingsOpen(false); signOut(); } },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F7FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#718096' }}>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications section */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Streak reminders', desc: 'Daily nudge to keep your learning streak alive' },
                  { label: 'Cohort activity', desc: 'When colleagues earn points or complete levels' },
                  { label: 'Project feedback', desc: 'When your submitted project is reviewed' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1A202C' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: '#718096' }}>{item.desc}</div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: '#E2E8F0', cursor: 'not-allowed', flexShrink: 0, position: 'relative' as const }}>
                      <div style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: '50%', background: '#A0AEC0' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 8, fontStyle: 'italic' }}>Notification preferences coming soon</div>
            </div>

            {/* About section */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>About</div>
              <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F7FAFC' }}>
                <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Platform</span><span style={{ color: '#1A202C', fontWeight: 500 }}>Oxygy AI Upskilling</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Support</span><span style={{ color: '#38B2AC', fontWeight: 500 }}>legal@oxygyconsulting.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
};
