import React, { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { PLATFORMS, LEARNING_PREFERENCES } from '../../../data/learningCoachContent';

const FONT = "'DM Sans', sans-serif";
const TOTAL_STEPS = 4;

interface LearningCoachSurveyProps {
  onComplete: (data: { preferences: string[]; platforms: string[]; additionalContext: string }) => void;
}

const LearningCoachSurvey: React.FC<LearningCoachSurveyProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');

  const canAdvance =
    (step === 1 && preferences.length > 0) ||
    (step === 2 && platforms.length > 0) ||
    step === 3 ||
    step === 4;

  const togglePref = (id: string) => {
    setPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  const togglePlat = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 54px)',
      padding: '40px 20px',
      fontFamily: FONT,
    }}>
      <div style={{
        maxWidth: 640,
        width: '100%',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '32px 36px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}>
        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: 0, fontFamily: FONT }}>
          Set Up Your Learning Coach
        </h1>
        <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, marginTop: 6, marginBottom: 20 }}>
          Tell me how you learn best, and I'll personalise every recommendation to you.
        </p>

        {/* Progress bar */}
        <div style={{
          height: 3,
          background: '#E2E8F0',
          borderRadius: 2,
          marginBottom: 28,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: '#38B2AC',
            width: `${(step / TOTAL_STEPS) * 100}%`,
            transition: 'width 0.3s ease',
            borderRadius: 2,
          }} />
        </div>

        {/* Step 1 — Learning Preferences */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
              How do you prefer to learn new things?
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
              Select all that apply — this shapes how I'll recommend content to you.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEARNING_PREFERENCES.map(pref => {
                const sel = preferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: sel ? '#E6FFFA' : '#FFFFFF',
                      border: sel ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!sel) {
                        e.currentTarget.style.borderColor = '#38B2AC';
                        e.currentTarget.style.background = '#F0FFFE';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!sel) {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#FFFFFF';
                      }
                    }}
                  >
                    {sel ? (
                      <Check size={16} color="#38B2AC" style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{pref.icon}</span>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>{pref.label}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{pref.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Platforms */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
              Which AI platforms do you have access to?
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
              I'll only recommend tools you can actually use.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PLATFORMS.map(p => {
                const sel = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlat(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: sel ? '#E6FFFA' : '#FFFFFF',
                      border: sel ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!sel) {
                        e.currentTarget.style.borderColor = '#38B2AC';
                        e.currentTarget.style.background = '#F0FFFE';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!sel) {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#FFFFFF';
                      }
                    }}
                  >
                    {sel ? (
                      <Check size={14} color="#38B2AC" />
                    ) : p.logo ? (
                      <img src={p.logo} alt={p.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: sel ? 600 : 500, color: '#1A202C' }}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Additional Context */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
              Anything else I should know about how you learn?
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
              Optional — but helpful. For example: 'I commute 45 minutes each way and prefer audio during that time' or 'I need short, focused sessions.'
            </div>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="Share any relevant details about your learning preferences..."
              style={{
                width: '100%',
                minHeight: 80,
                maxHeight: 160,
                resize: 'none',
                fontSize: 14,
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 16px',
                fontFamily: FONT,
                lineHeight: 1.5,
                color: '#1A202C',
                boxSizing: 'border-box' as const,
                outline: 'none',
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
          </div>
        )}

        {/* Step 4 — Confirmation */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>
              Here's your profile
            </div>
            <div style={{
              background: '#F7FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 16,
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                  Your learning preferences
                </div>
                <div style={{ fontSize: 14, color: '#1A202C' }}>
                  {preferences.map(id => LEARNING_PREFERENCES.find(p => p.id === id)?.label).filter(Boolean).join(', ')}
                </div>
              </div>
              <div style={{ marginBottom: additionalContext ? 12 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                  Your platforms
                </div>
                <div style={{ fontSize: 14, color: '#1A202C' }}>
                  {platforms.map(id => PLATFORMS.find(p => p.id === id)?.name).filter(Boolean).join(', ')}
                </div>
              </div>
              {additionalContext && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                    Additional context
                  </div>
                  <div style={{ fontSize: 14, color: '#1A202C', fontStyle: 'italic' }}>{additionalContext}</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#718096' }}>
              You can update these anytime from the chat using the Edit Profile button.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 28,
        }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                color: '#4A5568',
                cursor: 'pointer',
                fontFamily: FONT,
                padding: '8px 0',
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => canAdvance && setStep(s => s + 1)}
              disabled={!canAdvance}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: canAdvance ? '#38B2AC' : '#CBD5E0',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                fontFamily: FONT,
                transition: 'background 0.15s',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onComplete({ preferences, platforms, additionalContext })}
              style={{
                background: '#38B2AC',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 24,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'background 0.15s',
              }}
            >
              Start Learning &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningCoachSurvey;
