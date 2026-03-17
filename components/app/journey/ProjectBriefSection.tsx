import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectSubmission } from '../../../lib/database';

interface ProjectBriefSectionProps {
  level: number;
  isLocked: boolean;
  projectTitle: string | null;
  deliverable: string | null;
  projectSubmission: ProjectSubmission | null;
  accentColor: string;
  accentDark: string;
}

type ProjectStatus = 'not-started' | 'draft' | 'submitted' | 'passed' | 'needs_revision';

function getProjectStatus(sub: ProjectSubmission | null): ProjectStatus {
  if (!sub) return 'not-started';
  return sub.status;
}

const STATUS_STYLES: Record<ProjectStatus, { bg: string; border: string; color: string; label: string }> = {
  'not-started': { bg: '#F7FAFC', border: '1px solid #E2E8F0', color: '#A0AEC0', label: 'Not Started' },
  'draft': { bg: '#FEFCE8', border: '1px solid #FDE68A', color: '#92400E', label: 'Draft Saved' },
  'submitted': { bg: '#F0FFFC', border: '1px solid #A8F0E0', color: '#1A6B5F', label: 'Submitted' },
  'passed': { bg: '', border: '', color: '', label: 'Completed ✓' },
  'needs_revision': { bg: '#FFF7ED', border: '1px solid #FDBA74', color: '#9A3412', label: 'Needs Revision' },
};

const CTA_CONFIG: Record<ProjectStatus, { text: string; style: 'secondary' | 'link' | 'amber' }> = {
  'not-started': { text: 'Start Project →', style: 'secondary' },
  'draft': { text: 'Continue Project →', style: 'secondary' },
  'submitted': { text: 'View Submission →', style: 'link' },
  'passed': { text: 'View Submission →', style: 'link' },
  'needs_revision': { text: 'View Feedback →', style: 'amber' },
};

// Level-specific soft background tints
const LEVEL_BG_TINTS: Record<number, string> = {
  1: 'rgba(168, 240, 224, 0.10)',  // light teal
  2: 'rgba(247, 232, 164, 0.12)',  // light yellow
  3: 'rgba(56, 178, 172, 0.08)',   // light green
  4: 'rgba(245, 184, 160, 0.10)',  // light pink
  5: 'rgba(195, 208, 245, 0.12)',  // light blue
};

export const ProjectBriefSection: React.FC<ProjectBriefSectionProps> = ({
  level,
  isLocked,
  projectTitle,
  deliverable,
  projectSubmission,
  accentColor,
  accentDark,
}) => {
  const navigate = useNavigate();
  const status = getProjectStatus(projectSubmission);
  const bgTint = LEVEL_BG_TINTS[level] || 'rgba(0,0,0,0.02)';

  // Text aligns with the title above: 42px circle + 14px gap = 56px left indent
  const textIndent = 56;

  // Locked state
  if (isLocked) {
    return (
      <div>
        <div style={{
          height: 1,
          background: `linear-gradient(to right, ${accentColor}44, ${accentColor}15)`,
          marginTop: 10,
        }} />
        <div style={{
          background: bgTint,
          borderRadius: 10,
          padding: '14px 18px 14px',
          marginTop: 10,
          paddingLeft: textIndent,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#CBD5E0',
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4,
          }}>
            YOUR PROJECT
          </div>
          <div style={{ fontSize: 12, color: '#A0AEC0', lineHeight: 1.5 }}>
            Complete Level {level - 1} to unlock your project brief.
          </div>
        </div>
      </div>
    );
  }

  // No project assigned
  if (!projectTitle) {
    return (
      <div>
        <div style={{
          height: 1,
          background: `linear-gradient(to right, ${accentColor}44, ${accentColor}15)`,
          marginTop: 10,
        }} />
        <div style={{
          background: bgTint,
          borderRadius: 10,
          padding: '14px 18px 14px',
          marginTop: 10,
          paddingLeft: textIndent,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: accentDark,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4,
          }}>
            YOUR PROJECT
          </div>
          <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>
            No project assigned for this level.
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = status === 'passed'
    ? { bg: `${accentColor}22`, border: `1px solid ${accentColor}`, color: accentDark, label: 'Completed ✓' }
    : STATUS_STYLES[status];

  const ctaConfig = CTA_CONFIG[status];

  return (
    <div>
      {/* Divider line — gradient from accent to transparent */}
      <div style={{
        height: 1,
        background: `linear-gradient(to right, ${accentColor}44, ${accentColor}15)`,
        marginTop: 10,
      }} />

      {/* Project brief content with tinted background */}
      <div style={{
        background: bgTint,
        borderRadius: 10,
        padding: '14px 18px 14px',
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Left side: project info — indented to align with level title text */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: textIndent - 18 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: accentDark,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4,
          }}>
            YOUR PROJECT
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 2,
            lineHeight: 1.4,
          }}>
            {projectTitle}
          </div>
          {deliverable && (
            <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>
              {deliverable}
            </div>
          )}
        </div>

        {/* Right side: status badge + CTA stacked */}
        <div style={{
          display: 'flex', flexDirection: 'column' as const,
          alignItems: 'flex-end', gap: 8, flexShrink: 0,
        }}>
          {/* Status badge */}
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 16,
            background: statusStyle.bg,
            border: statusStyle.border,
            color: statusStyle.color,
            whiteSpace: 'nowrap',
          }}>
            {statusStyle.label}
          </span>

          {/* CTA */}
          {ctaConfig.style === 'link' ? (
            <span
              onClick={(e) => { e.stopPropagation(); navigate(`/app/journey/project/${level}`); }}
              style={{
                color: accentDark, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {ctaConfig.text}
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/app/journey/project/${level}`); }}
              style={{
                border: ctaConfig.style === 'amber' ? '1px solid #F59E0B' : `1px solid ${accentDark}`,
                color: ctaConfig.style === 'amber' ? '#92400E' : accentDark,
                background: 'transparent',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'nowrap',
              }}
            >
              {ctaConfig.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
