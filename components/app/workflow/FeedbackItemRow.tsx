import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FeedbackItem {
  id: string;
  nodeId: string;
  nodeName: string;
  severity: 'blocking' | 'advisory';
  message: string;
}

interface FeedbackItemRowProps {
  item: FeedbackItem;
  onApply: (itemId: string) => void;
  onDispute: (itemId: string, disputeText: string) => Promise<{ outcome: 'concede' | 'maintain'; response: string }>;
  onDismiss: (itemId: string) => void;
  isDisputeOpen: boolean;
  onOpenDispute: (itemId: string) => void;
}

type RowState =
  | { kind: 'pending' }
  | { kind: 'applied' }
  | { kind: 'dispute-input' }
  | { kind: 'dispute-loading' }
  | { kind: 'resolved-concede'; response: string }
  | { kind: 'resolved-maintain'; response: string }
  | { kind: 'overridden' };

const FONT: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const FeedbackItemRow: React.FC<FeedbackItemRowProps> = ({
  item,
  onApply,
  onDispute,
  onDismiss,
  isDisputeOpen,
  onOpenDispute,
}) => {
  const [state, setState] = useState<RowState>({ kind: 'pending' });
  const [disputeText, setDisputeText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBlocking = item.severity === 'blocking';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [disputeText]);

  // Sync external isDisputeOpen prop with internal state
  useEffect(() => {
    if (isDisputeOpen && state.kind === 'pending') {
      setState({ kind: 'dispute-input' });
    }
    if (!isDisputeOpen && state.kind === 'dispute-input') {
      setState({ kind: 'pending' });
      setDisputeText('');
    }
  }, [isDisputeOpen, state.kind]);

  const handleApply = useCallback(() => {
    onApply(item.id);
    setState({ kind: 'applied' });
  }, [onApply, item.id]);

  const handleOpenDispute = useCallback(() => {
    onOpenDispute(item.id);
  }, [onOpenDispute, item.id]);

  const handleCancelDispute = useCallback(() => {
    setState({ kind: 'pending' });
    setDisputeText('');
  }, []);

  const handleSendDispute = useCallback(async () => {
    if (!disputeText.trim()) return;
    setState({ kind: 'dispute-loading' });
    try {
      const result = await onDispute(item.id, disputeText.trim());
      if (result.outcome === 'concede') {
        setState({ kind: 'resolved-concede', response: result.response });
      } else {
        setState({ kind: 'resolved-maintain', response: result.response });
      }
    } catch {
      // On error, return to input so user can retry
      setState({ kind: 'dispute-input' });
    }
    setDisputeText('');
  }, [onDispute, item.id, disputeText]);

  const handleDismissAnyway = useCallback(() => {
    onDismiss(item.id);
    setState({ kind: 'overridden' });
  }, [onDismiss, item.id]);

  // --- Container styles per state ---

  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...FONT,
      borderRadius: 12,
      padding: '16px 20px',
      transition: 'background 0.2s, border-color 0.2s',
    };

    switch (state.kind) {
      case 'applied':
      case 'resolved-concede':
        return {
          ...base,
          background: '#F0FFF4',
          border: '1px solid #9AE6B4',
          borderLeft: '4px solid #48BB78',
        };
      case 'resolved-maintain':
        return {
          ...base,
          background: '#FFFFF0',
          border: '1px solid #D69E2E44',
        };
      case 'overridden':
        return {
          ...base,
          background: '#F7FAFC',
          border: '1px solid #E2E8F0',
        };
      default:
        return isBlocking
          ? { ...base, background: '#FFFFF0', border: '1px solid #D69E2E44' }
          : { ...base, background: '#F7FAFC', border: '1px solid #E2E8F0' };
    }
  };

  // --- Badge ---

  const renderBadge = () => {
    const pillBase: React.CSSProperties = {
      ...FONT,
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: '18px',
      padding: '1px 8px',
      borderRadius: 999,
      color: '#fff',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    };

    if (state.kind === 'applied') {
      return (
        <span style={{ ...FONT, fontSize: 12, fontWeight: 600, color: '#38A169', whiteSpace: 'nowrap', flexShrink: 0 }}>
          &#10003; Applied
        </span>
      );
    }

    if (state.kind === 'resolved-concede') {
      return (
        <span style={{ ...FONT, fontSize: 12, fontWeight: 600, color: '#38A169', whiteSpace: 'nowrap', flexShrink: 0 }}>
          &#10003; Resolved
        </span>
      );
    }

    if (state.kind === 'overridden') {
      return (
        <span style={{ ...pillBase, background: '#A0AEC0' }}>
          Overridden
        </span>
      );
    }

    // Default severity badge
    return (
      <span
        style={{
          ...pillBase,
          background: isBlocking ? '#D69E2E' : '#A0AEC0',
        }}
      >
        {isBlocking ? 'Blocking' : 'Advisory'}
      </span>
    );
  };

  // --- Spinner ---

  const Spinner = () => (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: '2px solid #E2E8F0',
        borderTopColor: '#38B2AC',
        borderRadius: '50%',
        animation: 'feedbackRowSpin 0.6s linear infinite',
        marginRight: 8,
        verticalAlign: 'middle',
      }}
    />
  );

  // --- Render ---

  return (
    <>
      {/* Keyframes for spinner */}
      <style>{`@keyframes feedbackRowSpin { to { transform: rotate(360deg); } }`}</style>

      <div style={getContainerStyle()}>
        {/* Header row: badge + node name + message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ marginTop: 1 }}>{renderBadge()}</div>
          <div style={{ ...FONT, fontSize: 13, color: '#2D3748', lineHeight: '20px' }}>
            <span style={{ fontWeight: 600 }}>{item.nodeName}</span>
            <span style={{ margin: '0 6px', color: '#CBD5E0' }}>&mdash;</span>
            <span style={{ fontWeight: 400 }}>{item.message}</span>
          </div>
        </div>

        {/* Action buttons — only in pending state */}
        {state.kind === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <button
              onClick={handleApply}
              style={{
                ...FONT,
                fontSize: 12,
                fontWeight: 500,
                color: '#4A5568',
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '5px 14px',
                cursor: 'pointer',
                lineHeight: '18px',
              }}
            >
              Apply suggestion
            </button>
            <button
              onClick={handleOpenDispute}
              style={{
                ...FONT,
                fontSize: 12,
                fontWeight: 500,
                color: '#718096',
                background: 'none',
                border: 'none',
                padding: '5px 6px',
                cursor: 'pointer',
                lineHeight: '18px',
              }}
            >
              I disagree &rarr;
            </button>
          </div>
        )}

        {/* Dispute input */}
        {state.kind === 'dispute-input' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...FONT, fontSize: 11, fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>
              Responding to AI feedback
            </div>
            <textarea
              ref={textareaRef}
              rows={2}
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              placeholder="Tell the AI why you disagree or what context it's missing..."
              style={{
                ...FONT,
                width: '100%',
                fontSize: 13,
                color: '#2D3748',
                background: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '8px 12px',
                resize: 'none',
                outline: 'none',
                lineHeight: '20px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <button
                onClick={handleSendDispute}
                disabled={!disputeText.trim()}
                style={{
                  ...FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  background: disputeText.trim() ? '#38B2AC' : '#A0AEC0',
                  border: 'none',
                  borderRadius: 999,
                  padding: '5px 16px',
                  cursor: disputeText.trim() ? 'pointer' : 'default',
                  lineHeight: '18px',
                  transition: 'background 0.15s',
                }}
              >
                Send &rarr;
              </button>
              <button
                onClick={handleCancelDispute}
                style={{
                  ...FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#718096',
                  background: 'none',
                  border: 'none',
                  padding: '5px 6px',
                  cursor: 'pointer',
                  lineHeight: '18px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dispute loading */}
        {state.kind === 'dispute-loading' && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
            <Spinner />
            <span style={{ ...FONT, fontSize: 12, color: '#718096' }}>AI is reconsidering&hellip;</span>
          </div>
        )}

        {/* Resolved — AI concedes */}
        {state.kind === 'resolved-concede' && (
          <div
            style={{
              marginTop: 12,
              background: '#E6FFFA',
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <span style={{ ...FONT, fontSize: 11, fontWeight: 700, color: '#1A7A76' }}>AI response: </span>
            <span style={{ ...FONT, fontSize: 13, color: '#2D3748', lineHeight: '20px' }}>{state.response}</span>
          </div>
        )}

        {/* Resolved — AI maintains */}
        {state.kind === 'resolved-maintain' && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                background: '#FFFBEB',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <span style={{ ...FONT, fontSize: 11, fontWeight: 700, color: '#D69E2E' }}>AI maintains: </span>
              <span style={{ ...FONT, fontSize: 13, color: '#2D3748', lineHeight: '20px' }}>{state.response}</span>
            </div>
            <button
              onClick={handleDismissAnyway}
              style={{
                ...FONT,
                fontSize: 11,
                fontWeight: 500,
                color: '#718096',
                background: 'none',
                border: 'none',
                padding: '6px 0 0 0',
                cursor: 'pointer',
                lineHeight: '16px',
              }}
            >
              Dismiss anyway
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackItemRow;
