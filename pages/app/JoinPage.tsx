import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Clock, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { lookupLinkChannel, isChannelUsable, enrollUser } from '../../lib/enrollment';
import { supabase } from '../../lib/supabase';

type PageState = 'loading' | 'join' | 'enrolling' | 'success' | 'not_found' | 'expired' | 'maxed' | 'inactive' | 'error';

const JoinPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [state, setState] = useState<PageState>('loading');
  const [orgName, setOrgName] = useState('');
  const [channelData, setChannelData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load channel info on mount
  useEffect(() => {
    if (!slug) { setState('not_found'); return; }
    loadChannel(slug);
  }, [slug]);

  // Auto-enroll if user is already signed in and channel is loaded
  useEffect(() => {
    if (authLoading || !user || !channelData || state !== 'join') return;
    handleEnroll();
  }, [user, authLoading, channelData, state]);

  async function loadChannel(s: string) {
    const { channel } = await lookupLinkChannel(s);
    if (!channel) { setState('not_found'); return; }

    const org = channel.organisations as Record<string, unknown> | null;
    setOrgName((org?.name as string) || 'Organisation');
    setChannelData(channel);

    const { usable, reason } = isChannelUsable(channel);
    if (!usable) {
      if (reason?.includes('expired')) setState('expired');
      else if (reason?.includes('limit')) setState('maxed');
      else setState('inactive');
      return;
    }

    setState('join');
  }

  async function handleEnroll() {
    if (!user || !channelData) return;
    setState('enrolling');

    const result = await enrollUser(user.id, channelData as Parameters<typeof enrollUser>[1]);
    if (result.success) {
      setState('success');
      // Full reload to refresh AuthContext with new membership
      setTimeout(() => { window.location.href = '/app/dashboard'; }, 1500);
    } else {
      setErrorMsg(result.error || 'Enrollment failed.');
      setState('error');
    }
  }

  function handleSignIn(provider: 'google' | 'microsoft') {
    // Store enrollment context so AuthContext can pick it up after redirect
    if (slug) sessionStorage.setItem('oxygy_enrollment_channel', slug);
    if (provider === 'google') signInWithGoogle();
    else signInWithMicrosoft();
  }

  // ── Render ──

  const card: React.CSSProperties = {
    maxWidth: 480, width: '100%', background: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  };

  const shell: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%)',
    padding: 24, fontFamily: "'DM Sans', sans-serif",
  };

  // Loading
  if (state === 'loading' || authLoading) {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ height: 4, background: '#38B2AC' }} />
          <div style={{ padding: '48px 40px', textAlign: 'center' as const }}>
            <div style={{
              width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
              borderRadius: '50%', animation: 'join-spin 0.7s linear infinite', margin: '0 auto 16px',
            }} />
            <style>{`@keyframes join-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#2D3748' }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (state === 'not_found' || state === 'expired' || state === 'maxed' || state === 'inactive') {
    const errorInfo: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
      not_found: { icon: <AlertCircle size={32} color="#E53E3E" />, title: 'Link Not Found', desc: 'This invite link doesn\'t exist. Check the URL and try again.' },
      expired: { icon: <Clock size={32} color="#DD6B20" />, title: 'Link Expired', desc: 'This invite link has expired. Contact your programme administrator for a new one.' },
      maxed: { icon: <UserX size={32} color="#DD6B20" />, title: 'Link Full', desc: 'This invite link has reached its capacity. Contact your programme administrator.' },
      inactive: { icon: <AlertCircle size={32} color="#A0AEC0" />, title: 'Link Inactive', desc: 'This invite link is no longer active. Contact your programme administrator.' },
    };
    const info = errorInfo[state];
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ height: 4, background: state === 'not_found' ? '#E53E3E' : '#DD6B20' }} />
          <div style={{ padding: '48px 40px', textAlign: 'center' as const }}>
            <div style={{ marginBottom: 16 }}>{info.icon}</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', margin: '0 0 8px' }}>{info.title}</h1>
            <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, margin: 0 }}>{info.desc}</p>
          </div>
        </div>
      </div>
    );
  }

  // Enrolling / Success
  if (state === 'enrolling' || state === 'success') {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ height: 4, background: '#38B2AC' }} />
          <div style={{ padding: '48px 40px', textAlign: 'center' as const }}>
            {state === 'enrolling' ? (
              <>
                <div style={{
                  width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
                  borderRadius: '50%', animation: 'join-spin 0.7s linear infinite', margin: '0 auto 16px',
                }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#2D3748' }}>Joining {orgName}...</div>
              </>
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#C6F6D5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 24, color: '#22543D',
                }}>
                  &#10003;
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', margin: '0 0 8px' }}>
                  Welcome to {orgName}!
                </h1>
                <p style={{ fontSize: 14, color: '#718096' }}>Redirecting to your dashboard...</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error during enrollment
  if (state === 'error') {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ height: 4, background: '#E53E3E' }} />
          <div style={{ padding: '48px 40px', textAlign: 'center' as const }}>
            <AlertCircle size={32} color="#E53E3E" style={{ marginBottom: 16 }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', margin: '0 0 8px' }}>Unable to Join</h1>
            <p style={{ fontSize: 14, color: '#718096', marginBottom: 20 }}>{errorMsg}</p>
            <button
              onClick={() => { setState('join'); handleEnroll(); }}
              style={{
                background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 24,
                padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main join page (state === 'join', user not signed in)
  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ height: 4, background: '#38B2AC' }} />
        <div style={{ padding: '48px 40px', textAlign: 'center' as const }}>
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
            Join {orgName}
          </h1>
          <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 340 }}>
            Sign in to join your organisation's AI upskilling programme.
          </p>

          {/* Auth buttons */}
          <button
            onClick={() => handleSignIn('google')}
            style={{
              width: '100%', maxWidth: 320, padding: '12px 20px', borderRadius: 24,
              border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 14, fontWeight: 600, color: '#2D3748', margin: '0 auto 12px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <button
            onClick={() => handleSignIn('microsoft')}
            style={{
              width: '100%', maxWidth: 320, padding: '12px 20px', borderRadius: 24,
              border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 14, fontWeight: 600, color: '#2D3748', margin: '0 auto',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
            Continue with Microsoft
          </button>

          <p style={{ fontSize: 13, color: '#A0AEC0', marginTop: 24, lineHeight: 1.5 }}>
            By signing in, you'll be added to {orgName}'s programme.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
