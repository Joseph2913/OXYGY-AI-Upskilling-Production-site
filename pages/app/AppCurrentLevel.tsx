import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import LearningPlanBlocker from '../../components/app/LearningPlanBlocker';
import { LEVEL_TOPICS, LEVEL_META } from '../../data/levelTopics';
import { getTopicContent } from '../../data/topicContent';
import { useLevelData, TOTAL_PHASES } from '../../hooks/useLevelData';
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
  const accentColor = levelMeta?.accentColor ?? '#B2D8F7';
  const accentDark = levelMeta?.accentDark ?? '#2B6CB0';
  const levelName = levelMeta?.name ?? 'Fundamentals';
  const topics = LEVEL_TOPICS[currentLevel] || [];

  const { levelData, loading, advanceSlide, completePhase } =
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
    async (topicId: number) => {
      await completePhase(topicId);
      // Navigate directly to the toolkit tool — smooth transition, no intermediate card click needed
      const topic = topics.find(t => t.id === topicId);
      if (topic?.toolkitToolPath) {
        navigate(topic.toolkitToolPath);
      } else {
        setViewingPhase(2);
        scrollToTop();
      }
    },
    [completePhase, topics, navigate, scrollToTop],
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
  const isElearnCompleted = !!selectedProgress.elearnCompletedAt;
  const displayPhase = viewingPhase ?? selectedProgress.phase;
  const completedPhases = isElearnCompleted
    ? TOTAL_PHASES
    : selectedProgress.phaseCompletions.filter(Boolean).length;

  // Look up topic-specific content (slides, articles, videos)
  const topicContent = getTopicContent(currentLevel, selectedTopicId);

  const showPhaseStrip = false; // Phase tabs removed — only e-learning matters

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

    // E-learning completed — show completion screen (unless reviewing)
    if (isElearnCompleted && !isReviewMode) {
      return (
        <CompletedTopicView
          topic={selectedTopic}
          completedDate={selectedProgress.elearnCompletedAt!}
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
          />
        )}

        {/* Phase content */}
        {renderContent()}
      </div>

    </div>
  );
};

export default AppCurrentLevel;
