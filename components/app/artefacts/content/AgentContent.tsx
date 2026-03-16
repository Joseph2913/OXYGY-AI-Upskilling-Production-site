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

const AgentContent: React.FC<Props> = ({ content }) => {
  const systemPrompt = content.systemPrompt || content.persona || '';
  const hasOutputFormat = !!content.outputFormat;
  const hasAccountability = content.accountability && content.accountability.length > 0;
  const hasReadiness = typeof content.readinessScore === 'number';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {hasReadiness && (
        <div>
          <div style={sectionLabel}>Readiness Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid ${content.readinessScore! >= 70 ? '#48BB78' : content.readinessScore! >= 40 ? '#ED8936' : '#FC8181'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#1A202C',
            }}>
              {content.readinessScore}
            </div>
            <span style={{ fontSize: 13, color: '#718096' }}>
              {content.readinessScore! >= 70 ? 'Good candidate for automation' :
               content.readinessScore! >= 40 ? 'Moderate — review constraints' : 'Low — consider manual process'}
            </span>
          </div>
        </div>
      )}

      {content.taskDescription && (
        <div>
          <div style={sectionLabel}>Task</div>
          <div style={{ fontSize: 13, color: '#4A5568' }}>{content.taskDescription}</div>
        </div>
      )}

      {/* Legacy persona field — only show if no taskDescription */}
      {!content.taskDescription && content.persona && (
        <div>
          <div style={sectionLabel}>Persona</div>
          <div style={contentBox}>{content.persona}</div>
        </div>
      )}

      <div>
        <div style={sectionLabel}>System Prompt</div>
        <div style={{ ...contentBox, fontFamily: "'DM Mono', 'Courier New', monospace", maxHeight: 280, overflowY: 'auto' }}>
          {systemPrompt || 'No system prompt'}
        </div>
      </div>

      {hasOutputFormat && content.outputFormat?.json_template && (
        <div>
          <div style={sectionLabel}>Output Format</div>
          <pre style={{
            ...contentBox, fontFamily: "'DM Mono', 'Courier New', monospace",
            fontSize: 12, maxHeight: 200, overflowY: 'auto',
          }}>
            {JSON.stringify(content.outputFormat.json_template, null, 2)}
          </pre>
        </div>
      )}

      {hasAccountability && (
        <div>
          <div style={sectionLabel}>Accountability Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {content.accountability!.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#4A5568' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: a.severity === 'critical' ? '#FFF5F5' : a.severity === 'important' ? '#FFFBEB' : '#F0FFF4',
                  color: a.severity === 'critical' ? '#C53030' : a.severity === 'important' ? '#C05621' : '#276749',
                  whiteSpace: 'nowrap',
                }}>
                  {a.severity}
                </span>
                <span>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAccountability && content.constraints && content.constraints.length > 0 && (
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
};

export default AgentContent;
