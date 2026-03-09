import React, { useState } from 'react';
import { CheckCircle, XCircle, Wrench, MessageSquare } from 'lucide-react';

const KNOWLEDGE_CHECK = {
  question:
    'Which of the following best describes the purpose of a system prompt in an LLM interaction?',
  options: [
    'It controls the temperature and randomness of the model output',
    'It sets persistent instructions and behavioural context for the AI assistant',
    'It encrypts the conversation to protect user privacy',
    'It determines which language model version is used',
  ],
  correctIndex: 1,
  correctExplanation:
    "A system prompt provides persistent instructions that shape the assistant's behaviour, role, and constraints throughout the conversation.",
  incorrectExplanation:
    "The system prompt sets persistent instructions and behavioural context — it defines the assistant's role, constraints, and personality for the conversation.",
};

interface PractiseViewProps {
  accentColor: string;
  accentDark: string;
  onCompleteTopic: () => void;
}

const PractiseView: React.FC<PractiseViewProps> = ({ accentColor, accentDark, onCompleteTopic }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && selectedAnswer === KNOWLEDGE_CHECK.correctIndex;

  return (
    <div>
      {/* Hero section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`,
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Wrench size={20} color={accentColor} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
              Practise
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Apply what you've learned with exercises and knowledge checks
            </div>
          </div>
        </div>

        {/* Exercise prompt */}
        <div style={{ padding: 32 }}>
          <div
            style={{
              background: `${accentColor}10`,
              borderRadius: 14,
              border: `1px solid ${accentColor}33`,
              padding: '28px 32px',
              marginBottom: 28,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${accentColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={20} color={accentDark} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: accentDark,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                Exercise Prompt
              </div>
              <div style={{ fontSize: 15, color: '#1A202C', lineHeight: 1.7, fontWeight: 500 }}>
                Take a task you do regularly in your current role and write a prompt to help an AI
                assistant complete it. Use the RCTF framework (Role, Context, Task, Format) to
                structure your prompt, then test it mentally — would it produce a useful response?
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#718096',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                This exercise is self-assessed. Complete the knowledge check below to finish.
              </div>
            </div>
          </div>

          {/* Knowledge check */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '28px 32px',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Knowledge Check
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#1A202C',
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              {KNOWLEDGE_CHECK.question}
            </div>

            {/* Answer options */}
            {KNOWLEDGE_CHECK.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const showCorrect = submitted && idx === KNOWLEDGE_CHECK.correctIndex;
              const showIncorrect = submitted && isSelected && idx !== KNOWLEDGE_CHECK.correctIndex;

              let bg = '#FFFFFF';
              let border = '1px solid #E2E8F0';
              if (!submitted && isSelected) {
                bg = `${accentColor}18`;
                border = `1px solid ${accentColor}`;
              } else if (showCorrect) {
                bg = '#C6F6D5';
                border = '1px solid #48BB78';
              } else if (showIncorrect) {
                bg = '#FED7D7';
                border = '1px solid #FC8181';
              }

              return (
                <div
                  key={idx}
                  onClick={() => !submitted && setSelectedAnswer(idx)}
                  onMouseEnter={(e) => {
                    if (!submitted && !isSelected) {
                      (e.currentTarget as HTMLElement).style.background = '#F7FAFC';
                      (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitted && !isSelected) {
                      (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                      (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border,
                    background: bg,
                    marginBottom: 8,
                    cursor: submitted ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid #CBD5E0',
                      background: isSelected ? accentDark : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && !submitted && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: '#4A5568', flex: 1 }}>{option}</span>
                  {showCorrect && <CheckCircle size={18} color="#48BB78" />}
                  {showIncorrect && <XCircle size={18} color="#FC8181" />}
                </div>
              );
            })}

            {selectedAnswer !== null && !submitted && (
              <button
                onClick={() => setSubmitted(true)}
                style={{
                  background: '#1A202C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 20,
                  padding: '10px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Check answer
              </button>
            )}

            {submitted && (
              <div
                style={{
                  fontSize: 14,
                  marginTop: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: isCorrect ? '#F0FFF4' : '#FFF5F5',
                  color: isCorrect ? '#276749' : '#9B2C2C',
                  lineHeight: 1.6,
                }}
              >
                {isCorrect
                  ? `Correct! ${KNOWLEDGE_CHECK.correctExplanation}`
                  : `Not quite. ${KNOWLEDGE_CHECK.incorrectExplanation}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Topic button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onCompleteTopic}
          disabled={!submitted}
          onMouseEnter={(e) => {
            if (submitted) {
              (e.currentTarget as HTMLElement).style.background = accentDark;
              (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
            }
          }}
          onMouseLeave={(e) => {
            if (submitted) {
              (e.currentTarget as HTMLElement).style.background = accentColor;
              (e.currentTarget as HTMLElement).style.color = accentDark;
            }
          }}
          style={{
            background: submitted ? accentColor : '#E2E8F0',
            color: submitted ? accentDark : '#A0AEC0',
            border: 'none',
            borderRadius: 24,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: submitted ? 'pointer' : 'default',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Complete Topic →
        </button>
      </div>
    </div>
  );
};

export default PractiseView;
