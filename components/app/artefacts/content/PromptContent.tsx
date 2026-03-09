import React, { useState } from 'react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};

const contentBox: React.CSSProperties = {
  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
  padding: 16, fontSize: 13, color: '#1A202C', lineHeight: 1.7,
  fontFamily: "'DM Mono', 'Courier New', monospace", whiteSpace: 'pre-wrap',
  maxHeight: 320, overflowY: 'auto',
};

interface Props {
  content: ArtefactContent;
  onSave: (updated: ArtefactContent) => void;
}

const PromptContent: React.FC<Props> = ({ content, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(content.promptText || '');

  const handleSave = () => {
    onSave({ ...content, promptText: editText });
    setEditMode(false);
  };

  return (
    <div>
      <div style={sectionLabel}>Prompt</div>
      {editMode ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{
              ...contentBox,
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              minHeight: 200, outline: 'none', border: '1.5px solid #38B2AC',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{
                background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 20,
                padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Save changes
            </button>
            <button
              onClick={() => { setEditText(content.promptText || ''); setEditMode(false); }}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={contentBox}>{content.promptText || 'No prompt text'}</div>
          <button
            onClick={() => { setEditText(content.promptText || ''); setEditMode(true); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#38B2AC', padding: '8px 0',
              fontFamily: 'inherit',
            }}
          >
            Edit this prompt →
          </button>
        </>
      )}
    </div>
  );
};

export default PromptContent;