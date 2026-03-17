import React, { useRef, useCallback } from 'react';

interface WordCountFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  helperText?: string;
  guidingPrompt?: string;
  minWords: number;
  minHeight?: number;
  accentDark: string;
  disabled?: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const WordCountField: React.FC<WordCountFieldProps> = ({
  value,
  onChange,
  label,
  helperText,
  guidingPrompt,
  minWords,
  minHeight = 120,
  accentDark,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = countWords(value);
  const meetsMinimum = wordCount >= minWords;

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    onChange(el.value);
  }, [onChange]);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
        {label}
      </div>
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
      <div style={{
        fontSize: 11, fontWeight: 500, marginTop: 4, textAlign: 'right' as const,
        color: meetsMinimum ? accentDark : '#A0AEC0',
        transition: 'color 0.15s',
      }}>
        {wordCount} / {minWords} words{meetsMinimum ? ' ✓' : ''}
      </div>
    </div>
  );
};
