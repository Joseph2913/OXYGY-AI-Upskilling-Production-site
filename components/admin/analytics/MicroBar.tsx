import React from 'react';

interface MicroBarProps {
  value: number;
  width?: number;
  height?: number;
}

const MicroBar: React.FC<MicroBarProps> = ({ value, width = 48, height = 4 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', minWidth: 36 }}>
      {value}%
    </span>
    <div style={{ width, height, borderRadius: height / 2, background: '#EDF2F7' }}>
      <div style={{
        width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: height / 2,
        background: value >= 50 ? '#48BB78' : value >= 25 ? '#ECC94B' : '#FC8181',
      }} />
    </div>
  </div>
);

export default MicroBar;
