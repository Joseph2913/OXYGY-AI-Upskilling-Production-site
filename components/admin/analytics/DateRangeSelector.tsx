import React from 'react';

interface DateRangeSelectorProps {
  value: number | null; // days, null = all time
  onChange: (days: number | null) => void;
}

const OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'All Time', value: null },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => (
  <select
    value={value === null ? 'all' : String(value)}
    onChange={e => {
      const v = e.target.value;
      onChange(v === 'all' ? null : Number(v));
    }}
    style={{
      padding: '8px 14px', borderRadius: 24,
      border: '1px solid #E2E8F0', fontSize: 12, fontWeight: 600,
      color: '#4A5568', background: '#FFFFFF', cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", outline: 'none',
    }}
  >
    {OPTIONS.map(opt => (
      <option key={opt.label} value={opt.value === null ? 'all' : String(opt.value)}>
        {opt.label}
      </option>
    ))}
  </select>
);

export default DateRangeSelector;
