import React, { useState, useRef, useEffect } from 'react';
import { Star, Loader2, ChevronDown, Lightbulb, Info, AlertCircle, CheckCircle2, Shield, ArrowRight, Pencil } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getProfile, getInsights as dbGetInsights, saveInsight as dbSaveInsight, updateInsight as dbUpdateInsight } from '../../../lib/database';
import {
  TOPIC_OPTIONS_BY_LEVEL,
  LEVEL_PILL_STYLES,
  IMPACT_TOOLTIP_TEXT,
  DEFAULT_PROFILE,
  generateInsightFeedback,
  formatRelativeDate,
} from '../../../data/dashboard-content';
import type { InsightEntry, InsightAIFeedback, UserProfile } from '../../../data/dashboard-types';

// ─── Star Rating ───

const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
  readonly?: boolean;
  size?: number;
}> = ({ value, onChange, readonly, size = 20 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div
      style={{ display: 'inline-flex', gap: 2 }}
      role="group"
      aria-label="Impact rating"
      onKeyDown={(e) => {
        if (readonly) return;
        if (e.key === 'ArrowRight' && value < 5) onChange(value + 1);
        if (e.key === 'ArrowLeft' && value > 1) onChange(value - 1);
        if (e.key === 'Enter') onChange(hover || value);
      }}
      tabIndex={readonly ? -1 : 0}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={(readonly ? star <= value : star <= (hover || value)) ? '#38B2AC' : 'none'}
          color={(readonly ? star <= value : star <= (hover || value)) ? '#38B2AC' : '#E2E8F0'}
          style={{ cursor: readonly ? 'default' : 'pointer', transition: 'fill 100ms ease' }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => {
            if (readonly) return;
            onChange(star === value ? 0 : star);
          }}
        />
      ))}
    </div>
  );
};

// ─── Level Pill ───

const LevelPill: React.FC<{ level: number }> = ({ level }) => {
  const style = LEVEL_PILL_STYLES[level] || { bg: '#EDF2F7', text: '#4A5568' };
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      L{level}
    </span>
  );
};

// ─── Impact Info Tooltip ───

const ImpactInfoTooltip: React.FC = () => {
  const [visible, setVisible] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label="What does impact mean?"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          color: '#A0AEC0',
        }}
      >
        <Info size={14} />
      </button>
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            backgroundColor: '#1A202C',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            lineHeight: 1.5,
            width: 280,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          {IMPACT_TOOLTIP_TEXT}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1A202C',
            }}
          />
        </div>
      )}
    </span>
  );
};

// ─── Structured AI Feedback Card ───

const feedbackSectionStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 10,
};

const feedbackLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const StructuredFeedbackCard: React.FC<{ feedback: InsightAIFeedback }> = ({ feedback }) => {
  if (feedback.needsClarification) {
    return (
      <div style={{ ...feedbackSectionStyle, backgroundColor: '#FFFAF0', borderLeft: '3px solid #ED8936' }}>
        <div style={{ ...feedbackLabelStyle, color: '#ED8936' }}>
          <AlertCircle size={14} />
          More Detail Needed
        </div>
        <p style={{ fontSize: 14, color: '#1A202C', margin: 0, lineHeight: 1.7 }}>
          {feedback.clarificationMessage}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Use Case Summary */}
      <div style={{ ...feedbackSectionStyle, backgroundColor: '#E6FFFA', borderLeft: '3px solid #38B2AC' }}>
        <div style={{ ...feedbackLabelStyle, color: '#38B2AC' }}>
          <CheckCircle2 size={14} />
          Use Case Summary
        </div>
        <p style={{ fontSize: 14, color: '#1A202C', margin: 0, lineHeight: 1.7 }}>
          {feedback.useCaseSummary}
        </p>
      </div>

      {/* Next Level Translation */}
      {feedback.nextLevelTranslation && (
        <div style={{ ...feedbackSectionStyle, backgroundColor: '#EBF8FF', borderLeft: '3px solid #4299E1' }}>
          <div style={{ ...feedbackLabelStyle, color: '#4299E1' }}>
            <ArrowRight size={14} />
            How This Becomes the Next Level
          </div>
          <p style={{ fontSize: 14, color: '#1A202C', margin: 0, lineHeight: 1.7 }}>
            {feedback.nextLevelTranslation}
          </p>
        </div>
      )}

      {/* Considerations */}
      {feedback.considerations && feedback.considerations.length > 0 && (
        <div style={{ ...feedbackSectionStyle, backgroundColor: '#FFFAF0', borderLeft: '3px solid #ED8936' }}>
          <div style={{ ...feedbackLabelStyle, color: '#ED8936' }}>
            <Shield size={14} />
            Considerations
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#1A202C', lineHeight: 1.7 }}>
            {feedback.considerations.map((con, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{con}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {feedback.nextSteps && (
        <div style={{ ...feedbackSectionStyle, backgroundColor: '#FAF5FF', borderLeft: '3px solid #9F7AEA' }}>
          <div style={{ ...feedbackLabelStyle, color: '#9F7AEA' }}>
            Next Step
          </div>
          <p style={{ fontSize: 14, color: '#1A202C', margin: 0, lineHeight: 1.7 }}>
            {feedback.nextSteps}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Insight Card ───

const InsightCard: React.FC<{ entry: InsightEntry; onEdit: (entry: InsightEntry) => void }> = ({ entry, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const truncate = (text: string, max: number) =>
    text.length <= max ? text : text.slice(0, max) + '...';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: 20,
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7FAFC'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LevelPill level={entry.level} />
          <button
            onClick={() => onEdit(entry)}
            title="Edit & re-analyse"
            className="dash-focus"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#A0AEC0',
              transition: 'color 150ms ease',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#38B2AC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#A0AEC0'; }}
          >
            <Pencil size={14} />
          </button>
        </div>
        <span style={{ fontSize: 12, color: '#A0AEC0' }}>{formatRelativeDate(entry.createdAt)}</span>
      </div>

      {/* Topic */}
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1A202C', marginTop: 8 }}>
        {entry.topic}
      </div>

      {/* Context */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Context
        </span>
        <p style={{ fontSize: 14, color: '#4A5568', margin: '4px 0 0', lineHeight: 1.6 }}>
          {expanded ? entry.context : truncate(entry.context, 100)}
          {entry.context.length > 100 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{ background: 'none', border: 'none', color: '#38B2AC', fontSize: 13, cursor: 'pointer', marginLeft: 4, padding: 0 }}
            >
              Show more
            </button>
          )}
        </p>
      </div>

      {/* Outcome */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Outcome
        </span>
        <p style={{ fontSize: 14, color: '#4A5568', margin: '4px 0 0', lineHeight: 1.6 }}>
          {expanded ? entry.outcome : truncate(entry.outcome, 100)}
          {entry.outcome.length > 100 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{ background: 'none', border: 'none', color: '#38B2AC', fontSize: 13, cursor: 'pointer', marginLeft: 4, padding: 0 }}
            >
              Show more
            </button>
          )}
        </p>
      </div>

      {/* Stars */}
      <div style={{ marginTop: 10 }}>
        <StarRating value={entry.rating} onChange={() => {}} readonly size={16} />
      </div>

      {/* AI Insight toggle */}
      {(entry.aiFeedback || entry.aiFeedbackStructured) && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38B2AC',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
            }}
          >
            View AI Insight
            <ChevronDown
              size={14}
              style={{
                transform: showFeedback ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 200ms ease',
              }}
            />
          </button>
          {showFeedback && (
            <div className="animate-dash-feedback-appear" style={{ marginTop: 12 }}>
              {entry.aiFeedbackStructured ? (
                <StructuredFeedbackCard feedback={entry.aiFeedbackStructured} />
              ) : (
                <div
                  style={{
                    backgroundColor: '#E6FFFA',
                    borderLeft: '3px solid #38B2AC',
                    borderRadius: 6,
                    padding: '12px 16px',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#38B2AC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AI Insight
                  </span>
                  <p style={{ fontSize: 14, color: '#1A202C', margin: '6px 0 0', lineHeight: 1.7 }}>
                    {entry.aiFeedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───

export const ApplicationInsights: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [dataLoading, setDataLoading] = useState(true);
  const [formLevel, setFormLevel] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setDataLoading(true);
    Promise.all([
      dbGetInsights(userId),
      getProfile(userId),
    ]).then(([insightsData, profileData]) => {
      setInsights(insightsData);
      if (profileData) setProfile(profileData);
      setDataLoading(false);
    });
  }, [userId]);
  const [formTopic, setFormTopic] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<InsightAIFeedback | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const topicOptions = formLevel > 0 ? (TOPIC_OPTIONS_BY_LEVEL[formLevel] || []) : [];
  const canSubmit = formLevel > 0 && formTopic && formContext && formOutcome && formRating > 0;

  const handleEdit = (entry: InsightEntry) => {
    setFormLevel(entry.level);
    setFormTopic(entry.topic);
    setFormContext(entry.context);
    setFormOutcome(entry.outcome);
    setFormRating(entry.rating);
    setEditingId(entry.id);
    setLatestFeedback(null);
    setApiError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setLatestFeedback(null);
    setApiError(null);

    try {
      const response = await fetch('/api/analyze-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: formLevel,
          topic: formTopic,
          context: formContext,
          outcome: formOutcome,
          rating: formRating,
          userProfile: {
            role: profile.role,
            function: profile.function,
            seniority: profile.seniority,
            aiExperience: profile.aiExperience,
          },
        }),
      });

      let structuredFeedback: InsightAIFeedback | null = null;
      let feedbackSummary = '';

      if (response.ok) {
        structuredFeedback = await response.json();
        feedbackSummary = structuredFeedback?.useCaseSummary || '';
      } else {
        // Fallback to template-based feedback if API fails
        feedbackSummary = generateInsightFeedback({
          level: formLevel,
          topic: formTopic,
          context: formContext,
          outcome: formOutcome,
          rating: formRating,
        });
      }

      // If clarification is needed, show message but don't save or reset form
      if (structuredFeedback?.needsClarification) {
        setLatestFeedback(structuredFeedback);
        setLoading(false);
        return;
      }

      const newEntry: InsightEntry = {
        id: editingId || `insight-${Date.now()}`,
        level: formLevel,
        topic: formTopic,
        context: formContext,
        outcome: formOutcome,
        rating: formRating,
        aiFeedback: feedbackSummary,
        aiFeedbackStructured: structuredFeedback || undefined,
        createdAt: editingId ? (insights.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
      };

      if (editingId) {
        // Replace existing entry in place
        setInsights((prev) => prev.map((i) => i.id === editingId ? newEntry : i));
        dbUpdateInsight(editingId, userId, newEntry);
      } else {
        setInsights((prev) => [newEntry, ...prev]);
        dbSaveInsight(userId, newEntry);
      }
      if (structuredFeedback) {
        setLatestFeedback(structuredFeedback);
      }
      setLoading(false);

      // Reset form
      setFormLevel(0);
      setFormTopic('');
      setFormContext('');
      setFormOutcome('');
      setFormRating(0);
      setEditingId(null);
    } catch {
      // Fallback to template-based feedback on network error
      const fallbackFeedback = generateInsightFeedback({
        level: formLevel,
        topic: formTopic,
        context: formContext,
        outcome: formOutcome,
        rating: formRating,
      });

      const newEntry: InsightEntry = {
        id: `insight-${Date.now()}`,
        level: formLevel,
        topic: formTopic,
        context: formContext,
        outcome: formOutcome,
        rating: formRating,
        aiFeedback: fallbackFeedback,
        createdAt: Date.now(),
      };

      setInsights((prev) => [newEntry, ...prev]);
      dbSaveInsight(userId, newEntry);
      setApiError('AI analysis unavailable. Showing template-based feedback instead.');
      setLoading(false);

      setFormLevel(0);
      setFormTopic('');
      setFormContext('');
      setFormOutcome('');
      setFormRating(0);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #CBD5E0',
    borderRadius: 6,
    fontSize: 14,
    color: '#2D3748',
    background: '#FFFFFF',
    outline: 'none',
    appearance: 'auto',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #CBD5E0',
    borderRadius: 6,
    fontSize: 14,
    color: '#2D3748',
    background: '#FFFFFF',
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
  };

  return (
    <div>
      {/* Log entry form */}
      <div
        ref={formRef}
        style={{
          backgroundColor: '#FFFFFF',
          border: editingId ? '2px solid #38B2AC' : '1px solid #E2E8F0',
          borderRadius: 12,
          padding: 28,
          marginBottom: 24,
        }}
      >
        {editingId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#38B2AC' }}>
              Editing insight — update the fields below and re-submit
            </span>
            <button
              onClick={() => {
                setEditingId(null);
                setFormLevel(0);
                setFormTopic('');
                setFormContext('');
                setFormOutcome('');
                setFormRating(0);
                setLatestFeedback(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#718096',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Cancel edit
            </button>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Which Level?</label>
            <select
              value={formLevel}
              onChange={(e) => { setFormLevel(Number(e.target.value)); setFormTopic(''); }}
              style={selectStyle}
              className="dash-focus"
            >
              <option value={0}>Select level...</option>
              {[1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Which Topic?</label>
            <select
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              style={selectStyle}
              disabled={topicOptions.length === 0}
              className="dash-focus"
            >
              <option value="">Select topic...</option>
              {topicOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>What Was the Context?</label>
          <textarea
            value={formContext}
            onChange={(e) => setFormContext(e.target.value)}
            placeholder="Describe the situation or task where you applied this..."
            style={textareaStyle}
            className="dash-focus"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>What Was the Outcome?</label>
          <textarea
            value={formOutcome}
            onChange={(e) => setFormOutcome(e.target.value)}
            placeholder="What happened? Time saved, quality improved, new capability unlocked..."
            style={textareaStyle}
            className="dash-focus"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            How Impactful Was This?
            <ImpactInfoTooltip />
          </label>
          <StarRating value={formRating} onChange={setFormRating} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="dash-focus"
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 24,
            border: 'none',
            backgroundColor: canSubmit && !loading ? '#38B2AC' : '#CBD5E0',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 150ms ease',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-dash-spinner" />
              Analysing with AI...
            </>
          ) : editingId ? (
            'Re-analyse Insight'
          ) : (
            'Log Insight'
          )}
        </button>
      </div>

      {/* API error notice */}
      {apiError && (
        <div
          className="animate-dash-feedback-appear"
          style={{
            backgroundColor: '#FFFAF0',
            border: '1px solid #ED8936',
            borderRadius: 10,
            padding: '12px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} color="#ED8936" />
          <span style={{ fontSize: 13, color: '#744210' }}>{apiError}</span>
        </div>
      )}

      {/* AI Feedback card (after submission) */}
      {latestFeedback && (
        <div
          className="animate-dash-feedback-appear"
          style={{
            border: '1px solid #38B2AC',
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#38B2AC', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} />
            AI Analysis Complete
          </div>
          <StructuredFeedbackCard feedback={latestFeedback} />
        </div>
      )}

      {/* Log feed */}
      {insights.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '48px 28px',
            textAlign: 'center',
          }}
        >
          <Lightbulb size={48} color="#E2E8F0" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#718096', margin: 0, lineHeight: 1.6 }}>
            You haven't logged any insights yet. Start by completing an activity and reflecting on how you applied it.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {insights.map((entry) => (
            <InsightCard key={entry.id} entry={entry} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
};
