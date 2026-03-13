import React from 'react';

interface PlatformSelectorProps {
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const PLATFORMS = [
  { label: 'n8n', sub: 'Nodes & connections', logo: '/logos/brands/n8n.svg' },
  { label: 'Zapier', sub: 'Zaps & steps', logo: '/logos/brands/zapier.svg' },
  { label: 'Make', sub: 'Scenarios & modules', logo: '/logos/brands/make.svg' },
  { label: 'Power Automate', sub: 'Flows & connectors', logo: '/logos/microsoft.svg' },
  { label: 'AI Coding Agent', sub: 'Functions & API calls', logo: '' },
  { label: 'Not sure yet', sub: 'Platform-agnostic language', logo: '' },
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {platform.logo ? (
                  <img
                    src={platform.logo}
                    alt={platform.label}
                    style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
                  />
                ) : null}
                <div>
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
                </div>
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
