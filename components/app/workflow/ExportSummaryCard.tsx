import React, { useState, useCallback } from 'react';
import { FileText, ChevronDown, ChevronUp, Download, Copy, Check } from 'lucide-react';

interface ExportSummaryCardProps {
  workflowName: string;
  platform: string;
  overview: string;
  stepCount: number;
  complexity: string;
  estimatedBuildTime: string;
  credentials: Array<{ what: string; whereToFind: string; usedIn: string; why?: string }>;
  steps: Array<{ number: number; name: string }>;
  testChecklist: string[];
  fullMarkdown: string;
}

const FONT_FAMILY = "'DM Sans', sans-serif";

/** Copy-to-clipboard button for code blocks */
function CodeBlockWithCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: copied ? '#38B2AC' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '4px 8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.15s ease',
        }}
        title="Copy code"
      >
        {copied ? <Check size={13} color="#fff" /> : <Copy size={13} color="#A0AEC0" />}
        <span style={{ fontSize: 11, color: copied ? '#fff' : '#A0AEC0', fontFamily: "'DM Sans', sans-serif" }}>
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
      <pre style={{
        background: '#1A202C', color: '#E2E8F0', padding: '14px 18px',
        borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Render a block of markdown-ish text into formatted JSX */
function renderStepContent(raw: string): React.ReactNode[] {
  const lines = raw.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(<CodeBlockWithCopy key={key++} code={codeLines.join('\n')} />);
      continue;
    }

    // Blockquotes / tips / warnings
    if (line.trim().startsWith('>')) {
      const text = line.trim().slice(1).trim();
      const isTip = text.includes('💡');
      const isWarning = text.includes('⚠');
      elements.push(
        <div key={key++} style={{
          borderLeft: `3px solid ${isWarning ? '#D69E2E' : isTip ? '#38B2AC' : '#E2E8F0'}`,
          background: isWarning ? '#FFFFF0' : isTip ? '#E6FFFA' : '#F7FAFC',
          padding: '8px 14px', borderRadius: '0 6px 6px 0', margin: '6px 0',
          fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT_FAMILY,
        }}>
          {renderInlineMarkdown(text)}
        </div>
      );
      i++; continue;
    }

    // Bold-only lines (like **What happens:** or **Configure:**)
    if (line.trim().startsWith('**') && line.trim().includes('**')) {
      const boldMatch = line.trim().match(/^\*\*(.+?)\*\*\s*(.*)/);
      if (boldMatch) {
        elements.push(
          <p key={key++} style={{ fontSize: 13, color: '#1A202C', margin: '10px 0 4px', lineHeight: 1.6, fontFamily: FONT_FAMILY }}>
            <strong>{boldMatch[1]}</strong>{boldMatch[2] ? ` ${boldMatch[2]}` : ''}
          </p>
        );
        i++; continue;
      }
    }

    // Empty lines
    if (line.trim() === '' || line.trim() === '---') { i++; continue; }

    // Regular paragraph
    elements.push(
      <p key={key++} style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: '4px 0', fontFamily: FONT_FAMILY }}>
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/** Render inline markdown: bold, code, links */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)/s);
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);

    // Find the earliest match
    const codeIdx = codeMatch ? codeMatch[1].length : Infinity;
    const boldIdx = boldMatch ? boldMatch[1].length : Infinity;

    if (codeIdx === Infinity && boldIdx === Infinity) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (codeIdx <= boldIdx && codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code key={key++} style={{
          background: '#F7FAFC', padding: '1px 6px', borderRadius: 4,
          fontSize: 12, fontFamily: "'JetBrains Mono', Consolas, monospace", color: '#D53F8C',
          border: '1px solid #E2E8F0',
        }}>
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
    } else if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++} style={{ color: '#1A202C' }}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    }
  }

  return parts;
}

const ExportSummaryCard: React.FC<ExportSummaryCardProps> = ({
  workflowName,
  platform,
  overview,
  stepCount,
  complexity,
  estimatedBuildTime,
  credentials,
  steps,
  testChecklist,
  fullMarkdown,
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const statPills = [
    `${stepCount} steps`,
    complexity,
    `Est. ${estimatedBuildTime} to build`,
  ];

  // Extract step detail from markdown for expandable steps
  const getStepDetail = (stepNumber: number): string => {
    const pattern = new RegExp(
      `### Step ${stepNumber}[^\\n]*\\n([\\s\\S]*?)(?=### Step \\d|## [A-Z]|$)`,
    );
    const match = fullMarkdown.match(pattern);
    if (!match) return '';
    return match[1].replace(/---\s*$/, '').trim();
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '28px 32px',
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} color="#38B2AC" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#38B2AC',
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontFamily: FONT_FAMILY,
            }}
          >
            Build Guide
          </span>
        </div>
        <span
          style={{
            background: '#E6FFFA',
            color: '#1A7A76',
            border: '1px solid #38B2AC44',
            borderRadius: 99,
            padding: '3px 12px',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: FONT_FAMILY,
          }}
        >
          {platform}
        </span>
      </div>

      {/* Workflow title */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#1A202C',
          margin: '0 0 12px 0',
          fontFamily: FONT_FAMILY,
        }}
      >
        {workflowName}
      </h2>

      {/* Overview */}
      <p
        style={{
          fontSize: 14,
          color: '#4A5568',
          lineHeight: 1.7,
          margin: '0 0 20px 0',
          fontFamily: FONT_FAMILY,
        }}
      >
        {overview}
      </p>

      {/* Stat pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {statPills.map((label, i) => (
          <span
            key={i}
            style={{
              background: '#F7FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 99,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#4A5568',
              fontFamily: FONT_FAMILY,
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* ── SECTION 1: Steps (clickable/expandable) ── */}
      <div style={{ marginBottom: 28 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#1A202C',
            margin: '0 0 12px 0',
            fontFamily: FONT_FAMILY,
          }}
        >
          {steps.length} steps in this workflow
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map((step) => {
            const isExpanded = expandedStep === step.number;
            return (
              <div key={step.number}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isExpanded ? '#F0FFF4' : '#F7FAFC',
                    border: `1px solid ${isExpanded ? '#C6F6D5' : '#E2E8F0'}`,
                    borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                    cursor: 'pointer',
                    fontFamily: FONT_FAMILY,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#38B2AC',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {step.number}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                      {step.name}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} color="#718096" />
                  ) : (
                    <ChevronDown size={16} color="#718096" />
                  )}
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px 18px',
                      background: '#FAFFFE',
                      border: '1px solid #C6F6D5',
                      borderTop: 'none',
                      borderRadius: '0 0 10px 10px',
                    }}
                  >
                    {renderStepContent(getStepDetail(step.number))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: What you'll need (credential cards) ── */}
      {credentials.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1A202C',
              margin: '0 0 12px 0',
              fontFamily: FONT_FAMILY,
            }}
          >
            What you'll need
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {credentials.map((cred, i) => (
              <div
                key={i}
                style={{
                  background: '#F7FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#1A202C',
                    marginBottom: 4,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {cred.what}
                </div>
                {cred.why && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4A5568',
                      lineHeight: 1.5,
                      marginBottom: 6,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {cred.why}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: '#718096',
                    lineHeight: 1.5,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {cred.whereToFind}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#A0AEC0',
                    marginTop: 6,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Used in: {cred.usedIn}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Test checklist ── */}
      {testChecklist.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1A202C',
              margin: '0 0 12px 0',
              fontFamily: FONT_FAMILY,
            }}
          >
            Test checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {testChecklist.map((item, i) => {
              const isChecked = checkedItems.has(i);
              return (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(i)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      minWidth: 18,
                      borderRadius: 4,
                      border: isChecked ? '1.5px solid #38B2AC' : '1.5px solid #E2E8F0',
                      background: isChecked ? '#38B2AC' : '#FFFFFF',
                      marginTop: 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: isChecked ? '#A0AEC0' : '#4A5568',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      lineHeight: 1.5,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {item}
                  </span>
                </label>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 10, fontFamily: FONT_FAMILY }}>
            {checkedItems.size} / {testChecklist.length} complete
          </div>
        </div>
      )}

      {/* ── SECTION 4: Download prompt (replaces raw preview) ── */}
      <div
        style={{
          background: '#F7FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Download size={18} color="#718096" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', fontFamily: FONT_FAMILY }}>
            Want the full guide?
          </div>
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT_FAMILY }}>
            Download as a Markdown or Word document using the buttons below.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSummaryCard;
