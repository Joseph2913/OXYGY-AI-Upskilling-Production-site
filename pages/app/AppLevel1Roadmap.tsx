import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useLevelData, TOTAL_PHASES, PHASE_LABELS } from '../../hooks/useLevelData';

/* ── Brand tokens ── */
const C = {
  navy: '#1A202C',
  navyMid: '#2D3748',
  teal: '#38B2AC',
  tealDark: '#2C9A94',
  tealLight: '#E6FFFA',
  mint: '#A8F0E0',
  mintDark: '#1A6B5F',
  border: '#E2E8F0',
  bg: '#F7FAFC',
  body: '#4A5568',
  light: '#718096',
  muted: '#A0AEC0',
};

const F = {
  h: "'DM Sans', system-ui, sans-serif",
  b: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .l1-accordion-body { overflow: hidden; transition: max-height 380ms ease, opacity 280ms ease; }
  .l1-topic-card { transition: border-color 220ms ease, box-shadow 220ms ease; }
  .l1-topic-card:hover { box-shadow: 0 3px 16px rgba(0,0,0,0.06); }
  .l1-chevron { transition: transform 260ms ease; }
  .l1-chevron.open { transform: rotate(180deg); }
  .l1-cta-btn { transition: background 200ms ease, transform 120ms ease; }
  .l1-cta-btn:hover { transform: translateY(-1px); }
  @keyframes l1FadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .l1-fade-up { animation: l1FadeUp 0.4s ease forwards; }
`;

/* ── Topic data (L1 content) ── */
interface LearningObjective {
  text: string;
}

interface TopicMeta {
  id: number;
  label: string; // "Topic 1", "Topic A"
  title: string;
  subtitle: string;
  mandatory: boolean;
  available: boolean;
  objectives: LearningObjective[];
  formats: Array<{ icon: string; label: string }>;
}

const L1_TOPICS: TopicMeta[] = [
  {
    id: 1,
    label: 'Topic 1',
    title: 'Prompt Engineering Essentials',
    subtitle: 'From vague requests to structured, repeatable prompts',
    mandatory: true,
    available: true,
    objectives: [
      { text: 'Apply a structured prompting framework to common business tasks — drafting, summarising, and structuring communications' },
      { text: 'Choose the right prompting approach for the situation — brain dump, conversational, or Blueprint' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 2,
    label: 'Topic 2',
    title: 'Context Engineering',
    subtitle: 'Giving the AI what it needs to get it right',
    mandatory: true,
    available: false,
    objectives: [
      { text: 'Identify what context is missing from a prompt and which layer would most improve the output' },
      { text: 'Apply progressive context-loading to transform a vague request into a precise, high-quality prompt' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 3,
    label: 'Topic 3',
    title: 'AI Literacy & Responsible Use',
    subtitle: 'What to trust, what to verify, and what never to share',
    mandatory: true,
    available: false,
    objectives: [
      { text: 'Recognise the core failure modes of LLMs and when AI output needs verification before use' },
      { text: 'Apply a verify-before-acting habit — knowing when to use, review, or override AI output' },
      { text: 'Identify what sensitive information must never be entered into a public AI tool' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
    ],
  },
  {
    id: 4,
    label: 'Topic 4',
    title: 'Multimodal AI Awareness',
    subtitle: 'Beyond text: image, audio, and video',
    mandatory: false,
    available: false,
    objectives: [
      { text: 'Describe what image, audio, and video AI tools can produce and where they add value' },
      { text: 'Evaluate multimodal outputs with the same verify-before-acting mindset as text' },
    ],
    formats: [
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 5,
    label: 'Topic 5',
    title: 'Using AI to Learn Better',
    subtitle: 'AI as a thinking partner, not just a production tool',
    mandatory: false,
    available: false,
    objectives: [
      { text: 'Use AI as a thinking partner to synthesise reading, generate practice scenarios, and challenge your reasoning' },
      { text: 'Design a personal AI-assisted learning habit that complements formal training' },
    ],
    formats: [
      { icon: '◈', label: 'Practice' },
    ],
  },
];

/* ── Chevron SVG ── */
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`l1-chevron${open ? ' open' : ''}`}
    width={16} height={16} viewBox="0 0 20 20" fill="none"
    style={{ flexShrink: 0 }}
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Phase progress dots ── */
const PhaseDots = ({ completed, total = TOTAL_PHASES, accent }: { completed: number; total?: number; accent: string }) => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i < completed ? 14 : 10,
          height: 6,
          borderRadius: 3,
          background: i < completed ? accent : C.border,
          transition: 'all 220ms ease',
        }}
      />
    ))}
  </div>
);

/* ── Format chip ── */
const FormatChip = ({ icon, label }: { icon: string; label: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px',
    background: C.tealLight,
    border: `1px solid ${C.mint}`,
    borderRadius: 20,
    fontSize: 11, fontWeight: 600, color: C.mintDark,
    fontFamily: F.b,
  }}>
    <span style={{ fontSize: 10 }}>{icon}</span>
    {label}
  </span>
);

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AppLevel1Roadmap() {
  const { userProfile } = useAppContext();
  const { levelData, loading } = useLevelData(1);
  const navigate = useNavigate();

  // Track which accordion cards are open (all closed by default, first open)
  const [openTopics, setOpenTopics] = useState<Set<number>>(new Set([1]));

  const toggleTopic = (id: number) => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Derive per-topic progress ── */
  const getTopicProgress = (topicId: number) => {
    const tp = levelData?.topicProgress.find(t => t.topicId === topicId);
    if (!tp) return { completedPhases: 0, done: false };
    const completedPhases = tp.phaseCompletions.filter(Boolean).length;
    return { completedPhases, done: !!tp.completedAt };
  };

  /* ── Overall progress ── */
  const mandatoryTopics = L1_TOPICS.filter(t => t.mandatory);
  const completedMandatory = mandatoryTopics.filter(t => getTopicProgress(t.id).done).length;
  const totalPhases = L1_TOPICS.length * TOTAL_PHASES;
  // Only count phases for available topics using real data
  const completedPhases = levelData
    ? levelData.topicProgress.reduce((sum, tp) => sum + tp.phaseCompletions.filter(Boolean).length, 0)
    : 0;

  const overallPct = Math.round((completedPhases / totalPhases) * 100);

  return (
    <div style={{ fontFamily: F.b, minHeight: '100vh', background: '#FFFFFF' }}>
      <style>{pageStyle}</style>

      {/* ══════════════════════════════════════
         PAGE HEADER
         ══════════════════════════════════════ */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: `1px solid ${C.border}`,
        padding: '28px 36px 24px',
      }}>
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/app/journey')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: C.light, fontFamily: F.b, fontWeight: 500,
            padding: 0, marginBottom: 16,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My Journey
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            {/* Level badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: C.tealLight, border: `1px solid ${C.mint}`,
              fontSize: 11, fontWeight: 700, color: C.mintDark, fontFamily: F.b,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 10,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5,
                background: C.mint, color: C.mintDark,
                fontSize: 9, fontWeight: 800, fontFamily: F.h,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>L1</span>
              AI Fundamentals &amp; Awareness
            </div>

            <h1 style={{
              fontFamily: F.h, fontSize: 26, fontWeight: 800,
              color: C.navy, margin: '0 0 6px', lineHeight: 1.2,
            }}>
              Your Level 1 Roadmap
            </h1>
            <p style={{ fontSize: 14, color: C.light, margin: 0, lineHeight: 1.6, maxWidth: 540 }}>
              3 mandatory topics + 2 optional. Complete the mandatory topics to unlock Level 2.
            </p>
          </div>

          {/* Progress ring / summary */}
          <div style={{
            background: C.bg,
            border: `1.5px solid ${C.border}`,
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            minWidth: 220,
          }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="21" fill="none" stroke={C.border} strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="21" fill="none"
                  stroke={C.teal} strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 21}`}
                  strokeDashoffset={`${2 * Math.PI * 21 * (1 - overallPct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                  style={{ transition: 'stroke-dashoffset 600ms ease' }}
                />
              </svg>
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 11, fontWeight: 800, color: C.navy, fontFamily: F.h,
              }}>
                {overallPct}%
              </span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: F.h, marginBottom: 3 }}>
                {completedMandatory} / {mandatoryTopics.length} mandatory
              </div>
              <div style={{ fontSize: 12, color: C.light, fontFamily: F.b }}>
                topics complete
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: F.b, marginTop: 3 }}>
                {completedPhases} of {totalPhases} learning phases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
         ROADMAP CONTENT
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 48px 64px' }}>

        {/* Topic list with vertical connector */}
        <div style={{ position: 'relative' }}>
          {L1_TOPICS.map((topic, idx) => {
            const isOpen = openTopics.has(topic.id);
            const progress = getTopicProgress(topic.id);
            const isLast = idx === L1_TOPICS.length - 1;
            const isMandatoryEnd = idx === 2; // after topic 3, divider before optional

            return (
              <div key={topic.id} style={{ position: 'relative' }}>
                {/* Vertical connector line */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    left: 19, top: 48,
                    width: 2,
                    height: isMandatoryEnd ? 'calc(100% + 12px)' : '100%',
                    background: progress.done
                      ? `linear-gradient(180deg, ${C.teal}, ${C.mint})`
                      : `linear-gradient(180deg, ${C.border}, ${C.border})`,
                    zIndex: 0,
                    borderRadius: 2,
                  }} />
                )}

                {/* Optional divider */}
                {idx === 3 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    margin: '8px 0 16px',
                  }}>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: C.muted,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      fontFamily: F.b, whiteSpace: 'nowrap',
                    }}>
                      Optional topics
                    </span>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                )}

                <div style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  marginBottom: isLast ? 0 : 12,
                  position: 'relative', zIndex: 1,
                }}>
                  {/* Status node */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: progress.done
                      ? C.teal
                      : topic.available
                        ? C.tealLight
                        : C.bg,
                    border: `2px solid ${
                      progress.done ? C.teal : topic.available ? C.mint : C.border
                    }`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 250ms ease',
                  }}>
                    {progress.done ? (
                      /* Checkmark */
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10L8.5 13.5L15 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        color: topic.available ? C.mintDark : C.muted,
                        fontFamily: F.h,
                      }}>
                        {topic.label.replace('Topic ', '')}
                      </span>
                    )}
                  </div>

                  {/* Accordion card */}
                  <div
                    className="l1-topic-card"
                    style={{
                      flex: 1,
                      background: progress.done
                        ? C.tealLight
                        : topic.mandatory
                          ? '#F0FFFC'
                          : '#F5F4FF',
                      border: `1.5px solid ${
                        isOpen
                          ? C.teal
                          : progress.done
                            ? C.mint
                            : topic.mandatory
                              ? '#C8F4EC'
                              : '#DDD9F7'
                      }`,
                      borderRadius: 14,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    {/* ── Card header (always visible) ── */}
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      style={{
                        width: '100%', border: 'none', cursor: 'pointer',
                        background: 'none', padding: '16px 18px',
                        textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Top row: badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: C.light,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            fontFamily: F.b,
                          }}>
                            {topic.label}
                          </span>
                          {topic.mandatory ? (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px',
                              background: C.tealLight, color: C.mintDark,
                              border: `1px solid ${C.mint}`,
                              borderRadius: 10, fontFamily: F.b, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Mandatory
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px',
                              background: C.bg, color: C.muted,
                              border: `1px solid ${C.border}`,
                              borderRadius: 10, fontFamily: F.b, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Optional
                            </span>
                          )}
                          {progress.done && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px',
                              background: '#F0FFF4', color: '#276749',
                              border: '1px solid #9AE6B4',
                              borderRadius: 10, fontFamily: F.b, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Complete
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div style={{
                          fontSize: 15, fontWeight: 700, color: C.navy,
                          fontFamily: F.h, marginBottom: 2,
                        }}>
                          {topic.title}
                        </div>
                        <div style={{ fontSize: 12, color: C.light, fontFamily: F.b }}>
                          {topic.subtitle}
                        </div>

                        {/* Phase progress dots */}
                        {(topic.available || progress.completedPhases > 0) && (
                          <div style={{ marginTop: 8 }}>
                            <PhaseDots
                              completed={progress.completedPhases}
                              accent={C.teal}
                            />
                          </div>
                        )}
                      </div>

                      <Chevron open={isOpen} />
                    </button>

                    {/* ── Accordion body ── */}
                    <div
                      className="l1-accordion-body"
                      style={{
                        maxHeight: isOpen ? 600 : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div style={{
                        padding: '0 18px 18px',
                        borderTop: `1px solid ${topic.mandatory ? '#C8F4EC' : '#DDD9F7'}`,
                        paddingTop: 16,
                      }}>

                        {/* Learning objectives */}
                        <div style={{ marginBottom: 16 }}>
                          <p style={{
                            fontSize: 11, fontWeight: 700, color: C.mintDark,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            fontFamily: F.b, margin: '0 0 10px',
                          }}>
                            Learning Objectives
                          </p>
                          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {topic.objectives.map((obj, i) => {
                              const objColors = [
                                { bg: C.tealLight, border: C.mint, text: C.mintDark },
                                { bg: '#EBF4FF', border: '#C3D0F5', text: '#3A4FA0' },
                                { bg: '#FFFBEB', border: '#F7E8A4', text: '#8A6A00' },
                              ];
                              const oc = objColors[i % objColors.length];
                              return (
                              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{
                                  flexShrink: 0,
                                  width: 20, height: 20,
                                  borderRadius: '50%',
                                  background: oc.bg,
                                  border: `1.5px solid ${oc.border}`,
                                  fontSize: 10, fontWeight: 700,
                                  color: oc.text, fontFamily: F.h,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {i + 1}
                                </span>
                                <span style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.55 }}>
                                  {obj.text}
                                </span>
                              </li>
                            );
                          })}
                          </ol>
                        </div>

                        {/* CTA */}
                        {topic.available && (
                          <button
                            className="l1-cta-btn"
                            onClick={() => navigate(progress.done ? '/app/level?phase=1' : '/app/level')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '9px 18px',
                              background: progress.done ? C.bg : C.teal,
                              color: progress.done ? C.body : '#FFFFFF',
                              border: `1.5px solid ${progress.done ? C.border : C.teal}`,
                              borderRadius: 24,
                              fontSize: 13, fontWeight: 700, fontFamily: F.b,
                              cursor: 'pointer',
                            }}
                          >
                            {progress.done
                              ? 'Review topic'
                              : progress.completedPhases > 0
                                ? 'Continue'
                                : 'Start topic'}
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                              <path d="M5 10H15M10 5L15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Level complete nudge ── */}
        {completedMandatory === mandatoryTopics.length && (
          <div className="l1-fade-up" style={{
            marginTop: 28,
            padding: '18px 20px',
            background: C.tealLight,
            border: `1.5px solid ${C.mint}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.teal, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L8.5 13.5L15 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: F.h, fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>
                Level 1 mandatory topics complete
              </p>
              <p style={{ fontSize: 12, color: C.light, fontFamily: F.b, margin: 0 }}>
                You're ready to start Level 2 — Applied Capability.
              </p>
            </div>
            <button
              className="l1-cta-btn"
              onClick={() => navigate('/app/journey')}
              style={{
                marginLeft: 'auto', flexShrink: 0,
                padding: '8px 16px',
                background: C.teal, color: '#FFFFFF',
                border: 'none', borderRadius: 20,
                fontSize: 12, fontWeight: 700, fontFamily: F.b, cursor: 'pointer',
              }}
            >
              Go to Level 2 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
