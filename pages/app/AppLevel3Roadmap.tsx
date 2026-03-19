import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useLevelData, TOTAL_PHASES, PHASE_LABELS } from '../../hooks/useLevelData';

/* ── Brand tokens ── */
const C = {
  navy: '#1A202C',
  navyMid: '#2D3748',
  yellow: '#FBE8A6',
  yellowDark: '#C4A934',
  yellowDeep: '#8A6A00',
  yellowLight: '#FFFBEB',
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
  .l3-accordion-body { overflow: hidden; transition: max-height 380ms ease, opacity 280ms ease; }
  .l3-topic-card { transition: border-color 220ms ease, box-shadow 220ms ease; }
  .l3-topic-card:hover { box-shadow: 0 3px 16px rgba(0,0,0,0.06); }
  .l3-chevron { transition: transform 260ms ease; }
  .l3-chevron.open { transform: rotate(180deg); }
  .l3-cta-btn { transition: background 200ms ease, transform 120ms ease; }
  .l3-cta-btn:hover { transform: translateY(-1px); }
  @keyframes l3FadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .l3-fade-up { animation: l3FadeUp 0.4s ease forwards; }
`;

/* ── Topic data (L3 content) ── */
interface LearningObjective {
  text: string;
}

interface TopicMeta {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  mandatory: boolean;
  available: boolean;
  objectives: LearningObjective[];
  formats: Array<{ icon: string; label: string }>;
}

const L3_TOPICS: TopicMeta[] = [
  {
    id: 1,
    label: 'Topic 1',
    title: 'Mapping a Multi-Step AI Workflow',
    subtitle: 'From a familiar process to a structured node-based design',
    mandatory: true,
    available: true,
    objectives: [
      { text: 'Understand the three-layer model: inputs, processing, and outputs' },
      { text: 'Translate a familiar professional process into a node-based workflow' },
      { text: 'Identify where handoffs between steps create risk or opportunity' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 2,
    label: 'Topic 2',
    title: 'Choosing the Right Nodes for Your Process',
    subtitle: 'Matching node types to the specific requirements of a task',
    mandatory: true,
    available: false,
    objectives: [
      { text: 'Learn the core node types: triggers, AI actions, transforms, conditions, and outputs' },
      { text: 'Match node types to the specific requirements of a given task' },
      { text: 'Avoid common design mistakes when selecting and sequencing nodes' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 3,
    label: 'Topic 3',
    title: 'Designing for Failure',
    subtitle: 'What happens when a workflow breaks — and how to plan for it',
    mandatory: true,
    available: false,
    objectives: [
      { text: 'Understand the most common points of failure in AI workflows' },
      { text: 'Build error-handling logic into workflow design from the start' },
      { text: 'Know when a failure should trigger a human escalation vs. an automated retry' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
      { icon: '◈', label: 'Practice' },
    ],
  },
  {
    id: 4,
    label: 'Topic 4',
    title: 'Human Checkpoints in Automated Workflows',
    subtitle: 'Balancing automation efficiency with appropriate human oversight',
    mandatory: true,
    available: false,
    objectives: [
      { text: 'Identify the moments in a workflow where human judgment is non-negotiable' },
      { text: 'Design review and approval steps without creating bottlenecks' },
      { text: 'Balance automation efficiency with appropriate human oversight' },
    ],
    formats: [
      { icon: '▶', label: 'E-Learning' },
    ],
  },
];

/* ── Chevron SVG ── */
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`l3-chevron${open ? ' open' : ''}`}
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
    background: C.yellowLight,
    border: `1px solid ${C.yellow}`,
    borderRadius: 20,
    fontSize: 11, fontWeight: 600, color: C.yellowDeep,
    fontFamily: F.b,
  }}>
    <span style={{ fontSize: 10 }}>{icon}</span>
    {label}
  </span>
);

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AppLevel3Roadmap() {
  const { userProfile } = useAppContext();
  const { levelData, loading } = useLevelData(3);
  const navigate = useNavigate();

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
  const mandatoryTopics = L3_TOPICS.filter(t => t.mandatory);
  const completedMandatory = mandatoryTopics.filter(t => getTopicProgress(t.id).done).length;
  const totalPhases = L3_TOPICS.length * TOTAL_PHASES;
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
              background: C.yellowLight, border: `1px solid ${C.yellow}`,
              fontSize: 11, fontWeight: 700, color: C.yellowDeep, fontFamily: F.b,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 10,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5,
                background: C.yellow, color: C.yellowDeep,
                fontSize: 9, fontWeight: 800, fontFamily: F.h,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>L3</span>
              Workflow Designer
            </div>

            <h1 style={{
              fontFamily: F.h, fontSize: 26, fontWeight: 800,
              color: C.navy, margin: '0 0 6px', lineHeight: 1.2,
            }}>
              Your Level 3 Roadmap
            </h1>
            <p style={{ fontSize: 14, color: C.light, margin: 0, lineHeight: 1.6, maxWidth: 540 }}>
              4 mandatory topics. Complete all topics to unlock Level 4.
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
                  stroke={C.yellowDark} strokeWidth="4"
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
          {L3_TOPICS.map((topic, idx) => {
            const isOpen = openTopics.has(topic.id);
            const progress = getTopicProgress(topic.id);
            const isLast = idx === L3_TOPICS.length - 1;

            return (
              <div key={topic.id} style={{ position: 'relative' }}>
                {/* Vertical connector line */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    left: 19, top: 48,
                    width: 2,
                    height: '100%',
                    background: progress.done
                      ? `linear-gradient(180deg, ${C.yellowDark}, ${C.yellow})`
                      : `linear-gradient(180deg, ${C.border}, ${C.border})`,
                    zIndex: 0,
                    borderRadius: 2,
                  }} />
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
                      ? C.yellowDark
                      : topic.available
                        ? C.yellowLight
                        : C.bg,
                    border: `2px solid ${
                      progress.done ? C.yellowDark : topic.available ? C.yellow : C.border
                    }`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 250ms ease',
                  }}>
                    {progress.done ? (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10L8.5 13.5L15 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        color: topic.available ? C.yellowDeep : C.muted,
                        fontFamily: F.h,
                      }}>
                        {topic.label.replace('Topic ', '')}
                      </span>
                    )}
                  </div>

                  {/* Accordion card */}
                  <div
                    className="l3-topic-card"
                    style={{
                      flex: 1,
                      background: progress.done ? C.yellowLight : '#FFFDF0',
                      border: `1.5px solid ${
                        isOpen
                          ? C.yellowDark
                          : progress.done
                            ? C.yellow
                            : '#EDE8C0'
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
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px',
                            background: C.yellowLight, color: C.yellowDeep,
                            border: `1px solid ${C.yellow}`,
                            borderRadius: 10, fontFamily: F.b, textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>
                            Mandatory
                          </span>
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
                              accent={C.yellowDark}
                            />
                          </div>
                        )}
                      </div>

                      <Chevron open={isOpen} />
                    </button>

                    {/* ── Accordion body ── */}
                    <div
                      className="l3-accordion-body"
                      style={{
                        maxHeight: isOpen ? 600 : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div style={{
                        padding: '0 18px 18px',
                        borderTop: `1px solid #EDE8C0`,
                        paddingTop: 16,
                      }}>

                        {/* Learning objectives */}
                        <div style={{ marginBottom: 16 }}>
                          <p style={{
                            fontSize: 11, fontWeight: 700, color: C.yellowDeep,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            fontFamily: F.b, margin: '0 0 10px',
                          }}>
                            Learning Objectives
                          </p>
                          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {topic.objectives.map((obj, i) => {
                              const objColors = [
                                { bg: C.yellowLight, border: C.yellow, text: C.yellowDeep },
                                { bg: '#EBF4FF', border: '#C3D0F5', text: '#3A4FA0' },
                                { bg: '#E6FFFA', border: '#A8F0E0', text: '#1A6B5F' },
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

                        {/* Format chips */}
                        {topic.formats.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                            {topic.formats.map((f, i) => (
                              <FormatChip key={i} icon={f.icon} label={f.label} />
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        {topic.available && (
                          <button
                            className="l3-cta-btn"
                            onClick={() => navigate(progress.done ? '/app/level?phase=1&level=3' : '/app/level?level=3')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '9px 18px',
                              background: progress.done ? C.bg : C.yellowDark,
                              color: progress.done ? C.body : '#FFFFFF',
                              border: `1.5px solid ${progress.done ? C.border : C.yellowDark}`,
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
          <div className="l3-fade-up" style={{
            marginTop: 28,
            padding: '18px 20px',
            background: C.yellowLight,
            border: `1.5px solid ${C.yellow}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.yellowDark, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L8.5 13.5L15 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: F.h, fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>
                Level 3 topics complete
              </p>
              <p style={{ fontSize: 12, color: C.light, fontFamily: F.b, margin: 0 }}>
                You're ready to start Level 4 — Dashboard Designer.
              </p>
            </div>
            <button
              className="l3-cta-btn"
              onClick={() => navigate('/app/journey')}
              style={{
                marginLeft: 'auto', flexShrink: 0,
                padding: '8px 16px',
                background: C.yellowDark, color: '#FFFFFF',
                border: 'none', borderRadius: 20,
                fontSize: 12, fontWeight: 700, fontFamily: F.b, cursor: 'pointer',
              }}
            >
              Go to Level 4 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
