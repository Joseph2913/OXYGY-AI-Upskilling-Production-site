import React, { useState } from 'react';

interface AdminInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  type?: string;
}

const AdminInput: React.FC<AdminInputProps> = ({
  label, value, onChange, placeholder, required, helper, error, type = 'text',
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 600,
        color: '#2D3748', marginBottom: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label} {required && <span style={{ color: '#E53E3E' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1px solid ${error ? '#E53E3E' : focused ? '#38B2AC' : '#E2E8F0'}`,
          borderRadius: 10, fontSize: 13, color: '#2D3748', background: '#FFFFFF',
          fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(56, 178, 172, 0.1)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />
      {helper && !error && (
        <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>{helper}</div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
};

export default AdminInput;
