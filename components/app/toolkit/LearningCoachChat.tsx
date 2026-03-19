import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, UserCog, MessageSquarePlus } from 'lucide-react';
import ChatMessageBubble, { ContentBlock, ButtonOption } from './ChatMessageBubble';
import LearningCoachEditPanel from './LearningCoachEditPanel';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import { LEARNING_PREFERENCES, PLATFORMS, LEVEL_OBJECTIVES } from '../../../data/learningCoachContent';
import type { LearnerCoachProfile } from '../../../lib/database';
import { upsertLearnerCoachProfile, getProfile, getLatestLearningPlan } from '../../../lib/database';

const FONT = "'DM Sans', sans-serif";
const SESSION_KEY = 'oxygy_learning_coach_session';
const SESSION_MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  text?: string;
  buttons?: ButtonOption[];
  timestamp: number;
}

interface LearningCoachChatProps {
  coachProfile: LearnerCoachProfile;
  onProfileUpdate: (profile: LearnerCoachProfile) => void;
  isFirstVisit?: boolean;
}

const LearningCoachChat: React.FC<LearningCoachChatProps> = ({
  coachProfile,
  onProfileUpdate,
  isFirstVisit,
}) => {
  const { user } = useAuth();
  const { userProfile } = useAppContext();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Onboarding flow state: 'level' → 'topic' → 'ready'
  const [onboardingPhase, setOnboardingPhase] = useState<'level' | 'topic' | 'ready'>('level');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledRef = useRef(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build user profile context for API
  const buildUserProfileContext = useCallback(async () => {
    if (!user) return null;
    const profile = await getProfile(user.id);
    const planData = await getLatestLearningPlan(user.id);

    return {
      fullName: profile?.fullName || userProfile?.fullName || '',
      role: profile?.role || '',
      function: profile?.function || '',
      seniority: profile?.seniority || '',
      aiExperience: profile?.aiExperience || '',
      ambition: profile?.ambition || '',
      challenge: profile?.challenge || '',
      goalDescription: profile?.goalDescription || '',
      currentLevel: userProfile?.currentLevel ?? 1,
      learningPlan: planData ? {
        pathwaySummary: planData.plan.pathwaySummary,
        levels: planData.plan.levels as any,
      } : null,
    };
  }, [user, userProfile]);

  const LEVEL_NAMES: Record<number, string> = {
    1: 'Fundamentals',
    2: 'Applied',
    3: 'Systemic',
    4: 'Dashboards',
    5: 'Applications',
  };

  // Generate the opening greeting + level selection prompt
  const getGreetingMessages = useCallback((): DisplayMessage[] => {
    const firstName = userProfile?.fullName?.split(' ')[0] || 'there';

    const greeting: DisplayMessage = {
      id: `greeting-${Date.now()}`,
      role: 'assistant',
      content: [{ type: 'text', content: isFirstVisit
        ? `Welcome, **${firstName}**! I'm your Learning Coach. Before we dive in, let's set the focus for this session.`
        : `Welcome back, **${firstName}**. Let's set up your learning session.`
      }],
      timestamp: Date.now(),
    };

    const levelPrompt: DisplayMessage = {
      id: `level-prompt-${Date.now()}`,
      role: 'assistant',
      content: [{ type: 'text', content: 'Which level would you like to work on?' }],
      buttons: [1, 2, 3, 4, 5].map(n => ({
        label: `L${n} · ${LEVEL_NAMES[n]}`,
        value: `__level__${n}`,
      })),
      timestamp: Date.now() + 1,
    };

    return [greeting, levelPrompt];
  }, [userProfile, isFirstVisit]);

  // Handle level selection → show topic buttons
  const handleLevelSelected = useCallback((level: number) => {
    setSelectedLevel(level);
    setOnboardingPhase('topic');

    // Add user's choice as a message
    const userMsg: DisplayMessage = {
      id: `user-level-${Date.now()}`,
      role: 'user',
      content: [],
      text: `Level ${level} — ${LEVEL_NAMES[level]}`,
      timestamp: Date.now(),
    };

    // Add topic selection prompt with "Other" option
    const topics = LEVEL_OBJECTIVES[level] || [];
    const topicPrompt: DisplayMessage = {
      id: `topic-prompt-${Date.now()}`,
      role: 'assistant',
      content: [{ type: 'text', content: `Great — Level ${level}: **${LEVEL_NAMES[level]}**. Which topic would you like to explore?` }],
      buttons: [
        ...topics.map(t => ({ label: t, value: `__topic__${t}` })),
        { label: 'Other — I\u2019ll describe it', value: '__topic__other' },
      ],
      timestamp: Date.now() + 1,
    };

    setMessages(prev => [...prev, userMsg, topicPrompt]);
  }, []);

  // Handle topic selection → ask clarifying question (don't call AI yet)
  const handleTopicSelected = useCallback((topic: string) => {
    const isOther = topic === 'other';
    if (!isOther) setSelectedTopic(topic);
    setOnboardingPhase('ready');

    const userMsg: DisplayMessage = {
      id: `user-topic-${Date.now()}`,
      role: 'user',
      content: [],
      text: isOther ? 'I\u2019ll describe my own topic' : topic,
      timestamp: Date.now(),
    };

    // Ask clarifying question instead of jumping to AI
    const clarifyMsg: DisplayMessage = {
      id: `clarify-${Date.now()}`,
      role: 'assistant',
      content: [{ type: 'text', content: isOther
        ? `No problem — go ahead and describe what you'd like to learn about. Be as specific as you like.`
        : `Good choice — **${topic}**. To make sure I point you in the right direction: are you looking for a general overview of this topic, or is there something specific within it that you want to go deeper on?`
      }],
      buttons: isOther ? undefined : [
        { label: 'General overview', value: `I'd like a general overview of ${topic} at Level ${selectedLevel}` },
        { label: 'Something specific — I\'ll describe it', value: `I want to learn something specific about ${topic}` },
      ],
      timestamp: Date.now() + 1,
    };

    setMessages(prev => [...prev, userMsg, clarifyMsg]);
  }, [selectedLevel]);

  // (AI is now triggered by user's response to the clarifying question, via sendMessage)

  // Restore or initialize session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.updatedAt && Date.now() - session.updatedAt < SESSION_MAX_AGE && session.messages?.length > 0) {
          setMessages(session.messages);
          // If restoring a session that already completed onboarding, mark as ready
          if (session.onboardingPhase === 'ready') {
            setOnboardingPhase('ready');
            setSelectedLevel(session.selectedLevel || null);
            setSelectedTopic(session.selectedTopic || null);
          } else if (session.onboardingPhase === 'topic') {
            setOnboardingPhase('topic');
            setSelectedLevel(session.selectedLevel || null);
          }
          return;
        }
      }
    } catch { /* ignore */ }

    // Start fresh with greeting + level selection
    setMessages(getGreetingMessages());
    setOnboardingPhase('level');
  }, []); // Only on mount

  // Save session to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        messages,
        updatedAt: Date.now(),
        onboardingPhase,
        selectedLevel,
        selectedTopic,
      }));
    }
  }, [messages, onboardingPhase, selectedLevel, selectedTopic]);

  // Auto-scroll
  useEffect(() => {
    if (!userScrolledRef.current && chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 80;
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Send message (free text always skips onboarding and goes straight to AI)
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // If user types freely during onboarding, skip to ready
    if (onboardingPhase !== 'ready') {
      setOnboardingPhase('ready');
    }

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: [],
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setLoadingLabel(null);
    userScrolledRef.current = false;

    // Progressive loading labels
    loadingTimerRef.current = setTimeout(() => setLoadingLabel('Thinking...'), 4000);
    loadingTimer2Ref.current = setTimeout(() => setLoadingLabel('Still working on this...'), 10000);

    try {
      const userProfileContext = await buildUserProfileContext();

      // Build conversation history for API (plain text for user, stringified blocks for assistant)
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.role === 'user'
          ? (m.text || m.content[0]?.content || '')
          : m.content.map(b => b.content).join('\n\n'),
      }));

      const response = await fetch('/api/learning-coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          learnerProfile: {
            preferences: coachProfile.preferences,
            platforms: coachProfile.platforms,
            additionalContext: coachProfile.additionalContext,
          },
          userProfile: userProfileContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || [{ type: 'text', content: 'I\'m not sure how to respond to that. Could you rephrase?' }],
        buttons: data.buttons,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: [{ type: 'text', content: 'Sorry, I ran into a problem. Could you try again?' }],
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingLabel(null);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (loadingTimer2Ref.current) clearTimeout(loadingTimer2Ref.current);
    }
  }, [isLoading, messages, coachProfile, buildUserProfileContext]);

  // Handle button click — intercept onboarding buttons
  const handleButtonClick = useCallback((value: string) => {
    if (value.startsWith('__level__')) {
      const level = parseInt(value.replace('__level__', ''), 10);
      if (level >= 1 && level <= 5) {
        handleLevelSelected(level);
        return;
      }
    }
    if (value.startsWith('__topic__')) {
      const topic = value.replace('__topic__', '');
      handleTopicSelected(topic);
      return;
    }
    sendMessage(value);
  }, [sendMessage, handleLevelSelected, handleTopicSelected]);

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(160, Math.max(40, ta.scrollHeight)) + 'px';
  };

  // New Chat — reset everything including onboarding
  const handleNewChat = () => {
    localStorage.removeItem(SESSION_KEY);
    setOnboardingPhase('level');
    setSelectedLevel(null);
    setSelectedTopic(null);
    setMessages(getGreetingMessages());
    setInputValue('');
  };

  // Save profile edits
  const handleSaveProfile = async (data: { preferences: string[]; platforms: string[]; additionalContext: string }) => {
    if (!user) return;
    const ok = await upsertLearnerCoachProfile(user.id, data);
    if (ok) {
      onProfileUpdate({
        ...coachProfile,
        preferences: data.preferences,
        platforms: data.platforms,
        additionalContext: data.additionalContext,
        updatedAt: new Date().toISOString(),
      });
      setEditPanelOpen(false);
      setToastMessage('Profile updated.');
    }
  };

  // Find last message with buttons (to only show on the latest one)
  const lastButtonMsgIdx = [...messages].reverse().findIndex(m => m.buttons && m.buttons.length > 0);
  const lastButtonMsgId = lastButtonMsgIdx >= 0 ? messages[messages.length - 1 - lastButtonMsgIdx].id : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 54px)',
      fontFamily: FONT,
    }}>
      <style>{`
        @keyframes ppTypingDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes lcSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes lcMessageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lcButtonsIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Action buttons — top right */}
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'flex-end',
        padding: '12px 36px 0 36px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setEditPanelOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#EDF2F7',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#2D3748',
            cursor: 'pointer',
            fontFamily: FONT,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#EDF2F7'; }}
        >
          <UserCog size={14} /> Edit Profile
        </button>
        <button
          onClick={handleNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#38B2AC',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            cursor: 'pointer',
            fontFamily: FONT,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2C9A94'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#38B2AC'; }}
        >
          <MessageSquarePlus size={14} /> New Chat
        </button>
      </div>

      {/* Chat Message Area */}
      <div
        ref={chatAreaRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {messages.map(msg => (
            <ChatMessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              text={msg.text}
              buttons={msg.buttons}
              onButtonClick={handleButtonClick}
              showButtons={msg.id === lastButtonMsgId && !isLoading}
              userInitial={(userProfile?.fullName?.[0] || 'U').toUpperCase()}
            />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#38B2AC', color: '#FFFFFF',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT, flexShrink: 0, marginTop: 2,
              }}>
                LC
              </div>
              <div>
                <div style={{
                  background: '#F7FAFC',
                  borderRadius: '2px 16px 16px 16px',
                  padding: '14px 18px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#A0AEC0',
                      animation: `ppTypingDot 1.2s ease-in-out ${i * 200}ms infinite`,
                    }} />
                  ))}
                </div>
                {loadingLabel && (
                  <div style={{
                    fontSize: 11,
                    color: '#A0AEC0',
                    marginTop: 4,
                    fontFamily: FONT,
                    transition: 'opacity 0.3s ease',
                  }}>
                    {loadingLabel}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you'd like to learn..."
            rows={1}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 160,
              resize: 'none',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              padding: '10px 16px',
              fontSize: 14,
              fontFamily: FONT,
              lineHeight: 1.5,
              color: '#1A202C',
              outline: 'none',
              boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#38B2AC';
              e.target.style.boxShadow = '0 0 0 3px rgba(56, 178, 172, 0.15)';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: inputValue.trim() && !isLoading ? '#38B2AC' : '#E2E8F0',
              border: 'none',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <ArrowUp size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Edit Profile Panel */}
      <LearningCoachEditPanel
        open={editPanelOpen}
        onClose={() => setEditPanelOpen(false)}
        preferences={coachProfile.preferences}
        platforms={coachProfile.platforms}
        additionalContext={coachProfile.additionalContext}
        onSave={handleSaveProfile}
      />

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A202C',
          color: '#FFFFFF',
          padding: '10px 24px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default LearningCoachChat;
