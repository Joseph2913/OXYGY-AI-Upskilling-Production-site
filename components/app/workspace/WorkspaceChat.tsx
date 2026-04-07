import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { TOOL_ICON_MAP } from './ToolIcons';
import { ALL_TOOLS } from '../../../data/toolkitData';
import { showToast } from '../Toast';

/* ══════════════════════════════════════════════════════════════
   Hardcoded follow-up questions per tool.
   These are the same for every user — designed to cover 99%
   of scenarios. The user's answers provide the context.
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
    greeting: "Great — let's craft a prompt together. I just need a few details.",
    questions: [
      {
        question: 'What specific task do you need this prompt for?',
        placeholder: 'e.g., Summarise meeting notes into action items, draft a client proposal, analyse survey data...',
      },
      {
        question: 'Who is the audience for this output?',
        placeholder: 'e.g., My leadership team, external clients, my direct reports...',
      },
      {
        question: 'What format should the output be in?',
        placeholder: 'e.g., Bullet points, a formal email, a one-page summary, a table...',
      },
    ],
  },
  'agent-builder': {
    toolId: 'agent-builder',
    toolName: 'Agent Builder',
    toolRoute: '/app/toolkit/agent-builder',
    greeting: "Let's design your AI agent. A few questions to get the brief right.",
    questions: [
      {
        question: 'What process or task should this agent handle?',
        placeholder: 'e.g., Answering onboarding FAQs, triaging support tickets, summarising weekly reports...',
      },
      {
        question: 'What data or inputs will the agent receive?',
        placeholder: 'e.g., Emails, form responses, spreadsheet data, chat messages...',
      },
      {
        question: 'Who will use this agent and how often?',
        placeholder: 'e.g., The HR team, daily; project managers, weekly for reporting...',
      },
    ],
  },
  'workflow-canvas': {
    toolId: 'workflow-canvas',
    toolName: 'Workflow Canvas',
    toolRoute: '/app/toolkit/workflow-canvas',
    greeting: "Let's map out your workflow. I need to understand the process first.",
    questions: [
      {
        question: 'What end-to-end process do you want to automate?',
        placeholder: 'e.g., Client onboarding from initial contact to kickoff, monthly report generation...',
      },
      {
        question: 'What tools and systems are involved?',
        placeholder: 'e.g., Email, Slack, Google Sheets, CRM (HubSpot), project management (Asana)...',
      },
      {
        question: 'Where should a human review or approve before the workflow continues?',
        placeholder: 'e.g., Before sending to client, after AI generates the summary, at the budget approval step...',
      },
    ],
  },
  'dashboard-designer': {
    toolId: 'dashboard-designer',
    toolName: 'App Designer',
    toolRoute: '/app/toolkit/dashboard-designer',
    greeting: "Let's scope your app. A few questions to define the brief.",
    questions: [
      {
        question: 'What problem does this app solve and for whom?',
        placeholder: 'e.g., Helps project managers track team utilisation across multiple projects...',
      },
      {
        question: 'What are the 3-5 key features or screens it needs?',
        placeholder: 'e.g., Dashboard with KPI cards, user profiles, notification centre, report export...',
      },
      {
        question: 'What data sources will it use?',
        placeholder: 'e.g., Supabase database, REST API, Google Sheets, manual user input...',
      },
    ],
  },
  'ai-app-evaluator': {
    toolId: 'ai-app-evaluator',
    toolName: 'AI App Evaluator',
    toolRoute: '/app/toolkit/ai-app-evaluator',
    greeting: "Let's evaluate your AI application idea. Tell me about it.",
    questions: [
      {
        question: 'What does your AI application do?',
        placeholder: 'e.g., A personalised learning platform that adapts content difficulty based on quiz scores...',
      },
      {
        question: 'Who are the users and what problem does it solve for them?',
        placeholder: 'e.g., Students in a certification programme who need personalised study paths...',
      },
      {
        question: 'What data or content does it work with?',
        placeholder: 'e.g., User profiles, quiz scores, module completion data, content library...',
      },
    ],
  },
  'learning-coach': {
    toolId: 'learning-coach',
    toolName: 'Learning Coach',
    toolRoute: '/app/toolkit/learning-coach',
    greeting: "Let's find the right learning resources for you.",
    questions: [
      {
        question: 'What topic do you want to learn about?',
        placeholder: 'e.g., How to chain AI agents into workflows, prompt engineering best practices...',
      },
      {
        question: "What's your current knowledge level on this topic?",
        placeholder: 'e.g., Beginner — never done it before, Intermediate — done it a few times, Advanced...',
      },
      {
        question: 'Which learning platform do you prefer?',
        placeholder: 'e.g., YouTube videos, Perplexity deep-dives, NotebookLM study guides...',
      },
    ],
  },
};

/* ── Chat message types ── */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** If present, show a CTA button to open the toolkit */
  toolCta?: { label: string; route: string };
}

/* ── Session storage key for chat state ── */
const CHAT_STATE_KEY = 'oxygy_workspace_chat_state';

interface SavedChatState {
  toolId: string;
  messages: ChatMessage[];
  currentQuestionIndex: number;
  initialPrompt: string;
}

/* ══════════════════════════════════════════════════════════════
   WorkspaceChat component
   ══════════════════════════════════════════════════════════════ */

interface Props {
  toolId: string;
  initialPrompt: string;
  onBack: () => void;
}

const WorkspaceChat: React.FC<Props> = ({ toolId, initialPrompt, onBack }) => {
  const navigate = useNavigate();
  const tool = TOOL_QUESTIONS[toolId];
  const toolMeta = ALL_TOOLS.find((t) => t.id === toolId) ||
    { accentColor: '#38B2AC', accentDark: '#2C9A94', name: 'Learning Coach', route: '/app/toolkit/learning-coach' };
  const IconComponent = TOOL_ICON_MAP[toolId];

  /* ── Chat state (no persistence — fresh every time) ── */
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'user', content: initialPrompt },
    { role: 'assistant', content: `${tool?.greeting || "Let's get started."}\n\n**${tool?.questions[0]?.question || ''}**` },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
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

  /* ── Send user answer ── */
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isGenerating) return;
    setInputValue('');

    // Add user message
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);

    const nextQIdx = currentQuestionIndex + 1;
    const totalQuestions = tool?.questions.length || 0;

    if (nextQIdx < totalQuestions) {
      // More questions — show next question after a brief delay
      setCurrentQuestionIndex(nextQIdx);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**${tool!.questions[nextQIdx].question}**` },
        ]);
      }, 400);
    } else {
      // All questions answered — call AI to generate pre-fill
      setIsGenerating(true);

      // Build conversation summary for the AI
      const conversationSummary = nextMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      try {
        const res = await fetch('/api/project-prefill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: tool!.toolId,
            projectTitle: initialPrompt.slice(0, 200),
            projectDescription: conversationSummary,
            deliverable: '',
            userRole: '',
            userChallenge: '',
          }),
        });

        let prefillFields: Record<string, string> = {};
        if (res.ok) {
          const data = await res.json();
          prefillFields = data.fields || {};
        }

        // Store prefill
        sessionStorage.setItem('workspace_prefill', JSON.stringify({
          toolId: tool!.toolId,
          fields: prefillFields,
        }));

        // Show completion message with CTA
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I've got everything I need. I've prepared your inputs based on our conversation — click below to open the tool with everything pre-filled.",
            toolCta: {
              label: `Open in ${tool!.toolName}`,
              route: tool!.toolRoute,
            },
          },
        ]);
      } catch {
        // Fallback — still navigate but without prefill
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I've captured your requirements. Click below to open the tool — you may need to fill in some details manually.",
            toolCta: {
              label: `Open in ${tool!.toolName}`,
              route: tool!.toolRoute,
            },
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    }
  }, [inputValue, messages, currentQuestionIndex, tool, initialPrompt, isGenerating]);

  const currentPlaceholder = tool?.questions[currentQuestionIndex]?.placeholder || 'Type your answer...';
  const allQuestionsAnswered = currentQuestionIndex >= (tool?.questions.length || 0);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 82px)', /* below top bar */
      fontFamily: "'DM Sans', sans-serif",
      background: '#F7FAFC',
    }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .ws-chat-input:focus-within {
          border-color: #38B2AC !important;
          box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.12) !important;
        }
        .ws-chat-input textarea::placeholder { color: #A0AEC0; }
        .ws-cta-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
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
          {IconComponent && <IconComponent size={18} color={(toolMeta as any).accentDark || '#38B2AC'} />}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>
            {tool?.toolName || 'Chat'}
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
            <div key={i} style={{
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
                {/* Render bold text between ** markers */}
                {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j}>{part.slice(2, -2)}</strong>
                    : <span key={j}>{part}</span>
                )}

                {/* Tool CTA button */}
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
                        background: (toolMeta as any).accentDark || '#38B2AC',
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
                    animation: `skeletonPulse 1.5s ease-in-out infinite`,
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

      {/* ── Input bar (pinned to bottom) ── */}
      {!allQuestionsAnswered && (
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
