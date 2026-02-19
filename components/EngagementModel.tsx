import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Check, ChevronDown, ArrowRight,
  Users, Database, Target, Award,
  Zap, Layers, GitBranch, FileText,
  Box, BarChart2, ShieldCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import {
  TIER_CONFIGS,
  PHASE_SECTIONS,
  LEARNING_TRACKS,
  PHASE3_CTA_BANNER,
  isWaveCard,
} from '../data/engagement-model-content';
import type {
  TierId,
  TierConfig,
  TierFeature,
  PhaseCardData,
  WaveCardData,
  PhaseSection,
} from '../data/engagement-model-content';

// ─── CSS Variable Helpers ───

const V = {
  navy: 'var(--em-navy)',
  navyMid: 'var(--em-navy-mid)',
  deepBlue: 'var(--em-deep-blue)',
  teal: 'var(--em-teal)',
  tealLight: 'var(--em-teal-light)',
  teal5: 'var(--em-teal-5)',
  teal10: 'var(--em-teal-10)',
  teal15: 'var(--em-teal-15)',
  white: 'var(--em-white)',
  sectionBg: 'var(--em-section-bg)',
  iceBlueBg: 'var(--em-ice-blue)',
  body: 'var(--em-body)',
  bodyLight: 'var(--em-body-light)',
  medGray: 'var(--em-med-gray)',
  border: 'var(--em-border)',
  peach: 'var(--em-peach)',
  yellow: 'var(--em-yellow)',
  mint: 'var(--em-mint)',
  foundationBorder: 'var(--em-foundation-border)',
  foundationBg: 'var(--em-foundation-bg)',
  foundationBadge: 'var(--em-foundation-badge)',
  gold: 'var(--em-gold)',
  goldLight: 'var(--em-gold-light)',
  goldBorder: 'var(--em-gold-border)',
  goldPill: 'var(--em-gold-pill)',
  phase01Accent: 'var(--em-phase01-accent)',
  phase01AccentMid: 'var(--em-phase01-accent-mid)',
  phase01Accent5: 'var(--em-phase01-accent-5)',
  phase01Accent10: 'var(--em-phase01-accent-10)',
  phase01Accent15: 'var(--em-phase01-accent-15)',
  phase2Accent: 'var(--em-phase2-accent)',
  phase2AccentMid: 'var(--em-phase2-accent-mid)',
  phase2Accent5: 'var(--em-phase2-accent-5)',
  phase2Accent10: 'var(--em-phase2-accent-10)',
  phase2Accent15: 'var(--em-phase2-accent-15)',
  phase3Accent: 'var(--em-phase3-accent)',
  phase3AccentMid: 'var(--em-phase3-accent-mid)',
  phase3Accent5: 'var(--em-phase3-accent-5)',
  phase3Accent10: 'var(--em-phase3-accent-10)',
  phase3Accent15: 'var(--em-phase3-accent-15)',
};

// ─── Icon Map ───

const ICON_MAP: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  Users, Database, Target, Award, Zap, Layers,
  GitBranch, FileText, Box, BarChart2, ShieldCheck,
};

// ─── Reduced Motion ───

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ─── Scroll-Triggered Reveal ───

const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, className, style }) => {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.15, triggerOnce: true });
  const rm = usePrefersReducedMotion();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: rm ? 1 : isIntersecting ? 1 : 0,
        transform: rm ? 'none' : isIntersecting ? 'translateY(0)' : 'translateY(24px)',
        transition: rm ? 'none' : `opacity 550ms ease ${delay}ms, transform 550ms ease ${delay}ms`,
        willChange: isIntersecting ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

// ─── Teal Underline (generic accent underline) ───

const AccentUnderline: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <span className="relative inline-block">
    {children}
    <span
      className="absolute left-0 w-full rounded-full"
      style={{ bottom: '-4px', height: '4px', backgroundColor: color || V.teal, opacity: 0.8 }}
    />
  </span>
);

// ─── Scroll Helper ───

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ════════════════════════════════════════════════════════════════════
// SECTION 1: PAGE HEADER + TIER CARDS
// ════════════════════════════════════════════════════════════════════

// ─── Feature list in tier card ───

const TierFeatureList: React.FC<{
  features: TierFeature[];
  inheritsFrom?: string;
  accentColor: string;
  onFeatureClick: (targetId: string) => void;
}> = ({ features, inheritsFrom, accentColor, onFeatureClick }) => (
  <div className="flex flex-col gap-2">
    {inheritsFrom && (
      <p style={{ fontSize: '13px', fontWeight: 600, color: V.body, marginBottom: '4px' }}>
        {inheritsFrom}
      </p>
    )}
    {features.map((f) => (
      <button
        key={f.text}
        onClick={(e) => { e.stopPropagation(); onFeatureClick(f.scrollTargetId); }}
        className="flex items-start gap-2 text-left cursor-pointer"
        style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}
      >
        <Check size={14} style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }} />
        <span
          style={{
            fontSize: '13px',
            color: V.bodyLight,
            lineHeight: 1.45,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = V.navy; e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.textDecoration = 'none'; }}
        >
          {f.text}
        </span>
      </button>
    ))}
  </div>
);

// ─── Tier Card (unified white structure) ───

const TierCard: React.FC<{
  tier: TierConfig;
  isSelected: boolean;
  onSelect: () => void;
  onFeatureClick: (targetId: string) => void;
}> = ({ tier, isSelected, onSelect, onFeatureClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Recommended badge — outside card, above */}
      {tier.isRecommended ? (
        <div
          className="text-center"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: V.white,
            background: tier.accentColor,
            padding: '6px 0',
            borderRadius: '8px 8px 0 0',
          }}
        >
          Recommended
        </div>
      ) : (
        <div style={{ height: '29px' }} />
      )}

      <button
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="text-left w-full cursor-pointer flex flex-col flex-1"
        style={{
          background: V.white,
          border: `2px solid ${isSelected || tier.isRecommended ? tier.accentColor : V.border}`,
          borderRadius: tier.isRecommended ? '0 0 16px 16px' : '16px',
          padding: '24px 24px 28px',
          transition: 'border-color 200ms ease',
          outline: 'none',
        }}
      >
        {/* Phases badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            color: tier.accentColor,
            background: V.sectionBg,
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '14px',
            alignSelf: 'flex-start',
          }}
        >
          {tier.phasesBadge}
        </span>

        <h3 style={{ fontSize: '22px', fontWeight: 800, color: V.navy, marginBottom: '4px' }}>
          {tier.name}
        </h3>
        <p style={{ fontSize: '14px', color: V.body, marginBottom: '20px', lineHeight: 1.5 }}>
          {tier.tagline}
        </p>

        {/* Feature list */}
        <div style={{ marginBottom: '24px', flex: 1 }}>
          <TierFeatureList
            features={tier.features}
            inheritsFrom={tier.inheritsFrom}
            accentColor={tier.accentColor}
            onFeatureClick={onFeatureClick}
          />
        </div>

        {/* CTA */}
        <span
          className="inline-flex items-center justify-center gap-2"
          style={{
            background: hovered ? tier.accentColor : 'transparent',
            color: hovered ? V.white : tier.accentColor,
            border: `1.5px solid ${tier.accentColor}`,
            borderRadius: '28px',
            padding: '11px 24px',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background-color 200ms ease, color 200ms ease',
            alignSelf: 'flex-start',
          }}
        >
          {tier.ctaText}
          <ArrowRight size={14} />
        </span>
      </button>
    </div>
  );
};

// ─── Page Header ───

const PageHeader: React.FC<{
  selectedTier: TierId;
  onSelectTier: (id: TierId) => void;
  onFeatureClick: (targetId: string) => void;
}> = ({ selectedTier, onSelectTier, onFeatureClick }) => (
  <section style={{ background: V.white, paddingTop: '96px', paddingBottom: '80px' }}>
    <div className="mx-auto" style={{ maxWidth: '1160px', padding: '0 40px' }}>
      {/* Eyebrow Pill */}
      <Reveal>
        <div className="text-center" style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: V.teal,
              backgroundColor: 'rgba(56, 178, 172, 0.08)',
              border: '1px solid rgba(56, 178, 172, 0.3)',
              padding: '6px 16px',
              borderRadius: '9999px',
            }}
          >
            Partner With OXYGY
          </div>
        </div>
      </Reveal>

      {/* Headline */}
      <Reveal delay={60}>
        <h1
          className="text-center"
          style={{
            fontSize: 'clamp(36px, 4.5vw, 48px)',
            fontWeight: 800,
            color: V.navy,
            lineHeight: 1.15,
            marginBottom: '20px',
          }}
        >
          Three Ways to <AccentUnderline>Transform</AccentUnderline> Your Organization
        </h1>
      </Reveal>

      {/* Intro */}
      <Reveal delay={120}>
        <p
          className="text-center mx-auto"
          style={{
            fontSize: '16px',
            color: V.body,
            lineHeight: 1.7,
            maxWidth: '640px',
            marginBottom: '56px',
          }}
        >
          Every organization&rsquo;s AI journey is different. Choose the scope that matches your
          ambition &mdash; from building foundational capability to full operating model transformation.
        </p>
      </Reveal>

      {/* Did You Know? Card */}
      <Reveal delay={160}>
        <div
          className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(56,178,172,0.15) 0%, rgba(44,154,148,0.08) 50%, rgba(56,178,172,0.12) 100%)',
            border: '1.5px solid rgba(56, 178, 172, 0.3)',
            marginBottom: '56px',
          }}
        >
          <div className="absolute top-3 left-4 flex gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2C9A94', opacity: 0.4 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B2F5EA', opacity: 0.6 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2C9A94', opacity: 0.3 }} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: '#2C9A94' }}>
            Did you know?
          </p>
          <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2 max-w-3xl mx-auto">
            Companies that invest in structured AI upskilling see{' '}
            <span className="font-bold" style={{ color: '#2C9A94' }}>3&times; faster time-to-value</span>{' '}
            on AI initiatives compared to those who deploy tools without capability building.
          </p>
          <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto">
            The right engagement model ensures AI adoption sticks &mdash; not just for early adopters, but across the organization.
          </p>
        </div>
      </Reveal>

      {/* Tier cards */}
      <Reveal delay={200}>
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: '24px', alignItems: 'stretch' }}
        >
          {TIER_CONFIGS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier === tier.id}
              onSelect={() => {
                onSelectTier(tier.id);
                scrollToId('phase-0');
              }}
              onFeatureClick={onFeatureClick}
            />
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════════
// SECTION 2: PHASE DETAIL SECTIONS
// ════════════════════════════════════════════════════════════════════

// ─── Level Sub-Card (inside expanded wave cards) ───

const LevelSubCard: React.FC<{
  level: number;
  title: string;
  topics: string[];
  tools: string;
  ctaHref: string;
  example?: string;
  accentColor: string;
}> = ({ level, title, topics, tools, ctaHref, example, accentColor }) => {
  const [linkHovered, setLinkHovered] = useState(false);

  return (
    <div
      style={{
        background: V.sectionBg,
        border: `1px solid ${V.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
      }}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span style={{ fontSize: '15px', fontWeight: 700, color: V.navy }}>
          Level {level}: {title}
        </span>
        <a
          href={ctaHref}
          onMouseEnter={() => setLinkHovered(true)}
          onMouseLeave={() => setLinkHovered(false)}
          className="inline-flex items-center gap-1"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: linkHovered ? accentColor : V.navy,
            textDecoration: 'none',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          Explore Level {level}
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {topics.map((topic) => (
          <span
            key={topic}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: V.bodyLight,
              background: V.white,
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1px solid ${V.border}`,
            }}
          >
            {topic}
          </span>
        ))}
      </div>

      <div style={{ fontSize: '13px', color: V.bodyLight }}>
        <span style={{ fontWeight: 600, color: V.body }}>Tools: </span>
        {tools}
      </div>

      {example && (
        <div style={{ fontSize: '13px', color: V.bodyLight, marginTop: '6px' }}>
          <span style={{ fontWeight: 600, color: V.body }}>Example: </span>
          {example}
        </div>
      )}
    </div>
  );
};

// ─── Learning Tracks Expanded Content ───

const LearningTracksContent: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div className="flex flex-col gap-3">
    {LEARNING_TRACKS.map((track) => (
      <div
        key={track.id}
        style={{
          background: V.sectionBg,
          border: `1px solid ${V.border}`,
          borderRadius: '8px',
          padding: '20px 24px',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              color: V.navy,
              background: track.badgeColor,
              padding: '3px 10px',
              borderRadius: '12px',
            }}
          >
            {track.name}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: V.body }}>
            {track.subtitle}
          </span>
        </div>

        <p style={{ fontSize: '14px', color: V.body, lineHeight: 1.6, marginBottom: '10px' }}>
          {track.description}
        </p>

        <div style={{ fontSize: '13px', color: V.bodyLight, marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, color: V.body }}>For: </span>
          {track.targetAudience}
        </div>

        <div className="flex flex-col gap-1">
          {track.waveBreakdown.map((w, wi) => (
            <div key={wi} className="flex items-start gap-2">
              <Check size={12} style={{ color: accentColor, flexShrink: 0, marginTop: '3px' }} />
              <span style={{ fontSize: '12px', color: V.body, lineHeight: 1.4 }}>{w}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Compact Expandable Card ───

const CompactExpandableCard: React.FC<{
  card: PhaseCardData | WaveCardData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  accentColorDark: string;
}> = ({ card, index, isExpanded, onToggle, accentColor, accentColorDark }) => {
  const [hovered, setHovered] = useState(false);
  const IconComponent = ICON_MAP[card.iconName] || FileText;
  const wave = isWaveCard(card) ? card : null;

  return (
    <div
      id={card.id}
      style={{
        background: V.white,
        border: `1px solid ${V.border}`,
        borderLeft: isExpanded ? `4px solid ${accentColor}` : `1px solid ${V.border}`,
        borderRadius: '10px',
        transition: 'border-left 200ms ease, background-color 150ms ease',
        backgroundColor: !isExpanded && hovered ? V.sectionBg : V.white,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full text-left cursor-pointer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          border: 'none',
          background: 'none',
          outline: 'none',
          gap: '8px',
        }}
        aria-expanded={isExpanded}
      >
        {/* Title row: number + icon + title + chevron */}
        <div className="flex items-center gap-3 w-full">
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: accentColor,
              color: V.white,
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {index + 1}
          </span>
          <IconComponent size={18} style={{ color: accentColor, flexShrink: 0 }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: V.navy, flex: 1 }}>
            {card.title}
          </h4>
          <ChevronDown
            size={18}
            style={{
              color: V.medGray,
              transition: 'transform 200ms ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Description — full width */}
        <p style={{ fontSize: '14px', color: V.body, lineHeight: 1.55, margin: 0, paddingLeft: '59px' }}>
          {card.summary}
        </p>

        {/* Involves — one line */}
        <div style={{ paddingLeft: '59px', fontSize: '13px', color: V.bodyLight }}>
          <span style={{ fontWeight: 600, color: V.body }}>Involves: </span>
          {card.involves}
        </div>
      </button>

      {/* Expanded content */}
      <div
        style={{
          maxHeight: isExpanded ? '3000px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <div style={{ padding: '0 24px 24px', paddingLeft: '28px' }}>
          {/* Divider */}
          <div style={{ height: '1px', background: V.border, margin: '0 0 20px' }} />

          {/* Learning tracks special content */}
          {card.cardType === 'learning-tracks' ? (
            <LearningTracksContent accentColor={accentColor} />
          ) : (
            <>
              {/* Approach / Outcome two-column */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Left: Approach */}
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: accentColor,
                      marginBottom: '12px',
                    }}
                  >
                    Approach
                  </div>
                  <div className="flex flex-col gap-3">
                    {card.approach.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check size={14} style={{ color: accentColor, flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: '14px', color: V.body, lineHeight: 1.5 }}>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Outcome */}
                <div
                  style={{
                    background: V.sectionBg,
                    border: `1px solid ${V.border}`,
                    borderRadius: '8px',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: accentColor,
                      marginBottom: '10px',
                    }}
                  >
                    {card.outcomeTitle || 'Outcome'}
                  </div>
                  <p style={{ fontSize: '14px', color: V.body, lineHeight: 1.6, margin: 0 }}>
                    {card.outcome}
                  </p>
                </div>
              </div>

              {/* Level sub-cards (wave cards only) */}
              {wave && (
                <div className="flex flex-col gap-3" style={{ marginTop: '20px' }}>
                  {wave.levelSubCards.map((lsc) => (
                    <LevelSubCard
                      key={lsc.level}
                      level={lsc.level}
                      title={lsc.title}
                      topics={lsc.topics}
                      tools={lsc.tools}
                      ctaHref={lsc.ctaHref}
                      example={lsc.example}
                      accentColor={accentColor}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Collapse affordance */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="cursor-pointer"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: accentColor,
              background: 'none',
              border: 'none',
              padding: '12px 0 0',
              outline: 'none',
            }}
          >
            Show less
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Phase Detail Section ───

const PhaseDetailSection: React.FC<{
  phase: PhaseSection;
  isVisible: boolean;
  staggerDelay: number;
  expandedCardId: string | null;
  onToggleCard: (cardId: string) => void;
}> = ({ phase, isVisible, staggerDelay, expandedCardId, onToggleCard }) => {
  const rm = usePrefersReducedMotion();
  const titleParts = phase.title.split(phase.titleUnderlineWord);

  return (
    <div
      id={`phase-${phase.phaseNumber}`}
      style={{
        maxHeight: isVisible ? '10000px' : '0px',
        opacity: isVisible ? 1 : 0,
        overflow: 'hidden',
        transition: rm
          ? 'none'
          : `max-height 400ms ease ${staggerDelay}ms, opacity 400ms ease ${staggerDelay}ms`,
      }}
    >
      <div style={{ padding: '56px 0' }}>
        {/* Phase header */}
        <Reveal>
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: phase.accentColor,
                marginBottom: '12px',
              }}
            >
              {phase.eyebrow}
            </div>

            <h2
              style={{
                fontSize: 'clamp(26px, 3vw, 32px)',
                fontWeight: 800,
                color: V.navy,
                marginBottom: '14px',
              }}
            >
              {titleParts[0]}
              <AccentUnderline color={phase.accentColor}>{phase.titleUnderlineWord}</AccentUnderline>
              {titleParts[1] || ''}
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: V.body,
                lineHeight: 1.7,
                maxWidth: '600px',
              }}
            >
              {phase.intro}
            </p>
          </div>
        </Reveal>

        {/* Expandable cards */}
        <div className="flex flex-col gap-3">
          {phase.cards.map((card, ci) => (
            <Reveal key={card.id} delay={ci * 50}>
              <CompactExpandableCard
                card={card}
                index={ci}
                isExpanded={expandedCardId === card.id}
                onToggle={() => onToggleCard(card.id)}
                accentColor={phase.accentColor}
                accentColorDark={phase.accentColorDark}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// SECTION 3: PHASE 3 CTA BANNER
// ════════════════════════════════════════════════════════════════════

const Phase3CtaBannerSection: React.FC<{
  onExploreCatalyst: () => void;
}> = ({ onExploreCatalyst }) => {
  const [hovered, setHovered] = useState(false);
  const banner = PHASE3_CTA_BANNER;

  return (
    <section
      id="phase3-cta"
      style={{
        background: V.phase3Accent5,
        borderTop: `2px solid ${V.phase3Accent}`,
        borderBottom: `2px solid ${V.phase3Accent}`,
        padding: '36px 0',
      }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ maxWidth: '1160px', padding: '0 40px' }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: V.navy, marginBottom: '4px' }}>
            {banner.headline}
          </h3>
          <p style={{ fontSize: '14px', color: V.body, lineHeight: 1.6, margin: 0, maxWidth: '560px' }}>
            {banner.subtext}
          </p>
        </div>
        <button
          onClick={onExploreCatalyst}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="inline-flex items-center gap-2 shrink-0 cursor-pointer"
          style={{
            background: hovered ? V.phase3AccentMid : V.phase3Accent,
            color: V.navy,
            borderRadius: '28px',
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            outline: 'none',
            transition: 'background-color 200ms ease',
          }}
        >
          {banner.ctaText}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════
// SECTION 5: CTA BAND
// ════════════════════════════════════════════════════════════════════

const CtaBand: React.FC = () => (
  <section
    className="relative overflow-hidden"
    style={{ background: V.teal, padding: '72px 24px' }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.04) 60px, rgba(255,255,255,0.04) 62px)',
      }}
    />
    <div className="relative z-10 text-center" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 'clamp(26px, 3vw, 32px)',
          fontWeight: 800,
          color: V.white,
          marginBottom: '16px',
        }}
      >
        Ready to Build AI Capability That Lasts?
      </h2>
      <p
        style={{
          fontSize: '16px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: '32px',
        }}
      >
        Start with strategy. Build with your people. Transform with accountability.
      </p>
      <a
        href="#footer"
        className="inline-flex items-center"
        style={{
          background: V.white,
          color: V.teal,
          borderRadius: '28px',
          padding: '14px 36px',
          fontSize: '15px',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'transform 200ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Start the Conversation
      </a>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════

export const EngagementModel: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<TierId>('accelerator');
  const [expandedCards, setExpandedCards] = useState<Record<number, string | null>>({});

  const activeTierConfig = useMemo(
    () => TIER_CONFIGS.find((t) => t.id === selectedTier)!,
    [selectedTier],
  );

  const visiblePhases = activeTierConfig.visiblePhases;

  const handleToggleCard = useCallback((phaseNumber: number, cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [phaseNumber]: prev[phaseNumber] === cardId ? null : cardId,
    }));
  }, []);

  const handleFeatureClick = useCallback((targetId: string) => {
    // Find which phase contains this card
    const phase = PHASE_SECTIONS.find((p) => p.cards.some((c) => c.id === targetId));
    if (phase) {
      // If phase isn't currently visible, switch to a tier that shows it
      if (!TIER_CONFIGS.find((t) => t.id === selectedTier)!.visiblePhases.includes(phase.phaseNumber)) {
        const matchingTier = TIER_CONFIGS.find((t) => t.visiblePhases.includes(phase.phaseNumber));
        if (matchingTier) setSelectedTier(matchingTier.id);
      }
      // Expand the card
      setExpandedCards((prev) => ({ ...prev, [phase.phaseNumber]: targetId }));
      // Scroll to it
      setTimeout(() => scrollToId(targetId), 150);
    } else {
      // Might be phase3-cta or other non-card target
      setTimeout(() => scrollToId(targetId), 100);
    }
  }, [selectedTier]);

  const handleExploreCatalyst = useCallback(() => {
    setSelectedTier('catalyst');
    setTimeout(() => scrollToId('phase-3'), 200);
  }, []);

  return (
    <div id="page-top" style={{ paddingTop: '68px' }}>
      {/* Section 1: Page Header + Tier Cards */}
      <PageHeader
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
        onFeatureClick={handleFeatureClick}
      />

      {/* Section 2: Phase Detail Sections */}
      <section style={{ background: V.white, padding: '32px 0 0' }}>
        <div className="mx-auto" style={{ maxWidth: '1160px', padding: '0 40px' }}>
          {PHASE_SECTIONS.map((phase, pi) => (
            <PhaseDetailSection
              key={phase.phaseNumber}
              phase={phase}
              isVisible={visiblePhases.includes(phase.phaseNumber)}
              staggerDelay={pi * 150}
              expandedCardId={expandedCards[phase.phaseNumber] ?? null}
              onToggleCard={(cardId) => handleToggleCard(phase.phaseNumber, cardId)}
            />
          ))}
        </div>
      </section>

      {/* Section 3: Phase 3 CTA Banner — visible for Foundation & Accelerator */}
      {selectedTier !== 'catalyst' && (
        <Phase3CtaBannerSection onExploreCatalyst={handleExploreCatalyst} />
      )}

      {/* Section 4: CTA Band */}
      <CtaBand />
    </div>
  );
};
