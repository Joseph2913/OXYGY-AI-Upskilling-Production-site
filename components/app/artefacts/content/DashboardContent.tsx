import React from 'react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';
import { simpleMarkdownToHtml } from '../../../../utils/markdownToHtml';

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

const DashboardContent: React.FC<Props> = ({ content }) => {
  const briefPurpose = content.brief && typeof content.brief === 'object'
    ? String((content.brief as Record<string, unknown>).q1_purpose || '')
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {briefPurpose && (
        <div>
          <div style={sectionLabel}>Brief</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
            {briefPurpose}
          </div>
        </div>
      )}

      {content.description && (
        <div>
          <div style={sectionLabel}>Description</div>
          <div style={contentBox}>{content.description}</div>
        </div>
      )}

      {typeof content.componentCount === 'number' && (
        <div>
          <div style={sectionLabel}>Components</div>
          <div style={{ fontSize: 13, color: '#4A5568' }}>
            {content.componentCount} components in this dashboard
          </div>
        </div>
      )}

      {content.mockupHtml && (
        <div>
          <div style={sectionLabel}>Mockup Preview</div>
          <div
            style={{
              ...contentBox, maxHeight: 300, overflowY: 'auto', whiteSpace: 'normal',
              fontFamily: "'DM Sans', sans-serif",
            }}
            dangerouslySetInnerHTML={{ __html: content.mockupHtml }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardContent;