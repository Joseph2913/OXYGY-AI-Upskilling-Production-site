import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PLATFORMS, LEARNING_PREFERENCES } from '../../../data/learningCoachContent';

const FONT = "'DM Sans', sans-serif";

interface LearningCoachEditPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: string[];
  platforms: string[];
  additionalContext: string;
  onSave: (data: { preferences: string[]; platforms: string[]; additionalContext: string }) => void;
}

const LearningCoachEditPanel: React.FC<LearningCoachEditPanelProps> = ({
  open,
  onClose,
  preferences,
  platforms,
  additionalContext,
  onSave,
}) => {
  const [editPreferences, setEditPreferences] = useState<string[]>(preferences);
  const [editPlatforms, setEditPlatforms] = useState<string[]>(platforms);
  const [editContext, setEditContext] = useState(additionalContext);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditPreferences(preferences);
    setEditPlatforms(platforms);
    setEditContext(additionalContext);
    setHasChanges(false);
  }, [preferences, platforms, additionalContext, open]);

  useEffect(() => {
    const changed =
      JSON.stringify(editPreferences) !== JSON.stringify(preferences) ||
      JSON.stringify(editPlatforms) !== JSON.stringify(platforms) ||
      editContext !== additionalContext;
    setHasChanges(changed);
  }, [editPreferences, editPlatforms, editContext, preferences, platforms, additionalContext]);

  const togglePref = (id: string) => {
    setEditPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const togglePlat = (id: string) => {
    setEditPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.15)',
          zIndex: 39,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 380,
        height: '100vh',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        animation: 'lcSlideIn 0.25s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Your Learning Profile</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Preferences */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#A0AEC0',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
            }}>
              How you prefer to learn
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEARNING_PREFERENCES.map(pref => {
                const sel = editPreferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: sel ? '#E6FFFA' : '#FFFFFF',
                      border: sel ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: sel ? 600 : 500,
                      color: sel ? '#1A202C' : '#4A5568',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}
                  >
                    {sel ? <Check size={14} color="#38B2AC" /> : <span style={{ fontSize: 18 }}>{pref.icon}</span>}
                    <div>
                      <div>{pref.label}</div>
                      <div style={{ fontSize: 11, color: '#718096', marginTop: 2, fontWeight: 400 }}>{pref.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platforms */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#A0AEC0',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Platforms you use
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLATFORMS.map(p => {
                const sel = editPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlat(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: sel ? '#E6FFFA' : '#FFFFFF',
                      border: sel ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      fontWeight: sel ? 600 : 500,
                      color: sel ? '#1A202C' : '#4A5568',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}
                  >
                    {sel ? (
                      <Check size={14} color="#38B2AC" />
                    ) : p.logo ? (
                      <img src={p.logo} alt={p.name} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                    )}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Context */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#A0AEC0',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Additional context
            </div>
            <textarea
              value={editContext}
              onChange={e => setEditContext(e.target.value)}
              placeholder="e.g., 'I commute 45 minutes each way and prefer audio during that time'"
              style={{
                width: '100%',
                minHeight: 80,
                maxHeight: 160,
                resize: 'none',
                fontSize: 14,
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 16px',
                fontFamily: FONT,
                lineHeight: 1.5,
                color: '#1A202C',
                boxSizing: 'border-box' as const,
                outline: 'none',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#38B2AC';
                e.target.style.boxShadow = '0 0 0 3px rgba(56, 178, 172, 0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={() => {
              onSave({
                preferences: editPreferences,
                platforms: editPlatforms,
                additionalContext: editContext,
              });
            }}
            disabled={!hasChanges}
            style={{
              width: '100%',
              background: hasChanges ? '#38B2AC' : '#CBD5E0',
              color: '#FFFFFF',
              borderRadius: 24,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: FONT,
              border: 'none',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

export default LearningCoachEditPanel;
