import React from 'react';
import { Lightbulb, Target } from 'lucide-react';
import { CardA } from './CardA';
import { WordCountField } from './WordCountField';
import { AdoptionPills } from './AdoptionPills';
import type { LocalScreenshot } from './ScreenshotUploader';

interface FormData {
  toolName: string;
  platformUsed: string;
  toolLink: string;
  reflectionText: string;
  adoptionScope: string | null;
  outcomeText: string;
}

interface Props {
  level: number; // 4 or 5 (base cards)
  data: FormData;
  onChange: (field: string, value: string) => void;
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

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 14,
  border: '1px solid #E2E8F0',
  padding: '20px 24px',
  marginBottom: 16,
};

const GUIDING_PROMPTS: Record<number, string> = {
  4: 'Describe your design rationale. Who is the intended audience? What decisions did you make about layout, data presentation, and interaction? How does the dashboard answer their key questions?',
  5: 'Describe your design rationale. Who is the intended audience? What decisions did you make about layout, data presentation, and interaction? How does the dashboard answer their key questions?',
};

export const SubmissionFormL4L5Base: React.FC<Props> = ({
  level,
  data,
  onChange,
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
  const reflectionMinWords = level >= 4 ? 200 : 150;
  const outcomeMinWords = level >= 4 ? 100 : 80;

  return (
    <>
      {/* Card A */}
      <CardA
        level={level}
        toolName={data.toolName}
        platformUsed={data.platformUsed}
        toolLink={data.toolLink}
        onFieldChange={onChange}
        accentColor={accentColor}
        accentDark={accentDark}
        disabled={disabled}
        localScreenshots={localScreenshots}
        existingPaths={existingPaths}
        existingUrls={existingUrls}
        onAddScreenshots={onAddScreenshots}
        onRemoveLocalScreenshot={onRemoveLocalScreenshot}
        onRemoveExistingScreenshot={onRemoveExistingScreenshot}
        linkError={linkError}
      />

      {/* Card B */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Lightbulb size={16} color={accentDark} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>How You Applied It</span>
        </div>
        <WordCountField
          value={data.reflectionText}
          onChange={(v) => onChange('reflectionText', v)}
          label=""
          guidingPrompt={GUIDING_PROMPTS[level]}
          minWords={reflectionMinWords}
          minHeight={120}
          accentDark={accentDark}
          disabled={disabled}
        />
      </div>

      {/* Card C */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Target size={16} color={accentDark} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>What Impact It Had</span>
        </div>
        <AdoptionPills
          value={data.adoptionScope}
          onChange={(v) => onChange('adoptionScope', v)}
          accentColor={accentColor}
          accentDark={accentDark}
          disabled={disabled}
        />
        <div style={{ marginTop: 16 }}>
          <WordCountField
            value={data.outcomeText}
            onChange={(v) => onChange('outcomeText', v)}
            label="What changed as a result?"
            helperText="Give a specific example of how AI improved your work output."
            minWords={outcomeMinWords}
            minHeight={80}
            accentDark={accentDark}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};
