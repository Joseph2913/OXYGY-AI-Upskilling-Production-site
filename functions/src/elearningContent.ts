/**
 * E-Learning Content Summaries
 *
 * Condensed summaries of all 77+ slides across 5 levels.
 * Used by the workspace general assistant as a tool call — NOT loaded into the system prompt.
 * The AI calls lookup_elearning_content with a query, and this module returns relevant summaries.
 */

interface SlideSummary {
  level: number;
  levelName: string;
  slideIndex: number;
  section: string;
  heading: string;
  summary: string;
}

const SLIDE_SUMMARIES: SlideSummary[] = [
  // ═══ LEVEL 1: Prompt Engineering Essentials ═══
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 1, section: "THE TOOLKIT", heading: "Prompt Engineering Essentials", summary: "75% of professionals use AI daily but results vary dramatically. AI tools are no longer experimental — the difference is in how you use them." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 2, section: "THE REALITY", heading: "The Evidence Gap", summary: "Same tool, same AI, up to 9x more output just from knowing how to use it. The difference between +14% and +126% productivity comes down to prompting skill." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 3, section: "THE APPROACHES", heading: "Foundation for Everything", summary: "Every advanced AI capability — agents, workflows, dashboards, full-stack apps — is built on top of prompting. Get the foundation right and everything else follows." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 4, section: "BLUEPRINT", heading: "Same Tools, Different Results", summary: "Your instructions determine output quality. Each context component you provide eliminates assumptions the AI would otherwise make." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 5, section: "BLUEPRINT", heading: "The Six Blueprint Components", summary: "Six context elements separate weak prompts from strong ones: Role, Context, Task, Format, Steps, and Quality criteria. These form the RCTF+ Blueprint." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 6, section: "BLUEPRINT", heading: "Assembling the Blueprint", summary: "Assembling all six elements produces a prompt that leaves nothing to chance. A prompt missing even one element leaves the AI to guess." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 7, section: "BLUEPRINT", heading: "Context is the Fuel", summary: "The Blueprint isn't one-size-fits-all — the right approach depends on how well you know the desired output and whether the task repeats." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 8, section: "INTERACTIVE", heading: "Build a Prompt from Scratch", summary: "Interactive exercise: drag each Blueprint component into the right slot and watch the prompt take shape as you add each layer." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 9, section: "INTERACTIVE", heading: "Spot the Missing Element", summary: "Practice identifying which Blueprint component is absent from a given prompt. Develops diagnostic skill for prompt improvement." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 10, section: "THE APPROACHES", heading: "Three Prompting Approaches", summary: "Three ways to prompt, each for a different situation: Brain Dump (exploratory), Structured (defined task), Blueprint (repeatable process). The right approach depends on task clarity." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 11, section: "PERSONAS", heading: "Sam — Programme Coordinator", summary: "Real-world persona applying prompting to coordinate training programmes. Demonstrates how role context shapes prompt effectiveness." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 12, section: "PERSONAS", heading: "Priya — Strategy Analyst", summary: "Strategy analyst persona using structured prompting for data analysis. Shows how format and quality criteria improve analytical outputs." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 13, section: "PERSONAS", heading: "Marcus — Delivery Lead", summary: "Delivery lead persona applying Blueprint approach to project management tasks. Demonstrates repeatable prompt design for recurring deliverables." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 14, section: "PERSONAS", heading: "Aisha — Communications Lead", summary: "Communications lead using prompting for stakeholder comms. The right approach depends on how well-defined the task is." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 15, section: "PERSONAS", heading: "Jordan — Process Designer", summary: "Process designer persona showing how prompting translates to workflow documentation. You now have a toolkit for prompting with intent." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 16, section: "SITUATIONAL", heading: "Which Approach Fits?", summary: "Situational judgment exercise: match prompting approaches to different workplace scenarios based on task clarity and repeatability." },
  { level: 1, levelName: "Prompt Engineering Essentials", slideIndex: 17, section: "WRAP UP", heading: "Key Takeaways", summary: "Summary of Level 1: six Blueprint components, three prompting approaches, and the skill of matching approach to situation." },

  // ═══ LEVEL 2: Designing Your First AI Agent ═══
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 1, section: "THE REALITY", heading: "Designing Your First AI Agent", summary: "When everyone uses AI differently, the team pays for it in rework and inconsistency. Teams are using AI individually and ad hoc." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 2, section: "THE REALITY", heading: "From Prompt to Permanent Tool", summary: "A single well-built agent delivers compounding returns — every run, for every person who uses it. A prompt runs once; an agent runs every time." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 3, section: "THE REALITY", heading: "The Level 2 Shift", summary: "A great prompt stays with one person — the Level 2 unlock is making it a standardised tool for the whole team." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 4, section: "THE LEVEL 2 SHIFT", heading: "One Agent, Compounding Returns", summary: "An agent is a configured AI tool that runs consistently for anyone — not a one-time conversation. You design it once, and it handles the task the same way every time." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 5, section: "WHAT IS AN AGENT", heading: "When to Build an Agent", summary: "Three conditions determine whether a task is worth building as an agent: the task repeats, has structured input, and benefits from consistency." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 6, section: "KNOW THE DIFFERENCE", heading: "Agent Decision Test", summary: "Apply the agent decision test to real tasks from three different roles. Not every prompt should become an agent." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 7, section: "THE THREE-LAYER MODEL", heading: "What is an AI Agent?", summary: "Every agent is built from three layers: Input (what goes in), Processing (what happens), Output (what comes out)." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 8, section: "THE THREE-LAYER MODEL", heading: "The Three Layers", summary: "Each layer has a specific job — get all three right and the agent runs consistently every time. Input defines scope, Processing defines logic, Output defines format." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 9, section: "TEST YOUR UNDERSTANDING", heading: "Sort Into Three Layers", summary: "Interactive exercise: classify each element of a real agent design into Input, Processing, or Output layers." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 10, section: "IN THE REAL WORLD", heading: "Custom GPTs", summary: "Custom GPTs are a no-code way to deploy the three-layer model inside ChatGPT — shareable with your team immediately." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 11, section: "IN THE REAL WORLD", heading: "Claude Skills", summary: "Claude Skills are portable instruction sets you write once and call from any conversation — no separate interface required." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 12, section: "IN THE REAL WORLD", heading: "Google Gems", summary: "Google Gems embed your agent directly inside Google Workspace tools — Docs, Sheets, Gmail, and the Gemini side panel." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 13, section: "IN PRACTICE", heading: "Same Task, Three Approaches", summary: "The difference between a prompt and an agent is structure at every layer. Compare how the same task looks as a brain dump, structured prompt, and configured agent." },
  { level: 2, levelName: "Designing Your First AI Agent", slideIndex: 14, section: "WRAP UP", heading: "Key Takeaways", summary: "You now have a framework for building agents that run consistently for anyone on your team: three-layer model, agent decision test, real-world platforms." },

  // ═══ LEVEL 3: Mapping a Multi-Step AI Workflow ═══
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 1, section: "WORKFLOW DESIGN", heading: "Mapping a Multi-Step AI Workflow", summary: "Most AI projects stall at isolated tasks — workflow automation is where the real gains are. Top performers integrate AI across connected processes." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 2, section: "THE REALITY", heading: "The Task-to-Workflow Gap", summary: "Top AI performers are 3.4x more likely to have integrated AI across connected workflows — not just deployed it as a standalone tool." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 3, section: "THE REALITY", heading: "Adoption vs Integration", summary: "75% of knowledge workers use AI tools but most use them as one-off assistants, not as parts of a designed process." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 4, section: "THE REALITY", heading: "The Gap is Widening", summary: "At Level 2 you built reusable agents. The Level 3 unlock is removing the human from the loop entirely — workflows that trigger, run, and deliver without intervention." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 5, section: "THE GAP", heading: "What is an AI Workflow", summary: "A workflow chains multiple agents into a process — trigger, steps, conditions, and output. It connects individual tools into an automated sequence." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 6, section: "THE TECHNIQUE", heading: "When to Build a Workflow", summary: "A workflow adds value when a process is repetitive, structured, and has a defined output. If the same task ran 100 times, the right output would look the same each time." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 7, section: "THE TECHNIQUE", heading: "Workflow Decision Test", summary: "Apply the workflow decision test to real tasks from three different roles. At Level 3, the three-layer model (Input, Processing, Output) applies to the whole workflow." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 8, section: "THE TECHNIQUE", heading: "Anatomy of an AI Workflow", summary: "Every AI workflow has three layers: Input (triggers), Processing (steps and conditions), Output (deliverables). A handoff is where work passes between steps." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 9, section: "THE LAYERS", heading: "The Three Layers", summary: "Every AI workflow has three layers — each with a distinct job. Input captures triggers, Processing transforms data through steps, Output delivers results." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 10, section: "THE TECHNIQUE", heading: "The Six Node Types", summary: "Six node types cover every step in every workflow: Trigger, AI Action, Human Review, Condition, Integration, Output. Learn to spot them and you can map any process." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 11, section: "THE TECHNIQUE", heading: "A Mapped Workflow", summary: "A mapped workflow ties all three layers together into something that runs on its own — from trigger to final output." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 12, section: "THE TECHNIQUE", heading: "Handoffs", summary: "Every handoff is a decision point — design it deliberately or leave it to chance. Handoffs between AI and human, or between systems, are where workflows succeed or fail." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 13, section: "IN PRACTICE", heading: "Workflow Design Decisions", summary: "Apply the three-layer model, node types, and handoff design to real workflow decisions. Practice mapping triggers, conditions, and outputs." },
  { level: 3, levelName: "Mapping a Multi-Step AI Workflow", slideIndex: 14, section: "WRAP UP", heading: "Key Takeaways", summary: "You now have a complete framework for mapping any multi-step AI workflow: three layers, six node types, deliberate handoff design." },

  // ═══ LEVEL 4: From Idea to Brief — Scoping Your AI Tool ═══
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 1, section: "DASHBOARD DESIGNER", heading: "From Idea to Brief: Scoping Your AI Tool", summary: "Building AI tools is no longer a developer skill — describe what you want in plain language and AI builds it. The bottleneck is no longer technical, it's clarity of thought." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 2, section: "THE REALITY", heading: "What is Vibe Coding", summary: "Vibe coding means directing AI in plain language until it builds what you described — no traditional coding required. Term coined by AI researcher Andrej Karpathy in Feb 2025." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 3, section: "THE REALITY", heading: "Anyone Can Build Now", summary: "The problem isn't building anymore — it's knowing what to build. Most AI projects stall not because of tech limitations but because the brief was unclear." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 4, section: "THE GAP", heading: "The Level 4 Unlock", summary: "A workflow delivers outputs but outputs in a log reach no one. Level 4 teaches building a front end that surfaces the right insight to the right person." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 5, section: "THE TECHNIQUE", heading: "What is a PRD", summary: "A PRD (Product Requirements Document) is a structured definition of what you're building, created before a single line of code is written." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 6, section: "THE TECHNIQUE", heading: "The Four Brief Components", summary: "A strong brief has exactly four components: Purpose (what problem), Audience (for whom), Features (what it does), Data (what it uses). Skip one and the build reflects it." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 7, section: "THE TECHNIQUE", heading: "Spot the Weak Component", summary: "Every failing brief has a missing or vague component. Learn to identify which of the four components is under-defined." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 8, section: "SEE THE DIFFERENCE", heading: "Same Idea, Two Briefs", summary: "The same idea produces a very different tool depending on the brief it's built from. Specific components produce working tools; vague components produce generic ones." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 9, section: "SEE THE DIFFERENCE", heading: "Strong vs Weak Components", summary: "Specific brief components produce working tools — vague components produce generic ones. Compare strong and weak versions side by side." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 10, section: "IN PRACTICE", heading: "Brief Readiness Framework", summary: "Sort brief statements by readiness level. Score your brief on four dimensions before you build — a score of 10+ means you're ready." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 11, section: "IN PRACTICE", heading: "Score Your Brief", summary: "Apply the Brief Readiness Framework: score each component 1-3 on specificity. A combined score of 10+ means the brief is build-ready." },
  { level: 4, levelName: "From Idea to Brief: Scoping Your AI Tool", slideIndex: 12, section: "WRAP UP", heading: "Key Takeaways", summary: "You now have a complete framework for scoping any AI-powered tool before you build it: four brief components, readiness scoring, PRD structure." },

  // ═══ LEVEL 5: Building Full-Stack AI Applications ═══
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 1, section: "THE BUILD PIPELINE", heading: "Building Full-Stack AI Applications", summary: "Most AI projects never make it past the prototype — only a fraction become products others can actually use. The gap between demo and deployed product is the Level 5 challenge." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 2, section: "THE REALITY", heading: "Dashboard to Application", summary: "A dashboard shows information. An application serves users. The five-stage pipeline turns a product idea into something others can log into, use, and return to." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 3, section: "THE REALITY", heading: "Four Application Characteristics", summary: "A Level 5 application has four characteristics no dashboard has: user accounts, persistent data, role-based access, and deployment to a URL others can visit." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 4, section: "THE REALITY", heading: "Skills Stack Up", summary: "Every skill from Levels 1-4 feeds into a Level 5 build — prompting, agents, workflows, and briefs all become components of a full application." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 5, section: "THE GAP", heading: "Five Distinct Jobs", summary: "A full AI product is five distinct jobs — and most builders try to do all five with one tool, which is why most prototypes never become products." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 6, section: "THE GAP", heading: "Two Responses to Complexity", summary: "Two builders, the same brief — what each one does next reveals whether they think in tools or in pipelines." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 7, section: "THE PIPELINE", heading: "The Five-Stage Build Pipeline", summary: "Five stages, five types of work: Define (PRD), Design (UI/UX), Build (code), Connect (data/APIs), Deploy (hosting/auth). Each builds the foundation for the next." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 8, section: "THE PIPELINE", heading: "Workplace Equivalents", summary: "Each pipeline stage has a familiar workplace equivalent — you already know how each one works. Define = project brief, Design = wireframe, Build = implementation, Connect = integration, Deploy = launch." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 9, section: "THE PIPELINE", heading: "Where Your Skills Connect", summary: "Every skill from Levels 1-4 has a specific home in the pipeline — nothing you built so far is wasted. Prompting feeds Define, Agents feed Build, etc." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 10, section: "THE PIPELINE", heading: "Failure Mode Diagnosis", summary: "Each failure mode maps to a specific missing stage — recognising the pattern is what pipeline thinking gives you. App crashes = missing Build stage, etc." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 11, section: "SEE THE DIFFERENCE", heading: "Same Brief, Different Outcomes", summary: "The same product brief produces a fragile local experiment or a scalable deployed application — depending on pipeline understanding." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 12, section: "SEE THE DIFFERENCE", heading: "Pipeline Changes Your First Move", summary: "Pipeline understanding changes your first move — before a single line of code is written. It determines whether you build sustainably or patch repeatedly." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 13, section: "IN PRACTICE", heading: "Six Pipeline Signals", summary: "Every brief contains six pipeline signals — reading them before you build tells you exactly where to focus first." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 14, section: "IN PRACTICE", heading: "Match Failure to Missing Stage", summary: "Matching the failure mode to the missing stage is the core diagnostic skill of a pipeline builder. Practice identifying which stage was skipped." },
  { level: 5, levelName: "Building Full-Stack AI Applications", slideIndex: 15, section: "WRAP UP", heading: "Key Takeaways", summary: "You now have the five-stage pipeline to take any AI product brief from idea to deployed application: Define, Design, Build, Connect, Deploy." },
];

/**
 * Get all slide summaries for a specific level.
 */
export function getContentByLevel(level: number): string {
  const slides = SLIDE_SUMMARIES.filter((s) => s.level === level);
  if (slides.length === 0) return `No e-learning content found for Level ${level}.`;

  const header = `## Level ${level}: ${slides[0].levelName}\n\n`;
  const body = slides
    .map((s) => `**${s.heading}** (${s.section})\n${s.summary}`)
    .join("\n\n");
  return header + body;
}

/**
 * Search slide summaries by keyword query. Returns top matches.
 */
export function searchContent(query: string, level?: number): string {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  let candidates = level
    ? SLIDE_SUMMARIES.filter((s) => s.level === level)
    : SLIDE_SUMMARIES;

  // Score each slide by keyword matches
  const scored = candidates.map((s) => {
    const text = `${s.heading} ${s.section} ${s.summary} ${s.levelName}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score++;
      // Bonus for heading match
      if (s.heading.toLowerCase().includes(word)) score += 2;
    }
    return { slide: s, score };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (results.length === 0) {
    return `No e-learning content found matching "${query}".`;
  }

  return results
    .map((r) => {
      const s = r.slide;
      return `**Level ${s.level} — ${s.heading}** (${s.section})\n${s.summary}`;
    })
    .join("\n\n");
}

/** Get a high-level overview of all levels. */
export function getLevelOverview(): string {
  return `## OXYGY AI Upskilling Programme — 5 Levels

**Level 1: Prompt Engineering Essentials** (45 min, 17 slides)
The RCTF+ Blueprint for structured prompting. Six components: Role, Context, Task, Format, Steps, Quality. Three approaches: Brain Dump, Structured, Blueprint. Five professional personas demonstrate real-world application.

**Level 2: Designing Your First AI Agent** (50 min, 14 slides)
Turn prompts into reusable tools. The Three-Layer Model: Input, Processing, Output. Agent Decision Test for when to build. Real-world platforms: Custom GPTs, Claude Skills, Google Gems.

**Level 3: Mapping a Multi-Step AI Workflow** (50 min, 14 slides)
Chain agents into automated processes. Six Node Types: Trigger, AI Action, Human Review, Condition, Integration, Output. Handoff design. Workflow Decision Test.

**Level 4: From Idea to Brief — Scoping Your AI Tool** (50 min, 12 slides)
Vibe coding and PRD framework. Four Brief Components: Purpose, Audience, Features, Data. Brief Readiness Framework scoring (10+ = build-ready).

**Level 5: Building Full-Stack AI Applications** (55 min, 15 slides)
Five-Stage Build Pipeline: Define, Design, Build, Connect, Deploy. Four application characteristics. Failure mode diagnosis. Pipeline signals.`;
}
