import React, { useRef, useCallback } from 'react';

interface WordCountFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  helperText?: string;
  guidingPrompt?: string;
  minWords?: number;
  minHeight?: number;
  accentDark: string;
  disabled?: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Progress stages — each defines a threshold, bar color, nudge text, and a fill % */
const STAGES = [
  { minWords: 0,   maxWords: 19,  color: '#E2E8F0', nudge: '', pct: 0 },
  { minWords: 1,   maxWords: 19,  color: '#CBD5E0', nudge: 'Keep going — you\'re just getting started', pct: 15 },
  { minWords: 20,  maxWords: 49,  color: '#F6AD55', nudge: 'Good start — share a bit more about what you did', pct: 35 },
  { minWords: 50,  maxWords: 79,  color: '#F6AD55', nudge: 'Nice — a few more details would really strengthen this', pct: 55 },
  { minWords: 80,  maxWords: 99,  color: '#68D391', nudge: 'Looking good — just a little more to bring it all together', pct: 75 },
  { minWords: 100, maxWords: Infinity, color: '#38B2AC', nudge: 'Great detail', pct: 100 },
];

function getStage(wc: number) {
  if (wc === 0) return { color: '#E2E8F0', nudge: '', pct: 0 };
  for (const s of STAGES) {
    if (wc >= s.minWords && wc <= s.maxWords) return s;
  }
  return STAGES[STAGES.length - 1];
}

export const WordCountField: React.FC<WordCountFieldProps> = ({
  value,
  onChange,
  label,
  helperText,
  guidingPrompt,
  minHeight = 120,
  accentDark,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = countWords(value);
  const stage = getStage(wordCount);

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    onChange(el.value);
  }, [onChange]);

  return (
    <div>
      {label && (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
          {label}
        </div>
      )}
      {helperText && (
        <div style={{ fontSize: 12, color: '#718096', marginBottom: 10 }}>
          {helperText}
        </div>
      )}
      {guidingPrompt && (
        <div style={{
          fontSize: 13, color: '#A0AEC0', fontStyle: 'italic', lineHeight: 1.5,
          marginBottom: 12, padding: '12px 16px', background: '#F7FAFC', borderRadius: 8,
        }}>
          {guidingPrompt}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        disabled={disabled}
        style={{
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 14,
          color: '#1A202C',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'border-color 0.15s, box-shadow 0.15s',
          resize: 'none',
          minHeight,
          overflow: 'hidden',
          lineHeight: 1.6,
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#38B2AC';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 178, 172, 0.1)';
          e.currentTarget.style.outline = 'none';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Progress bar + nudge */}
      {wordCount > 0 && (
        <div style={{ marginTop: 6 }}>
          {/* Bar track */}
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            background: '#EDF2F7', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: stage.color,
              width: `${stage.pct}%`,
              transition: 'width 0.4s ease, background 0.4s ease',
            }} />
          </div>
          {/* Nudge text */}
          {stage.nudge && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 5,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: stage.color,
                fontFamily: "'DM Sans', sans-serif",
                minWidth: 32,
              }}>
                {wordCount}w
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500, color: '#718096',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.2s',
              }}>
                {stage.nudge}
              </span>
              {stage.pct === 100 && (
                <span style={{ fontSize: 11, color: '#38B2AC' }}>✓</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
