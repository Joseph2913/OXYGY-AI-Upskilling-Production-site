/**
 * BuildGuideView — Public share link page for Build Guides.
 * Route: /app/artefacts/:id/build-guide
 * Renders Build Guide markdown as a clean, readable page.
 * No auth required — shareable with external developers.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const FONT = "'DM Sans', sans-serif";

/** Simple markdown-to-JSX renderer for Build Guide documents */
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', margin: '28px 0 8px', fontFamily: FONT }}>{line.slice(4)}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: 20, fontWeight: 700, color: '#1A202C', margin: '32px 0 12px', fontFamily: FONT }}>{line.slice(3)}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} style={{ fontSize: 26, fontWeight: 800, color: '#1A202C', margin: '0 0 4px', fontFamily: FONT }}>{line.slice(2)}</h1>);
      i++; continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />);
      i++; continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={key++} style={{
          background: '#1A202C', color: '#E2E8F0', padding: '16px 20px',
          borderRadius: 10, fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          overflowX: 'auto', margin: '12px 0', lineHeight: 1.6,
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        // Skip separator row
        if (cells.every(c => /^[-:]+$/.test(c))) { i++; continue; }
        tableRows.push(cells);
        i++;
      }
      if (tableRows.length > 0) {
        const [header, ...body] = tableRows;
        elements.push(
          <table key={key++} style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: 13, fontFamily: FONT }}>
            <thead>
              <tr>
                {header.map((cell, ci) => (
                  <th key={ci} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #E2E8F0', color: '#1A202C', fontWeight: 700 }}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 1 ? '#F7FAFC' : 'white' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
      continue;
    }

    // Checkbox items
    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      const checked = line.trim().startsWith('- [x]');
      const text = line.trim().replace(/^- \[[ x]\]\s*/, '');
      elements.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 13, color: '#4A5568', fontFamily: FONT }}>
          <span style={{ color: checked ? '#38B2AC' : '#A0AEC0', fontSize: 14 }}>{checked ? '☑' : '☐'}</span>
          <span>{text}</span>
        </div>
      );
      i++; continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      const text = line.trim().slice(1).trim();
      elements.push(
        <blockquote key={key++} style={{
          borderLeft: '3px solid #38B2AC', paddingLeft: 16, margin: '8px 0',
          color: '#4A5568', fontSize: 13, fontFamily: FONT, lineHeight: 1.7,
        }}>{text}</blockquote>
      );
      i++; continue;
    }

    // Bold text lines (like **What this workflow does**)
    if (line.trim().startsWith('**') && line.trim().endsWith('**') && !line.includes('`')) {
      const text = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
      elements.push(<p key={key++} style={{ fontWeight: 700, color: '#1A202C', margin: '12px 0 4px', fontSize: 14, fontFamily: FONT }}>{text}</p>);
      i++; continue;
    }

    // Empty lines
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph — render inline bold/code
    elements.push(
      <p key={key++} style={{ color: '#4A5568', fontSize: 14, lineHeight: 1.7, margin: '6px 0', fontFamily: FONT }}
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1A202C">$1</strong>')
            .replace(/`(.+?)`/g, '<code style="background:#F7FAFC;padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
        }}
      />
    );
    i++;
  }

  return elements;
}

export default function BuildGuideView() {
  const { id } = useParams<{ id: string }>();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from Supabase artefacts table by ID
    // For now, check localStorage as a mock store
    const stored = localStorage.getItem(`build_guide_${id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setMarkdown(data.buildGuide || data.markdown || '');
      } catch {
        setError('Failed to load Build Guide');
      }
    } else {
      setError('Build Guide not found');
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: FONT }}>
        <p style={{ color: '#718096', fontSize: 14 }}>Loading Build Guide...</p>
      </div>
    );
  }

  if (error || !markdown) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: FONT }}>
        <p style={{ color: '#718096', fontSize: 14 }}>{error || 'Build Guide not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px', fontFamily: FONT, background: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#38B2AC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>O</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', letterSpacing: 1 }}>Workflow Build Guide</span>
      </div>
      <p style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 32 }}>Generated by Oxygy AI Upskilling Platform</p>

      {/* Rendered markdown */}
      <div>{renderMarkdown(markdown)}</div>
    </div>
  );
}
