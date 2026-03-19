import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, ChevronDown, Link2, ArrowRight } from 'lucide-react';
import { useAllProjectsData } from '../../hooks/useAllProjectsData';
import { LEVEL_META } from '../../data/levelTopics';

const FONT = "'DM Sans', sans-serif";

const STATUS_BADGE_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  draft: { bg: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0', label: 'Draft saved' },
  submitted: { bg: '#FEFCE8', color: '#92400E', border: '1px solid #FDE68A', label: 'Under review' },
  passed: { bg: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5', label: 'Passed \u2713' },
  needs_revision: { bg: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', label: 'Needs revision' },
};

const AppProjects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading } = useAllProjectsData();
  const [challengeOpen, setChallengeOpen] = useState<Record<number, boolean>>({});

  const hasAnyProject = projects.some(p => !!p.projectTitle);

  return (
    <div style={{ padding: '28px 36px', fontFamily: FONT, minHeight: '100%' }}>
      <style>{`
        @keyframes ppFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ppFadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppSlideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, animation: 'ppFadeSlideUp 0.3s ease 0ms both' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.4px', margin: 0, marginBottom: 6 }}>
            My Projects
          </h1>
          <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0 }}>
            Apply what you've learned. Each project is personalised to your role and challenge — this is where learning becomes real work.
          </p>
        </div>
        {/* Level dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {projects.map(p => {
            const isPassed = p.submissionStatus === 'passed';
            return (
              <div key={p.level} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: p.accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isPassed && <Check size={7} strokeWidth={3} color={p.accentDark} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              height: 140, borderRadius: 14, background: '#E2E8F0',
              animation: 'ppFadeIn 1.5s ease-in-out infinite alternate',
            }} />
          ))}
        </div>
      )}

      {/* Empty state — no learning plan */}
      {!loading && !hasAnyProject && (
        <div style={{
          background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
          padding: '40px 32px', textAlign: 'center',
          animation: 'ppFadeSlideUp 0.3s ease 60ms both',
        }}>
          <div style={{ fontSize: 15, color: '#718096', marginBottom: 16, lineHeight: 1.6 }}>
            No learning plan found — complete the onboarding survey on My Journey to generate your personalised project briefs.
          </div>
          <button
            onClick={() => navigate('/app/journey')}
            style={{
              background: '#38B2AC', color: '#FFFFFF', border: 'none',
              borderRadius: 24, padding: '10px 22px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Go to My Journey →
          </button>
        </div>
      )}

      {/* Project Cards */}
      {!loading && hasAnyProject && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map((p, index) => {
            const isPassed = p.submissionStatus === 'passed';
            const statusBadge = STATUS_BADGE_STYLES[p.submissionStatus];
            const isOpen = challengeOpen[p.level] || false;

            return (
              <div
                key={p.level}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${isPassed ? p.accentDark : p.accentColor}`,
                  overflow: 'hidden',
                  animation: `ppFadeSlideUp 0.3s ease ${index * 60}ms both`,
                }}
              >
                {/* Header row */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  {/* Left cluster */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Level badge */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isPassed ? `${p.accentColor}55` : `${p.accentColor}33`,
                      border: isPassed ? 'none' : `1px solid ${p.accentColor}88`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: p.accentDark,
                    }}>
                      {isPassed ? <Check size={16} color={p.accentDark} strokeWidth={3} /> : p.level}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: p.accentDark,
                          textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                        }}>
                          Level {p.level}
                        </span>
                        {statusBadge && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 8px',
                            borderRadius: 10, background: statusBadge.bg,
                            border: statusBadge.border, color: statusBadge.color,
                          }}>
                            {statusBadge.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginTop: 2 }}>
                        {p.levelName}
                      </div>
                    </div>
                  </div>

                  {/* Right cluster */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {p.depth && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: p.accentDark,
                        background: `${p.accentColor}20`,
                        borderRadius: 6, padding: '2px 8px',
                        textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                      }}>
                        {p.depth === 'full' ? 'Full Program' : 'Fast-track'}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/app/journey/project/${p.level}?from=projects`)}
                      style={{
                        background: p.accentDark, color: '#FFFFFF', border: 'none',
                        borderRadius: 24, padding: '8px 18px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: FONT,
                        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                      }}
                    >
                      Continue to project <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Project body */}
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid #F7FAFC' }}>
                  {p.projectTitle ? (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 6, marginTop: 14 }}>
                        {p.projectTitle}
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8 }}>
                        {p.projectDescription}
                      </div>
                      {p.deliverable && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <FileText size={13} color={p.accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>Deliverable: </span>
                            <span style={{ fontSize: 13, color: '#4A5568' }}>{p.deliverable}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, color: '#A0AEC0', fontStyle: 'italic', marginBottom: 8 }}>
                        Your personalised project brief will appear here once your learning plan is generated.
                      </div>
                      <span
                        onClick={() => navigate('/app/journey')}
                        style={{ fontSize: 12, fontWeight: 600, color: '#38B2AC', cursor: 'pointer' }}
                      >
                        Go to My Journey →
                      </span>
                    </div>
                  )}
                </div>

                {/* Challenge connection (expandable) */}
                {p.challengeConnection && (
                  <>
                    <div
                      onClick={() => setChallengeOpen(prev => ({ ...prev, [p.level]: !prev[p.level] }))}
                      style={{
                        padding: '10px 20px',
                        borderTop: '1px solid #F7FAFC',
                        cursor: 'pointer',
                        background: `${p.accentColor}08`,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Link2 size={12} color={p.accentDark} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: p.accentDark,
                        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                        flex: 1,
                      }}>
                        How this connects to your challenge
                      </span>
                      <ChevronDown size={12} color={p.accentDark} style={{
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} />
                    </div>
                    {isOpen && (
                      <div style={{
                        padding: '0 20px 14px',
                        background: `${p.accentColor}08`,
                        animation: 'ppSlideDown 0.2s ease',
                      }}>
                        <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontStyle: 'italic' }}>
                          {p.challengeConnection}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppProjects;
