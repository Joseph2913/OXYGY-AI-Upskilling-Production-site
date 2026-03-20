import React from 'react';
import { CheckCircle, AlertCircle, ArrowUpRight, Lock } from 'lucide-react';
import { DimensionRow } from './DimensionRow';
import type { ReviewDimension } from './DimensionRow';
import { calculateTier, getImprovementHint, requiresRevision } from '../../../../lib/scoring';
import type { TierInfo } from '../../../../lib/scoring';

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
  onConfirmSubmission?: () => void;
  showResubmit: boolean;
  isConfirmed?: boolean;
  previousTier?: string | null;
}

const FONT = "'DM Sans', sans-serif";

/* ── Tier Badge ── */
const TierBadge: React.FC<{ tierInfo: TierInfo }> = ({ tierInfo }) => {
  const isS = tierInfo.tier === 'S';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: tierInfo.color,
        border: isS ? '3px solid #F59E0B' : `3px solid ${tierInfo.darkColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isS ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none',
        position: 'relative' as const,
      }}>
        <span style={{
          fontSize: 32, fontWeight: 900, color: tierInfo.darkColor,
          fontFamily: FONT, lineHeight: 1,
        }}>
          {tierInfo.tier}
        </span>
        {isS && (
          <div style={{ position: 'absolute' as const, top: -4, right: -4, fontSize: 16 }}>
            ✦
          </div>
        )}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: tierInfo.darkColor,
        fontFamily: FONT, textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
      }}>
        {tierInfo.label}
      </div>
      <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
        {tierInfo.points} / {tierInfo.maxPoints} points
      </div>
    </div>
  );
};

/* ── Score Bar with R, C, B, A, S markers ── */
const ScoreBar: React.FC<{ tierInfo: TierInfo }> = ({ tierInfo }) => {
  const pct = (tierInfo.points / tierInfo.maxPoints) * 100;
  const markers = [
    { pct: 0, label: 'R', minPts: 0 },
    { pct: (6 / 12) * 100, label: 'C', minPts: 6 },
    { pct: (8 / 12) * 100, label: 'B', minPts: 8 },
    { pct: (10 / 12) * 100, label: 'A', minPts: 10 },
    { pct: 100, label: 'S', minPts: 12 },
  ];

  return (
    <div style={{ width: '100%', marginTop: 4 }}>
      {/* Bar */}
      <div style={{
        width: '100%', height: 6, borderRadius: 3,
        background: '#EDF2F7', overflow: 'hidden',
        position: 'relative' as const,
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(to right, ${tierInfo.darkColor}80, ${tierInfo.darkColor})`,
          width: `${pct}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      {/* Markers */}
      <div style={{ position: 'relative' as const, height: 18, marginTop: 2 }}>
        {markers.map(m => {
          const isActive = tierInfo.points >= m.minPts;
          const isCurrent = m.label === tierInfo.tier;
          return (
            <div key={m.label} style={{
              position: 'absolute' as const,
              left: m.pct === 0 ? '0%' : `${m.pct}%`,
              transform: m.pct === 0 ? 'none' : 'translateX(-50%)',
              fontSize: isCurrent ? 10 : 9,
              fontWeight: isCurrent ? 800 : 700,
              color: isCurrent ? tierInfo.darkColor : isActive ? '#718096' : '#CBD5E0',
              fontFamily: FONT,
            }}>
              {m.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ReviewScorecard: React.FC<ReviewScorecardProps> = ({
  review,
  reviewedAt,
  accentColor,
  accentDark,
  onEditResubmit,
  onConfirmSubmission,
  showResubmit,
  isConfirmed,
  previousTier,
}) => {
  const tierInfo = calculateTier(review.dimensions);
  const hint = getImprovementHint(review.dimensions, tierInfo);
  const isR = requiresRevision(tierInfo.tier);
  const dateStr = reviewedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(reviewedAt)
    : '';

  const improved = previousTier && previousTier !== tierInfo.tier;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: `1px solid ${accentColor}`,
      padding: '28px 28px 24px',
      animation: 'scorecardFade 0.4s ease both',
    }}>
      {/* Top section: badge + score bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28,
        paddingBottom: 20,
        borderBottom: '1px solid #EDF2F7',
        marginBottom: 20,
      }}>
        <TierBadge tierInfo={tierInfo} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>
            Review Feedback
          </div>
          {dateStr && (
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>
              Reviewed on {dateStr}
            </div>
          )}
          {improved && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 8, padding: '4px 10px', borderRadius: 12,
              background: '#D1FAE5', fontSize: 12, fontWeight: 600, color: '#065F46',
              fontFamily: FONT,
            }}>
              <ArrowUpRight size={12} /> Improved from {previousTier} → {tierInfo.tier}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <ScoreBar tierInfo={tierInfo} />
          </div>
        </div>
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

      {/* Summary + encouragement */}
      <div style={{
        borderTop: '1px solid #E2E8F0',
        paddingTop: 16,
        marginTop: 8,
        animation: 'dimFadeIn 0.3s ease 320ms both',
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A202C', lineHeight: 1.6, fontFamily: FONT }}>
          {review.summary}
        </div>
        <div style={{
          fontSize: 13, color: accentDark, fontStyle: 'italic',
          marginTop: 8, lineHeight: 1.5, fontFamily: FONT,
        }}>
          {review.encouragement}
        </div>
      </div>

      {/* ── R-Tier: Must revise ── */}
      {isR && (
        <div style={{
          marginTop: 16, padding: '16px 20px', borderRadius: 12,
          background: '#FFF7ED', border: '1px solid #FDBA74',
          animation: 'bannerFade 0.3s ease 400ms both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} color="#F59E0B" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#9A3412', fontFamily: FONT }}>
                  Your score is below the minimum — please revise and resubmit
                </span>
              </div>
              {hint && (
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 6, fontFamily: FONT }}>
                  {hint}
                </div>
              )}
            </div>
            {showResubmit && onEditResubmit && (
              <button
                onClick={onEditResubmit}
                style={{
                  background: 'transparent', border: '1px solid #F59E0B',
                  color: '#92400E', borderRadius: 20, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT, whiteSpace: 'nowrap' as const,
                }}
              >
                Edit & Resubmit
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Non-R Tier: Confirm or Improve ── */}
      {!isR && !isConfirmed && (
        <div style={{
          marginTop: 16, padding: '16px 20px', borderRadius: 12,
          background: tierInfo.color, border: `1px solid ${tierInfo.darkColor}30`,
          animation: 'bannerFade 0.3s ease 400ms both',
        }}>
          {/* Hint text */}
          {hint && tierInfo.tier !== 'S' && (
            <div style={{ fontSize: 13, color: tierInfo.darkColor, marginBottom: 12, fontFamily: FONT, lineHeight: 1.5 }}>
              You scored <strong>{tierInfo.tier}</strong> — {hint}
            </div>
          )}
          {tierInfo.tier === 'S' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: tierInfo.darkColor, fontFamily: FONT }}>
                S-Tier achieved — exceptional work!
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
            {onConfirmSubmission && (
              <button
                onClick={onConfirmSubmission}
                style={{
                  background: accentDark, color: '#FFFFFF', border: 'none',
                  borderRadius: 20, padding: '10px 22px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <CheckCircle size={14} /> Confirm Submission
              </button>
            )}
            {showResubmit && onEditResubmit && tierInfo.tier !== 'S' && (
              <button
                onClick={onEditResubmit}
                style={{
                  background: 'transparent', border: `1px solid ${tierInfo.darkColor}40`,
                  color: tierInfo.darkColor, borderRadius: 20, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT, whiteSpace: 'nowrap' as const,
                }}
              >
                Improve to {tierInfo.nextTier}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Confirmed state ── */}
      {!isR && isConfirmed && (
        <div style={{
          marginTop: 16, padding: '16px 20px', borderRadius: 12,
          background: `${accentColor}12`, border: `1px solid ${accentColor}`,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'bannerFade 0.3s ease 400ms both',
        }}>
          <Lock size={16} color={accentDark} />
          <span style={{ fontSize: 14, fontWeight: 600, color: accentDark, fontFamily: FONT }}>
            Submission confirmed — saved to your artefacts and recorded on your learning journey.
          </span>
        </div>
      )}

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
