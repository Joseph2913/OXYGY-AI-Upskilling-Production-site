import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ExternalLink, Copy, ChevronLeft, ChevronRight,
  Zap, Bot, GitBranch, LayoutDashboard, Layers,
  BookOpen, FileText, Award,
} from 'lucide-react';
import { LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS } from '../../../data/levelTopics';
import { timeAgo } from '../../../utils/timeAgo';
import type { Artefact, ArtefactContent, ArtefactType } from '../../../hooks/useArtefactsData';
import { showToast } from '../Toast';
import PromptContent from './content/PromptContent';
import AgentContent from './content/AgentContent';
import WorkflowContent from './content/WorkflowContent';
import DashboardContent from './content/DashboardContent';
import AppSpecContent from './content/AppSpecContent';
import BuildGuideContent from './content/BuildGuideContent';
import PrdContent from './content/PrdContent';
import ProjectProofContent from './content/ProjectProofContent';

const TYPE_ICONS: Record<ArtefactType, React.FC<{ size?: number; color?: string }>> = {
  prompt: Zap, agent: Bot, workflow: GitBranch, dashboard: LayoutDashboard,
  app_spec: Layers, build_guide: BookOpen, prd: FileText, pathway: Zap,
  project_proof: Award,
};

const TYPE_LABELS: Record<ArtefactType, string> = {
  prompt: 'Prompt', agent: 'Agent', workflow: 'Workflow', dashboard: 'Dashboard',
  app_spec: 'App Spec', build_guide: 'Build Guide', prd: 'PRD', pathway: 'Pathway',
  project_proof: 'Project Proof',
};

const TOOL_NAMES: Record<ArtefactType, string> = {
  prompt: 'Prompt Playground', agent: 'Agent Builder', workflow: 'Workflow Canvas',
  dashboard: 'Dashboard Designer', app_spec: 'App Builder',
  build_guide: 'Various', prd: 'Dashboard Designer', pathway: 'Learning Coach',
  project_proof: 'Project Proof',
};

const TOOL_ROUTES: Record<ArtefactType, string> = {
  prompt: '/app/toolkit/prompt-playground', agent: '/app/toolkit/agent-builder',
  workflow: '/app/toolkit/workflow-canvas', dashboard: '/app/toolkit/dashboard-designer',
  app_spec: '/app/toolkit/app-builder', build_guide: '', prd: '/app/toolkit/dashboard-designer',
  pathway: '', project_proof: '',
};

function getCopyText(content: ArtefactContent, type: ArtefactType): string {
  switch (type) {
    case 'prompt': return content.promptText || '';
    case 'agent': return content.systemPrompt || '';
    case 'workflow': return content.designMarkdown || content.summary || '';
    case 'dashboard': return content.description || '';
    case 'app_spec': return content.evaluationMarkdown || content.description || '';
    case 'build_guide': return content.markdown || '';
    case 'prd': return content.prdMarkdown || '';
    case 'project_proof': return content.reflectionText || '';
    default: return '';
  }
}

interface Props {
  artefact: Artefact | null;
  content: ArtefactContent | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateContent: (id: string, content: ArtefactContent) => void;
  filteredArtefacts: Artefact[];
  onNavigate: (id: string) => void;
}

const QuickUsePanel: React.FC<Props> = ({
  artefact, content, isOpen, onClose,
  onRename, onDuplicate, onUpdateContent,
  filteredArtefacts, onNavigate,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const accent = artefact ? LEVEL_ACCENT_COLORS[artefact.level] || '#E2E8F0' : '#E2E8F0';
  const accentDark = artefact ? LEVEL_ACCENT_DARK_COLORS[artefact.level] || '#1A202C' : '#1A202C';
  const Icon = artefact ? TYPE_ICONS[artefact.type] : Zap;

  const currentIndex = artefact ? filteredArtefacts.findIndex((a) => a.id === artefact.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredArtefacts.length - 1;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSaveRename = useCallback(() => {
    if (!artefact) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== artefact.name) {
      onRename(artefact.id, trimmed);
    }
    setEditing(false);
  }, [artefact, editValue, onRename]);

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) {
          setEditing(false);
          setEditValue(artefact?.name || '');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, editing, onClose, artefact]);

  const handleCopy = async () => {
    if (!artefact || !content) return;
    try {
      await navigator.clipboard.writeText(getCopyText(content, artefact.type));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  if (!artefact) return null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {/* Backdrop — clicking outside closes panel */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', top: 54, left: 0, right: 440, bottom: 0,
            zIndex: 19, background: 'transparent',
          }}
        />
      )}

      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 54, right: 0, bottom: 0, width: 440,
          background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
          zIndex: 20, overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header (sticky) */}
        <div
          style={{
            position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 2,
            padding: '20px 24px 16px', borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `${accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={20} color={accentDark} />
              </div>
              <div
                style={{
                  fontSize: 11, fontWeight: 700, color: accentDark,
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6,
                }}
              >
                {TYPE_LABELS[artefact.type]}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex',
              }}
            >
              <X size={18} color="#718096" />
            </button>
          </div>

          {/* Name (inline editable) */}
          <div style={{ marginTop: 12 }}>
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
                  style={{
                    fontSize: 18, fontWeight: 800, color: '#1A202C', letterSpacing: -0.3,
                    fontFamily: "'DM Sans', sans-serif",
                    background: `${accent}10`, border: `1px solid ${accent}`,
                    borderRadius: 6, padding: '2px 6px', width: '100%', outline: 'none',
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
                onDoubleClick={() => { setEditValue(artefact.name); setEditing(true); }}
                style={{
                  fontSize: 18, fontWeight: 800, color: '#1A202C', letterSpacing: -0.3,
                  cursor: 'default',
                }}
              >
                {artefact.name}
              </div>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
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
            <span style={{ fontSize: 12, color: '#718096' }}>
              Created {formatDate(artefact.createdAt)}
            </span>
            {artefact.lastOpenedAt && (
              <span style={{ fontSize: 12, color: '#718096' }}>
                Last opened {timeAgo(artefact.lastOpenedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div
          style={{
            padding: '14px 24px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: 10,
            background: `${accent}08`,
          }}
        >
          {artefact.type === 'project_proof' ? (
            <button
              onClick={() => {
                const level = content?.level || artefact.level;
                navigate(`/app/journey/project/${level}`);
              }}
              style={{
                background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 24,
                padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              View Project Proof
              <ExternalLink size={13} />
            </button>
          ) : TOOL_ROUTES[artefact.type] ? (
            <button
              onClick={() => {
                if (!content || !TOOL_ROUTES[artefact.type]) return;
                navigate(TOOL_ROUTES[artefact.type], {
                  state: {
                    sourceArtefactId: artefact.id,
                    sourceArtefactContent: content,
                    sourceArtefactType: artefact.type,
                  },
                });
              }}
              disabled={!content}
              style={{
                background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 24,
                padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                cursor: content ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                opacity: content ? 1 : 0.5,
              }}
            >
              Launch in {TOOL_NAMES[artefact.type]}
              <ExternalLink size={13} />
            </button>
          ) : null}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {copied ? (
                <span style={{ color: '#22543D' }}>Copied ✓</span>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={() => onDuplicate(artefact.id)}
              style={{
                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
                padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Duplicate
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: 24, flex: 1 }}>
          {content ? (
            <>
              {artefact.type === 'prompt' && (
                <PromptContent
                  content={content}
                  onSave={(updated) => onUpdateContent(artefact.id, updated)}
                />
              )}
              {artefact.type === 'agent' && <AgentContent content={content} />}
              {artefact.type === 'workflow' && <WorkflowContent content={content} />}
              {artefact.type === 'dashboard' && <DashboardContent content={content} />}
              {artefact.type === 'app_spec' && <AppSpecContent content={content} level={artefact.level} />}
              {artefact.type === 'build_guide' && <BuildGuideContent content={content} level={artefact.level} />}
              {artefact.type === 'prd' && <PrdContent content={content} level={artefact.level} />}
              {artefact.type === 'project_proof' && <ProjectProofContent content={content} level={artefact.level} />}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#A0AEC0', fontSize: 13 }}>
              Loading content…
            </div>
          )}
        </div>

        {/* Navigation footer (sticky bottom) */}
        <div
          style={{
            position: 'sticky', bottom: 0, background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0', padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => hasPrev && onNavigate(filteredArtefacts[currentIndex - 1].id)}
            disabled={!hasPrev}
            style={{
              background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#718096', fontWeight: 600, fontFamily: 'inherit',
              opacity: hasPrev ? 1 : 0.35,
            }}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span style={{ fontSize: 12, color: '#A0AEC0' }}>
            {currentIndex >= 0 ? `${currentIndex + 1} of ${filteredArtefacts.length}` : ''}
          </span>

          <button
            onClick={() => hasNext && onNavigate(filteredArtefacts[currentIndex + 1].id)}
            disabled={!hasNext}
            style={{
              background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#718096', fontWeight: 600, fontFamily: 'inherit',
              opacity: hasNext ? 1 : 0.35,
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

export default QuickUsePanel;