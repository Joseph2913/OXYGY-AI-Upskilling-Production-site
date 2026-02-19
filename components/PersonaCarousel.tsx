import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Wrench,
  GitBranch,
  Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERSONAS } from '../data/persona-carousel-content';
import type { PersonaCardData, PersonaPathwayLevel } from '../types';

// ---- Constants ----

const GAP = 24;
const PEEK = 80;
const MOBILE_PEEK = 60;
const AUTO_SCROLL_INTERVAL = 5500;
const RESUME_DELAY = 4000;
const FLIP_DURATION = 600;

// ---- Persona icon map ----

const PERSONA_ICONS: Record<number, LucideIcon> = {
  1: Sparkles,   // Curious Beginner
  2: Zap,        // Everyday User
  3: Target,     // Strategic Leader
  4: Wrench,     // Hands-On Builder
  5: GitBranch,  // Process Optimizer
  6: Rocket,     // Product Thinker
};

// ---- Pathway strip sub-component ----

const DEPTH_LABELS: Record<string, string> = {
  full: 'Full',
  'fast-track': 'Fast',
  awareness: 'Intro',
  skip: '\u2014',
};

function PathwayStrip({ pathway }: { pathway: PersonaPathwayLevel[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pathway.map((p) => {
        const isActive = p.depth === 'full' || p.depth === 'fast-track';
        return (
          <div key={p.level} className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-[#4A5568]">{p.level}</span>
            <span
              className="text-[9px] font-semibold px-1.5 py-[2px] rounded"
              style={{
                backgroundColor: isActive ? p.color : 'transparent',
                color: isActive ? '#1A202C' : '#A0AEC0',
                border: isActive ? 'none' : '1px solid #E2E8F0',
              }}
            >
              {DEPTH_LABELS[p.depth]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Single flip card ----

interface PersonaCardProps {
  persona: PersonaCardData;
  isFlipped: boolean;
  onFlip: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  cardWidth: number;
  cardHeight: number;
  reducedMotion: boolean;
  isTouchDevice: boolean;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  isFlipped,
  onFlip,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  cardWidth,
  cardHeight,
  reducedMotion,
  isTouchDevice,
}) => {
  const Icon = PERSONA_ICONS[persona.id] || Sparkles;

  const flipStyle = reducedMotion
    ? {}
    : {
        transformStyle: 'preserve-3d' as const,
        transition: `transform ${FLIP_DURATION}ms ease-in-out`,
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      };

  const faceBase: React.CSSProperties = {
    backfaceVisibility: reducedMotion ? 'visible' : 'hidden',
    WebkitBackfaceVisibility: reducedMotion ? 'visible' : 'hidden',
  };

  return (
    <div
      className="flex-shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38B2AC] focus-visible:ring-offset-2 rounded-xl"
      style={{ perspective: '1000px', width: cardWidth, height: cardHeight }}
      role="group"
      aria-roledescription="slide"
      aria-label={`${persona.title} — ${isTouchDevice ? 'tap' : 'hover'} to see their learning pathway`}
      tabIndex={0}
      onClick={isTouchDevice ? onFlip : undefined}
      onMouseEnter={!isTouchDevice ? onMouseEnter : undefined}
      onMouseLeave={!isTouchDevice ? onMouseLeave : undefined}
      onKeyDown={onKeyDown}
    >
      <div
        className="persona-flip-inner relative w-full h-full"
        style={flipStyle}
      >
        {/* ---- Front Face ---- */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            ...faceBase,
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            transform: reducedMotion ? undefined : 'rotateY(0deg)',
            opacity: reducedMotion ? (isFlipped ? 0 : 1) : undefined,
            transition: reducedMotion ? 'opacity 0.3s ease' : undefined,
            zIndex: reducedMotion ? (isFlipped ? 0 : 1) : undefined,
          }}
        >
          {/* Accent band */}
          <div
            className="h-[6px] w-full rounded-t-xl"
            style={{ backgroundColor: persona.accentColor }}
          />

          <div className="p-5 pt-4 flex flex-col h-[calc(100%-6px)]">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: persona.accentColor }}
              >
                <Icon size={22} className="text-[#1A202C]" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A202C] leading-tight">
                {persona.title}
              </h3>
            </div>

            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D3748] mb-1.5 flex items-center gap-1.5">
                <span
                  className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: persona.accentColor }}
                />
                Where I Am
              </p>
              <p className="text-[13px] text-[#4A5568] leading-relaxed line-clamp-3">
                {persona.front.whereIAm}
              </p>
            </div>

            <div className="mb-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D3748] mb-1.5 flex items-center gap-1.5">
                <span
                  className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: persona.accentColor }}
                />
                Where I&rsquo;m Going
              </p>
              <p className="text-[13px] text-[#4A5568] leading-relaxed line-clamp-3">
                {persona.front.whereImGoing}
              </p>
            </div>

            {/* Mobile hint */}
            <p
              className="text-[11px] text-[#A0AEC0] mt-3 text-center"
              style={{ display: isTouchDevice ? 'block' : 'none' }}
            >
              Tap to explore &rarr;
            </p>
          </div>
        </div>

        {/* ---- Back Face ---- */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            ...faceBase,
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            transform: reducedMotion ? undefined : 'rotateY(180deg)',
            opacity: reducedMotion ? (isFlipped ? 1 : 0) : undefined,
            transition: reducedMotion ? 'opacity 0.3s ease' : undefined,
            zIndex: reducedMotion ? (isFlipped ? 1 : 0) : undefined,
          }}
        >
          {/* Accent band */}
          <div
            className="h-[6px] w-full rounded-t-xl"
            style={{ backgroundColor: persona.accentColor }}
          />

          <div className="p-5 pt-4 flex flex-col h-[calc(100%-6px)]">
            {/* Icon + Title (smaller) */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: persona.accentColor }}
              >
                <Icon size={16} className="text-[#1A202C]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1A202C] leading-tight">
                {persona.title}
              </h3>
            </div>

            {/* Key project (first) */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D3748] mb-1.5 flex items-center gap-1.5">
                <span
                  className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: persona.accentColor }}
                />
                Key Project
              </p>
              <p className="text-[14px] font-semibold text-[#1A202C] mb-1 leading-snug">
                {persona.back.projectTitle}
              </p>
              <p className="text-[12px] text-[#4A5568] leading-relaxed line-clamp-2">
                {persona.back.projectDescription}
              </p>
            </div>

            {/* Estimated journey */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D3748] mb-1 flex items-center gap-1.5">
                <span
                  className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: persona.accentColor }}
                />
                Estimated Journey
              </p>
              <p className="text-[13px] text-[#4A5568] font-medium">
                {persona.back.estimatedJourney}
              </p>
            </div>

            {/* Pathway strip (last, on white bg) */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D3748] mb-2 flex items-center gap-1.5">
                <span
                  className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: persona.accentColor }}
                />
                Pathway
              </p>
              <div className="bg-[#F7FAFC] rounded-lg px-3 py-2" style={{ border: '1px solid #EDF2F7' }}>
                <PathwayStrip pathway={persona.back.pathway} />
              </div>
            </div>

            {/* CTA link */}
            <a
              href="#learning-pathway"
              className="mt-auto text-[13px] font-semibold text-[#38B2AC] hover:underline inline-flex items-center gap-1"
              tabIndex={isFlipped ? 0 : -1}
              onClick={(e) => e.stopPropagation()}
            >
              Explore your own pathway
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Main Component ----

export const PersonaCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [clickPaused, setClickPaused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none)').matches;
  }, []);

  // Responsive: how many cards visible
  const visibleCards = useMemo(() => {
    if (containerWidth < 768) return 1;
    if (containerWidth < 1024) return 2;
    return 3;
  }, [containerWidth]);

  const isMobile = visibleCards === 1;
  const peek = isMobile ? MOBILE_PEEK : PEEK;

  // Card dimensions
  const cardWidth = useMemo(() => {
    if (containerWidth === 0) return 320;
    const totalGaps = (visibleCards - 1) * GAP;
    return (containerWidth - totalGaps - peek) / visibleCards;
  }, [containerWidth, visibleCards, peek]);

  const cardHeight = isMobile ? 400 : 380;
  const maxIndex = PERSONAS.length - visibleCards;

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Clamp index on resize
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, maxIndex)));
  }, [maxIndex]);

  // Click-based pause with timed resume
  const clickPause = useCallback(() => {
    setClickPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setClickPaused(false), RESUME_DELAY);
  }, []);

  // Auto-scroll: stops when hovering OR click-paused
  useEffect(() => {
    if (reducedMotion || isHovering || clickPaused) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      return;
    }

    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [isHovering, clickPaused, maxIndex, reducedMotion]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Sync mobile scroll-snap with currentIndex for dots
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;

    const el = scrollRef.current;
    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollPos = el.scrollLeft;
        const snapWidth = cardWidth + GAP;
        const idx = Math.round(scrollPos / snapWidth);
        setCurrentIndex(Math.max(0, Math.min(idx, PERSONAS.length - 1)));
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile, cardWidth]);

  // Navigation: infinite wrapping
  const goTo = useCallback(
    (idx: number) => {
      let wrapped = idx;
      if (wrapped > maxIndex) wrapped = 0;
      if (wrapped < 0) wrapped = maxIndex;
      setCurrentIndex(wrapped);
      clickPause();

      // Mobile: programmatic scroll
      if (isMobile && scrollRef.current) {
        const snapWidth = cardWidth + GAP;
        scrollRef.current.scrollTo({ left: wrapped * snapWidth, behavior: 'smooth' });
      }
    },
    [maxIndex, clickPause, isMobile, cardWidth],
  );

  const goLeft = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goRight = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Flip handlers
  const handleFlip = useCallback(
    (idx: number) => {
      setFlippedCard((prev) => (prev === idx ? null : idx));
      clickPause();
    },
    [clickPause],
  );

  const handleHoverEnter = useCallback((idx: number) => {
    setHoveredCard(idx);
  }, []);

  const handleHoverLeave = useCallback(() => {
    setHoveredCard(null);
  }, []);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip(idx);
      }
      if (e.key === 'Escape') {
        setFlippedCard(null);
        setHoveredCard(null);
      }
    },
    [handleFlip],
  );

  // Desktop translateX
  const trackOffset = useMemo(() => {
    return -(currentIndex * (cardWidth + GAP));
  }, [currentIndex, cardWidth]);

  // CTA card scroll reveal
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setCtaVisible(true);
      return;
    }
    const el = ctaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCtaVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Dot count
  const dotCount = maxIndex + 1;

  return (
    <section className="pt-12 pb-12 bg-white border-t border-gray-100">
      <div ref={containerRef} className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] leading-tight mb-4">
            Everyone&rsquo;s AI Journey Looks{' '}
            <span className="relative inline-block">
              Different
              <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-teal opacity-80 rounded-full" />
            </span>
          </h2>
          <p className="text-base text-[#4A5568] leading-relaxed max-w-2xl mx-auto">
            From first-time explorers to experienced builders &mdash; each pathway through the framework
            is shaped by where you start and where you want to go. Here are six journeys.{' '}
            <span className="font-semibold">Yours will be unique.</span>
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          role="region"
          aria-label="Persona archetypes carousel"
          aria-roledescription="carousel"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoveredCard(null);
          }}
        >
          {/* Arrow Left — always visible on desktop, wraps infinitely */}
          {!isMobile && (
            <button
              onClick={goLeft}
              aria-label="Previous persona"
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors duration-150 hover:border-[#38B2AC]"
              style={{ border: '1px solid #E2E8F0' }}
            >
              <ChevronLeft size={20} className="text-[#1A202C]" />
            </button>
          )}

          {/* Arrow Right — always visible on desktop, wraps infinitely */}
          {!isMobile && (
            <button
              onClick={goRight}
              aria-label="Next persona"
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors duration-150 hover:border-[#38B2AC]"
              style={{ border: '1px solid #E2E8F0' }}
            >
              <ChevronRight size={20} className="text-[#1A202C]" />
            </button>
          )}

          {/* Card Track */}
          {isMobile ? (
            /* Mobile: scroll-snap container */
            <div
              ref={scrollRef}
              className="persona-carousel-snap flex overflow-x-auto"
              style={{ gap: GAP }}
              onTouchStart={clickPause}
            >
              {PERSONAS.map((persona, idx) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isFlipped={flippedCard === idx}
                  onFlip={() => handleFlip(idx)}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                  onKeyDown={(e) => handleCardKeyDown(e, idx)}
                  cardWidth={containerWidth - MOBILE_PEEK - 24}
                  cardHeight={cardHeight}
                  reducedMotion={reducedMotion}
                  isTouchDevice={isTouchDevice}
                />
              ))}
              {/* Spacer for last card peek */}
              <div className="flex-shrink-0" style={{ width: 1 }} />
            </div>
          ) : (
            /* Desktop/Tablet: translateX track */
            <div className="overflow-hidden">
              <div
                className="flex"
                style={{
                  gap: GAP,
                  transform: `translateX(${trackOffset}px)`,
                  transition: reducedMotion ? 'none' : 'transform 400ms ease-in-out',
                }}
              >
                {PERSONAS.map((persona, idx) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    isFlipped={hoveredCard === idx || flippedCard === idx}
                    onFlip={() => handleFlip(idx)}
                    onMouseEnter={() => handleHoverEnter(idx)}
                    onMouseLeave={handleHoverLeave}
                    onKeyDown={(e) => handleCardKeyDown(e, idx)}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    reducedMotion={reducedMotion}
                    isTouchDevice={isTouchDevice}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Carousel pages">
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={currentIndex === i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: currentIndex === i ? 24 : 8,
                height: 8,
                backgroundColor: currentIndex === i ? '#38B2AC' : '#E2E8F0',
              }}
            />
          ))}
        </div>

        {/* CTA Card — contained, same width as carousel */}
        <div
          ref={ctaRef}
          className="mt-10 rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #38B2AC 0%, #2C9A94 100%)',
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: reducedMotion ? 'none' : 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern
                id="persona-cta-dots"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#persona-cta-dots)" />
            </svg>
          </div>

          <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1.5">
                What Does Your Journey Look Like?
              </h3>
              <p className="text-sm text-white/80 leading-relaxed max-w-md">
                Answer a few questions and get a personalized, project-based pathway designed around your role and goals.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end flex-shrink-0">
              <a
                href="#learning-pathway"
                className="inline-flex items-center gap-2 bg-white text-[#2C9A94] rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#F0FFFC] no-underline transition-colors duration-150"
              >
                Build My Learning Pathway
                <ChevronRight size={15} />
              </a>
              <p className="text-xs text-white/50 mt-2">Takes about 2 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing slide {currentIndex + 1} of {PERSONAS.length}
      </div>
    </section>
  );
};
