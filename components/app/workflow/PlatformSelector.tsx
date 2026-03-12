import React from 'react';

interface PlatformSelectorProps {
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const PLATFORMS = [
  { label: 'n8n', sub: 'Nodes & connections' },
  { label: 'Zapier', sub: 'Zaps & steps' },
  { label: 'Make', sub: 'Scenarios & modules' },
  { label: 'Power Automate', sub: 'Flows & connectors' },
  { label: 'AI Coding Agent', sub: 'Functions & API calls' },
  { label: 'Not sure yet', sub: 'Platform-agnostic language' },
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onSelectPlatform,
  onGenerate,
  loading,
}) => {
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
