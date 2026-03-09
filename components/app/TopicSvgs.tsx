import React from 'react';

/**
 * Simple SVG icons for each topic.
 * Each is a single centered icon with a subtle hover animation.
 */

type SvgProps = { accent: string; accentDark: string; active: boolean };

const wrap = (active: boolean): React.CSSProperties => ({
  width: '100%',
  height: '100%',
  transition: 'transform 0.3s ease',
  transform: active ? 'scale(1.08)' : 'scale(1)',
});

/* ─── L1T1: Prompt Engineering — Chat bubble with cursor ─── */
const SvgPromptEngineering: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <rect x="14" y="16" width="52" height="36" rx="8" fill={accent} opacity={0.4} />
    <path d="M26 52 L22 62 L34 52" fill={accent} opacity={0.4} />
    <rect x="24" y="28" width="28" height="3" rx="1.5" fill={accentDark} opacity={0.5} />
    <rect x="24" y="36" width="18" height="3" rx="1.5" fill={accentDark} opacity={0.3} />
    <rect x="44" y="36" width="2" height="8" rx="1" fill={accentDark} opacity={0.6}>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="1s" repeatCount="indefinite" />
    </rect>
  </svg>
);

/* ─── L1T2: Context Engineering — Stacked document layers ─── */
const SvgContextEngineering: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <rect x="26" y="14" width="34" height="44" rx="4" fill={accent} opacity={0.2} />
    <rect x="22" y="20" width="34" height="44" rx="4" fill={accent} opacity={0.3} />
    <rect x="18" y="26" width="34" height="44" rx="4" fill="#fff" stroke={accent} strokeWidth="1.5" />
    <rect x="24" y="34" width="22" height="2.5" rx="1" fill={accentDark} opacity={0.4} />
    <rect x="24" y="40" width="16" height="2.5" rx="1" fill={accentDark} opacity={0.25} />
    <rect x="24" y="46" width="20" height="2.5" rx="1" fill={accentDark} opacity={0.25} />
    <circle cx="56" cy="54" r="8" fill={accent} opacity={0.35}>
      <animate attributeName="r" values="8;9.5;8" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="56" cy="54" r="3" fill={accentDark} opacity={0.4} />
  </svg>
);

/* ─── L2T1: Designing AI Agents — Simple robot face ─── */
const SvgDesigningAgents: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <rect x="20" y="24" width="40" height="36" rx="10" fill={accent} opacity={0.35} stroke={accentDark} strokeWidth="1" />
    <circle cx="33" cy="40" r="4" fill={accentDark} opacity={0.5}>
      <animate attributeName="r" values="4;3;4" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="47" cy="40" r="4" fill={accentDark} opacity={0.5}>
      <animate attributeName="r" values="4;3;4" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <rect x="30" y="50" width="20" height="3" rx="1.5" fill={accentDark} opacity={0.3} />
    <line x1="40" y1="24" x2="40" y2="16" stroke={accentDark} strokeWidth="1.5" opacity={0.4} />
    <circle cx="40" cy="14" r="3" fill={accent} opacity={0.5}>
      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ─── L2T2: Build Once Share Always — Share/network nodes ─── */
const SvgBuildOnceShare: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <circle cx="40" cy="40" r="10" fill={accent} opacity={0.45} />
    <circle cx="40" cy="40" r="4" fill={accentDark} opacity={0.4} />
    {[
      { cx: 18, cy: 22 }, { cx: 62, cy: 22 },
      { cx: 18, cy: 58 }, { cx: 62, cy: 58 },
    ].map((n, i) => (
      <g key={i}>
        <line x1="40" y1="40" x2={n.cx} y2={n.cy} stroke={accent} strokeWidth="1.5" opacity={0.3} strokeDasharray="3 2">
          <animate attributeName="stroke-dashoffset" values="0;-5" dur="1.5s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
        </line>
        <circle cx={n.cx} cy={n.cy} r="6" fill={accent} opacity={0.3} />
        <circle cx={n.cx} cy={n.cy} r="2.5" fill={accentDark} opacity={0.3} />
      </g>
    ))}
  </svg>
);

/* ─── L3T1: Mapping AI Workflows — Simple flowchart ─── */
const SvgMappingWorkflows: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    {/* Three boxes connected by arrows */}
    <rect x="8" y="32" width="18" height="16" rx="4" fill={accent} opacity={0.35} stroke={accentDark} strokeWidth="0.75" />
    <rect x="31" y="32" width="18" height="16" rx="4" fill={accent} opacity={0.45} stroke={accentDark} strokeWidth="0.75" />
    <rect x="54" y="32" width="18" height="16" rx="4" fill={accent} opacity={0.35} stroke={accentDark} strokeWidth="0.75" />
    <path d="M26 40 L31 40" stroke={accentDark} strokeWidth="1.5" opacity={0.4} />
    <path d="M49 40 L54 40" stroke={accentDark} strokeWidth="1.5" opacity={0.4} />
    <circle r="2" fill={accentDark} opacity={0.5}>
      <animateMotion path="M17 40 L40 40 L63 40" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ─── L3T2: Human-in-the-Loop — Shield with checkmark ─── */
const SvgHumanInTheLoop: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <path
      d="M40 14 L58 22 L58 44 C58 56 40 66 40 66 C40 66 22 56 22 44 L22 22 Z"
      fill={accent} opacity={0.35} stroke={accentDark} strokeWidth="1.5"
    />
    <path d="M32 40 L37 46 L49 33" stroke={accentDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
      <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
    </path>
  </svg>
);

/* ─── L4T1: Designing Back from the User — Bullseye target ─── */
const SvgDesigningFromUser: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <circle cx="40" cy="40" r="28" fill={accent} opacity={0.12} />
    <circle cx="40" cy="40" r="20" fill={accent} opacity={0.2} />
    <circle cx="40" cy="40" r="12" fill={accent} opacity={0.3} />
    <circle cx="40" cy="40" r="5" fill={accentDark} opacity={0.45}>
      <animate attributeName="r" values="5;6.5;5" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ─── L4T2: Data to Designed Intelligence — Bar chart ─── */
const SvgDataToIntelligence: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    {[
      { x: 16, h: 22 },
      { x: 28, h: 34 },
      { x: 40, h: 28 },
      { x: 52, h: 42 },
    ].map((bar, i) => (
      <rect key={i} x={bar.x} y={64 - bar.h} width="9" height={bar.h} rx="2.5"
        fill={accent} opacity={0.4}
      >
        <animate attributeName="height" values={`${bar.h};${bar.h + 4};${bar.h}`} dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
        <animate attributeName="y" values={`${64 - bar.h};${60 - bar.h};${64 - bar.h}`} dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
      </rect>
    ))}
    <line x1="12" y1="64" x2="68" y2="64" stroke={accentDark} strokeWidth="1.5" opacity={0.25} />
  </svg>
);

/* ─── L5T1: Personalised User Experiences — User with content cards ─── */
const SvgPersonalisedExperiences: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    <circle cx="40" cy="28" r="10" fill={accent} opacity={0.4} />
    <circle cx="40" cy="25" r="4" fill={accentDark} opacity={0.3} />
    <rect x="32" y="40" width="16" height="10" rx="5" fill={accent} opacity={0.35} />
    {/* Content cards below */}
    {[-18, 0, 18].map((dx, i) => (
      <rect key={i} x={28 + dx} y={56} width="14" height="10" rx="3" fill={accent} opacity={0.3}>
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
      </rect>
    ))}
  </svg>
);

/* ─── L5T2: The Full-Stack AI Build — Stacked layers ─── */
const SvgFullStackBuild: React.FC<SvgProps> = ({ accent, accentDark, active }) => (
  <svg viewBox="0 0 80 80" fill="none" style={wrap(active)}>
    {[
      { y: 16, op: 0.2 },
      { y: 30, op: 0.3 },
      { y: 44, op: 0.4 },
      { y: 58, op: 0.25 },
    ].map((layer, i) => (
      <g key={i}>
        <rect x="18" y={layer.y} width="44" height="11" rx="3" fill={accent} opacity={layer.op} stroke={accentDark} strokeWidth="0.75" />
        <rect x="24" y={layer.y + 4} width={14 + i * 3} height="2.5" rx="1" fill={accentDark} opacity={0.2} />
      </g>
    ))}
    <circle r="1.5" fill={accentDark} opacity={0.5}>
      <animateMotion path="M40 20 L40 66" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ── Map topic keys to SVG components ── */
export const TOPIC_SVGS: Record<string, React.FC<SvgProps>> = {
  '1-1': SvgPromptEngineering,
  '2-1': SvgDesigningAgents,
  '3-1': SvgMappingWorkflows,
  '4-1': SvgDataToIntelligence,
  '5-1': SvgFullStackBuild,
};
