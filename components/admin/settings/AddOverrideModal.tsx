import React, { useState, useRef, useEffect } from 'react';
import ToggleSwitch from './ToggleSwitch';

interface AddOverrideModalProps {
  flagKeys: string[];
  orgs: Array<{ id: string; name: string }>;
  onSubmit: (flagKey: string, orgId: string, enabled: boolean) => void;
  onClose: () => void;
}

const AddOverrideModal: React.FC<AddOverrideModalProps> = ({ flagKeys, orgs, onSubmit, onClose }) => {
  const [selectedFlag, setSelectedFlag] = useState(flagKeys[0] || '');
  const [selectedOrg, setSelectedOrg] = useState(orgs[0]?.id || '');
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #E2E8F0', fontSize: 13, color: '#2D3748',
    background: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div ref={ref} style={{
        background: '#FFFFFF', borderRadius: 12, padding: 24, width: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 20 }}>
          Add Org Override
        </div>

        {/* Flag */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 4, display: 'block' }}>
            Flag
          </label>
          <select value={selectedFlag} onChange={e => setSelectedFlag(e.target.value)} style={selectStyle}>
            {flagKeys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Organisation */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 4, display: 'block' }}>
            Organisation
          </label>
          <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} style={selectStyle}>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* Value */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 8, display: 'block' }}>
            Value
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToggleSwitch enabled={enabled} onChange={setEnabled} />
            <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? '#22543D' : '#718096' }}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 24,
            border: '1px solid #E2E8F0', background: '#FFFFFF',
            color: '#4A5568', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Cancel
          </button>
          <button
            onClick={() => selectedFlag && selectedOrg && onSubmit(selectedFlag, selectedOrg, enabled)}
            disabled={!selectedFlag || !selectedOrg}
            style={{
              padding: '8px 16px', borderRadius: 24,
              border: 'none', background: '#38B2AC', color: '#FFFFFF',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: (!selectedFlag || !selectedOrg) ? 0.5 : 1,
            }}
          >
            Create Override
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOverrideModal;
