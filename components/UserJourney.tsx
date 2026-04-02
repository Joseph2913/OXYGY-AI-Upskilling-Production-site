import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Briefcase,
  Users,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  RefreshCw,
  ChevronDown,
  Lightbulb,
  Handshake,
  Play,
  FileText,
  Share2,
  Rocket,
  Target,
  Wrench,
} from 'lucide-react';
import { ArtifactClosing } from './ArtifactClosing';

const ACCENT = '#38B2AC';
const ACCENT_DARK = '#2C9A94';

/* Stage-specific colors (from brand palette) */
const STEP1_COLOR = '#D47B5A';   // Peach / Terracotta (L4 accent)
const STEP1_LIGHT = '#D47B5A';   // Peach
const STEP5_COLOR = '#5B6DC2';   // Lavender / Indigo (L2 accent)
const STEP6_COLOR = '#C4A934';   // Gold (L3 accent)

/* ─── Stage icon circle ─── */
function StepCircle({ number, color, icon: Icon }: {
  number?: number;
  color?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div
      className="shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[16px]"
      style={{ backgroundColor: color || ACCENT_DARK }}
    >
      {Icon ? <Icon size={16} className="text-white" /> : number}
    </div>
  );
}

/* ─── Dotted connector between stages ─── */
function Connector({ color = '#E2E8F0' }: { color?: string }) {
  return (
    <div className="hidden md:flex flex-col items-center py-1">
      <div
        className="w-[3px] rounded-full"
        style={{
          height: '40px',
          backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 5px, transparent 5px, transparent 11px)`,
        }}
      />
      <div
        className="w-0 h-0"
        style={{
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `6px solid ${color}`,
        }}
      />
    </div>
  );
}

/* ─── Data for the 70/20/10 cards ─── */
const LEARNING_MODES = [
  {
    sequence: '01',
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
    oxygySupport: 'OXYGY curates all materials and adapts your reading list based on your progress and goals.',
  },
  {
    sequence: '02',
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
      "Best practice exchange — learn what's working across the organization",
    ],
    exampleIcon: Handshake,
    example: 'Present your AI workflow to peers and redesign it together based on their feedback',
    oxygySupport: 'OXYGY facilitates every session, provides personalized feedback, and ensures discussions translate into action.',
  },
  {
    sequence: '03',
    step: 2,
    pct: '70%',
    title: 'Learn by Doing',
    icon: Briefcase,
    accentColor: ACCENT,
    accentDark: ACCENT_DARK,
    topColor: ACCENT,
    pctColor: ACCENT_DARK,
    description:
      'Every level gives you a tangible project — something you build, deliver, and can point to. From a personal prompt library at Level 1 to a deployed AI application at Level 5, you\'re always working towards a real deliverable grounded in your actual work.',
    bullets: [
      'Complete a hands-on project at every level with a clear deliverable',
      'Build AI tools directly relevant to your role and function',
      'Work with real business data and workplace challenges — not hypothetical exercises',
      'Receive iterative feedback from OXYGY coaches as you build',
      'Each project builds on the last, growing in complexity and impact',
    ],
    exampleIcon: Lightbulb,
    example: 'At Level 2, your project might be building a custom AI agent that triages your team\'s incoming requests — a tool you deliver and your team actually uses',
    oxygySupport: 'OXYGY coaches review your project work, answer questions, and adapt your path as your skills develop.',
  },
];


export const UserJourney: React.FC = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleCard = (step: number) => {
    setExpandedStep((prev) => (prev === step ? null : step));
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Centered Title */}
        <div className="mb-8 text-center">
          <div
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#E6FFFA', color: ACCENT_DARK, border: `1px solid ${ACCENT}` }}
          >
            What to Expect
          </div>
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
          <p className="text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[700px] mx-auto mt-2">
            Whether you're exploring Level 1 or mastering all five, the pathway is the same &mdash; personalized to you.
          </p>
        </div>

        {/* ─── JOURNEY TIMELINE ─── */}

        {/* STAGE 1 — Discover & Personalise */}
        <div className="mb-2">
          <div
            className="bg-white border rounded-2xl overflow-hidden"
            style={{ borderColor: STEP1_LIGHT }}
          >
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP1_LIGHT }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle icon={Compass} color={STEP1_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP1_COLOR }}
                  >
                    Discover &amp; Personalise
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
                    <strong className="text-[#1A202C]">Learning Pathway Generator</strong> &mdash; a personalized tool that builds your progression plan and assigns a <strong className="text-[#1A202C]">tangible, hands-on project at every level</strong> grounded in real business needs.
                  </p>
                  <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                    Whether you're a product manager exploring prompt engineering or a data leader building end-to-end AI applications, the pathway adapts to you. The structure is the same for everyone, but the projects, depth, and focus areas are entirely yours &mdash; so you're always building something real, not just absorbing theory.
                  </p>
                  <a
                    href="/app/dashboard"
                    className="inline-flex items-center gap-2 text-white font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: STEP1_COLOR,
                      padding: '12px 24px',
                      fontSize: '15px',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <Compass size={16} />
                    Try the Learning Pathway Generator
                    <ArrowRight size={16} />
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
                        'A hands-on project at every level',
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

        <Connector color={STEP1_COLOR} />

        {/* STAGE 2 — Learn */}
        <div className="mb-2">
          <div
            className="bg-white border rounded-2xl overflow-hidden"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div className="h-[4px] w-full" style={{ backgroundColor: ACCENT }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle icon={BookOpen} color={ACCENT_DARK} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: ACCENT }}
                  >
                    Learn
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Build Your Capability
                  </h2>
                </div>
              </div>

              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-6">
                Your learning unfolds across three complementary modes &mdash; each reinforcing the others. Everyone moves through all three, in this sequence.
              </p>

              {/* Stacked accordion cards */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                {LEARNING_MODES.map((mode, index) => {
                  const isOpen = expandedStep === mode.step;
                  const ModeIcon = mode.icon;
                  const isLast = index === LEARNING_MODES.length - 1;
                  return (
                    <div
                      key={mode.step}
                      className={!isLast ? 'border-b border-[#E2E8F0]' : ''}
                    >
                      <div className="p-5">
                        {/* Header row with sequence label */}
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className="text-[11px] font-semibold shrink-0"
                            style={{ color: '#A0AEC0', marginRight: '4px' }}
                          >
                            {mode.sequence}
                          </span>
                          <ModeIcon size={18} style={{ color: mode.accentDark }} />
                          <h3 className="text-[18px] font-bold text-[#1A202C]">{mode.title}</h3>
                          <div className="text-[16px] font-bold ml-auto shrink-0" style={{ color: mode.pctColor }}>
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
                            className="rounded-lg px-3 py-2.5 flex items-start gap-2.5 mb-3"
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

                          {/* OXYGY support note */}
                          <div
                            className="rounded-lg px-3 py-3 flex items-start gap-2.5"
                            style={{
                              backgroundColor: `${ACCENT}12`,
                              border: `1px solid ${ACCENT}30`,
                            }}
                          >
                            <MessageSquare
                              size={14}
                              className="shrink-0 mt-[2px]"
                              style={{ color: ACCENT_DARK }}
                            />
                            <div>
                              <span
                                className="text-[11px] font-bold uppercase tracking-[0.06em] block mb-1"
                                style={{ color: ACCENT_DARK }}
                              >
                                OXYGY's Role
                              </span>
                              <span className="text-[12px] text-[#4A5568] leading-[1.5]">
                                {mode.oxygySupport}
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
          </div>
        </div>

        <Connector color={ACCENT} />

        {/* STAGE 3 — Reflect & Apply */}
        <div className="mb-2">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP5_COLOR }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle icon={RefreshCw} color={STEP5_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP5_COLOR }}
                  >
                    Reflect &amp; Apply
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Reflect &amp; Apply
                  </h2>
                </div>
              </div>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-3">
                This is where learning becomes lasting capability. The goal is to be <strong className="text-[#1A202C]">consciously aware</strong> of where, how, and why you're applying AI &mdash; not just using it, but understanding its impact on your work.
              </p>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                A core part of this step is creating an <strong className="text-[#1A202C]">AI Application Log</strong> &mdash; a living record of every place you've applied AI, the outcomes, and the lessons learned. This log is shared with your cohort and leadership team, creating a <strong className="text-[#1A202C]">cyclical feedback loop</strong> that continuously improves how AI is deployed across the organization.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: FileText, title: 'AI Application Log', desc: 'Document every AI use case: where you applied it, what worked, and what you learned' },
                  { icon: Share2, title: 'Cohort & leadership sharing', desc: 'Share your log with peers and leaders to create an organization-wide feedback loop' },
                  { icon: ClipboardCheck, title: 'Self-assessment & check-ins', desc: 'Evaluate your growth and discuss next steps with your manager and OXYGY coaches' },
                ].map(({ icon: SubIcon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E2E8F0]"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${STEP5_COLOR}14` }}
                    >
                      <SubIcon size={18} style={{ color: STEP5_COLOR }} />
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

        <Connector color={STEP5_COLOR} />

        {/* STAGE 4 — Build & Deploy */}
        <div className="mb-10">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="h-[4px] w-full" style={{ backgroundColor: STEP6_COLOR }} />
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <StepCircle icon={Rocket} color={STEP6_COLOR} />
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                    style={{ color: STEP6_COLOR }}
                  >
                    Build &amp; Deploy
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                    Put Your Skills to Work
                  </h2>
                </div>
              </div>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-3">
                Every learning journey culminates in a project &mdash; something real, scoped to your level and your organisation's transformation goals. This isn't a classroom exercise. It's a live deliverable that demonstrates what you've built.
              </p>
              <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                The scope of your project is shaped during the Discover &amp; Personalise stage and refined with your manager and OXYGY coach as you progress. It grows with you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Target, title: 'Scoped to Your Level', desc: 'Projects are calibrated to the levels you\'ve completed — a Level 2 participant builds an agent; a Level 5 participant ships a full application' },
                  { icon: Wrench, title: 'Built With Support', desc: 'Your OXYGY coach and manager provide checkpoints throughout the build phase — this isn\'t solo work' },
                  { icon: Share2, title: 'Embedded and Shared', desc: 'Finished projects are presented to your cohort and, where relevant, deployed into your team\'s actual workflow' },
                ].map(({ icon: SubIcon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E2E8F0]"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${STEP6_COLOR}14` }}
                    >
                      <SubIcon size={18} style={{ color: STEP6_COLOR }} />
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
          ctaHref="/app/dashboard"
          accentColor={ACCENT_DARK}
        />
      </div>
    </div>
  );
};
