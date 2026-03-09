import React, { useState, useEffect } from 'react';

/* ── Google Fonts + Flip Card CSS ── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    .l1-flip-card { perspective: 1000px; cursor: pointer; }
    .l1-flip-inner { transition: transform 0.6s; transform-style: preserve-3d; position: relative; width: 100%; }
    .l1-flip-inner.flipped { transform: rotateY(180deg); }
    .l1-flip-front, .l1-flip-back { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .l1-flip-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .l1-slider::-webkit-slider-thumb { background: #38B2AC; }
    .l1-slider { accent-color: #38B2AC; }
    @keyframes l1-pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(56,178,172,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(56,178,172,0); }
    }
    .l1-cta-glow {
      animation: l1-pulse-glow 2s ease-in-out infinite;
    }
    @keyframes l1-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .l1-interact-hint {
      position: relative;
      border: 2px solid #38B2AC !important;
    }
    .l1-interact-hint::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      border: 2px solid transparent;
      background: linear-gradient(90deg, transparent 30%, rgba(56,178,172,0.3) 50%, transparent 70%) border-box;
      background-size: 200% 100%;
      animation: l1-shimmer 2.5s linear infinite;
      pointer-events: none;
      mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
    }
    @media (max-width: 767px) {
      .l1-two-col { flex-direction: column !important; }
      .l1-two-col > div { width: 100% !important; min-width: 0 !important; }
      .l1-player-content { padding: 20px !important; }
      .l1-flip-row { flex-direction: column !important; }
      .l1-flip-row > div { width: 100% !important; }
      .l1-rctf-grid { grid-template-columns: 1fr !important; }
      .l1-drag-grid { grid-template-columns: 1fr !important; }
      .l1-article-grid { grid-template-columns: 1fr !important; }
      .l1-hero-cols { flex-direction: column !important; }
      .l1-branch-opts { flex-direction: column !important; }
      .l1-branch-opts > div { width: 100% !important; }
      .l1-layers-row { flex-direction: column !important; }
      .l1-docs-row { flex-direction: column !important; }
      .l1-journey-strip { overflow-x: auto !important; }
      .l1-journey-strip > div { min-width: 480px; }
    }
  `}</style>
);

/* ── Brand Tokens ── */
const C = {
  navy: "#1A202C", navyMid: "#2D3748", teal: "#38B2AC", tealDark: "#2C9A94",
  tealLight: "#E6FFFA", mint: "#A8F0E0", border: "#E2E8F0", bg: "#F7FAFC",
  body: "#4A5568", light: "#718096", muted: "#A0AEC0",
  success: "#48BB78", successLight: "#F0FFF4", successBorder: "#9AE6B4",
  error: "#FC8181", errorLight: "#FFF5F5", errorBorder: "#FEB2B2",
  role: "#667EEA", roleLight: "#EBF4FF",
  context: "#38B2AC", contextLight: "#E6FFFA",
  task: "#ED8936", taskLight: "#FFFBEB",
  format: "#48BB78", formatLight: "#F0FFF4",
};
const F = { h: "'DM Sans', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

/* ── Data: Phases ── */
const PHASES = [
  { id: "elearn", label: "E-Learning", icon: "▶", time: "~20 min", desc: "13-slide interactive module" },
  { id: "read", label: "Read", icon: "◎", time: "~15 min", desc: "2 articles + reflection" },
  { id: "watch", label: "Watch", icon: "▷", time: "~12 min", desc: "2 videos + knowledge check" },
  { id: "practice", label: "Practice", icon: "◈", time: "~15 min", desc: "Prompt Playground →", external: true },
];

/* ── Data: Slides ── */
const SLIDES: any[] = [
  { id: 1, section: "FOUNDATIONS", type: "title", heading: "Prompt Engineering Essentials", subheading: "Why some people get dramatically better results from the same tools you're already using", meta: ["13 slides", "~20 minutes", "Interactive", "Quiz included"], body: "You’re probably already using AI. But there’s a good chance you’re getting a fraction of what it’s capable of — not because the tool is limited, but because of what you’re giving it to work with. This module will change how you think about AI communication from the ground up." },
  { id: 2, section: "FOUNDATIONS", type: "concept", heading: "Your AI outputs are a mirror", tealWord: "mirror", body: "When you get a disappointing response from an AI, the instinct is to blame the tool. Almost every time, the real issue is something else: the AI was working with incomplete information about you, your situation, your constraints, and what ‘good’ actually looks like.\n\nAI has no memory of previous conversations, no knowledge of your organisation, no idea who your audience is, or what you’ve already tried. Every time you start a new chat, it starts completely blank.", pullQuote: "The AI is not underperforming. It’s performing perfectly on incomplete information. The information is your job to provide.", visualKey: "comparison" },
  { id: 3, section: "FOUNDATIONS", type: "spectrum", heading: "There’s no single right way to prompt", tealWord: "prompt", body: "Effective prompting isn’t about following one formula. The approach that works depends on what you’re trying to do, how much time you have, and how clearly you’ve formed your own thinking. Think of it as a spectrum.", positions: [
    { label: "Brain Dump", desc: "Best when your thinking is unstructured", example: "We’ve just finished a difficult client workshop. There was tension around the change management timeline, the sponsor seemed disengaged, and three team members gave conflicting views on scope. I’m not sure how to frame the debrief. What should I be thinking about and what would you suggest I do next?" },
    { label: "Conversational", desc: "Best for iterative, exploratory tasks", example: "Turn 1: Help me structure the key messages for a pitch to a pharma L&D team. Turn 2: The audience will be the L&D director, not commercial. Adjust for that. Turn 3: Make the opening more direct — they’re time-poor and need the business case upfront." },
    { label: "Structured (RCTF)", desc: "Best for repeatable, consistent outputs", example: "Role: Senior L&D consultant. Context: Designing a capability framework for a 500-person pharma organisation post-merger. Task: Draft the 5 core competency areas. Format: Table with competency name, 2-sentence description, and one example behaviour per competency." },
  ]},
  { id: 4, section: "THE BIGGER PICTURE", type: "concept", heading: "Prompting is one layer of a bigger skill", tealWord: "bigger skill", body: "Context engineering is the practice of giving AI everything it needs to perform at its best — through your prompt, through the documents you provide, and through how you organise your working environment.\n\nPrompting is Layer 1. It’s essential and it’s where everyone starts. But the people getting the most from AI at work have gone further — and in this module, you’ll see exactly what that looks like.", visualKey: "layers" },
  { id: 5, section: "LAYER 1 — IN YOUR PROMPT", type: "rctf", heading: "The RCTF Framework", tealWord: "RCTF", subheading: "The most practical structured approach — and the one your whole team can standardise on", elements: [
    { key: "ROLE", color: "#667EEA", light: "#EBF4FF", desc: "Tell the AI who to be. A specific persona unlocks a specific style of thinking and a specific type of expertise.", example: "You are a senior change management consultant with 15 years of experience in large-scale digital transformations within pharmaceutical companies." },
    { key: "CONTEXT", color: "#38B2AC", light: "#E6FFFA", desc: "Tell the AI about your situation — who’s involved, what’s happened so far, what the constraints are.", example: "We are 6 weeks into an ERP rollout. Commercial teams are showing resistance. A failed IT project 3 years ago has damaged trust in tech initiatives." },
    { key: "TASK", color: "#ED8936", light: "#FFFBEB", desc: "Tell the AI exactly what to produce. Vague tasks produce vague outputs — every time.", example: "Create a 10-question stakeholder survey to identify the root causes of commercial team resistance to the ERP rollout." },
    { key: "FORMAT", color: "#48BB78", light: "#F0FFF4", desc: "Tell the AI how to structure the output — length, layout, tone, what to include and what to leave out.", example: "Output as a numbered list. Max 15 words per question. Professional tone. No preamble or explanation — just the questions." },
  ]},
  { id: 6, section: "LAYER 1 — PRACTICE", type: "dragdrop", heading: "Build an RCTF prompt", tealWord: "RCTF prompt", instruction: "Below is a prompt someone wrote before they knew about RCTF. Drag each fragment into the correct category. Some fragments are deliberately missing — that’s part of the exercise.", scenario: "You work in the Learning & Development team at a large consulting firm. You need to brief AI on creating an onboarding plan for new graduate hires." },
  { id: 7, section: "LAYER 1 — ADVANCED MOVES", type: "flipcard", heading: "Beyond RCTF — when to go further", tealWord: "go further", bodyAboveCards: "RCTF covers most situations. Two additional techniques unlock significantly better results for specific types of task. They take 30 seconds to learn." },
  { id: 8, section: "LAYER 2 — THROUGH DOCUMENTS", type: "concept", heading: "Stop describing your work. Start showing it.", tealWord: "showing it", body: "Everything in Layer 1 — the role, the context, the format — you’ve been writing by hand. That works. But there’s a faster, more powerful approach for anything that involves real documents: attach them directly.\n\nWhen you give an AI a meeting transcript, a strategy document, a client brief, or a previous output, you’re not just saving time. You’re giving it access to specificity that no prompt description could replicate.", pullQuote: "Uploading a 30-page strategy document takes 10 seconds. Describing its contents accurately in a prompt would take 30 minutes — and you’d still lose most of the nuance.", visualKey: "documents" },
  { id: 9, section: "LAYER 2 — SEE THE DIFFERENCE", type: "flipcard", heading: "The same prompt. A document changes everything.", tealWord: "document changes everything", instruction: "Both cards start with the same request. Flip each to see what the AI produced." },
  { id: 10, section: "LAYER 3 — THROUGH ORGANISATION", type: "concept", heading: "When your AI knows your world", tealWord: "knows your world", body: "Layers 1 and 2 work session by session. Each time you start a new chat, you start from zero — re-write the role, re-upload the documents, re-explain the constraints.\n\nLayer 3 changes that. By organising your AI work into Projects — with a system prompt, shared documents, and context that builds across conversations — you move from prompting to partnership. The AI stops being a tool you instruct and starts being a collaborator that understands your work.", visualKey: "project" },
  { id: 11, section: "APPLY IT", type: "branching", heading: "One scenario. You choose the approach.", tealWord: "you choose", bodyAboveScenario: "You’ve just finished a 90-minute client discovery session. Your notes are scattered. The partner wants a debrief summary by end of day. You have 30 minutes. Which context strategy do you use?", scenario: { situation: "90-minute client discovery session just finished", notes: "Scattered — mix of shorthand, observations, and half-formed impressions", theAsk: "Partner wants a structured debrief summary by end of day", timeAvailable: "30 minutes" } },
  { id: 12, section: "CHECK YOUR INSTINCTS", type: "quiz", heading: "One question. Think it through.", question: "A colleague asks you to review a 15-page client proposal they’ve written and give feedback on clarity and structure. You want AI’s help. What’s the most effective approach?", options: [
    "Write a detailed RCTF prompt describing what a good proposal looks like and asking for feedback criteria",
    "Attach the proposal and write: ‘Review this for clarity and structure. Flag the three weakest sections and suggest specific improvements for each.’",
    "Ask the AI: ‘What makes a great consulting proposal?’ and use its answer as a checklist to review the document yourself",
    "Brain dump your initial impressions of the proposal and ask the AI to help you structure your feedback",
  ], correct: 1, explanations: [
    "Partially correct, but inefficient. You could describe what a good proposal looks like — but why describe it when you can show it? RCTF shines when you don’t have a document to provide. Here, the document exists. Attach it.",
    "Layer 2 in action. The proposal carries all the context the AI needs. Your prompt is precise — specific task, specific format, specific depth. The combination of document plus structured prompt produces feedback grounded in the actual content, not generic best practices.",
    "Misses the point. This uses the AI to generate abstract criteria rather than apply them to the specific document. You’d get a useful general framework — but you’d still be doing all the document analysis yourself.",
    "Not wrong, but not optimal. Brain dumping your impressions could produce useful structured feedback — but it relies on your memory of a 15-page document, which is exactly where humans are unreliable.",
  ]},
  { id: 13, section: "YOUR STARTER KIT", type: "templates", heading: "Five templates you can use tomorrow", tealWord: "use tomorrow", body: "Each template is structured using RCTF and ready to use. Customise the bracketed fields for your situation. The ‘What to attach’ note tells you what document context will make each one significantly more powerful." },
];

/* ── Data: Drag & Drop (Slide 6) ── */
const DRAG_CHIPS = [
  { id: "c1", text: "Create a 4-week onboarding plan", correctZone: "TASK" },
  { id: "c2", text: "You are an experienced L&D specialist with deep knowledge of professional services firms", correctZone: "ROLE" },
  { id: "c3", text: "Output as a week-by-week table with: focus area, key activities, and success criteria for each week", correctZone: "FORMAT" },
  { id: "c4", text: "Our graduate cohort joins in September. They have no prior consulting experience. We want them client-ready within 30 days.", correctZone: "CONTEXT" },
  { id: "c5", text: "Professional tone. No jargon.", correctZone: "FORMAT" },
  { id: "c6", text: "For a professional services firm", correctZone: "CONTEXT" },
  { id: "c7", text: "Make it detailed and useful", correctZone: "TASK", isDistractor: true, feedback: "This is too vague to be a useful task instruction. Specific tasks produce specific outputs. Try: ‘Create a 4-week onboarding plan’ instead." },
];
const DROP_ZONES = [
  { id: "ROLE", label: "Role", color: "#667EEA", light: "#EBF4FF" },
  { id: "CONTEXT", label: "Context", color: "#38B2AC", light: "#E6FFFA" },
  { id: "TASK", label: "Task", color: "#ED8936", light: "#FFFBEB" },
  { id: "FORMAT", label: "Format", color: "#48BB78", light: "#F0FFF4" },
];

/* ── Data: Technique Flip Cards (Slide 7) ── */
const TECHNIQUE_CARDS = [
  { frontLabel: "Chain of Thought", frontOneLiner: "When you need the AI to reason, not just respond", frontExcerpt: "Think through this step by step before giving your final answer…", backWhen: "Complex decisions, multi-variable analysis, anything where you’d want to see the working — not just the conclusion.", backExample: "Analyse the risks of launching our new service in EMEA before the US. Think through this step by step: consider market readiness, regulatory environment, resource requirements, and competitive timing. Then give your recommendation.", backWhy: "Asking the AI to reason out loud catches errors in its logic — and yours. It produces outputs that are easier to challenge and refine." },
  { frontLabel: "Few-Shot Prompting", frontOneLiner: "When you want consistent style — show, don’t tell", frontExcerpt: "Here are two examples of what I’m looking for. Follow this pattern exactly…", backWhen: "Recurring outputs where format and tone matter — status updates, client emails, meeting summaries. Anything your team produces repeatedly.", backExample: "Here are two examples of how we write project status updates: [Example 1] [Example 2]. Now write a status update for this week using the same structure and tone.", backWhy: "Showing is more precise than describing. A good example eliminates ambiguity about format, tone, and depth in a way that written instructions alone cannot." },
];

/* ── Data: Document Flip Cards (Slide 9) ── */
const DOC_FLIP_CARDS = [
  { frontBadge: "PROMPT — NO ATTACHMENT", badgeStyle: "error" as const, frontLabel: "Summarise the key decisions from our last leadership meeting", frontNote: "No document attached", backBadge: "AI RESPONSE", backResponse: "I’d be happy to help summarise your leadership meeting decisions, but I don’t have access to the content of your meeting. Could you share the key discussion points, agenda items, or notes from the meeting so I can help organise and summarise them for you?", backInsight: "The AI can’t help. It has nothing to work with.", insightBg: C.errorLight, insightBorder: C.errorBorder },
  { frontBadge: "PROMPT + MEETING TRANSCRIPT", badgeStyle: "success" as const, frontLabel: "Summarise the key decisions from our last leadership meeting", frontNote: "Circleback transcript attached (47 min meeting)", backBadge: "AI RESPONSE", backResponse: "Key decisions from the 14 Feb leadership meeting:\n\n1. APPROVED: Q2 hiring plan — 3 additional consultants, start dates staggered April–June\n\n2. DEFERRED: New client pricing structure — CFO requested revised modelling before sign-off (deadline: 28 Feb)\n\n3. ASSIGNED: Sarah to lead the Frankfurt office proposal — first draft due 21 Feb for review\n\n4. ESCALATED: Capacity concern on Project Delta flagged to MD — decision expected by EOW", backInsight: "Same prompt. The document turned a dead-end into a complete, actionable output.", insightBg: C.successLight, insightBorder: C.successBorder },
];

/* ── Data: Branching Options (Slide 11) ── */
const BRANCH_OPTS = [
  { cardLabel: "LAYER 1 — PROMPT ONLY", whatYouDo: "Paste your rough notes into a brain dump prompt. Let the AI find structure in your unorganised thinking.", promptPreview: "Here are my raw notes from the discovery session: [paste everything]. The partner needs a debrief summary by EOD. Help me structure the key findings, tensions we observed, and recommended next steps.", qualityBadge: "GOOD — Fast and usable", qualityColor: C.task, outputSnippet: "Key findings from discovery session:\n\n1. Strategic fit uncertain — client sees outsourcing as cost reduction but hasn’t defined what ‘good’ looks like for medical affairs\n\n2. Internal tension flagged — Medical Director supportive; VP Commercial resistant (perceived loss of control)\n\n3. Decision timeline unclear — Board wants a recommendation in 6 weeks but due diligence scope isn’t agreed", reflection: "Brain dump works well here — your rough notes had enough substance for the AI to find structure. The output is solid but generic. It doesn’t reflect your firm’s methodology or specific framing. Good first draft. Needs editing for client delivery.", tradingOff: "Fast · Generic · Good first draft" },
  { cardLabel: "LAYER 2 — DOCUMENT + PROMPT", whatYouDo: "Upload the Circleback transcript and write a structured RCTF prompt. Let the document carry the context.", promptPreview: "[Transcript attached] You are a senior management consultant. Using this discovery session transcript, produce a debrief summary covering: key themes, stakeholder concerns, open questions, and recommended next steps. Format as a structured brief, max 400 words.", qualityBadge: "STRONG — Specific and grounded", qualityColor: C.success, outputSnippet: "Discovery Debrief — Medical Affairs Outsourcing\n[Client], 18 Feb 2026\n\nKEY THEMES\n→ Strategic ambiguity: Client hasn’t defined the ‘make vs buy’ criteria.\n\n→ Stakeholder misalignment: Medical Director aligned; VP Commercial concerned about loss of KOL relationship ownership.\n\n→ Regulatory risk underweighted: No discussion of pharmacovigilance handover.\n\nRECOMMENDED NEXT STEPS\n1. Workshop: Define outsourcing success criteria with ExCo (Wk 2)\n2. Stakeholder map: KOL relationship ownership\n3. Regulatory review: Bring in PV lead for risk assessment", reflection: "The transcript gave the AI specificity no prompt description could replicate — names, specific concerns, exact tensions. This is near client-ready with minimal editing. Layer 2 at work.", tradingOff: "Specific · Grounded · Near client-ready" },
  { cardLabel: "LAYER 3 — ORGANISED CONTEXT", whatYouDo: "Open your existing client project where the client brief and methodology are already loaded. Ask directly — the AI already knows the context.", promptPreview: "[In client project — brief and methodology already loaded] Summarise the key findings from today’s discovery session transcript [attached]. Flag any tensions with the original brief and suggest 3 next steps.", qualityBadge: "POWERFUL — Contextually aware", qualityColor: C.teal, outputSnippet: "[Same quality as Option B output, plus:]\n\nALIGNMENT WITH ENGAGEMENT BRIEF\nFindings broadly consistent with original scope. However, the regulatory risk gap identified represents a material scope addition. Recommend flagging to the partner before submitting.\n\nSuggested framing: ‘We’ve identified a PV risk dimension not in original scope but significant for the recommendation. Suggest a 30-min call before we submit findings.’", reflection: "Because the project contained the original brief and your methodology, the AI cross-referenced what it heard against what was expected — and proactively flagged the gap.\n\nYou didn’t build this project today — that’s Level 2. But now you know exactly why you will.", tradingOff: "Contextually aware · Proactive · Level 2 skill" },
];

/* ── Data: Templates (Slide 13) ── */
const TEMPLATES = [
  { id: "t1", name: "Meeting Debrief", tag: "CONSULTING · L&D · BD", tagColor: C.teal, prompt: "You are a senior [role] at a professional services firm. Review the attached meeting transcript and produce a structured debrief covering:\n• Key decisions made (with owners)\n• Open questions and unresolved tensions\n• Action items (owner + deadline)\n• What I should flag to my manager before next steps\n\nFormat: Structured bullet points. Max 300 words. Direct tone — no filler.", whatToAttach: "Your Circleback or Otter.ai transcript from the meeting", proTip: "No transcript? Paste your rough notes instead — brain dump them directly above this prompt." },
  { id: "t2", name: "Document Analysis", tag: "STRATEGY · CONSULTING · ANY FUNCTION", tagColor: "#667EEA", prompt: "You are a [role] with expertise in [domain]. Review the attached document and identify:\n• The 3 most important insights or findings\n• The key assumptions being made (and whether they hold up)\n• The single most important question this document leaves unanswered\n• What I should do with this information\n\nFormat: Numbered list for each section. Analytical tone. Flag uncertainty explicitly — don’t guess.", whatToAttach: "The document, report, or strategy deck you want analysed", proTip: "Works especially well for long documents you don’t have time to read in full." },
  { id: "t3", name: "First Draft Generator", tag: "BD · COMMS · ANY WRITTEN OUTPUT", tagColor: "#ED8936", prompt: "You are an experienced [consultant / writer / analyst] specialising in [domain or sector]. Draft a [document type — email / proposal section / briefing note] for the following situation:\n\n[Describe your situation here — or attach the brief]\n\nAudience: [Who will read this]\nTone: [Professional / direct / warm / technical]\nLength: [Max word count or format]\n\nDo not add preamble or sign-off unless specified.", whatToAttach: "A previous example of a similar document written in your team’s voice — or the brief you’re working from", proTip: "Attaching a previous example is often more powerful than describing tone in text. Show it what ‘good’ looks like." },
  { id: "t4", name: "Stakeholder Preparation", tag: "CONSULTING · BD · LEADERSHIP", tagColor: "#48BB78", prompt: "You are a senior advisor helping me prepare for an important meeting. Based on the attached context, help me:\n\n• Anticipate the 3 most likely objections or concerns this stakeholder will raise\n• Prepare a response or position for each\n• Identify the one thing I must NOT say or do in this meeting\n• Suggest the ideal opening 2 minutes\n\nFormat: Structured by section. Practical and specific — no generic advice.", whatToAttach: "Stakeholder profile, LinkedIn background, previous meeting notes, or the document they will have reviewed", proTip: "More specific context = more specific preparation. Generic background produces generic prep." },
  { id: "t5", name: "Learning & Synthesis", tag: "L&D · RESEARCH · PERSONAL DEVELOPMENT", tagColor: C.navyMid, prompt: "You are a knowledgeable [subject matter expert]. I have just [read / attended / completed] [resource name or type].\n\nHelp me:\n• Summarise the 3 most important ideas in plain language\n• Connect these ideas to [my role / current project / specific challenge]\n• Give me 2 questions I should now be asking myself\n• Suggest one immediate action I can take\n\nFormat: Short paragraphs per section. Practical and specific.", whatToAttach: "The article, transcript, or notes from whatever you just consumed", proTip: "Use after every significant piece of learning — articles, podcasts, workshops. Turns passive consumption into active synthesis." },
];

/* ── Data: Articles ── */
const ARTICLES = [
  { id: "a1", title: "The Prompt Engineering Playbook: What Separates Power Users from Everyone Else", source: "Harvard Business Review", readTime: "7 min read", desc: "How structured prompting is changing the way knowledge workers interact with AI tools — and what consistently separates professionals who get great outputs from those who get generic ones.", url: "https://hbr.org", reflection: "In one sentence, what was the single most useful idea from this article for your day-to-day work at Oxygy?" },
  { id: "a2", title: "Why Context Is the Most Underrated Variable in AI Prompting", source: "MIT Technology Review", readTime: "8 min read", desc: "A deep-dive into why the Context element of a prompt has more impact on output quality than any other variable — with real examples from professional knowledge work.", url: "https://technologyreview.com", reflection: "Describe one specific situation from your own work where adding more context to a prompt could have meaningfully improved the output you received." },
];

/* ── Data: Videos ── */
const VIDEOS = [
  { id: "v1", title: "Context Engineering in Practice", channel: "Oxygy Learning", duration: "12 min", desc: "A live walkthrough of all three context engineering layers applied to real consulting and pharma scenarios — including before/after comparisons at each layer.", url: "https://youtube.com", quiz: [
    { q: "In the video, what was identified as the most commonly skipped element of the RCTF framework?", options: ["Role — people feel unnatural assigning a persona to AI", "Context — people assume the AI already knows their situation", "Task — people think their ask is obvious from the prompt", "Format — people let the AI decide the output structure"], correct: 1 },
    { q: "According to the video, when does attaching a document add the most value over a detailed prompt?", options: ["When the document is under 5 pages and easy to summarise", "When the content contains specific names, quotes, and details that would be lost in a text description", "When you don’t have time to write a proper RCTF prompt", "When the AI model has a large context window"], correct: 1 },
  ]},
  { id: "v2", title: "Building a Team Prompt Library", channel: "Oxygy Learning", duration: "9 min", desc: "How to move from individual prompting habits to a shared, standardised library that scales context engineering capability across your entire team.", url: "https://youtube.com", quiz: [
    { q: "What is the primary benefit of a shared prompt library over individual prompting habits?", options: ["It saves individuals time writing prompts from scratch", "It standardises inputs to produce consistent, comparable outputs across the team", "It prevents people from making mistakes in their prompts", "It allows managers to monitor what questions employees are asking AI"], correct: 1 },
    { q: "In the video, what tagging approach is recommended for organising a prompt library?", options: ["By date created and author name", "By AI tool used (Claude, ChatGPT, Copilot)", "By use case and function (e.g., BD / Meeting Debrief / Strategy)", "By output quality rating from previous uses"], correct: 2 },
  ]},
];

/* ── Reusable Components ── */
const Eyebrow = ({ t }: { t: string }) => <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: F.b, marginTop: 0 }}>{t}</p>;

const TU = ({ children }: { children: React.ReactNode }) => <span style={{ textDecoration: "underline", textDecorationColor: C.teal, textDecorationThickness: 3, textUnderlineOffset: 5 }}>{children}</span>;

function renderH2(heading: string, tw: string, fs = 22) {
  if (!tw) return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading}</h2>;
  const idx = heading.indexOf(tw);
  if (idx === -1) return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading}</h2>;
  return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading.slice(0, idx)}<TU>{tw}</TU>{heading.slice(idx + tw.length)}</h2>;
}

function PhaseLabel({ label, time, done }: { label: string; time: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? C.success : "#ED8936" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: F.b }}>{done ? `${label} — Complete ✓` : `${label} — In Progress`}</span>
      </div>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: F.b }}>{time}</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, secondary }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px", borderRadius: 24, minWidth: 100, minHeight: 44,
      border: secondary ? `1px solid ${C.border}` : "none",
      background: disabled ? C.muted : secondary ? "transparent" : C.teal,
      color: disabled ? "#fff" : secondary ? C.navy : "#fff",
      fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: F.b, display: "inline-flex", alignItems: "center", gap: 5, transition: "all 150ms ease",
    }}>{children}</button>
  );
}

const PromptBox = ({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) => (
  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColor || C.teal}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", fontSize: 13, fontFamily: F.b, fontStyle: "italic", color: C.navyMid, lineHeight: 1.6, wordBreak: "break-word", overflowWrap: "break-word", width: "100%", whiteSpace: "pre-wrap", boxSizing: "border-box" as const }}>{children}</div>
);

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function Level1Page() {
  /* ── Phase State ── */
  const [activePhase, setActivePhase] = useState("elearn");
  const [phasesDone, setPhasesDone] = useState<Set<string>>(new Set());

  /* ── E-Learning Player ── */
  const [slide, setSlide] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [spectrumPos, setSpectrumPos] = useState(2);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  /* ── Confidence Delta ── */
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [confSliderBefore, setConfSliderBefore] = useState(5);
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null);
  const [confSliderAfter, setConfSliderAfter] = useState(5);
  const [confidenceSubmitted, setConfidenceSubmitted] = useState(false);

  /* ── Drag & Drop (Slide 6) ── */
  const [chipPlacements, setChipPlacements] = useState<Record<string, string>>({});
  const [selectedDragChip, setSelectedDragChip] = useState<string | null>(null);
  const [dragChecked, setDragChecked] = useState(false);

  /* ── Branching (Slide 11) ── */
  const [scenarioChoice, setScenarioChoice] = useState<number | null>(null);
  const [scenarioConfirmed, setScenarioConfirmed] = useState(false);

  /* ── Template Copy ── */
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  /* ── Read Phase ── */
  const [articleState, setArticleState] = useState<Record<string, { clicked: boolean; reflectionText: string; submitted: boolean }>>({});

  /* ── Watch Phase ── */
  const [videoState, setVideoState] = useState<Record<string, { clicked: boolean; quizAnswers: (number | null)[]; quizChecked: boolean[] }>>({});

  /* ── Helpers ── */
  const markPhaseDone = (id: string) => setPhasesDone(prev => new Set([...prev, id]));
  const readDone = ARTICLES.every(a => articleState[a.id]?.submitted);
  const watchDone = VIDEOS.every(v => videoState[v.id]?.clicked && videoState[v.id]?.quizChecked?.every(Boolean));
  const completedPhases = (phasesDone.has("elearn") ? 1 : 0) + (phasesDone.has("read") ? 1 : 0) + (phasesDone.has("watch") ? 1 : 0);

  const goToSlide = (i: number) => {
    setSlide(i);
    setVisitedSlides(prev => new Set([...prev, i]));
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const nextSlide = () => {
    if (slide === 0) setConfidenceBefore(confSliderBefore);
    if (slide === SLIDES.length - 1) {
      markPhaseDone("elearn");
      setActivePhase("read");
    } else {
      goToSlide(slide + 1);
    }
  };

  const prevSlide = () => { if (slide > 0) goToSlide(slide - 1); };

  const copyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  /* ── Drag & Drop Helpers ── */
  const placeChip = (chipId: string, zoneId: string) => {
    setChipPlacements(prev => ({ ...prev, [chipId]: zoneId }));
    setSelectedDragChip(null);
  };
  const removeChip = (chipId: string) => {
    setChipPlacements(prev => { const n = { ...prev }; delete n[chipId]; return n; });
  };
  const allChipsPlaced = DRAG_CHIPS.every(c => chipPlacements[c.id]);
  const resetDrag = () => { setChipPlacements({}); setDragChecked(false); setSelectedDragChip(null); };

  /* ════════════════════════════════════════════════════════════
     SLIDE RENDERER
     ════════════════════════════════════════════════════════════ */
  const renderSlide = () => {
    const s = SLIDES[slide];
    switch (s.type) {

      /* ── TITLE ── */
      case "title": return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Eyebrow t="OXYGY AI UPSKILLING — LEVEL 1" />
          <h1 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1.2, margin: "0 0 6px" }}>
            <TU>Prompt Engineering</TU> Essentials
          </h1>
          <p style={{ fontSize: 13, color: C.light, fontFamily: F.b, margin: "0 0 10px" }}>{s.subheading}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {s.meta.map((m: string) => <span key={m} style={{ padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 11, color: C.body, fontWeight: 600, fontFamily: F.b }}>{m}</span>)}
          </div>
          <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.65, maxWidth: 560, margin: "0 0 0" }}>{s.body}</p>
          <div style={{ marginTop: "auto" }}>
            <div className="l1-cta-glow" style={{ background: C.tealLight, border: `1.5px solid ${C.mint}`, borderRadius: 12, padding: "16px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.b, margin: "0 0 14px" }}>Before we start — how confident do you feel about getting great outputs from AI tools?</p>
              <div style={{ position: "relative", margin: "0 0 6px" }}>
                <input type="range" min={1} max={10} value={confSliderBefore} onChange={e => setConfSliderBefore(Number(e.target.value))} className="l1-slider" style={{ width: "100%", margin: 0 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <span key={n} onClick={() => setConfSliderBefore(n)} style={{
                    fontSize: 11, fontWeight: confSliderBefore === n ? 700 : 400,
                    color: confSliderBefore === n ? C.teal : C.muted, fontFamily: F.b,
                    cursor: "pointer", width: 20, textAlign: "center",
                    transition: "all 150ms ease",
                  }}>{n}</span>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: F.b }}>Not confident</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.teal, fontFamily: F.h }}>{confSliderBefore}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>/10</span></span>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: F.b }}>Very confident</span>
              </div>
            </div>
          </div>
        </div>
      );

      /* ── CONCEPT ── */
      case "concept": {
        const renderVisual = () => {
          if (s.visualKey === "comparison") return (
            <div>
              {/* Mirror visual: vague input → vague output vs. specific input → specific output */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: C.errorLight, border: `1px solid ${C.errorBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>VAGUE INPUT</p>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>"Write me a stakeholder email"</p>
                  </div>
                  <div style={{ textAlign: "center", color: C.error, fontSize: 16, margin: "2px 0" }}>↓</div>
                  <div style={{ background: C.errorLight, border: `1px solid ${C.errorBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>VAGUE OUTPUT</p>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>"Dear Stakeholder, I am writing to provide an update on the project…"</p>
                    <p style={{ fontSize: 10, color: C.muted, fontFamily: F.b, margin: "6px 0 0", fontStyle: "italic" }}>Generic. No context. Unusable.</p>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>SPECIFIC INPUT</p>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>"Draft an email to the CFO updating her on ERP delays. Tone: direct. Include the revised timeline."</p>
                  </div>
                  <div style={{ textAlign: "center", color: C.success, fontSize: 16, margin: "2px 0" }}>↓</div>
                  <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>SPECIFIC OUTPUT</p>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>"Hi Sarah, Quick update on the ERP rollout: we’ve hit a 2-week delay on the data migration…"</p>
                    <p style={{ fontSize: 10, color: C.muted, fontFamily: F.b, margin: "6px 0 0", fontStyle: "italic" }}>Contextual. Actionable. Ready to send.</p>
                  </div>
                </div>
              </div>
            </div>
          );
          if (s.visualKey === "layers") return (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, margin: "0 0 10px", fontFamily: F.b }}>COURSE INDEX — CLICK TO JUMP</p>
              <div className="l1-layers-row" style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                {[
                  { bg: C.teal, label: "LAYER 1", subtitle: "IN YOUR PROMPT", desc: "What you write in the message box", slideRange: "Slides 5–7", items: "Role · Context · Task · Format · Chain of Thought", target: 4 },
                  { bg: "#5B6DC2", label: "LAYER 2", subtitle: "THROUGH DOCUMENTS", desc: "Files, transcripts, reports, and briefs you attach", slideRange: "Slides 8–9", items: "Meeting transcripts · Strategy docs · Previous outputs · Briefs", target: 7 },
                  { bg: C.navy, label: "LAYER 3", subtitle: "THROUGH ORGANISATION", desc: "Projects, system prompts, cross-chat memory", slideRange: "Slide 10", items: "System prompts · Shared projects · Persistent context", target: 9 },
                ].map((layer, i) => (
                  <div key={i} onClick={() => goToSlide(layer.target)} style={{
                    background: layer.bg, borderRadius: 10, padding: "14px 16px", color: "#fff",
                    flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const,
                    cursor: "pointer", transition: "transform 150ms ease, box-shadow 150ms ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" as const, opacity: 0.95, display: "block" }}>{layer.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, opacity: 0.7 }}>{layer.subtitle}</span>
                    </div>
                    <p style={{ fontSize: 12, margin: "0 0 6px", opacity: 0.9, lineHeight: 1.4 }}>{layer.desc}</p>
                    <p style={{ fontSize: 10, margin: "0 0 8px", opacity: 0.7, lineHeight: 1.4 }}>{layer.items}</p>
                    <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "3px 10px", alignSelf: "flex-start", marginTop: "auto" }}>{layer.slideRange}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 12, marginBottom: 0, fontFamily: F.b }}>You don’t need to master all three layers today. Click any layer to jump ahead, or continue in order.</p>
            </div>
          );
          if (s.visualKey === "documents") return (
            <div>
              <div className="l1-docs-row" style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                {[
                  { eye: "CONSULTING / ANY FUNCTION", doc: "Post-workshop transcript (Circleback, Otter.ai)", prompt: "Identify the three unresolved tensions from this workshop and suggest how to address each one in the next session.", without: "Generic facilitation advice", withDoc: "Specific points grounded in what was actually said", tools: ["Circleback", "Otter.ai"] },
                  { eye: "STRATEGY / LEADERSHIP", doc: "Company strategy deck or annual report (PDF)", prompt: "Based on this strategy document, identify the top 3 capability gaps that would prevent us from achieving the Year 3 targets.", without: "Theoretical gap analysis", withDoc: "Gaps mapped to the organisation’s own stated priorities", tools: ["NotebookLM"] },
                  { eye: "BD / COMMS / ANY WRITTEN OUTPUT", doc: "Last quarter’s proposal, report, or email thread", prompt: "Using this previous proposal as a style and structure reference, draft a new proposal for [new client]. Match the tone exactly.", without: "Generic proposal structure", withDoc: "Output that matches your team’s actual voice and standards", tools: ["Claude / ChatGPT"] },
                ].map((card, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" as const }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase" as const, margin: "0 0 6px", fontFamily: F.b }}>{card.eye}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.navy, margin: "0 0 8px", fontFamily: F.h, lineHeight: 1.4 }}>{card.doc}</p>
                    <PromptBox>{card.prompt}</PromptBox>
                    <div style={{ marginTop: 10, fontSize: 11, fontFamily: F.b, display: "flex", flexDirection: "column" as const, gap: 4 }}>
                      <div><span style={{ fontSize: 9, fontWeight: 700, color: C.error }}>WITHOUT: </span><span style={{ color: C.body }}>{card.without}</span></div>
                      <div><span style={{ fontSize: 9, fontWeight: 700, color: C.success }}>WITH: </span><span style={{ color: C.body }}>{card.withDoc}</span></div>
                    </div>
                    <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                      {card.tools.map(t => <span key={t} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: C.body, fontFamily: F.b }}>{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          if (s.visualKey === "project") return (
            <div style={{ border: `2px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ background: C.navy, padding: "10px 14px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F.h }}>PROJECT: Client Delivery Support</span>
              </div>
              <div style={{ padding: 14 }}>
                {[
                  { label: "SYSTEM PROMPT", content: "You are a senior Oxygy consultant supporting client delivery teams. Always be direct. Prioritise practical recommendations over theory…", note: "Defines who the AI is and how it behaves across every conversation in this project." },
                  { label: "FILES", content: null, files: ["📄 Oxygy_Methodology.pdf", "📄 Client_Brief_Q1.docx", "📄 Engagement_Tracker.xlsx"], note: "Documents always available — no re-uploading each session." },
                  { label: "CONVERSATIONS", content: null, files: ["◎ Workshop prep — Feb 12", "◎ Stakeholder mapping — Feb 14", "◎ Risk register review — Feb 18"], note: "Previous conversations are accessible. The AI builds understanding over time." },
                ].map((section, i) => (
                  <div key={i} style={{ borderBottom: i < 2 ? `1px dashed ${C.border}` : "none", paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, margin: "0 0 6px", fontFamily: F.b }}>{section.label}</p>
                    {section.content && <div style={{ background: C.bg, borderRadius: 6, padding: 8, fontSize: 12, color: C.body, fontFamily: F.b, marginBottom: 4 }}>{section.content}</div>}
                    {section.files && section.files.map(f => <p key={f} style={{ fontSize: 12, color: C.body, margin: "2px 0", fontFamily: F.b }}>{f}</p>)}
                    <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic", margin: "4px 0 0", fontFamily: F.b }}>{section.note}</p>
                  </div>
                ))}
              </div>
            </div>
          );
          return null;
        };
        const renderLevel2Preview = () => (
          <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, borderRadius: "0 10px 10px 0", padding: "14px 18px", marginTop: 16 }}>
            <span style={{ background: C.teal, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 10px", display: "inline-block", marginBottom: 8 }}>→ LEVEL 2 PREVIEW</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: F.h }}>Setting this up is a Level 2 skill</p>
            <p style={{ fontSize: 12, color: C.body, lineHeight: 1.6, margin: "0 0 6px", fontFamily: F.b }}>Designing a system prompt, structuring a project, and building shared context across your team is exactly what Level 2: Applied Capability covers.</p>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, fontFamily: F.b, cursor: "pointer" }}>Preview Level 2 →</span>
          </div>
        );
        const renderTextBlock = (maxW?: number) => (
          <div style={{ marginBottom: s.visualKey === "project" ? 0 : 16 }}>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord)}
            {s.body.split("\n\n").map((p: string, i: number) => <p key={i} style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 12px", ...(maxW ? { maxWidth: maxW } : {}) }}>{p}</p>)}
            {s.pullQuote && (
              <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, padding: "12px 16px", borderRadius: "0 8px 8px 0", marginTop: 12, ...(maxW ? { maxWidth: maxW } : {}) }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{s.pullQuote}</p>
              </div>
            )}
          </div>
        );

        /* Two-column with Level 2 Preview in left column for project */
        if (s.visualKey === "project") {
          return (
            <div className="l1-two-col" style={{ display: "flex", gap: 24 }}>
              <div style={{ width: "55%", minWidth: 0 }}>
                {renderTextBlock()}
                {renderLevel2Preview()}
              </div>
              <div style={{ width: "45%", minWidth: 0 }}>{renderVisual()}</div>
            </div>
          );
        }

        /* Full-width stacked layout (comparison, layers, documents) */
        return (
          <div>
            {renderTextBlock(640)}
            {renderVisual()}
          </div>
        );
      }

      /* ── SPECTRUM ── */
      case "spectrum": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord, 20)}
          <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{s.body}</p>
          {/* Toggle selector */}
          <div className="l1-cta-glow" style={{ display: "inline-flex", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 30, padding: 3, marginBottom: 14 }}>
            {s.positions.map((p: any, i: number) => (
              <button key={i} onClick={() => setSpectrumPos(i)} style={{
                background: spectrumPos === i ? C.teal : "transparent",
                color: spectrumPos === i ? "#fff" : C.muted,
                border: "none", borderRadius: 24, padding: "7px 18px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: F.b, transition: "all 200ms ease", whiteSpace: "nowrap",
              }}>{p.label}</button>
            ))}
          </div>
          {/* Active panel */}
          <div style={{ background: C.bg, borderLeft: `3px solid ${C.teal}`, borderRadius: "0 8px 8px 0", padding: "12px 18px", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 3px", fontFamily: F.h }}>{s.positions[spectrumPos].label}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 6px", fontFamily: F.b }}>{s.positions[spectrumPos].desc}</p>
            <PromptBox>{s.positions[spectrumPos].example}</PromptBox>
          </div>
          {/* Pivot panel */}
          <div style={{ borderLeft: `4px solid ${C.navy}`, background: C.bg, borderRadius: "0 8px 8px 0", padding: "12px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 2, margin: "0 0 3px", fontFamily: F.b }}>BUT HERE&apos;S THE LIMIT</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 4px", fontFamily: F.h }}>Prompting alone has a ceiling</p>
            <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: "0 0 4px", fontFamily: F.b }}>All three approaches share the same constraint: the AI only knows what you type. If your project has 40 pages of background documents, a team methodology, or weeks of shared context — none of that exists inside a single prompt, no matter how well-crafted.</p>
            <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: 0, fontFamily: F.b }}>That&apos;s where context engineering comes in.</p>
          </div>
        </div>
      );

      /* ── RCTF ── */
      case "rctf": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord)}
          <p style={{ fontSize: 14, color: C.light, fontFamily: F.b, margin: "0 0 16px" }}>{s.subheading}</p>
          <div className="l1-rctf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {s.elements.map((el: any) => (
              <div key={el.key} style={{ background: el.light, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <span style={{ display: "inline-block", background: el.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 8 }}>{el.key}</span>
                <p style={{ fontSize: 12, color: C.body, margin: "0 0 8px", fontFamily: F.b }}>{el.desc}</p>
                <PromptBox borderColor={el.color}>{el.example}</PromptBox>
              </div>
            ))}
          </div>
          {/* Assembled prompt */}
          <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.bg, borderRadius: "0 8px 8px 0", padding: "14px 20px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, margin: "0 0 8px", fontFamily: F.b }}>WHAT IT LOOKS LIKE ASSEMBLED</p>
            {s.elements.map((el: any) => (
              <p key={el.key} style={{ fontSize: 13, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 8px", color: C.navyMid }}>
                <span style={{ display: "inline-flex", background: el.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px", marginRight: 6, verticalAlign: "middle" }}>{el.key}</span>
                {el.example}
              </p>
            ))}
          </div>
        </div>
      );

      /* ── DRAG & DROP ── */
      case "dragdrop": {
        const chipsInPool = DRAG_CHIPS.filter(c => !chipPlacements[c.id]);
        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord)}
            <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 12px" }}>{s.instruction}</p>
            {/* Scenario */}
            <div style={{ background: C.navy, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#fff", fontFamily: F.b, lineHeight: 1.6, margin: 0 }}>{s.scenario}</p>
            </div>
            {/* Chip pool */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, minHeight: 40 }}>
              {chipsInPool.map(chip => (
                <div key={chip.id} draggable onDragStart={(e) => e.dataTransfer.setData("chipId", chip.id)}
                  onClick={() => setSelectedDragChip(selectedDragChip === chip.id ? null : chip.id)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: F.b, color: C.navyMid,
                    background: selectedDragChip === chip.id ? C.tealLight : "#fff",
                    border: `1px solid ${selectedDragChip === chip.id ? C.teal : C.border}`,
                    cursor: "grab", fontWeight: 500, maxWidth: "100%", wordBreak: "break-word" as const,
                  }}>{chip.text}</div>
              ))}
            </div>
            {/* Drop zones */}
            <div className="l1-drag-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {DROP_ZONES.map(zone => {
                const zoneChips = DRAG_CHIPS.filter(c => chipPlacements[c.id] === zone.id);
                const hasError = dragChecked && zoneChips.some(c => c.correctZone !== zone.id);
                const allCorrect = dragChecked && zoneChips.length > 0 && zoneChips.every(c => c.correctZone === zone.id && !c.isDistractor);
                return (
                  <div key={zone.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const chipId = e.dataTransfer.getData("chipId"); if (chipId) placeChip(chipId, zone.id); }}
                    onClick={() => { if (selectedDragChip) placeChip(selectedDragChip, zone.id); }}
                    style={{
                      background: zone.light, borderRadius: 10, padding: "14px 16px", minHeight: 80,
                      border: dragChecked ? (hasError ? `2px solid ${C.error}` : allCorrect ? `2px solid ${C.success}` : `1px solid ${zone.color}`) : `1px solid ${zone.color}`,
                    }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, textTransform: "uppercase" as const, letterSpacing: 1, fontFamily: F.b }}>{zone.label}</span>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {zoneChips.map(chip => {
                        const isCorrect = chip.correctZone === zone.id && !chip.isDistractor;
                        const showDistractor = dragChecked && chip.isDistractor && chip.correctZone === zone.id;
                        return (
                          <div key={chip.id} onClick={(e) => { e.stopPropagation(); if (!dragChecked) removeChip(chip.id); }}
                            style={{
                              padding: "6px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.b, color: C.navyMid,
                              background: dragChecked ? (isCorrect ? C.successLight : C.errorLight) : "#fff",
                              border: `1px solid ${dragChecked ? (isCorrect ? C.successBorder : C.errorBorder) : C.border}`,
                              cursor: dragChecked ? "default" : "pointer",
                            }}>
                            {chip.text}
                            {dragChecked && !isCorrect && !showDistractor && <span style={{ display: "block", fontSize: 10, color: C.error, marginTop: 2 }}>→ Belongs in {chip.correctZone}</span>}
                            {showDistractor && <span style={{ display: "block", fontSize: 10, color: C.error, marginTop: 2 }}>{(chip as any).feedback}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Btn onClick={() => setDragChecked(true)} disabled={!allChipsPlaced || dragChecked}>Check Answers</Btn>
              <Btn onClick={resetDrag} secondary>Start again ↺</Btn>
            </div>
            {dragChecked && allChipsPlaced && DRAG_CHIPS.filter(c => chipPlacements[c.id] !== c.correctZone || c.isDistractor).length === 0 && (
              <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, margin: 0, lineHeight: 1.6 }}>Well built. Notice how each element is doing a specific job. The assembled prompt is dramatically more powerful than &apos;create an onboarding plan for graduates&apos; — which is what most people actually send.</p>
              </div>
            )}
          </div>
        );
      }

      /* ── FLIPCARD ── */
      case "flipcard": {
        const isSlide7 = s.id === 7;
        const cards = isSlide7 ? TECHNIQUE_CARDS : DOC_FLIP_CARDS;
        const allFlipped = cards.every((_: any, i: number) => flippedCards[`${s.id}-${i}`]);
        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord)}
            {s.bodyAboveCards && <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 16px" }}>{s.bodyAboveCards}</p>}
            {s.instruction && <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 16px" }}>{s.instruction}</p>}
            <div className="l1-flip-row" style={{ display: "flex", gap: 16 }}>
              {cards.map((card: any, i: number) => {
                const key = `${s.id}-${i}`;
                const isFlipped = flippedCards[key];
                return (
                  <div key={i} className="l1-flip-card" style={{ width: "50%", minHeight: isSlide7 ? 340 : 360 }} onClick={() => setFlippedCards(prev => ({ ...prev, [key]: !prev[key] }))}>
                    <div className={`l1-flip-inner ${isFlipped ? "flipped" : ""}`} style={{ height: "100%" }}>
                      {/* Front */}
                      <div className="l1-flip-front" style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", height: "100%", boxSizing: "border-box" as const }}>
                        {isSlide7 ? (
                          <>
                            <span style={{ display: "inline-block", background: C.tealLight, color: C.teal, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 8 }}>TECHNIQUE</span>
                            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: F.h }}>{card.frontLabel}</p>
                            <p style={{ fontSize: 12, color: C.light, margin: "0 0 10px", fontFamily: F.b }}>{card.frontOneLiner}</p>
                            <PromptBox>{card.frontExcerpt}</PromptBox>
                          </>
                        ) : (
                          <>
                            <span style={{ display: "inline-block", background: card.badgeStyle === "error" ? C.errorLight : C.successLight, color: card.badgeStyle === "error" ? C.error : C.success, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 8, border: `1px solid ${card.badgeStyle === "error" ? C.errorBorder : C.successBorder}` }}>{card.frontBadge}</span>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: "0 0 6px", fontFamily: F.h }}>{card.frontLabel}</p>
                            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 0", fontFamily: F.b }}>{card.frontNote}</p>
                          </>
                        )}
                        <p style={{ fontSize: 11, color: C.muted, margin: "auto 0 0", paddingTop: 8, fontFamily: F.b }}>Click to flip ↺</p>
                      </div>
                      {/* Back */}
                      <div className="l1-flip-back" style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", height: "100%", boxSizing: "border-box" as const, overflowY: "auto" as const }}>
                        {isSlide7 ? (
                          <>
                            <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, margin: "0 0 4px", fontFamily: F.b }}>WHEN TO USE</p>
                            <p style={{ fontSize: 12, color: C.body, margin: "0 0 10px", fontFamily: F.b, lineHeight: 1.5 }}>{card.backWhen}</p>
                            <PromptBox>{card.backExample}</PromptBox>
                            <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, margin: "10px 0 4px", fontFamily: F.b }}>WHY IT WORKS</p>
                            <p style={{ fontSize: 12, color: C.body, margin: 0, fontFamily: F.b, lineHeight: 1.5 }}>{card.backWhy}</p>
                          </>
                        ) : (
                          <>
                            <span style={{ display: "inline-block", background: card.badgeStyle === "error" ? C.bg : C.successLight, color: card.badgeStyle === "error" ? C.muted : C.success, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 8 }}>{card.backBadge}</span>
                            <div style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 10 }}>{card.backResponse}</div>
                            <div style={{ background: card.insightBg, border: `1px solid ${card.insightBorder}`, borderRadius: 8, padding: "8px 12px" }}>
                              <p style={{ fontSize: 12, color: C.navyMid, fontFamily: F.b, margin: 0, fontWeight: 600 }}>{card.backInsight}</p>
                            </div>
                          </>
                        )}
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 8, fontFamily: F.b }}>Click to flip back ↺</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {allFlipped && (
              <div style={{ background: C.tealLight, border: `1px solid ${C.mint}`, borderRadius: 10, padding: "14px 16px", marginTop: 16 }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, margin: 0, lineHeight: 1.6 }}>
                  {isSlide7
                    ? "These techniques stack — they don’t replace each other. A Few-Shot prompt can also be RCTF-structured. Chain of Thought works even better when you’ve defined the Role and Context first. Think of them as additions to your toolkit, not alternatives."
                    : "The prompt didn’t change. The effort didn’t change. What changed was the context available to the AI — and the output quality changed completely as a result. More context, better output. Every time."
                  }
                </p>
              </div>
            )}
          </div>
        );
      }

      /* ── BRANCHING ── */
      case "branching": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord)}
          <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 12px" }}>{s.bodyAboveScenario}</p>
          {/* Scenario box */}
          {s.scenario && typeof s.scenario === "object" && <div style={{ background: C.navy, borderRadius: 10, padding: "14px 20px", marginBottom: 16, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13, fontFamily: F.b, color: "#fff" }}>
            {Object.entries(s.scenario).map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: C.mint, fontWeight: 700, textTransform: "capitalize" as const }}>{k.replace(/([A-Z])/g, " $1").trim()}:</span>
                <span>{v as string}</span>
              </React.Fragment>
            ))}
          </div>}
          {/* Options */}
          {!scenarioConfirmed && (
            <div className="l1-branch-opts" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {BRANCH_OPTS.map((opt, i) => (
                <div key={i} onClick={() => setScenarioChoice(i)} style={{
                  flex: 1, background: "#fff", border: scenarioChoice === i ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 200ms ease",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>{opt.cardLabel}</p>
                  <p style={{ fontSize: 12, color: C.body, margin: "0 0 8px", fontFamily: F.b, lineHeight: 1.5 }}>{opt.whatYouDo}</p>
                  <PromptBox>{opt.promptPreview}</PromptBox>
                </div>
              ))}
            </div>
          )}
          {scenarioChoice !== null && !scenarioConfirmed && (
            <div style={{ textAlign: "right" }}>
              <Btn onClick={() => setScenarioConfirmed(true)}>Confirm this approach →</Btn>
            </div>
          )}
          {/* Consequence */}
          {scenarioConfirmed && scenarioChoice !== null && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
              <span style={{ display: "inline-block", background: BRANCH_OPTS[scenarioChoice].qualityColor, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>{BRANCH_OPTS[scenarioChoice].qualityBadge}</span>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{BRANCH_OPTS[scenarioChoice].outputSnippet}</p>
              </div>
              <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 8px" }}>{BRANCH_OPTS[scenarioChoice].reflection}</p>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: F.b, margin: 0 }}>{BRANCH_OPTS[scenarioChoice].tradingOff}</p>
            </div>
          )}
          {scenarioConfirmed && (
            <>
              <Btn onClick={() => { setScenarioChoice(null); setScenarioConfirmed(false); }} secondary>Try a different approach</Btn>
              <div style={{ background: C.tealLight, border: `1px solid ${C.mint}`, borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, margin: 0, lineHeight: 1.6 }}>All three approaches produced something useful. The difference isn&apos;t right vs. wrong — it&apos;s depth of context vs. speed. As your practice matures, you’ll move naturally up the layers. Most people start at A, build habits around B, and eventually live in C.</p>
              </div>
            </>
          )}
        </div>
      );

      /* ── QUIZ ── */
      case "quiz": return (
        <div>
          <Eyebrow t="PRACTICE — QUESTION 1 OF 1" />
          {renderH2(s.heading, "")}
          <p style={{ fontSize: 18, color: C.navy, fontFamily: F.h, lineHeight: 1.5, maxWidth: 560, margin: "0 0 20px" }}>{s.question}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {s.options.map((opt: string, i: number) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === s.correct;
              let bg = "#fff", border = `1px solid ${C.border}`;
              if (answered) {
                if (isCorrect) { bg = C.successLight; border = `2px solid ${C.success}`; }
                else if (isSelected && !isCorrect) { bg = C.errorLight; border = `2px solid ${C.error}`; }
              } else if (isSelected) { bg = C.tealLight; border = `2px solid ${C.teal}`; }
              return (
                <div key={i} onClick={() => { if (!answered) setSelectedAnswer(i); }}
                  style={{ background: bg, border, borderRadius: 10, padding: "14px 16px", cursor: answered ? "default" : "pointer", transition: "all 200ms ease", minHeight: 44, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.5 }}>{opt}</span>
                </div>
              );
            })}
          </div>
          {selectedAnswer !== null && !answered && (
            <div style={{ marginTop: 12, textAlign: "right" }}><Btn onClick={() => setAnswered(true)}>Check Answer</Btn></div>
          )}
          {answered && (
            <div style={{ background: selectedAnswer === s.correct ? C.successLight : C.errorLight, border: `1px solid ${selectedAnswer === s.correct ? C.successBorder : C.errorBorder}`, borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: selectedAnswer === s.correct ? C.success : C.error, margin: "0 0 6px", fontFamily: F.b }}>{selectedAnswer === s.correct ? "Correct" : "Not quite"}</p>
              <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 8px" }}>{s.explanations[selectedAnswer!]}</p>
              <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>The pattern is consistent: when you have a document, attach it. Your prompt can then be shorter and more precise — because the document is doing the heavy lifting on context.</p>
            </div>
          )}
        </div>
      );

      /* ── TEMPLATES ── */
      case "templates": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord)}
          <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 16px" }}>{s.body}</p>
          {TEMPLATES.map(tmpl => (
            <div key={tmpl.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ background: C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.h }}>{tmpl.name}</span>
                  <span style={{ background: tmpl.tagColor, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 10px" }}>{tmpl.tag}</span>
                </div>
                <button onClick={() => copyTemplate(tmpl.id, tmpl.prompt)} style={{
                  background: "none", border: `1px solid ${C.teal}`, borderRadius: 20, padding: "4px 14px",
                  fontSize: 12, fontWeight: 600, color: C.teal, cursor: "pointer", fontFamily: F.b, minHeight: 32,
                }}>{copiedTemplate === tmpl.id ? "Copied ✓" : "Copy"}</button>
              </div>
              <div style={{ padding: 16 }}>
                <PromptBox>{tmpl.prompt}</PromptBox>
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, margin: "0 0 4px", fontFamily: F.b }}>WHAT TO ATTACH</p>
                  <div style={{ background: C.tealLight, borderLeft: `3px solid ${C.teal}`, borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
                    <p style={{ fontSize: 13, color: C.body, margin: 0, fontFamily: F.b }}>{tmpl.whatToAttach}</p>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, margin: "0 0 4px", fontFamily: F.b }}>PRO TIP</p>
                  <p style={{ fontSize: 12, color: C.body, fontStyle: "italic", margin: 0, fontFamily: F.b }}>{tmpl.proTip}</p>
                </div>
              </div>
            </div>
          ))}
          {/* Confidence delta */}
          <div style={{ background: C.tealLight, border: `1px solid ${C.mint}`, borderRadius: 12, padding: "20px 24px", marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.h, margin: "0 0 8px" }}>One last question before you go</h3>
            {confidenceBefore !== null && <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, margin: "0 0 12px" }}>At the start of this module, you rated your confidence at <strong style={{ color: C.teal }}>{confidenceBefore}</strong> out of 10.</p>}
            {!confidenceSubmitted ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.b, margin: "0 0 8px" }}>How confident do you feel now?</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: F.b }}>1</span>
                  <input type="range" min={1} max={10} value={confSliderAfter} onChange={e => setConfSliderAfter(Number(e.target.value))} className="l1-slider" style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: F.b }}>10</span>
                </div>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.teal, fontFamily: F.h }}>{confSliderAfter}</span><span style={{ fontSize: 11, color: C.muted }}> / 10</span>
                </div>
                <Btn onClick={() => { setConfidenceAfter(confSliderAfter); setConfidenceSubmitted(true); }}>Save my rating</Btn>
              </>
            ) : (
              <div style={{
                background: confidenceAfter! > (confidenceBefore || 0) ? C.successLight : confidenceAfter === confidenceBefore ? C.bg : C.tealLight,
                border: `1px solid ${confidenceAfter! > (confidenceBefore || 0) ? C.successBorder : confidenceAfter === confidenceBefore ? C.border : C.mint}`,
                borderRadius: 10, padding: "14px 16px", marginTop: 8,
              }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, margin: 0, lineHeight: 1.6 }}>
                  {confidenceBefore !== null && confidenceAfter !== null ? (
                    confidenceAfter > confidenceBefore
                      ? `↑ +${confidenceAfter - confidenceBefore} points — A meaningful shift. Lock it in: use one of these templates on a real piece of work today.`
                      : confidenceAfter === confidenceBefore
                      ? `Your rating stayed at ${confidenceAfter}. Confidence comes from practice, not learning. Pick one template and use it today. Come back and re-rate after.`
                      : `Your rating went down — that’s a healthy sign. You now know more about what you don’t know yet. That’s the foundation of genuine skill development. Level 2 will fill the gaps.`
                  ) : "Rating saved. Use one of these templates on a real piece of work today."}
                </p>
              </div>
            )}
          </div>
        </div>
      );

      default: return <p>Unknown slide type</p>;
    }
  };

  /* ════════════════════════════════════════════════════════════
     READ PHASE
     ════════════════════════════════════════════════════════════ */
  const renderReadPhase = () => (
    <div>
      <PhaseLabel label="Phase 2: Read" time="~15 min" done={phasesDone.has("read")} />
      <div className="l1-article-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {ARTICLES.map((article, idx) => {
          const st = articleState[article.id] || { clicked: false, reflectionText: "", submitted: false };
          return (
            <div key={article.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: st.submitted ? C.successLight : C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", fontFamily: F.b }}>Article {idx + 1} · {article.readTime} · {article.source}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: st.submitted ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: st.submitted ? "line-through" : "none" }}>{article.title}</p>
                </div>
                {st.submitted && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>✓</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{article.desc}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 24, border: `1px solid ${C.teal}`, color: C.teal, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>
                  Read article ↗
                </a>
                {st.clicked && !st.submitted && (
                  <div style={{ marginTop: 16, borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, margin: "0 0 6px", fontFamily: F.b }}>REFLECTION</p>
                    <p style={{ fontSize: 13, color: C.navyMid, margin: "0 0 8px", fontFamily: F.b }}>{article.reflection}</p>
                    <textarea value={st.reflectionText}
                      onChange={e => setArticleState(prev => ({ ...prev, [article.id]: { ...st, reflectionText: e.target.value } }))}
                      style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: F.b, resize: "vertical", boxSizing: "border-box" as const }}
                      placeholder="Write your reflection here..." />
                    <div style={{ marginTop: 8, textAlign: "right" }}>
                      <Btn onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, submitted: true } }))} disabled={!st.reflectionText.trim()}>Submit reflection →</Btn>
                    </div>
                  </div>
                )}
                {st.submitted && (
                  <div style={{ marginTop: 12, background: C.successLight, borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Reflection submitted ✓</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {readDone && (
        <div style={{ textAlign: "right" }}>
          <Btn onClick={() => { markPhaseDone("read"); setActivePhase("watch"); }}>Continue to Watch →</Btn>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     WATCH PHASE
     ════════════════════════════════════════════════════════════ */
  const renderWatchPhase = () => (
    <div>
      <PhaseLabel label="Phase 3: Watch" time="~12 min" done={phasesDone.has("watch")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        {VIDEOS.map((video, idx) => {
          const st = videoState[video.id] || { clicked: false, quizAnswers: [null, null], quizChecked: [false, false] };
          const videoComplete = st.clicked && st.quizChecked.every(Boolean);
          return (
            <div key={video.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: videoComplete ? C.successLight : C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, height: 52, background: C.navy, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: C.teal, fontSize: 20 }}>▶</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px", fontFamily: F.b }}>Video {idx + 1} · {video.duration} · {video.channel}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: videoComplete ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: videoComplete ? "line-through" : "none" }}>{video.title}</p>
                </div>
                {videoComplete && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>✓</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{video.desc}</p>
                <a href={video.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setVideoState(prev => ({ ...prev, [video.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 24, background: C.teal, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b, minHeight: 44 }}>
                  ▶ Watch video
                </a>
                {/* Knowledge check */}
                {st.clicked && (
                  <div style={{ marginTop: 16, borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, margin: "0 0 12px", fontFamily: F.b }}>KNOWLEDGE CHECK</p>
                    {video.quiz.map((q: any, qi: number) => (
                      <div key={qi} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: "0 0 10px", fontFamily: F.b }}>Q{qi + 1}: {q.q}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {q.options.map((opt: string, oi: number) => {
                            const isSelected = st.quizAnswers[qi] === oi;
                            const checked = st.quizChecked[qi];
                            const isCorrect = oi === q.correct;
                            let bg = "#fff", border = `1px solid ${C.border}`;
                            if (checked) {
                              if (isCorrect) { bg = C.successLight; border = `2px solid ${C.success}`; }
                              else if (isSelected) { bg = C.errorLight; border = `2px solid ${C.error}`; }
                            } else if (isSelected) { bg = C.tealLight; border = `2px solid ${C.teal}`; }
                            return (
                              <div key={oi} onClick={() => {
                                if (checked) return;
                                setVideoState(prev => {
                                  const s = prev[video.id] || { clicked: true, quizAnswers: [null, null], quizChecked: [false, false] };
                                  const ans = [...s.quizAnswers]; ans[qi] = oi;
                                  return { ...prev, [video.id]: { ...s, quizAnswers: ans } };
                                });
                              }}
                              style={{ background: bg, border, borderRadius: 8, padding: "10px 14px", cursor: checked ? "default" : "pointer", fontSize: 12, fontFamily: F.b, color: C.body, transition: "all 200ms ease", minHeight: 44, display: "flex", alignItems: "center" }}>
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                        {st.quizAnswers[qi] !== null && !st.quizChecked[qi] && (
                          <div style={{ marginTop: 8, textAlign: "right" }}>
                            <Btn onClick={() => {
                              setVideoState(prev => {
                                const s = prev[video.id] || { clicked: true, quizAnswers: [null, null], quizChecked: [false, false] };
                                const chk = [...s.quizChecked]; chk[qi] = true;
                                return { ...prev, [video.id]: { ...s, quizChecked: chk } };
                              });
                            }}>Check answer</Btn>
                          </div>
                        )}
                        {st.quizChecked[qi] && (
                          <div style={{ marginTop: 8, background: st.quizAnswers[qi] === q.correct ? C.successLight : C.errorLight, borderRadius: 6, padding: "6px 10px" }}>
                            <p style={{ fontSize: 12, color: st.quizAnswers[qi] === q.correct ? C.success : C.error, fontWeight: 600, margin: 0, fontFamily: F.b }}>{st.quizAnswers[qi] === q.correct ? "Correct!" : `Incorrect — the answer is: ${q.options[q.correct]}`}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Completion CTA */}
      {watchDone && (
        <div style={{ background: C.navy, borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" as const }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.mint, letterSpacing: 2, margin: "0 0 4px", fontFamily: F.b, textTransform: "uppercase" as const }}>LEARNING JOURNEY COMPLETE</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: F.h }}>Ready to put it into practice</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, fontFamily: F.b }}>Apply your context engineering skills in the Prompt Playground.</p>
          </div>
          <Btn onClick={() => { markPhaseDone("watch"); setActivePhase("practice"); }}>Go to Prompt Playground →</Btn>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     HANDOFF CTA (Practice Phase)
     ════════════════════════════════════════════════════════════ */
  const renderHandoff = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: "center", maxWidth: 500 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealLight, border: `2px solid ${C.mint}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: C.teal }}>◈</div>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, margin: "0 0 8px", fontFamily: F.b, textTransform: "uppercase" as const }}>NEXT STEP</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: F.h, margin: "0 0 8px" }}>Prompt Playground</h2>
        <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 20px" }}>Apply your context engineering skills to a structured real-work challenge. Build prompts, attach context, and get feedback — then save your best work to your personal prompt library.</p>
        <a href="#playground" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 28px", borderRadius: 24, background: C.teal, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>Open Prompt Playground →</a>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     JOURNEY STRIP
     ════════════════════════════════════════════════════════════ */
  const renderJourneyStrip = () => (
    <div className="l1-journey-strip" style={{ marginTop: 32, marginBottom: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12, fontFamily: F.b }}>LEARNING JOURNEY — LEVEL 1</p>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {PHASES.map((phase, i) => {
          const isActive = activePhase === phase.id;
          const isDone = phasesDone.has(phase.id);
          const isExternal = (phase as any).external;
          const prevDone = i === 0 ? true : phasesDone.has(PHASES[i - 1].id);
          return (
            <React.Fragment key={phase.id}>
              {i > 0 && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
                  <div style={{ height: 1, width: 16, background: prevDone ? C.teal : C.border }} />
                  <span style={{ fontSize: 12, color: prevDone ? C.teal : C.muted }}>›</span>
                </div>
              )}
              <div onClick={() => {
                if (!isExternal && (isDone || isActive || prevDone)) setActivePhase(phase.id);
              }}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 10, position: "relative" as const,
                  border: isActive ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                  background: isActive ? C.tealLight : isDone ? C.successLight : "#FAFAFA",
                  cursor: isExternal ? "default" : "pointer", transition: "all 200ms ease",
                }}>
                {isDone && (
                  <div style={{ position: "absolute" as const, top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.success, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{phase.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? C.light : C.navy, fontFamily: F.h, textDecoration: isDone ? "line-through" : "none" }}>{phase.label}</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px", fontFamily: F.b }}>{phase.time}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: F.b }}>{phase.desc}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     PAGE HERO
     ════════════════════════════════════════════════════════════ */
  const renderHero = () => (
    <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "24px 0 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", fontFamily: F.b }}>
          <a href="#course-resources" style={{ color: C.muted, textDecoration: "none" }}>Course Resources</a> <span style={{ margin: "0 4px" }}>›</span>
          <span>Level 1</span> <span style={{ margin: "0 4px" }}>›</span>
          <span style={{ color: C.body }}>Prompt Engineering</span>
        </p>
        <div className="l1-hero-cols" style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <span style={{ display: "inline-block", background: C.mint, color: C.tealDark, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 8, fontFamily: F.b, textTransform: "uppercase" as const }}>LEVEL 1</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 8px", fontFamily: F.b }}>FOUNDATIONS & AWARENESS</p>
            <h1 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1.2, margin: "0 0 12px" }}>
              Context & <TU>Prompt Engineering</TU>
            </h1>
            <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, maxWidth: 600, margin: "0 0 16px" }}>
              Learn how to get dramatically better AI outputs — not by using a different tool, but by changing how you communicate with it. This module covers the full context engineering toolkit: from what you write in your prompt, to the documents you attach, to how you organise your work for consistent, high-quality AI performance.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["~45 min total", "3 activities", "Beginner friendly", "Pharma & Consulting"].map(tag => (
                <span key={tag} style={{ padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.body, fontWeight: 600, fontFamily: F.b }}>{tag}</span>
              ))}
            </div>
          </div>
          {/* Right: Progress */}
          <div className="l1-hero-progress" style={{ minWidth: 200, textAlign: "center", padding: "20px 24px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 8px", fontFamily: F.b }}>Journey Progress</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: C.navy, fontFamily: F.h, margin: "0 0 2px" }}>{completedPhases} <span style={{ fontSize: 18, color: C.muted }}>/ 3</span></p>
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", fontFamily: F.b }}>phases completed</p>
            <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: C.teal, width: `${(completedPhases / 3) * 100}%`, transition: "width 400ms ease" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════════════════════ */
  const s = SLIDES[slide];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 68 }}>
      <FontStyle />
      {renderHero()}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 0" }}>

        {/* ── E-LEARNING PHASE ── */}
        {activePhase === "elearn" && (
          <>
            <PhaseLabel label="Phase 1: E-Learning" time="~20 min" done={phasesDone.has("elearn")} />
            {/* Player card */}
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}>
              {/* Top bar */}
              <div style={{ background: C.navy, height: 44, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: F.b }}>{s.section}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {SLIDES.map((_: any, i: number) => (
                    <div key={i} onClick={() => goToSlide(i)} style={{
                      width: i === slide ? 22 : 8, height: 8, borderRadius: 4, cursor: "pointer",
                      background: i === slide ? C.teal : visitedSlides.has(i) ? "#4A5568" : "#2D3748",
                      transition: "all 250ms ease",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: F.b }}>{slide + 1} / {SLIDES.length}</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, background: C.border }}>
                <div style={{ height: "100%", background: C.teal, width: `${((slide + 1) / SLIDES.length) * 100}%`, transition: "width 300ms ease" }} />
              </div>
              {/* Content area */}
              <div className="l1-player-content" style={{ height: 620, overflowY: "auto" as const, padding: "36px 48px" }}>
                {renderSlide()}
              </div>
              {/* Nav bar */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                <Btn onClick={prevSlide} disabled={slide === 0} secondary>← Previous</Btn>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: F.b }}>{s.section}</span>
                <Btn onClick={nextSlide}>{slide === SLIDES.length - 1 ? "Finish E-Learning →" : "Next →"}</Btn>
              </div>
            </div>
          </>
        )}

        {/* ── READ PHASE ── */}
        {activePhase === "read" && renderReadPhase()}

        {/* ── WATCH PHASE ── */}
        {activePhase === "watch" && renderWatchPhase()}

        {/* ── PRACTICE PHASE ── */}
        {activePhase === "practice" && renderHandoff()}

        {/* ── JOURNEY STRIP ── */}
        {renderJourneyStrip()}
      </div>
    </div>
  );
}
