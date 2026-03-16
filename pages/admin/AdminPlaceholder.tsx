import React from 'react';
import { Users, BookOpen, Settings } from 'lucide-react';

const PAGE_CONFIG: Record<string, { icon: React.FC<{ size?: number; color?: string }>; desc: string }> = {
  Users: { icon: Users, desc: 'Manage platform users and roles. Coming in PRD-13.' },
  Content: { icon: BookOpen, desc: 'Manage programme content and resources. Coming in PRD-15.' },
  Settings: { icon: Settings, desc: 'Configure platform settings and feature flags. Coming in PRD-15.' },
};

interface Props {
  page: string;
  comingIn?: string;
}

const AdminPlaceholder: React.FC<Props> = ({ page, comingIn }) => {
  const config = PAGE_CONFIG[page] || { icon: Settings, desc: `This page will be built in ${comingIn || 'a future PRD'}.` };
  const Icon = config.icon;

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: '0 0 24px' }}>
        {page}
      </h1>
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
          <Icon size={20} color="#A0AEC0" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
          {page} Management
        </div>
        <div style={{ fontSize: 13, color: '#A0AEC0', maxWidth: 400, margin: '0 auto' }}>
          {config.desc}
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
