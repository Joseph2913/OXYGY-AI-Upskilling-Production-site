import React, { useEffect, useState } from 'react';

interface PlatformSelectorProps {
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string) => void;
  onGenerate: () => void;
  loading: boolean;
  loadingMessage: string;
}

const PLATFORMS = [
  { label: 'n8n', sub: 'Nodes & connections' },
  { label: 'Zapier', sub: 'Zaps & steps' },
  { label: 'Make', sub: 'Scenarios & modules' },
  { label: 'Power Automate', sub: 'Flows & connectors' },
  { label: 'AI Coding Agent', sub: 'Functions & API calls' },
  { label: 'Not sure yet', sub: 'Platform-agnostic language' },
];

const LOADING_MESSAGES = [
  'Reading your workflow…',
  'Mapping steps to {platform} terminology…',
  'Writing your build guide…',
  'Adding test checklist and edge cases…',
  'Almost done…',
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onSelectPlatform,
  onGenerate,
  loading,
  loadingMessage,
}) => {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCycleIndex(0);
      setProgress(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 1;
      });
    }, 150);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  const currentLoadingMessage = loading
    ? LOADING_MESSAGES[cycleIndex].replace(
        '{platform}',
        selectedPlatform || 'your platform'
      )
    : '';

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: '24px 0',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: '#E2E8F0',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#38B2AC',
              borderRadius: 3,
              transition: 'width 0.15s linear',
            }}
          />
        </div>
        <p
          style={{
            fontSize: 14,
            color: '#4A5568',
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
          }}
        >
          {currentLoadingMessage}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1A202C',
          margin: '0 0 6px 0',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        What tool will you use to build this?
      </h3>
      <p
        style={{
          fontSize: 14,
          color: '#718096',
          margin: '0 0 24px 0',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        We'll tailor the language and instructions to your platform.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatform === platform.label;
          return (
            <button
              key={platform.label}
              onClick={() => onSelectPlatform(platform.label)}
              style={{
                minWidth: 160,
                padding: '16px 20px',
                backgroundColor: isSelected ? '#E6FFFA' : '#FFFFFF',
                border: isSelected
                  ? '1.5px solid #38B2AC'
                  : '1px solid #E2E8F0',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1A202C',
                  marginBottom: 2,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {platform.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#A0AEC0',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {platform.sub}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onGenerate}
          disabled={!selectedPlatform}
          style={{
            padding: '10px 28px',
            backgroundColor: selectedPlatform ? '#38B2AC' : '#CBD5E0',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: selectedPlatform ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s',
          }}
        >
          Generate Build Guide &rarr;
        </button>
      </div>
    </div>
  );
};

export default PlatformSelector;
