import React from 'react';
import { BookOpen } from 'lucide-react';

interface OutputActionsPanelProps {
  workflowName: string;
  fullMarkdown: string;
  onSaveToArtefacts: () => void;
  isSaved: boolean;
}

const FONT: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const OutputActionsPanel: React.FC<OutputActionsPanelProps> = ({
  onSaveToArtefacts,
  isSaved,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...FONT }}>
      {/* Save to Library banner */}
      <div
        style={{
          background: '#F7FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={20} color="#38B2AC" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', ...FONT }}>
              Save to Artefacts
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2, ...FONT }}>
              Your Build Guide will be saved and accessible from your artefacts.
            </div>
          </div>
        </div>
        <button
          onClick={onSaveToArtefacts}
          disabled={isSaved}
          style={{
            background: isSaved ? '#E2E8F0' : '#38B2AC',
            color: isSaved ? '#A0AEC0' : '#fff',
            border: 'none',
            borderRadius: 99,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: isSaved ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...FONT,
          }}
        >
          {isSaved ? '✓ Saved' : 'Save to Artefacts →'}
        </button>
      </div>
    </div>
  );
};

export default OutputActionsPanel;
