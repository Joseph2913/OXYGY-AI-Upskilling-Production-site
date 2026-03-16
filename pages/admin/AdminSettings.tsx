import React, { useState } from 'react';
import AuditLogTab from '../../components/admin/settings/AuditLogTab';
import SystemTab from '../../components/admin/settings/SystemTab';
import FeatureFlagsTab from '../../components/admin/settings/FeatureFlagsTab';

const TABS = [
  { key: 'audit', label: 'Audit Log' },
  { key: 'system', label: 'System' },
  { key: 'flags', label: 'Feature Flags' },
] as const;

type TabKey = typeof TABS[number]['key'];

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('audit');

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: '0 0 20px' }}>
        Settings
      </h1>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', marginBottom: 24,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                fontSize: 13, fontWeight: 600,
                color: isActive ? '#38B2AC' : '#718096',
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid #38B2AC' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'audit' && <AuditLogTab />}
      {activeTab === 'system' && <SystemTab />}
      {activeTab === 'flags' && <FeatureFlagsTab />}
    </div>
  );
};

export default AdminSettings;
