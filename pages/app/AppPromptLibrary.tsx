import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Library } from 'lucide-react';

const AppPromptLibrary: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      padding: '28px 36px', background: '#F7FAFC', minHeight: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/app/toolkit')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: '#718096',
          padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} /> Back to Toolkit
      </button>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: '#A8F0E055',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          📚
        </div>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: '#1A202C',
            letterSpacing: '-0.3px', margin: 0,
          }}>
            Prompt Library
          </h1>
          <p style={{ fontSize: 13, color: '#718096', margin: 0, marginTop: 3 }}>
            Level 1 · Fundamentals · Library
          </p>
        </div>
      </div>

      {/* Content area */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid #E2E8F0', padding: '40px 36px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: '#A8F0E022', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Library size={28} color="#1A6B5F" />
        </div>
        <h2 style={{
          fontSize: 18, fontWeight: 700, color: '#1A202C', margin: 0, marginBottom: 8,
        }}>
          Your Prompt Library
        </h2>
        <p style={{
          fontSize: 14, color: '#718096', lineHeight: 1.6,
          maxWidth: 420, margin: '0 auto 24px',
        }}>
          Save prompts from the Prompt Playground and organise them by use case, function, and topic. Your library grows with your career.
        </p>
        <button
          onClick={() => navigate('/app/toolkit/prompt-playground')}
          style={{
            background: '#A8F0E0', color: '#1A6B5F', border: 'none',
            borderRadius: 24, padding: '10px 22px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Go to Prompt Playground →
        </button>
      </div>
    </div>
  );
};

export default AppPromptLibrary;
