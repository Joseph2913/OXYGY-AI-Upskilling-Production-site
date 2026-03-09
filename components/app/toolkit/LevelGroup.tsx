import React from 'react';
import { Tool } from '../../../data/toolkitData';
import { LEVEL_META } from '../../../data/levelTopics';
import ToolCard from './ToolCard';

type ToolState = 'unlocked' | 'in-progress' | 'locked';

interface LevelGroupProps {
  levelNumber: number;
  tools: Tool[];
  getToolState: (tool: Tool) => ToolState;
  selectedToolId: string | null;
  onToolClick: (tool: Tool) => void;
  animDelay: number;
}

const LevelGroup: React.FC<LevelGroupProps> = ({
  levelNumber, tools, getToolState, selectedToolId, onToolClick, animDelay,
}) => {
  const meta = LEVEL_META.find(m => m.number === levelNumber);
  const accent = meta?.accentColor ?? '#E2E8F0';
  const accentDark = meta?.accentDark ?? '#718096';
  const shortName = meta?.shortName ?? '';

  // Determine level status from tools
  const states = tools.map(t => getToolState(t));
  const allUnlocked = states.every(s => s === 'unlocked');
  const hasInProgress = states.some(s => s === 'in-progress');
  const allLocked = states.every(s => s === 'locked');

  let levelBadgeText = '';
  let levelBadgeBg = '';
  let levelBadgeColor = '';
  let levelBadgeBorder = '';
  if (allUnlocked) {
    levelBadgeText = '✓ Unlocked';
    levelBadgeBg = `${accent}22`;
    levelBadgeColor = accentDark;
    levelBadgeBorder = `${accent}88`;
  } else if (hasInProgress) {
    levelBadgeText = '● Active';
    levelBadgeBg = `${accent}22`;
    levelBadgeColor = accentDark;
    levelBadgeBorder = `${accent}88`;
  } else {
    levelBadgeText = '🔒 Locked';
    levelBadgeBg = '#F7FAFC';
    levelBadgeColor = '#A0AEC0';
    levelBadgeBorder = '#E2E8F0';
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      animation: `tkFadeSlideUp 0.3s ease ${animDelay}ms both`,
    }}>
      {/* Level group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${accent}55`, border: `1px solid ${accent}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: accentDark,
        }}>
          {levelNumber}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
            Level {levelNumber} · {shortName}
          </div>
          <div style={{ fontSize: 12, color: allLocked ? '#A0AEC0' : '#718096' }}>
            {allLocked
              ? `Complete Level ${levelNumber - 1} to unlock`
              : `${tools.length} tools`}
          </div>
        </div>
        <div style={{
          padding: '3px 12px', borderRadius: 20,
          background: levelBadgeBg, border: `1px solid ${levelBadgeBorder}`,
          fontSize: 11, fontWeight: 600, color: levelBadgeColor,
        }}>
          {levelBadgeText}
        </div>
      </div>

      {/* Tool grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {tools.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            state={getToolState(tool)}
            isSelected={selectedToolId === tool.id}
            onClick={() => onToolClick(tool)}
          />
        ))}
      </div>
    </div>
  );
};

export default LevelGroup;
