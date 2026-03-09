import React from 'react';
import { ChevronRight } from 'lucide-react';
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

const AgentContent: React.FC<Props> = ({ content }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <div style={sectionLabel}>Persona</div>
      <div style={contentBox}>{content.persona || 'No persona defined'}</div>
    </div>

    <div>
      <div style={sectionLabel}>System Prompt</div>
      <div style={{ ...contentBox, fontFamily: "'DM Mono', 'Courier New', monospace", maxHeight: 280, overflowY: 'auto' }}>
        {content.systemPrompt || 'No system prompt'}
      </div>
    </div>

    {content.constraints && content.constraints.length > 0 && (
      <div>
        <div style={sectionLabel}>Constraints</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {content.constraints.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 13, color: '#4A5568' }}>
              <ChevronRight size={12} style={{ marginTop: 3, flexShrink: 0 }} />
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default AgentContent;