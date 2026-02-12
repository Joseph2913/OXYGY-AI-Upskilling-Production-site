import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

const AI_TOOLS = [
  { level: 1, emoji: '🎯', label: 'Prompt Engineering Fundamentals', href: '#playground' },
  { level: 2, emoji: '🤖', label: 'Build Your First AI Agent', href: '#agent-builder' },
  { level: 3, emoji: '🗺️', label: 'Workflow Mapping & Design', href: '#workflow-designer' },
  { level: 4, emoji: '💡', label: 'Dashboard Design Thinking', href: '#dashboard-design' },
  { level: 5, emoji: '🏗️', label: 'Product Architecture Sprint', href: '#product-architecture' },
];

const ARTIFACT_HASHES = new Set(AI_TOOLS.map((t) => t.href));

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Is the user currently on an artifact page?
  const [onArtifactPage, setOnArtifactPage] = useState(() =>
    ARTIFACT_HASHES.has(window.location.hash),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleHash = () => setOnArtifactPage(ARTIFACT_HASHES.has(window.location.hash));
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Close mobile menu on hash change
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  const navigate = (hash: string) => {
    window.location.hash = hash;
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const scrollToSection = (id: string) => {
    // If on an artifact page, go home first
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

  // Desktop dropdown hover handlers
  const openDropdown = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };
  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const navLinkClass =
    'text-[14px] font-medium text-[#2D3748] hover:text-[#38B2AC] transition-colors duration-150 cursor-pointer whitespace-nowrap';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent',
      )}
      style={{ height: scrolled ? '64px' : '72px' }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full"
        style={{ maxWidth: '1200px', padding: '0 24px' }}
      >
        {/* Left — Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('hero');
          }}
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src="/logos/oxygy-logo-full.jpeg"
            alt="Oxygy"
            style={{ height: '28px', width: 'auto' }}
          />
        </a>

        {/* Center — Desktop Nav */}
        <div className="hidden lg:flex items-center" style={{ gap: '32px' }}>
          {/* AI Tools Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button
              className={cn(
                navLinkClass,
                'flex items-center gap-1',
                onArtifactPage && 'text-[#38B2AC]',
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
              {/* Active indicator */}
              {onArtifactPage && (
                <span
                  className="absolute left-0 right-0"
                  style={{
                    bottom: '-8px',
                    height: '2px',
                    background: '#38B2AC',
                    borderRadius: '1px',
                  }}
                />
              )}
            </button>

            {/* Dropdown panel */}
            <div
              className={cn(
                'absolute top-full left-1/2 pt-3 transition-all duration-150',
                dropdownOpen
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-1 pointer-events-none',
              )}
              style={{ transform: dropdownOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-4px)' }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minWidth: '300px',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
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

                {/* Items */}
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
                      style={{
                        width: '24px',
                        height: '24px',
                        fontSize: '15px',
                      }}
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

          <button
            className={navLinkClass}
            onClick={() => scrollToSection('journey')}
          >
            Methodology
          </button>
          <button
            className={navLinkClass}
            onClick={() => scrollToSection('case-studies')}
          >
            Case Studies
          </button>
          <button
            className={navLinkClass}
            onClick={() => scrollToSection('testimonials')}
          >
            Testimonials
          </button>
          <button
            className={navLinkClass}
            onClick={() => scrollToSection('team')}
          >
            Team
          </button>
          <button
            className={navLinkClass}
            onClick={() => scrollToSection('thought-leadership')}
          >
            Thought Leadership
          </button>
        </div>

        {/* Right — CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            href="#footer"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('footer');
            }}
            className="hidden sm:inline-flex bg-[#38B2AC] hover:bg-[#2C9A94] text-white px-6 py-2 rounded-full font-medium text-[14px] transition-colors duration-150"
            style={{ textDecoration: 'none' }}
          >
            Get in Touch
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
          style={{ maxHeight: 'calc(100vh - 72px)', overflowY: 'auto' }}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {/* AI Tools — expanded inline */}
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
                Interactive Tools
              </span>
            </div>
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.level}
                href={tool.href}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#F7FAFC] transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#2D3748',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileOpen(false)}
              >
                <span style={{ fontSize: '15px' }}>{tool.emoji}</span>
                <span>{tool.label}</span>
              </a>
            ))}

            <div className="h-px bg-gray-100 my-2" />

            {/* Other nav links */}
            <button
              className="text-left py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
              onClick={() => scrollToSection('journey')}
            >
              Methodology
            </button>
            <button
              className="text-left py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
              onClick={() => scrollToSection('case-studies')}
            >
              Case Studies
            </button>
            <button
              className="text-left py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
              onClick={() => scrollToSection('testimonials')}
            >
              Testimonials
            </button>
            <button
              className="text-left py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
              onClick={() => scrollToSection('team')}
            >
              Team
            </button>
            <button
              className="text-left py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
              onClick={() => scrollToSection('thought-leadership')}
            >
              Thought Leadership
            </button>

            <div className="h-px bg-gray-100 my-2" />

            <a
              href="#footer"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('footer');
              }}
              className="flex items-center justify-center bg-[#38B2AC] hover:bg-[#2C9A94] text-white py-3 rounded-full font-medium text-[14px] transition-colors mt-1"
              style={{ textDecoration: 'none' }}
            >
              Get in Touch
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
