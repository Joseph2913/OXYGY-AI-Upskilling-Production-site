import React from 'react';

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
    padding: '48px 24px', textAlign: 'center' as const,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: '#F7FAFC', border: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px',
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: '#A0AEC0', maxWidth: 400, margin: '0 auto' }}>
      {description}
    </div>
    {action && (
      <button
        onClick={action.onClick}
        style={{
          marginTop: 16, padding: '9px 18px', borderRadius: 24,
          border: 'none', background: '#38B2AC', color: '#FFFFFF',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

export default AdminEmptyState;
