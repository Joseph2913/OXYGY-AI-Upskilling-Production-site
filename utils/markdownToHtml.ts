/**
 * Simple markdown-to-HTML converter for artefact content.
 * Handles: headings, bold, code blocks, inline code, lists, paragraphs.
 * No external dependencies.
 */
export function simpleMarkdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>');
        inCodeBlock = false;
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<pre style="background:#1A202C;color:#E2E8F0;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:8px 0;"><code>');
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      html.push(escapeHtml(line) + '\n');
      continue;
    }

    // Close list if not a list item
    if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ') && line.trim() !== '') {
      html.push('</ul>');
      inList = false;
    }

    // Headings
    if (line.startsWith('### ')) { html.push(`<h5 style="font-size:13px;font-weight:700;color:#1A202C;margin:12px 0 4px;">${inlineFormat(line.slice(4))}</h5>`); continue; }
    if (line.startsWith('## '))  { html.push(`<h4 style="font-size:14px;font-weight:700;color:#1A202C;margin:14px 0 6px;">${inlineFormat(line.slice(3))}</h4>`); continue; }
    if (line.startsWith('# '))   { html.push(`<h3 style="font-size:15px;font-weight:700;color:#1A202C;margin:16px 0 8px;">${inlineFormat(line.slice(2))}</h3>`); continue; }

    // List items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) { html.push('<ul style="margin:4px 0;padding-left:20px;">'); inList = true; }
      const content = line.trim().startsWith('- ') ? line.trim().slice(2) : line.trim().slice(2);
      html.push(`<li style="font-size:13px;color:#4A5568;margin:2px 0;">${inlineFormat(content)}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') { continue; }

    // Paragraph
    html.push(`<p style="font-size:13px;color:#4A5568;line-height:1.7;margin:4px 0;">${inlineFormat(line)}</p>`);
  }

  if (inList) html.push('</ul>');
  if (inCodeBlock) html.push('</code></pre>');

  return html.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#EDF2F7;padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
}
