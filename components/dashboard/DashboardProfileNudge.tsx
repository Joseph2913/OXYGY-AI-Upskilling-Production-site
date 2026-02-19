import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getUiPreferences, upsertUiPreferences } from '../../lib/database';
import { DEFAULT_PROFILE } from '../../data/dashboard-content';
import type { UserProfile } from '../../data/dashboard-types';

interface Props {
  onNavigateToProfile: () => void;
}

export const DashboardProfileNudge: React.FC<Props> = ({ onNavigateToProfile }) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [dismissed, setDismissed] = useState(true); // default hidden until loaded
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getProfile(userId),
      getUiPreferences(userId),
    ]).then(([profileData, prefs]) => {
      if (profileData) setProfile(profileData);
      setDismissed(prefs?.profile_nudge_dismissed ?? false);
    });
  }, [userId]);

  // Profile is considered complete if the core LP Generator fields are filled
  // (fullName is optional — it's only set via the dashboard profile form)
  const isProfileIncomplete = !profile.role || !profile.function || !profile.seniority || !profile.aiExperience || !profile.ambition;

  if (dismissed || !isProfileIncomplete) return null;

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      setDismissed(true);
      if (userId) upsertUiPreferences(userId, { profile_nudge_dismissed: true });
    }, 150);
  };

  const handleGoToPathway = () => {
    window.location.hash = '#learning-pathway';
  };

  return (
    <div
      style={{
        background: '#E6FFFA',
        border: '1px solid #38B2AC',
        borderRadius: 8,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 0 24px 0',
        opacity: fading ? 0 : 1,
        transition: 'opacity 150ms ease',
        flexWrap: 'wrap',
      }}
    >
      <p style={{ flex: 1, margin: 0, fontSize: 14, color: '#2D3748', lineHeight: 1.5 }}>
        You haven't completed your profile yet. A complete profile generates your personalised learning plan.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={onNavigateToProfile}
          style={{
            background: 'none',
            border: 'none',
            color: '#38B2AC',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            padding: 0,
          }}
        >
          Complete Profile
        </button>
        <span style={{ color: '#CBD5E0' }}>|</span>
        <button
          onClick={handleGoToPathway}
          style={{
            background: 'none',
            border: 'none',
            color: '#38B2AC',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            padding: 0,
          }}
        >
          Generate Learning Plan →
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: '#718096',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
