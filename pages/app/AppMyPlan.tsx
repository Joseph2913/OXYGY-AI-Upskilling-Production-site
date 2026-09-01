import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Info, Sparkles, Target, Layers, Users, Tag, BarChart3, Pencil, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { getProfile, getLatestLearningPlan, upsertProfile, saveLearningPlan } from '../../lib/database';
import { usePathwayApi } from '../../hooks/usePathwayApi';
import { classifyLevels, derivePersona } from '../../lib/levelClassification';
import { LEVEL_META } from '../../data/levelTopics';
import type { UserProfile } from '../../data/dashboard-types';
import type { PathwayApiResponse, LevelDepth, PathwayFormData } from '../../types';

const SENIORITY_OPTIONS = [
  'Junior / early career (0–2 years)',
  'Mid-level / specialist (3–6 years)',
  'Senior / lead (7–12 years)',
  'Director / executive (12+ years)',
];

const AI_EXPERIENCE_LABELS: Record<string, string> = {
  'beginner': 'Beginner',
  'comfortable-user': 'Comfortable User',
  'builder': 'Builder',
  'integrator': 'Integrator',
};
const AMBITION_LABELS: Record<string, string> = {
  'confident-daily-use': 'Confident Daily Use',
  'build-reusable-tools': 'Build Reusable Tools',
  'own-ai-processes': 'Own AI Processes',
  'build-full-apps': 'Build Full Applications',
  'lead-ai-strategy': 'Lead AI Strategy',
};
const AVAILABILITY_LABELS: Record<string, string> = {
  '1-2 hours': '1–2 hrs/week',
  '3-4 hours': '3–4 hrs/week',
  '5+ hours': '5+ hrs/week',
};
const DEPTH_LABELS: Record<LevelDepth, string> = {
  full: 'Full',
  'fast-track': 'Fast Track',
  awareness: 'Awareness Only',
  skip: 'Not Included',
};

// ─── Keyword extraction (client-side, deterministic — no AI call needed) ───
// Pulls out the notable terms a learner used in their free-text survey answers
// (challenge / experience / goal), so the "Tailored Learning Journey" tab can
// show a direct, visible link between what they said and what was built for them.

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'has', 'had',
  'are', 'was', 'were', 'been', 'being', 'but', 'not', 'you', 'your', 'our',
  'their', 'them', 'they', 'about', 'into', 'more', 'most', 'some', 'such',
  'than', 'then', 'there', 'these', 'those', 'what', 'when', 'where', 'which',
  'while', 'who', 'will', 'would', 'could', 'should', 'also', 'just', 'like',
  'want', 'need', 'able', 'lot', 'lots', 'without', 'across', 'over', 'under',
  'each', 'both', 'other', 'only', 'very', 'much', 'many', 'because', 'still',
  'even', 'really', 'especially', 'currently', 'time', 'work', 'working',
  'help', 'helps', 'make', 'makes', 'making', 'take', 'takes', 'taking',
  'spend', 'spending', 'move', 'moving', 'faster',
]);

function extractKeywords(text: string, max = 8): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  const bigramCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const [a, b] = [words[i], words[i + 1]];
    if (a.length < 4 || b.length < 4 || STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    const phrase = `${a} ${b}`;
    bigramCounts.set(phrase, (bigramCounts.get(phrase) || 0) + 1);
  }

  const unigramCounts = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    unigramCounts.set(w, (unigramCounts.get(w) || 0) + 1);
  }

  const bigrams = [...bigramCounts.keys()];
  const usedWords = new Set(bigrams.flatMap(p => p.split(' ')));
  const unigrams = [...unigramCounts.keys()]
    .filter(w => !usedWords.has(w))
    .sort((a, b) => (unigramCounts.get(b)! - unigramCounts.get(a)!));

  return [...bigrams, ...unigrams]
    .slice(0, max)
    .map(k => k.replace(/\b\w/g, c => c.toUpperCase()));
}

function highlightKeywords(text: string, keywords: string[], accentColor: string, accentDark: string): React.ReactNode {
  if (!text || keywords.length === 0) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (!isMatch) return part;
    return (
      <span key={i} style={{ background: `${accentColor}40`, color: accentDark, fontWeight: 700, borderRadius: 4, padding: '0 3px' }}>
        {part}
      </span>
    );
  });
}

function AnswerRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #EDF2F7' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#2D3748', lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' };
const fieldInputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 8,
  padding: '8px 10px', fontSize: 13, color: '#1A202C', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

function EditAnswersForm({ initial, saving, error, onCancel, onSave }: {
  initial: PathwayFormData;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (formData: PathwayFormData) => void;
}) {
  const [form, setForm] = useState<PathwayFormData>(initial);
  const set = <K extends keyof PathwayFormData>(key: K, value: PathwayFormData[K]) => setForm(f => ({ ...f, [key]: value }));
  const toggleAmbition = (value: string) => {
    setForm(f => ({
      ...f,
      ambition: f.ambition.includes(value) ? f.ambition.filter(a => a !== value) : [...f.ambition, value],
    }));
  };

  return (
    <div style={{ background: '#FFFAF0', border: '1.5px solid #FBE8A6', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>Edit Onboarding Answers (Admin)</div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={16} color="#718096" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={fieldLabelStyle}>Role</label>
          <input style={fieldInputStyle} value={form.role} onChange={e => set('role', e.target.value)} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Function</label>
          <input style={fieldInputStyle} value={form.function} onChange={e => set('function', e.target.value)} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Seniority</label>
          <select style={fieldInputStyle} value={form.seniority} onChange={e => set('seniority', e.target.value)}>
            {SENIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={fieldLabelStyle}>AI Experience</label>
          <select style={fieldInputStyle} value={form.aiExperience} onChange={e => set('aiExperience', e.target.value)}>
            {Object.entries(AI_EXPERIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={fieldLabelStyle}>Weekly Availability</label>
          <select style={fieldInputStyle} value={form.availability} onChange={e => set('availability', e.target.value)}>
            {Object.entries(AVAILABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Ambition (drives assigned levels — select one or more)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {Object.entries(AMBITION_LABELS).map(([v, l]) => {
            const selected = form.ambition.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleAmbition(v)}
                style={{
                  fontSize: 12, fontWeight: 600, borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  border: selected ? '1.5px solid #38B2AC' : '1.5px solid #E2E8F0',
                  background: selected ? '#F0FFFC' : '#FFFFFF', color: selected ? '#2D9E99' : '#718096',
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={fieldLabelStyle}>Biggest Challenge</label>
          <textarea style={{ ...fieldInputStyle, minHeight: 60, resize: 'vertical' as const }} value={form.challenge} onChange={e => set('challenge', e.target.value)} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Current AI Experience</label>
          <textarea style={{ ...fieldInputStyle, minHeight: 50, resize: 'vertical' as const }} value={form.experienceDescription} onChange={e => set('experienceDescription', e.target.value)} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Goal</label>
          <textarea style={{ ...fieldInputStyle, minHeight: 50, resize: 'vertical' as const }} value={form.goalDescription} onChange={e => set('goalDescription', e.target.value)} />
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          style={{
            background: saving ? '#CBD5E0' : '#1A202C', color: '#FFFFFF', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {saving ? 'Regenerating plan…' : 'Save & Regenerate Plan'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            background: 'transparent', color: '#718096', border: '1px solid #E2E8F0', borderRadius: 10,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

type Tab = 'raw' | 'tailored';

const AppMyPlan: React.FC = () => {
  const { user, isOxygyAdmin } = useAuth();
  const { isAdmin, members } = useOrg();
  const canViewOthers = isAdmin || isOxygyAdmin;

  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [planResult, setPlanResult] = useState<{ plan: PathwayApiResponse; level_depths: Record<string, LevelDepth> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('raw');
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const { generatePathway } = usePathwayApi();

  const canEdit = isAdmin || isOxygyAdmin;

  const refetchViewedUser = () => {
    if (!viewUserId) return Promise.resolve();
    setLoading(true);
    setExpandedLevel(null);
    return Promise.all([getProfile(viewUserId), getLatestLearningPlan(viewUserId)]).then(([p, plan]) => {
      setProfile(p);
      setPlanResult(plan);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user && !viewUserId) setViewUserId(user.id);
  }, [user, viewUserId]);

  useEffect(() => {
    refetchViewedUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewUserId]);

  const viewingSelf = viewUserId === user?.id;
  const viewedMember = members.find(m => m.userId === viewUserId);

  const ambitionList = useMemo(
    () => (profile?.ambition || '').split(',').map(a => a.trim()).filter(Boolean),
    [profile?.ambition],
  );

  const keywords = useMemo(() => {
    if (!profile) return [];
    const combined = [profile.challenge, profile.experienceDescription, profile.goalDescription].filter(Boolean).join('. ');
    return extractKeywords(combined);
  }, [profile]);

  const whyThisPlan = useMemo(() => {
    if (!profile) return '';
    if (planResult?.plan.whyThisPlan) return planResult.plan.whyThisPlan;
    const seniority = (profile.seniority || 'professional').split('(')[0].trim();
    const fn = profile.function === 'Other' ? profile.functionOther : profile.function;
    const aiLevel = AI_EXPERIENCE_LABELS[profile.aiExperience]?.toLowerCase() || 'some';
    const ambitions = ambitionList.map(a => AMBITION_LABELS[a]?.toLowerCase() || a).join(', ');
    return `${viewedMember?.fullName || (viewingSelf ? 'They' : 'This person')} told us they're a ${seniority} in ${fn || 'their function'} with ${aiLevel} AI experience, aiming to ${ambitions || 'grow their AI skills'}. ${planResult?.plan.pathwaySummary || ''}`.trim();
  }, [profile, planResult, ambitionList, viewedMember, viewingSelf]);

  const assignedLevels = [1, 2, 3, 4, 5].filter(n => {
    const depth = planResult?.level_depths?.[`L${n}`];
    return depth === 'full' || depth === 'fast-track';
  });

  const editInitial: PathwayFormData | null = profile ? {
    role: profile.role,
    function: profile.function,
    functionOther: profile.functionOther,
    seniority: profile.seniority || SENIORITY_OPTIONS[0],
    aiExperience: profile.aiExperience || 'beginner',
    ambition: ambitionList.length > 0 ? ambitionList : ['confident-daily-use'],
    challenge: profile.challenge,
    availability: profile.availability || '1-2 hours',
    experienceDescription: profile.experienceDescription,
    goalDescription: profile.goalDescription,
  } : null;

  const handleSaveAndRegenerate = async (formData: PathwayFormData) => {
    if (!viewUserId) return;
    setRegenerating(true);
    setRegenError(null);
    try {
      const depths = classifyLevels(formData.aiExperience, formData.ambition);
      const persona = derivePersona(formData.seniority, formData.ambition);
      const result = await generatePathway(formData, depths, persona);
      if (!result) {
        setRegenError('Something went wrong generating the new plan. Please try again.');
        return;
      }
      const profileSaved = await upsertProfile(viewUserId, {
        role: formData.role, function: formData.function, functionOther: formData.functionOther,
        seniority: formData.seniority, aiExperience: formData.aiExperience,
        ambition: formData.ambition.join(','), challenge: formData.challenge,
        availability: formData.availability, experienceDescription: formData.experienceDescription,
        goalDescription: formData.goalDescription,
      } as Partial<UserProfile>);
      if (!profileSaved) {
        setRegenError('Something went wrong saving the updated answers. Please try again.');
        return;
      }
      const planSaved = await saveLearningPlan(viewUserId, result, depths);
      if (!planSaved) {
        setRegenError('Something went wrong saving the regenerated plan. Please try again.');
        return;
      }
      await refetchViewedUser();
      setEditing(false);
      setActiveTab('tailored');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: "'DM Sans', sans-serif", maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A202C', margin: '0 0 6px' }}>
            Assessment Results &amp; Learning Plan
          </h1>
          <p style={{ fontSize: 14, color: '#718096', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
            {viewingSelf
              ? "Here's what you told us during onboarding, and how it shaped your personalised learning plan."
              : `What ${viewedMember?.fullName || 'this learner'} told us during onboarding, and how it shaped their personalised learning plan.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          {canViewOthers && members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '8px 12px' }}>
              <Users size={15} color="#718096" />
              <select
                value={viewUserId || ''}
                onChange={e => setViewUserId(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600,
                  color: '#1A202C', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer',
                }}
              >
                {user && <option value={user.id}>Me ({user.email})</option>}
                {members.filter(m => m.userId !== user?.id).map(m => (
                  <option key={m.userId} value={m.userId}>{m.fullName}</option>
                ))}
              </select>
            </div>
          )}
          {canEdit && profile?.role && !editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#1A202C', color: '#FFFFFF', border: 'none', borderRadius: 12,
                padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Pencil size={13} /> Edit Answers
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC', borderRadius: '50%', margin: '0 auto', animation: 'myplan-spin 0.7s linear infinite' }} />
          <style>{'@keyframes myplan-spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}

      {!loading && !profile?.role && (
        <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>
            {viewingSelf ? "You haven't completed onboarding yet." : `${viewedMember?.fullName || 'This learner'} hasn't completed onboarding yet.`}
          </p>
        </div>
      )}

      {!loading && canEdit && editing && editInitial && (
        <EditAnswersForm
          initial={editInitial}
          saving={regenerating}
          error={regenError}
          onCancel={() => { setEditing(false); setRegenError(null); }}
          onSave={handleSaveAndRegenerate}
        />
      )}

      {!loading && profile?.role && (
        <>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
            {([
              { key: 'raw' as const, label: 'Raw Scores', icon: BarChart3 },
              { key: 'tailored' as const, label: 'Tailored Learning Journey', icon: Sparkles },
            ]).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    background: active ? '#1A202C' : 'transparent',
                    color: active ? '#FFFFFF' : '#718096',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} color={active ? '#4FD1C5' : '#A0AEC0'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══════════ RAW SCORES TAB ═══════════ */}
          {activeTab === 'raw' && (
            <>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Target size={16} color="#38B2AC" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', margin: 0 }}>Onboarding Answers</h2>
                </div>
                <AnswerRow label="Role" value={profile.role} />
                <AnswerRow label="Function" value={profile.function === 'Other' ? profile.functionOther : profile.function} />
                <AnswerRow label="Seniority" value={profile.seniority} />
                <AnswerRow label="AI Experience" value={AI_EXPERIENCE_LABELS[profile.aiExperience] || profile.aiExperience} />
                <AnswerRow label="Ambition" value={ambitionList.map(a => AMBITION_LABELS[a] || a).join(', ')} />
                <AnswerRow label="Weekly Availability" value={AVAILABILITY_LABELS[profile.availability] || profile.availability} />
                <AnswerRow label="Biggest Challenge" value={profile.challenge} />
                <AnswerRow label="Current AI Experience" value={profile.experienceDescription} />
                <AnswerRow label="Goal" value={profile.goalDescription} />
              </div>

              {planResult && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <BarChart3 size={16} color="#38B2AC" />
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', margin: 0 }}>Level Depth Classification</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                    {[1, 2, 3, 4, 5].map(n => {
                      const meta = LEVEL_META.find(m => m.number === n)!;
                      const depth = planResult.level_depths?.[`L${n}`] || 'skip';
                      const included = depth === 'full' || depth === 'fast-track';
                      return (
                        <div key={n} style={{
                          flex: '1 1 140px', border: '1px solid #E2E8F0', borderRadius: 10,
                          padding: '10px 12px', opacity: included ? 1 : 0.55,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', marginBottom: 4 }}>L{n} — {meta.shortName}</div>
                          <div style={{
                            fontSize: 11, fontWeight: 700, display: 'inline-block',
                            color: depth === 'fast-track' ? '#D69E2E' : (included ? '#38B2AC' : '#A0AEC0'),
                            background: depth === 'fast-track' ? '#FEFCBF' : (included ? '#E6FFFA' : '#EDF2F7'),
                            borderRadius: 6, padding: '3px 8px',
                          }}>
                            {DEPTH_LABELS[depth]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════ TAILORED LEARNING JOURNEY TAB ═══════════ */}
          {activeTab === 'tailored' && (
            <>
              {!planResult && (
                <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>No learning plan has been generated yet.</p>
                </div>
              )}

              {planResult && (
                <>
                  {/* Why this plan */}
                  <div style={{
                    background: '#F0FFFC', border: '1px solid #B2F5EA', borderRadius: 12,
                    padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 10,
                  }}>
                    <Info size={15} color="#38B2AC" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2D9E99', marginBottom: 4 }}>Why This Plan</div>
                      <div style={{ fontSize: 13, color: '#2D7A75', lineHeight: 1.6 }}>{whyThisPlan}</div>
                    </div>
                  </div>

                  {/* Keywords pulled from their survey answers */}
                  {keywords.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <Tag size={13} color="#718096" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#718096' }}>
                          Keywords from their answers — highlighted below where they shaped a project
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                        {keywords.map(k => (
                          <span key={k} style={{
                            fontSize: 12, fontWeight: 600, color: '#2D9E99',
                            background: '#F0FFFC', border: '1px solid #B2F5EA',
                            borderRadius: 8, padding: '4px 10px',
                          }}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plan summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#718096' }}>
                      <Layers size={14} />
                      <span><strong style={{ color: '#1A202C' }}>{assignedLevels.length}</strong> of 5 levels assigned</span>
                    </div>
                  </div>

                  {/* Levels */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3, 4, 5].map(n => {
                      const meta = LEVEL_META.find(m => m.number === n)!;
                      const depth = planResult.level_depths?.[`L${n}`] || 'skip';
                      const levelPlan = planResult.plan.levels[`L${n}`];
                      const included = depth === 'full' || depth === 'fast-track';
                      const isExpanded = expandedLevel === n;

                      return (
                        <div key={n} style={{
                          borderRadius: 14,
                          background: included ? (isExpanded ? `${meta.accentColor}12` : '#FFFFFF') : '#F7FAFC',
                          border: `1.5px solid ${isExpanded ? meta.accentColor + '66' : '#E2E8F0'}`,
                          overflow: 'hidden',
                          opacity: included ? 1 : 0.65,
                          transition: 'all 0.2s',
                        }}>
                          <button
                            onClick={() => included && setExpandedLevel(isExpanded ? null : n)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                              padding: '14px 18px', background: 'none', border: 'none',
                              cursor: included ? 'pointer' : 'default', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
                            }}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: `${meta.accentColor}33`, border: `1.5px solid ${meta.accentColor}88`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, color: meta.accentDark,
                            }}>
                              {n}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{meta.name}</div>
                              {included && levelPlan?.projectTitle && (
                                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{levelPlan.projectTitle}</div>
                              )}
                            </div>
                            <div style={{
                              fontSize: 10, fontWeight: 700, color: depth === 'fast-track' ? '#D69E2E' : (included ? '#38B2AC' : '#A0AEC0'),
                              background: depth === 'fast-track' ? '#FEFCBF' : (included ? '#E6FFFA' : '#EDF2F7'),
                              borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                              textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                            }}>
                              {DEPTH_LABELS[depth]}
                            </div>
                            {included && (
                              <ChevronDown size={15} color="#A0AEC0" style={{
                                flexShrink: 0, transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              }} />
                            )}
                          </button>
                          {isExpanded && levelPlan && (
                            <div style={{ padding: '0 18px 18px 62px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }}>Project</div>
                                <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.6 }}>
                                  {highlightKeywords(levelPlan.projectDescription, keywords, meta.accentColor, meta.accentDark)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }}>Deliverable</div>
                                <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.6 }}>{levelPlan.deliverable}</div>
                              </div>
                              <div style={{ background: `${meta.accentColor}12`, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
                                <Sparkles size={13} color={meta.accentDark} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: meta.accentDark, marginBottom: 3 }}>Why this project for them</div>
                                  <div style={{ fontSize: 12.5, color: '#4A5568', lineHeight: 1.6 }}>
                                    {highlightKeywords(levelPlan.challengeConnection, keywords, meta.accentColor, meta.accentDark)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AppMyPlan;
