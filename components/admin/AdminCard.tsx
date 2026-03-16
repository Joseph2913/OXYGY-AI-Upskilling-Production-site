import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}

const AdminCard: React.FC<AdminCardProps> = ({ children, padding = '24px', style }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding,
    ...style,
  }}>
    {children}
  </div>
);

export default AdminCard;
