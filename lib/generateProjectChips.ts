import type { PathwayApiResponse } from '../types';
import type { ToolkitProjectChip } from './database';

const TOOL_IDS: Record<number, string> = {
  1: 'prompt-playground',
  2: 'agent-builder',
  3: 'workflow-canvas',
  4: 'dashboard-designer',
  5: 'ai-app-evaluator',
};

const CHIP_INSTRUCTIONS: Record<string, string> = {
  'prompt-playground': `Return a JSON object with one key: "task". The value is a 1-2 sentence task description the user would type into a prompt engineering tool to get AI help implementing this project. Write it in first person ("I need to..."). Make it specific to the project title, deliverable, and context. Do not mention the tool name. Example format: { "task": "I need to draft a structured summary of our weekly L&D programme performance data, highlighting completion rates by cohort and flagging any learners who are more than 5 days behind schedule, formatted for a line manager audience." }`,
  'agent-builder': `Return a JSON object with two keys: "task" and "inputData". "task" is a 1-2 sentence description of what the AI agent should do repeatedly for this project (the repeatable, automatable part). "inputData" is a 1 sentence description of what data the agent would receive each time it runs. Both should be specific to the project. Example format: { "task": "Analyse weekly training completion exports to identify learners at risk of falling behind and generate a personalised nudge message for each line manager.", "inputData": "Weekly CSV export from the LMS with columns: learner name, cohort, modules completed, last active date, and assessment scores." }`,
  'workflow-canvas': `Return a JSON object with two keys: "task" and "tools". "task" is a 2-3 sentence description of the end-to-end workflow to automate for this project — including trigger, AI processing steps, human review point, and final output destination. "tools" is a 1 sentence description of the platforms/systems involved based on the project context. Example format: { "task": "When a new cohort completes their final assessment, automatically extract scores and written responses, generate a programme effectiveness summary with module-level breakdowns, flag any learners below threshold for HRBP follow-up, and email the report to the L&D lead.", "tools": "Assessment data from the LMS, stored in SharePoint, distributed via Outlook, with a Teams notification to the programme manager." }`,
  'dashboard-designer': `Return a JSON object with five keys: "q1_purpose", "q2_audience", "q3_type", "q4_metrics", "q5_dataSources". Each should be a concise, specific value (1-2 sentences max) tailored to the project. "q1_purpose" explains what decision or action the dashboard enables. "q2_audience" names the specific roles who would use it. "q3_type" describes the layout style. "q4_metrics" lists the 4-6 most relevant KPIs. "q5_dataSources" describes where the data comes from.`,
  'ai-app-evaluator': `Return a JSON object with three keys: "appDescription", "problemAndUsers", "dataAndContent". Each is 2-3 sentences. "appDescription" describes the full AI application to be built for this project. "problemAndUsers" describes the specific problem it solves and who uses it, with realistic numbers. "dataAndContent" describes the data inputs, content types, and any integrations required.`,
};

export async function generateProjectChips(
  plan: PathwayApiResponse
): Promise<Omit<ToolkitProjectChip, 'id' | 'userId' | 'generatedAt'>[]> {
  const assignedLevels = [1, 2, 3, 4, 5].filter(lvl => {
    const levelData = plan.levels[`L${lvl}`];
    return levelData && levelData.projectTitle;
  });

  if (assignedLevels.length === 0) return [];

  const chips: Omit<ToolkitProjectChip, 'id' | 'userId' | 'generatedAt'>[] = [];

  for (const lvl of assignedLevels) {
    const levelData = plan.levels[`L${lvl}`]!;
    const toolId = TOOL_IDS[lvl];
    const instruction = CHIP_INSTRUCTIONS[toolId];
    if (!instruction) continue;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `You are helping pre-populate an AI toolkit tool with project-specific context.

The user has been assigned this project for Level ${lvl}:
- Project title: ${levelData.projectTitle}
- Description: ${levelData.projectDescription || ''}
- Deliverable: ${levelData.deliverable || ''}
- Their challenge: ${levelData.challengeConnection || ''}

${instruction}

Respond ONLY with the JSON object. No preamble, no explanation, no markdown fences.`,
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const chipData = JSON.parse(text.trim()) as Record<string, string>;
      chips.push({ level: lvl, toolId, chipData });
    } catch (err) {
      console.error(`generateProjectChips error for level ${lvl}:`, err);
    }
  }

  return chips;
}
