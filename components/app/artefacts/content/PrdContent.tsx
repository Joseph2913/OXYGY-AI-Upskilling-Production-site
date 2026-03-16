import React, { useState } from 'react';
import { ChevronRight, Copy, Download } from 'lucide-react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';
import { simpleMarkdownToHtml } from '../../../../utils/markdownToHtml';

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};

interface Props {
  content: ArtefactContent;
  level: number;
}

const PrdContent: React.FC<Props> = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const md = content.prdMarkdown || '';
  const sections = content.sections as Array<Record<string, unknown>> | undefined;

  const handleCopy = () => {
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prd-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If we have sections, render as accordion
  if (sections && sections.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={sectionLabel}>Product Requirements Document</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map((section, i) => {
            const title = (section.title || section.heading || `Section ${i + 1}`) as string;
            const body = (section.content || section.body || '') as string;
            const isExpanded = expandedIdx === i;

            return (
              <div key={i} style={{
                border: '1px solid #E2E8F0', borderRadius: 10,
              }}>
                <div
                  onClick={() => setExpandedIdx(isExpanded ? -1 : i)}
                  style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{title}</span>
                  <ChevronRight
                    size={14}
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s', color: '#718096',
                    }}
                  />
                </div>
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 16px', borderTop: '1px solid #E2E8F0',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <div
                      style={{ paddingTop: 12 }}
                      dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(body) }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
              padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Copy size={13} /> {copied ? 'Copied!' : 'Copy full PRD'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
              padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Download size={13} /> Download .md
          </button>
        </div>
      </div>
    );
  }

  // Fallback: render as single markdown body
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={sectionLabel}>Product Requirements Document</div>

      <div
        style={{
          background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
          padding: 16, maxHeight: 400, overflowY: 'auto',
          fontFamily: "'DM Sans', sans-serif",
        }}
        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(md) }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Copy size={13} /> {copied ? 'Copied!' : 'Copy full PRD'}
        </button>
        <button
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 20,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#4A5568',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Download size={13} /> Download .md
        </button>
      </div>
    </div>
  );
};

export default PrdContent;
