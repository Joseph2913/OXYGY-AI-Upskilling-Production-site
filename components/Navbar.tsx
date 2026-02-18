import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home, Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

const AI_TOOLS = [
  { level: 1, emoji: '\uD83C\uDFAF', label: 'Prompt Engineering Fundamentals', href: '#playground' },
  { level: 2, emoji: '\uD83E\uDD16', label: 'Build Your First AI Agent', href: '#agent-builder' },
  { level: 3, emoji: '\uD83D\uDDFA\uFE0F', label: 'Workflow Mapping & Design', href: '#workflow-designer' },
  { level: 4, emoji: '\uD83D\uDCA1', label: 'Dashboard Design Thinking', href: '#dashboard-design' },
  { level: 5, emoji: '\uD83C\uDFD7\uFE0F', label: 'Product Architecture Sprint', href: '#product-architecture' },
];

const ARTIFACT_HASHES = new Set([...AI_TOOLS.map((t) => t.href), '#learning-pathway', '#user-journey', '#case-studies']);

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const isHome = !currentHash || currentHash === '#';
  const isOnAiTool = AI_TOOLS.some((t) => t.href === currentHash);
  const isOnLearningPlan = currentHash === '#learning-pathway';
  const isOnUserJourney = currentHash === '#user-journey';

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.hash && window.location.hash !== '#') {
      window.location.hash = '';
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const scrollToSection = (id: string) => {
    if (window.location.hash && window.location.hash !== '#') {
      window.location.hash = '';
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const openDropdown = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };
  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
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
          {/* Home icon button — nested darker pill */}
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

          {/* AI Tools Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button
              className={cn(
                'flex items-center gap-1.5 px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap',
                isOnAiTool ? pillActive : pillInactive,
              )}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              AI Tools
              <ChevronDown
                size={14}
                className={cn(
                  'transition-transform duration-150',
                  dropdownOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Dropdown panel */}
            <div
              className={cn(
                'absolute top-full left-1/2 pt-3 transition-all duration-150',
                dropdownOpen
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-1 pointer-events-none',
              )}
              style={{
                transform: dropdownOpen
                  ? 'translateX(-50%) translateY(0)'
                  : 'translateX(-50%) translateY(-4px)',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  minWidth: '300px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px 8px',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#A0AEC0',
                    }}
                  >
                    Interactive Tools
                  </span>
                </div>

                {AI_TOOLS.map((tool) => (
                  <a
                    key={tool.level}
                    href={tool.href}
                    className="flex items-center gap-3 transition-colors duration-150 hover:bg-[#F7FAFC] hover:text-[#38B2AC]"
                    style={{
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#2D3748',
                      textDecoration: 'none',
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span
                      className="shrink-0 flex items-center justify-center"
                      style={{ width: '24px', height: '24px', fontSize: '15px' }}
                    >
                      {tool.emoji}
                    </span>
                    <span className="truncate">{tool.label}</span>
                    <span
                      className="ml-auto shrink-0 text-[11px] font-semibold"
                      style={{ color: '#A0AEC0' }}
                    >
                      L{tool.level}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <Divider />

          {/* Learning Plan Generator */}
          <a
            href="#learning-pathway"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnLearningPlan ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Learning Plan Generator
          </a>

          <Divider />

          {/* Your Journey */}
          <a
            href="#user-journey"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              isOnUserJourney ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Learning Journey
          </a>

          <Divider />

          {/* Case Studies */}
          <a
            href="#case-studies"
            className={cn(
              'flex items-center px-4 h-[36px] rounded-full text-[14px] font-medium transition-all duration-150 whitespace-nowrap',
              currentHash === '#case-studies' ? pillActive : pillInactive,
            )}
            style={{ textDecoration: 'none' }}
          >
            Case Studies
          </a>
        </div>

        {/* Right — CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            href="mailto:uk@oxygyconsulting.com"
            className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-full font-medium text-[14px] text-white transition-all duration-200"
            style={{ backgroundColor: '#1A202C', textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#38B2AC';
              e.currentTarget.style.color = '#1A202C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A202C';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            Contact Us
          </a>

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

            <div className="py-2">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#A0AEC0',
                }}
              >
                AI Tools
              </span>
            </div>
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.level}
                href={tool.href}
                className={cn(
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                  currentHash === tool.href
                    ? 'bg-[#E6FFFA] text-[#2C9A94]'
                    : 'hover:bg-[#F7FAFC] text-[#2D3748]',
                )}
                style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                onClick={() => setMobileOpen(false)}
              >
                <span style={{ fontSize: '15px' }}>{tool.emoji}</span>
                <span>{tool.label}</span>
              </a>
            ))}

            <div className="h-px bg-gray-100 my-2" />

            <a
              href="#learning-pathway"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                isOnLearningPlan
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              Learning Plan Generator
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
              Learning Journey
            </a>

            <a
              href="#case-studies"
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
                currentHash === '#case-studies'
                  ? 'bg-[#E6FFFA] text-[#2C9A94]'
                  : 'hover:bg-[#F7FAFC] text-[#2D3748]',
              )}
              style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              Case Studies
            </a>

            <div className="h-px bg-gray-100 my-2" />

            <a
              href="mailto:uk@oxygyconsulting.com"
              className="flex items-center justify-center text-white py-3 rounded-full font-medium text-[14px] transition-colors mt-1"
              style={{ backgroundColor: '#1A202C', textDecoration: 'none' }}
              onClick={() => setMobileOpen(false)}
            >
              Contact Us
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
