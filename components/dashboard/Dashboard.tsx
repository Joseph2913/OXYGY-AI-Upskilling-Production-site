import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMobileNav } from './DashboardMobileNav';
import { DashboardProfileNudge } from './DashboardProfileNudge';
import { MyProfile } from './sections/MyProfile';
import { MyProgress } from './sections/MyProgress';
import { ApplicationInsights } from './sections/ApplicationInsights';
import { PromptLibrary } from './sections/PromptLibrary';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../lib/database';
import { SECTION_META, DEFAULT_PROFILE } from '../../data/dashboard-content';
import type { DashboardSection, UserProfile } from '../../data/dashboard-types';

type Layout = 'desktop' | 'tablet' | 'mobile';

function getLayout(width: number): Layout {
  if (width >= 1200) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [activeSection, setActiveSection] = useState<DashboardSection>('profile');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileLoading, setProfileLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sectionKey, setSectionKey] = useState(0);

  const layout = getLayout(windowWidth);
  const sidebarWidth = layout === 'desktop' ? 240 : layout === 'tablet' ? 48 : 0;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch profile from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    setProfileLoading(true);
    getProfile(userId).then((data) => {
      if (data) setProfile(data);
      setProfileLoading(false);
    });
  }, [userId]);


  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleSectionChange = useCallback((section: DashboardSection) => {
    setActiveSection(section);
    setSectionKey((k) => k + 1);
  }, []);

  const meta = SECTION_META[activeSection];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F7FAFC',
        paddingTop: 68,
        opacity: profileLoading ? 0.6 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* Sidebar (desktop/tablet) */}
      {layout !== 'mobile' && (
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          profile={profile}
          authUser={user}
          layout={layout}
        />
      )}

      {/* Mobile bottom tab bar */}
      {layout === 'mobile' && (
        <DashboardMobileNav
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}

      {/* Main content area — full width */}
      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 200ms ease',
          paddingBottom: layout === 'mobile' ? 80 : 0,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: layout === 'mobile' ? '16px 16px' : '20px 40px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#1A202C',
            }}
          >
            {meta?.heading}
          </h2>
          {meta?.subheading && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: '#718096',
                lineHeight: 1.5,
              }}
            >
              {meta.subheading}
            </p>
          )}
        </div>

        {/* Content body — full width, no maxWidth constraint */}
        <div
          style={{
            padding: layout === 'mobile' ? '20px 16px' : '32px 40px',
          }}
        >
          {/* Profile nudge banner */}
          <DashboardProfileNudge onNavigateToProfile={() => handleSectionChange('profile')} />

          {/* Active section */}
          <div key={sectionKey} className="animate-dash-section-enter">
            {activeSection === 'profile' && (
              <MyProfile showToast={showToast} />
            )}
            {activeSection === 'progress' && (
              <MyProgress showToast={showToast} onNavigateToProfile={() => handleSectionChange('profile')} />
            )}
            {activeSection === 'insights' && (
              <ApplicationInsights />
            )}
            {activeSection === 'prompt-library' && (
              <PromptLibrary showToast={showToast} />
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className="animate-toast-enter"
          style={{
            position: 'fixed',
            bottom: layout === 'mobile' ? 80 : 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1A202C',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 300,
            whiteSpace: 'nowrap',
          }}
        >
          {toast.type === 'success' ? (
            <Check size={16} color="#38B2AC" />
          ) : (
            <AlertCircle size={16} color="#FC8181" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};
