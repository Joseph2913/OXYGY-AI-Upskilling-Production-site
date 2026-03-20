import React from 'react';
import { Target, Image, Lightbulb, TrendingUp } from 'lucide-react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';
import { calculateTier } from '../../../../lib/scoring';
import type { TierInfo } from '../../../../lib/scoring';

const FONT = "'DM Sans', sans-serif";

const DIM_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  brief_alignment: Target,
  evidence_quality: Image,
  reflection_depth: Lightbulb,
  impact: TrendingUp,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  strong: { label: 'Strong', color: '#065F46' },
  developing: { label: 'Developing', color: '#92400E' },
  needs_attention: { label: 'Needs Attention', color: '#DC2626' },
};

const TierBadgeSmall: React.FC<{ tierInfo: TierInfo }> = ({ tierInfo }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', borderRadius: 10,
    background: tierInfo.color,
    border: `1.5px solid ${tierInfo.darkColor}30`,
  }}>
    <span style={{ fontSize: 20, fontWeight: 900, color: tierInfo.darkColor, fontFamily: FONT }}>
      {tierInfo.tier}
    </span>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: tierInfo.darkColor, fontFamily: FONT }}>
        {tierInfo.label}
      </div>
      <div style={{ fontSize: 10, color: '#718096', fontFamily: FONT }}>
        {tierInfo.points}/{tierInfo.maxPoints} pts
      </div>
    </div>
  </div>
);

const ProjectProofContent: React.FC<{ content: ArtefactContent; level?: number }> = ({ content, level }) => {
  const dims = (content.reviewDimensions || []) as Array<{
    id: string; name: string; status: 'strong' | 'developing' | 'needs_attention'; feedback: string;
  }>;
  const tierInfo = dims.length > 0 ? calculateTier(dims) : null;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Tier + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {tierInfo && <TierBadgeSmall tierInfo={tierInfo} />}
        {content.toolName && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>{content.toolName as string}</div>
            {content.platformUsed && (
              <div style={{ fontSize: 12, color: '#718096' }}>Built on {content.platformUsed as string}</div>
            )}
          </div>
        )}
      </div>

      {/* Link */}
      {content.toolLink && (
        <div style={{ marginBottom: 16 }}>
          <a href={content.toolLink as string} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#38B2AC', textDecoration: 'underline' }}>
            {content.toolLink as string}
          </a>
        </div>
      )}

      {/* Reflection */}
      {content.reflectionText && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
            Reflection
          </div>
          <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>
            {content.reflectionText as string}
          </div>
        </div>
      )}

      {/* Adoption + Outcome */}
      {content.adoptionScope && (
        <div style={{ marginBottom: 6, fontSize: 12, color: '#718096' }}>
          Adoption: <span style={{ fontWeight: 600, color: '#4A5568' }}>{content.adoptionScope as string}</span>
        </div>
      )}
      {content.outcomeText && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
            Impact
          </div>
          <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>
            {content.outcomeText as string}
          </div>
        </div>
      )}

      {/* Case study sections (L5) */}
      {content.caseStudyProblem && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F7FAFC', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 4 }}>Problem</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{content.caseStudyProblem as string}</div>
        </div>
      )}
      {content.caseStudySolution && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F7FAFC', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 4 }}>Solution</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{content.caseStudySolution as string}</div>
        </div>
      )}
      {content.caseStudyOutcome && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F7FAFC', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 4 }}>Outcome</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{content.caseStudyOutcome as string}</div>
        </div>
      )}
      {content.caseStudyLearnings && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F7FAFC', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 4 }}>Learnings</div>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{content.caseStudyLearnings as string}</div>
        </div>
      )}

      {/* Dimension feedback */}
      {dims.length > 0 && (
        <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12 }}>
            Reviewer Feedback
          </div>
          {dims.map((dim) => {
            const Icon = DIM_ICONS[dim.id] || Target;
            const st = STATUS_LABELS[dim.status] || STATUS_LABELS.developing;
            return (
              <div key={dim.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Icon size={13} color="#718096" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{dim.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color, marginLeft: 'auto' }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginLeft: 21 }}>
                  {dim.feedback}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {content.reviewSummary && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#F7FAFC', borderRadius: 10 }}>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
            {content.reviewSummary as string}
          </div>
          {content.reviewEncouragement && (
            <div style={{ fontSize: 12, color: '#38B2AC', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
              {content.reviewEncouragement as string}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectProofContent;
