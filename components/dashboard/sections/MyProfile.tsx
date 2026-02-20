import React, { useState, useEffect } from 'react';
import { Pencil, ArrowRight, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getProfile } from '../../../lib/database';
import {
  DEFAULT_PROFILE,
  AI_EXPERIENCE_OPTIONS,
  AMBITION_OPTIONS,
  AVAILABILITY_OPTIONS,
} from '../../../data/dashboard-content';
import type { UserProfile } from '../../../data/dashboard-types';

// ─── Helpers ───

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#A0AEC0',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#1A202C',
  fontWeight: 500,
  lineHeight: 1.5,
};

const emptyStyle: React.CSSProperties = {
  ...valueStyle,
  color: '#CBD5E0',
  fontStyle: 'italic',
};

function findOptionLabel(
  options: { id: string; label: string; emoji?: string }[],
  id: string,
): string {
  const opt = options.find((o) => o.id === id);
  return opt ? `${opt.emoji ? opt.emoji + ' ' : ''}${opt.label}` : '';
}

/** Truncate text to a character limit, respecting word boundaries */
function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > limit * 0.6 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

// ─── Main Component ───

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const MyProfile: React.FC<Props> = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [roleSummary, setRoleSummary] = useState('');
  const [roleExpanded, setRoleExpanded] = useState(false);
  const [challengeExpanded, setChallengeExpanded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getProfile(userId).then((data) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, [userId]);

  // Fetch AI-generated role summary when profile.role is long enough
  useEffect(() => {
    if (!profile.role || profile.role.length < 40) {
      // Short role text doesn't need summarization — use as-is
      setRoleSummary(profile.role);
      return;
    }

    let cancelled = false;

    fetch('/api/summarize-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: profile.role }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.summary) {
          setRoleSummary(data.summary);
        }
      })
      .catch(() => {
        // Fallback: use first sentence or truncated version
        if (!cancelled) {
          const firstSentence = profile.role.split(/[.!?]/)[0];
          setRoleSummary(firstSentence.length < 60 ? firstSentence : truncateText(profile.role, 50));
        }
      });

    return () => { cancelled = true; };
  }, [profile.role]);

  const isProfileComplete = !!(
    profile.role && profile.function && profile.seniority && profile.aiExperience && profile.ambition
  );

  const aiExpLabel = findOptionLabel(AI_EXPERIENCE_OPTIONS, profile.aiExperience);
  const ambitionLabel = findOptionLabel(AMBITION_OPTIONS, profile.ambition);
  const availabilityLabel = findOptionLabel(AVAILABILITY_OPTIONS, profile.availability);

  // Derive display name from profile or auth metadata
  const displayName = profile.fullName
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || '';

  const initials = displayName
    ? displayName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Role text is long enough to warrant collapse
  const ROLE_COLLAPSE_THRESHOLD = 120;
  const roleIsLong = profile.role.length > ROLE_COLLAPSE_THRESHOLD;
  const challengeIsLong = (profile.challenge?.length || 0) > ROLE_COLLAPSE_THRESHOLD;

  if (!loading && !isProfileComplete) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '48px 28px',
          textAlign: 'center',
        }}
      >
        <User size={48} color="#E2E8F0" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>
          No profile yet
        </div>
        <p style={{ fontSize: 14, color: '#718096', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Complete the Learning Plan Generator to set up your profile. Your answers will appear here as a summary.
        </p>
        <a
          href="#learning-pathway"
          className="dash-focus"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            borderRadius: 24,
            border: 'none',
            backgroundColor: '#38B2AC',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C9A94'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#38B2AC'; }}
        >
          Go to Learning Plan Generator <ArrowRight size={14} />
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* ── Header: avatar + name + AI-summarized role ── */}
      <div
        style={{
          padding: '24px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          {/* Avatar circle — matches Navbar style */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#38B2AC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C' }}>
              {displayName || 'Your Profile'}
            </div>
            {roleSummary && (
              <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
                {roleSummary}
              </div>
            )}
          </div>
        </div>
        <a
          href="#learning-pathway"
          className="dash-focus"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 24,
            border: '1px solid #1A202C',
            backgroundColor: 'transparent',
            color: '#1A202C',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background 150ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7FAFC'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Pencil size={13} />
          Edit Profile
        </a>
      </div>

      {/* ── Profile details ── */}
      <div style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', marginBottom: 24 }}>
          {/* Role — collapsible if long */}
          <div>
            <div style={labelStyle}>Role</div>
            {profile.role ? (
              <div>
                <div style={valueStyle}>
                  {roleIsLong && !roleExpanded
                    ? truncateText(profile.role, ROLE_COLLAPSE_THRESHOLD)
                    : profile.role}
                </div>
                {roleIsLong && (
                  <button
                    onClick={() => setRoleExpanded(!roleExpanded)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#38B2AC',
                      cursor: 'pointer',
                    }}
                  >
                    {roleExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown
                      size={12}
                      style={{
                        transform: roleExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 150ms ease',
                      }}
                    />
                  </button>
                )}
              </div>
            ) : (
              <div style={emptyStyle}>Not set</div>
            )}
          </div>

          <div>
            <div style={labelStyle}>Function</div>
            <div style={profile.function ? valueStyle : emptyStyle}>
              {profile.function === 'Other' ? profile.functionOther || 'Other' : profile.function || 'Not set'}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Seniority</div>
            <div style={profile.seniority ? valueStyle : emptyStyle}>{profile.seniority || 'Not set'}</div>
          </div>
          <div>
            <div style={labelStyle}>Availability</div>
            <div style={profile.availability ? valueStyle : emptyStyle}>{availabilityLabel || 'Not set'}</div>
          </div>
        </div>

        <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '14px 18px', marginBottom: 16, backgroundColor: '#F7FAFC' }}>
          <div style={labelStyle}>AI Experience</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A202C' }}>
            {aiExpLabel || <span style={emptyStyle}>Not set</span>}
          </div>
        </div>

        <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '14px 18px', marginBottom: 16, backgroundColor: '#F7FAFC' }}>
          <div style={labelStyle}>Ambition</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A202C' }}>
            {ambitionLabel || <span style={emptyStyle}>Not set</span>}
          </div>
        </div>

        {/* Challenge — collapsible if long */}
        {profile.challenge && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Your Challenge</div>
            <p style={{ ...valueStyle, fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>
              {challengeIsLong && !challengeExpanded
                ? truncateText(profile.challenge, ROLE_COLLAPSE_THRESHOLD)
                : profile.challenge}
            </p>
            {challengeIsLong && (
              <button
                onClick={() => setChallengeExpanded(!challengeExpanded)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#38B2AC',
                  cursor: 'pointer',
                }}
              >
                {challengeExpanded ? 'Show less' : 'Read more'}
                <ChevronDown
                  size={12}
                  style={{
                    transform: challengeExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 150ms ease',
                  }}
                />
              </button>
            )}
          </div>
        )}

        {profile.experienceDescription && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>AI Experience Description</div>
            <p style={{ ...valueStyle, fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>{profile.experienceDescription}</p>
          </div>
        )}
        {profile.goalDescription && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Goal</div>
            <p style={{ ...valueStyle, fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>{profile.goalDescription}</p>
          </div>
        )}

        <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, backgroundColor: '#E6FFFA', border: '1px solid #38B2AC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#2D3748', margin: 0, lineHeight: 1.5 }}>
            Want to update your answers or regenerate your learning plan?
          </p>
          <a href="#learning-pathway" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#38B2AC', textDecoration: 'none', flexShrink: 0 }}>
            Go to Learning Plan Generator <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
