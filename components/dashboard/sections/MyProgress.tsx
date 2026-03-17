import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, User, BookOpen, ChevronDown, Target, FileText, Lightbulb, Users, Minus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  getProfile,
  getLatestLearningPlan,
  getLevelProgress,
  getSavedPrompts,
  upsertWorkshopAttended,
  validateWorkshopCode,
  getAllProjectSubmissions,
} from '../../../lib/database';
import type { LevelProgressRow, ProjectSubmission } from '../../../lib/database';
import {
  DEFAULT_PROFILE,
  LEVEL_ACCENTS,
  LEVEL_NAMES,
} from '../../../data/dashboard-content';
import type { UserProfile, SavedPrompt } from '../../../data/dashboard-types';
import type { PathwayApiResponse, PathwayLevelResult, LevelDepth } from '../../../types';

// ─── Types ───

type DisplayStatus = 'complete' | 'incomplete' | 'na';

// Workshop codes are now validated via Supabase workshop_sessions table.

// ─── Level config ───

const LEVEL_ROWS = [
  { level: 1, name: 'Level 1: AI Fundamentals' },
  { level: 2, name: 'Level 2: Applied Capability' },
  { level: 3, name: 'Level 3: Systemic Integration' },
  { level: 4, name: 'Level 4: Dashboards' },
  { level: 5, name: 'Level 5: AI Applications' },
];

// ─── Grid column widths (px) ───
// These ensure perfect vertical alignment across all 5 rows.
const COL_STATUS = 110; // each of the 3 status columns
const COL_PLAN = 130;   // Explore Plan button column

// ─── Utility ───

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Sub-components ───

const LevelPill: React.FC<{ level: number; accent: { light: string; dark: string } }> = ({ level, accent }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: 12,
      backgroundColor: accent.light,
      color: level === 5 ? '#FFFFFF' : '#1A202C',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}
  >
    L{level}
  </span>
);

const StatusDot: React.FC<{
  status: DisplayStatus;
  label: string;
}> = ({ status, label }) => {
  if (status === 'na') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#EDF2F7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Minus size={10} color="#A0AEC0" strokeWidth={3} />
        </div>
        <span style={{ fontSize: 11, color: '#CBD5E0', fontWeight: 400 }}>N/A</span>
      </div>
    );
  }

  const isComplete = status === 'complete';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: isComplete ? '#38B2AC' : 'transparent',
          border: isComplete ? 'none' : '2px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isComplete && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
      </div>
      <span
        style={{
          fontSize: 11,
          color: isComplete ? '#38B2AC' : '#A0AEC0',
          fontWeight: isComplete ? 500 : 400,
        }}
      >
        {isComplete ? 'Done' : label}
      </span>
    </div>
  );
};

// ─── Workshop Code Callout Panel ───
// Expands below the row inside the card — prominent with clear instructions.

const WorkshopCodeCallout: React.FC<{
  level: number;
  accent: { light: string; dark: string };
  onConfirm: (code: string) => void;
  onCancel: () => void;
}> = ({ level, accent, onConfirm, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    const isValid = await validateWorkshopCode(null, level, code.trim());
    if (isValid) {
      onConfirm(code.trim());
    } else {
      setError('Invalid code. Please check with your facilitator.');
    }
  };

  return (
    <div className="animate-dash-panel-slide-in" style={{ padding: '0 20px 16px' }}>
      <div
        style={{
          backgroundColor: hexToRgba(accent.light, 0.1),
          borderRadius: 10,
          padding: '16px 20px',
          border: `1.5px solid ${accent.light}`,
        }}
      >
        {/* Instructional header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <BookOpen size={18} color={accent.dark} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
              Attended the Level {level} workshop?
            </div>
            <p style={{ fontSize: 13, color: '#718096', margin: 0, lineHeight: 1.5 }}>
              Enter the session code you received after attending the workshop to mark it as complete.
            </p>
          </div>
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            placeholder="Enter session code"
            maxLength={10}
            className="dash-focus"
            autoFocus
            style={{
              padding: '8px 14px',
              border: `1.5px solid ${error ? '#FC8181' : accent.light}`,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 14,
              width: 180,
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          />
          <button
            onClick={handleConfirm}
            className="dash-focus"
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: accent.dark,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Verify Code
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#718096',
              fontSize: 13,
              cursor: 'pointer',
              padding: '8px 4px',
            }}
          >
            Cancel
          </button>
        </div>
        {error && (
          <span style={{ display: 'block', fontSize: 12, color: '#E53E3E', marginTop: 8 }}>{error}</span>
        )}
      </div>
    </div>
  );
};

// ─── Plan Detail Row ───

const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  text: string;
}> = ({ icon, label, text }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <span style={{ marginTop: 2, flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: '#4A5568', margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  </div>
);

// ─── Plan Details Expanded Section ───

const PlanDetails: React.FC<{
  result: PathwayLevelResult;
  level: number;
  accent: { light: string; dark: string };
}> = ({ result, level, accent }) => (
  <div className="animate-dash-plan-expand" style={{ padding: '0 20px 20px' }}>
    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 12,
            backgroundColor: accent.light,
            color: level === 5 ? '#FFFFFF' : '#1A202C',
            textTransform: 'uppercase',
          }}
        >
          {result.depth}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1A202C' }}>
          {result.projectTitle}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow icon={<Target size={14} color={accent.dark} />} label="Project" text={result.projectDescription} />

        {result.deliverable && (
          <DetailRow icon={<FileText size={14} color={accent.dark} />} label="Deliverable" text={result.deliverable} />
        )}

        {result.challengeConnection && (
          <DetailRow icon={<Lightbulb size={14} color={accent.dark} />} label="How This Connects To Your Challenge" text={result.challengeConnection} />
        )}

        {result.sessionFormat && (
          <DetailRow icon={<Users size={14} color={accent.dark} />} label="Workshop / Session Format" text={result.sessionFormat} />
        )}

        {result.resources && result.resources.length > 0 && (
          <div
            style={{
              backgroundColor: '#F7FAFC',
              borderRadius: 8,
              padding: '10px 14px',
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.resources.map((res, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{res.name}</span>
                  {res.note && <span style={{ fontSize: 12, color: '#718096' }}>{res.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── Empty Plan Placeholder ───
// Two modes: "not-assigned" (level was skipped) or "no-plan" (user hasn't generated any plan)

const EmptyPlanPlaceholder: React.FC<{ reason: 'not-assigned' | 'no-plan' }> = ({ reason }) => (
  <div style={{ padding: '0 20px 20px' }}>
    <div
      style={{
        borderTop: '1px solid #E2E8F0',
        paddingTop: 16,
        textAlign: 'center',
      }}
    >
      {reason === 'not-assigned' ? (
        <>
          <p style={{ fontSize: 13, color: '#A0AEC0', margin: '0 0 6px', lineHeight: 1.5 }}>
            This level is not currently assigned to your learning pathway.
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E0', margin: '0 0 10px', lineHeight: 1.5 }}>
            Based on your profile, this level was considered too advanced for now. You can revisit the Learning Plan Generator to update your pathway as you progress.
          </p>
          <a
            href="#learning-pathway"
            className="dash-focus"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: '#38B2AC',
              textDecoration: 'none',
            }}
          >
            Update My Learning Plan <ArrowRight size={12} />
          </a>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#A0AEC0', margin: '0 0 10px', lineHeight: 1.5 }}>
            No plan generated for this level yet.
          </p>
          <a
            href="#learning-pathway"
            className="dash-focus"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: '#38B2AC',
              textDecoration: 'none',
            }}
          >
            Go to Learning Plan Generator <ArrowRight size={12} />
          </a>
        </>
      )}
    </div>
  </div>
);

// ─── Helpers ───

function hasOutputSaved(level: number, prompts: SavedPrompt[]): DisplayStatus {
  if (level > 2) return 'na';
  return prompts.some((p) => p.level === level) ? 'complete' : 'incomplete';
}

// ─── Main Component ───

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
  onNavigateToProfile?: () => void;
}

export const MyProgress: React.FC<Props> = ({ showToast }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [savedPlan, setSavedPlan] = useState<PathwayApiResponse | null>(null);
  const [savedDepths, setSavedDepths] = useState<Record<string, LevelDepth> | null>(null);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgressRow[]>([]);
  const [projectSubs, setProjectSubs] = useState<ProjectSubmission[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState<Set<number>>(new Set());
  const [activeCodePanel, setActiveCodePanel] = useState<number | null>(null);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    setDataLoading(true);
    Promise.all([
      getProfile(userId),
      getLatestLearningPlan(userId),
      getLevelProgress(userId),
      getSavedPrompts(userId),
      getAllProjectSubmissions(userId),
    ]).then(([profileData, planData, progressData, promptsData, projectData]) => {
      if (profileData) setProfile(profileData);
      if (planData) {
        setSavedPlan(planData.plan);
        setSavedDepths(planData.level_depths);
      }
      setLevelProgress(progressData);
      setPrompts(promptsData);
      setProjectSubs(projectData);
      setDataLoading(false);
    });
  }, [userId]);

  // Build project submissions map
  const projectSubMap = new Map<number, ProjectSubmission>(projectSubs.map(s => [s.level, s]));

  // Compute dynamic progress rows
  const rows = LEVEL_ROWS.map((row) => {
    const progressRow = levelProgress.find((p) => p.level === row.level);
    const toolUsed: DisplayStatus = progressRow?.tool_used ? 'complete' : 'incomplete';
    const outputSaved: DisplayStatus = hasOutputSaved(row.level, prompts);
    const workshopAttended: DisplayStatus = progressRow?.workshop_attended ? 'complete' : 'incomplete';
    const ps = projectSubMap.get(row.level);
    const projectStatus: 'none' | 'draft' | 'submitted' | 'passed' | 'needs_revision' = ps ? ps.status : 'none';
    const projectComplete: DisplayStatus = progressRow?.project_completed ? 'complete' : 'incomplete';
    return { ...row, toolUsed, outputSaved, workshopAttended, projectStatus, projectComplete };
  });

  // Compute stats — 4 activities per level × 5 levels = 20
  const countComplete = (status: DisplayStatus) => status === 'complete' ? 1 : 0;
  const levelsStarted = rows.filter((r) =>
    r.toolUsed === 'complete' || r.outputSaved === 'complete' || r.workshopAttended === 'complete' || r.projectComplete === 'complete'
  ).length;
  const activitiesCompleted = rows.reduce((sum, r) => {
    return sum + countComplete(r.toolUsed) + countComplete(r.outputSaved) + countComplete(r.workshopAttended) + countComplete(r.projectComplete);
  }, 0);
  const totalActivities = 20;
  const overallProgress = Math.round((activitiesCompleted / totalActivities) * 100);

  const handleWorkshopConfirm = async (level: number, code: string) => {
    // Optimistic UI update
    setLevelProgress((prev) => {
      const existing = prev.find((p) => p.level === level);
      if (existing) {
        return prev.map((p) => p.level === level ? { ...p, workshop_attended: true, workshop_code_used: code } : p);
      }
      return [...prev, { user_id: userId, level, tool_used: false, tool_used_at: null, workshop_attended: true, workshop_attended_at: new Date().toISOString(), workshop_code_used: code }];
    });
    showToast('Workshop code verified!');
    // Write to Supabase
    await upsertWorkshopAttended(userId, level, code);
  };

  const togglePlanExpanded = (level: number) => {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const isProfileComplete = !!(
    profile.role && profile.function && profile.seniority && profile.aiExperience && profile.ambition
  );

  const stats = [
    { value: `${levelsStarted}`, label: 'Levels Started' },
    { value: `${activitiesCompleted} of ${totalActivities}`, label: 'Activities Completed' },
    { value: `${overallProgress}%`, label: 'Overall Progress' },
  ];

  // Empty state when profile is not complete
  if (!isProfileComplete) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { value: '0', label: 'Levels Started' },
            { value: `0 of ${totalActivities}`, label: 'Activities Completed' },
            { value: '0%', label: 'Overall Progress' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: '1 1 150px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: '#CBD5E0' }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: '#A0AEC0', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '48px 28px',
            textAlign: 'center',
          }}
        >
          <User size={48} color="#E2E8F0" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>
            Complete your profile to start tracking progress
          </div>
          <p style={{ fontSize: 14, color: '#718096', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Your progress across all five levels will appear here once you've completed your profile via the Learning Plan Generator.
          </p>
          <a
            href="#learning-pathway"
            className="dash-focus"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 24px',
              borderRadius: 24,
              border: 'none',
              backgroundColor: '#38B2AC',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C9A94'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#38B2AC'; }}
          >
            Go to Learning Plan Generator <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: '1 1 150px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1A202C' }}>{stat.value}</div>
            <div style={{ fontSize: 13, fontWeight: 400, color: '#718096', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Column headers — aligned to the fixed-width right columns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px 8px',
        }}
      >
        <div style={{ flex: 1 }} />
        <div style={{ width: COL_STATUS, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tool Used
        </div>
        <div style={{ width: COL_STATUS, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Output Saved
        </div>
        <div style={{ width: COL_STATUS, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Workshop
        </div>
        <div style={{ width: COL_STATUS, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Project
        </div>
        <div style={{ width: COL_PLAN }} />
      </div>

      {/* Level cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => {
          const accent = LEVEL_ACCENTS[row.level] || { light: '#E2E8F0', dark: '#718096' };
          const isPlanExpanded = expandedPlans.has(row.level);
          const planKey = `L${row.level}`;
          const planResult = savedPlan?.levels?.[planKey];
          const hasPlan = !!planResult;

          return (
            <div
              key={row.level}
              style={{
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${accent.dark}`,
                borderRadius: 12,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${hexToRgba(accent.light, 0.08)} 0%, #FFFFFF 100%)`,
              }}
            >
              {/* Row — fixed grid layout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                }}
              >
                {/* Left: Level pill + name (takes remaining space) */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <LevelPill level={row.level} accent={accent} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {LEVEL_NAMES[row.level] || row.name}
                  </span>
                </div>

                {/* Tool Used column */}
                <div style={{ width: COL_STATUS, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <StatusDot status={row.toolUsed} label="Not yet" />
                </div>

                {/* Output Saved column */}
                <div style={{ width: COL_STATUS, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <StatusDot status={row.outputSaved} label="Not yet" />
                </div>

                {/* Workshop column — complete tick OR clickable "Enter Code" */}
                <div style={{ width: COL_STATUS, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {row.workshopAttended === 'complete' ? (
                    <StatusDot status="complete" label="Done" />
                  ) : (
                    <button
                      onClick={() => setActiveCodePanel(activeCodePanel === row.level ? null : row.level)}
                      className="dash-focus"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: activeCodePanel === row.level ? `2px solid ${accent.dark}` : '2px solid #E2E8F0',
                          backgroundColor: 'transparent',
                          transition: 'border-color 150ms ease',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: activeCodePanel === row.level ? accent.dark : '#38B2AC',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Enter Code
                      </span>
                    </button>
                  )}
                </div>

                {/* Project column */}
                <div style={{ width: COL_STATUS, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {row.projectStatus === 'none' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={10} color="#A0AEC0" strokeWidth={3} />
                      </div>
                      <span
                        onClick={() => navigate(`/app/journey/project/${row.level}`)}
                        style={{ fontSize: 11, color: '#CBD5E0', fontWeight: 400, cursor: 'pointer' }}
                      >
                        —
                      </span>
                    </div>
                  ) : row.projectStatus === 'passed' ? (
                    <div
                      onClick={() => navigate(`/app/journey/project/${row.level}`)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#38B2AC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 11, color: '#38B2AC', fontWeight: 500 }}>Done</span>
                    </div>
                  ) : row.projectStatus === 'draft' ? (
                    <div
                      onClick={() => navigate(`/app/journey/project/${row.level}`)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B', marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: '#92400E', fontWeight: 500 }}>Draft</span>
                    </div>
                  ) : row.projectStatus === 'submitted' ? (
                    <div
                      onClick={() => navigate(`/app/journey/project/${row.level}`)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#38B2AC', marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: '#1A6B5F', fontWeight: 500 }}>Submitted</span>
                    </div>
                  ) : row.projectStatus === 'needs_revision' ? (
                    <div
                      onClick={() => navigate(`/app/journey/project/${row.level}`)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B', marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: '#9A3412', fontWeight: 500 }}>Revision</span>
                    </div>
                  ) : null}
                </div>

                {/* Explore Plan button */}
                <div style={{ width: COL_PLAN, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button
                    onClick={() => togglePlanExpanded(row.level)}
                    className="dash-focus"
                    aria-expanded={isPlanExpanded}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid #E2E8F0',
                      backgroundColor: isPlanExpanded ? hexToRgba(accent.light, 0.15) : '#FFFFFF',
                      color: '#4A5568',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Explore Plan
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isPlanExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 200ms ease',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Workshop code callout panel */}
              {activeCodePanel === row.level && row.workshopAttended !== 'complete' && (
                <WorkshopCodeCallout
                  level={row.level}
                  accent={accent}
                  onConfirm={(code) => {
                    handleWorkshopConfirm(row.level, code);
                    setActiveCodePanel(null);
                  }}
                  onCancel={() => setActiveCodePanel(null)}
                />
              )}

              {/* Expanded plan details */}
              {isPlanExpanded && (
                hasPlan && planResult ? (
                  <PlanDetails result={planResult} level={row.level} accent={accent} />
                ) : (
                  <EmptyPlanPlaceholder
                    reason={
                      savedPlan && savedDepths
                        ? (savedDepths[`L${row.level}`] === 'skip' || savedDepths[`L${row.level}`] === 'awareness')
                          ? 'not-assigned'
                          : 'no-plan'
                        : 'no-plan'
                    }
                  />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
