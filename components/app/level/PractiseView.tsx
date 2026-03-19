import React, { useState, useEffect } from 'react';
import { PenTool } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { savePractiseScore, logActivity } from '../../../lib/database';

interface PractiseViewProps {
  accentColor: string;
  accentDark: string;
  level: number;
  topicId: number;
  onCompleteTopic: () => void;
}

const CRITIQUE_CONTENT = {
  task: "Write a summary of last quarter's employee engagement survey results for the leadership team. They want to know the top three themes, what's improved since last year, and one recommendation.",
  weakPrompt: "Summarise our performance reviews from last quarter for leadership.",
  weaknesses: [
    { label: "No role", desc: "The AI doesn't know who it's acting as" },
    { label: "No context", desc: "No audience detail, no data reference, no constraints" },
    { label: "No format", desc: "No structure, length, or tone specified" },
    { label: "No checks", desc: "Nothing to prevent speculation or errors" },
  ],
  blueprintReminder: [
    { key: "Role",    color: "#667EEA" },
    { key: "Context", color: "#38B2AC" },
    { key: "Task",    color: "#ED8936" },
    { key: "Format",  color: "#48BB78" },
    { key: "Steps",   color: "#9F7AEA" },
    { key: "Checks",  color: "#F6AD55" },
  ],
};

const PractiseView: React.FC<PractiseViewProps> = ({ accentColor, accentDark, level, topicId, onCompleteTopic }) => {
  const { user } = useAuth();
  const [rewrite, setRewrite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; improved: string; missing: string; suggestion: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (document.getElementById('practise-anim')) return;
    const s = document.createElement('style');
    s.id = 'practise-anim';
    s.textContent = `
      @keyframes insightPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(56,178,172,0.2); } 50% { box-shadow: 0 0 16px 4px rgba(56,178,172,0.35); } }
      .insight-pulse { animation: insightPulse 3s ease-in-out infinite; }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up { animation: fadeInUp 0.3s ease forwards; }
      @keyframes practise-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
  }, []);

  const handleSubmit = async () => {
    if (!user || rewrite.trim().length < 50 || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/validate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalTask: CRITIQUE_CONTENT.task, weakPrompt: CRITIQUE_CONTENT.weakPrompt, learnerRewrite: rewrite.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Feedback unavailable. Please try again.');
      }
      const data = await res.json();
      setFeedback(data);
      setSubmitted(true);
      await savePractiseScore(user.id, level, topicId, data.score);
      logActivity(user.id, 'quiz_answered', level, topicId, { type: 'prompt_critique', score: data.score });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = feedback ? (feedback.score >= 80 ? '#48BB78' : feedback.score >= 60 ? '#ED8936' : '#FC8181') : '#38B2AC';
  const scoreBand = feedback ? (feedback.score >= 80 ? 'Strong — all key components present' : feedback.score >= 60 ? 'Good — most components covered' : feedback.score >= 40 ? 'Developing — key components missing' : 'Needs work — revisit the Blueprint') : '';

  const eyebrow = (text: string, color = '#A0AEC0') => (
    <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{text}</div>
  );

  return (
    <div style={{ padding: '0 0 48px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 24 }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <PenTool size={20} color={accentColor} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>Validate Your Knowledge</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Apply the Blueprint framework to improve a real prompt</div>
          </div>
        </div>

        <div style={{ padding: 32 }}>
          {/* Step 1 — Task */}
          <div style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}33`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            {eyebrow('THE TASK', accentDark)}
            <div style={{ fontSize: 15, color: '#1A202C', lineHeight: 1.7, fontWeight: 500 }}>{CRITIQUE_CONTENT.task}</div>
          </div>

          {/* Step 2 — Weak prompt */}
          <div style={{ marginBottom: 20 }}>
            {eyebrow('WHAT WAS WRITTEN')}
            <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #FC8181', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: 13, fontStyle: 'italic', color: '#2D3748', marginBottom: 12 }}>
              {CRITIQUE_CONTENT.weakPrompt}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CRITIQUE_CONTENT.weaknesses.map((w, i) => (
                <span key={i} style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#9B2C2C' }}>{w.label} — {w.desc}</span>
              ))}
            </div>
          </div>

          {/* Step 3 — Blueprint reminder */}
          <div style={{ marginBottom: 20 }}>
            {eyebrow('BLUEPRINT REMINDER')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CRITIQUE_CONTENT.blueprintReminder.map((b, i) => (
                <span key={i} style={{ background: `${b.color}15`, border: `1px solid ${b.color}40`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: b.color }}>{b.key}</span>
              ))}
            </div>
          </div>

          {/* Step 4 — Rewrite */}
          <div style={{ marginBottom: 16 }}>
            {eyebrow('YOUR REWRITE')}
            <textarea
              value={rewrite}
              onChange={e => setRewrite(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={submitted}
              placeholder="Rewrite the prompt using the Blueprint framework (Role, Context, Task, Format, Steps, Checks)..."
              style={{ width: '100%', minHeight: 140, border: `1px solid ${focused ? accentColor : '#E2E8F0'}`, borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.7, color: '#1A202C', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#A0AEC0', marginBottom: 12 }}>{rewrite.length} characters</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSubmit}
                disabled={isLoading || rewrite.trim().length < 50 || submitted}
                style={{ background: isLoading || rewrite.trim().length < 50 || submitted ? '#E2E8F0' : '#38B2AC', color: isLoading || rewrite.trim().length < 50 || submitted ? '#A0AEC0' : '#FFFFFF', border: 'none', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: isLoading || rewrite.trim().length < 50 || submitted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid #38B2AC', borderTopColor: 'transparent', borderRadius: '50%', animation: 'practise-spin 0.8s linear infinite' }} />
                    Getting feedback…
                  </>
                ) : 'Get Feedback →'}
              </button>
              {rewrite.trim().length < 50 && rewrite.length > 0 && (
                <span style={{ fontSize: 12, color: '#A0AEC0' }}>{50 - rewrite.trim().length} more characters needed</span>
              )}
            </div>
            {error && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 10, padding: '12px 16px', marginTop: 12, fontSize: 13, color: '#9B2C2C' }}>{error}</div>
            )}
          </div>

          {/* Feedback panel */}
          {submitted && feedback && (
            <div className="fade-in-up">
              {/* Score row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px 0', borderTop: '1px solid #E2E8F0' }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke={`${scoreColor}33`} strokeWidth="5" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={scoreColor} strokeWidth="5" strokeDasharray={`${(feedback.score / 100) * 175.9} 175.9`} strokeLinecap="round" transform="rotate(-90 32 32)" />
                  <text x="32" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill={scoreColor}>{feedback.score}</text>
                  <text x="32" y="46" textAnchor="middle" fontSize="9" fill="#718096">/ 100</text>
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>Your prompt score</div>
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{scoreBand}</div>
                </div>
              </div>

              {/* What you improved */}
              <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', borderLeft: '3px solid #48BB78', borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#276749', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>WHAT YOU IMPROVED</div>
                <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.6, margin: 0 }}>{feedback.improved}</p>
              </div>

              {/* Still missing */}
              <div style={{ background: '#FFFBEB', border: '1px solid #F6AD55', borderLeft: '3px solid #ED8936', borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>STILL MISSING</div>
                <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, margin: 0 }}>{feedback.missing}</p>
              </div>

              {/* One suggestion */}
              <div style={{ background: '#EBF8FF', border: '1px solid #38B2AC33', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#38B2AC', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>ONE SUGGESTION</div>
                  <p style={{ fontSize: 13, color: '#1A202C', lineHeight: 1.6, margin: 0 }}>{feedback.suggestion}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Topic button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onCompleteTopic}
          disabled={!submitted}
          style={{ background: submitted ? accentColor : '#E2E8F0', color: submitted ? accentDark : '#A0AEC0', border: 'none', borderRadius: 24, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: submitted ? 'pointer' : 'default', fontFamily: "'DM Sans', sans-serif" }}
        >
          Complete Topic →
        </button>
      </div>
    </div>
  );
};

export default PractiseView;
