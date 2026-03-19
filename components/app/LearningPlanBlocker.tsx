import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';

interface LearningPlanBlockerProps {
  pageName: string;
}

const LearningPlanBlocker: React.FC<LearningPlanBlockerProps> = ({ pageName }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 54px - 80px)', textAlign: 'center', padding: 40,
      fontFamily: "'DM Sans', sans-serif",
      animation: 'lpBlockerFadeIn 0.3s ease both',
    }}>
      <style>{`
        @keyframes lpBlockerFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0',
        padding: '40px 48px', maxWidth: 480,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <Map size={40} color="#38B2AC" style={{ marginBottom: 16 }} />
        <div style={{
          fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 8,
        }}>
          Complete Your Learning Plan
        </div>
        <div style={{
          fontSize: 14, color: '#718096', lineHeight: 1.6, marginBottom: 24, maxWidth: 380,
        }}>
          The {pageName} will be available once you've completed the Learning Plan Generator.
          It takes about 2 minutes and creates a personalised pathway tailored to your role and goals.
        </div>
        <button
          onClick={() => navigate('/app/journey')}
          style={{
            background: '#38B2AC', color: '#FFFFFF', border: 'none',
            borderRadius: 24, padding: '12px 28px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2D9E99')}
          onMouseLeave={e => (e.currentTarget.style.background = '#38B2AC')}
        >
          Go to My Journey →
        </button>
      </div>
    </div>
  );
};

export default LearningPlanBlocker;
