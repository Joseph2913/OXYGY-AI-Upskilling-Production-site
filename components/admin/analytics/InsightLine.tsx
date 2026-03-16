import React from 'react';

interface InsightLineProps {
  text: string;
}

const InsightLine: React.FC<InsightLineProps> = ({ text }) => (
  <p style={{
    fontSize: 12, color: '#718096', fontStyle: 'italic',
    marginTop: 12, paddingTop: 12, margin: 0,
    borderTop: '1px solid #F7FAFC',
  }}>
    {text}
  </p>
);

export default InsightLine;
