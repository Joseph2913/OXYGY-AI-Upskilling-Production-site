import React from 'react';
import { FileText, Lightbulb } from 'lucide-react';
import type { ProjectBrief } from '../../../hooks/useProjectData';

interface ProjectBriefCardProps {
  level: number;
  levelName: string;
  brief: ProjectBrief;
  accentDark: string;
}

export const ProjectBriefCard: React.FC<ProjectBriefCardProps> = ({
  level,
  levelName,
  brief,
  accentDark,
}) => {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #E2E8F0',
      borderLeft: `4px solid ${accentDark}`,
      padding: '24px 28px',
      marginBottom: 20,
    }}>
      {/* Level badge */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: accentDark,
        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
      }}>
        LEVEL {level} — {levelName}
      </div>

      {/* Project title */}
      <div style={{
        fontSize: 20, fontWeight: 800, color: '#1A202C', marginTop: 8,
      }}>
        {brief.projectTitle}
      </div>

      {/* Project description */}
      <div style={{
        fontSize: 14, color: '#4A5568', lineHeight: 1.6, marginTop: 8,
      }}>
        {brief.projectDescription}
      </div>

      {/* Deliverable row */}
      {brief.deliverable && (
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <FileText size={14} color={accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>Deliverable: </span>
            <span style={{ fontSize: 13, color: '#4A5568' }}>{brief.deliverable}</span>
          </div>
        </div>
      )}

      {/* Challenge connection */}
      {brief.challengeConnection && (
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <Lightbulb size={14} color={accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{
            fontSize: 13, color: '#718096', fontStyle: 'italic', lineHeight: 1.5,
          }}>
            {brief.challengeConnection}
          </div>
        </div>
      )}
    </div>
  );
};
