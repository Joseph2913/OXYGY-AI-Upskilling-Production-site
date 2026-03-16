import React from 'react';

const AdminSectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
  }}>
    {text}
  </div>
);

export default AdminSectionLabel;
