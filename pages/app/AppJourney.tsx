import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Clock, Sparkles, Zap, ChevronDown, MoveDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useJourneyData } from '../../hooks/useJourneyData';
import type { JourneyData } from '../../hooks/useJourneyData';
import { getProfile, getLatestLearningPlan, upsertProfile } from '../../lib/database';
import { LevelCard } from '../../components/app/LevelCard';
import { LEVEL_META } from '../../data/levelTopics';
import { LEVEL_TOPICS } from '../../data/levelTopics';
import OnboardingSurvey from '../../components/app/journey/OnboardingSurvey';
import type { PathwayFormData, PathwayApiResponse } from '../../types';

const pulseStyle = `
@keyframes journeyPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
@keyframes journeyFadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes onbFadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes onbFadeOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
`;

const Skeleton: React.FC<{ height: number }> = ({ height }) => (
  <div style={{
    width: '100%', height, borderRadius: 16,
    background: '#E2E8F0',
    animation: 'journeyPulse 1.5s ease-in-out infinite',
  }} />
);

/* ═══════════════════════════════════════════════════════
   LEARNING PLAN OVERVIEW — shows AI-generated plan summary
   with all 5 levels and personalized projects at a glance
   ═══════════════════════════════════════════════════════ */
const LearningPlanOverview: React.FC<{
  planData: PathwayApiResponse;
  onLevelClick: (levelNum: number) => void;
}> = ({ planData, onLevelClick }) => {
  const [collapsed, setCollapsed] = useState(false);
  const levelKeys = ['L1', 'L2', 'L3', 'L4', 'L5'];

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
      overflow: 'hidden', marginBottom: 20,
      animation: 'journeyFadeSlideUp 0.3s ease 0ms both',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #F0FFFC 0%, #F7FAFC 100%)',
          borderBottom: collapsed ? 'none' : '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={16} color="#38B2AC" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>
            Your Learning Plan
          </span>
          {planData.totalEstimatedWeeks > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#718096',
              background: '#F7FAFC', borderRadius: 8, padding: '2px 8px',
              border: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Clock size={10} />
              ~{planData.totalEstimatedWeeks} weeks
            </span>
          )}
        </div>
        <ChevronDown size={16} color="#718096" style={{
          transition: 'transform 0.25s ease',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }} />
      </div>

      {/* Body */}
      <div style={{
        maxHeight: collapsed ? 0 : 800,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        {/* Pathway summary */}
        {planData.pathwaySummary && (
          <div style={{
            padding: '16px 24px 0',
            fontSize: 13, color: '#4A5568', lineHeight: 1.65,
            fontStyle: 'italic',
          }}>
            {planData.pathwaySummary}
          </div>
        )}

        {/* Level rows */}
        <div style={{ padding: '16px 24px 20px' }}>
          {levelKeys.map((key, idx) => {
            const levelNum = idx + 1;
            const levelResult = planData.levels[key];
            const meta = LEVEL_META.find(m => m.number === levelNum);
            if (!meta) return null;
            const accent = meta.accentColor;
            const accentDark = meta.accentDark;

            return (
              <div
                key={key}
                onDoubleClick={() => onLevelClick(levelNum)}
                style={{
                  display: 'flex', alignItems: 'stretch', gap: 0,
                  borderRadius: 10, overflow: 'hidden',
                  border: '1px solid #EDF2F7',
                  marginBottom: idx < 4 ? 8 : 0,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.boxShadow = `0 2px 8px ${accent}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EDF2F7';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => onLevelClick(levelNum)}
              >
                {/* Level accent bar */}
                <div style={{
                  width: 4, background: accent, flexShrink: 0,
                }} />

                {/* Level number badge */}
                <div style={{
                  width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, background: `${accent}15`,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: accentDark,
                  }}>
                    {levelNum}
                  </span>
                </div>

                {/* Content */}
                <div style={{
                  flex: 1, minWidth: 0, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  {/* Level name + project */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#1A202C',
                      }}>
                        {meta.name}
                      </span>
                      {levelResult?.depth && (
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          color: levelResult.depth === 'full' ? accentDark : '#718096',
                          background: levelResult.depth === 'full' ? `${accent}30` : '#F7FAFC',
                          border: `1px solid ${levelResult.depth === 'full' ? accent + '66' : '#E2E8F0'}`,
                          borderRadius: 6, padding: '1px 7px',
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.04em',
                        }}>
                          {levelResult.depth === 'full' ? 'Full Program' : 'Fast-track'}
                        </span>
                      )}
                    </div>
                    {levelResult?.projectTitle ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <Zap size={10} color={accentDark} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{
                          fontSize: 12, color: '#4A5568', lineHeight: 1.45,
                        }}>
                          <strong style={{ color: '#1A202C', fontWeight: 600 }}>{levelResult.projectTitle}</strong>
                          {levelResult.deliverable && (
                            <span style={{ color: '#718096' }}> — {levelResult.deliverable}</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' }}>
                        Not included in your programme
                      </span>
                    )}
                  </div>

                  {/* Arrow hint */}
                  <ArrowRight size={13} color="#CBD5E0" style={{ flexShrink: 0 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AppJourney: React.FC = () => {
  const { hasLearningPlan, learningPlanLoading } = useAppContext();
  const { user } = useAuth();
  const { data, loading, error, retry } = useJourneyData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const levelRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── DEMO MODE: ?demo=true — no Supabase, local plan data only ───
  const demoMode = searchParams.get('demo') === 'true';
  const demoPlanCompleted = useRef(false);

  // Track which level was clicked from overview to auto-expand its card
  // (must be declared here, before any conditional returns, per Rules of Hooks)
  const [expandedFromOverview, setExpandedFromOverview] = useState<number | null>(null);

  // Edit Profile panel state
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PathwayFormData> | null>(null);

  useEffect(() => {
    if (profilePanelOpen && user && !demoMode) {
      getProfile(user.id).then(p => { if (p) setProfileForm(p as Partial<PathwayFormData>); });
    }
  }, [profilePanelOpen, user, demoMode]);


  // Fetch learning plan for project titles on level cards
  // Re-fetch when hasLearningPlan flips to true (e.g. after survey completion)
  const [planData, setPlanData] = useState<PathwayApiResponse | null>(null);
  useEffect(() => {
    if (demoMode) return; // Demo mode uses local state only
    if (user) {
      getLatestLearningPlan(user.id).then(d => {
        if (d?.plan) setPlanData(d.plan);
      });
    }
  }, [user, hasLearningPlan, demoMode]);

  // DEV: ?simulate=new-user forces State A for testing the onboarding flow
  const simulateNewUser = searchParams.get('simulate') === 'new-user';

  // State A/B transition — restore from sessionStorage if user navigated away mid-survey
  // NOTE: During initial load, hasLearningPlan is false and learningPlanLoading is true.
  // We must NOT default to showing onboarding based on stale hasLearningPlan — wait for loading.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (simulateNewUser || demoMode) return true;
    // If still loading, default to false — the useEffect will correct once loaded
    if (learningPlanLoading) return false;
    if (!hasLearningPlan) return true;
    return sessionStorage.getItem('oxygy_survey_active') === 'true';
  });
  const [transitioning, setTransitioning] = useState(false);
  const [prefillData, setPrefillData] = useState<Partial<PathwayFormData> | null>(() => {
    try {
      const stored = sessionStorage.getItem('oxygy_survey_prefill');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Mark survey as active in sessionStorage whenever onboarding is shown,
  // so the sync useEffect below won't dismiss it while the completion card is visible.
  useEffect(() => {
    if (showOnboarding && !demoMode && !simulateNewUser) {
      sessionStorage.setItem('oxygy_survey_active', 'true');
    }
  }, [showOnboarding, demoMode, simulateNewUser]);

  // Sync showOnboarding with hasLearningPlan on mount / context change
  useEffect(() => {
    // In demo mode, only force onboarding if the plan hasn't been generated yet
    if (demoMode) {
      if (!demoPlanCompleted.current) setShowOnboarding(true);
      return;
    }
    if (simulateNewUser) {
      setShowOnboarding(true);
      return;
    }
    if (learningPlanLoading) return; // Wait until we know the answer
    if (!hasLearningPlan) {
      setShowOnboarding(true);
    } else {
      // Plan exists — dismiss onboarding unless the user is mid-survey/completion card
      if (sessionStorage.getItem('oxygy_survey_active') !== 'true') {
        setShowOnboarding(false);
      }
    }
  }, [hasLearningPlan, learningPlanLoading, simulateNewUser, demoMode]);

  // Load prefill data for regeneration
  const handleRegenerate = useCallback(async () => {
    if (!demoMode && user) {
      const profile = await getProfile(user.id);
      if (profile) {
        const prefill = profile as Partial<PathwayFormData>;
        setPrefillData(prefill);
        try { sessionStorage.setItem('oxygy_survey_prefill', JSON.stringify(prefill)); } catch {}
      }
    }
    demoPlanCompleted.current = false;
    sessionStorage.setItem('oxygy_survey_active', 'true');
    setShowOnboarding(true);
  }, [user, demoMode]);

  const handlePlanGenerated = useCallback((result?: PathwayApiResponse) => {
    // Clear persisted survey state
    sessionStorage.removeItem('oxygy_survey_active');
    sessionStorage.removeItem('oxygy_survey_prefill');
    sessionStorage.removeItem('oxygy_survey_step');
    sessionStorage.removeItem('oxygy_survey_form');

    // In demo mode, store the AI-generated plan in local state
    if (result) {
      setPlanData(result);
      demoPlanCompleted.current = true;
    }

    // Generate project chips for all assigned toolkit tools
    if (result && user) {
      import('../../lib/generateProjectChips').then(({ generateProjectChips }) =>
        generateProjectChips(result).then(chips => {
          if (chips.length > 0) {
            import('../../lib/database').then(({ upsertToolkitProjectChips }) =>
              upsertToolkitProjectChips(user.id, chips)
            );
          }
        })
      );
    }

    // Transition to journey view
    setTransitioning(true);
    setTimeout(() => {
      setShowOnboarding(false);
      setTransitioning(false);
      setPrefillData(null);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0 });
    }, 500);
  }, []);

  // Show loading skeleton while learning plan status is loading (skip in demo mode)
  if (!demoMode && learningPlanLoading) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{pulseStyle}</style>
        <Skeleton height={100} />
        <div style={{ height: 16 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ marginBottom: 16 }}><Skeleton height={200} /></div>
        ))}
      </div>
    );
  }

  // ─── STATE A: Onboarding Mode (full-screen takeover) ───
  if (showOnboarding) {
    return (
      <div
        ref={contentRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 9999, fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #F0FFFC 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: transitioning ? 'onbFadeOut 0.3s ease-in forwards' : undefined,
          overflow: 'auto',
        }}
      >
        <style>{pulseStyle}</style>
        <OnboardingSurvey
          prefillData={prefillData}
          onPlanGenerated={handlePlanGenerated}
          demoMode={demoMode}
        />
      </div>
    );
  }

  // ─── STATE B: Full Journey View ───

  // Demo mode now falls through to the main journey view below,
  // using DEMO_JOURNEY_DATA when Supabase data isn't available.

  // Demo mode fallback: create empty journey data when Supabase data isn't available
  const DEMO_JOURNEY_DATA: JourneyData = {
    levels: [1, 2, 3, 4, 5].map(n => ({
      levelNumber: n,
      status: 'not-started' as const,
      completedTopics: 0,
      totalTopics: (LEVEL_TOPICS[n] || []).length,
      completedAt: null,
      artefactsCreated: 0,
      toolsUnlocked: 0,
      activeTopicIndex: 0,
      currentSlide: 0,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
    })),
    completedLevelsCount: 0,
  };

  const journeyData = demoMode ? (data || DEMO_JOURNEY_DATA) : data;

  if (!demoMode && (loading || !data)) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{pulseStyle}</style>
        <Skeleton height={100} />
        <div style={{ height: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Skeleton height={200} />
          </div>
        ))}
      </div>
    );
  }

  if (!demoMode && error) {
    return (
      <div style={{
        padding: '28px 36px', fontFamily: "'DM Sans', sans-serif",
        textAlign: 'center', paddingTop: 80,
      }}>
        <div style={{ fontSize: 16, color: '#718096', marginBottom: 16 }}>
          Unable to load journey data.
        </div>
        <button
          onClick={retry}
          style={{
            background: '#38B2AC', color: '#FFFFFF', border: 'none',
            borderRadius: 24, padding: '10px 22px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Safety: if somehow journeyData is still null, show skeleton
  if (!journeyData) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{pulseStyle}</style>
        <Skeleton height={100} />
        <div style={{ height: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 16 }}><Skeleton height={200} /></div>
        ))}
      </div>
    );
  }

  const { levels, completedLevelsCount } = journeyData;
  const overallPct = Math.round((completedLevelsCount / 5) * 100);

  // Find the current active level, or the next not-started if all completed
  const activeLevel = levels.find(l => l.status === 'active');
  const currentLevel = activeLevel || levels.find(l => l.status === 'not-started') || levels[levels.length - 1];
  const currentMeta = LEVEL_META.find(m => m.number === currentLevel.levelNumber)!;
  const currentTopics = LEVEL_TOPICS[currentLevel.levelNumber] || [];
  const currentTopic = currentTopics[0];

  // Calculate phase progress for the active level
  const phaseLabels = ['E-Learn', 'Practise'];
  const currentPhaseLabel = currentLevel.status === 'active' && currentLevel.currentPhase > 0
    ? phaseLabels[currentLevel.currentPhase - 1] || phaseLabels[0]
    : currentLevel.status === 'completed' ? 'All complete' : 'Not started';

  const scrollToLevel = (levelNum: number) => {
    setExpandedFromOverview(levelNum);
    // Small delay to let the expand animation start, then scroll
    setTimeout(() => {
      const el = levelRefs.current[levelNum];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div ref={contentRef} style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{pulseStyle}</style>

      {/* Demo mode banner */}
      {demoMode && (
        <div style={{
          background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, color: '#92400E',
        }}>
          <span><strong>Demo Mode</strong> — No data saved to your account. AI-generated plan stored locally only.</span>
          <button
            onClick={handleRegenerate}
            style={{
              background: '#F59E0B', color: '#FFFFFF', border: 'none',
              borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Re-run Survey
          </button>
        </div>
      )}

      {/* Page Header — title row */}
      <div style={{
        marginBottom: 20,
        animation: 'journeyFadeSlideUp 0.3s ease 0ms both',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: '#1A202C',
            letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
          }}>
            My Journey
          </h1>
          <p style={{
            fontSize: 14, color: '#718096', lineHeight: 1.6,
            margin: 0,
          }}>
            Your path through the five levels of AI capability.
          </p>
        </div>
        {!demoMode && (
          <button
            onClick={() => setProfilePanelOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#38B2AC')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
          >
            ✎ Edit Profile
          </button>
        )}
      </div>

      {/* Overall Progress Card — full width */}
      <div style={{
        marginBottom: 28,
        animation: 'journeyFadeSlideUp 0.3s ease 0ms both',
      }}>
        <div style={{
          background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
          padding: '20px 24px',
        }}>
          {/* Top row: progress bar coloured by current level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#718096',
              textTransform: 'uppercase' as const, letterSpacing: '0.07em',
              whiteSpace: 'nowrap',
            }}>
              Overall Progress
            </div>
            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${overallPct}%`,
                background: currentMeta.accentDark,
                borderRadius: 6, transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', minWidth: 36, textAlign: 'right' as const }}>
              {overallPct}%
            </div>
          </div>

          {/* Level step indicators — colour-coordinated per level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
            {levels.map((lvl, i) => {
              const lvlMeta = LEVEL_META.find(m => m.number === lvl.levelNumber)!;
              const isDone = lvl.status === 'completed';
              const isCurrent = lvl.levelNumber === currentLevel.levelNumber;
              // Connector line uses the PREVIOUS level's accent colour when that level is done
              const prevMeta = i > 0 ? LEVEL_META.find(m => m.number === levels[i - 1].levelNumber)! : null;
              const prevDone = i > 0 && levels[i - 1].status === 'completed';
              return (
                <React.Fragment key={lvl.levelNumber}>
                  {i > 0 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: prevDone ? (prevMeta?.accentDark || '#E2E8F0') : '#E2E8F0',
                    }} />
                  )}
                  <div
                    onClick={() => scrollToLevel(lvl.levelNumber)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: isCurrent ? 30 : 24, height: isCurrent ? 30 : 24,
                      borderRadius: '50%', flexShrink: 0,
                      background: isDone ? lvlMeta.accentColor : isCurrent ? lvlMeta.accentColor : '#F7FAFC',
                      border: isDone ? `2px solid ${lvlMeta.accentDark}` : isCurrent ? `2.5px solid ${lvlMeta.accentDark}` : '1.5px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? 12 : 10, fontWeight: 800,
                      color: isDone ? lvlMeta.accentDark : isCurrent ? lvlMeta.accentDark : '#A0AEC0',
                      transition: 'all 0.2s ease',
                    }}>
                      {isDone ? <Check size={12} strokeWidth={3} color={lvlMeta.accentDark} /> : lvl.levelNumber}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: isCurrent || isDone ? 700 : 500,
                      color: isDone ? lvlMeta.accentDark : isCurrent ? lvlMeta.accentDark : '#A0AEC0',
                      whiteSpace: 'nowrap',
                    }}>
                      {lvlMeta.shortName}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Current level detail card */}
          <div style={{
            background: `${currentMeta.accentColor}15`,
            border: `1px solid ${currentMeta.accentColor}55`,
            borderRadius: 10, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: currentMeta.accentDark,
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                }}>
                  {currentLevel.status === 'completed' ? 'Last Completed' : currentLevel.status === 'active' ? 'Currently On' : 'Up Next'}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 600, color: '#718096',
                  background: '#F7FAFC', borderRadius: 8, padding: '1px 7px',
                  border: '1px solid #E2E8F0',
                }}>
                  {currentPhaseLabel}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 3 }}>
                Level {currentLevel.levelNumber}: {currentMeta.name}
              </div>
              <div style={{ fontSize: 11.5, color: '#4A5568', lineHeight: 1.5 }}>
                {currentTopic ? currentTopic.subtitle : currentMeta.tagline}
              </div>
            </div>

            <button
              onClick={() => {
                if (currentLevel.status === 'active' || currentLevel.status === 'completed') {
                  navigate(currentLevel.levelNumber === 1 ? '/app/level-1' : `/app/level?level=${currentLevel.levelNumber}`);
                } else {
                  scrollToLevel(currentLevel.levelNumber);
                }
              }}
              style={{
                background: currentMeta.accentDark, color: '#FFFFFF', border: 'none',
                borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'opacity 0.15s',
                display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {currentLevel.status === 'active' ? 'Continue' : currentLevel.status === 'completed' ? 'Review' : 'View'}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Level Cards */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
        {levels.map((level, idx) => {
          const planLevel = planData?.levels?.[`L${level.levelNumber}`];
          const nextPlanLevel = idx < levels.length - 1
            ? planData?.levels?.[`L${levels[idx + 1].levelNumber}`]
            : null;
          const isAssigned = !!planLevel;
          const nextIsAssigned = !!nextPlanLevel;
          const showConnector = isAssigned && nextIsAssigned && idx < levels.length - 1;
          const lvlMeta = LEVEL_META.find(m => m.number === level.levelNumber);
          const lvlDone = level.status === 'completed';

          return (
            <div key={level.levelNumber}>
              <div ref={el => { levelRefs.current[level.levelNumber] = el; }}>
                <LevelCard
                  level={level}
                  animDelay={60 + idx * 60}
                  projectTitle={planLevel?.projectTitle || null}
                  deliverable={planLevel?.deliverable || null}
                  planDepth={planLevel?.depth || null}
                  planTime={planLevel?.sessionFormat || null}
                  forceExpand={expandedFromOverview === level.levelNumber}
                  hasLearningPlan={!!planData}
                  isFocused={level.levelNumber === currentLevel.levelNumber}
                />
              </div>
              {/* Vertical connector between levels */}
              {showConnector && (
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  padding: '4px 0',
                }}>
                  <MoveDown
                    size={20}
                    strokeWidth={2.5}
                    color={lvlMeta?.accentDark || '#CBD5E0'}
                  />
                </div>
              )}
              {/* Gap when no connector */}
              {!showConnector && idx < levels.length - 1 && (
                <div style={{ height: 10 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {completedLevelsCount === 5 && (
        <div style={{
          background: 'linear-gradient(135deg, #38B2AC 0%, #2D9E99 100%)',
          borderRadius: 16, padding: '32px 36px', textAlign: 'center' as const, marginTop: 16,
          animation: 'journeyFadeSlideUp 0.3s ease 360ms both',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>Programme Complete</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, marginBottom: 20 }}>
            You've completed all five levels of the OXYGY AI Upskilling Programme.
          </div>
          <button
            onClick={() => alert('Certificate feature coming soon.')}
            style={{
              background: '#FFFFFF', color: '#38B2AC', border: 'none',
              borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Download Certificate →
          </button>
        </div>
      )}

      {/* Edit Profile slide-in panel */}
      {!demoMode && profilePanelOpen && (
        <>
          <div
            onClick={() => setProfilePanelOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
            zIndex: 201, display: 'flex', flexDirection: 'column',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C' }}>Edit Profile</div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Update your details to regenerate your learning plan</div>
              </div>
              <button onClick={() => setProfilePanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#A0AEC0', padding: 4, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ margin: '16px 24px 0', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
              <strong>Heads up:</strong> Saving will regenerate your learning plan. Your progress and saved artefacts are not affected, but your project briefs may be updated to better reflect your new profile.
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { key: 'role', label: 'Job Title / Role' },
                { key: 'function', label: 'Function' },
                { key: 'seniority', label: 'Seniority' },
                { key: 'aiExperience', label: 'AI Experience' },
                { key: 'ambition', label: 'Your Goal' },
                { key: 'challenge', label: 'Main Challenge' },
                { key: 'availability', label: 'Weekly Availability' },
              ] as { key: keyof PathwayFormData; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
                  <input
                    value={(profileForm?.[key] as string) || ''}
                    onChange={e => setProfileForm(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1A202C', fontFamily: 'inherit', outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#38B2AC')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setProfilePanelOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#4A5568', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                disabled={profileSaving}
                onClick={async () => {
                  if (!user || !profileForm) return;
                  setProfileSaving(true);
                  await upsertProfile(user.id, profileForm);
                  setProfileSaving(false);
                  setProfilePanelOpen(false);
                  handleRegenerate();
                }}
                style={{ flex: 2, padding: '10px', borderRadius: 20, border: 'none', background: profileSaving ? '#A0AEC0' : '#38B2AC', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: profileSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {profileSaving ? 'Saving…' : 'Save & Regenerate Plan →'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppJourney;
