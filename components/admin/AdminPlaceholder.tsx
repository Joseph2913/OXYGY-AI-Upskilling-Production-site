import React from 'react';

interface AdminPlaceholderProps {
  page: string;
}

export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ page }) => {
  return (
    <div style={{
      padding: '48px 36px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        color: '#1A202C',
        marginBottom: 12,
        marginTop: 0,
      }}>
        {page}
      </h1>
      <p style={{
        fontSize: 15,
        color: '#718096',
        marginTop: 0,
      }}>
        This page will be built in PRD-11.
      </p>
    </div>
  );
};

export default AdminPlaceholder;
