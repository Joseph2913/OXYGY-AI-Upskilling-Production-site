import React, { useState } from 'react';
import { User, BarChart2, Lightbulb, Library, ArrowLeft, LogOut } from 'lucide-react';
import { SIDEBAR_NAV_ITEMS } from '../../data/dashboard-content';
import { signOut } from '../../context/AuthContext';
import type { DashboardSection, UserProfile } from '../../data/dashboard-types';

const ICON_MAP: Record<string, React.FC<{ size?: number; strokeWidth?: number }>> = {
  User, BarChart2, Lightbulb, Library,
};

interface Props {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  profile: UserProfile;
  layout: 'desktop' | 'tablet';
}

export const DashboardSidebar: React.FC<Props> = ({
  activeSection,
  onSectionChange,
  profile,
  layout,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const isCompact = layout === 'tablet';
  const width = isCompact ? 48 : 240;

  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <aside
      style={{
        position: 'fixed',
        top: 68,
        left: 0,
        bottom: 0,
        width,
        backgroundColor: '#1A202C',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
      }}
    >
      {/* User identity block */}
      <div style={{ padding: isCompact ? '16px 4px' : '20px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: 'center',
            gap: isCompact ? 0 : 12,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#38B2AC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>{initials}</span>
          </div>
          {/* Name + badge */}
          {!isCompact && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile.fullName || 'New User'}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  borderRadius: 20,
                  backgroundColor: '#2D3748',
                  color: '#A0AEC0',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  letterSpacing: '0.04em',
                }}
              >
                Learner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#2D3748', margin: '0 0' }} />

      {/* Navigation items */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          const isActive = activeSection === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onSectionChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="dash-focus"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 0 : 12,
                  justifyContent: isCompact ? 'center' : 'flex-start',
                  width: '100%',
                  padding: isCompact ? '12px 0' : '12px 20px',
                  border: 'none',
                  background: isActive || isHovered ? '#2D3748' : 'transparent',
                  borderLeft: isActive ? '3px solid #38B2AC' : '3px solid transparent',
                  color: isActive ? '#FFFFFF' : isHovered ? '#FFFFFF' : '#A0AEC0',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 150ms ease, color 150ms ease',
                  textAlign: 'left',
                }}
              >
                {Icon && (
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                  />
                )}
                {!isCompact && <span>{item.label}</span>}
              </button>

              {/* Tooltip for compact mode */}
              {isCompact && isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: 52,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#1A202C',
                    color: '#FFFFFF',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 200,
                    pointerEvents: 'none',
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#2D3748' }} />

      {/* Sign Out */}
      <button
        onClick={signOut}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? 0 : 8,
          justifyContent: isCompact ? 'center' : 'flex-start',
          padding: isCompact ? '12px 0' : '12px 20px',
          color: '#718096',
          fontSize: 13,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          transition: 'color 150ms ease',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#FC8181'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; }}
        title="Sign Out"
      >
        <LogOut size={16} strokeWidth={1.5} />
        {!isCompact && <span>Sign Out</span>}
      </button>

      {/* Back to Site */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = '';
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? 0 : 8,
          justifyContent: isCompact ? 'center' : 'flex-start',
          padding: isCompact ? '16px 0' : '16px 20px',
          color: '#718096',
          fontSize: 13,
          textDecoration: 'none',
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; }}
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        {!isCompact && <span>Back to Site</span>}
      </a>
    </aside>
  );
};
