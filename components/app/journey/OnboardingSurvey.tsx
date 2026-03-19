import React from 'react';

interface OnboardingSurveyProps {
  prefillData?: Record<string, any>;
  onPlanGenerated?: (plan: any) => void;
}

const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({ prefillData, onPlanGenerated }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096' }}>
      Survey coming soon
    </div>
  );
};

export default OnboardingSurvey;
