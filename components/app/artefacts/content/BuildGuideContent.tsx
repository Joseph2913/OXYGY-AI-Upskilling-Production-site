import React, { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';
import { simpleMarkdownToHtml } from '../../../../utils/markdownToHtml';

const LEVEL_ACCENTS: Record<number, string> = {
  1: '#38B2AC', 2: '#805AD5', 3: '#DD6B20', 4: '#3182CE', 5: '#E53E3E',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};

interface Props {
  content: ArtefactContent;
  level: number;
}

const BuildGuideContent: React.FC<Props> = ({ content, level }) => {
  const [copied, setCopied] = useState(false);
  const md = content.markdown || '';
  const accent = LEVEL_ACCENTS[level] || '#38B2AC';

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
    a.download = `build-guide-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={sectionLabel as React.CSSProperties}>Build Guide</div>
        {content.platform && (
          <span style={{
            background: `${accent}20`, color: accent,
            fontSize: 11, fontWeight: 700, borderRadius: 20,
            padding: '3px 10px',
          }}>
            {content.platform}
          </span>
        )}
        {content.toolName && (
          <span style={{ fontSize: 12, color: '#718096' }}>
            Created with {content.toolName}
          </span>
        )}
      </div>

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
          <Copy size={13} /> {copied ? 'Copied!' : 'Copy markdown'}
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

export default BuildGuideContent;
