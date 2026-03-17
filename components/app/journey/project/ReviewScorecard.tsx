import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { DimensionRow } from './DimensionRow';
import type { ReviewDimension } from './DimensionRow';

export interface ReviewData {
  dimensions: ReviewDimension[];
  overallPassed: boolean;
  summary: string;
  encouragement: string;
}

interface ReviewScorecardProps {
  review: ReviewData;
  reviewedAt: number | null;
  accentColor: string;
  accentDark: string;
  onEditResubmit?: () => void;
  showResubmit: boolean;
}

export const ReviewScorecard: React.FC<ReviewScorecardProps> = ({
  review,
  reviewedAt,
  accentColor,
  accentDark,
  onEditResubmit,
  showResubmit,
}) => {
  const dateStr = reviewedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(reviewedAt)
    : '';

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: `1px solid ${accentColor}`,
      padding: '24px 28px',
      marginBottom: 20,
      animation: 'scorecardFade 0.4s ease both',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C' }}>
          Review Feedback
        </div>
        {dateStr && (
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2 }}>
            Reviewed on {dateStr}
          </div>
        )}
      </div>

      {/* Dimension rows */}
      {review.dimensions.map((dim, i) => (
        <DimensionRow
          key={dim.id}
          dimension={dim}
          accentColor={accentColor}
          accentDark={accentDark}
          isLast={i === review.dimensions.length - 1}
          animDelay={80 * (i + 1)}
        />
      ))}

      {/* Summary section */}
      <div style={{
        borderTop: '1px solid #E2E8F0',
        paddingTop: 16,
        marginTop: 8,
        animation: 'dimFadeIn 0.3s ease 320ms both',
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A202C', lineHeight: 1.6 }}>
          {review.summary}
        </div>
        <div style={{
          fontSize: 13, color: accentDark, fontStyle: 'italic',
          marginTop: 8, lineHeight: 1.5,
        }}>
          {review.encouragement}
        </div>
      </div>

      {/* Result banner */}
      <div style={{ marginTop: 16, animation: 'bannerFade 0.3s ease 400ms both' }}>
        {review.overallPassed ? (
          <div style={{
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <CheckCircle size={20} color={accentDark} />
            <span style={{ fontSize: 14, fontWeight: 600, color: accentDark }}>
              Project complete — this has been recorded on your learning journey.
            </span>
          </div>
        ) : (
          <div style={{
            background: '#FFF7ED',
            border: '1px solid #FDBA74',
            borderRadius: 12,
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={20} color="#F59E0B" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#9A3412' }}>
                  One or more areas need attention
                </span>
              </div>
              {showResubmit && onEditResubmit && (
                <button
                  onClick={onEditResubmit}
                  style={{
                    background: 'transparent',
                    border: '1px solid #F59E0B',
                    color: '#92400E',
                    borderRadius: 20,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Edit & Resubmit
                </button>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 8 }}>
              Review the feedback above, then update your submission. You can resubmit as many times as needed.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scorecardFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dimFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerFade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
