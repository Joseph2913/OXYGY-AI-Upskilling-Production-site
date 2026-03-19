import React from 'react';
import type { PathwayFormData } from '../../../types';

const PROFILES = [
  {
    id: 'new-starter', name: 'The New Starter', emoji: '\u{1F331}',
    role: 'Marketing Coordinator', functionVal: 'Consulting / Advisory',
    seniority: 'Junior / early career (0\u20132 years)', aiExperience: 'beginner',
    ambition: 'confident-daily-use',
    challenge: "I feel like everyone around me is using AI tools and I'm falling behind. I want to be confident using AI for everyday tasks like drafting emails, summarizing documents, and preparing for meetings.",
    availability: '1-2 hours',
    pills: ['Beginner', '0\u20132 years', 'Daily confidence'],
  },
  {
    id: 'curious-pm', name: 'The Curious PM', emoji: '\u{1F527}',
    role: 'Project Manager', functionVal: 'Project Management',
    seniority: 'Mid-level / specialist (3\u20136 years)', aiExperience: 'comfortable-user',
    ambition: 'build-reusable-tools',
    challenge: "I spend hours every week summarizing meeting notes and status updates. I want to build something my team can use to automate this \u2014 paste in the notes, get a structured summary with action items.",
    availability: '3-4 hours',
    pills: ['Comfortable user', '3\u20136 years', 'Build tools'],
  },
  {
    id: 'ld-champion', name: 'The L&D Champion', emoji: '\u{1F4DA}',
    role: 'L&D Manager', functionVal: 'L&D / Training',
    seniority: 'Mid-level / specialist (3\u20136 years)', aiExperience: 'builder',
    ambition: 'own-ai-processes',
    challenge: "I want to automate our skills assessment process \u2014 currently we run surveys manually, analyze results in spreadsheets, and create individual training plans by hand. It takes weeks.",
    availability: '3-4 hours',
    pills: ['Builder', '3\u20136 years', 'Own processes'],
  },
  {
    id: 'ops-director', name: 'The Ops Director', emoji: '\u2699\uFE0F',
    role: 'Operations Director', functionVal: 'Ops & SOP Management',
    seniority: 'Senior / lead (7\u201312 years)', aiExperience: 'comfortable-user',
    ambition: 'own-ai-processes',
    challenge: "I need to standardize SOPs across 6 regional teams. Each team documents processes differently, and I spend weeks reconciling them. I want AI to help convert, standardize, and maintain these documents.",
    availability: '1-2 hours',
    pills: ['Comfortable user', '7\u201312 years', 'Own processes'],
  },
  {
    id: 'innovation-lead', name: 'The Innovation Lead', emoji: '\u{1F680}',
    role: 'Director of Digital Transformation', functionVal: 'IT & Knowledge Management',
    seniority: 'Director / executive (12+ years)', aiExperience: 'integrator',
    ambition: 'build-full-apps',
    challenge: "I want to build an internal knowledge base for the firm \u2014 a place where consultants can search across project reports, methodologies, and case studies using AI, and get personalized recommendations based on their current project.",
    availability: '5+ hours',
    pills: ['Integrator', '12+ years', 'Full apps'],
  },
];

interface ProfileShortcutsProps {
  selectedId: string | null;
  onSelect: (formData: Partial<PathwayFormData>, profileId: string) => void;
}

const ProfileShortcuts: React.FC<ProfileShortcutsProps> = ({ selectedId, onSelect }) => {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>
        Start from a profile
      </div>
      <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 14 }}>
        Click a profile to pre-fill the form, then adjust any answers to match your situation.
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
      }}>
        {PROFILES.map(p => {
          const isSelected = selectedId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onSelect({
                role: p.role,
                function: p.functionVal,
                functionOther: '',
                seniority: p.seniority,
                aiExperience: p.aiExperience,
                ambition: p.ambition,
                challenge: p.challenge,
                availability: p.availability,
              }, p.id)}
              style={{
                background: isSelected ? '#F0FFFC' : '#FFFFFF',
                border: isSelected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                borderRadius: 12, padding: 14, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#38B2AC'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{p.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#718096', marginBottom: 8 }}>{p.role}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.pills.map(pill => (
                  <span key={pill} style={{
                    fontSize: 10, background: '#F7FAFC', color: '#4A5568',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(5"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileShortcuts;
