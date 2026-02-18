import React, { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Briefcase,
  Users,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  Lightbulb,
  Handshake,
  Play,
  Presentation,
} from 'lucide-react';
import { ArtifactClosing } from './ArtifactClosing';

const ACCENT = '#38B2AC';
const ACCENT_DARK = '#2C9A94';

/* Step-specific colors (from brand palette) */
const STEP1_COLOR = '#D47B5A';   // Peach / Terracotta (L4 accent)
const STEP1_LIGHT = '#D47B5A';   // Peach
const STEP5_COLOR = '#5B6DC2';   // Lavender / Indigo (L2 accent)
const STEP6_COLOR = '#C4A934';   // Gold (L3 accent)

/* ─── Step number circle ─── */
function StepCircle({ number, color }: { number: number; color?: string }) {
  return (
    <div
      className="shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[16px]"
      style={{ backgroundColor: color || ACCENT_DARK }}
    >
      {number}
    </div>
  );
}

/* ─── Vertical connector line ─── */
function Connector({ className = '' }: { className?: string }) {
  return (
    <div className={`hidden md:flex justify-center ${className}`}>
      <div className="w-[2px] h-10" style={{ backgroundColor: '#E2E8F0' }} />
    </div>
  );
}

/* ─── Branching / converging connector for the parallel section ─── */
function BranchConnector({ direction }: { direction: 'split' | 'merge' }) {
  return (
    <div className="hidden md:block relative" style={{ height: '40px' }}>
      {/* Center vertical stub */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: '2px',
          height: '16px',
          backgroundColor: '#E2E8F0',
          top: direction === 'split' ? 0 : 'auto',
          bottom: direction === 'merge' ? 0 : 'auto',
        }}
      />
      {/* Horizontal bar */}
      <div
        className="absolute left-[16.67%] right-[16.67%]"
        style={{
          height: '2px',
          backgroundColor: '#E2E8F0',
          top: direction === 'split' ? '16px' : '22px',
        }}
      />
      {/* Three vertical stubs down (split) or up (merge) */}
      {[16.67, 50, 83.33].map((pct) => (
        <div
          key={pct}
          className="absolute"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            width: '2px',
            height: '16px',
            backgroundColor: '#E2E8F0',
            top: direction === 'split' ? '16px' : undefined,
            bottom: direction === 'merge' ? '16px' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Data for the 70/20/10 cards ─── */
const LEARNING_MODES = [
  {
    step: 2,
    pct: '70%',
    title: 'Learn by Doing',
    icon: Briefcase,
    accentColor: ACCENT,
    accentDark: ACCENT_DARK,
    topColor: ACCENT,
    pctColor: ACCENT_DARK,
    description:
      'Apply what you learn immediately to your actual work. Each level includes hands-on projects designed around real business scenarios — not hypothetical exercises.',
    bullets: [
      'Build AI tools directly relevant to your role and function',
      'Work with real business data and workplace challenges',
      'Receive iterative feedback from OXYGY coaches on your output',
      'Progressively tackle more complex projects as your skills grow',
    ],
    exampleIcon: Lightbulb,
    example: 'Build a custom AI agent that triages your team\'s incoming requests automatically',
  },
  {
    step: 3,
    pct: '20%',
    title: 'Collaborative Sessions',
    icon: Users,
    accentColor: '#1E3A5F',
    accentDark: '#1E3A5F',
    topColor: '#1E3A5F',
    pctColor: '#1E3A5F',
    description:
      'Learn alongside colleagues with OXYGY facilitators guiding the conversation. These sessions connect individual learning to collective capability.',
    bullets: [
      'Facilitated workshops tackling shared business challenges with AI',
      'Peer reviews where you present your AI projects and get feedback',
      'Cross-functional problem-solving with colleagues from other teams',
      "Best practice exchange — learn what's working across the organisation",
    ],
    exampleIcon: Handshake,
    example: 'Present your AI workflow to peers and redesign it together based on their feedback',
  },
  {
    step: 4,
    pct: '10%',
    title: 'Self-Paced Study',
    icon: BookOpen,
    accentColor: '#718096',
    accentDark: '#4A5568',
    topColor: '#718096',
    pctColor: '#4A5568',
    description:
      'Build foundational knowledge at your own pace. Self-paced modules give you the theory and context that makes hands-on practice more effective.',
    bullets: [
      'Curated reading, articles, and reference guides for each level',
      'Short video modules explaining key concepts and techniques',
      'Knowledge checks to test your understanding before moving on',
      'On-demand resources you can revisit anytime as a reference',
    ],
    exampleIcon: Play,
    example: 'Watch a 10-minute video on prompt engineering best practices before your next session',
  },
];

export const UserJourney: React.FC = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleCard = (step: number) => {
    setExpandedStep((prev) => (prev === step ? null : step));
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] hover:text-[#38B2AC] transition-colors mb-10"
          style={{ textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </a>

        {/* Centered Title */}
        <div className="mb-6 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]">
            Your AI Learning
            <br />
            <span className="relative inline-block">
              Journey
              <span
                className="absolute left-0 -bottom-1 w-full h-[4px] rounded-full"
                style={{ backgroundColor: ACCENT_DARK, opacity: 0.8 }}
              />
            </span>
          </h1>
        </div>

        <p className="text-center text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[680px] mx-auto mb-12">
          Whether you're exploring Level 1 or mastering all five, the pathway is the same &mdash; personalised to you.
        </p>

        {/* Fun Fact Card */}
        <div
          className="rounded-2xl px-8 md:px-12 py-8 mb-14 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}18 0%, ${ACCENT_DARK}12 50%, ${ACCENT}1A 100%)`,
            border: `1.5px solid ${ACCENT}`,
          }}
        >
          {/* Decorative dots */}
          <div className="absolute top-3 left-4 flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${ACCENT_DARK}66` }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${ACCENT}99` }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${ACCENT_DARK}4D` }} />
          </div>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-3"
            style={{ color: ACCENT_DARK }}
          >
            Did you know?
          </span>
          <p className="text-[17px] md:text-[19px] font-medium text-[#2D3748] leading-[1.6] max-w-[640px] mx-auto mb-2">
            Research shows that learners who follow a structured, blended pathway retain{' '}
            <strong style={{ color: ACCENT_DARK }}>up to 75% more</strong> than those using a single learning mode alone.
          </p>
          <p className="text-[15px] text-[#718096] leading-[1.6] max-w-[560px] mx-auto">
            That's why every OXYGY journey combines hands-on practice, collaboration, and self-study &mdash; no matter which levels you pursue.
          </p>
        </div>

        {/* ─── JOURNEY TIMELINE ─── */}

        {/* STEP 1 — Discover & Personalise */}
        <div className="mb-2">
          <div
            className="bg-white border rounded-2xl overflow-hidden"
            style={{ borderColor: STEP1_LIGHT }}
          >
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP1_LIGHT }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle number={1} color={STEP1_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP1_COLOR }}
                  >
                    Step 1
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Discover &amp; Personalise
                  </h2>
                </div>
              </div>

              <div className="md:flex md:gap-8 md:items-start">
                <div className="md:flex-1">
                  <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-4">
                    Your journey starts with the{' '}
                    <strong className="text-[#1A202C]">Learning Pathway Generator</strong> &mdash; a personalised tool that tailors your experience to your unique role, goals, and current AI maturity.
                  </p>
                  <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                    Whether you're a product manager exploring prompt engineering or a data leader building end-to-end AI applications, the pathway adapts to you. The structure is the same for everyone, but the content, depth, and focus areas are entirely yours.
                  </p>
                  <a
                    href="#learning-pathway"
                    className="inline-flex items-center gap-2 text-[14px] font-semibold transition-colors"
                    style={{ color: STEP1_COLOR, textDecoration: 'none' }}
                  >
                    <Compass size={16} />
                    Try the Learning Pathway Generator
                  </a>
                </div>
                <div className="mt-6 md:mt-0 md:w-[280px] shrink-0">
                  <div
                    className="rounded-xl p-5"
                    style={{ backgroundColor: `${STEP1_LIGHT}10`, border: `1px solid ${STEP1_LIGHT}30` }}
                  >
                    <p className="text-[13px] font-semibold text-[#2D3748] mb-3">
                      Your pathway is built around:
                    </p>
                    <ul className="space-y-2">
                      {[
                        'Your current role & function',
                        'AI experience level',
                        'Learning goals & ambitions',
                        'Time availability',
                        'Preferred learning style',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span
                            className="w-[6px] h-[6px] rounded-full mt-[7px] shrink-0"
                            style={{ backgroundColor: STEP1_LIGHT }}
                          />
                          <span className="text-[13px] text-[#4A5568] leading-[1.5]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branching connector — split */}
        <BranchConnector direction="split" />

        {/* Parallel label */}
        <div className="text-center my-4 md:my-2">
          <span
            className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] px-4 py-2 rounded-full"
            style={{ backgroundColor: `${ACCENT}12`, color: ACCENT_DARK, border: `1px solid ${ACCENT}30` }}
          >
            <RefreshCw size={14} />
            Steps 2&ndash;4 happen simultaneously
          </span>
        </div>

        {/* STEPS 2-4 — Parallel Expandable Columns */}
        <div className="rounded-2xl p-4 md:p-6 mb-2" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 md:items-start gap-5">
            {LEARNING_MODES.map((mode) => {
              const isOpen = expandedStep === mode.step;
              const Icon = mode.icon;
              return (
                <div
                  key={mode.step}
                  className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
                  style={{ minHeight: isOpen ? undefined : '290px' }}
                >
                  <div className="h-[6px] w-full" style={{ backgroundColor: mode.topColor }} />
                  <div className="p-5">
                    {/* Always visible: header */}
                    <div className="flex items-center gap-3 mb-3">
                      <StepCircle number={mode.step} color={mode.accentDark} />
                      <h3 className="text-[18px] font-bold text-[#1A202C]">{mode.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon size={18} style={{ color: mode.accentDark }} />
                      <div className="text-[24px] font-bold" style={{ color: mode.pctColor }}>
                        {mode.pct}
                      </div>
                    </div>
                    <p className="text-[14px] text-[#4A5568] leading-[1.6] mb-4">
                      {mode.description}
                    </p>

                    {/* Toggle button */}
                    <button
                      onClick={() => toggleCard(mode.step)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer transition-colors mb-1"
                      style={{ color: mode.accentDark, background: 'none', border: 'none', padding: 0 }}
                    >
                      {isOpen ? 'Show less' : 'See more'}
                      <ChevronDown
                        size={14}
                        className="transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    {/* Expandable content */}
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: isOpen ? '600px' : '0px',
                        opacity: isOpen ? 1 : 0,
                        marginTop: isOpen ? '12px' : '0px',
                      }}
                    >
                      <ul className="space-y-2.5 mb-4">
                        {mode.bullets.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span
                              className="w-[6px] h-[6px] rounded-full mt-[7px] shrink-0"
                              style={{ backgroundColor: mode.accentColor }}
                            />
                            <span className="text-[13px] text-[#4A5568] leading-[1.6]">{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Example — single line with icon */}
                      <div
                        className="rounded-lg px-3 py-2.5 flex items-start gap-2.5"
                        style={{
                          backgroundColor: `${mode.accentColor}0D`,
                          border: `1px solid ${mode.accentColor}20`,
                        }}
                      >
                        <mode.exampleIcon
                          size={15}
                          className="shrink-0 mt-[2px]"
                          style={{ color: mode.accentDark }}
                        />
                        <div>
                          <span
                            className="text-[11px] font-bold uppercase tracking-[0.06em] mr-1.5"
                            style={{ color: mode.accentDark }}
                          >
                            Example:
                          </span>
                          <span className="text-[12px] text-[#4A5568] leading-[1.5]">
                            {mode.example}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Converging connector — merge */}
        <BranchConnector direction="merge" />

        {/* OXYGY Support Strip */}
        <div
          className="rounded-2xl px-6 md:px-10 py-6 my-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}15 0%, #E6FFFA 50%, ${ACCENT}10 100%)`,
            border: `1.5px solid ${ACCENT}40`,
          }}
        >
          <p
            className="text-[13px] font-bold uppercase tracking-[0.12em] mb-4"
            style={{ color: ACCENT_DARK }}
          >
            OXYGY is with you every step
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Presentation, label: 'Facilitating collaborative sessions' },
              { icon: MessageSquare, label: 'Providing personalised feedback' },
              { icon: HelpCircle, label: 'Answering questions' },
              { icon: RefreshCw, label: 'Adapting your path' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${ACCENT}20` }}
                >
                  <Icon size={18} style={{ color: ACCENT_DARK }} />
                </div>
                <span className="text-[13px] font-medium leading-[1.4] text-[#2D3748]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Connector />

        {/* STEP 5 — Reflect & Apply */}
        <div className="mb-2">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP5_COLOR }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle number={5} color={STEP5_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP5_COLOR }}
                  >
                    Step 5
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Reflect &amp; Apply
                  </h2>
                </div>
              </div>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                Pause and connect what you've learned to your day-to-day work. Reflection is where knowledge becomes lasting capability &mdash; turning skills into habits and insights into action.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: ClipboardCheck, title: 'Self-assessment', desc: 'Evaluate your growth against your goals' },
                  { icon: MessageSquare, title: 'Manager check-ins', desc: 'Discuss how to apply new skills at work' },
                  { icon: BookOpen, title: 'Reflection prompts', desc: 'Guided questions to deepen understanding' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E2E8F0]"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${STEP5_COLOR}14` }}
                    >
                      <Icon size={18} style={{ color: STEP5_COLOR }} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1A202C] leading-tight mb-1">{title}</p>
                      <p className="text-[13px] text-[#718096] leading-[1.5]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Connector />

        {/* STEP 6 — Progress & Grow */}
        <div className="mb-10">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP6_COLOR }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle number={6} color={STEP6_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP6_COLOR }}
                  >
                    Step 6
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Progress &amp; Grow
                  </h2>
                </div>
              </div>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                Your journey doesn't end &mdash; it evolves. Track your competency gains, unlock deeper levels, and become an AI champion within your organisation. OXYGY continues to support you as your skills mature and new opportunities emerge.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, title: 'Track competency growth', desc: 'Measure progress across AI skill dimensions' },
                  { icon: Compass, title: 'Unlock next levels', desc: 'Advance from fundamentals to full applications' },
                  { icon: Users, title: 'Become an AI champion', desc: 'Lead AI adoption in your team and organisation' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E2E8F0]"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${STEP6_COLOR}14` }}
                    >
                      <Icon size={18} style={{ color: STEP6_COLOR }} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1A202C] leading-tight mb-1">{title}</p>
                      <p className="text-[13px] text-[#718096] leading-[1.5]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Closing CTA */}
        <ArtifactClosing
          summaryText="Ready to begin? Start with the Learning Pathway Generator to build a journey tailored to your role, goals, and experience."
          ctaLabel="Start Your Journey"
          ctaHref="#learning-pathway"
          accentColor={ACCENT_DARK}
        />
      </div>
    </div>
  );
};
