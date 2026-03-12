export interface Tool {
  id: string;
  name: string;
  icon: string;
  levelRequired: number;
  levelName: string;
  description: string;
  route: string;
  accentColor: string;
  accentDark: string;
  toolType: string;
  capabilities: string[];
}

export const ALL_TOOLS: Tool[] = [
  // ── LEVEL 1 ──────────────────────────────────────────────────────
  {
    id: "prompt-playground",
    name: "Prompt Playground",
    icon: "⚡",
    levelRequired: 1,
    levelName: "Fundamentals",
    toolType: "Sandbox",
    description: "A live sandbox to write, test, and refine prompts. Experiment with different structures, tones, and constraints — and see real AI responses instantly.",
    capabilities: [
      "Write and test prompts with immediate AI feedback",
      "Compare different prompt structures side by side",
      "Save your best prompts directly to your Prompt Library",
      "Experiment with system prompts and user messages",
    ],
    route: "/app/toolkit/prompt-playground",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },
  {
    id: "prompt-library",
    name: "Prompt Library",
    icon: "📚",
    levelRequired: 1,
    levelName: "Fundamentals",
    toolType: "Library",
    description: "Your personal collection of saved, tagged, and organised prompts. Build a reusable bank of your best work — organised by use case, function, and topic — that grows with your career.",
    capabilities: [
      "Save prompts from the Playground with one click",
      "Tag and categorise prompts by use case or workflow",
      "Search and retrieve prompts instantly by keyword",
      "Share prompts with your team's shared library",
    ],
    route: "/app/toolkit/prompt-library",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },

  // ── LEVEL 2 ──────────────────────────────────────────────────────
  {
    id: "agent-builder",
    name: "Agent Builder",
    icon: "🤖",
    levelRequired: 2,
    levelName: "Applied Capability",
    toolType: "Builder",
    description: "Design and configure custom AI agents with system prompts, personas, instructions, and role definitions. Build intelligent assistants tailored to your specific workflows — then share them across your team.",
    capabilities: [
      "Configure system prompts and agent personas",
      "Set constraints, tone, and response formats",
      "Test your agent in a live conversation interface",
      "Export agent configurations as reusable templates",
    ],
    route: "/app/toolkit/agent-builder",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },
  {
    id: "template-library",
    name: "Template Library",
    icon: "🗂️",
    levelRequired: 2,
    levelName: "Applied Capability",
    toolType: "Library",
    description: "A shared library of agent templates and prompt blueprints built by you and your team. Start from a proven foundation rather than from scratch — and contribute your own templates for others to build on.",
    capabilities: [
      "Browse and fork templates created by your cohort",
      "Publish your own agent configurations as templates",
      "Filter templates by role, use case, or level",
      "Version and update templates as your approach evolves",
    ],
    route: "/app/toolkit/template-library",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },

  // ── LEVEL 3 ──────────────────────────────────────────────────────
  {
    id: "workflow-canvas",
    name: "Workflow Canvas",
    icon: "🔗",
    levelRequired: 3,
    levelName: "Systemic Integration",
    toolType: "Canvas",
    description: "Map end-to-end automated AI pipelines visually. Chain agents, define data inputs and outputs, and design human-in-the-loop checkpoints — before you build anything in Make, Zapier, or n8n.",
    capabilities: [
      "Drag-and-drop workflow mapping with AI agent nodes",
      "Define triggers, conditions, and branching logic",
      "Mark human review checkpoints with rationale trails",
      "Export workflow diagrams as documentation",
    ],
    route: "/app/toolkit/workflow-canvas",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },
  {
    id: "integration-sandbox",
    name: "Integration Sandbox",
    icon: "🧪",
    levelRequired: 3,
    levelName: "Systemic Integration",
    toolType: "Sandbox",
    description: "Connect AI to real data sources and test automated pipelines in a safe, sandboxed environment. Validate your Workflow Canvas designs before deploying them to production tools.",
    capabilities: [
      "Test API connections to Make, Zapier, and n8n",
      "Run end-to-end workflow simulations with sample data",
      "Inspect AI agent inputs and outputs at each step",
      "Debug and iterate on automation logic safely",
    ],
    route: "/app/toolkit/integration-sandbox",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },

  // ── LEVEL 4 ──────────────────────────────────────────────────────
  {
    id: "dashboard-designer",
    name: "App Designer",
    icon: "📊",
    levelRequired: 4,
    levelName: "Building with AI",
    toolType: "Designer",
    description: "Design any web application — from professional dashboards to personal side projects. Define your brief, generate a visual mockup, and produce a production-ready PRD you can paste into AI coding tools to build it yourself.",
    capabilities: [
      "Structured brief to capture your app's purpose, users, and features",
      "AI-generated visual mockup with refinement feedback loop",
      "11-section PRD covering layout, tech stack, data, and acceptance criteria",
      "Export PRD for Cursor, Lovable, Bolt.new, or any AI coding tool",
    ],
    route: "/app/toolkit/dashboard-designer",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },
  {
    id: "journey-mapper",
    name: "User Journey Mapper",
    icon: "🗺️",
    levelRequired: 4,
    levelName: "Interactive Dashboards",
    toolType: "Designer",
    description: "Map the complete experience of your dashboard's end users — from the moment they open the interface to the decisions they make with the data they see. Design with empathy before you build.",
    capabilities: [
      "Map multi-step user journeys with decision points",
      "Define user goals, pain points, and success states",
      "Annotate touchpoints with AI-powered moments",
      "Link journey maps directly to dashboard component specs",
    ],
    route: "/app/toolkit/journey-mapper",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },

  // ── LEVEL 5 ──────────────────────────────────────────────────────
  {
    id: "ai-app-evaluator",
    name: "AI App Evaluator",
    icon: "🚀",
    levelRequired: 5,
    levelName: "AI-Powered Applications",
    toolType: "Evaluator",
    description: "Describe your AI application idea, get an expert evaluation of its architecture, and receive a design score. The evaluator guides you through the key fields — user roles, data flows, personalisation logic, and tech stack — then suggests tools and approaches to build it, with an implementation readiness score.",
    capabilities: [
      "Structured fields to describe your app's architecture and user experience",
      "AI-powered evaluation of your design with an implementation score",
      "Tool recommendations for building each component of your app",
      "Actionable feedback on gaps, risks, and next steps",
    ],
    route: "/app/toolkit/ai-app-evaluator",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
];

export const DASHBOARD_TOOLS = ALL_TOOLS.slice(0, 5);

/** One primary tool per level, shown on the Journey page */
export const PRIMARY_TOOL_IDS: Record<number, string> = {
  1: "prompt-playground",
  2: "agent-builder",
  3: "workflow-canvas",
  4: "dashboard-designer",
  5: "ai-app-evaluator",
};

export function getPrimaryTool(levelNumber: number): Tool | undefined {
  const id = PRIMARY_TOOL_IDS[levelNumber];
  return ALL_TOOLS.find(t => t.id === id);
}
