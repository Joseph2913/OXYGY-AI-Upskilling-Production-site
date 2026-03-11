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
}

export const LEVEL_TOPICS: Record<number, Topic[]> = {
  1: [
    {
      id: 1, title: "Prompt & Context Engineering", subtitle: "From brain dumps to structured, context-rich prompts",
      description: "Learn the Prompt Blueprint framework and advanced prompting techniques, then go deeper with context engineering — using documents, system prompts, and project structures to give AI everything it needs for professional-quality output.",
      estimatedMinutes: 50, icon: "⚡",

      phases: [
        { icon: "▶", label: "E-Learning", detail: "13-slide interactive module covering the Prompt Blueprint, RCTF framework, context layers, and the prompting spectrum." },
        { icon: "◎", label: "Read", detail: "Curated articles on structured prompting and context engineering with guided reflection." },
        { icon: "▷", label: "Watch", detail: "Videos demonstrating prompt and context engineering in practice." },
        { icon: "◈", label: "Practice", detail: "Build, test, and refine prompts using the Prompt Playground." },
      ],
    },
  ],
  2: [
    {
      id: 1, title: "Designing AI Agents", subtitle: "What an agent is, when to use one, how to scope it",
      description: "System prompt architecture, role definition, and behavioural guardrails — how to think about agent design from instruction to output. Learn to build, template, and share agents across your team.",
      estimatedMinutes: 50, icon: "🤖",

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module on agent anatomy: system prompts, role definition, scope, guardrails, and team deployment." },
        { icon: "◎", label: "Read", detail: "Articles on agent design patterns and scaling agents across teams." },
        { icon: "▷", label: "Watch", detail: "Videos walking through agent design decisions and common pitfalls." },
        { icon: "◈", label: "Practice", detail: "Design and configure your first AI agent using the Agent Builder." },
      ],
    },
  ],
  3: [
    {
      id: 1, title: "Mapping AI Workflows", subtitle: "Triggers, AI steps, and accountable outputs",
      description: "How to deconstruct a business process into triggers, AI steps, and outputs. The logic of agent chaining, handoff points, human-in-the-loop governance, and multi-step automation.",
      estimatedMinutes: 50, icon: "🗺️",

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module on workflow decomposition, trigger design, agent chaining, and governance checkpoints." },
        { icon: "◎", label: "Read", detail: "Articles on workflow mapping and human-in-the-loop design with reflection." },
        { icon: "▷", label: "Watch", detail: "Videos showing real workflow transformations from manual to automated." },
        { icon: "◈", label: "Practice", detail: "Map and build a multi-step workflow using the Workflow Designer." },
      ],
    },
  ],
  4: [
    {
      id: 1, title: "Designing Interactive Dashboards", subtitle: "From AI outputs to designed intelligence",
      description: "Working backwards from what the end user needs to see. Learn user-centred design for AI-powered interfaces — how automated pipeline outputs become structured, interactive dashboard components.",
      estimatedMinutes: 50, icon: "📊",

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module on user-centred AI design, data transformation, and dashboard architecture." },
        { icon: "◎", label: "Read", detail: "Articles on UX-first thinking for data products and connecting AI to visual interfaces." },
        { icon: "▷", label: "Watch", detail: "Videos on designing AI interfaces that users actually want to use." },
        { icon: "◈", label: "Practice", detail: "Design and build a web application using the App Designer." },
      ],
    },
  ],
  5: [
    {
      id: 1, title: "Building Full-Stack AI Applications", subtitle: "The complete picture, end to end",
      description: "How workflows, front-ends, individual accounts, and personalised experiences combine into a complete AI application. A worked example using the Oxygy platform as a Level 5 case study.",
      estimatedMinutes: 55, icon: "🏗️",

      phases: [
        { icon: "▶", label: "E-Learning", detail: "Interactive module deconstructing the Oxygy platform: personalisation, roles, memory, and full-stack architecture." },
        { icon: "◎", label: "Read", detail: "Architecture deep-dive articles on building personalised AI products." },
        { icon: "▷", label: "Watch", detail: "Videos walking through the complete build from workflows to shipped product." },
        { icon: "◈", label: "Practice", detail: "Assemble a complete application using the Product Architecture Sprint." },
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
  1: "#A8F0E0",
  2: "#F7E8A4",
  3: "#38B2AC",
  4: "#F5B8A0",
  5: "#C3D0F5",
};

export const LEVEL_ACCENT_DARK_COLORS: Record<number, string> = {
  1: "#1A6B5F",
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
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
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
