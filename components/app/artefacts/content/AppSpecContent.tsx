import React from 'react';
import { LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS } from '../../../../data/levelTopics';
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
  level: number;
}

const AppSpecContent: React.FC<Props> = ({ content, level }) => {
  const accent = LEVEL_ACCENT_COLORS[level] || '#C3D0F5';
  const accentDark = LEVEL_ACCENT_DARK_COLORS[level] || '#2E3F8F';
  const specSummary = content.spec && typeof content.spec === 'object' && 'summary' in content.spec
    ? String((content.spec as Record<string, unknown>).summary)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionLabel}>Description</div>
        <div style={contentBox}>{content.description || 'No description'}</div>
      </div>

      {content.userTypes && content.userTypes.length > 0 && (
        <div>
          <div style={sectionLabel}>User Types</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {content.userTypes.map((ut) => (
              <span
                key={ut}
                style={{
                  background: `${accent}22`, color: accentDark,
                  borderRadius: 20, padding: '3px 10px', fontSize: 12,
                }}
              >
                {ut}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={sectionLabel}>Specification</div>
        {specSummary ? (
          <div style={contentBox}>{specSummary}</div>
        ) : (
          <div style={{ fontSize: 13, color: '#718096' }}>
            Full spec available — launch in App Builder to view
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSpecContent;