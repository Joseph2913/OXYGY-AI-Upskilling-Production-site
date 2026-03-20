// components/app/journey/LevelWalkthrough.tsx
// Inline walkthrough that highlights each assigned level card on the Journey page.
// Renders a backdrop overlay + guidance callout below the active card.

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { LEVEL_META, LEVEL_TOPICS } from '../../../data/levelTopics';
import { getPrimaryTool } from '../../../data/toolkitData';
import type { PathwayApiResponse } from '../../../types';

interface LevelWalkthroughProps {
  planData: PathwayApiResponse;
  /** Ref map so we can scroll to each level card */
  levelRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  onDismiss: () => void;
  /** Called when the active walkthrough level changes — parent should force-expand this card */
  onActiveLevel: (levelNum: number) => void;
}

const FONT = "'DM Sans', sans-serif";

// Guidance copy for each level — describes what the user will do
const LEVEL_GUIDES: Record<number, string> = {
  1: "This is where your AI journey begins. You'll learn the fundamentals of prompt engineering through an interactive e-learning module, curated reading and videos, then put it into practice with the Prompt Playground. Your project will apply these skills directly to your role.",
  2: "Now you'll move from writing one-off prompts to building reusable AI tools. You'll learn to design agents with defined inputs, behaviour, and structured outputs — tools your whole team can use. The Agent Builder is where you'll bring this to life.",
  3: "Here you'll connect individual AI tools into end-to-end automated workflows. You'll learn to map triggers, AI steps, and governance checkpoints, then build a multi-step workflow using the Workflow Designer.",
  4: "This level shifts focus to the user experience. You'll learn to design interactive dashboards that transform raw AI outputs into actionable intelligence, using user-centred design principles and the App Designer.",
  5: "The final level brings everything together. You'll understand how workflows, front-ends, accounts, and personalisation combine into a complete AI application — using this platform as a real-world case study.",
};

const LevelWalkthrough: React.FC<LevelWalkthroughProps> = ({
  planData,
  levelRefs,
  onDismiss,
  onActiveLevel,
}) => {
  const assignedLevels = [1, 2, 3, 4, 5].filter(n => !!planData.levels[`L${n}`]);
  const [stepIndex, setStepIndex] = useState(0);

  // Dismiss if nothing assigned
  useEffect(() => {
    if (assignedLevels.length === 0) onDismiss();
  }, [assignedLevels.length, onDismiss]);

  // Notify parent of active level + scroll into view
  const scrollToCard = useCallback((levelNum: number) => {
    onActiveLevel(levelNum);
    setTimeout(() => {
      const el = levelRefs.current[levelNum];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  }, [levelRefs, onActiveLevel]);

  // Initial scroll on mount
  useEffect(() => {
    if (assignedLevels.length > 0) {
      scrollToCard(assignedLevels[0]);
    }
  }, []); // run once on mount

  if (assignedLevels.length === 0) return null;

  const currentLevelNum = assignedLevels[stepIndex];
  const meta = LEVEL_META.find(m => m.number === currentLevelNum)!;
  const planLevel = planData.levels[`L${currentLevelNum}`];
  const topic = (LEVEL_TOPICS[currentLevelNum] || [])[0];
  const tool = getPrimaryTool(currentLevelNum);
  const isLast = stepIndex === assignedLevels.length - 1;
  const isFirst = stepIndex === 0;

  const goNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      scrollToCard(assignedLevels[nextIdx]);
    }
  };

  const goBack = () => {
    if (!isFirst) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      scrollToCard(assignedLevels[prevIdx]);
    }
  };

  const guideText = LEVEL_GUIDES[currentLevelNum] || meta.tagline;

  return (
    <>
      <style>{`
        @keyframes wtCalloutIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Guidance callout — rendered inline below the active LevelCard */}
      <div
        key={currentLevelNum}
        style={{
          position: 'relative',
          zIndex: 10000,
          marginTop: 12,
          marginBottom: 8,
          animation: 'wtCalloutIn 0.3s ease both',
        }}
      >
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: `1.5px solid ${meta.accentColor}`,
          boxShadow: `0 4px 20px ${meta.accentColor}22`,
          padding: '20px 24px',
          fontFamily: FONT,
        }}>
          {/* Step counter + level indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `${meta.accentColor}33`,
                border: `1.5px solid ${meta.accentColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: meta.accentDark,
              }}>
                {currentLevelNum}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, color: meta.accentDark,
              }}>
                Level {currentLevelNum}: {meta.name}
              </span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#A0AEC0',
            }}>
              {stepIndex + 1} of {assignedLevels.length}
            </span>
          </div>

          {/* Guide text */}
          <div style={{
            fontSize: 13, color: '#4A5568', lineHeight: 1.65,
            marginBottom: 14,
          }}>
            {guideText}
          </div>

          {/* Quick summary chips — topic, tool, project */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            marginBottom: 18,
          }}>
            {topic && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: meta.accentDark,
                background: `${meta.accentColor}15`,
                border: `1px solid ${meta.accentColor}44`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {topic.icon} {topic.title}
              </span>
            )}
            {tool && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: meta.accentDark,
                background: `${meta.accentColor}15`,
                border: `1px solid ${meta.accentColor}44`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {tool.icon} {tool.name}
              </span>
            )}
            {planLevel?.projectTitle && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: meta.accentDark,
                background: `${meta.accentColor}15`,
                border: `1px solid ${meta.accentColor}44`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                📋 {planLevel.projectTitle}
              </span>
            )}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button
              onClick={goBack}
              disabled={isFirst}
              style={{
                background: 'none', border: '1px solid #E2E8F0',
                borderRadius: 20, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, color: isFirst ? '#CBD5E0' : '#4A5568',
                cursor: isFirst ? 'default' : 'pointer',
                fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: isFirst ? 0.4 : 1,
              }}
            >
              <ArrowLeft size={13} /> Back
            </button>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {assignedLevels.map((lvl, i) => {
                const lvlMeta = LEVEL_META.find(m => m.number === lvl)!;
                return (
                  <div
                    key={lvl}
                    style={{
                      width: i === stepIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === stepIndex
                        ? lvlMeta.accentColor
                        : i < stepIndex
                          ? lvlMeta.accentColor + '88'
                          : '#E2E8F0',
                      transition: 'all 0.25s ease',
                    }}
                  />
                );
              })}
            </div>

            <button
              onClick={goNext}
              style={{
                background: meta.accentDark, color: '#FFFFFF', border: 'none',
                borderRadius: 20, padding: '8px 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {isLast ? 'Get Started' : 'Next'} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelWalkthrough;
