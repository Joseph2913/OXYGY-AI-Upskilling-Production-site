import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithMicrosoft, signInWithGoogle } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const [signingIn, setSigningIn] = useState(false);

  const handleMicrosoft = async () => {
    setSigningIn(true);
    await signInWithMicrosoft();
  };

  const handleGoogle = async () => {
    setSigningIn(true);
    await signInWithGoogle();
  };

  const handleBackHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(26, 32, 44, 0.8)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          margin: '0 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Teal accent bar */}
        <div style={{ height: 4, backgroundColor: '#38B2AC' }} />

        {/* Content */}
        <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>
          {/* Heading */}
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#1A202C',
            }}
          >
            Sign in to continue
          </h2>

          {/* Subheading */}
          <p
            style={{
              margin: '12px auto 32px',
              fontSize: 14,
              color: '#718096',
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            Create your personalised AI learning plan and track your progress across all five levels.
          </p>

          {/* Microsoft button */}
          <button
            onClick={handleMicrosoft}
            disabled={signingIn}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: 24,
              border: 'none',
              backgroundColor: '#1A202C',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: signingIn ? 'not-allowed' : 'pointer',
              opacity: signingIn ? 0.6 : 1,
              transition: 'opacity 150ms ease, background-color 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!signingIn) e.currentTarget.style.backgroundColor = '#2D3748';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A202C';
            }}
          >
            {signingIn && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            Continue with Microsoft
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '16px 0',
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: 13, color: '#A0AEC0' }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={signingIn}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: 24,
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#1A202C',
              fontSize: 14,
              fontWeight: 600,
              cursor: signingIn ? 'not-allowed' : 'pointer',
              opacity: signingIn ? 0.6 : 1,
              transition: 'opacity 150ms ease, background-color 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!signingIn) e.currentTarget.style.backgroundColor = '#F7FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            {signingIn && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            Continue with Google
          </button>

          {/* Back to homepage */}
          <a
            href="#"
            onClick={handleBackHome}
            style={{
              display: 'inline-block',
              marginTop: 24,
              fontSize: 13,
              color: '#A0AEC0',
              textDecoration: 'none',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#718096';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#A0AEC0';
            }}
          >
            Back to homepage
          </a>
        </div>
      </div>
    </div>
  );
};
