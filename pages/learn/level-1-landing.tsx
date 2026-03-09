import React, { useState } from 'react';

/* ── Google Fonts ── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    .cr-level-card { transition: box-shadow 200ms ease, border-color 250ms ease; }
    .cr-level-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .cr-chevron { transition: transform 250ms ease; }
    .cr-chevron.open { transform: rotate(180deg); }
    .cr-topic-expand { overflow: hidden; transition: max-height 400ms ease, opacity 300ms ease; }
    @media (max-width: 767px) {
      .cr-how-grid { grid-template-columns: 1fr 1fr !important; }
      .cr-phase-grid { grid-template-columns: 1fr !important; }
      .cr-prog-row { flex-wrap: wrap !important; }
      .cr-topic-cards { flex-direction: column !important; }
    }
  `}</style>
);

/* ── Brand Tokens ── */
const C = {
  navy: "#1A202C", navyMid: "#2D3748", teal: "#38B2AC", tealDark: "#2C9A94",
  tealLight: "#E6FFFA", mint: "#A8F0E0", border: "#E2E8F0", bg: "#F7FAFC",
  body: "#4A5568", light: "#718096", muted: "#A0AEC0",
};
const F = { h: "'DM Sans', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

/* ── Level Accent Colors ── */
const LC: Record<number, { accent: string; dark: string; light: string }> = {
  1: { accent: "#A8F0E0", dark: "#2C9A94", light: "#E6FFFA" },
  2: { accent: "#C3D0F5", dark: "#5B6DC2", light: "#EBF4FF" },
  3: { accent: "#F7E8A4", dark: "#C4A934", light: "#FFFBEB" },
  4: { accent: "#F5B8A0", dark: "#D47B5A", light: "#FFF5F0" },
  5: { accent: "#38B2AC", dark: "#2C9A94", light: "#E6FFFA" },
};

/* ── Phase details per topic ── */
interface PhaseDetail {
  icon: string;
  label: string;
  detail: string;
  link?: { text: string; href: string };
}

interface Topic {
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  hash?: string;
  status: "available" | "coming-soon";
  phases: PhaseDetail[];
}

interface Level {
  level: number;
  name: string;
  subtitle: string;
  description: string;
  topics: Topic[];
}

const LEVELS: Level[] = [
  {
    level: 1,
    name: "AI Fundamentals",
    subtitle: "Foundations & Awareness",
    description: "Master the art of AI communication. Learn how to write prompts that consistently deliver high-quality outputs, and how to give AI the context it needs to perform like a collaborator \u2014 not just a tool.",
    topics: [
      {
        title: "Prompt Engineering",
        subtitle: "The mechanics of asking well",
        summary: "The RCTF framework, structured prompting techniques, and the spectrum from brain dumps to repeatable templates.",
        description: "Learn the RCTF framework and advanced prompting techniques to get dramatically better AI outputs \u2014 from brain dumps to structured prompts that deliver consistent, high-quality results. You\u2019ll practise building prompts across the spectrum and leave with five ready-to-use templates.",
        hash: "#learn-level-1-prompt",
        status: "available",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "13-slide interactive module covering the RCTF framework, prompting spectrum, drag-and-drop exercises, and a branching scenario." },
          { icon: "\u25CE", label: "Read", detail: "2 curated articles on structured prompting with guided reflection prompts to connect the theory to your own work." },
          { icon: "\u25B7", label: "Watch", detail: "2 short videos demonstrating prompt engineering in practice, each followed by knowledge check questions." },
          { icon: "\u25C8", label: "Practice", detail: "Apply what you\u2019ve learned in the Prompt Playground \u2014 build, test, and refine prompts using real AI tools.", link: { text: "Open Prompt Playground", href: "#playground" } },
        ],
      },
      {
        title: "Context Engineering",
        subtitle: "What you give AI matters as much as what you ask",
        summary: "Documents, system prompts, and project structures \u2014 the three layers that transform AI from a tool into a collaborator.",
        description: "Move from prompting to partnership. Learn how to use documents, system prompts, and project structures to give AI deep, persistent context that transforms every interaction. Understand the three layers of context and when to use each one.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on the three context layers: in-prompt, documents, and project organisation." },
          { icon: "\u25CE", label: "Read", detail: "Articles exploring real-world context engineering with guided reflection on your own document workflows." },
          { icon: "\u25B7", label: "Watch", detail: "Videos showing the before-and-after impact of context engineering on AI output quality." },
          { icon: "\u25C8", label: "Practice", detail: "Save a structured prompt into your workflow and configure a project with persistent context." },
        ],
      },
    ],
  },
  {
    level: 2,
    name: "Applied Capability",
    subtitle: "Building & Sharing AI Agents",
    description: "The prompts you built in Level 1 become the system prompts inside your agents. Learn to design, scope, and standardise AI agents \u2014 then turn them into reusable tools your whole team can rely on.",
    topics: [
      {
        title: "Designing AI Agents",
        subtitle: "What an agent is, when to use one, how to scope it",
        summary: "System prompt architecture, role definition, behavioural guardrails, and knowing when an agent is the right solution.",
        description: "System prompt architecture, role definition, and behavioural guardrails \u2014 how to think about agent design from instruction to output. Learn when an agent is the right solution and how to scope it so it performs reliably within defined boundaries.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on agent anatomy: system prompts, role definition, scope, and guardrails." },
          { icon: "\u25CE", label: "Read", detail: "Articles on agent design patterns with reflection prompts on your own use cases." },
          { icon: "\u25B7", label: "Watch", detail: "Videos walking through agent design decisions and common pitfalls." },
          { icon: "\u25C8", label: "Practice", detail: "Design and configure your first AI agent using the Agent Builder.", link: { text: "Open Agent Builder", href: "#agent-builder" } },
        ],
      },
      {
        title: "Build Once, Share Always",
        subtitle: "From personal tool to team asset",
        summary: "Templating agents for consistent team-wide outputs \u2014 standardised inputs, standardised results, scalable capability.",
        description: "How to template an agent so it produces consistent outputs across the team. Standardised inputs, standardised outputs \u2014 turning a one-off personal tool into a scalable, shareable capability that the whole organisation benefits from.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on agent templating, input standardisation, and team deployment." },
          { icon: "\u25CE", label: "Read", detail: "Case studies of agents scaled across teams, with reflection on your own standardisation opportunities." },
          { icon: "\u25B7", label: "Watch", detail: "Videos on the journey from personal tool to team-wide capability." },
          { icon: "\u25C8", label: "Practice", detail: "Template and share an agent configuration using the Agent Builder.", link: { text: "Open Agent Builder", href: "#agent-builder" } },
        ],
      },
    ],
  },
  {
    level: 3,
    name: "Systemic Integration",
    subtitle: "Workflows & Governance",
    description: "Deconstruct business processes into AI-powered workflows with multiple connected agents \u2014 and build the accountability layer that makes automation trustworthy and auditable.",
    topics: [
      {
        title: "Mapping AI Workflows",
        subtitle: "Triggers, AI steps, and outputs",
        summary: "Deconstructing business processes into automated pipelines \u2014 triggers, agent chaining, handoff points, and reliable multi-step flows.",
        description: "How to deconstruct a business process into triggers, AI steps, and outputs. The logic of agent chaining, handoff points, and multi-step automation that runs reliably. You\u2019ll map a real workflow from manual process to automated pipeline.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on workflow decomposition, trigger design, and agent chaining logic." },
          { icon: "\u25CE", label: "Read", detail: "Articles on workflow mapping methodologies with reflection on your own business processes." },
          { icon: "\u25B7", label: "Watch", detail: "Videos showing real workflow transformations from manual to automated." },
          { icon: "\u25C8", label: "Practice", detail: "Map and build a multi-step workflow using the Workflow Designer.", link: { text: "Open Workflow Designer", href: "#workflow-designer" } },
        ],
      },
      {
        title: "Human-in-the-Loop Design",
        subtitle: "Accountability in automated pipelines",
        summary: "Rationale trails, review gates, and feedback loops \u2014 the governance layer that makes AI workflows safe to scale.",
        description: "How to build rationale trails, review gates, and feedback loops into automated pipelines \u2014 the governance layer that makes AI workflows safe to scale across the organisation. Learn to balance speed with accountability.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on governance design: review gates, rationale trails, and escalation paths." },
          { icon: "\u25CE", label: "Read", detail: "Articles on AI governance frameworks with reflection on your organisation\u2019s accountability needs." },
          { icon: "\u25B7", label: "Watch", detail: "Videos on building trust in automated systems through transparent design." },
          { icon: "\u25C8", label: "Practice", detail: "Add governance checkpoints to an existing workflow in the Workflow Designer.", link: { text: "Open Workflow Designer", href: "#workflow-designer" } },
        ],
      },
    ],
  },
  {
    level: 4,
    name: "Interactive Dashboards",
    subtitle: "UX-First AI Design",
    description: "The automated pipeline from Level 3 now feeds a designed interface. Learn to work backwards from what the user needs to see \u2014 and turn raw AI outputs into polished, interactive experiences.",
    topics: [
      {
        title: "Designing Back from the User",
        subtitle: "UX-first thinking for AI outputs",
        summary: "Working backwards from user needs, not forwards from data. User-centred design principles for AI-powered interfaces.",
        description: "Working backwards from what the end user needs to see, rather than forwards from what data is available. User-centred design principles applied to AI-powered interfaces and dashboards \u2014 ensuring every element serves a real decision.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on user-centred AI design, information hierarchy, and decision-driven layouts." },
          { icon: "\u25CE", label: "Read", detail: "Articles on UX-first thinking for data products with reflection on your own dashboard needs." },
          { icon: "\u25B7", label: "Watch", detail: "Videos on designing AI interfaces that users actually want to use." },
          { icon: "\u25C8", label: "Practice", detail: "Design a dashboard layout using the Dashboard Designer.", link: { text: "Open Dashboard Designer", href: "#dashboard-design" } },
        ],
      },
      {
        title: "From Data to Designed Intelligence",
        subtitle: "L3 workflow output becomes L4 input",
        summary: "Turning automated pipeline outputs into structured, interactive dashboard components that users can actually act on.",
        description: "How AI-processed outputs become structured, interactive dashboard components. The architecture that connects automated pipelines to polished, user-facing front-ends \u2014 turning raw data into designed intelligence.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on data transformation, component design, and pipeline-to-dashboard architecture." },
          { icon: "\u25CE", label: "Read", detail: "Articles on connecting AI outputs to visual interfaces with reflection on your data flows." },
          { icon: "\u25B7", label: "Watch", detail: "Videos demonstrating the pipeline-to-dashboard connection in practice." },
          { icon: "\u25C8", label: "Practice", detail: "Connect a workflow output to a live dashboard component.", link: { text: "Open Dashboard Designer", href: "#dashboard-design" } },
        ],
      },
    ],
  },
  {
    level: 5,
    name: "Full AI Applications",
    subtitle: "Complete Product Builds",
    description: "L3 workflows + L4 front-ends + individual accounts = a complete application. The Oxygy platform itself is the worked example \u2014 the learner is using the thing they\u2019re learning to build.",
    topics: [
      {
        title: "Personalised User Experiences",
        subtitle: "Accounts, roles, and per-user memory",
        summary: "Individual accounts, role-based journeys, and per-user memory \u2014 the architecture of personalisation in AI products.",
        description: "How individual accounts, role-based journeys, and per-user memory work. The architecture of personalisation that turns a generic tool into an adaptive, intelligent product that learns and adapts to each user.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module on personalisation architecture: accounts, roles, memory, and adaptive journeys." },
          { icon: "\u25CE", label: "Read", detail: "Articles on building personalised AI products with reflection on your own product vision." },
          { icon: "\u25B7", label: "Watch", detail: "Videos exploring how leading AI products create personalised experiences." },
          { icon: "\u25C8", label: "Practice", detail: "Configure role-based user journeys in the Product Architecture Sprint.", link: { text: "Open Product Architecture", href: "#product-architecture" } },
        ],
      },
      {
        title: "The Full-Stack AI Build",
        subtitle: "The platform you\u2019re using is the example",
        summary: "Combining workflows, front-ends, and user accounts into a complete application \u2014 using this platform as the worked example.",
        description: "How L3 workflows + L4 front-ends + individual accounts combine into a complete application. A worked example using the Oxygy platform you\u2019re learning on right now \u2014 the learner is using the thing they\u2019re learning to build.",
        status: "coming-soon",
        phases: [
          { icon: "\u25B6", label: "E-Learning", detail: "Interactive module deconstructing the Oxygy platform as a Level 5 application." },
          { icon: "\u25CE", label: "Read", detail: "Architecture deep-dive articles with reflection on your own full-stack AI ambitions." },
          { icon: "\u25B7", label: "Watch", detail: "Videos walking through the complete build from workflows to shipped product." },
          { icon: "\u25C8", label: "Practice", detail: "Assemble a complete application using the Product Architecture Sprint.", link: { text: "Open Product Architecture", href: "#product-architecture" } },
        ],
      },
    ],
  },
];

/* ── Underline Component ── */
const TU = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    {children}
    <span style={{ position: "absolute", left: 0, bottom: -2, width: "100%", height: 4, background: color, opacity: 0.8, borderRadius: 2 }} />
  </span>
);

/* ── Chevron SVG ── */
const Chevron = ({ open, color, size = 18 }: { open: boolean; color?: string; size?: number }) => (
  <svg className={`cr-chevron ${open ? "open" : ""}`} width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 7.5L10 12.5L15 7.5" stroke={color || C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function CourseResources() {
  // Track which topics are expanded: "L1-T0", "L2-T1", etc.
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (levelNum: number, topicIdx: number) => {
    const key = `L${levelNum}-T${topicIdx}`;
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 68 }}>
      <FontStyle />

      {/* ══════════════════════════════════════
         HERO
         ══════════════════════════════════════ */}
      <div style={{ background: "#fff", paddingTop: 96, paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <span style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em",
            padding: "6px 16px", borderRadius: 9999,
            background: C.tealLight, color: C.tealDark, border: `1px solid ${C.teal}`,
            marginBottom: 24, fontFamily: F.b,
          }}>
            Course Resources
          </span>

          <h1 style={{
            fontFamily: F.h, fontSize: 48, fontWeight: 800,
            color: C.navy, lineHeight: 1.15, margin: "0 0 16px",
          }}>
            Your AI Upskilling<br /><TU color={C.teal}>Learning Journey</TU>
          </h1>

          <p style={{
            fontSize: 18, color: C.light, fontFamily: F.b,
            lineHeight: 1.7, maxWidth: 700, margin: "0 auto",
          }}>
            Five progressive levels \u2014 from writing your first prompt to building full AI-powered
            applications. Each topic follows a structured learning path designed to build real capability.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
         HOW EACH TOPIC IS STRUCTURED
         ══════════════════════════════════════ */}
      <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "40px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: F.h, fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
              How Each Topic is Structured
            </h2>
            <p style={{ fontSize: 14, color: C.light, fontFamily: F.b, margin: 0, lineHeight: 1.6, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              Every topic follows the same four-phase learning path \u2014 building from
              concept to application in a structured, hands-on progression.
            </p>
          </div>

          <div className="cr-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { step: 1, icon: "\u25B6", title: "E-Learning", desc: "Interactive slide-based module with key concepts, frameworks, and built-in practice exercises to test your understanding." },
              { step: 2, icon: "\u25CE", title: "Read", desc: "Curated articles paired with guided reflection prompts \u2014 connecting theory to your own working context and experience." },
              { step: 3, icon: "\u25B7", title: "Watch", desc: "Short, focused videos followed by knowledge check questions that reinforce what you\u2019ve learned and surface gaps." },
              { step: 4, icon: "\u25C8", title: "Practice", desc: "Hands-on activities using real AI tools \u2014 apply what you\u2019ve learned to practical tasks you can use at work tomorrow." },
            ].map(item => (
              <div key={item.step} style={{ textAlign: "center", padding: "0 8px" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "#fff", border: `2px solid ${C.mint}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, color: C.tealDark,
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    position: "absolute", top: -4, right: -6,
                    width: 20, height: 20, borderRadius: "50%",
                    background: C.teal, color: "#fff",
                    fontSize: 10, fontWeight: 700, fontFamily: F.h,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.step}
                  </span>
                </div>
                <p style={{ fontFamily: F.h, fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 13, color: C.light, fontFamily: F.b, lineHeight: 1.55, margin: 0, minHeight: 60 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "20px 0 0", gap: 4 }}>
            {[1, 2, 3, 4].map(n => (
              <React.Fragment key={n}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />
                {n < 4 && <div style={{ flex: 1, maxWidth: 180, height: 2, background: `linear-gradient(90deg, ${C.teal}, ${C.mint})` }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
         LEVEL CARDS
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {LEVELS.map(level => {
            const lc = LC[level.level];
            const hasAvailable = level.topics.some(t => t.status === "available");

            return (
              <div
                key={level.level}
                className="cr-level-card"
                style={{
                  background: "#fff",
                  border: `1.5px solid ${lc.accent}`,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {/* ─── Level header ─── */}
                <div style={{ padding: "24px 28px 0" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                      background: lc.light, border: `2px solid ${lc.accent}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: F.h, fontSize: 16, fontWeight: 800, color: lc.dark,
                    }}>
                      L{level.level}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: lc.dark, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 4px", fontFamily: F.b }}>
                        {level.subtitle}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3 style={{ fontFamily: F.h, fontSize: 22, fontWeight: 700, color: C.navy, margin: 0 }}>
                          {level.name}
                        </h3>
                        {!hasAvailable && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "3px 9px",
                            background: "#FEFCBF", color: "#975A16",
                            borderRadius: 10, fontFamily: F.b, textTransform: "uppercase", letterSpacing: 0.5,
                          }}>
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, margin: "0 0 20px", lineHeight: 1.65, maxWidth: 780 }}>
                    {level.description}
                  </p>
                </div>

                {/* ─── Topic sub-cards ─── */}
                <div className="cr-topic-cards" style={{ display: "flex", gap: 14, padding: "0 28px 24px", flexWrap: "wrap" }}>
                  {level.topics.map((topic, ti) => {
                    const isAvail = topic.status === "available";
                    const isOpen = expandedTopics.has(`L${level.level}-T${ti}`);

                    return (
                      <div
                        key={ti}
                        style={{
                          flex: 1, minWidth: 280,
                          background: lc.light,
                          border: `1.5px solid ${isOpen ? lc.dark : lc.accent}`,
                          borderRadius: 14,
                          overflow: "hidden",
                          transition: "border-color 250ms ease",
                        }}
                      >
                        {/* Topic collapsed header */}
                        <div style={{ padding: "16px 18px" }}>
                          {/* Title row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{
                              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                              background: lc.dark, color: "#fff",
                              fontSize: 11, fontWeight: 700, fontFamily: F.h,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {ti + 1}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.h, flex: 1 }}>
                              {topic.title}
                            </span>
                            {!isAvail && (
                              <span style={{
                                fontSize: 8, fontWeight: 700, padding: "2px 7px",
                                background: "#FEFCBF", color: "#975A16",
                                borderRadius: 6, fontFamily: F.b, textTransform: "uppercase",
                              }}>
                                Soon
                              </span>
                            )}
                          </div>

                          {/* Summary */}
                          <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.55, margin: "0 0 12px" }}>
                            {topic.summary}
                          </p>

                          {/* Action row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {isAvail && (
                              <a
                                href={topic.hash}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, fontWeight: 700, color: lc.dark, fontFamily: F.b,
                                  textDecoration: "none",
                                  padding: "5px 14px",
                                  background: "#fff",
                                  border: `1.5px solid ${lc.dark}`,
                                  borderRadius: 18,
                                }}
                              >
                                Start topic &rarr;
                              </a>
                            )}
                            <button
                              onClick={() => toggleTopic(level.level, ti)}
                              style={{
                                cursor: "pointer", border: "none", background: "none",
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "5px 0", fontSize: 12, color: C.muted, fontFamily: F.b, fontWeight: 600,
                              }}
                            >
                              {isOpen ? "Hide details" : "View details"}
                              <Chevron open={isOpen} size={14} color={C.muted} />
                            </button>
                          </div>
                        </div>

                        {/* ─── Expanded: phase details in 2-col grid ─── */}
                        <div
                          className="cr-topic-expand"
                          style={{
                            maxHeight: isOpen ? 600 : 0,
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          <div style={{
                            background: "#fff",
                            borderTop: `1px solid ${lc.accent}`,
                            padding: "18px 18px 20px",
                          }}>
                            {/* Full description */}
                            <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.65, margin: "0 0 14px" }}>
                              {topic.description}
                            </p>

                            {/* 2-column phase grid */}
                            <div className="cr-phase-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              {topic.phases.map(phase => (
                                <div key={phase.label} style={{
                                  padding: "12px 14px",
                                  background: C.bg,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 10,
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{
                                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                      background: isAvail ? lc.light : C.bg,
                                      border: `1px solid ${isAvail ? lc.accent : C.border}`,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      fontSize: 10, color: isAvail ? lc.dark : C.muted,
                                    }}>
                                      {phase.icon}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: F.h }}>
                                      {phase.label}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.5, margin: 0 }}>
                                    {phase.detail}
                                  </p>
                                  {phase.link && (
                                    <a
                                      href={phase.link.href}
                                      style={{
                                        display: "inline-block", marginTop: 8,
                                        fontSize: 11, fontWeight: 600, color: lc.dark, fontFamily: F.b,
                                        textDecoration: "none",
                                      }}
                                    >
                                      {phase.link.text} &rarr;
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
         PROGRESSION PATH
         ══════════════════════════════════════ */}
      <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "40px 0 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: F.h, fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>
            The Progression Path
          </h2>
          <p style={{ fontSize: 14, color: C.light, fontFamily: F.b, margin: "0 0 28px", lineHeight: 1.6, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
            Each level builds directly on the one before it. The prompts from L1 become agent instructions in L2, which chain into workflows in L3, feed dashboards in L4, and power full applications in L5.
          </p>

          <div className="cr-prog-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {LEVELS.map((level, i) => {
              const lc = LC[level.level];
              return (
                <React.Fragment key={level.level}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#fff", border: `1.5px solid ${lc.accent}`,
                    borderRadius: 10, padding: "8px 12px",
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: lc.light, border: `1px solid ${lc.accent}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: F.h, fontSize: 10, fontWeight: 800, color: lc.dark,
                    }}>
                      L{level.level}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.b }}>
                      {level.name}
                    </span>
                  </div>
                  {i < LEVELS.length - 1 && (
                    <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                        <path d="M10 1L15 6L10 11M0 6H14.5" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
