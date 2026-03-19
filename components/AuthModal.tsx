// components/AuthModal.tsx — Full-page login view (renders at /login route)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { user, loading, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect param handling — check URL param first, then sessionStorage
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect')
    || sessionStorage.getItem('oxygy_auth_return_path')
    || '/app/dashboard';

  // If already signed in, redirect to intended path
  useEffect(() => {
    if (user && !loading) {
      sessionStorage.removeItem('oxygy_auth_return_path');
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate, redirectPath]);

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check for OAuth error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') || params.get('error_description')) {
      setError('Sign-in failed. Please try again.');
    }
  }, []);

  const handleGoogle = async () => {
    setSigningIn('google');
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
      setSigningIn(null);
    }
  };

  const handleMicrosoft = async () => {
    setSigningIn('microsoft');
    setError(null);
    try {
      await signInWithMicrosoft();
    } catch {
      setError('Sign-in failed. Please try again.');
      setSigningIn(null);
    }
  };

  if (loading) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
        flexDirection: 'column',
      }}
    >
      {/* Card */}
      <div
        style={{
          maxWidth: 400,
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        {/* OXYGY wordmark */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#1A202C',
            letterSpacing: -0.5,
            marginBottom: 32,
          }}
        >
          OXYGY
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#1A202C',
            marginBottom: 8,
            marginTop: 0,
            lineHeight: 1.3,
          }}
        >
          Sign in to your AI upskilling workspace
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: 14,
            color: '#718096',
            marginBottom: 32,
            marginTop: 0,
          }}
        >
          Continue with your work account
        </p>

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1px solid #FEB2B2',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13,
              color: '#C53030',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={signingIn !== null}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            color: '#2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: signingIn ? 'not-allowed' : 'pointer',
            marginBottom: 12,
            opacity: signingIn && signingIn !== 'google' ? 0.5 : 1,
            transition: 'background 0.15s, border-color 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!signingIn) {
              (e.currentTarget as HTMLElement).style.background = '#F7FAFC';
              (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E0';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
            (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
          }}
        >
          {signingIn === 'google' ? (
            <>
              <Spinner />
              Redirecting…
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Microsoft button */}
        <button
          onClick={handleMicrosoft}
          disabled={signingIn !== null}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            color: '#2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: signingIn ? 'not-allowed' : 'pointer',
            opacity: signingIn && signingIn !== 'microsoft' ? 0.5 : 1,
            transition: 'background 0.15s, border-color 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!signingIn) {
              (e.currentTarget as HTMLElement).style.background = '#F7FAFC';
              (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E0';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
            (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
          }}
        >
          {signingIn === 'microsoft' ? (
            <>
              <Spinner />
              Redirecting…
            </>
          ) : (
            <>
              <MicrosoftIcon />
              Continue with Microsoft
            </>
          )}
        </button>

        {/* Terms */}
        <p
          style={{
            fontSize: 12,
            color: '#A0AEC0',
            marginTop: 24,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          By signing in, you agree to OXYGY's Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Back to homepage link */}
      <a
        href="/"
        style={{
          marginTop: 20,
          fontSize: 13,
          color: '#718096',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = '#38B2AC';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = '#718096';
        }}
      >
        &larr; Back to homepage
      </a>

      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Inline SVG icons ──

const Spinner: React.FC = () => (
  <div
    style={{
      width: 14,
      height: 14,
      border: '2px solid #E2E8F0',
      borderTopColor: '#38B2AC',
      borderRadius: '50%',
      animation: 'auth-spin 0.7s linear infinite',
    }}
  />
);

const GoogleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);
