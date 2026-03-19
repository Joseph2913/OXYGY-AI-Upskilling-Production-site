import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const FONT = "'DM Sans', sans-serif";

export interface ContentBlock {
  type: 'text' | 'prompt' | 'instructions' | 'section_header' | 'platform_badge';
  content: string;
  platform?: string;
  feature?: string;
  timeEstimate?: string;
}

export interface ButtonOption {
  label: string;
  value: string;
}

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: ContentBlock[];
  text?: string;
  buttons?: ButtonOption[];
  onButtonClick?: (value: string) => void;
  showButtons?: boolean;
  userInitial?: string;
}

const PromptCopyBox: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      position: 'relative',
      background: '#F7FAFC',
      border: '1px solid #E2E8F0',
      borderLeft: '3px solid #38B2AC',
      borderRadius: '0 8px 8px 0',
      padding: '12px 16px',
      paddingRight: 48,
      fontSize: 13,
      fontFamily: FONT,
      fontStyle: 'italic',
      color: '#2D3748',
      lineHeight: 1.6,
      margin: '12px 0',
      wordBreak: 'break-word' as const,
    }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          fontSize: 11,
          color: copied ? '#38A169' : '#A0AEC0',
          cursor: 'pointer',
          fontFamily: FONT,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '2px 4px',
        }}
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
        {copied ? 'Copied \u2713' : 'Copy'}
      </button>
      {text}
    </div>
  );
};

function renderTextWithFormatting(text: string): React.ReactNode {
  // Simple bold/italic parsing
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  role,
  content,
  text,
  buttons,
  onButtonClick,
  showButtons,
  userInitial,
}) => {
  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <div style={{
          background: '#1A202C',
          color: '#FFFFFF',
          borderRadius: '16px 2px 16px 16px',
          padding: '12px 18px',
          fontSize: 14,
          lineHeight: 1.6,
          maxWidth: '75%',
          fontFamily: FONT,
          animation: 'lcMessageIn 0.2s ease both',
        }}>
          {text || (content.length > 0 ? content[0].content : '')}
        </div>
        {/* User avatar */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#1A202C',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          flexShrink: 0,
          marginTop: 2,
        }}>
          {userInitial || 'U'}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#38B2AC',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          flexShrink: 0,
          marginTop: 2,
        }}>
          LC
        </div>

        {/* Message bubble */}
        <div style={{
          background: '#F7FAFC',
          borderRadius: '2px 16px 16px 16px',
          padding: '14px 18px',
          border: '1px solid #E2E8F0',
          fontSize: 14,
          color: '#2D3748',
          lineHeight: 1.7,
          fontFamily: FONT,
          maxWidth: '85%',
          animation: 'lcMessageIn 0.2s ease both',
        }}>
          {content.map((block, i) => {
            switch (block.type) {
              case 'text':
                return (
                  <div key={i} style={{ marginBottom: i < content.length - 1 ? 12 : 0 }}>
                    {renderTextWithFormatting(block.content)}
                  </div>
                );

              case 'section_header':
                return (
                  <div key={i} style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#38B2AC',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    marginTop: i > 0 ? 16 : 0,
                    marginBottom: 6,
                    fontFamily: FONT,
                  }}>
                    {block.content}
                  </div>
                );

              case 'prompt':
                return <PromptCopyBox key={i} text={block.content} />;

              case 'instructions':
                return (
                  <ol key={i} style={{
                    fontSize: 13,
                    color: '#4A5568',
                    lineHeight: 1.7,
                    fontFamily: FONT,
                    paddingLeft: 24,
                    margin: '8px 0',
                  }}>
                    {block.content.split('\n').filter(Boolean).map((line, j) => {
                      const cleaned = line.replace(/^\d+\.\s*/, '');
                      return (
                        <li key={j} style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 400 }}>{cleaned}</span>
                        </li>
                      );
                    })}
                  </ol>
                );

              case 'platform_badge':
                return (
                  <span key={i} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#E6FFFA',
                    border: '1px solid #B2DFDB',
                    borderRadius: 16,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1A7A76',
                    fontFamily: FONT,
                    margin: '2px 4px',
                  }}>
                    {block.content}
                  </span>
                );

              default:
                return <div key={i}>{block.content}</div>;
            }
          })}
        </div>
      </div>

      {/* Button row */}
      {showButtons && buttons && buttons.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: 8,
          marginTop: 8,
          marginLeft: 38,
          maxWidth: '85%',
          animation: 'lcButtonsIn 0.3s ease both',
        }}>
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={() => onButtonClick?.(btn.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#2D3748',
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#38B2AC';
                e.currentTarget.style.background = '#F0FFFE';
                e.currentTarget.style.color = '#1A7A76';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#2D3748';
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;
