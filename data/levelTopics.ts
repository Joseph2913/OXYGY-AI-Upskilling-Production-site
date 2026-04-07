export interface TopicPhase {
  icon: string;
  label: string;
  detail: string;
}

export interface Topic {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  icon: string;
  phases: TopicPhase[];
  toolkitToolId: string;       // matches tool `id` in toolkitData.ts, e.g. 'prompt-playground'
  toolkitToolPath: string;     // internal route, e.g. '/app/toolkit/prompt-playground'
}

export const LEVEL_TOPICS: Record<number, Topic[]> = {
  1: [
    {
      id: 1, title: "Prompt Engineering", subtitle: "From brain dumps to structured, repeatable prompts",
      description: "Learn the Prompt Blueprint framework — Role, Context, Task, Format, Steps, Checks — plus the prompting spectrum and modifier techniques. Build the skill to choose the right approach for every task.",
      estimatedMinutes: 45, icon: "⚡",
      toolkitToolId: 'prompt-playground',
      toolkitToolPath: '/app/toolkit/prompt-playground',

      phases: [
        { icon: "▶", label: "E-Learning", detail: "13-slide interactive module covering the Prompt Blueprint, RCTF framework, context layers, and the prompting spectrum." },
        { icon: "⚙", label: "Toolkit", detail: "Build, test, and refine prompts using the Prompt Playground." },
        { icon: "◈", label: "Project", detail: "Apply the Prompt Blueprint to a real task from your own work and submit your prompt for review." },
      ],
    },
  ],
  2: [
    {
      id: 1, title: "From Prompts to Reusable Tools", subtitle: "From one-off prompts to reusable AI agents",
      description: "Learn when and how to turn a prompt into a permanent, shareable tool — an AI agent with defined inputs, defined behaviour, and structured outputs that runs the same way every time, for anyone on your team.",
      estimatedMinutes: 50, icon: "🤖",
      toolkitToolId: 'agent-builder',
      toolkitToolPath: '/app/toolkit/agent-builder',

      phases: [
        { icon: "▶", label: "E-Learning", detail: "14-slide interactive module covering the Level 2 shift, three-layer agent model, accountability by design, and team deployment." },
        { icon: "⚙", label: "Toolkit", detail: "Design your first Level 2 agent using the Agent Builder." },
        { icon: "◈", label: "Project", detail: "Deploy your agent to a teammate and document the outcome." },
      ],
    },
  ],
  3: [
    {
      id: 1, title: "Mapping AI Workflows", subtitle: "Triggers, AI steps, and accountable outputs",
      description: "How to deconstruct a business process into triggers, AI steps, and outputs. The logic of agent chaining, handoff points, human-in-the-loop governance, and multi-step automation.",
      estimatedMinutes: 50, icon: "🗺️",
      toolkitToolId: 'workflow-canvas',
      toolkitToolPath: '/app/toolkit/workflow-canvas',

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module on workflow decomposition, trigger design, agent chaining, and governance checkpoints." },
        { icon: "⚙", label: "Toolkit", detail: "Map and build a multi-step workflow using the Workflow Canvas." },
        { icon: "◈", label: "Project", detail: "Implement one step of your workflow in Make, Zapier, or n8n and document the result." },
      ],
    },
  ],
  4: [
    {
      id: 1, title: "Scoping Your AI Tool", subtitle: "From idea to brief — the PRD framework",
      description: "The barrier to building has moved from 'can you code?' to 'can you clearly define what you want?' Learn the four-component brief framework — Purpose, Users, Features, and Data Sources — and how to score your brief before you build.",
      estimatedMinutes: 50, icon: "📋",
      toolkitToolId: 'dashboard-designer',
      toolkitToolPath: '/app/toolkit/dashboard-designer',

      phases: [
        { icon: "▶", label: "E-Learning", detail: "13-slide interactive module covering the vibe coding paradigm, PRD framework, brief contrast cases, and the Brief Readiness Framework." },
        { icon: "⚙", label: "Toolkit", detail: "Define and scope your AI tool brief using the Dashboard Designer." },
        { icon: "◈", label: "Project", detail: "Submit your completed dashboard brief and mockup for review." },
      ],
    },
  ],
  5: [
    {
      id: 1, title: "Building Full-Stack AI Applications", subtitle: "The complete picture, end to end",
      description: "How workflows, front-ends, individual accounts, and personalised experiences combine into a complete AI application. A worked example using the OXYGY platform as a Level 5 case study.",
      estimatedMinutes: 55, icon: "🏗️",
      toolkitToolId: 'ai-app-evaluator',
      toolkitToolPath: '/app/toolkit/ai-app-evaluator',

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module deconstructing the OXYGY platform: personalisation, roles, memory, and full-stack architecture." },
        { icon: "⚙", label: "Toolkit", detail: "Evaluate a full-stack AI application using the App Evaluator." },
        { icon: "◈", label: "Project", detail: "Present your application design and architecture for review." },
      ],
    },
  ],
};

export const LEVEL_FULL_NAMES: Record<number, string> = {
  1: "AI Fundamentals & Awareness",
  2: "Applied Capability",
  3: "Systemic Integration",
  4: "Interactive Dashboards",
  5: "AI-Powered Applications",
};

export const LEVEL_SHORT_NAMES: Record<number, string> = {
  1: "Fundamentals",
  2: "Applied",
  3: "Systemic",
  4: "Dashboards",
  5: "Applications",
};

export const LEVEL_ACCENT_COLORS: Record<number, string> = {
  1: "#B2D8F7",
  2: "#F7E8A4",
  3: "#38B2AC",
  4: "#F5B8A0",
  5: "#C3D0F5",
};

export const LEVEL_ACCENT_DARK_COLORS: Record<number, string> = {
  1: "#2B6CB0",
  2: "#8A6A00",
  3: "#1A7A76",
  4: "#8C3A1A",
  5: "#2E3F8F",
};

export interface LevelMeta {
  number: number;
  name: string;
  shortName: string;
  tagline: string;
  accentColor: string;
  accentDark: string;
}

export const LEVEL_META: LevelMeta[] = [
  {
    number: 1,
    name: "AI Fundamentals & Awareness",
    shortName: "Fundamentals",
    tagline: "Build comfort and curiosity with AI. Learn how large language models work, how to prompt them well, and how to apply them to everyday work — responsibly.",
    accentColor: "#B2D8F7",
    accentDark: "#2B6CB0",
  },
  {
    number: 2,
    name: "Applied Capability",
    shortName: "Applied",
    tagline: "Move from AI user to AI builder. Design and deploy custom GPTs and agents tailored to your role, creating tools that your whole team can reuse.",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },
  {
    number: 3,
    name: "Systemic Integration",
    shortName: "Systemic",
    tagline: "Connect AI into end-to-end automated workflows. Scale individual capability into organisational impact through integrated, accountable pipelines.",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },
  {
    number: 4,
    name: "Interactive Dashboards",
    shortName: "Dashboards",
    tagline: "Shift from data-in-a-spreadsheet to designed intelligence. Build interactive dashboards that surface the right insight to the right person at the right time.",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },
  {
    number: 5,
    name: "AI-Powered Applications",
    shortName: "Applications",
    tagline: "Build complete AI applications with individual user accounts, personalised experiences, and role-based journeys. The full stack, end to end.",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
];
