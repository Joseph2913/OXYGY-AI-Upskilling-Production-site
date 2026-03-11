// Prompt Engineering Playground — Static Content & Configuration

export const PROMPT_BLUEPRINT = [
  {
    key: 'role',
    label: 'Role',
    icon: '\u{1F3AD}', // 🎭
    description: 'Who the AI should act as — the expertise, perspective, or persona it should adopt',
    color: '#C3D0F5',
  },
  {
    key: 'context',
    label: 'Context',
    icon: '\u{1F4CD}', // 📍
    description: 'The background, situation, constraints, and relevant details the AI needs to understand',
    color: '#FBE8A6',
  },
  {
    key: 'task',
    label: 'Task',
    icon: '\u{1F3AF}', // 🎯
    description: 'The specific instruction — what exactly the AI should produce or do',
    color: '#38B2AC',
  },
  {
    key: 'format',
    label: 'Format & Structure',
    icon: '\u{1F4D0}', // 📐
    description: 'How the output should be organized — length, layout, tone, structure',
    color: '#A8F0E0',
  },
  {
    key: 'steps',
    label: 'Steps & Process',
    icon: '\u{1F9E9}', // 🧩
    description: 'Explicit reasoning steps, sequence, or methodology the AI should follow',
    color: '#FBCEB1',
  },
  {
    key: 'quality',
    label: 'Quality Checks',
    icon: '\u{2705}', // ✅
    description: 'Validation rules, constraints, things to avoid, accuracy requirements',
    color: '#E6FFFA',
  },
] as const;

// Educational content for default state (before any prompt is generated)
export const BLUEPRINT_EDUCATION = [
  {
    key: 'role',
    title: 'Define the Role',
    why: "Giving the AI a specific persona anchors its entire response. A 'senior data analyst' writes differently than a 'marketing intern.' The more specific the role, the more targeted and expert the output becomes.",
    example: '"Act as a senior change management consultant with 15 years of experience in digital transformation for large enterprises."',
  },
  {
    key: 'context',
    title: 'Set the Context',
    why: "Without context, the AI guesses — and guesses wrong. Sharing the situation, stakeholders, constraints, and timeline lets the AI tailor its response to your actual reality instead of generating generic advice.",
    example: '"We\'re halfway through a 6-month initiative. The discovery phase is complete and the team is moving into design. Two key stakeholders have concerns about timeline."',
  },
  {
    key: 'task',
    title: 'Specify the Task',
    why: "Vague instructions produce vague outputs. Telling the AI exactly what deliverable you need — the format, scope, and purpose — is the single biggest lever for getting useful results on the first try.",
    example: '"Write a 400-word project status update email that summarizes progress, highlights risks with proposed mitigations, and outlines the plan for the next quarter."',
  },
  {
    key: 'format',
    title: 'Define Format & Structure',
    why: "The same information presented as bullet points vs. a narrative paragraph vs. a table serves completely different purposes. Specifying structure ensures the output fits directly into your workflow.",
    example: '"Use an email format with clear sections. Keep it under 400 words. Use a confident but transparent tone. Include a subject line."',
  },
  {
    key: 'steps',
    title: 'Outline the Process',
    why: "Giving the AI a step-by-step sequence prevents it from jumping to conclusions. It forces structured thinking — analyze first, then synthesize, then recommend — which dramatically improves reasoning quality.",
    example: '"First, summarize key achievements. Then, identify the top 3 risks. For each risk, propose a mitigation. Close with next milestones and any asks."',
  },
  {
    key: 'quality',
    title: 'Set Quality Checks',
    why: "Quality constraints act as guardrails. They prevent the AI from using jargon when you need plain language, making up data when you need accuracy, or being vague when you need specifics.",
    example: '"Don\'t sugarcoat the risks. Avoid generic phrases like \'things are going well.\' Keep language accessible to non-technical readers. Do not reference confidential project names."',
  },
] as const;

// Mode A: Example prompts that populate the textarea
export const EXAMPLE_PROMPTS = [
  'Help me prepare talking points for a stakeholder meeting next week',
  'Create a 90-day onboarding plan for a new team member',
  'Write an update email about project progress to share with leadership',
  'Draft a business case for investing in a new AI tool for our team',
  'Summarize the key takeaways from a quarterly business review',
  'Create a workshop agenda for a team brainstorming session',
];

// Mode B: Wizard step definitions
export const WIZARD_STEPS = [
  {
    id: 1,
    field: 'role' as const,
    question: 'Who should the AI act as?',
    helper: 'Describe the expertise or perspective you need — e.g., a senior consultant, a data analyst, a project manager, a communications lead',
    placeholder: 'e.g., Act as an experienced change management consultant who specializes in digital transformation...',
    type: 'textarea' as const,
    minLines: 2,
  },
  {
    id: 2,
    field: 'context' as const,
    question: "What's the situation?",
    helper: "Give the AI the background it needs — what's happening, who's involved, what constraints exist",
    placeholder: "e.g., We're halfway through a 6-month transformation project. The team has completed the discovery phase and is moving into design...",
    type: 'textarea' as const,
    minLines: 3,
  },
  {
    id: 3,
    field: 'task' as const,
    question: 'What exactly should the AI produce?',
    helper: 'Be specific about the deliverable — what format, what content, what purpose',
    placeholder: 'e.g., Write a concise project status update email that summarizes progress, highlights risks, and outlines next steps...',
    type: 'textarea' as const,
    minLines: 2,
  },
  {
    id: 4,
    field: 'format' as const,
    question: 'How should the output be structured?',
    helper: 'Select any that apply, or describe your preferred format',
    placeholder: 'Any other formatting preferences? e.g., Keep it under 300 words, use professional tone...',
    type: 'chips' as const,
    chips: [
      'Bullet points',
      'Numbered list',
      'Table',
      'Short paragraph',
      'Detailed report',
      'Email format',
      'Slide content',
      'Executive summary',
    ],
  },
  {
    id: 5,
    field: 'steps' as const,
    question: 'Should the AI follow specific steps?',
    helper: 'Describe a sequence or process the AI should work through — or leave blank if the AI should decide',
    placeholder: 'e.g., First, review the key milestones achieved. Then, identify the top 3 risks. Finally, propose mitigation actions for each risk...',
    type: 'textarea' as const,
    minLines: 3,
  },
  {
    id: 6,
    field: 'quality' as const,
    question: 'What should the AI watch out for?',
    helper: 'Add any constraints, things to avoid, or quality standards',
    placeholder: "Any other quality requirements? e.g., Don't reference confidential client names, keep language accessible to non-technical readers...",
    type: 'chips' as const,
    chips: [
      'Keep it concise',
      'Avoid jargon',
      'Be specific with data',
      'Include examples',
      'Professional tone',
      'Friendly tone',
      'Cite sources',
      'No assumptions',
    ],
  },
];

// Mode B: Pre-built example scenarios
export const EXAMPLE_SCENARIOS = [
  {
    name: 'Meeting Preparation',
    role: 'Act as a senior facilitator who specializes in running efficient, outcome-driven meetings',
    context: 'We have a 1-hour meeting scheduled with cross-functional team leads to review progress on a strategic initiative. Some attendees are skeptical about the current direction.',
    task: 'Prepare a structured agenda with talking points for each section, including 3 discussion prompts to surface concerns constructively',
    formatChips: ['Bullet points'],
    formatCustom: 'Keep the agenda to one page, include time allocations for each section',
    steps: 'Start with a brief recap of decisions made so far. Then address each workstream\'s progress. End with an open discussion section and clear next steps.',
    qualityChips: ['Professional tone'],
    qualityCustom: "Avoid making assumptions about attendees' positions. Keep language neutral and inclusive.",
  },
  {
    name: 'Training Plan',
    role: 'Act as a learning and development specialist with experience designing practical upskilling programs',
    context: 'A team of 15 people with mixed experience levels needs to develop foundational skills in a new area. The timeline is 90 days and the budget is limited, so most learning should be self-directed with periodic group sessions.',
    task: 'Create a structured 90-day learning plan broken into 3 phases (30 days each) with specific milestones, recommended resources, and a group session outline for each phase',
    formatChips: ['Table', 'Detailed report'],
    formatCustom: '',
    steps: 'Phase 1 should focus on awareness and vocabulary. Phase 2 on hands-on practice with guided exercises. Phase 3 on independent application with peer review.',
    qualityChips: ['Avoid jargon', 'Include examples'],
    qualityCustom: 'Make sure the plan is realistic for people who are also managing their regular workload.',
  },
  {
    name: 'Stakeholder Communication',
    role: 'Act as a communications advisor experienced in drafting clear, concise updates for senior audiences',
    context: 'A 6-month project is at the halfway point. The team has completed the discovery and design phases. There are 2 risks flagged (resource availability and timeline pressure) but overall the project is on track.',
    task: 'Write a project status update email that summarizes progress, highlights the risks with proposed mitigations, and outlines the plan for the next 3 months',
    formatChips: ['Email format'],
    formatCustom: 'Keep it under 400 words. Use a confident but transparent tone.',
    steps: "Open with a 1-sentence summary of overall status. Then cover key achievements. Then address risks directly with what's being done about them. Close with next milestones and any asks.",
    qualityChips: ['Keep it concise', 'Professional tone'],
    qualityCustom: "Don't sugarcoat the risks — leadership prefers transparency. Avoid generic phrases like 'things are going well.'",
  },
];

// ═══════════════════════════════════════════════════════════════
// PROMPT PLAYGROUND v2.0 — Strategy-Aware Definitions
// ═══════════════════════════════════════════════════════════════

import type { StrategyId } from '../types';

/**
 * The 8 canonical prompting strategies with metadata for UI rendering.
 * Sourced from PRD v2.0, Section 2.
 */
export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  icon: string;
  color: string;
  definition: string;
  whenToUse: string;
  whenNotToUse: string;
  teachesLearner: string;
}

export const STRATEGY_DEFINITIONS: StrategyDefinition[] = [
  {
    id: 'STRUCTURED_BLUEPRINT',
    name: 'Structured Blueprint',
    icon: '🏗️',
    color: '#C3D0F5',
    definition: 'Breaks a prompt into named, explicit sections — typically Role, Context, Task, Format, Steps, and Quality Checks. Each section anchors a specific dimension of the AI\'s response.',
    whenToUse: 'Complex, multi-part deliverables where the output needs to be reliable and repeatable. Reports, structured documents, strategic analyses, workshop designs.',
    whenNotToUse: 'Short, conversational tasks. Simple rewrites. Anything where the overhead of a 6-part structure outweighs the output complexity.',
    teachesLearner: 'Not every prompt needs a blueprint. Knowing when to deploy structure is the skill — not applying it universally.',
  },
  {
    id: 'CHAIN_OF_THOUGHT',
    name: 'Chain-of-Thought',
    icon: '🧠',
    color: '#FBE8A6',
    definition: 'Instructs the AI to reason step-by-step before delivering a conclusion. Rather than jumping to an answer, the model works through the problem in sequence.',
    whenToUse: 'Evaluation tasks, diagnostic tasks, planning tasks, any question where a confident wrong answer is worse than a slower right one.',
    whenNotToUse: 'Simple factual retrieval. Creative tasks where structured reasoning interrupts generative flow.',
    teachesLearner: 'The AI is not a search engine — it reasons. You can control how it reasons by telling it to show its work before it concludes.',
  },
  {
    id: 'PERSONA_EXPERT_ROLE',
    name: 'Persona / Expert Role',
    icon: '🎭',
    color: '#A8F0E0',
    definition: 'Assigns the AI a specific expert identity before the task. The persona anchors vocabulary, tone, assumed knowledge, and perspective for the entire response.',
    whenToUse: 'Almost every professional task benefits from a persona. Communication tasks, advisory tasks, creative tasks.',
    whenNotToUse: 'Purely mechanical tasks where identity is irrelevant — e.g., "Convert this list into a table."',
    teachesLearner: 'Who is speaking matters as much as what is said. The single highest-leverage addition to most prompts is a well-defined role.',
  },
  {
    id: 'OUTPUT_FORMAT_SPECIFICATION',
    name: 'Output Format Specification',
    icon: '📐',
    color: '#38B2AC',
    definition: 'Explicitly defines how the output should be structured: length, layout, section headers, tone register, and any constraints on presentation.',
    whenToUse: 'Any task where the output will be shared, presented, or directly used. Stakeholder communications, reports, documentation, templates.',
    whenNotToUse: 'Exploratory tasks where you want the AI to surprise you with structure. Brainstorming. Early-stage ideation.',
    teachesLearner: 'Format is not cosmetic — it determines usability. The same information as a bulleted list versus a narrative paragraph serves completely different purposes.',
  },
  {
    id: 'CONSTRAINT_FRAMING',
    name: 'Constraint Framing',
    icon: '🚧',
    color: '#FBCEB1',
    definition: 'Scopes the prompt by defining what the AI should NOT do — topics to avoid, assumptions it shouldn\'t make, length it shouldn\'t exceed, risks it shouldn\'t introduce.',
    whenToUse: 'Any high-stakes communication where errors matter. Client-facing documents. Tasks with known risk areas.',
    whenNotToUse: 'Unconstrained creative brainstorming. Research tasks where you want the AI to range widely.',
    teachesLearner: 'The AI will fill any silence with assumptions. Constraints are not limitations — they are specifications of your actual requirements.',
  },
  {
    id: 'FEW_SHOT_EXAMPLES',
    name: 'Few-Shot Examples',
    icon: '📖',
    color: '#E6FFFA',
    definition: 'Includes one or more concrete examples of desired output directly inside the prompt. The AI pattern-matches from your examples.',
    whenToUse: 'Repeatable tasks where consistency matters — template creation, standardised reports, agenda formats.',
    whenNotToUse: 'Tasks where the example might anchor the AI too narrowly. Novel tasks with no clear prior.',
    teachesLearner: 'Showing beats telling. One well-chosen example does more work than three paragraphs of description.',
  },
  {
    id: 'ITERATIVE_DECOMPOSITION',
    name: 'Iterative Decomposition',
    icon: '🔗',
    color: '#C3D0F5',
    definition: 'Breaks a complex task into explicit sub-tasks that the AI handles sequentially. Each building on the previous.',
    whenToUse: 'Large, multi-component deliverables. Strategic plans, research summaries with recommendations, multi-section documents.',
    whenNotToUse: 'Simple, single-output tasks. Anything where the decomposition overhead is greater than the task complexity.',
    teachesLearner: 'Complex tasks given to AI in one shot produce compressed, generic outputs. Breaking the task into explicit sub-tasks forces the AI to do real work at each stage.',
  },
  {
    id: 'TONE_AND_VOICE',
    name: 'Tone & Voice Setting',
    icon: '🎙️',
    color: '#FBE8A6',
    definition: 'Specifies the register, emotional temperature, and relational dynamic of the output — beyond simple instructions like "professional" or "friendly."',
    whenToUse: 'Any communication task where the relationship with the reader is as important as the information itself.',
    whenNotToUse: 'Internal technical documentation where tone is irrelevant. Mechanical tasks with no audience consideration.',
    teachesLearner: 'Most people think of tone as a finishing touch. In prompting, tone instruction shapes the AI\'s entire approach from the first word.',
  },
];

/** Strategy accent colours for UI rendering, indexed by strategy ID */
export const STRATEGY_ACCENT_COLORS: Record<StrategyId, string> = {
  STRUCTURED_BLUEPRINT: '#C3D0F5',
  CHAIN_OF_THOUGHT: '#FBE8A6',
  PERSONA_EXPERT_ROLE: '#A8F0E0',
  OUTPUT_FORMAT_SPECIFICATION: '#38B2AC',
  CONSTRAINT_FRAMING: '#FBCEB1',
  FEW_SHOT_EXAMPLES: '#E6FFFA',
  ITERATIVE_DECOMPOSITION: '#C3D0F5',
  TONE_AND_VOICE: '#FBE8A6',
};

/** v2 example chips for the Prompt Playground input (PRD Section 4.4) */
export const PLAYGROUND_EXAMPLE_CHIPS = [
  'Write a stakeholder update email',
  'Design an AI introduction workshop for sceptics',
  'Evaluate tools for my team',
  'Create a 90-day onboarding plan',
  'Summarise a research report into recommendations',
  'Draft a business case for a new initiative',
];
