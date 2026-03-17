import React from 'react';
import { Lightbulb, Target } from 'lucide-react';
import { WordCountField } from './WordCountField';
import { AdoptionPills } from './AdoptionPills';
import { ScreenshotUploader } from './ScreenshotUploader';
import type { LocalScreenshot } from './ScreenshotUploader';

interface FormData {
  reflectionText: string;
  adoptionScope: string | null;
  outcomeText: string;
}

interface Props {
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
}

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 14,
  border: '1px solid #E2E8F0',
  padding: '20px 24px',
  marginBottom: 16,
};

export const SubmissionFormL1: React.FC<Props> = ({
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
}) => {
  return (
    <>
      {/* Card B: How You Applied It */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Lightbulb size={16} color={accentDark} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>How You Applied It</span>
        </div>
        <WordCountField
          value={data.reflectionText}
          onChange={(v) => onChange('reflectionText', v)}
          label=""
          guidingPrompt="Describe a specific situation where you used AI prompting in your daily work. What did you ask? What did you get back? How did it change your approach?"
          minWords={150}
          minHeight={140}
          accentDark={accentDark}
          disabled={disabled}
        />
        <div style={{ marginTop: 16 }}>
          <ScreenshotUploader
            label="Screenshots (optional)"
            helperText="If you have screenshots of your prompts or outputs, add them here."
            existingPaths={existingPaths}
            existingUrls={existingUrls}
            localFiles={localScreenshots}
            onAddFiles={onAddScreenshots}
            onRemoveLocal={onRemoveLocalScreenshot}
            onRemoveExisting={onRemoveExistingScreenshot}
            maxFiles={5}
            minFiles={0}
            accentColor={accentColor}
            accentDark={accentDark}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Card C: What Impact It Had */}
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
            minWords={80}
            minHeight={80}
            accentDark={accentDark}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};
