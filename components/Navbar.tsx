import React, { useState, useEffect, useRef } from 'react';
import { Home, Menu, X, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

const ARTIFACT_HASHES = new Set(['#ai-tools', '#user-journey', '#case-studies', '#engagement-model', '#dashboard', '#playground', '#agent-builder', '#workflow-designer', '#product-architecture', '#dashboard-design']);

/* Thin vertical divider between nav items */
const Divider = () => (
  <div
    className="flex-shrink-0"
    style={{ width: '1px', height: '20px', backgroundColor: '#D1D5DB' }}
  />
);

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isSignedIn = !!user;
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const [currentHash, setCurrentHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  // Close avatar menu on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [avatarMenuOpen]);

  const isHome = !currentHash || currentHash === '#';
  const isOnAiTools = currentHash === '#ai-tools';
  const isOnUserJourney = currentHash === '#user-journey';
  const isOnCaseStudies = currentHash === '#case-studies';
  const isOnEngagementModel = currentHash === '#engagement-model';
  const isOnDashboard = currentHash === '#dashboard';

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.hash && window.location.hash !== '#') {
      window.location.hash = '';
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  const scrollToSection = (id: string) => {
    const doScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return true;
      }
      return false;
    };

    if (window.location.hash && window.location.hash !== '#') {
      window.location.hash = '';
      let attempts = 0;
      const tryScroll = () => {
        if (doScroll() || attempts >= 10) return;
        attempts++;
        setTimeout(tryScroll, 100);
      };
      setTimeout(tryScroll, 150);
    } else {
      doScroll();
    }
    setMobileOpen(false);
  };

  /* Active = dark teal pill, inactive = transparent */
  const pillActive = 'bg-[#2C9A94] text-white';
  const pillInactive = 'text-[#4A5568] hover:text-[#2D3748]';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white',
      )}
      style={{ height: '68px' }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full"
        style={{ maxWidth: '1200px', padding: '0 24px' }}
      >
        {/* Left — Logo */}
        <a
          href="#"
          onClick={goHome}
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src="/logos/oxygy-logo-darkgray-teal.png"
            alt="OXYGY"
            style={{ height: '36px', width: 'auto' }}
          />
        </a>

        {/* Center — Desktop Nav Bar (rounded container) */}
        <div
          className="hidden lg:flex items-center gap-1.5"
          style={{
            backgroundColor: '#F0F2F5',
            borderRadius: '28px',
            padding: '5px 6px',
          }}
        >
          {/* Home icon button */}
          <a
            href="#"
            onClick={goHome}
            className={cn(
              'flex items-center justify-center rounded-full transition-all duration-150 flex-shrink-0',
              isHome ? pillActive : 'bg-[#E2E6EB] text-[#4A5568] hover:bg-[#D1D5DB]',
            )}
            style={{ width: '36px', height: '36px' }}
            title="Home"
          >
            <Home size={17} />
          </a>

          <Divider />

          {/* AI Tools — standalone link to showcase page */}
          <a
            href="#ai-tools"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnAiTools ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            AI Tools
          </a>

          <Divider />

          {/* Learner Journey — standalone */}
          <a
            href="#user-journey"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnUserJourney ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Learner Journey
          </a>

          <Divider />

          {/* Engagement Model — standalone */}
          <a
            href="#engagement-model"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnEngagementModel ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Engagement Model
          </a>

          <Divider />

          {/* Case Studies */}
          <a
            href="#case-studies"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnCaseStudies ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Case Studies
          </a>

        </div>

        {/* Right — Dashboard + Contact Us + Mobile Toggle */}
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              {/* "My Dashboard →" pill CTA */}
              <a
                href="/app/dashboard"
                className="hidden sm:flex items-center transition-all duration-200"
                style={{
                  border: '1px solid #1A202C',
                  borderRadius: 24,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1A202C',
                  background: 'transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap' as const,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#1A202C';
                  (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#1A202C';
                }}
              >
                My Dashboard →
              </a>

              {/* User avatar with dropdown menu */}
              <div ref={avatarMenuRef} style={{ position: 'relative' }} className="hidden sm:block flex-shrink-0">
                <button
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                  className="flex items-center justify-center rounded-full transition-all duration-200"
                  style={{
                    width: 40,
                    height: 40,
                    background: '#38B2AC',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title={user?.user_metadata?.full_name || 'Account'}
                >
                  {(user?.user_metadata?.full_name?.[0] || 'U').toUpperCase()}
                </button>
                {avatarMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 48,
                    right: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    minWidth: 180,
                    padding: '6px 0',
                    zIndex: 100,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {/* User info */}
                    <div style={{
                      padding: '10px 16px 8px',
                      borderBottom: '1px solid #F7FAFC',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>
                        {user?.user_metadata?.full_name || 'User'}
                      </div>
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 1 }}>
                        {user?.email || ''}
                      </div>
                    </div>
                    {/* My Dashboard */}
                    <a
                      href="/app/dashboard"
                      onClick={() => setAvatarMenuOpen(false)}
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1A202C',
                        textDecoration: 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F7FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      My Dashboard
                    </a>
                    {/* Sign Out */}
                    <button
                      onClick={async () => {
                        setAvatarMenuOpen(false);
                        await signOut();
                        window.location.href = '/';
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#E53E3E',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <a
              href="/login"
              className="hidden sm:flex items-center transition-all duration-200"
              style={{
                border: '1px solid #1A202C',
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: '#1A202C',
                background: 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap' as const,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#1A202C';
                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#1A202C';
              }}
            >
              Sign In
            </a>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X size={22} color="#2D3748" />
            ) : (
              <Menu size={22} color="#2D3748" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div
          className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg"
          style={{ maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {/* Home */}
            <a
              href="#"
              onClick={goHome}
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isHome ? 'bg-[#E6FFFA] text-[#2C9A94]' : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
            >
              <Home size={16} />
              <span>Home</span>
            </a>

            <div className="h-px bg-gray-100 my-2" />

            <a
              href="#ai-tools"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isOnAiTools
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              <span>AI Tools</span>
            </a>

            <a
              href="#user-journey"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isOnUserJourney
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              <span>Learner Journey</span>
            </a>

            <a
              href="#engagement-model"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isOnEngagementModel
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              <span>Engagement Model</span>
            </a>

            <a
              href="#case-studies"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isOnCaseStudies
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              Case Studies
            </a>

            {/* Dashboard / Sign In — auth-aware */}
            {isSignedIn ? (
              <>
                <a
                  href="/app/dashboard"
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                    isOnDashboard
                      ? 'bg-[#E6FFFA] text-[#2C9A94]'
                      : 'hover:bg-[#F7FAFC] text-[#2D3748]',
                  )}
                  style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <User size={16} />
                  <span>My Dashboard</span>
                </a>
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    await signOut();
                    window.location.href = '/';
                  }}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-[#FFF5F5]"
                  style={{
                    fontSize: '14px', fontWeight: 500, color: '#E53E3E',
                    background: 'none', border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <User size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-[#F7FAFC] text-[#2D3748]"
                style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                onClick={() => setMobileOpen(false)}
              >
                <User size={16} />
                <span>Sign In</span>
              </a>
            )}

          </div>
        </div>
      )}
    </nav>
  );
};
