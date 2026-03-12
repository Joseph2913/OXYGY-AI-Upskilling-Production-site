import React, { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';

const FONT = "'DM Sans', sans-serif";

interface CollapsibleOutputCardProps {
  sectionKey: string;
  icon: string | React.ReactNode;
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  copyContent?: string;
  accentColor: string;
  accentBg?: string;
  index?: number;
  total?: number;
  visible?: boolean;
  children: React.ReactNode;
}

const CollapsibleOutputCard: React.FC<CollapsibleOutputCardProps> = ({
  sectionKey,
  icon,
  title,
  summary,
  expanded,
  onToggle,
  copyContent,
  accentColor,
  accentBg,
  index,
  total,
  visible = true,
  children,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyContent) return;
    navigator.clipboard.writeText(copyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const bg = accentBg || `${accentColor}08`;

  return (
    <div
      style={{
        borderLeft: `4px solid ${accentColor}`,
        background: bg,
        borderRadius: 10,
        padding: '16px 18px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Header row — always visible, clickable */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        {/* Icon */}
        {typeof icon === 'string' ? (
          <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
        ) : (
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
        )}

        {/* Title */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#1A202C',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontFamily: FONT,
            flex: 1,
          }}
        >
          {title}
        </span>

        {/* Index counter */}
        {index != null && total != null && (
          <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT, flexShrink: 0 }}>
            {index + 1}/{total}
          </span>
        )}

        {/* Copy button */}
        {copyContent && (
          <span
            onClick={handleCopy}
            style={{
              color: copied ? '#38A169' : '#A0AEC0',
              padding: 2,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontFamily: FONT,
              transition: 'color 0.15s',
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={14}
          color="#A0AEC0"
          style={{
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Summary — shown only when collapsed */}
      {!expanded && summary && (
        <div
          style={{
            fontSize: 13,
            color: '#718096',
            lineHeight: 1.5,
            fontFamily: FONT,
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
          }}
        >
          {summary}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid #EDF2F7',
            animation: 'ppSlideDown 0.2s ease both',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleOutputCard;
