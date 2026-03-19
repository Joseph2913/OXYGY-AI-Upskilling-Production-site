// pages/app/AppOnboarding.tsx — Mandatory 5-step onboarding wizard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const TOTAL_STEPS = 5;

// ── Step data ──

const FUNCTIONS = [
  'Consulting',
  'Business Development',
  'Project Management',
  'L&D',
  'Analytics',
  'Operations',
  'Communications',
  'IT',
  'Other',
];

const SENIORITY_OPTIONS = [
  'Junior / Associate',
  'Mid-Level',
  'Senior / Lead',
  'Manager / Director',
  'VP / C-Suite',
];

const AI_EXPERIENCE_OPTIONS = [
  { key: 'beginner', title: 'Beginner', description: "I've tried AI a few times but don't use it regularly" },
  { key: 'comfortable-user', title: 'Comfortable User', description: 'I use AI tools weekly for basic tasks' },
  { key: 'builder', title: 'Builder', description: "I've created custom prompts, GPTs, or agents" },
  { key: 'integrator', title: 'Integrator', description: "I've connected AI into workflows or built AI-powered tools" },
];

const AMBITION_OPTIONS = [
  { key: 'confident-daily-use', title: 'Confident Daily Use', description: 'Use AI effectively every day' },
  { key: 'build-reusable-tools', title: 'Build Reusable Tools', description: 'Create AI agents and templates my team can use' },
  { key: 'own-ai-processes', title: 'Own AI Processes', description: 'Design and run automated AI workflows' },
  { key: 'build-full-apps', title: 'Build Full Apps', description: 'Create complete AI-powered applications' },
  { key: 'lead-ai-strategy', title: 'Lead AI Strategy', description: 'Drive AI adoption across my organisation' },
];

const AVAILABILITY_OPTIONS = ['1–2 hours', '3–4 hours', '5+ hours'];

interface FormData {
  fullName: string;
  role: string;
  function: string;
  functionOther: string;
  seniority: string;
  aiExperience: string;
  experienceDescription: string;
  ambition: string;
  goalDescription: string;
  challenge: string;
  availability: string;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  role: '',
  function: '',
  functionOther: '',
  seniority: '',
  aiExperience: '',
  experienceDescription: '',
  ambition: '',
  goalDescription: '',
  challenge: '',
  availability: '',
};

export default function AppOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill name from OAuth
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setForm((prev) => ({ ...prev, fullName: user.user_metadata.full_name || prev.fullName }));
    }
  }, [user]);

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation per step ──
  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return !!(form.fullName.trim() && form.role.trim() && form.function && form.seniority);
      case 2:
        return !!form.aiExperience;
      case 3:
        return !!form.ambition;
      case 4:
        return !!(form.challenge.trim() && form.availability);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);

    try {
      // 1. Save profile data
      const profileData = {
        id: user.id,
        full_name: form.fullName,
        role: form.role,
        function: form.function === 'Other' ? form.functionOther : form.function,
        function_other: form.function === 'Other' ? form.functionOther : null,
        seniority: form.seniority,
        ai_experience: form.aiExperience,
        experience_description: form.experienceDescription || null,
        ambition: form.ambition,
        goal_description: form.goalDescription || null,
        challenge: form.challenge,
        availability: form.availability,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      };

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileErr) throw profileErr;

      // 2. Call generate-pathway API
      // Compute level depths from experience level (L1 & L2 are always mandatory)
      const LEVEL_DEPTHS: Record<string, Record<string, string>> = {
        'beginner':         { L1: 'full',       L2: 'full',       L3: 'awareness', L4: 'skip',       L5: 'skip' },
        'comfortable-user': { L1: 'fast-track',  L2: 'full',       L3: 'full',      L4: 'awareness',  L5: 'skip' },
        'builder':          { L1: 'fast-track',  L2: 'fast-track', L3: 'full',      L4: 'full',       L5: 'awareness' },
        'integrator':       { L1: 'fast-track',  L2: 'fast-track', L3: 'fast-track',L4: 'full',       L5: 'full' },
      };
      const levelDepths = LEVEL_DEPTHS[form.aiExperience] || LEVEL_DEPTHS['beginner'];

      const apiPayload = {
        formData: {
          role: form.role,
          function: form.function === 'Other' ? form.functionOther : form.function,
          functionOther: form.functionOther,
          seniority: form.seniority,
          aiExperience: form.aiExperience,
          ambition: form.ambition,
          challenge: form.challenge,
          availability: form.availability,
          experienceDescription: form.experienceDescription,
          goalDescription: form.goalDescription,
        },
        levelDepths,
      };

      const res = await fetch('/api/generate-pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) throw new Error('Failed to generate learning plan');

      const pathwayData = await res.json();

      // 3. Save learning plan
      const { error: planErr } = await supabase
        .from('learning_plans')
        .insert({
          user_id: user.id,
          pathway_summary: pathwayData.pathwaySummary,
          total_estimated_weeks: pathwayData.totalEstimatedWeeks,
          levels_data: pathwayData.levels || {},
          level_depths: pathwayData.levelDepths || {},
        });

      if (planErr) console.error('Plan save error:', planErr);

      // 4. Mark onboarding complete
      const { error: completeErr } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (completeErr) throw completeErr;

      // 5. Navigate to dashboard
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      console.error('Onboarding error:', err);
      setError('Something went wrong. Please try again.');
      setGenerating(false);
    }
  };

  // ── Render ──

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Progress bar */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#A0AEC0' }}>
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 4,
          background: '#E2E8F0',
          borderRadius: 2,
          marginBottom: 32,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(step / TOTAL_STEPS) * 100}%`,
            height: '100%',
            background: '#38B2AC',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 32,
        }}
      >
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} />}
        {step === 3 && <Step3 form={form} set={set} />}
        {step === 4 && <Step4 form={form} set={set} />}
        {step === 5 && <Step5Review form={form} onEdit={(s) => setStep(s)} />}

        {error && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1px solid #FEB2B2',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13,
              color: '#C53030',
              marginTop: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: step === 1 ? 'flex-end' : 'space-between',
            marginTop: 28,
          }}
        >
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={generating}
              style={{
                border: '1px solid #E2E8F0',
                color: '#4A5568',
                borderRadius: 24,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              style={{
                background: isStepValid() ? '#38B2AC' : '#A0AEC0',
                color: '#FFFFFF',
                borderRadius: 24,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? '#A0AEC0' : '#38B2AC',
                color: '#FFFFFF',
                borderRadius: 24,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {generating && <SmallSpinner />}
              {generating ? 'Generating…' : 'Generate My Learning Plan →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Components ──

interface StepProps {
  form: FormData;
  set: (field: keyof FormData, value: string) => void;
}

function Step1({ form, set }: StepProps) {
  return (
    <>
      <StepHeading title="Who You Are" description="Tell us about your role so we can personalise your journey." />

      <FieldLabel>Full name</FieldLabel>
      <TextInput value={form.fullName} onChange={(v) => set('fullName', v)} placeholder="Your full name" />

      <FieldLabel>Role / job title</FieldLabel>
      <TextInput value={form.role} onChange={(v) => set('role', v)} placeholder="e.g., Senior Consultant, Project Manager, L&D Lead" />

      <FieldLabel>Function</FieldLabel>
      <SelectInput value={form.function} onChange={(v) => set('function', v)} options={FUNCTIONS} placeholder="Select your function" />
      {form.function === 'Other' && (
        <>
          <FieldLabel>Function (specify)</FieldLabel>
          <TextInput value={form.functionOther} onChange={(v) => set('functionOther', v)} placeholder="Your function" />
        </>
      )}

      <FieldLabel>Seniority</FieldLabel>
      <SelectInput value={form.seniority} onChange={(v) => set('seniority', v)} options={SENIORITY_OPTIONS} placeholder="Select your seniority level" />
    </>
  );
}

function Step2({ form, set }: StepProps) {
  return (
    <>
      <StepHeading title="Your AI Experience" description="Help us understand where you're starting from." />

      <FieldLabel>AI experience level</FieldLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {AI_EXPERIENCE_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.key}
            title={opt.title}
            description={opt.description}
            selected={form.aiExperience === opt.key}
            onClick={() => set('aiExperience', opt.key)}
          />
        ))}
      </div>

      <FieldLabel>How do you currently use AI? (optional)</FieldLabel>
      <TextArea value={form.experienceDescription} onChange={(v) => set('experienceDescription', v)} placeholder="Briefly describe how you currently use AI in your work" />
    </>
  );
}

function Step3({ form, set }: StepProps) {
  return (
    <>
      <StepHeading title="Your Ambition" description="Where would you like to get to with AI?" />

      <FieldLabel>Primary ambition</FieldLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {AMBITION_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.key}
            title={opt.title}
            description={opt.description}
            selected={form.ambition === opt.key}
            onClick={() => set('ambition', opt.key)}
          />
        ))}
      </div>

      <FieldLabel>What specific goal would you like to work towards? (optional)</FieldLabel>
      <TextArea value={form.goalDescription} onChange={(v) => set('goalDescription', v)} placeholder="What specific goal would you like to work towards?" />
    </>
  );
}

function Step4({ form, set }: StepProps) {
  return (
    <>
      <StepHeading title="Your Context" description="Help us tailor the pace and focus of your plan." />

      <FieldLabel>What's the biggest challenge you face when using AI right now?</FieldLabel>
      <TextArea value={form.challenge} onChange={(v) => set('challenge', v)} placeholder="Describe your biggest AI challenge" />

      <FieldLabel>Weekly availability</FieldLabel>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {AVAILABILITY_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => set('availability', opt)}
            style={{
              padding: '10px 20px',
              borderRadius: 24,
              border: form.availability === opt ? '2px solid #38B2AC' : '1px solid #E2E8F0',
              background: form.availability === opt ? '#E6FFFA' : '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              color: form.availability === opt ? '#2C9A94' : '#4A5568',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </>
  );
}

function Step5Review({ form, onEdit }: {
  form: FormData;
  onEdit: (step: number) => void;
}) {
  const sections: { label: string; value: string; step: number }[] = [
    { label: 'NAME', value: form.fullName, step: 1 },
    { label: 'ROLE', value: form.role, step: 1 },
    { label: 'FUNCTION', value: form.function === 'Other' ? form.functionOther : form.function, step: 1 },
    { label: 'SENIORITY', value: form.seniority, step: 1 },
    { label: 'AI EXPERIENCE', value: AI_EXPERIENCE_OPTIONS.find((o) => o.key === form.aiExperience)?.title || form.aiExperience, step: 2 },
    { label: 'AMBITION', value: AMBITION_OPTIONS.find((o) => o.key === form.ambition)?.title || form.ambition, step: 3 },
    { label: 'CHALLENGE', value: form.challenge, step: 4 },
    { label: 'AVAILABILITY', value: form.availability, step: 4 },
  ];

  return (
    <>
      <StepHeading title="Review & Generate Plan" description="Review your answers below. Click Edit to change any section." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map((s) => (
          <div
            key={s.label}
            style={{
              borderLeft: '3px solid #38B2AC',
              padding: '10px 14px',
              background: '#FAFAFA',
              borderRadius: '0 8px 8px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#A0AEC0', marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 14, color: '#1A202C' }}>{s.value || '—'}</div>
            </div>
            <button
              onClick={() => onEdit(s.step)}
              style={{
                fontSize: 12,
                color: '#38B2AC',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Shared UI components ──

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', marginBottom: 8, marginTop: 0 }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 24, marginTop: 0 }}>{description}</p>
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, marginTop: 16 }}>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width: '100%',
        border: `1px solid ${focused ? '#38B2AC' : '#E2E8F0'}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        color: '#1A202C',
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(56, 178, 172, 0.1)' : 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: '100%',
        border: `1px solid ${focused ? '#38B2AC' : '#E2E8F0'}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        color: '#1A202C',
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(56, 178, 172, 0.1)' : 'none',
        boxSizing: 'border-box',
        resize: 'vertical',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        border: `1px solid ${focused ? '#38B2AC' : '#E2E8F0'}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        color: value ? '#1A202C' : '#A0AEC0',
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(56, 178, 172, 0.1)' : 'none',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        cursor: 'pointer',
        appearance: 'auto' as React.CSSProperties['appearance'],
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function SelectCard({ title, description, selected, onClick }: { title: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        border: selected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
        background: selected ? '#E6FFFA' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{description}</div>
    </div>
  );
}

function SmallSpinner() {
  return (
    <>
      <div
        style={{
          width: 14,
          height: 14,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#FFFFFF',
          borderRadius: '50%',
          animation: 'onb-spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes onb-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
