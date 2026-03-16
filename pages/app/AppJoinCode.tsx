import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lookupCodeChannel, enrollUser, isChannelUsable } from '../../lib/enrollment';

const AppJoinCode: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !user) return;

    setSubmitting(true);
    setError('');

    const { channel } = await lookupCodeChannel(code);

    if (!channel) {
      setError('Invalid code. Please check and try again.');
      setSubmitting(false);
      return;
    }

    const { usable, reason } = isChannelUsable(channel);
    if (!usable) {
      setError(reason || 'This code is no longer valid.');
      setSubmitting(false);
      return;
    }

    const result = await enrollUser(user.id, channel);
    if (!result.success) {
      setError(result.error || 'Enrollment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    // Reload page to refresh AuthContext with new membership
    window.location.href = '/app/dashboard';
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%)',
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 480, width: '100%', background: '#FFFFFF', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
      }}>
        {/* Teal accent bar */}
        <div style={{ height: 4, background: '#38B2AC' }} />

        <div style={{ padding: '48px 40px 36px', textAlign: 'center' as const }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: '#38B2AC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#FFFFFF',
            }}>
              O
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.02em' }}>OXYGY</span>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', margin: '0 0 8px' }}>
            Enter your access code
          </h1>
          <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 340 }}>
            Your programme administrator should have given you a code to join your organisation.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="ABC-123"
              autoFocus
              style={{
                textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                padding: '14px 20px', border: `2px solid ${error ? '#FC8181' : '#E2E8F0'}`,
                borderRadius: 12, width: '100%', maxWidth: 320, boxSizing: 'border-box' as const,
                outline: 'none', fontFamily: "'DM Sans', sans-serif",
                display: 'block', margin: '0 auto',
              }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,178,172,0.1)'; }}
              onBlur={e => { if (!error) e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {error && (
              <div style={{ fontSize: 13, color: '#E53E3E', marginTop: 8 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !code.trim()}
              style={{
                width: '100%', padding: 14, borderRadius: 24,
                background: '#38B2AC', color: '#FFFFFF', fontSize: 15, fontWeight: 600,
                border: 'none', cursor: submitting ? 'wait' : 'pointer',
                fontFamily: "'DM Sans', sans-serif", marginTop: 20,
                opacity: submitting || !code.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? 'Joining...' : 'Join Programme \u2192'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#A0AEC0', marginTop: 24, lineHeight: 1.5 }}>
            Don't have a code? Contact your programme administrator.
          </p>

          <button
            onClick={signOut}
            style={{
              background: 'none', border: 'none', fontSize: 13,
              color: '#A0AEC0', cursor: 'pointer', marginTop: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#718096'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0AEC0'; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppJoinCode;
