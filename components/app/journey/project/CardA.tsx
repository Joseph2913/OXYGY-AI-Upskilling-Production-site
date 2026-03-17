import React, { useState } from 'react';
import { Wrench, GitBranch, LayoutDashboard } from 'lucide-react';
import { ScreenshotUploader } from './ScreenshotUploader';
import type { LocalScreenshot } from './ScreenshotUploader';

interface CardAProps {
  level: number;
  toolName: string;
  platformUsed: string;
  toolLink: string;
  onFieldChange: (field: string, value: string) => void;
  accentColor: string;
  accentDark: string;
  disabled?: boolean;
  localScreenshots: LocalScreenshot[];
  existingPaths: string[];
  existingUrls: Record<string, string>;
  onAddScreenshots: (files: LocalScreenshot[]) => void;
  onRemoveLocalScreenshot: (idx: number) => void;
  onRemoveExistingScreenshot: (path: string) => void;
  linkError?: string;
}

const PLATFORM_OPTIONS: Record<number, string[]> = {
  2: ['Custom GPT (ChatGPT)', 'Claude Project', 'Copilot Agent', 'Other'],
  3: ['Make', 'Zapier', 'n8n', 'Power Automate', 'Other'],
  4: ['React', 'Streamlit', 'Retool', 'Bubble', 'Other'],
  5: ['React + Vercel', 'Next.js', 'Streamlit', 'Bubble', 'Other'],
};

const HEADERS: Record<number, { title: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  2: { title: 'What You Built', icon: Wrench },
  3: { title: 'What You Designed', icon: GitBranch },
  4: { title: 'What You Designed', icon: LayoutDashboard },
  5: { title: 'What You Designed', icon: LayoutDashboard },
};

const TOOL_NAME_LABELS: Record<number, string> = {
  2: 'What did you name your agent or tool?',
  3: 'What did you name your workflow?',
  4: 'What did you name your dashboard or front-end?',
  5: 'What did you name your dashboard or front-end?',
};

const LINK_LABELS: Record<number, string> = {
  2: 'Share link (optional)',
  3: 'Link to your workflow (optional)',
  4: 'Share the URL of your dashboard',
  5: 'Share the URL of your dashboard',
};

const SCREENSHOT_LABELS: Record<number, string> = {
  2: 'Upload screenshots showing your agent in action',
  3: 'Upload screenshots of your workflow canvas',
  4: 'Upload screenshots of your dashboard',
  5: 'Upload screenshots of your dashboard',
};

const SCREENSHOT_HELPERS: Record<number, string> = {
  2: 'Show the configuration, a sample input, and a sample output.',
  3: 'Show the full workflow with connected nodes, any configuration panels, and a sample output.',
  4: 'Show the dashboard layout, key visualisations, and any interactive elements.',
  5: 'Show the dashboard layout, key visualisations, and any interactive elements.',
};

const MIN_SCREENSHOTS: Record<number, number> = { 2: 1, 3: 1, 4: 2, 5: 2 };

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  color: '#1A202C',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

export const CardA: React.FC<CardAProps> = ({
  level,
  toolName,
  platformUsed,
  toolLink,
  onFieldChange,
  accentColor,
  accentDark,
  disabled,
  localScreenshots,
  existingPaths,
  existingUrls,
  onAddScreenshots,
  onRemoveLocalScreenshot,
  onRemoveExistingScreenshot,
  linkError,
}) => {
  const header = HEADERS[level] || HEADERS[2];
  const Icon = header.icon;
  const platforms = PLATFORM_OPTIONS[level] || PLATFORM_OPTIONS[2];
  const isOther = !platforms.slice(0, -1).includes(platformUsed) && platformUsed !== '';
  const [showOtherInput, setShowOtherInput] = useState(isOther);
  const linkRequired = level >= 4;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={16} color={accentDark} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>{header.title}</span>
      </div>

      {/* Tool name */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
          {TOOL_NAME_LABELS[level]}
        </div>
        <input
          type="text"
          value={toolName}
          onChange={(e) => onFieldChange('toolName', e.target.value)}
          disabled={disabled}
          placeholder={level === 2 ? 'e.g., Meeting Notes Summariser, Client Brief Drafter' : ''}
          style={{ ...INPUT_STYLE, opacity: disabled ? 0.6 : 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,178,172,0.1)'; e.currentTarget.style.outline = 'none'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Platform */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
          Which platform did you use?
        </div>
        <select
          value={showOtherInput ? 'Other' : platformUsed}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'Other') {
              setShowOtherInput(true);
              onFieldChange('platformUsed', '');
            } else {
              setShowOtherInput(false);
              onFieldChange('platformUsed', v);
            }
          }}
          disabled={disabled}
          style={{ ...INPUT_STYLE, opacity: disabled ? 0.6 : 1, cursor: 'pointer' }}
        >
          <option value="">Select a platform</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {showOtherInput && (
          <input
            type="text"
            value={platformUsed}
            onChange={(e) => onFieldChange('platformUsed', e.target.value)}
            placeholder="Specify the platform"
            disabled={disabled}
            style={{ ...INPUT_STYLE, marginTop: 8, opacity: disabled ? 0.6 : 1 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,178,172,0.1)'; e.currentTarget.style.outline = 'none'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        )}
      </div>

      {/* Link */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
          {LINK_LABELS[level]}
        </div>
        {!linkRequired && (
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
            Paste the share link to your custom GPT or agent, if available.
          </div>
        )}
        <input
          type="url"
          value={toolLink}
          onChange={(e) => onFieldChange('toolLink', e.target.value)}
          disabled={disabled}
          placeholder="https://"
          style={{ ...INPUT_STYLE, opacity: disabled ? 0.6 : 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56,178,172,0.1)'; e.currentTarget.style.outline = 'none'; }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {linkError && (
          <div style={{ fontSize: 11, color: '#E53E3E', marginTop: 4 }}>{linkError}</div>
        )}
      </div>

      {/* Screenshots */}
      <ScreenshotUploader
        label={SCREENSHOT_LABELS[level]}
        helperText={SCREENSHOT_HELPERS[level]}
        existingPaths={existingPaths}
        existingUrls={existingUrls}
        localFiles={localScreenshots}
        onAddFiles={onAddScreenshots}
        onRemoveLocal={onRemoveLocalScreenshot}
        onRemoveExisting={onRemoveExistingScreenshot}
        maxFiles={5}
        minFiles={MIN_SCREENSHOTS[level]}
        accentColor={accentColor}
        accentDark={accentDark}
        disabled={disabled}
      />
    </div>
  );
};
