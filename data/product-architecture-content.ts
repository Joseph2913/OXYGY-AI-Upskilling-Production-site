import type { ToolAnalysisResult, ProductArchitectureAnswers } from '../types';

// ---- TOOL DEFINITIONS ----

export interface ToolDefinition {
  id: string;
  step: number;
  name: string;
  initial: string;
  avatarColor: string;
  officeAnalogy: string;
  tagline: string;
  educational: {
    whatItDoes: string;
    whenYoudUseIt: string;
    tips: string[];
    levelConnection: string;
    connectedLevels: number[];
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'google-ai-studio',
    step: 1,
    name: 'Google AI Studio',
    initial: 'G',
    avatarColor: '#4285F4',
    officeAnalogy: 'Like your Word \u2014 where the first draft of your idea comes to life',
    tagline: 'Turn your PRD or idea into a working first mockup. Free, fast, and surprisingly powerful for prototyping.',
    educational: {
      whatItDoes: 'Google AI Studio is where your idea becomes something real for the first time. You take a description of what you want \u2014 a PRD, a brief, even a rough sketch \u2014 and the AI generates a working first version. It\u2019s fast, free, and surprisingly capable.',
      whenYoudUseIt: 'Every project starts here. Whether you\u2019re building a simple internal tool or a complex portal, the first step is always a rapid prototype. Google AI Studio is ideal because the feedback loop is immediate \u2014 describe what you want, see it, refine it.',
      tips: [
        'Start with a clear, detailed description. A PRD from Level 4 is perfect input.',
        'Don\u2019t try to get it perfect on the first pass. Three rounds of refinement beats one attempt at perfection.',
        'Export to GitHub early \u2014 don\u2019t build too much before versioning.',
      ],
      levelConnection: 'When Google AI Studio generates your prototype, it\u2019s making design decisions that require the clear instructions you learned in Level 1 and the design thinking from Level 4. The AI builds, but your ability to describe and evaluate? That\u2019s Level 1 and Level 4 at work.',
      connectedLevels: [1, 4],
    },
  },
  {
    id: 'github',
    step: 2,
    name: 'GitHub',
    initial: 'H',
    avatarColor: '#24292E',
    officeAnalogy: 'Like your SharePoint \u2014 where code lives and your team collaborates',
    tagline: 'A shared repository where all your project files are stored, versioned, and synced across tools.',
    educational: {
      whatItDoes: 'GitHub is where your project\u2019s files are stored, versioned, and shared. Every save (\u201Ccommit\u201D) is tracked so you can always go back. It\u2019s also how you connect tools: Claude Code reads from GitHub, Vercel deploys from GitHub.',
      whenYoudUseIt: 'Every project needs GitHub. Even solo projects benefit from version history. For teams, it\u2019s essential \u2014 like SharePoint for code.',
      tips: [
        'Push your Google AI Studio output to GitHub as your very first step.',
        'Commit often with clear messages. \u201CAdded student dashboard\u201D beats \u201Cupdates.\u201D',
        'For most projects, you\u2019ll use 3 actions: push, pull, and commit.',
      ],
      levelConnection: 'GitHub connects all your AI-powered tools together. The workflow architecture from Level 3 applies here: data flows from Google AI Studio \u2192 GitHub \u2192 Claude Code \u2192 Vercel. Understanding how systems connect \u2014 Level 3 \u2014 helps you see why GitHub sits at the center.',
      connectedLevels: [3],
    },
  },
  {
    id: 'claude-code',
    step: 3,
    name: 'Claude Code',
    initial: 'C',
    avatarColor: '#D4A574',
    officeAnalogy: 'Like hiring a specialist contractor \u2014 called in for complex work',
    tagline: 'Add sophisticated logic, third-party integrations, and production polish when your project needs it.',
    educational: {
      whatItDoes: 'Claude Code is an AI development tool that reads your project, understands its architecture, and makes sophisticated changes \u2014 adding features, fixing bugs, integrating APIs. It works directly with your GitHub repository.',
      whenYoudUseIt: 'Not every project needs Claude Code. Simple tools may be ready from Google AI Studio alone. But for complex data processing, integrations, or production polish \u2014 Claude Code is the specialist you call in.',
      tips: [
        'Give clear, specific instructions. \u201CAdd a progress bar showing percentage complete\u201D beats \u201Cmake it better.\u201D',
        'Work in small increments. One feature at a time, test, then move on.',
        'Review what it produces. Your understanding from Level 1\u20134 keeps quality high.',
      ],
      levelConnection: 'Every instruction you give Claude Code is a Level 2 system prompt. Every multi-step feature request is a Level 3 agent chain. The difference: instead of instructing a chatbot, you\u2019re instructing a developer agent. Level 2 and Level 3 skills directly determine how good the output is.',
      connectedLevels: [1, 2, 3],
    },
  },
  {
    id: 'supabase',
    step: 4,
    name: 'Supabase',
    initial: 'S',
    avatarColor: '#3ECF8E',
    officeAnalogy: 'Like your Excel \u2014 where all your data lives, organized in tables',
    tagline: 'User accounts, databases, and authentication \u2014 the backend that makes your app remember who\u2019s who.',
    educational: {
      whatItDoes: 'Supabase is your app\u2019s database and authentication layer. It stores data in tables (like Excel), manages user accounts, and provides an API your app talks to. If your app needs to remember anything, Supabase is where that data lives.',
      whenYoudUseIt: 'If your app has user accounts, saves data between sessions, or serves different content to different users \u2014 you need Supabase. If it\u2019s a simple, stateless tool where everyone sees the same thing \u2014 you can skip it.',
      tips: [
        'Design your tables before building. A quick sketch saves hours.',
        'Start with the minimum tables needed. You can always add more.',
        'Use Supabase\u2019s built-in authentication rather than building your own.',
      ],
      levelConnection: 'The data model in Supabase mirrors the workflow inputs and outputs from Level 3. Each table is a storage point in your workflow. And designing tables for different user roles? That\u2019s the same role-mapping logic from Level 3 applied to a database.',
      connectedLevels: [3],
    },
  },
  {
    id: 'vercel',
    step: 5,
    name: 'Vercel',
    initial: 'V',
    avatarColor: '#000000',
    officeAnalogy: 'Like your PowerPoint \u2014 where your final work is presented to the audience',
    tagline: 'One-click deployment that makes your app live. Real users get a real URL they can access instantly.',
    educational: {
      whatItDoes: 'Vercel turns your code into a live website. Connect it to GitHub, and every push automatically rebuilds and deploys. Within minutes, your app has a real URL that anyone can visit.',
      whenYoudUseIt: 'Every project that needs real users needs Vercel. It\u2019s the final step \u2014 like sharing a finished presentation. Without deployment, your app only exists on your own computer.',
      tips: [
        'Connect Vercel to GitHub early. Share a live preview with stakeholders throughout the build.',
        'Use preview deployments: every push creates a temporary preview URL for testing.',
        'Start with the free tier \u2014 it\u2019s more than sufficient for most projects.',
      ],
      levelConnection: 'Your deployed app is the culmination of every level: Level 1 powers the AI features, Level 2 shapes the intelligent components, Level 3 structures the backend, and Level 4 makes the experience intuitive. Vercel is the delivery mechanism \u2014 everything valuable came from skills across all four levels.',
      connectedLevels: [3, 4],
    },
  },
];

// ---- LEVEL METADATA ----

export const LEVEL_INFO: Record<number, { name: string; href: string }> = {
  1: { name: 'Fundamentals', href: '#playground' },
  2: { name: 'Applied Capability', href: '#agent-builder' },
  3: { name: 'Systemic Integration', href: '#workflow-designer' },
  4: { name: 'Strategic Oversight', href: '#' },
};

// ---- EXPORT HELPERS ----

const TECH_LEVEL_LABELS: Record<string, string> = {
  'non-technical': 'Non-technical',
  'semi-technical': 'Semi-technical',
  'technical': 'Technical',
};

export function generateTextExport(
  answers: ProductArchitectureAnswers,
  analysis: Record<string, ToolAnalysisResult>,
): string {
  let text = 'AI APPLICATION BUILD PLAN\n';
  text += '========================\n';
  text += 'Generated by OXYGY AI Upskilling \u2014 Level 5\n\n';

  if (answers.appDescription) {
    text += 'APP DESCRIPTION\n';
    text += '---------------\n';
    text += `${answers.appDescription}\n\n`;
  }

  if (answers.problemAndUsers) {
    text += 'PROBLEM & USERS\n';
    text += '---------------\n';
    text += `${answers.problemAndUsers}\n\n`;
  }

  if (answers.dataAndContent) {
    text += 'DATA & KEY FEATURES\n';
    text += '-------------------\n';
    text += `${answers.dataAndContent}\n\n`;
  }

  if (answers.technicalLevel) {
    text += `TECHNICAL LEVEL: ${TECH_LEVEL_LABELS[answers.technicalLevel] || answers.technicalLevel}\n\n`;
  }

  text += 'TOOL STACK ANALYSIS\n';
  text += '-------------------\n\n';

  for (const tool of TOOLS) {
    const result = analysis[tool.id];
    if (!result) continue;
    text += `${tool.step}. ${tool.name} [${result.classification.toUpperCase()}]\n`;
    text += `   "${tool.officeAnalogy}"\n\n`;
    text += `   FOR YOUR PROJECT:\n`;
    text += `   ${result.forYourProject}\n\n`;
    text += `   HOW TO APPROACH IT:\n`;
    text += `   ${result.howToApproach}\n\n`;
    text += `   TIPS:\n`;
    for (const tip of result.tips) {
      text += `   - ${tip}\n`;
    }
    text += '\n';
  }

  text += '\n---\nGenerated by OXYGY AI Upskilling Framework\n';
  return text;
}

export function generateMarkdownExport(
  answers: ProductArchitectureAnswers,
  analysis: Record<string, ToolAnalysisResult>,
): string {
  let md = '# AI Application Build Plan\n\n';
  md += '*Generated by OXYGY AI Upskilling \u2014 Level 5*\n\n';

  if (answers.appDescription) {
    md += '## App Description\n\n';
    md += `${answers.appDescription}\n\n`;
  }

  if (answers.problemAndUsers) {
    md += '## Problem & Users\n\n';
    md += `${answers.problemAndUsers}\n\n`;
  }

  if (answers.dataAndContent) {
    md += '## Data & Key Features\n\n';
    md += `${answers.dataAndContent}\n\n`;
  }

  if (answers.technicalLevel) {
    md += `**Technical Level:** ${TECH_LEVEL_LABELS[answers.technicalLevel] || answers.technicalLevel}\n\n`;
  }

  md += '---\n\n';
  md += '## Tool Stack Analysis\n\n';

  for (const tool of TOOLS) {
    const result = analysis[tool.id];
    if (!result) continue;
    const badge = result.classification === 'essential' ? '\u2705 Essential'
      : result.classification === 'recommended' ? '\uD83D\uDFE1 Recommended'
      : '\u26AA Optional';
    md += `### ${tool.step}. ${tool.name} \u2014 ${badge}\n\n`;
    md += `> *${tool.officeAnalogy}*\n\n`;
    md += `**For Your Project:**\n${result.forYourProject}\n\n`;
    md += `**How to Approach It:**\n${result.howToApproach}\n\n`;
    md += `**Tips:**\n`;
    for (const tip of result.tips) {
      md += `- ${tip}\n`;
    }
    md += '\n---\n\n';
  }

  md += '*Generated by OXYGY AI Upskilling Framework*\n';
  return md;
}
