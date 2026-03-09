import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Tool } from '../../../data/toolkitData';
import { BUILT_ROUTES } from './ToolDetailPanel';

type ToolState = 'unlocked' | 'in-progress' | 'locked';

interface ToolCardProps {
  tool: Tool;
  state: ToolState;
  isSelected: boolean;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, state, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const accent = tool.accentColor;
  const accentDark = tool.accentDark;

  const isLocked = state === 'locked';
  const isUnlocked = state === 'unlocked';

  const cardBorder = isUnlocked ? `${accent}88` : '#E2E8F0';
  const cardLeftBorder = isUnlocked ? accent : state === 'in-progress' ? `${accent}66` : '#E2E8F0';
  const cardBg = isUnlocked ? `${accent}10` : '#FFFFFF';

  const hoverBorder = isUnlocked ? accent : isLocked ? '#E2E8F0' : '#CBD5E0';
  const hoverTransform = !isLocked && hovered ? 'translateY(-1px)' : 'none';
  const opacity = isLocked ? (hovered ? 0.85 : 0.65) : 1;

  // Status badge
  let badgeText = '';
  let badgeBg = '';
  let badgeColor = '';
  let badgeBorder = '';
  if (isUnlocked) {
    badgeText = 'UNLOCKED';
    badgeBg = `${accent}44`;
    badgeColor = accentDark;
    badgeBorder = `${accent}88`;
  } else if (state === 'in-progress') {
    badgeText = 'IN PROGRESS';
    badgeBg = 'transparent';
    badgeColor = accentDark;
    badgeBorder = `${accent}66`;
  } else {
    badgeText = `LEVEL ${tool.levelRequired}`;
    badgeBg = '#F7FAFC';
    badgeColor = '#A0AEC0';
    badgeBorder = '#E2E8F0';
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        border: `1px solid ${hovered ? hoverBorder : cardBorder}`,
        borderLeft: `4px solid ${cardLeftBorder}`,
        background: cardBg,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, opacity 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
        transform: hoverTransform,
        opacity,
        boxShadow: isSelected ? `0 0 0 2px ${accent}` : 'none',
      }}
    >
      {/* Row 1: Tool header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isLocked ? '#F0F0F0' : `${accent}55`,
            fontSize: 22,
          }}>
            {isLocked ? <Lock size={18} color="#CBD5E0" /> : tool.icon}
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px',
              color: isLocked ? '#A0AEC0' : '#1A202C',
            }}>
              {tool.name}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500, marginTop: 2,
              color: isLocked ? '#A0AEC0' : accentDark,
            }}>
              Level {tool.levelRequired} · {tool.levelName}
            </div>
          </div>
        </div>
        <div style={{
          background: badgeBg, color: badgeColor,
          border: `1px solid ${badgeBorder}`,
          borderRadius: 20, padding: '3px 10px',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, flexShrink: 0,
        }}>
          {badgeText}
        </div>
      </div>

      {/* Row 2: Description */}
      <div style={{
        fontSize: 13, lineHeight: 1.6,
        color: isLocked ? '#A0AEC0' : '#718096',
      }}>
        {tool.description}
      </div>

      {/* Row 3: Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: 12, fontWeight: BUILT_ROUTES.has(tool.route) ? 700 : 500,
          color: isLocked && !BUILT_ROUTES.has(tool.route) ? '#A0AEC0' : accentDark,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {BUILT_ROUTES.has(tool.route)
            ? <>Open tool <ArrowRight size={12} /></>
            : 'Coming soon'}
        </div>
        <div style={{
          background: '#F7FAFC', border: '1px solid #E2E8F0',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 10, fontWeight: 600, color: '#718096',
          textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        }}>
          {tool.toolType}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
