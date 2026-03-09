import React, { useState, useRef, useEffect } from 'react';
import {
  Zap, Bot, GitBranch, LayoutDashboard, Layers,
} from 'lucide-react';
import { LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS } from '../../../data/levelTopics';
import { timeAgo } from '../../../utils/timeAgo';
import type { Artefact, ArtefactType } from '../../../hooks/useArtefactsData';

const TYPE_ICONS: Record<ArtefactType, React.FC<{ size?: number; color?: string }>> = {
  prompt: Zap,
  agent: Bot,
  workflow: GitBranch,
  dashboard: LayoutDashboard,
  app_spec: Layers,
};

const TYPE_LABELS: Record<ArtefactType, string> = {
  prompt: 'Prompt',
  agent: 'Agent',
  workflow: 'Workflow',
  dashboard: 'Dashboard',
  app_spec: 'App Spec',
};

interface Props {
  artefact: Artefact;
  isSelected: boolean;
  index: number;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

const ArtefactCard: React.FC<Props> = ({
  artefact, isSelected, index, onOpen, onDuplicate, onArchive, onRename,
}) => {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(artefact.name);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  const accent = LEVEL_ACCENT_COLORS[artefact.level] || '#E2E8F0';
  const accentDark = LEVEL_ACCENT_DARK_COLORS[artefact.level] || '#1A202C';
  const Icon = TYPE_ICONS[artefact.type];
  const staggerDelay = Math.min(index, 11) * 40;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSaveRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== artefact.name) {
      onRename(artefact.id, trimmed);
    } else {
      setEditValue(artefact.name);
    }
    setEditing(false);
  };

  const handleArchiveClick = () => {
    if (!archiveConfirm) {
      setArchiveConfirm(true);
      return;
    }
    setArchiving(true);
    setTimeout(() => onArchive(artefact.id), 150);
  };

  const timestamp = artefact.lastOpenedAt || artefact.createdAt;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setArchiveConfirm(false); setShowTooltip(false); clearTimeout(tooltipTimer.current); }}
      onClick={() => { if (!editing) onOpen(artefact.id); }}
      style={{
        borderRadius: 14,
        border: `1px solid ${isSelected || hovered ? accent : '#E2E8F0'}`,
        borderLeft: `4px solid ${accent}`,
        background: '#FFFFFF',
        padding: '18px 20px',
        cursor: editing ? 'default' : 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transform: hovered && !isSelected ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected
          ? `0 0 0 2px ${accent}66`
          : hovered
            ? `0 4px 16px ${accent}28`
            : 'none',
        animation: `fadeSlideUp 0.3s ease-out ${staggerDelay}ms both`,
        opacity: archiving ? 0 : undefined,
        ...(archiving ? { transform: 'scale(0.95)', transition: 'opacity 0.15s, transform 0.15s' } : {}),
      }}
    >
      {/* Row 1: Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Icon size={15} color={accentDark} />
          </div>
          <span
            style={{
              background: `${accent}33`, border: `1px solid ${accent}66`,
              borderRadius: 20, padding: '2px 8px',
              fontSize: 10, fontWeight: 700, color: accentDark,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            Level {artefact.level}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#A0AEC0' }}>{timeAgo(timestamp)}</span>
      </div>

      {/* Row 2: Name (inline editable) */}
      <div style={{ position: 'relative' }}>
        {editing ? (
          <div>
            <input
              ref={inputRef}
              value={editValue}
              maxLength={80}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') { setEditValue(artefact.name); setEditing(false); }
                e.stopPropagation();
              }}
              onBlur={handleSaveRename}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 14, fontWeight: 700, color: '#1A202C',
                fontFamily: "'DM Sans', sans-serif",
                background: `${accent}10`, border: `1px solid ${accent}`,
                borderRadius: 6, padding: '2px 6px', width: '100%',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: '#A0AEC0' }}>Press Enter to save · Esc to cancel</span>
              {editValue.length > 60 && (
                <span style={{ fontSize: 11, color: '#A0AEC0' }}>{editValue.length}/80</span>
              )}
            </div>
          </div>
        ) : (
          <div
            onDoubleClick={(e) => { e.stopPropagation(); setEditValue(artefact.name); setEditing(true); }}
            onMouseEnter={() => { tooltipTimer.current = setTimeout(() => setShowTooltip(true), 600); }}
            onMouseLeave={() => { clearTimeout(tooltipTimer.current); setShowTooltip(false); }}
            style={{
              fontSize: 14, fontWeight: 700, color: '#1A202C',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              position: 'relative',
            }}
          >
            {artefact.name}
            {showTooltip && (
              <span
                style={{
                  position: 'absolute', top: -30, left: 0,
                  fontSize: 11, background: '#1A202C', color: '#FFFFFF',
                  padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                Double-click to rename
              </span>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Preview */}
      <div
        style={{
          fontSize: 12, color: '#718096', lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}
      >
        {artefact.preview || `${TYPE_LABELS[artefact.type]} artefact`}
      </div>

      {/* Row 4: Action strip (hover only) */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
        }}
      >
        {archiveConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#718096' }}>
            <span>Archive this?</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleArchiveClick(); }}
              style={{
                background: '#FED7D7', border: '1px solid #FEB2B2', borderRadius: 12,
                padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#9B2C2C',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Yes
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setArchiveConfirm(false); }}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(artefact.id); }}
              style={{
                background: accent, color: accentDark, border: 'none', borderRadius: 20,
                padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Open
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(artefact.id); }}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Duplicate
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setArchiveConfirm(true); }}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Archive
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(artefact.name); setEditing(true); }}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#718096',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Rename
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ArtefactCard;
export { TYPE_ICONS, TYPE_LABELS };