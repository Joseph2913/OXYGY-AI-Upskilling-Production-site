import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  'Analysing your profile...',
  'Mapping your experience to the framework...',
  'Designing your projects...',
  'Calibrating difficulty levels...',
  'Finalising your pathway...',
];

interface SurveyProcessingProps {
  error: string | null;
  onRetry: () => void;
}

const SurveyProcessing: React.FC<SurveyProcessingProps> = ({ error, onRetry }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
      padding: 24, textAlign: 'center',
    }}>
      <style>{`
        @keyframes spProcessSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
        Generating your learning plan...
      </div>
      <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 4, marginBottom: 20 }}>
        This usually takes 15\u201320 seconds
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', maxWidth: 320, margin: '0 auto' }}>
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: idx > currentStep ? 0.3 : 1,
              transition: 'opacity 0.3s',
            }}>
              {isDone ? (
                <Check size={16} color="#38B2AC" strokeWidth={3} />
              ) : isActive ? (
                <Loader2 size={16} color="#38B2AC" style={{ animation: 'spProcessSpin 1s linear infinite' }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #E2E8F0' }} />
              )}
              <span style={{
                fontSize: 13, color: isDone ? '#38B2AC' : isActive ? '#1A202C' : '#A0AEC0',
                fontWeight: isActive ? 600 : 400,
              }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      {error && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, color: '#E53E3E', marginBottom: 12 }}>{error}</div>
          <button
            onClick={onRetry}
            style={{
              background: '#FFFFFF', color: '#38B2AC', border: '1px solid #38B2AC',
              borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyProcessing;
