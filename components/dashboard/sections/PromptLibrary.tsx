import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Library, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getSavedPrompts, deletePrompt as dbDeletePrompt } from '../../../lib/database';
import {
  LEVEL_PILL_STYLES,
  formatRelativeDate,
} from '../../../data/dashboard-content';
import type { SavedPrompt } from '../../../data/dashboard-types';

// ─── Level Pill ───

const LevelPill: React.FC<{ level: number }> = ({ level }) => {
  const style = LEVEL_PILL_STYLES[level] || { bg: '#EDF2F7', text: '#4A5568' };
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      L{level}
    </span>
  );
};

// ─── Prompt Card ───

function toMarkdown(prompt: SavedPrompt): string {
  return `## ${prompt.title}\n\n**Level:** ${prompt.level}\n\n\`\`\`\n${prompt.content}\n\`\`\`\n`;
}

const PromptCard: React.FC<{
  prompt: SavedPrompt;
  onCopy: () => void;
  onCopyMarkdown: () => void;
  onDelete: () => void;
}> = ({ prompt, onCopy, onCopyMarkdown, onDelete }) => {
  const [copied, setCopied] = useState<'plain' | 'md' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [collapsing, setCollapsing] = useState(false);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleCopy = async () => {
    await copyText(prompt.content);
    setCopied('plain');
    onCopy();
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyMarkdown = async () => {
    await copyText(toMarkdown(prompt));
    setCopied('md');
    onCopyMarkdown();
    setTimeout(() => setCopied(null), 1500);
  };

  const handleConfirmDelete = () => {
    setCollapsing(true);
    setTimeout(() => onDelete(), 300);
  };

  const preview = prompt.content.length > 120
    ? prompt.content.slice(0, 120) + '...'
    : prompt.content;

  return (
    <div
      className={collapsing ? 'animate-dash-card-collapse' : ''}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LevelPill level={prompt.level} />
        <span style={{ fontSize: 12, color: '#A0AEC0' }}>{formatRelativeDate(prompt.savedAt)}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>{prompt.title}</div>

      {/* Preview */}
      <p
        style={{
          fontSize: 13,
          color: '#4A5568',
          margin: 0,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {preview}
      </p>

      {/* Action row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {confirming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: '#4A5568' }}>Remove this prompt?</span>
            <button
              onClick={handleConfirmDelete}
              style={{
                background: 'none',
                border: 'none',
                color: '#E53E3E',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Yes, remove
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#718096',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleCopy}
              title={copied === 'plain' ? 'Copied!' : 'Copy plain text'}
              className="dash-focus"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: copied === 'plain' ? '#38B2AC' : '#A0AEC0',
                transition: 'color 150ms ease',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { if (copied !== 'plain') e.currentTarget.style.color = '#1A202C'; }}
              onMouseLeave={(e) => { if (copied !== 'plain') e.currentTarget.style.color = '#A0AEC0'; }}
            >
              {copied === 'plain' ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleCopyMarkdown}
              title={copied === 'md' ? 'Copied Markdown!' : 'Copy as Markdown'}
              className="dash-focus"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: copied === 'md' ? '#38B2AC' : '#A0AEC0',
                transition: 'color 150ms ease',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { if (copied !== 'md') e.currentTarget.style.color = '#1A202C'; }}
              onMouseLeave={(e) => { if (copied !== 'md') e.currentTarget.style.color = '#A0AEC0'; }}
            >
              {copied === 'md' ? <Check size={16} /> : <FileText size={16} />}
            </button>
            <button
              onClick={() => setConfirming(true)}
              title="Delete prompt"
              className="dash-focus"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: '#A0AEC0',
                transition: 'color 150ms ease',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1A202C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Filter Pills ───

const FILTER_OPTIONS = [
  { label: 'All', value: 0 },
  { label: 'Level 1', value: 1 },
  { label: 'Level 2', value: 2 },
];

// ─── Main Component ───

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const PromptLibrary: React.FC<Props> = ({ showToast }) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0); // 0 = All

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getSavedPrompts(userId).then((data) => {
      setPrompts(data);
      setLoading(false);
    });
  }, [userId]);

  const filteredPrompts = activeFilter === 0
    ? prompts
    : prompts.filter((p) => p.level === activeFilter);

  const handleCopy = () => {
    showToast('Copied to clipboard!');
  };

  const handleCopyMarkdown = () => {
    showToast('Copied as Markdown!');
  };

  const handleDelete = (id: string) => {
    // Optimistic UI removal
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    // Write to Supabase
    if (userId) dbDeletePrompt(id, userId);
  };

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className="dash-focus"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: activeFilter === opt.value ? '#1A202C' : '#EDF2F7',
              color: activeFilter === opt.value ? '#FFFFFF' : '#4A5568',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== opt.value) e.currentTarget.style.backgroundColor = '#E2E8F0';
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== opt.value) e.currentTarget.style.backgroundColor = '#EDF2F7';
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Prompt cards grid */}
      {filteredPrompts.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '48px 28px',
            textAlign: 'center',
          }}
        >
          <Library size={48} color="#E2E8F0" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#718096', margin: 0, lineHeight: 1.6 }}>
            {activeFilter === 0
              ? 'You haven\'t saved any prompts yet. Look for the save icon on any prompt across the platform to add it here.'
              : `No Level ${activeFilter} prompts saved yet.`}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={handleCopy}
              onCopyMarkdown={handleCopyMarkdown}
              onDelete={() => handleDelete(prompt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
