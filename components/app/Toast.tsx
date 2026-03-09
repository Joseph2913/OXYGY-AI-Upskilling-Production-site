import React, { useEffect, useState, useCallback, useRef } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastIdCounter = 0;
let globalAddToast: ((message: string, type?: 'success' | 'error') => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  globalAddToast?.(message, type);
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 2500);
    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'error' ? '#FED7D7' : '#C6F6D5',
            color: toast.type === 'error' ? '#9B2C2C' : '#22543D',
            border: `1px solid ${toast.type === 'error' ? '#FEB2B2' : '#9AE6B4'}`,
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            animation: 'toastSlideIn 0.2s ease-out',
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};