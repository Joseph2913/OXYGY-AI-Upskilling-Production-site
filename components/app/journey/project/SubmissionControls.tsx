import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface SubmissionControlsProps {
  status: 'draft' | 'submitted' | 'passed' | 'needs_revision' | null;
  isValid: boolean;
  saving: boolean;
  savedAt: number | null;
  submittedAt: number | null;
  onSubmit: () => Promise<void>;
  accentColor: string;
  accentDark: string;
}

export const SubmissionControls: React.FC<SubmissionControlsProps> = ({
  status,
  isValid,
  saving,
  savedAt,
  submittedAt,
  onSubmit,
  accentColor,
  accentDark,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Show "Draft saved" indicator briefly after save
  useEffect(() => {
    if (savedAt) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2300);
      return () => clearTimeout(t);
    }
  }, [savedAt]);

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
    setShowConfirm(false);
  };

  // Post-submission: show completion card
  if (status === 'passed') {
    const dateStr = submittedAt
      ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(submittedAt)
      : '';
    return (
      <div style={{
        background: `${accentColor}12`,
        border: `1px solid ${accentColor}`,
        borderRadius: 12,
        padding: '16px 20px',
        textAlign: 'center' as const,
        animation: 'fadeSlideUp 0.3s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={20} color={accentDark} />
          <span style={{ fontSize: 14, fontWeight: 600, color: accentDark }}>
            Project complete — this has been recorded on your learning journey.
          </span>
        </div>
        {dateStr && (
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
            Submitted on {dateStr}
          </div>
        )}
        <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  const isDraft = !status || status === 'draft';
  if (!isDraft) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      marginTop: 4,
    }}>
      {/* Left: auto-save indicator */}
      <div style={{ minHeight: 20 }}>
        {showSaved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: '#A0AEC0',
            animation: 'saveFade 2.5s ease both',
          }}>
            <Check size={12} color="#A0AEC0" />
            Draft saved ✓
          </div>
        )}
        <style>{`
          @keyframes saveFade {
            0% { opacity: 0; }
            10% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>

      {/* Right: submit button + confirmation */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <button
          onClick={() => isValid && setShowConfirm(true)}
          disabled={!isValid}
          title={!isValid ? 'Complete all required fields to submit' : undefined}
          style={{
            background: isValid ? '#38B2AC' : '#E2E8F0',
            color: isValid ? '#FFFFFF' : '#A0AEC0',
            border: 'none',
            borderRadius: 24,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => { if (isValid) e.currentTarget.style.background = '#2D9E99'; }}
          onMouseLeave={(e) => { if (isValid) e.currentTarget.style.background = '#38B2AC'; }}
        >
          Submit for Review
        </button>

        {showConfirm && (
          <div style={{
            background: '#F7FAFC',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            marginTop: 10,
            maxWidth: 400,
          }}>
            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginBottom: 12 }}>
              Once submitted, your project will be reviewed. You'll receive feedback shortly, and you can edit and resubmit if needed.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                style={{
                  background: '#38B2AC',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {submitting ? 'Submitting…' : 'Confirm & Submit'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#718096',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
