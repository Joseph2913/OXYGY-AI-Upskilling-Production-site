import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, BookOpen, Settings, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', exact: true },
  { label: 'Organisations', icon: Building2, path: '/admin/organisations', exact: false },
  { label: 'Users', icon: Users, path: '/admin/users', exact: false },
  { label: 'Content', icon: BookOpen, path: '/admin/content', exact: true },
  { label: 'Settings', icon: Settings, path: '/admin/settings', exact: true },
];

export const SIDEBAR_COLLAPSED_WIDTH = 60;
export const SIDEBAR_EXPANDED_WIDTH = 240;

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, platformRole, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Admin';
  const firstName = fullName.split(' ')[0] || 'Admin';
  const initial = firstName[0]?.toUpperCase() || 'A';

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const width = expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const roleBadge = platformRole === 'super_admin'
    ? { bg: 'rgba(229, 62, 62, 0.13)', border: '1px solid rgba(229, 62, 62, 0.27)', color: '#FC8181', label: 'Super Admin' }
    : { bg: 'rgba(56, 178, 172, 0.13)', border: '1px solid rgba(56, 178, 172, 0.27)', color: '#4FD1C5', label: 'Oxygy Admin' };

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed', top: 0, left: 0, width, height: '100vh',
        background: '#1A202C', borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif", zIndex: 20,
        transition: 'width 0.2s ease', overflow: 'hidden',
      }}
    >
      {/* Section 1 — Logo (54px) */}
      <div style={{
        height: 54, padding: '0 0 0 16px',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxSizing: 'border-box', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#38B2AC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>
            O
          </div>
          <div style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease' }}>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              OXYGY
            </div>
            <span style={{
              background: '#E53E3E', color: '#FFFFFF', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4,
              textTransform: 'uppercase' as const,
            }}>
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Section 2 — User identity */}
      <div style={{
        padding: '12px 0 12px 14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#E53E3E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease' }}>
            <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
              {firstName}
            </div>
            <span style={{
              display: 'inline-block', background: roleBadge.bg,
              border: roleBadge.border, borderRadius: 20,
              padding: '2px 8px', fontSize: 10, fontWeight: 600,
              color: roleBadge.color, marginTop: 2,
            }}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3 — Navigation */}
      <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0 10px 19px', cursor: 'pointer', textDecoration: 'none',
                borderLeft: active ? '3px solid #38B2AC' : '3px solid transparent',
                background: active ? 'rgba(56, 178, 172, 0.10)' : 'transparent',
                transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)'; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={18} color={active ? '#4FD1C5' : 'rgba(255,255,255,0.40)'} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.50)',
                opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Section 4 — Bottom utilities */}
      <div style={{
        padding: '10px 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0,
      }}>
        {/* Switch to Learner View */}
        <div
          onClick={() => navigate('/app/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0 10px 19px', cursor: 'pointer',
            borderLeft: '3px solid transparent', transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ExternalLink size={18} color="rgba(255,255,255,0.30)" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.50)',
            opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
          }}>
            Switch to Learner View
          </span>
        </div>

        {/* Sign Out */}
        <div
          onClick={() => signOut()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0 10px 19px', cursor: 'pointer',
            borderLeft: '3px solid transparent', transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={18} color="rgba(255,255,255,0.30)" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.50)',
            opacity: expanded ? 1 : 0, transition: 'opacity 0.15s ease',
          }}>
            Sign Out
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
