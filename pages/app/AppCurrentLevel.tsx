import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { LEVEL_TOPICS, LEVEL_META } from '../../data/levelTopics';
import { useLevelData, TOTAL_PHASES } from '../../hooks/useLevelData';
import TopicHeader from '../../components/app/level/TopicHeader';
import ELearningView from '../../components/app/level/ELearningView';
import ReadView from '../../components/app/level/ReadView';
import WatchView from '../../components/app/level/WatchView';
import PractiseView from '../../components/app/level/PractiseView';
import CompletedTopicView from '../../components/app/level/CompletedTopicView';
import TopicCompletionOverlay from '../../components/app/level/TopicCompletionOverlay';
import LevelCompletionView from '../../components/app/level/LevelCompletionView';

/* ── Phase progress strip (thin segmented bar) ── */
const PHASE_LABELS = ['E-Learning', 'Read', 'Watch', 'Practise'];

function PhaseProgressStrip({
  currentPhase,
  completedPhases,
  accentColor,
  accentDark,
  onPhaseClick,
}: {
  currentPhase: number;
  completedPhases: number;
  accentColor: string;
  accentDark: string;
  onPhaseClick: (phase: number) => void;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      {/* Segmented bar */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {PHASE_LABELS.map((_, i) => {
          const phaseNum = i + 1;
          const isDone = phaseNum <= completedPhases;
          const isActive = phaseNum === currentPhase;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: isDone ? '#1A202C' : isActive ? accentColor : '#E2E8F0',
                transition: 'background 0.3s ease',
              }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', gap: 3 }}>
        {PHASE_LABELS.map((label, i) => {
          const phaseNum = i + 1;
          const isDone = phaseNum <= completedPhases;
          const isActive = phaseNum === currentPhase;
          const isClickable = isDone || isActive;
          return (
            <div
              key={i}
              onClick={() => isClickable && onPhaseClick(phaseNum)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: isClickable ? 'pointer' : 'default',
                padding: '4px 0',
              }}
            >
              {isDone && (
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1A202C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={8} color="#FFFFFF" strokeWidth={3} />
                </div>
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : isDone ? 600 : 500,
                  color: isActive ? accentDark : isDone ? '#4A5568' : '#A0AEC0',
                  textDecoration: isDone ? 'line-through' : 'none',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AppCurrentLevel: React.FC = () => {
  const { userProfile, setCurrentLevel } = useAppContext();
  const currentLevel = userProfile?.currentLevel ?? 1;
  const levelMeta = LEVEL_META.find((l) => l.number === currentLevel);
  const accentColor = levelMeta?.accentColor ?? '#A8F0E0';
  const accentDark = levelMeta?.accentDark ?? '#1A6B5F';
  const levelName = levelMeta?.name ?? 'Fundamentals';
  const topics = LEVEL_TOPICS[currentLevel] || [];

  const { levelData, loading, advanceSlide, completePhase, completeTopic } =
    useLevelData(currentLevel);

  const [searchParams] = useSearchParams();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [viewingPhase, setViewingPhase] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine which topic to show: URL param > active topic
  useEffect(() => {
    if (!levelData) return;
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      const paramId = parseInt(topicParam, 10);
      if (topics.find((t) => t.id === paramId)) {
        setSelectedTopicId(paramId);
        return;
      }
    }
    setSelectedTopicId(levelData.activeTopicId);
  }, [levelData, searchParams, topics]);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const switchToTopic = useCallback(
    (topicId: number) => {
      setContentVisible(false);
      setViewingPhase(null);
      setIsReviewMode(false);
      setTimeout(() => {
        setSelectedTopicId(topicId);
        scrollToTop();
        setContentVisible(true);
      }, 100);
    },
    [scrollToTop],
  );

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
      setViewingPhase(null);
      setIsReviewMode(false);
      scrollToTop();
    },
    [completePhase, scrollToTop],
  );

  const handleCompleteTopic = useCallback(
    (topicId: number) => {
      completeTopic(topicId);

      const allComplete =
        levelData?.topicProgress.every((tp) =>
          tp.topicId === topicId ? true : !!tp.completedAt,
        ) ?? false;

      if (allComplete) {
        setShowLevelCompletion(true);
      } else {
        setShowCompletionOverlay(true);
      }
    },
    [completeTopic, levelData],
  );

  const nextTopicTitle = useCallback(
    (currentTopicId: number): string => {
      const idx = topics.findIndex((t) => t.id === currentTopicId);
      if (idx >= 0 && idx < topics.length - 1) return topics[idx + 1].title;
      return '';
    },
    [topics],
  );

  const handleOverlayComplete = useCallback(() => {
    setShowCompletionOverlay(false);
    if (selectedTopicId !== null) {
      const idx = topics.findIndex((t) => t.id === selectedTopicId);
      if (idx >= 0 && idx < topics.length - 1) {
        switchToTopic(topics[idx + 1].id);
      }
    }
  }, [selectedTopicId, topics, switchToTopic]);

  const handleContinueToNextLevel = useCallback(() => {
    const nextLevel = Math.min(currentLevel + 1, 5);
    setCurrentLevel(nextLevel);
    setShowLevelCompletion(false);
    setSelectedTopicId(null);
    setViewingPhase(null);
    setIsReviewMode(false);
  }, [currentLevel, setCurrentLevel]);

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
  const completedPhases = isCompleted ? TOTAL_PHASES : selectedProgress.phase - 1;

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
          hasNextTopic={topicIndex < topics.length - 1}
          onReviewELearning={() => {
            setViewingPhase(1);
            setIsReviewMode(true);
            scrollToTop();
          }}
          onNextTopic={() => {
            if (topicIndex < topics.length - 1) {
              switchToTopic(topics[topicIndex + 1].id);
            }
          }}
        />
      );
    }

    // Active / review phase content
    return (
      <>
        {displayPhase === 1 && (
          <ELearningView
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

        {displayPhase === 2 && (
          <ReadView
            accentColor={accentColor}
            accentDark={accentDark}
            onCompletePhase={() => handleCompletePhase(selectedTopicId)}
          />
        )}

        {displayPhase === 3 && (
          <WatchView
            accentColor={accentColor}
            accentDark={accentDark}
            onCompletePhase={() => handleCompletePhase(selectedTopicId)}
          />
        )}

        {displayPhase === 4 && (
          <PractiseView
            accentColor={accentColor}
            accentDark={accentDark}
            onCompleteTopic={() => handleCompleteTopic(selectedTopicId)}
          />
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
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        {/* Topic hero card */}
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
            onPhaseClick={handlePhaseClick}
          />
        )}

        {/* Phase content */}
        {renderContent()}

        {/* Phase progress strip — below content */}
        {showPhaseStrip && (
          <PhaseProgressStrip
            currentPhase={isReviewMode ? displayPhase : selectedProgress.phase}
            completedPhases={completedPhases}
            accentColor={accentColor}
            accentDark={accentDark}
            onPhaseClick={handlePhaseClick}
          />
        )}
      </div>

      {/* Topic completion overlay */}
      {showCompletionOverlay && selectedTopicId !== null && (
        <TopicCompletionOverlay
          levelNumber={currentLevel}
          nextTopicTitle={nextTopicTitle(selectedTopicId)}
          onComplete={handleOverlayComplete}
        />
      )}
    </div>
  );
};

export default AppCurrentLevel;
