import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import LearningPlanBlocker from '../../components/app/LearningPlanBlocker';
import { LEVEL_TOPICS, LEVEL_META } from '../../data/levelTopics';
import { getTopicContent } from '../../data/topicContent';
import { ALL_TOOLS } from '../../data/toolkitData';
import { useLevelData, TOTAL_PHASES, isToolkitUnlocked, isProjectUnlocked } from '../../hooks/useLevelData';
import TopicHeader from '../../components/app/level/TopicHeader';
import ELearningView from '../../components/app/level/ELearningView';
import CompletedTopicView from '../../components/app/level/CompletedTopicView';
import LevelCompletionView from '../../components/app/level/LevelCompletionView';


const AppCurrentLevel: React.FC = () => {
  const { userProfile, setCurrentLevel, hasLearningPlan, learningPlanLoading } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use ?level= query param if present (e.g. from Review button), else fall back to profile
  const levelParam = searchParams.get('level');
  const currentLevel = levelParam ? parseInt(levelParam, 10) : (userProfile?.currentLevel ?? 1);

  const levelMeta = LEVEL_META.find((l) => l.number === currentLevel);
  const accentColor = levelMeta?.accentColor ?? '#A8F0E0';
  const accentDark = levelMeta?.accentDark ?? '#1A6B5F';
  const levelName = levelMeta?.name ?? 'Fundamentals';
  const topics = LEVEL_TOPICS[currentLevel] || [];

  const { levelData, loading, advanceSlide, completePhase, completeTopic, markToolkitComplete } =
    useLevelData(currentLevel);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [viewingPhase, setViewingPhase] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine which topic to show: URL param > active topic
  useEffect(() => {
    if (!levelData) return;
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      const paramId = parseInt(topicParam, 10);
      if (topics.find((t) => t.id === paramId)) {
        setSelectedTopicId(paramId);
      }
    } else {
      setSelectedTopicId(levelData.activeTopicId);
    }
    // If ?phase=1 is present, jump straight into e-learning review
    const phaseParam = searchParams.get('phase');
    if (phaseParam === '1') {
      setViewingPhase(1);
      setIsReviewMode(true);
    }
  }, [levelData, searchParams, topics]);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const handlePhaseClick = useCallback(
    (phase: number) => {
      setViewingPhase(phase);
      setIsReviewMode(true);
      scrollToTop();
    },
    [scrollToTop],
  );

  const handleCompletePhase = useCallback(
    (topicId: number) => {
      completePhase(topicId);
      setViewingPhase(2); // explicitly show toolkit section
      scrollToTop();
    },
    [completePhase, scrollToTop],
  );

  const handleCompleteTopic = useCallback(
    (topicId: number) => {
      completeTopic(topicId);
      setShowLevelCompletion(true);
    },
    [completeTopic],
  );

  const handleContinueToNextLevel = useCallback(() => {
    const nextLevel = Math.min(currentLevel + 1, 5);
    setCurrentLevel(nextLevel);
    setShowLevelCompletion(false);
    setSelectedTopicId(null);
    setViewingPhase(null);
    setIsReviewMode(false);
  }, [currentLevel, setCurrentLevel]);

  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="Current Level" />;

  // Loading state
  if (loading || !levelData || selectedTopicId === null) {
    return (
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 54px)',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7FAFC',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 14, color: '#718096' }}>Loading…</div>
      </div>
    );
  }

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const selectedProgress = levelData.topicProgress.find((tp) => tp.topicId === selectedTopicId);

  if (!selectedTopic || !selectedProgress) return null;

  const topicIndex = topics.findIndex((t) => t.id === selectedTopicId);
  const isCompleted = !!selectedProgress.completedAt;
  const displayPhase = viewingPhase ?? selectedProgress.phase;
  const completedPhases = isCompleted
    ? TOTAL_PHASES
    : selectedProgress.phaseCompletions.filter(Boolean).length;

  // Look up topic-specific content (slides, articles, videos)
  const topicContent = getTopicContent(currentLevel, selectedTopicId);

  const showPhaseStrip = !showLevelCompletion && !(isCompleted && !isReviewMode);

  const renderContent = () => {
    // Level completion takes over
    if (showLevelCompletion) {
      return (
        <LevelCompletionView
          levelNumber={currentLevel}
          accentColor={accentColor}
          accentDark={accentDark}
          onContinueToNextLevel={handleContinueToNextLevel}
        />
      );
    }

    // Completed topic — not reviewing
    if (isCompleted && !isReviewMode) {
      return (
        <CompletedTopicView
          topic={selectedTopic}
          completedDate={selectedProgress.completedAt!}
          accentColor={accentColor}
          accentDark={accentDark}
          onReviewELearning={() => {
            setViewingPhase(1);
            setIsReviewMode(true);
            scrollToTop();
          }}
        />
      );
    }

    // Active / review phase content
    return (
      <>
        {displayPhase === 1 && topicContent && (
          <ELearningView
            slides={topicContent.slides}
            currentSlide={selectedProgress.slide}
            accentColor={accentColor}
            accentDark={accentDark}
            isReview={isReviewMode}
            onSlideChange={(slide) => advanceSlide(selectedTopicId, slide)}
            onCompletePhase={() => handleCompletePhase(selectedTopicId)}
            onBackToSummary={() => {
              setViewingPhase(null);
              setIsReviewMode(false);
              scrollToTop();
            }}
          />
        )}

        {displayPhase === 1 && !topicContent && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: '48px 24px' }}>
            <div style={{ fontSize: 40 }}>🚧</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A202C' }}>E-learning coming soon</div>
            <div style={{ fontSize: 14, color: '#718096', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
              The interactive module for this level is being built. Check back soon.
            </div>
          </div>
        )}

        {displayPhase === 2 && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
            <div style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', border: `1.5px solid ${accentColor}44`, borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>

              {/* Phase heading */}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accentColor}18`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>⚙️</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentDark, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>TOOLKIT — PHASE 2</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 10 }}>
                {selectedTopic.toolkitToolId
                  ? `Use the ${ALL_TOOLS.find(t => t.id === selectedTopic.toolkitToolId)?.name ?? 'toolkit'}`
                  : 'Apply it with the toolkit'}
              </div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, marginBottom: 24 }}>
                {selectedTopic.phases[1]?.detail ?? 'Open the toolkit and work through all steps to complete this phase.'}
              </div>

              {/* Completion state */}
              {selectedProgress.phaseCompletions[1] ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#276749', fontWeight: 600 }}>
                    ✓ Toolkit phase complete — Project unlocked
                  </div>
                  <button
                    onClick={() => { setViewingPhase(3); scrollToTop(); }}
                    style={{ background: accentColor, color: '#FFFFFF', border: 'none', borderRadius: 24, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Continue to Project →
                  </button>
                </div>
              ) : (
                <a
                  href={selectedTopic.toolkitToolPath}
                  style={{ display: 'block', background: accentColor, color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 24, textDecoration: 'none' }}
                >
                  Open {ALL_TOOLS.find(t => t.id === selectedTopic.toolkitToolId)?.name ?? 'Toolkit'} →
                </a>
              )}
            </div>
          </div>
        )}

        {displayPhase === 3 && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
            <div style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', border: `1.5px solid ${accentColor}44`, borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accentColor}18`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>◈</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentDark, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>PROJECT — PHASE 3</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 10 }}>Apply it to a real challenge</div>
              <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, marginBottom: 24 }}>
                {selectedTopic.phases[2]?.detail ?? 'Complete and submit your project to finish this topic.'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href="/app/projects"
                  style={{ display: 'block', background: accentColor, color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 24, textDecoration: 'none' }}
                >
                  Go to My Projects →
                </a>
                {!selectedProgress.phaseCompletions[2] && (
                  <button
                    onClick={() => handleCompleteTopic(selectedTopicId)}
                    style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 24, padding: '11px 28px', fontSize: 13, fontWeight: 600, color: '#718096', cursor: 'pointer' }}
                  >
                    Mark topic as complete
                  </button>
                )}
                {selectedProgress.phaseCompletions[2] && (
                  <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#276749', fontWeight: 600 }}>
                    ✓ Project complete — topic finished
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      ref={scrollRef}
      style={{
        height: 'calc(100vh - 54px)',
        overflowY: 'auto',
        background: '#F7FAFC',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '28px 36px 48px',
          opacity: 1,
        }}
      >
        {/* Back to My Journey breadcrumb */}
        {!showLevelCompletion && (
          <button
            onClick={() => navigate('/app/journey')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#718096', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, padding: 0, marginBottom: 16,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            My Journey
          </button>
        )}

        {/* Topic hero + phase tabs — single compact bar */}
        {!showLevelCompletion && (
          <TopicHeader
            levelNumber={currentLevel}
            levelName={levelName}
            topic={selectedTopic}
            topicIndex={topicIndex}
            totalTopics={topics.length}
            currentPhase={isReviewMode ? displayPhase : selectedProgress.phase}
            completedPhases={completedPhases}
            accentColor={accentColor}
            accentDark={accentDark}
            showPhaseTabs={showPhaseStrip}
            onPhaseClick={handlePhaseClick}
            phaseCompletions={selectedProgress.phaseCompletions}
            toolkitUnlocked={isToolkitUnlocked(selectedProgress)}
            projectUnlocked={isProjectUnlocked(selectedProgress)}
          />
        )}

        {/* Phase content */}
        {renderContent()}
      </div>

    </div>
  );
};

export default AppCurrentLevel;
