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

const statChip: React.CSSProperties = {
  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '8px 14px', textAlign: 'center', flex: 1,
};

interface Props {
  content: ArtefactContent;
}

const WorkflowContent: React.FC<Props> = ({ content }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {content.workflowName && (
      <div>
        <div style={sectionLabel}>Workflow</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{content.workflowName}</div>
      </div>
    )}

    {content.summary && (
      <div>
        <div style={sectionLabel}>Summary</div>
        <div style={contentBox}>{content.summary}</div>
      </div>
    )}

    <div style={{ display: 'flex', gap: 12 }}>
      <div style={statChip}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{content.nodeCount ?? 0}</div>
        <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>Nodes</div>
      </div>
      <div style={statChip}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{content.agentCount ?? 0}</div>
        <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>Agents</div>
      </div>
      <div style={statChip}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{content.humanCheckpoints ?? 0}</div>
        <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>Human checks</div>
      </div>
    </div>

    {content.nodes && content.nodes.length > 0 && (
      <div>
        <div style={sectionLabel}>Pipeline Steps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {content.nodes.map((node, i) => (
            <div key={i} style={{ fontSize: 13, color: '#4A5568', display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#A0AEC0', minWidth: 18 }}>{i + 1}.</span>
              <span>{node.name}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {content.designMarkdown && (
      <div>
        <div style={sectionLabel}>Workflow Design</div>
        <div
          style={{
            ...contentBox, maxHeight: 300, overflowY: 'auto', whiteSpace: 'normal',
            fontFamily: "'DM Sans', sans-serif",
          }}
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(content.designMarkdown) }}
        />
      </div>
    )}
  </div>
);

export default WorkflowContent;