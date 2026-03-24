import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Play, Search, BookOpen, Youtube, Globe } from 'lucide-react';
import type { ArtefactContent } from '../../../../hooks/useArtefactsData';

const FONT = "'DM Sans', sans-serif";
const MONO = "'DM Mono', 'Courier New', monospace";

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};

const contentBox: React.CSSProperties = {
  background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
  padding: 16, fontSize: 13, color: '#1A202C', lineHeight: 1.7,
  fontFamily: FONT,
};

const promptBox: React.CSSProperties = {
  background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #38B2AC',
  borderRadius: '0 8px 8px 0', padding: '12px 16px', paddingRight: 44,
  fontSize: 13, fontFamily: MONO, fontStyle: 'italic',
  color: '#2D3748', lineHeight: 1.6, whiteSpace: 'pre-wrap',
  position: 'relative',
};

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{
        position: 'absolute', top: 8, right: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 11, color: copied ? '#38A169' : '#A0AEC0',
        display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px',
        fontFamily: FONT,
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: '#E6FFFA', border: '1px solid #B2DFDB', borderRadius: 16,
  padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#1A7A76', fontFamily: FONT,
};

interface Props {
  content: ArtefactContent;
  level: number;
}

/* ── Detect which sub-type was saved ── */
function getGuideType(content: ArtefactContent): 'youtube' | 'notebook' | 'perplexity' | 'pathway' {
  const r = content.result as Record<string, unknown> | undefined;
  if (!r) return 'pathway';
  if (Array.isArray(r.videos)) return 'youtube';
  if (r.studioConfig) return 'notebook';
  if (r.spaceConfig || r.focusModeConfig) return 'perplexity';
  if (r.steps || r.gapReflection) return 'pathway';
  return 'pathway';
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const PathwayContent: React.FC<Props> = ({ content, level }) => {
  const guideType = getGuideType(content);
  const inputs = content.inputs as Record<string, unknown> | undefined;
  const result = content.result as Record<string, unknown> | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Inputs summary */}
      {inputs && (
        <div>
          <div style={sectionLabel}>Inputs</div>
          <div style={{ ...contentBox, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inputs.objective && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Topic: </span>
                <span style={{ fontSize: 13, color: '#1A202C' }}>{inputs.objective as string}</span>
              </div>
            )}
            {inputs.gap && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Gap: </span>
                <span style={{ fontSize: 13, color: '#1A202C' }}>{inputs.gap as string}</span>
              </div>
            )}
            {Array.isArray(inputs.platforms) && (inputs.platforms as string[]).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {(inputs.platforms as string[]).map(p => (
                  <span key={p} style={chipStyle}>{p}</span>
                ))}
              </div>
            )}
            {Array.isArray(inputs.preferences) && (inputs.preferences as string[]).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {(inputs.preferences as string[]).map(p => (
                  <span key={p} style={{ ...chipStyle, background: '#F7FAFC', borderColor: '#E2E8F0', color: '#4A5568' }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guide type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {guideType === 'youtube' && <Youtube size={14} color="#FF0000" />}
        {guideType === 'notebook' && <BookOpen size={14} color="#5A67D8" />}
        {guideType === 'perplexity' && <Search size={14} color="#20B2AA" />}
        {guideType === 'pathway' && <Globe size={14} color="#38B2AC" />}
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {guideType === 'youtube' ? 'YouTube Guide' : guideType === 'notebook' ? 'NotebookLM Guide' : guideType === 'perplexity' ? 'Perplexity Guide' : 'Multi-Platform Pathway'}
        </span>
      </div>

      {/* Type-specific content */}
      {guideType === 'pathway' && result && <PathwayView result={result} />}
      {guideType === 'youtube' && result && <YouTubeView result={result} />}
      {guideType === 'notebook' && result && <NotebookView result={result} />}
      {guideType === 'perplexity' && result && <PerplexityView result={result} />}
    </div>
  );
};

/* ── Standard Pathway View ── */
const PathwayView: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const gapReflection = result.gapReflection as string | undefined;
  const approachSummary = result.approachSummary as string | undefined;
  const steps = result.steps as Array<Record<string, unknown>> | undefined;
  const markdown = result.markdown as string | undefined;

  // If we have the full markdown, show it
  if (markdown && (!steps || steps.length === 0)) {
    return (
      <div>
        <div style={sectionLabel}>Full Guide</div>
        <div style={{ ...contentBox, fontFamily: MONO, fontSize: 12, whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto' }}>
          {markdown}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {gapReflection && (
        <div>
          <div style={sectionLabel}>Gap Reflection</div>
          <div style={contentBox}>{gapReflection}</div>
        </div>
      )}
      {approachSummary && (
        <div>
          <div style={sectionLabel}>Approach</div>
          <div style={{ ...contentBox, fontStyle: 'italic', color: '#4A5568' }}>{approachSummary}</div>
        </div>
      )}
      {steps && steps.length > 0 && (
        <div>
          <div style={sectionLabel}>Steps ({steps.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#38B2AC', color: '#FFF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(step.stepNumber as number) || i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{step.platformName as string || step.platform as string}</span>
                  {step.feature && <span style={chipStyle}>{step.feature as string}</span>}
                  {step.timeEstimate && <span style={{ fontSize: 11, color: '#A0AEC0' }}>{step.timeEstimate as string}</span>}
                </div>
                {step.activity && <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: step.prompt ? 8 : 0 }}>{step.activity as string}</div>}
                {step.prompt && (
                  <div style={{ ...promptBox, marginTop: 6 }}>
                    <CopyBtn text={step.prompt as string} />
                    {step.prompt as string}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── YouTube View ── */
const YouTubeView: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const summary = result.summary as string | undefined;
  const videos = result.videos as Array<Record<string, unknown>> | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {summary && (
        <div>
          <div style={sectionLabel}>Summary</div>
          <div style={contentBox}>{summary}</div>
        </div>
      )}
      {videos && videos.length > 0 && (
        <div>
          <div style={sectionLabel}>Recommended Videos ({videos.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {videos.map((v, i) => (
              <div key={i} style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', gap: 12 }}>
                {/* Thumbnail */}
                <div style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1A202C', position: 'relative' }}>
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={20} color="#FFF" />
                    </div>
                  )}
                  {v.durationFormatted && (
                    <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#FFF', fontSize: 10, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>
                      {v.durationFormatted as string}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={v.url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {v.title as string}
                    <ExternalLink size={10} color="#A0AEC0" />
                  </a>
                  <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{v.channelName as string}</div>
                  {v.relevanceRationale && <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginTop: 4 }}>{v.relevanceRationale as string}</div>}
                  {v.watchingTips && <div style={{ fontSize: 12, color: '#38B2AC', fontStyle: 'italic', marginTop: 4 }}>{v.watchingTips as string}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── NotebookLM View ── */
const NotebookView: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const deepResearchPrompt = result.deepResearchPrompt as string | undefined;
  const sc = result.studioConfig as Record<string, unknown> | undefined;
  const settings = sc?.settings as Record<string, unknown> | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {deepResearchPrompt && (
        <div>
          <div style={sectionLabel}>Deep Research Prompt</div>
          <div style={{ ...promptBox }}>
            <CopyBtn text={deepResearchPrompt} />
            {deepResearchPrompt}
          </div>
        </div>
      )}
      {sc && (
        <div>
          <div style={sectionLabel}>Audio Overview Settings</div>
          <div style={{ ...contentBox, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sc.feature && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Feature: </span>
                <span style={chipStyle}>{sc.feature as string}</span>
              </div>
            )}
            {settings && Object.entries(settings).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>{k}: </span>
                <span style={{ fontSize: 13, color: '#1A202C' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {sc?.steeringPrompt && (
        <div>
          <div style={sectionLabel}>Steering Prompt</div>
          <div style={{ ...promptBox }}>
            <CopyBtn text={sc.steeringPrompt as string} />
            {sc.steeringPrompt as string}
          </div>
        </div>
      )}
      {sc?.featureInstructions && (
        <div>
          <div style={sectionLabel}>Instructions</div>
          <div style={contentBox}>{sc.featureInstructions as string}</div>
        </div>
      )}
    </div>
  );
};

/* ── Perplexity View ── */
const PerplexityView: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const deepResearchPrompt = result.deepResearchPrompt as string | undefined;
  const sc = result.spaceConfig as Record<string, unknown> | undefined;
  const fm = result.focusModeConfig as Record<string, unknown> | undefined;
  const followUpQueries = result.followUpQueries as string[] | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sc && (
        <div>
          <div style={sectionLabel}>Space Configuration</div>
          <div style={{ ...contentBox, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sc.spaceName && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Space Name: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{sc.spaceName as string}</span>
              </div>
            )}
            {sc.customInstructions && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Custom Instructions: </span>
                <span style={{ fontSize: 13, color: '#4A5568' }}>{sc.customInstructions as string}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {deepResearchPrompt && (
        <div>
          <div style={sectionLabel}>Deep Research Prompt</div>
          <div style={{ ...promptBox }}>
            <CopyBtn text={deepResearchPrompt} />
            {deepResearchPrompt}
          </div>
        </div>
      )}
      {fm && (
        <div>
          <div style={sectionLabel}>Focus Mode</div>
          <div style={{ ...contentBox, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fm.focusMode && <div><span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Mode: </span><span style={chipStyle}>{fm.focusMode as string}</span></div>}
            {fm.searchType && <div><span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Search Type: </span><span style={{ fontSize: 13, color: '#1A202C' }}>{fm.searchType as string}</span></div>}
            {fm.rationale && <div><span style={{ fontSize: 11, fontWeight: 700, color: '#718096' }}>Rationale: </span><span style={{ fontSize: 13, color: '#4A5568' }}>{fm.rationale as string}</span></div>}
          </div>
        </div>
      )}
      {followUpQueries && followUpQueries.length > 0 && (
        <div>
          <div style={sectionLabel}>Follow-up Queries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {followUpQueries.map((q, i) => (
              <div key={i} style={{ ...promptBox, position: 'relative' }}>
                <CopyBtn text={q} />
                {q}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PathwayContent;
