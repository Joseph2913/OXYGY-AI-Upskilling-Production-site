import React from 'react';

const OPTIONS = [
  { value: 'just-me', label: 'Just me' },
  { value: 'immediate-team', label: 'My team' },
  { value: 'wider-department', label: 'Wider department' },
  { value: 'organisation-wide', label: 'Organisation-wide' },
];

interface AdoptionPillsProps {
  value: string | null;
  onChange: (value: string) => void;
  accentColor: string;
  accentDark: string;
  disabled?: boolean;
}

export const AdoptionPills: React.FC<AdoptionPillsProps> = ({
  value,
  onChange,
  accentColor,
  accentDark,
  disabled = false,
}) => {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
        Who benefited from this?
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              style={{
                borderRadius: 24,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: selected ? 600 : 400,
                border: selected ? `1px solid ${accentColor}` : '1px solid #E2E8F0',
                background: selected ? `${accentColor}22` : 'transparent',
                color: selected ? accentDark : '#4A5568',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'DM Sans', sans-serif",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
