import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    style={{
      width: 44, height: 24, borderRadius: 12, border: 'none',
      background: enabled ? '#38B2AC' : '#CBD5E0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s ease',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      position: 'absolute', top: 3,
      left: enabled ? 23 : 3,
      transition: 'left 0.2s ease',
    }} />
  </button>
);

export default ToggleSwitch;
