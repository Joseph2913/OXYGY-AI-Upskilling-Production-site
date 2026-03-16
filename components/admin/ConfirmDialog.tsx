import React, { useRef, useEffect } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title, message, confirmLabel, confirmVariant, onConfirm, onCancel, isLoading,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onCancel]);

  const btnBg = confirmVariant === 'danger' ? '#E53E3E' : '#48BB78';

  return (
    <div ref={ref} style={{
      background: '#FFFFFF', borderRadius: 12, padding: 20, maxWidth: 360,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.5 }}>
        {message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px', borderRadius: 24,
            border: '1px solid #E2E8F0', background: '#FFFFFF',
            color: '#4A5568', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            padding: '8px 16px', borderRadius: 24,
            border: 'none', background: btnBg, color: '#FFFFFF',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
