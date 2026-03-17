import React from 'react';
import { FileText } from 'lucide-react';
import { WordCountField } from './WordCountField';

interface CaseStudyData {
  caseStudyProblem: string;
  caseStudySolution: string;
  caseStudyOutcome: string;
  caseStudyLearnings: string;
}

interface Props {
  data: CaseStudyData;
  onChange: (field: string, value: string) => void;
  accentDark: string;
  disabled?: boolean;
}

const SECTIONS = [
  { key: 'caseStudyProblem', label: 'The Problem', guiding: 'What problem were you solving? Who was affected? What was the cost of not solving it?' },
  { key: 'caseStudySolution', label: 'Your Solution', guiding: 'What did you build? How does it work? What technologies and approaches did you use?' },
  { key: 'caseStudyOutcome', label: 'The Outcome', guiding: 'What changed after deployment? Include specific metrics, user feedback, or efficiency gains where possible.' },
  { key: 'caseStudyLearnings', label: 'What You Learned', guiding: 'What would you do differently? What surprised you? What skills from the programme were most valuable?' },
];

export const CaseStudyCard: React.FC<Props> = ({ data, onChange, accentDark, disabled }) => {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <FileText size={16} color={accentDark} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>Case Study</span>
      </div>
      <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5, marginBottom: 16 }}>
        Document your project as a structured case study. This is your portfolio piece — the work you'd present to a stakeholder or include in a capability review.
      </div>
      {SECTIONS.map((section) => (
        <div key={section.key} style={{ marginBottom: 20 }}>
          <WordCountField
            value={(data as Record<string, string>)[section.key] || ''}
            onChange={(v) => onChange(section.key, v)}
            label={section.label}
            guidingPrompt={section.guiding}
            minWords={100}
            minHeight={100}
            accentDark={accentDark}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
};
