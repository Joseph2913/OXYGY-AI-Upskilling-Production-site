import React from 'react';
import {
  ArrowRight,
  Zap,
  Bot,
  GitBranch,
  Layout,
  Rocket,
  Terminal,
  MessageSquare,
  Workflow,
  PenTool,
  BarChart3,
} from 'lucide-react';
import { ArtifactClosing } from './ArtifactClosing';

const ACCENT = '#38B2AC';
const ACCENT_DARK = '#2C9A94';

/* ─── Level data ─── */
const TOOLS = [
  {
    level: 1,
    label: 'Level 1 — Fundamentals',
    name: 'Prompt Playground',
    color: '#2C9A94',
    colorLight: '#A8F0E0',
    icon: Zap,
    description:
      'A live sandbox where you write, test, and refine AI prompts in real time. Experiment with different structures, tones, and constraints — and see how the AI responds instantly.',
    capabilities: [
      'Write and test prompts with immediate AI feedback',
      'Compare different prompt structures side by side',
      'Save your best prompts to a personal Prompt Library',
      'Experiment with system prompts, user messages, and format controls',
    ],
    outcome: 'Leave with a personal library of tested, reusable prompts grounded in the Prompt Blueprint framework.',
    mockupIcon: Terminal,
    mockupLabel: 'Live prompt testing sandbox',
    mockupElements: [
      { label: 'System Prompt', color: '#A8F0E0' },
      { label: 'User Message', color: '#E6FFFA' },
      { label: 'AI Response', color: '#F0FFF4' },
    ],
  },
  {
    level: 2,
    label: 'Level 2 — Applied Capability',
    name: 'Agent Builder',
    color: '#5B6DC2',
    colorLight: '#C3D0F5',
    icon: Bot,
    description:
      'Design and configure custom AI agents with system prompts, personas, and role definitions. Build intelligent assistants tailored to your specific workflows — then share them across your team.',
    capabilities: [
      'Configure system prompts, personas, and agent behaviour',
      'Set constraints, tone, and structured response formats',
      'Test your agent in a live conversation interface',
      'Export agent configurations as reusable templates',
    ],
    outcome: 'Deploy a custom AI agent that runs the same way every time, for anyone on your team.',
    mockupIcon: MessageSquare,
    mockupLabel: 'Agent configuration & chat testing',
    mockupElements: [
      { label: 'Agent Persona', color: '#C3D0F5' },
      { label: 'Instructions', color: '#E8EDFC' },
      { label: 'Live Chat Test', color: '#F0F3FF' },
    ],
  },
  {
    level: 3,
    label: 'Level 3 — Systemic Integration',
    name: 'Workflow Canvas',
    color: '#C4A934',
    colorLight: '#FBE8A6',
    icon: GitBranch,
    description:
      'Map end-to-end automated AI pipelines visually. Chain agents together, define data inputs and outputs, and design human-in-the-loop checkpoints — before you build anything in Make, Zapier, or n8n.',
    capabilities: [
      'Drag-and-drop workflow mapping with AI agent nodes',
      'Define triggers, conditions, and branching logic',
      'Mark human review checkpoints with rationale trails',
      'Export workflow diagrams as implementation documentation',
    ],
    outcome: 'A complete visual workflow blueprint ready to implement in your automation platform of choice.',
    mockupIcon: Workflow,
    mockupLabel: 'Visual workflow pipeline builder',
    mockupElements: [
      { label: 'Trigger', color: '#FBE8A6' },
      { label: 'AI Agent Node', color: '#FFF8E1' },
      { label: 'Human Review', color: '#FFFDE7' },
    ],
  },
  {
    level: 4,
    label: 'Level 4 — Building with AI',
    name: 'App Designer',
    color: '#D47B5A',
    colorLight: '#FBCEB1',
    icon: Layout,
    description:
      'Design any web application — from professional dashboards to personal side projects. Define your brief, generate a visual mockup, and produce a production-ready PRD you can paste into AI coding tools to build it yourself.',
    capabilities: [
      'Structured brief capturing your app\'s purpose, users, and features',
      'AI-generated visual mockup with iterative refinement',
      '11-section PRD covering layout, tech stack, data, and acceptance criteria',
      'Export PRD for Cursor, Lovable, Bolt.new, or any AI coding tool',
    ],
    outcome: 'A complete product brief and visual mockup — everything you need to build your app with AI coding tools.',
    mockupIcon: PenTool,
    mockupLabel: 'Brief, mockup & PRD generator',
    mockupElements: [
      { label: 'App Brief', color: '#FBCEB1' },
      { label: 'Visual Mockup', color: '#FFF0E8' },
      { label: 'PRD Export', color: '#FFF5F0' },
    ],
  },
  {
    level: 5,
    label: 'Level 5 — AI-Powered Applications',
    name: 'AI App Evaluator',
    color: '#2E3F8F',
    colorLight: '#C3D0F5',
    icon: Rocket,
    description:
      'Describe your AI application idea, get an expert evaluation of its architecture, and receive an implementation readiness score. The evaluator guides you through user roles, data flows, personalisation logic, and tech stack — then suggests tools and approaches to build it.',
    capabilities: [
      'Structured fields to describe your app\'s architecture and user experience',
      'AI-powered evaluation of your design with an implementation score',
      'Tool recommendations for building each component of your app',
      'Actionable feedback on gaps, risks, and next steps',
    ],
    outcome: 'An expert-level evaluation of your AI application design with a clear roadmap to build it.',
    mockupIcon: BarChart3,
    mockupLabel: 'Architecture evaluation & scoring',
    mockupElements: [
      { label: 'App Architecture', color: '#C3D0F5' },
      { label: 'AI Evaluation', color: '#E8EDFC' },
      { label: 'Readiness Score', color: '#F0F3FF' },
    ],
  },
];

/* ─── Dotted connector between cards ─── */
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

/* ─── Illustrative mockup card (right side visual) ─── */
function ToolMockup({ tool }: { tool: typeof TOOLS[number] }) {
  const Icon = tool.mockupIcon;
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: `${tool.color}30`, backgroundColor: `${tool.colorLight}18` }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ backgroundColor: tool.color, borderBottom: `1px solid ${tool.color}` }}
      >
        <div className="flex gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>
        <span className="text-[12px] font-semibold text-white opacity-90">{tool.name}</span>
      </div>

      {/* Mock content area */}
      <div className="p-5 space-y-3">
        {/* Icon + label */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${tool.color}18` }}
          >
            <Icon size={16} style={{ color: tool.color }} />
          </div>
          <span className="text-[12px] font-medium text-[#718096]">{tool.mockupLabel}</span>
        </div>

        {/* Mock UI elements */}
        {tool.mockupElements.map((el, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-[8px] rounded-full shrink-0"
              style={{
                width: `${65 - i * 12}%`,
                backgroundColor: el.color,
                border: `1px solid ${tool.color}20`,
              }}
            />
            <span className="text-[11px] text-[#A0AEC0] whitespace-nowrap">{el.label}</span>
          </div>
        ))}

        {/* Mock action area */}
        <div className="pt-3 mt-2" style={{ borderTop: `1px dashed ${tool.color}25` }}>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: tool.color }}
            >
              Try it live
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ color: tool.color, border: `1px solid ${tool.color}40` }}
            >
              View example
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AIToolsShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Centered Title */}
        <div className="mb-10 text-center">
          <div
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#E6FFFA', color: ACCENT_DARK, border: `1px solid ${ACCENT}` }}
          >
            Hands-On Learning Tools
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]">
            Five Levels, Five
            <br />
            <span className="relative inline-block">
              Practical Tools
              <span
                className="absolute left-0 -bottom-1 w-full h-[4px] rounded-full"
                style={{ backgroundColor: ACCENT_DARK, opacity: 0.8 }}
              />
            </span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[700px] mx-auto mt-4">
            At every level of the framework, you get access to a purpose-built AI tool that turns theory into practice.
            Each tool is designed for a specific capability — from writing your first prompt to evaluating a full-stack AI application.
          </p>
        </div>

        {/* ─── TOOL CARDS TIMELINE ─── */}
        {TOOLS.map((tool, index) => {
          const ToolIcon = tool.icon;
          return (
            <React.Fragment key={tool.level}>
              <div className="mb-2">
                <div
                  className="bg-white border rounded-2xl overflow-hidden"
                  style={{ borderColor: `${tool.color}30` }}
                >
                  {/* Top accent bar */}
                  <div className="h-[4px] w-full" style={{ backgroundColor: tool.color }} />
                  <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div
                        className="shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-[16px]"
                        style={{ backgroundColor: tool.color }}
                      >
                        <ToolIcon size={18} className="text-white" />
                      </div>
                      <div>
                        <span
                          className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1"
                          style={{ color: tool.color }}
                        >
                          {tool.label}
                        </span>
                        <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] leading-tight">
                          {tool.name}
                        </h2>
                      </div>
                    </div>

                    {/* Two-column: description left, visual right */}
                    <div className="md:flex md:gap-8 md:items-start">
                      {/* Left — description + capabilities */}
                      <div className="md:flex-1">
                        <p className="text-[15px] text-[#4A5568] leading-[1.8] mb-5">
                          {tool.description}
                        </p>

                        {/* Capabilities */}
                        <ul className="space-y-2.5 mb-5">
                          {tool.capabilities.map((cap) => (
                            <li key={cap} className="flex items-start gap-2.5">
                              <span
                                className="w-[6px] h-[6px] rounded-full mt-[7px] shrink-0"
                                style={{ backgroundColor: tool.color }}
                              />
                              <span className="text-[14px] text-[#4A5568] leading-[1.6]">{cap}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Outcome callout */}
                        <div
                          className="rounded-lg px-4 py-3 mb-4"
                          style={{
                            backgroundColor: `${tool.colorLight}30`,
                            border: `1px solid ${tool.color}20`,
                          }}
                        >
                          <span
                            className="text-[11px] font-bold uppercase tracking-[0.06em] block mb-1"
                            style={{ color: tool.color }}
                          >
                            What you walk away with
                          </span>
                          <span className="text-[13px] text-[#4A5568] leading-[1.6]">
                            {tool.outcome}
                          </span>
                        </div>

                        {/* CTA */}
                        <a
                          href="/app/dashboard"
                          className="inline-flex items-center gap-2 text-white font-semibold rounded-full transition-all duration-200 hover:opacity-90"
                          style={{
                            backgroundColor: tool.color,
                            padding: '10px 22px',
                            fontSize: '14px',
                            textDecoration: 'none',
                          }}
                        >
                          Try {tool.name}
                          <ArrowRight size={15} />
                        </a>
                      </div>

                      {/* Right — visual mockup */}
                      <div className="mt-6 md:mt-0 md:w-[320px] lg:w-[360px] shrink-0">
                        <ToolMockup tool={tool} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector between cards (not after last) */}
              {index < TOOLS.length - 1 && (
                <Connector color={tool.color} />
              )}
            </React.Fragment>
          );
        })}

        {/* Closing CTA */}
        <div className="mt-10">
          <ArtifactClosing
            summaryText="Ready to try these tools yourself? Sign in to access the full platform — starting from Level 1, all the way up."
            ctaLabel="Get Started"
            ctaHref="/app/dashboard"
            accentColor={ACCENT_DARK}
          />
        </div>
      </div>
    </div>
  );
};
