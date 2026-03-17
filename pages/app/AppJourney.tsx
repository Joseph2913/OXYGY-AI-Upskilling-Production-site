import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useJourneyData } from '../../hooks/useJourneyData';
import { getProfile, getLatestLearningPlan } from '../../lib/database';
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

const AppJourney: React.FC = () => {
  const { hasLearningPlan, learningPlanLoading } = useAppContext();
  const { user } = useAuth();
  const { data, loading, error, retry } = useJourneyData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const levelRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch learning plan for project titles on level cards
  const [planData, setPlanData] = useState<PathwayApiResponse | null>(null);
  useEffect(() => {
    if (user) {
      getLatestLearningPlan(user.id).then(d => {
        if (d?.plan) setPlanData(d.plan);
      });
    }
  }, [user]);

  // DEV: ?simulate=new-user forces State A for testing the onboarding flow
  const simulateNewUser = searchParams.get('simulate') === 'new-user';

  // State A/B transition
  const [showOnboarding, setShowOnboarding] = useState(!hasLearningPlan || simulateNewUser);
  const [transitioning, setTransitioning] = useState(false);
  const [prefillData, setPrefillData] = useState<Partial<PathwayFormData> | null>(null);

  // Sync showOnboarding with hasLearningPlan on mount / context change
  useEffect(() => {
    if (simulateNewUser) {
      setShowOnboarding(true);
      return;
    }
    if (!learningPlanLoading && !hasLearningPlan) {
      setShowOnboarding(true);
    }
  }, [hasLearningPlan, learningPlanLoading, simulateNewUser]);

  // Load prefill data for regeneration
  const handleRegenerate = useCallback(async () => {
    if (user) {
      const profile = await getProfile(user.id);
      if (profile) {
        setPrefillData(profile as Partial<PathwayFormData>);
      }
    }
    setShowOnboarding(true);
  }, [user]);

  const handlePlanGenerated = useCallback(() => {
    setTransitioning(true);
    // Fade out State A, then show State B
    setTimeout(() => {
      setShowOnboarding(false);
      setTransitioning(false);
      setPrefillData(null);
      // Scroll to top
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0 });
    }, 500); // fade-out (300ms) + pause (200ms)
  }, []);

  // Show loading skeleton while learning plan status is loading
  if (learningPlanLoading) {
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
        />
      </div>
    );
  }

  // ─── STATE B: Full Journey View ───

  if (loading || !data) {
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

  if (error) {
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

  const { levels, completedLevelsCount } = data;
  const overallPct = Math.round((completedLevelsCount / 5) * 100);

  // Find the current active level, or the next not-started if all completed
  const activeLevel = levels.find(l => l.status === 'active');
  const currentLevel = activeLevel || levels.find(l => l.status === 'not-started') || levels[levels.length - 1];
  const currentMeta = LEVEL_META.find(m => m.number === currentLevel.levelNumber)!;
  const currentTopics = LEVEL_TOPICS[currentLevel.levelNumber] || [];
  const currentTopic = currentTopics[0];

  // Calculate phase progress for the active level
  const phaseLabels = ['E-Learn', 'Read', 'Watch', 'Practise'];
  const currentPhaseLabel = currentLevel.status === 'active' && currentLevel.currentPhase > 0
    ? phaseLabels[currentLevel.currentPhase - 1] || phaseLabels[0]
    : currentLevel.status === 'completed' ? 'All complete' : 'Not started';

  const scrollToLevel = (levelNum: number) => {
    const el = levelRefs.current[levelNum];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={contentRef} style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{pulseStyle}</style>

      {/* Page Header */}
      <div style={{
        marginBottom: 28,
        animation: 'journeyFadeSlideUp 0.3s ease 0ms both',
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#1A202C',
          letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
        }}>
          My Journey
        </h1>
        <p style={{
          fontSize: 14, color: '#718096', lineHeight: 1.6,
          margin: 0, marginBottom: 20,
        }}>
          Your path through the five levels of AI capability.
        </p>

        {/* Enhanced overall progress */}
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
                  navigate('/app/level');
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

        {/* Regeneration link */}
        <div style={{ marginTop: 8 }}>
          <span
            onClick={handleRegenerate}
            style={{
              fontSize: 12, fontWeight: 500, color: '#38B2AC',
              cursor: 'pointer', textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Regenerate your learning plan →
          </span>
        </div>
      </div>

      {/* Level Cards */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
        {levels.map((level, idx) => {
          const planLevel = planData?.levels?.[`L${level.levelNumber}`];
          return (
            <div
              key={level.levelNumber}
              ref={el => { levelRefs.current[level.levelNumber] = el; }}
            >
              <LevelCard
                level={level}
                animDelay={60 + idx * 60}
                projectTitle={planLevel?.projectTitle || null}
                deliverable={planLevel?.deliverable || null}
              />
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
            You've completed all five levels of the Oxygy AI Upskilling Programme.
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
    </div>
  );
};

export default AppJourney;
