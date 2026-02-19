import React, { useState } from 'react';
import { Loader2, Mail, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { signInWithMicrosoft, signInWithGoogle, signInWithEmail } from '../context/AuthContext';

/* Inline SVG logos */
const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4CAF50" d="M272,240h240V16c0-8.832-7.168-16-16-16H272V240z" />
    <path fill="#F44336" d="M240,240V0H16C7.168,0,0,7.168,0,16v224H240z" />
    <path fill="#2196F3" d="M240,272H0v224c0,8.832,7.168,16,16,16h224V272z" />
    <path fill="#FFC107" d="M272,272v240h224c8.832,0,16-7.168,16-16V272H272z" />
  </svg>
);

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FBBB00" d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256 c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456 C103.821,274.792,107.225,292.797,113.47,309.408z" />
    <path fill="#518EF8" d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451 c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535 c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" />
    <path fill="#28B446" d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512 c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771 c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" />
    <path fill="#F14336" d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012 c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0 C318.115,0,375.068,22.126,419.404,58.936z" />
  </svg>
);

type View = 'providers' | 'email' | 'email-sent';

interface AuthModalProps {
  /** When provided, the modal is used as a dismissible overlay (not a full-page gate). */
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [signingIn, setSigningIn] = useState(false);
  const [view, setView] = useState<View>('providers');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const isOverlay = !!onClose;

  const handleMicrosoft = async () => {
    setSigningIn(true);
    await signInWithMicrosoft();
  };

  const handleGoogle = async () => {
    setSigningIn(true);
    await signInWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setSigningIn(true);
    const { error } = await signInWithEmail(trimmed);
    setSigningIn(false);
    if (error) {
      setEmailError(error);
    } else {
      setView('email-sent');
    }
  };

  const handleBackHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOverlay) {
      onClose();
    } else {
      window.location.hash = '';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '12px 24px',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 600,
    cursor: signingIn ? 'not-allowed' : 'pointer',
    opacity: signingIn ? 0.6 : 1,
    transition: 'opacity 150ms ease, background-color 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  };

  const description = isOverlay
    ? 'To access features like generating a learning plan, tracking your progress, saving prompts, and logging application insights, please sign in or create an account.'
    : 'Create your personalised AI learning plan and track your progress across all five levels.';

  return (
    <div
      onClick={handleBackdropClick}
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
          position: 'relative',
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

        {/* Close button for overlay mode */}
        {isOverlay && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#A0AEC0',
              padding: 4,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease',
              zIndex: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#718096'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
          >
            <X size={20} />
          </button>
        )}

        {/* Content */}
        <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>

          {/* Provider Selection View */}
          {view === 'providers' && (
            <>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A202C' }}>
                {isOverlay ? 'Sign in to continue' : 'Sign in to continue'}
              </h2>
              <p style={{ margin: '12px auto 32px', fontSize: 14, color: '#718096', lineHeight: 1.6, maxWidth: 340 }}>
                {description}
              </p>

              {/* Microsoft button */}
              <button
                onClick={handleMicrosoft}
                disabled={signingIn}
                style={{ ...btnBase, border: 'none', backgroundColor: '#1A202C', color: '#FFFFFF' }}
                onMouseEnter={(e) => { if (!signingIn) e.currentTarget.style.backgroundColor = '#2D3748'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1A202C'; }}
              >
                {signingIn ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <MicrosoftLogo />}
                Continue with Microsoft
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                <span style={{ fontSize: 13, color: '#A0AEC0' }}>or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={signingIn}
                style={{ ...btnBase, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#1A202C' }}
                onMouseEnter={(e) => { if (!signingIn) e.currentTarget.style.backgroundColor = '#F7FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                {signingIn ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleLogo />}
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                <span style={{ fontSize: 13, color: '#A0AEC0' }}>or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              </div>

              {/* Email button */}
              <button
                onClick={() => setView('email')}
                disabled={signingIn}
                style={{ ...btnBase, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#1A202C' }}
                onMouseEnter={(e) => { if (!signingIn) e.currentTarget.style.backgroundColor = '#F7FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                <Mail size={16} />
                Continue with Email
              </button>
            </>
          )}

          {/* Email Input View */}
          {view === 'email' && (
            <>
              <button
                onClick={() => { setView('providers'); setEmailError(''); }}
                style={{
                  position: 'absolute',
                  top: 52,
                  left: 36,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#A0AEC0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  padding: 0,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#718096'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
              >
                <ArrowLeft size={14} />
                Back
              </button>

              <Mail size={32} color="#38B2AC" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A202C' }}>
                Sign in with Email
              </h2>
              <p style={{ margin: '12px auto 24px', fontSize: 14, color: '#718096', lineHeight: 1.6, maxWidth: 320 }}>
                We'll send a magic link to your email. Click it to sign in — no password needed.
              </p>

              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: emailError ? '1.5px solid #FC8181' : '1.5px solid #E2E8F0',
                    fontSize: 14,
                    color: '#1A202C',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { if (!emailError) e.currentTarget.style.borderColor = '#38B2AC'; }}
                  onBlur={(e) => { if (!emailError) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                />
                {emailError && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#E53E3E', textAlign: 'left' }}>
                    {emailError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={signingIn || !email.trim()}
                  style={{
                    ...btnBase,
                    marginTop: 16,
                    border: 'none',
                    backgroundColor: email.trim() ? '#38B2AC' : '#CBD5E0',
                    color: '#FFFFFF',
                    cursor: (signingIn || !email.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {signingIn ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={16} />}
                  Send Magic Link
                </button>
              </form>
            </>
          )}

          {/* Email Sent Confirmation View */}
          {view === 'email-sent' && (
            <>
              <CheckCircle2 size={40} color="#38B2AC" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A202C' }}>
                Check your email
              </h2>
              <p style={{ margin: '12px auto 24px', fontSize: 14, color: '#718096', lineHeight: 1.6, maxWidth: 320 }}>
                We've sent a sign-in link to <strong style={{ color: '#1A202C' }}>{email}</strong>. Click the link in the email to continue.
              </p>
              <button
                onClick={() => { setView('providers'); setEmail(''); }}
                style={{ ...btnBase, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#1A202C' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                Use a different method
              </button>
            </>
          )}

          {/* Bottom link */}
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
            onMouseEnter={(e) => { e.currentTarget.style.color = '#718096'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
          >
            {isOverlay ? 'Maybe later' : 'Back to homepage'}
          </a>
        </div>
      </div>
    </div>
  );
};
