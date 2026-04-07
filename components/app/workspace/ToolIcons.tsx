import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

/* ── Prompt Playground: pen editing a text line ── */
export const PromptIcon: React.FC<IconProps> = ({ size = 28, color = '#2B6CB0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ── Agent Builder: bot / robot ── */
export const AgentIcon: React.FC<IconProps> = ({ size = 28, color = '#8A6A00' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5" />
    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5" />
  </svg>
);

/* ── Workflow Canvas: branching flow / git-branch style ── */
export const WorkflowIcon: React.FC<IconProps> = ({ size = 28, color = '#1A7A76' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <path d="M6 9v6c0 1.657 1.343 3 3 3h6" />
    <path d="M18 9v0" />
  </svg>
);

/* ── App Designer: layout / window with panels ── */
export const DashboardIcon: React.FC<IconProps> = ({ size = 28, color = '#8C3A1A' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="9" x2="9" y2="21" />
  </svg>
);

/* ── App Evaluator: clipboard with checkmark ── */
export const EvaluatorIcon: React.FC<IconProps> = ({ size = 28, color = '#2E3F8F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

/* ── Learning Coach: open book ── */
export const CoachIcon: React.FC<IconProps> = ({ size = 28, color = '#2C9A94' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export const TOOL_ICON_MAP: Record<string, React.FC<IconProps>> = {
  'prompt-playground': PromptIcon,
  'agent-builder': AgentIcon,
  'workflow-canvas': WorkflowIcon,
  'dashboard-designer': DashboardIcon,
  'ai-app-evaluator': EvaluatorIcon,
  'learning-coach': CoachIcon,
};
