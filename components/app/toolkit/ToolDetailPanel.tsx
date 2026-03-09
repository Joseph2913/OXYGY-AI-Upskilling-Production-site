import React, { useEffect } from 'react';
import { X, Check, Lock } from 'lucide-react';
import { Tool, ALL_TOOLS } from '../../../data/toolkitData';
import { LEVEL_META } from '../../../data/levelTopics';

type ToolState = 'unlocked' | 'in-progress' | 'locked';

// Routes that have real pages built
const BUILT_ROUTES = new Set([
  '/app/toolkit/prompt-playground',
  '/app/toolkit/prompt-library',
  '/app/toolkit/agent-builder',
  '/app/toolkit/workflow-canvas',
  '/app/toolkit/dashboard-designer',
  '/app/toolkit/app-builder',
  '/app/toolkit/ai-app-evaluator',
]);

interface ToolDetailPanelProps {
  tool: Tool;
  state: ToolState;
  currentLevel: number;
  onClose: () => void;
  onSelectTool: (tool: Tool) => void;
  onNavigateToTool: (tool: Tool) => void;
}

const ToolDetailPanel: React.FC<ToolDetailPanelProps> = ({
  tool, state, currentLevel, onClose, onSelectTool, onNavigateToTool,
}) => {
  const accent = tool.accentColor;
  const accentDark = tool.accentDark;
  const meta = LEVEL_META.find(m => m.number === tool.levelRequired);
  const isLocked = state === 'locked';
  const isUnlocked = state === 'unlocked';

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Related tools (same level, different tool)
  const relatedTools = ALL_TOOLS.filter(
    t => t.levelRequired === tool.levelRequired && t.id !== tool.id
  ).slice(0, 2);

  // Status section
  let statusBg = '';
  let statusBorder = '';
  let statusPillText = '';
  let statusPillBg = '';
  let statusPillColor = '';
  let statusPillBorder = '';
  if (isUnlocked) {
    statusBg = `${accent}12`;
    statusBorder = `${accent}33`;
    statusPillText = 'UNLOCKED';
    statusPillBg = `${accent}44`;
    statusPillColor = accentDark;
    statusPillBorder = `${accent}88`;
  } else if (state === 'in-progress') {
    statusBg = `${accent}08`;
    statusBorder = '#E2E8F0';
    statusPillText = 'IN PROGRESS';
    statusPillBg = 'transparent';
    statusPillColor = accentDark;
    statusPillBorder = `${accent}66`;
  } else {
    statusBg = '#F7FAFC';
    statusBorder = '#E2E8F0';
    statusPillText = 'LOCKED';
    statusPillBg = '#F7FAFC';
    statusPillColor = '#A0AEC0';
    statusPillBorder = '#E2E8F0';
  }

  return (
    <div style={{
      position: 'fixed', top: 54, right: 0, bottom: 0,
      width: 420, background: '#FFFFFF',
      borderLeft: '1px solid #E2E8F0',
      zIndex: 20, overflowY: 'auto',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 2,
        padding: '20px 24px 16px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isLocked ? '#F0F0F0' : `${accent}55`,
            fontSize: 24,
          }}>
            {isLocked ? <Lock size={20} color="#CBD5E0" /> : tool.icon}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.3px' }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 3 }}>
            Level {tool.levelRequired} · {tool.levelName} · {tool.toolType}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#718096', display: 'flex',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A202C')}
          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Status section */}
      <div style={{
        background: statusBg,
        borderBottom: `1px solid ${statusBorder}`,
        padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            background: statusPillBg, color: statusPillColor,
            border: `1px solid ${statusPillBorder}`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
          }}>
            {statusPillText}
          </div>
          {BUILT_ROUTES.has(tool.route) && (
            <button
              onClick={() => onNavigateToTool(tool)}
              style={{
                background: '#38B2AC', color: '#FFFFFF', border: 'none',
                borderRadius: 24, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2D9E99')}
              onMouseLeave={e => (e.currentTarget.style.background = '#38B2AC')}
            >
              Open Tool →
            </button>
          )}
        </div>
        {state === 'in-progress' && (
          <div style={{ fontSize: 13, color: '#4A5568', marginTop: 8 }}>
            Complete Level {tool.levelRequired} to unlock this tool. You're currently on Level {currentLevel}.
          </div>
        )}
        {isLocked && (
          <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 8 }}>
            This tool unlocks when you complete Level {tool.levelRequired - 1}. Keep progressing to earn access.
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        {/* About */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#718096',
          textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8,
        }}>
          About
        </div>
        <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, marginBottom: 20 }}>
          {tool.description}
        </div>

        {/* Capabilities */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#718096',
          textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8,
        }}>
          What You Can Do
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {tool.capabilities.map((cap, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Check size={13} color={accentDark} style={{ marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{cap}</span>
            </div>
          ))}
        </div>

        {/* Unlocked at level */}
        <div style={{
          background: `${accent}10`, borderRadius: 10,
          padding: '14px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `${accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: accentDark,
          }}>
            {tool.levelRequired}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>
              Unlocked at Level {tool.levelRequired}
            </div>
            <div style={{ fontSize: 12, color: '#718096' }}>
              {meta?.name ?? tool.levelName}
            </div>
          </div>
        </div>

        {/* Related tools (only for unlocked) */}
        {isUnlocked && relatedTools.length > 0 && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 4 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#718096',
              textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10,
            }}>
              Related Tools
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {relatedTools.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => onSelectTool(rt)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20,
                    border: '1px solid #E2E8F0', background: '#F7FAFC',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#4A5568',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#CBD5E0')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                >
                  {rt.icon} {rt.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { BUILT_ROUTES };
export default ToolDetailPanel;
