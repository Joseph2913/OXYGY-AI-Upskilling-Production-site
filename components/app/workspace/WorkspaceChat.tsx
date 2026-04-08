import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowRight, ChevronLeft, Loader2, FolderOpen } from 'lucide-react';
import { TOOL_ICON_MAP } from './ToolIcons';
import { ALL_TOOLS, PRIMARY_TOOL_IDS } from '../../../data/toolkitData';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
  LEVEL_SHORT_NAMES,
  LEVEL_FULL_NAMES,
} from '../../../data/levelTopics';
import type { PathwayLevelResult } from '../../../types';

/* ══════════════════════════════════════════════════════════════
   Hardcoded follow-up questions per tool (for the 6 template prompts)
   ══════════════════════════════════════════════════════════════ */

interface ToolQuestions {
  toolId: string;
  toolName: string;
  toolRoute: string;
  greeting: string;
  questions: { question: string; placeholder: string }[];
}

const TOOL_QUESTIONS: Record<string, ToolQuestions> = {
  'prompt-playground': {
    toolId: 'prompt-playground',
    toolName: 'Prompt Playground',
    toolRoute: '/app/toolkit/prompt-playground',
    greeting: "Great – let's craft a prompt together. I just need a few details.",
    questions: [
      { question: 'What specific task do you need this prompt for?', placeholder: 'e.g., Summarise meeting notes into action items, draft a client proposal...' },
      { question: 'Who is the audience for this output?', placeholder: 'e.g., My leadership team, external clients, my direct reports...' },
      { question: 'What format should the output be in?', placeholder: 'e.g., Bullet points, a formal email, a one-page summary, a table...' },
    ],
  },
  'agent-builder': {
    toolId: 'agent-builder',
    toolName: 'Agent Builder',
    toolRoute: '/app/toolkit/agent-builder',
    greeting: "Let's design your AI agent. A few questions to get the brief right.",
    questions: [
      { question: 'What process or task should this agent handle?', placeholder: 'e.g., Answering onboarding FAQs, triaging support tickets...' },
      { question: 'What data or inputs will the agent receive?', placeholder: 'e.g., Emails, form responses, spreadsheet data, chat messages...' },
      { question: 'Who will use this agent and how often?', placeholder: 'e.g., The HR team, daily; project managers, weekly for reporting...' },
    ],
  },
  'workflow-canvas': {
    toolId: 'workflow-canvas',
    toolName: 'Workflow Canvas',
    toolRoute: '/app/toolkit/workflow-canvas',
    greeting: "Let's map out your workflow. I need to understand the process first.",
    questions: [
      { question: 'What end-to-end process do you want to automate?', placeholder: 'e.g., Client onboarding from initial contact to kickoff...' },
      { question: 'What tools and systems are involved?', placeholder: 'e.g., Email, Slack, Google Sheets, CRM (HubSpot), Asana...' },
      { question: 'Where should a human review or approve before the workflow continues?', placeholder: 'e.g., Before sending to client, after AI generates the summary...' },
    ],
  },
  'dashboard-designer': {
    toolId: 'dashboard-designer',
    toolName: 'App Designer',
    toolRoute: '/app/toolkit/dashboard-designer',
    greeting: "Let's scope your app. A few questions to define the brief.",
    questions: [
      { question: 'What problem does this app solve and for whom?', placeholder: 'e.g., Helps project managers track team utilisation...' },
      { question: 'What are the 3-5 key features or screens it needs?', placeholder: 'e.g., Dashboard with KPI cards, user profiles, notification centre...' },
      { question: 'What data sources will it use?', placeholder: 'e.g., Supabase database, REST API, Google Sheets, manual user input...' },
    ],
  },
  'ai-app-evaluator': {
    toolId: 'ai-app-evaluator',
    toolName: 'AI App Evaluator',
    toolRoute: '/app/toolkit/ai-app-evaluator',
    greeting: "Let's evaluate your AI application idea. Tell me about it.",
    questions: [
      { question: 'What does your AI application do?', placeholder: 'e.g., A personalised learning platform that adapts content difficulty...' },
      { question: 'Who are the users and what problem does it solve for them?', placeholder: 'e.g., Students in a certification programme...' },
      { question: 'What data or content does it work with?', placeholder: 'e.g., User profiles, quiz scores, module completion data...' },
    ],
  },
  'learning-coach': {
    toolId: 'learning-coach',
    toolName: 'Learning Coach',
    toolRoute: '/app/toolkit/learning-coach',
    greeting: "Let's find the right learning resources for you.",
    questions: [
      { question: 'What topic do you want to learn about?', placeholder: 'e.g., How to chain AI agents into workflows, prompt engineering...' },
      { question: "What's your current knowledge level on this topic?", placeholder: 'e.g., Beginner, Intermediate, Advanced...' },
      { question: 'Which learning platform do you prefer?', placeholder: 'e.g., YouTube videos, Perplexity deep-dives, NotebookLM...' },
    ],
  },
};

/* ── Project help questions per level ── */
const PROJECT_QUESTIONS: Record<number, { question: string; placeholder: string }[]> = {
  1: [
    { question: "What's the specific work task or challenge you want to address with this project?", placeholder: 'e.g., I spend too long drafting client emails that all follow the same structure...' },
    { question: 'Who will benefit from this output and how will they use it?', placeholder: 'e.g., My team will use the prompt template weekly for status reports...' },
    { question: 'What does a successful outcome look like for you?', placeholder: 'e.g., A reusable prompt that produces consistent, professional outputs every time...' },
  ],
  2: [
    { question: 'What repetitive process or task are you trying to solve with this project?', placeholder: 'e.g., Every week I manually review and categorise support tickets...' },
    { question: 'Who are the people involved and what are their pain points?', placeholder: 'e.g., The support team spends 3 hours a day on triage that could be automated...' },
    { question: 'How would you measure whether this project was successful?', placeholder: 'e.g., Reduce triage time by 50%, improve categorisation accuracy to 90%...' },
  ],
  3: [
    { question: 'Describe the end-to-end process your project focuses on – what triggers it and what is the final output?', placeholder: 'e.g., A client submits a brief via email, it gets parsed, assigned, and a project folder is created...' },
    { question: 'What are the biggest bottlenecks or failure points in this process today?', placeholder: 'e.g., Handoffs between teams get dropped, data lives in three different systems...' },
    { question: 'What systems, tools, or data sources are involved?', placeholder: 'e.g., Email, CRM (Salesforce), Google Drive, Slack, project management (Asana)...' },
  ],
  4: [
    { question: 'Who are the different users of what you are building and what decisions do they need to make?', placeholder: 'e.g., Project managers need to see budget burn, partners need portfolio overview...' },
    { question: 'What data or insights need to be surfaced, and where does that data live today?', placeholder: 'e.g., Utilisation rates in Harvest, budgets in Salesforce, allocation in a Google Sheet...' },
    { question: "What does the current experience look like, and what's broken about it?", placeholder: 'e.g., Currently done in spreadsheets, always out of date, takes 2 hours to compile...' },
  ],
  5: [
    { question: "What's the vision for this application – what should it do when it's fully working?", placeholder: 'e.g., A multi-user platform where employees log in, see personalised dashboards...' },
    { question: 'Who are the different user types and what does each one need?', placeholder: 'e.g., Admin users manage content, end users consume personalised recommendations...' },
    { question: "What's the current state – is this extending something from a previous level or starting fresh?", placeholder: 'e.g., Extending my L4 dashboard into a full app with user accounts and a database...' },
  ],
};

/* ── Chat message types ── */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCta?: { label: string; route: string };
  /** Level selection pills for project help mode */
  levelPills?: number[];
}

/* ══════════════════════════════════════════════════════════════
   WorkspaceChat component
   ══════════════════════════════════════════════════════════════ */

interface Props {
  toolId: string;
  initialPrompt: string;
  onBack: () => void;
  /** Project help mode — pass assigned levels and learning plan data */
  projectMode?: {
    assignedLevels: number[];
    learningPlanLevels: Record<string, PathwayLevelResult>;
    userRole?: string;
    userChallenge?: string;
  };
}

const WorkspaceChat: React.FC<Props> = ({ toolId, initialPrompt, onBack, projectMode }) => {
  const navigate = useNavigate();
  const isProjectMode = !!projectMode;

  // For regular mode, use the tool questions
  const tool = TOOL_QUESTIONS[toolId];

  /* ── State ── */
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isProjectMode) {
      // Project mode: start with level selection
      return [
        { role: 'user', content: 'I need help with my project.' },
        {
          role: 'assistant',
          content: '**Which level would you like help with?**',
          levelPills: projectMode.assignedLevels,
        },
      ];
    }
    // Regular mode: greeting + first question
    return [
      { role: 'user', content: initialPrompt },
      { role: 'assistant', content: `${tool?.greeting || "Let's get started."}\n\n**${tool?.questions[0]?.question || ''}**` },
    ];
  });

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingForLevelSelect, setWaitingForLevelSelect] = useState(isProjectMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derived: which questions and tool to use
  const activeQuestions = isProjectMode && selectedLevel
    ? PROJECT_QUESTIONS[selectedLevel] || []
    : tool?.questions || [];

  const activeToolId = isProjectMode && selectedLevel
    ? PRIMARY_TOOL_IDS[selectedLevel]
    : toolId;

  const activeToolMeta = ALL_TOOLS.find((t) => t.id === activeToolId) ||
    { name: 'Tool', route: `/app/toolkit/${activeToolId}`, accentDark: '#38B2AC', accentColor: '#38B2AC' };

  const ActiveIcon = TOOL_ICON_MAP[activeToolId || ''];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [inputValue]);

  /* ── Handle level selection (project mode only) ── */
  const handleLevelSelect = useCallback((level: number) => {
    const levelPlan = projectMode?.learningPlanLevels[`L${level}`];
    const projectTitle = levelPlan?.projectTitle || `Level ${level} Project`;

    setSelectedLevel(level);
    setWaitingForLevelSelect(false);
    setCurrentQuestionIndex(0);

    const questions = PROJECT_QUESTIONS[level] || [];

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `Level ${level} – ${LEVEL_FULL_NAMES[level]}` },
      {
        role: 'assistant',
        content: `Your Level ${level} project is: **${projectTitle}**\n\n${levelPlan?.projectDescription || ''}\n\nExpected deliverable: ${levelPlan?.deliverable || 'Not specified'}\n\nLet me help you think it through.\n\n**${questions[0]?.question || ''}**`,
      },
    ]);
  }, [projectMode]);

  /* ── Send user answer ── */
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isGenerating || waitingForLevelSelect) return;
    setInputValue('');

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);

    const nextQIdx = currentQuestionIndex + 1;
    const totalQuestions = activeQuestions.length;

    if (nextQIdx < totalQuestions) {
      setCurrentQuestionIndex(nextQIdx);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**${activeQuestions[nextQIdx].question}**` },
        ]);
      }, 400);
    } else {
      // All questions answered — call AI
      setIsGenerating(true);

      const conversationSummary = nextMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      // For project mode, include learning plan data
      const levelPlan = isProjectMode && selectedLevel
        ? projectMode?.learningPlanLevels[`L${selectedLevel}`]
        : null;

      const finalToolId = activeToolId || 'prompt-playground';
      const finalToolMeta = ALL_TOOLS.find((t) => t.id === finalToolId)
        || (tool ? { name: tool.toolName, route: tool.toolRoute } : null);

      try {
        const res = await fetch('/api/project-prefill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: finalToolId,
            projectTitle: levelPlan?.projectTitle || initialPrompt.slice(0, 200),
            projectDescription: conversationSummary,
            deliverable: levelPlan?.deliverable || '',
            userRole: projectMode?.userRole || '',
            userChallenge: projectMode?.userChallenge || '',
          }),
        });

        let prefillFields: Record<string, string> = {};
        if (res.ok) {
          const data = await res.json();
          prefillFields = data.fields || {};
        }

        sessionStorage.setItem('workspace_prefill', JSON.stringify({
          toolId: finalToolId,
          fields: prefillFields,
        }));

        const toolName = finalToolMeta?.name || 'the toolkit';
        const toolRoute = finalToolMeta?.route || '/app/toolkit';

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've got everything I need. I've prepared your inputs based on our conversation – click below to open the tool with everything pre-filled.`,
            toolCta: { label: `Open in ${toolName}`, route: toolRoute },
          },
        ]);
      } catch {
        const toolName = finalToolMeta?.name || 'the toolkit';
        const toolRoute = finalToolMeta?.route || '/app/toolkit';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I've captured your requirements. Click below to open the tool – you may need to fill in some details manually.",
            toolCta: { label: `Open in ${toolName}`, route: toolRoute },
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    }
  }, [inputValue, messages, currentQuestionIndex, activeQuestions, activeToolId, isProjectMode, selectedLevel, projectMode, initialPrompt, isGenerating, waitingForLevelSelect]);

  const currentPlaceholder = activeQuestions[currentQuestionIndex]?.placeholder || 'Type your answer...';
  const allQuestionsAnswered = !waitingForLevelSelect && currentQuestionIndex >= activeQuestions.length;

  // Header display
  const headerLabel = isProjectMode
    ? (selectedLevel ? `Project Help – L${selectedLevel} ${LEVEL_SHORT_NAMES[selectedLevel]}` : 'Project Help')
    : (tool?.toolName || 'Chat');
  const headerAccent = isProjectMode && selectedLevel
    ? LEVEL_ACCENT_DARK_COLORS[selectedLevel]
    : (activeToolMeta as any).accentDark || '#38B2AC';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 82px)',
      fontFamily: "'DM Sans', sans-serif",
      background: '#F7FAFC',
    }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes wsPrefillSpin { to { transform: rotate(360deg); } }
        .ws-chat-input:focus-within {
          border-color: #38B2AC !important;
          box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.12) !important;
        }
        .ws-chat-input textarea::placeholder { color: #A0AEC0; }
        .ws-cta-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .ws-level-pill:hover { box-shadow: 0 0 0 1px currentColor !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 36px',
        borderBottom: '1px solid #E2E8F0',
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            color: '#718096', transition: 'color 0.1s', padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1A202C'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; }}
        >
          <ChevronLeft size={18} /> Back to Workspace
        </button>
        <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isProjectMode
            ? <FolderOpen size={18} color={headerAccent} />
            : ActiveIcon && <ActiveIcon size={18} color={headerAccent} />
          }
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>
            {headerLabel}
          </span>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px 36px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? '#1A202C' : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : '#1A202C',
                  border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j}>{part.slice(2, -2)}</strong>
                      : <span key={j}>{part}</span>
                  )}

                  {msg.toolCta && (
                    <div style={{ marginTop: 14 }}>
                      <button
                        className="ws-cta-btn"
                        onClick={() => navigate(msg.toolCta!.route)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '10px 20px',
                          borderRadius: 24,
                          border: 'none',
                          background: headerAccent,
                          color: '#FFFFFF',
                          fontSize: 14, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          cursor: 'pointer',
                          transition: 'filter 0.15s, transform 0.15s',
                        }}
                      >
                        {msg.toolCta.label} <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Level selection pills */}
              {msg.levelPills && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                  marginTop: 10, paddingLeft: 4,
                }}>
                  {msg.levelPills.map((lvl) => {
                    const accent = LEVEL_ACCENT_COLORS[lvl];
                    const accentDark = LEVEL_ACCENT_DARK_COLORS[lvl];
                    const LevelIcon = TOOL_ICON_MAP[PRIMARY_TOOL_IDS[lvl]];
                    return (
                      <button
                        key={lvl}
                        className="ws-level-pill"
                        onClick={() => handleLevelSelect(lvl)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '8px 16px 8px 12px',
                          borderRadius: 20,
                          border: `1.5px solid ${accent}`,
                          background: '#FFFFFF',
                          color: accentDark,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13, fontWeight: 600,
                          transition: 'background 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}20`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        {LevelIcon && <LevelIcon size={16} color={accentDark} />}
                        L{lvl} · {LEVEL_SHORT_NAMES[lvl]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Loading skeleton */}
          {isGenerating && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '16px 20px',
                borderRadius: '16px 16px 16px 4px',
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {[100, 85, 92, 60].map((w, i) => (
                  <div key={i} style={{
                    width: `${w}%`, height: 12, borderRadius: 6,
                    background: '#E2E8F0',
                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginTop: 4, fontSize: 12, color: '#A0AEC0',
                }}>
                  <Loader2 size={14} style={{ animation: 'wsPrefillSpin 0.8s linear infinite' }} />
                  Preparing your toolkit inputs...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar (hidden during level selection and after all questions) ── */}
      {!waitingForLevelSelect && !allQuestionsAnswered && (
        <div style={{
          padding: '16px 36px',
          borderTop: '1px solid #E2E8F0',
          background: '#FFFFFF',
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div
              className="ws-chat-input"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={currentPlaceholder}
                rows={1}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  resize: 'none', overflow: 'hidden',
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: '#1A202C', lineHeight: 1.5, background: 'transparent',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isGenerating}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  border: 'none',
                  background: inputValue.trim() ? '#38B2AC' : '#E2E8F0',
                  color: inputValue.trim() ? '#FFFFFF' : '#A0AEC0',
                  cursor: inputValue.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceChat;
