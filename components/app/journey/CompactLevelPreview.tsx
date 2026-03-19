import React from 'react';
import { LEVEL_META } from '../../../data/levelTopics';

const CompactLevelPreview: React.FC = () => {
  return (
    <div style={{
      padding: '20px 24px', background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #E2E8F0', opacity: 0.7,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#A0AEC0',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
      }}>
        YOUR LEARNING PATHWAY
      </div>
      {LEVEL_META.map((lvl, idx) => (
        <div key={lvl.number} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
          borderBottom: idx < LEVEL_META.length - 1 ? '1px solid #F7FAFC' : 'none',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `${lvl.accentColor}33`, border: `1px solid ${lvl.accentColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: lvl.accentDark,
          }}>
            {lvl.number}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#A0AEC0' }}>
              {lvl.name}
            </div>
            <div style={{
              fontSize: 12, color: '#CBD5E0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {lvl.tagline}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompactLevelPreview;
