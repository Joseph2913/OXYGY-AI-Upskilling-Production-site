import React, { useState, useCallback } from 'react';
import { Download, BookOpen } from 'lucide-react';

interface OutputActionsPanelProps {
  workflowName: string;
  fullMarkdown: string;
  onSaveToArtefacts: () => void;
  isSaved: boolean;
}

const FONT: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Convert markdown to a branded, Word-compatible HTML document.
 * Uses OXYGY brand colours, proper typography, and structured layout.
 * Word / Google Docs can open .doc files containing HTML natively.
 */
function markdownToWordHtml(md: string): string {
  const lines = md.split('\n');
  const htmlParts: string[] = [];
  let i = 0;
  let inTable = false;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      htmlParts.push(`<div style="background:#1A202C;color:#E2E8F0;padding:14px 18px;border-radius:6px;font-family:Consolas,'Courier New',monospace;font-size:9pt;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;margin:10px 0 14px 0;">${codeLines.join('\n')}</div>`);
      continue;
    }

    // Table rows
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        htmlParts.push('<table style="border-collapse:collapse;width:100%;margin:10px 0 16px 0;font-size:9.5pt;">');
        inTable = true;
      }
      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      // Skip separator row
      if (cells.every(c => /^[-:]+$/.test(c))) { i++; continue; }
      // First data row after table start = header
      if (htmlParts[htmlParts.length - 1]?.includes('<table')) {
        htmlParts.push(`<tr>${cells.map(c => `<th style="background:#E6FFFA;color:#1A202C;padding:8px 12px;border:1px solid #C6F6D5;font-weight:700;text-align:left;">${inlineFormat(c)}</th>`).join('')}</tr>`);
      } else {
        htmlParts.push(`<tr>${cells.map(c => `<td style="padding:8px 12px;border:1px solid #E2E8F0;color:#4A5568;">${inlineFormat(c)}</td>`).join('')}</tr>`);
      }
      i++; continue;
    } else if (inTable) {
      htmlParts.push('</table>');
      inTable = false;
    }

    // Headers
    if (line.startsWith('### ')) {
      htmlParts.push(`<h3 style="font-size:12pt;font-weight:700;color:#1A202C;margin:22px 0 6px 0;font-family:'Segoe UI',Calibri,sans-serif;border-left:3px solid #38B2AC;padding-left:10px;">${inlineFormat(line.slice(4))}</h3>`);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      htmlParts.push(`<h2 style="font-size:15pt;font-weight:700;color:#1A202C;margin:28px 0 10px 0;font-family:'Segoe UI',Calibri,sans-serif;border-bottom:2px solid #38B2AC;padding-bottom:6px;">${inlineFormat(line.slice(3))}</h2>`);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      // Skip — we render the title from the branded header
      i++; continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      htmlParts.push('<hr style="border:none;border-top:1px solid #E2E8F0;margin:18px 0;">');
      i++; continue;
    }

    // Checkboxes
    if (line.trim().startsWith('- [ ]')) {
      const text = line.trim().replace(/^- \[ \]\s*/, '');
      htmlParts.push(`<p style="margin:4px 0;padding-left:6px;font-size:10pt;color:#4A5568;line-height:1.6;">&#9744;&nbsp; ${inlineFormat(text)}</p>`);
      i++; continue;
    }
    if (line.trim().startsWith('- [x]')) {
      const text = line.trim().replace(/^- \[x\]\s*/, '');
      htmlParts.push(`<p style="margin:4px 0;padding-left:6px;font-size:10pt;color:#38A169;line-height:1.6;">&#9745;&nbsp; ${inlineFormat(text)}</p>`);
      i++; continue;
    }

    // Blockquotes / tips / warnings
    if (line.trim().startsWith('>')) {
      const text = line.trim().slice(1).trim();
      const isTip = text.includes('💡');
      const isWarning = text.includes('⚠');
      const borderColor = isWarning ? '#D69E2E' : isTip ? '#38B2AC' : '#A0AEC0';
      const bgColor = isWarning ? '#FFFFF0' : isTip ? '#E6FFFA' : '#F7FAFC';
      htmlParts.push(`<div style="border-left:3px solid ${borderColor};background:${bgColor};padding:8px 14px;margin:8px 0;font-size:10pt;color:#4A5568;line-height:1.6;">${inlineFormat(text)}</div>`);
      i++; continue;
    }

    // Bullet lists
    if (line.trim().startsWith('- ')) {
      const text = line.trim().slice(2);
      htmlParts.push(`<p style="margin:3px 0;padding-left:16px;font-size:10pt;color:#4A5568;line-height:1.6;">&bull;&nbsp; ${inlineFormat(text)}</p>`);
      i++; continue;
    }

    // Bold-only lines (section labels like **What happens:** or **Configure:**)
    const boldLine = line.trim().match(/^\*\*(.+?)\*\*\s*(.*)/);
    if (boldLine && !line.includes('`')) {
      htmlParts.push(`<p style="font-weight:700;color:#1A202C;margin:12px 0 3px 0;font-size:10.5pt;line-height:1.5;">${escapeHtml(boldLine[1])}${boldLine[2] ? ` <span style="font-weight:400;color:#4A5568;">${inlineFormat(boldLine[2])}</span>` : ''}</p>`);
      i++; continue;
    }

    // Empty lines
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph
    htmlParts.push(`<p style="font-size:10pt;color:#4A5568;line-height:1.7;margin:5px 0;">${inlineFormat(line)}</p>`);
    i++;
  }

  if (inTable) htmlParts.push('</table>');

  // Extract title from markdown (first ## heading)
  const titleMatch = md.match(/^## (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Workflow Build Guide';

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<style>
  @page { margin: 2.5cm 2cm; }
  body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #4A5568;
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  }
</style>
</head>
<body>

<!-- Branded Header -->
<table style="width:100%;border:none;margin-bottom:8px;">
  <tr>
    <td style="border:none;padding:0;">
      <span style="font-size:22pt;font-weight:800;color:#1A202C;font-family:'Segoe UI',Calibri,sans-serif;letter-spacing:-0.5px;">OXY</span><span style="font-size:22pt;font-weight:800;color:#38B2AC;font-family:'Segoe UI',Calibri,sans-serif;letter-spacing:-0.5px;">GY</span>
    </td>
    <td style="border:none;padding:0;text-align:right;vertical-align:bottom;">
      <span style="font-size:8pt;color:#A0AEC0;font-family:'Segoe UI',Calibri,sans-serif;">AI Centre of Excellence</span>
    </td>
  </tr>
</table>
<div style="height:3px;background:linear-gradient(to right,#38B2AC,#A8F0E0);margin-bottom:24px;"></div>

<!-- Document label -->
<table style="width:100%;border:none;margin-bottom:20px;">
  <tr>
    <td style="border:none;padding:0;">
      <span style="display:inline-block;background:#E6FFFA;color:#1A7A76;border:1px solid #38B2AC66;padding:3px 12px;font-size:8pt;font-weight:700;font-family:'Segoe UI',Calibri,sans-serif;letter-spacing:1px;">WORKFLOW BUILD GUIDE</span>
    </td>
    <td style="border:none;padding:0;text-align:right;">
      <span style="font-size:8pt;color:#A0AEC0;">${today}</span>
    </td>
  </tr>
</table>

<!-- Title -->
<h1 style="font-size:20pt;font-weight:800;color:#1A202C;margin:0 0 24px 0;font-family:'Segoe UI',Calibri,sans-serif;line-height:1.2;">${escapeHtml(title)}</h1>

<!-- Content -->
${htmlParts.join('\n')}

<!-- Footer -->
<hr style="border:none;border-top:2px solid #38B2AC;margin:36px 0 12px 0;">
<table style="width:100%;border:none;">
  <tr>
    <td style="border:none;padding:0;">
      <span style="font-size:8pt;color:#A0AEC0;font-family:'Segoe UI',Calibri,sans-serif;">Generated by OXYGY AI Upskilling Platform</span>
    </td>
    <td style="border:none;padding:0;text-align:right;">
      <span style="font-size:8pt;color:#A0AEC0;font-family:'Segoe UI',Calibri,sans-serif;">oxygyconsulting.com</span>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format inline markdown: bold, inline code */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1A202C;">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#F0F4F8;padding:1px 5px;font-family:Consolas,\'Courier New\',monospace;font-size:9pt;color:#D53F8C;">$1</code>');
}

const OutputActionsPanel: React.FC<OutputActionsPanelProps> = ({
  workflowName,
  fullMarkdown,
  onSaveToArtefacts,
  isSaved,
}) => {
  const [downloadedMd, setDownloadedMd] = useState(false);
  const [downloadedDoc, setDownloadedDoc] = useState(false);

  const handleDownloadMd = useCallback(() => {
    const slug = slugify(workflowName);
    const fileName = `${slug}-build-guide.md`;
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedMd(true);
    setTimeout(() => setDownloadedMd(false), 2000);
  }, [workflowName, fullMarkdown]);

  const handleDownloadDoc = useCallback(() => {
    const slug = slugify(workflowName);
    const fileName = `${slug}-build-guide.doc`;
    const html = markdownToWordHtml(fullMarkdown);
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedDoc(true);
    setTimeout(() => setDownloadedDoc(false), 2000);
  }, [workflowName, fullMarkdown]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...FONT }}>
      {/* Download options — side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Download .md */}
        <div
          style={{
            background: '#E6FFFA',
            border: '1.5px solid #38B2AC44',
            borderRadius: 14,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Download size={20} color="#38B2AC" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', ...FONT }}>
              Download as Markdown
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#718096', margin: '0 0 14px', lineHeight: 1.5, ...FONT }}>
            Opens in Notion, VS Code, or any text editor. Ideal for technical handoff.
          </p>
          <button
            onClick={handleDownloadMd}
            style={{
              width: '100%',
              background: '#38B2AC',
              color: '#fff',
              border: 'none',
              borderRadius: 99,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              ...FONT,
            }}
          >
            {downloadedMd ? '\u2713 Downloaded' : 'Download .md'}
          </button>
        </div>

        {/* Download .doc */}
        <div
          style={{
            background: '#EBF8FF',
            border: '1.5px solid #2B6CB044',
            borderRadius: 14,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Download size={20} color="#2B6CB0" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', ...FONT }}>
              Download as Word
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#718096', margin: '0 0 14px', lineHeight: 1.5, ...FONT }}>
            Opens in Microsoft Word, Google Docs, or Pages. Easy to share and reference.
          </p>
          <button
            onClick={handleDownloadDoc}
            style={{
              width: '100%',
              background: '#2B6CB0',
              color: '#fff',
              border: 'none',
              borderRadius: 99,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              ...FONT,
            }}
          >
            {downloadedDoc ? '\u2713 Downloaded' : 'Download .doc'}
          </button>
        </div>
      </div>

      {/* Save to Library banner */}
      <div
        style={{
          background: '#F7FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={20} color="#38B2AC" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', ...FONT }}>
              Save to your Shared Library
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2, ...FONT }}>
              Your Build Guide will be saved and accessible from your library.
            </div>
          </div>
        </div>
        <button
          onClick={onSaveToArtefacts}
          disabled={isSaved}
          style={{
            background: isSaved ? '#E2E8F0' : '#38B2AC',
            color: isSaved ? '#A0AEC0' : '#fff',
            border: 'none',
            borderRadius: 99,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: isSaved ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...FONT,
          }}
        >
          {isSaved ? '\u2713 Saved' : 'Save to your library \u2192'}
        </button>
      </div>
    </div>
  );
};

export default OutputActionsPanel;
