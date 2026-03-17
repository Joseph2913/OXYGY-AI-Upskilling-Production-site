import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  'Reading your reflection…',
  'Analysing your screenshots…',
  'Comparing against your project brief…',
  'Evaluating depth and impact…',
  'Preparing your feedback…',
];

interface ReviewProcessingProps {
  accentDark: string;
}

export const ReviewProcessing: React.FC<ReviewProcessingProps> = ({ accentDark }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      padding: 24,
      textAlign: 'center' as const,
      marginTop: 12,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
        Reviewing your submission...
      </div>
      <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 4, marginBottom: 20 }}>
        This usually takes 5–10 seconds
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: isDone || isActive ? 1 : 0.35,
              transition: 'opacity 0.3s ease',
            }}>
              {isDone ? (
                <Check size={16} color={accentDark} />
              ) : isActive ? (
                <div style={{
                  width: 16, height: 16,
                  border: `2px solid ${accentDark}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'reviewSpin 0.7s linear infinite',
                }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E2E8F0' }} />
              )}
              <span style={{
                fontSize: 13,
                color: isDone ? accentDark : isActive ? '#1A202C' : '#A0AEC0',
                fontWeight: isActive ? 600 : 400,
              }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes reviewSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
