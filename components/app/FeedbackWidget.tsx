import React, { useState, useRef, useCallback } from 'react';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

type TabType = 'bug' | 'feedback';

const FEEDBACK_CATEGORIES = [
  'General',
  'Section-specific',
  'Feature request',
  'Content / learning material',
  'Performance',
  'Other',
];

const ALLOWED_ORG = 'Oxygy Consulting';

export const FeedbackWidget: React.FC = () => {
  const { orgName, loading: orgLoading } = useOrg();
  const { user } = useAuth();
  const { userProfile } = useAppContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabType>('bug');
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshot = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setScreenshot(compressed);
        setScreenshotName(file.name);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Only show for Oxygy Consulting org members
  if (orgLoading || orgName !== ALLOWED_ORG) return null;

  const handleOpen = () => {
    setOpen(true);
    setPageUrl(window.location.href);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300);
  };

  const resetForm = () => {
    setTab('bug');
    setTitle('');
    setSection('');
    setDescription('');
    setPageUrl('');
    setScreenshot(null);
    setScreenshotName('');
    setSubmitted(false);
    setError('');
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!section) {
      setError('Please select a category.');
      return;
    }
    if (!description.trim()) {
      setError('Please add a description before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        type: tab,
        participantName: userProfile?.fullName || '',
        userEmail: user?.email || '',
        title: title.trim(),
        section: section,
        pageUrl: pageUrl,
        description: description.trim(),
        screenshot: screenshot || undefined,
      };

      const res = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleOpen}
        title="Report a bug or share feedback"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 1200,
          height: 44,
          borderRadius: 24,
          background: '#1E3A5F',
          border: '2px solid #2B4C7E',
          boxShadow: '0 2px 12px rgba(30,58,95,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 18px 0 14px',
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2B4C7E'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1E3A5F'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
          Report Feedback &amp; Bugs
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1300,
            background: 'rgba(26,32,44,0.35)',
          }}
        />
      )}

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            right: 28,
            zIndex: 1400,
            width: 400,
            maxWidth: 'calc(100vw - 40px)',
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 32px rgba(26,32,44,0.14)',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
              {submitted ? 'Thank you!' : 'Share Feedback'}
            </span>
            <button
              onClick={handleClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {submitted ? (
            // Thank you state
            <div style={{ padding: '32px 24px 28px', textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#E6FFFA', border: '1.5px solid #38B2AC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38B2AC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1A202C', margin: '0 0 8px' }}>
                We've received your {tab === 'bug' ? 'bug report' : 'feedback'}!
              </p>
              <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 24px' }}>
                Thanks for helping us improve the platform. We'll review it and follow up if needed.
              </p>
              <button
                onClick={handleClose}
                style={{
                  background: '#1E3A5F', color: '#FFFFFF',
                  border: 'none', borderRadius: 24,
                  padding: '10px 28px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', width: '100%',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            // Form
            <div style={{ padding: '16px 20px 20px' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {(['bug', 'feedback'] as TabType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); }}
                    style={{
                      flex: 1, padding: '7px 0',
                      borderRadius: 8,
                      border: tab === t ? '1.5px solid #1E3A5F' : '1.5px solid #E2E8F0',
                      background: tab === t ? '#1E3A5F' : '#F7FAFC',
                      color: tab === t ? '#FFFFFF' : '#4A5568',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'bug' ? 'Bug Report' : 'Feedback'}
                  </button>
                ))}
              </div>

              {/* Category — same for both tabs */}
              <label style={labelStyle}>
                {tab === 'bug' ? 'Bug category' : 'Feedback category'} <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <select
                value={section}
                onChange={e => setSection(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select a category…</option>
                {(tab === 'bug'
                  ? ['UI / visual issue', 'Broken functionality', 'Data not saving', 'Performance', 'Other']
                  : FEEDBACK_CATEGORIES
                ).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Title — same for both tabs */}
              <label style={labelStyle}>{tab === 'bug' ? 'Bug title' : 'Summary'}</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={tab === 'bug' ? 'e.g. Progress ring not updating' : 'One-line summary of your feedback'}
                style={inputStyle}
              />

              {/* Description — same for both tabs */}
              <label style={labelStyle}>Description <span style={{ color: '#E53E3E' }}>*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={tab === 'bug' ? 'What happened? What did you expect to happen?' : 'What could be improved? What\'s working well?'}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              />

              {/* Screenshot — same for both tabs */}
              <label style={labelStyle}>Screenshot (optional)</label>
              {screenshot ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', border: '1px solid #E2E8F0',
                  borderRadius: 8, background: '#F7FAFC', marginBottom: 12,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38B2AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={{ fontSize: 12, color: '#4A5568', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {screenshotName}
                  </span>
                  <button
                    onClick={removeScreenshot}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleScreenshot}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '8px 0',
                      border: '1.5px dashed #CBD5E0', borderRadius: 8,
                      background: '#F7FAFC', color: '#718096',
                      fontSize: 13, cursor: 'pointer', marginBottom: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload screenshot
                  </button>
                </>
              )}

              {/* Error */}
              {error && (
                <p style={{ fontSize: 12, color: '#E53E3E', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '11px 0',
                  background: submitting ? '#A0AEC0' : '#38B2AC',
                  color: '#FFFFFF', border: 'none', borderRadius: 24,
                  fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  `Submit ${tab === 'bug' ? 'Bug Report' : 'Feedback'}`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#4A5568',
  marginBottom: 5,
  marginTop: 2,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1A202C',
  background: '#FFFFFF',
  outline: 'none',
  marginBottom: 12,
  boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  lineHeight: 1.5,
};
