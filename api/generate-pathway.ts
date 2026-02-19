import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are a learning pathway designer for Oxygy's AI Centre of Excellence. You generate personalized, project-based learning pathways for professionals who want to develop AI skills.

Your outputs must be:
- Practical and actionable — every project should be something the learner can start within a week
- Role-specific — projects should directly relate to the learner's stated function and challenge
- Empathetic — acknowledge where the learner is starting from and build confidence
- Connected — explicitly reference how each project relates to the learner's specific challenge from their questionnaire input

You generate content in strict JSON format. Never include markdown, backticks, or preamble outside the JSON object.

CRITICAL: In the "challengeConnection" field for EVERY level, you MUST directly reference and quote specific details from the user's stated challenge. This is the most important personalization element — the learner should feel that this pathway was built specifically for their situation.`;

function buildUserMessage(formData: Record<string, string>, levelDepths: Record<string, string>): string {
  const ambitionLabels: Record<string, string> = {
    'confident-daily-use': 'Confident daily AI use',
    'build-reusable-tools': 'Build reusable AI tools',
    'own-ai-processes': 'Design and own AI-powered processes',
    'build-full-apps': 'Build full AI-powered applications',
  };

  const experienceLabels: Record<string, string> = {
    'beginner': 'Beginner — rarely uses AI tools',
    'comfortable-user': 'Comfortable User — uses ChatGPT or similar regularly for basic tasks',
    'builder': 'Builder — has created custom GPTs, agents, or prompt templates',
    'integrator': 'Integrator — has designed AI-powered workflows or multi-step pipelines',
  };

  return `Generate a personalized learning pathway for the following professional.

## LEARNER PROFILE
- Role: ${formData.role || 'Not specified'}
- Function: ${formData.function === 'Other' ? formData.functionOther : formData.function || 'Not specified'}
- Seniority: ${formData.seniority || 'Not specified'}
- AI Experience: ${experienceLabels[formData.aiExperience] || formData.aiExperience || 'Not specified'}
- Ambition: ${ambitionLabels[formData.ambition] || formData.ambition || 'Not specified'}
- Specific Challenge: "${formData.challenge || 'Not specified'}"
- Weekly Availability: ${formData.availability || 'Not specified'}${formData.experienceDescription ? `\n- AI Experience Details: "${formData.experienceDescription}"` : ''}${formData.goalDescription ? `\n- Specific Goal: "${formData.goalDescription}"` : ''}

## LEVEL CLASSIFICATIONS (pre-determined, do not change)
- Level 1 (Fundamentals): ${levelDepths.L1}
- Level 2 (Applied Capability): ${levelDepths.L2}
- Level 3 (Systemic Integration): ${levelDepths.L3}
- Level 4 (Dashboards & Front-Ends): ${levelDepths.L4}
- Level 5 (Full AI Applications): ${levelDepths.L5}

## FRAMEWORK CONTEXT

### Level 1: Fundamentals of AI for Everyday Use
Topics: What is an LLM, Prompting Basics, Everyday Use Cases, Intro to Creative AI, Responsible Use, Prompt Library Creation
Tools: ChatGPT, DALL-E, Opus Clip, Snipd, Descript
Objective: Build comfort, curiosity, and foundational confidence

### Level 2: Applied Capability
Topics: What Are AI Agents?, Custom GPTs, Instruction Design, Human-in-the-Loop, Ethical Framing, Agent Templates
Tools: ChatGPT Custom GPT Builder, Claude Projects & Skills, Microsoft Copilot Agents, Google Gems
Objective: Empower individuals to design AI assistants tailored to their work

### Level 3: Systemic Integration
Topics: AI Workflow Mapping, Agent Chaining, Input Logic & Role Mapping, Automated Output Generation, Process Use Cases, Performance & Feedback Loops
Tools: Make, Zapier, n8n, API integrations, Airtable
Objective: Scale AI usage through integrated, automated pipelines

### Level 4: Interactive Dashboards & Tailored Front-Ends
Topics: Application Architecture, User-Centered Dashboard Design, Data Visualization, Role-Based Views, Prototype Testing, Stakeholder Feedback
Tools: Figma, V0, Google AI Studio, Cursor, dashboard prototyping tools
Objective: Shift from data-in-a-sheet to tailored experiences built for specific end users

### Level 5: Full AI-Powered Applications
Topics: Application Architecture, Personalization Engines, Knowledge Base Applications, Custom Learning Platforms, Full-Stack AI Integration, User Testing & Scaling
Tools: Google AI Studio, GitHub, Claude Code, Supabase, Vercel
Objective: Full-stack AI applications where different users get different experiences

### Cross-Functional Use Cases
- Consulting & Delivery: Create tailored client insights from notes and transcripts (Custom GPT for thematic analysis)
- Proposal & BD: Generate draft proposals from templates and client inputs (Prompt libraries, document generation agents)
- Project Management: Summarize risks, status updates, and meeting notes (Auto-summary GPTs, recurring agent triggers)
- L&D / Training: Match individual skill gaps to existing learning modules (AI-driven skills gap analyzer + recommender)
- Analytics & Insights: Process survey results and tag responses by role & sentiment (Human-in-the-loop GPT analysis agents)
- Ops & SOP Management: Convert conversations into visual SOPs or step-by-step guides (Process mapping + diagram generation agent)
- Comms & Change: Draft announcements or FAQs adapted to persona groups (Role-persona-based message customizers)
- IT & Knowledge Management: Set up internal AI chatbots to retrieve documents or SOPs (RAG agents)

## INSTRUCTIONS

IMPORTANT: Level 1 and Level 2 are MANDATORY for every learner — they will always be classified as "full" or "fast-track", never "awareness" or "skip". These foundational levels must always be included and tailored to the learner's experience level. For advanced learners doing fast-track at L1/L2, frame it as "validate and sharpen" rather than "learn from scratch."

Only Levels 3, 4, and 5 may be classified as "awareness" or "skip" when they are too advanced for the learner's current experience level.

Generate content ONLY for levels classified as "full" or "fast-track". Do NOT generate content for "awareness" or "skip" levels.

For each applicable level, generate:
1. A project title — action-oriented, specific to the learner's role and function
2. A project description — 2-3 sentences explaining what they'll build. Reference their function and typical tasks.
3. A deliverable — one concrete, tangible output they'll have at the end
4. A challengeConnection — 2-3 sentences that DIRECTLY reference the learner's stated challenge from Q6. Quote or paraphrase their exact words. Explain how this level's project connects to solving that specific challenge. This should feel unmistakably personalized.
5. A recommended session format — based on their seniority level
6. 2-4 suggested resources — real tools, platforms, guides, or Oxygy references relevant to the project

For "fast-track" levels, the project should be a lighter, assessment-style activity that proves existing competency while filling gaps. Frame it as "validate and sharpen" rather than "learn from scratch."

## OUTPUT FORMAT

Respond ONLY with valid JSON, no backticks or markdown:

{
  "pathwaySummary": "1-2 sentence personalized overview of their pathway",
  "totalEstimatedWeeks": number,
  "levels": {
    "L1": {
      "depth": "full|fast-track",
      "projectTitle": "string",
      "projectDescription": "string",
      "deliverable": "string",
      "challengeConnection": "string",
      "sessionFormat": "string",
      "resources": [
        { "name": "string", "note": "string" }
      ]
    }
  }
}

Only include levels that are "full" or "fast-track". Omit "awareness" and "skip" levels from the JSON entirely.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured' });
  }

  try {
    const { formData, levelDepths } = req.body;
    const userMessage = buildUserMessage(formData, levelDepths);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error (pathway):', errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Serverless function error (pathway):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
