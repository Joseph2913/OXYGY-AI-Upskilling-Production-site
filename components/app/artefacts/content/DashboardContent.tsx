import React from 'react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};

const contentBox: React.CSSProperties = {
  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
  padding: 16, fontSize: 13, color: '#1A202C', lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
};

interface Props {
  content: ArtefactContent;
}

const DashboardContent: React.FC<Props> = ({ content }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <div style={sectionLabel}>Description</div>
      <div style={contentBox}>{content.description || 'No description'}</div>
    </div>

    <div>
      <div style={sectionLabel}>Components</div>
      <div style={{ fontSize: 13, color: '#4A5568' }}>
        {content.componentCount ?? 0} components in this dashboard
      </div>
    </div>
  </div>
);

export default DashboardContent;