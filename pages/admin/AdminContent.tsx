import React from 'react';
import ContentCoverageSummary from '../../components/admin/content/ContentCoverageSummary';
import ContentLevelAccordion from '../../components/admin/content/ContentLevelAccordion';

const AdminContent: React.FC = () => {
  return (
    <div style={{ padding: '28px 36px', maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', margin: '0 0 4px' }}>
        Content Registry
      </h1>
      <p style={{ fontSize: 14, color: '#718096', margin: '0 0 24px' }}>
        Overview of all learning content across levels.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ContentCoverageSummary />
        <ContentLevelAccordion />
      </div>
    </div>
  );
};

export default AdminContent;
