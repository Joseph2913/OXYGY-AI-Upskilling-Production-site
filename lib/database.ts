import { supabase } from './supabase';
import type { UserProfile, InsightEntry, SavedPrompt } from '../data/dashboard-types';
import type {
  PathwayApiResponse, LevelDepth,
  Organisation, OrgBranding, OrgMembership, Cohort, EnrollmentChannel, AuditLogEntry,
  OrgMemberRole,
} from '../types';

// ─── HELPER: camelCase ↔ snake_case for profiles ───

function profileToDb(profile: Partial<UserProfile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (profile.fullName !== undefined) row.full_name = profile.fullName;
  if (profile.role !== undefined) row.role = profile.role;
  if (profile.function !== undefined) row.function = profile.function;
  if (profile.functionOther !== undefined) row.function_other = profile.functionOther;
  if (profile.seniority !== undefined) row.seniority = profile.seniority;
  if (profile.aiExperience !== undefined) row.ai_experience = profile.aiExperience;
  if (profile.ambition !== undefined) row.ambition = profile.ambition;
  if (profile.challenge !== undefined) row.challenge = profile.challenge;
  if (profile.availability !== undefined) row.availability = profile.availability;
  if (profile.experienceDescription !== undefined) row.experience_description = profile.experienceDescription;
  if (profile.goalDescription !== undefined) row.goal_description = profile.goalDescription;
  return row;
}

function dbToProfile(row: Record<string, unknown>): UserProfile {
  return {
    fullName: (row.full_name as string) || '',
    role: (row.role as string) || '',
    function: (row.function as string) || '',
    functionOther: (row.function_other as string) || '',
    seniority: (row.seniority as string) || '',
    aiExperience: (row.ai_experience as string) || '',
    ambition: (row.ambition as string) || '',
    challenge: (row.challenge as string) || '',
    availability: (row.availability as string) || '',
    experienceDescription: (row.experience_description as string) || '',
    goalDescription: (row.goal_description as string) || '',
  };
}

// ─── PROFILES ───

export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { console.error('getProfile error:', error); return null; }
    return dbToProfile(data as Record<string, unknown>);
  } catch (err) { console.error('getProfile error:', err); return null; }
}

export async function upsertProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const row = profileToDb(profile);
    row.id = userId;
    row.updated_at = new Date().toISOString();
    const { data: result, error } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) { console.error('upsertProfile error:', error); return null; }
    return dbToProfile(result as Record<string, unknown>);
  } catch (err) { console.error('upsertProfile error:', err); return null; }
}

// ─── LEARNING PLANS ───

export async function getLatestLearningPlan(userId: string): Promise<{
  plan: PathwayApiResponse;
  level_depths: Record<string, LevelDepth>;
} | null> {
  try {
    const { data, error } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    if (error) { console.error('getLatestLearningPlan error:', error); return null; }
    return {
      plan: {
        pathwaySummary: (data.pathway_summary as string) || '',
        totalEstimatedWeeks: (data.total_estimated_weeks as number) || 0,
        levels: (data.levels_data as PathwayApiResponse['levels']) || {},
      },
      level_depths: (data.level_depths as Record<string, LevelDepth>) || {},
    };
  } catch (err) { console.error('getLatestLearningPlan error:', err); return null; }
}

export async function saveLearningPlan(
  userId: string,
  data: PathwayApiResponse,
  levelDepths: Record<string, LevelDepth>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('learning_plans')
      .insert({
        user_id: userId,
        pathway_summary: data.pathwaySummary,
        total_estimated_weeks: data.totalEstimatedWeeks,
        levels_data: data.levels,
        level_depths: levelDepths,
        generated_at: new Date().toISOString(),
      });
    if (error) { console.error('saveLearningPlan error:', error); return false; }
    return true;
  } catch (err) { console.error('saveLearningPlan error:', err); return false; }
}

// ─── LEVEL PROGRESS ───

export interface LevelProgressRow {
  user_id: string;
  level: number;
  tool_used: boolean;
  tool_used_at: string | null;
  workshop_attended: boolean;
  workshop_attended_at: string | null;
  workshop_code_used: string | null;
  project_completed?: boolean;
  project_completed_at?: string | null;
}

export async function getLevelProgress(userId: string): Promise<LevelProgressRow[]> {
  try {
    const { data, error } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) { console.error('getLevelProgress error:', error); return []; }
    return (data || []) as LevelProgressRow[];
  } catch (err) { console.error('getLevelProgress error:', err); return []; }
}

export async function upsertToolUsed(userId: string, level: number): Promise<boolean> {
  try {
    // Check if a row already exists for this (user_id, level)
    const { data: existing } = await supabase
      .from('level_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('level', level)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('level_progress')
        .update({ tool_used: true, tool_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) { console.error('upsertToolUsed update error:', error); return false; }
    } else {
      const { error } = await supabase
        .from('level_progress')
        .insert({
          user_id: userId,
          level,
          tool_used: true,
          tool_used_at: new Date().toISOString(),
        });
      if (error) { console.error('upsertToolUsed insert error:', error); return false; }
    }
    return true;
  } catch (err) { console.error('upsertToolUsed error:', err); return false; }
}

export async function upsertWorkshopAttended(
  userId: string,
  level: number,
  code: string,
): Promise<boolean> {
  try {
    // Check if a row already exists for this (user_id, level)
    const { data: existing } = await supabase
      .from('level_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('level', level)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('level_progress')
        .update({
          workshop_attended: true,
          workshop_attended_at: new Date().toISOString(),
          workshop_code_used: code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) { console.error('upsertWorkshopAttended update error:', error); return false; }
    } else {
      const { error } = await supabase
        .from('level_progress')
        .insert({
          user_id: userId,
          level,
          workshop_attended: true,
          workshop_attended_at: new Date().toISOString(),
          workshop_code_used: code,
        });
      if (error) { console.error('upsertWorkshopAttended insert error:', error); return false; }
    }
    return true;
  } catch (err) { console.error('upsertWorkshopAttended error:', err); return false; }
}

// ─── WORKSHOP CODE VALIDATION ───

export async function validateWorkshopCode(
  orgId: string | null,
  level: number,
  code: string,
): Promise<boolean> {
  try {
    let query = supabase
      .from('workshop_sessions')
      .select('id')
      .eq('level', level)
      .eq('code', code)
      .eq('active', true);
    if (orgId) query = query.eq('org_id', orgId);
    const { data, error } = await query;
    if (error) { console.error('validateWorkshopCode error:', error); return false; }
    return (data?.length ?? 0) > 0;
  } catch (err) { console.error('validateWorkshopCode error:', err); return false; }
}

// ─── SAVED PROMPTS ───

export async function getSavedPrompts(userId: string): Promise<SavedPrompt[]> {
  try {
    const { data, error } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    if (error) { console.error('getSavedPrompts error:', error); return []; }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      level: row.level as number,
      title: row.title as string,
      content: row.content as string,
      savedAt: new Date(row.saved_at as string).getTime(),
      sourceTool: row.source_tool as string | undefined,
    })) as SavedPrompt[];
  } catch (err) { console.error('getSavedPrompts error:', err); return []; }
}

export async function savePrompt(
  userId: string,
  prompt: { level: number; title: string; content: string; source_tool: string },
): Promise<SavedPrompt | null> {
  // Write to artefacts table instead of saved_prompts
  const artefact = await createArtefact(userId, {
    name: prompt.title,
    type: 'prompt',
    level: prompt.level,
    source_tool: prompt.source_tool,
    content: { promptText: prompt.content },
    preview: prompt.content.substring(0, 200),
  });
  if (!artefact) return null;
  return {
    id: artefact.id,
    level: artefact.level,
    title: artefact.name,
    content: prompt.content,
    savedAt: artefact.createdAt.getTime(),
  };
}

export async function deletePrompt(promptId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', userId);
    if (error) { console.error('deletePrompt error:', error); return false; }
    return true;
  } catch (err) { console.error('deletePrompt error:', err); return false; }
}

// ─── APPLICATION INSIGHTS ───

export async function getInsights(userId: string): Promise<InsightEntry[]> {
  try {
    const { data, error } = await supabase
      .from('application_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('getInsights error:', error); return []; }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      level: row.level as number,
      topic: row.topic as string,
      context: row.context as string,
      outcome: row.outcome as string,
      rating: row.rating as number,
      aiFeedback: row.ai_feedback as string,
      aiFeedbackStructured: row.ai_feedback_structured as InsightEntry['aiFeedbackStructured'],
      createdAt: new Date(row.created_at as string).getTime(),
    })) as InsightEntry[];
  } catch (err) { console.error('getInsights error:', err); return []; }
}

export async function saveInsight(userId: string, entry: InsightEntry): Promise<boolean> {
  try {
    // Let the DB auto-generate the UUID id
    const { error } = await supabase
      .from('application_insights')
      .insert({
        user_id: userId,
        level: entry.level,
        topic: entry.topic,
        context: entry.context,
        outcome: entry.outcome,
        rating: entry.rating,
        ai_feedback: entry.aiFeedback,
        ai_feedback_structured: entry.aiFeedbackStructured || null,
      });
    if (error) { console.error('saveInsight error:', error); return false; }
    return true;
  } catch (err) { console.error('saveInsight error:', err); return false; }
}

export async function updateInsight(
  insightId: string,
  userId: string,
  data: Partial<InsightEntry>,
): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = {};
    if (data.level !== undefined) updates.level = data.level;
    if (data.topic !== undefined) updates.topic = data.topic;
    if (data.context !== undefined) updates.context = data.context;
    if (data.outcome !== undefined) updates.outcome = data.outcome;
    if (data.rating !== undefined) updates.rating = data.rating;
    if (data.aiFeedback !== undefined) updates.ai_feedback = data.aiFeedback;
    if (data.aiFeedbackStructured !== undefined) updates.ai_feedback_structured = data.aiFeedbackStructured;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('application_insights')
      .update(updates)
      .eq('id', insightId)
      .eq('user_id', userId);
    if (error) { console.error('updateInsight error:', error); return false; }
    return true;
  } catch (err) { console.error('updateInsight error:', err); return false; }
}

// ─── UI PREFERENCES ───

export interface UiPreferences {
  profile_nudge_dismissed: boolean;
  onboarding_completed?: boolean;
  last_active_dashboard_section?: string;
}

export async function getUiPreferences(userId: string): Promise<UiPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('ui_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) { console.error('getUiPreferences error:', error); return null; }
    return data as UiPreferences;
  } catch (err) { console.error('getUiPreferences error:', err); return null; }
}

export async function upsertUiPreferences(
  userId: string,
  data: Partial<UiPreferences>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ui_preferences')
      .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { console.error('upsertUiPreferences error:', error); return false; }
    return true;
  } catch (err) { console.error('upsertUiPreferences error:', err); return false; }
}

// ─── LEARNER COACH PROFILES ───

export interface LearnerCoachProfile {
  id: string;
  userId: string;
  preferences: string[];
  platforms: string[];
  additionalContext: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLearnerCoachProfile(userId: string): Promise<LearnerCoachProfile | null> {
  try {
    const { data, error } = await supabase
      .from('learner_coach_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      preferences: data.preferences || [],
      platforms: data.platforms || [],
      additionalContext: data.additional_context || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) { console.error('getLearnerCoachProfile error:', err); return null; }
}

export async function upsertLearnerCoachProfile(
  userId: string,
  profile: { preferences: string[]; platforms: string[]; additionalContext: string }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('learner_coach_profiles')
      .upsert({
        user_id: userId,
        preferences: profile.preferences,
        platforms: profile.platforms,
        additional_context: profile.additionalContext,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) { console.error('upsertLearnerCoachProfile error:', error); return false; }
    return true;
  } catch (err) { console.error('upsertLearnerCoachProfile error:', err); return false; }
}

// ─── ARTEFACTS ───

export type ArtefactType =
  | 'prompt' | 'agent' | 'workflow' | 'dashboard' | 'app_spec'
  | 'build_guide' | 'prd' | 'pathway' | 'project_proof';

export interface Artefact {
  id: string;
  name: string;
  type: ArtefactType;
  level: number;
  sourceTool?: string;
  preview?: string;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date | null;
}

export type ArtefactContent = Record<string, unknown>;

export async function getArtefacts(userId: string): Promise<Artefact[]> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('id, name, type, level, source_tool, preview, created_at, updated_at, last_opened_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (error) { console.error('getArtefacts error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as ArtefactType,
    level: row.level as number,
    sourceTool: row.source_tool as string | undefined,
    preview: row.preview as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    lastOpenedAt: row.last_opened_at ? new Date(row.last_opened_at as string) : null,
  }));
}

export async function getArtefactContent(id: string, userId: string): Promise<ArtefactContent | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('content')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) { console.error('getArtefactContent error:', error); return null; }
  // Also update last_opened_at
  await supabase.from('artefacts').update({ last_opened_at: new Date().toISOString() }).eq('id', id);
  return data.content as ArtefactContent;
}

export async function createArtefact(
  userId: string,
  artefact: {
    name: string;
    type: ArtefactType;
    level: number;
    source_tool: string;
    content: ArtefactContent;
    preview?: string;
  },
): Promise<Artefact | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: artefact.name,
      type: artefact.type,
      level: artefact.level,
      source_tool: artefact.source_tool,
      content: artefact.content,
      preview: artefact.preview || null,
    })
    .select()
    .single();
  if (error) { console.error('createArtefact error:', error); return null; }
  return {
    id: data.id,
    name: data.name,
    type: data.type as ArtefactType,
    level: data.level,
    sourceTool: data.source_tool,
    preview: data.preview,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    lastOpenedAt: null,
  };
}

/**
 * Standard save function for all toolkit tools.
 * Writes structured JSONB content directly to the artefacts table.
 */
export async function createArtefactFromTool(
  userId: string,
  artefact: {
    name: string;
    type: ArtefactType;
    level: number;
    sourceTool: string;
    content: Record<string, unknown>;
    preview: string;
  },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: artefact.name,
      type: artefact.type,
      level: artefact.level,
      source_tool: artefact.sourceTool,
      content: artefact.content,
      preview: artefact.preview.slice(0, 200),
    })
    .select('id')
    .single();
  if (error) { console.error('createArtefactFromTool error:', error); return null; }
  return { id: data.id };
}

export async function renameArtefact(id: string, userId: string, newName: string): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

export async function archiveArtefact(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

export async function duplicateArtefact(id: string, userId: string): Promise<Artefact | null> {
  // Fetch original
  const { data: original, error: fetchErr } = await supabase
    .from('artefacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (fetchErr || !original) return null;

  // Insert copy
  const { data: copy, error: insertErr } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: `${original.name} (copy)`,
      type: original.type,
      level: original.level,
      source_tool: original.source_tool,
      content: original.content,
      preview: original.preview,
    })
    .select()
    .single();
  if (insertErr || !copy) return null;
  return {
    id: copy.id,
    name: copy.name,
    type: copy.type as ArtefactType,
    level: copy.level,
    sourceTool: copy.source_tool,
    preview: copy.preview,
    createdAt: new Date(copy.created_at),
    updatedAt: new Date(copy.updated_at),
    lastOpenedAt: null,
  };
}

export async function updateArtefactContent(
  id: string, userId: string, content: ArtefactContent,
): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

// ─── TOPIC PROGRESS ───

export interface TopicProgressRow {
  user_id: string;
  level: number;
  topic_id: number;
  current_phase: number;
  current_slide: number;
  elearn_completed_at: string | null;
  read_completed_at: string | null;
  watch_completed_at: string | null;
  practise_completed_at: string | null;
  completed_at: string | null;
  visited_slides: number[];
  practise_score: number | null;
}

export async function getTopicProgress(
  userId: string,
  level: number,
): Promise<TopicProgressRow[]> {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level);
  if (error) { console.error('getTopicProgress error:', error); return []; }
  return (data || []) as TopicProgressRow[];
}

export async function getAllTopicProgress(
  userId: string,
): Promise<TopicProgressRow[]> {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('getAllTopicProgress error:', error); return []; }
  return (data || []) as TopicProgressRow[];
}

export async function upsertTopicProgress(
  userId: string,
  level: number,
  topicId: number,
  updates: Partial<{
    current_phase: number;
    current_slide: number;
    elearn_completed_at: string;
    read_completed_at: string;
    watch_completed_at: string;
    practise_completed_at: string;
    completed_at: string;
    visited_slides: number[];
  }>,
): Promise<boolean> {
  const row = {
    user_id: userId,
    level,
    topic_id: topicId,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('topic_progress')
    .upsert(row, { onConflict: 'user_id,level,topic_id' });
  if (error) { console.error('upsertTopicProgress error:', error); return false; }
  return true;
}

export async function updateSlidePosition(
  userId: string,
  level: number,
  topicId: number,
  slide: number,
  visitedSlides: number[],
): Promise<boolean> {
  return upsertTopicProgress(userId, level, topicId, {
    current_slide: slide,
    visited_slides: visitedSlides,
  });
}

export async function completePhaseDb(
  userId: string,
  level: number,
  topicId: number,
  phaseNumber: number,
): Promise<boolean> {
  const phaseColumns: Record<number, string> = {
    1: 'elearn_completed_at',
    2: 'read_completed_at',
    3: 'watch_completed_at',
    4: 'practise_completed_at',
  };
  const column = phaseColumns[phaseNumber];
  if (!column) return false;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    [column]: now,
    current_phase: Math.min(phaseNumber + 1, 4),
    current_slide: 0,
    updated_at: now,
  };

  if (phaseNumber === 4) {
    updates.completed_at = now;
  }

  return upsertTopicProgress(userId, level, topicId, updates);
}

export async function completeTopicDb(
  userId: string,
  level: number,
  topicId: number,
): Promise<boolean> {
  const now = new Date().toISOString();
  return upsertTopicProgress(userId, level, topicId, {
    completed_at: now,
    practise_completed_at: now,
  });
}

export async function savePractiseScore(
  userId: string,
  level: number,
  topicId: number,
  score: number,
): Promise<boolean> {
  return upsertTopicProgress(userId, level, topicId, {
    practise_score: score,
  } as any);
}

// ─── ACTIVITY LOG ───

export async function logActivity(
  userId: string,
  action: string,
  level?: number,
  topicId?: number,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      action,
      level: level ?? null,
      topic_id: topicId ?? null,
      metadata: metadata ?? {},
    });
  if (error) console.error('logActivity error:', error);
}

// ─── DASHBOARD QUERIES ───

export async function getArtefactCountsByLevel(
  userId: string,
): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('level')
    .eq('user_id', userId)
    .is('archived_at', null);
  if (error) { console.error('getArtefactCountsByLevel error:', error); return {}; }
  const counts: Record<number, number> = {};
  (data || []).forEach((row: { level: number }) => {
    counts[row.level] = (counts[row.level] || 0) + 1;
  });
  return counts;
}

export async function getFullProfile(userId: string): Promise<{
  fullName: string;
  role: string;
  function: string;
  functionOther: string;
  seniority: string;
  aiExperience: string;
  ambition: string;
  challenge: string;
  availability: string;
  experienceDescription: string;
  goalDescription: string;
  onboardingCompleted: boolean;
  currentLevel: number;
  streakDays: number;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('getFullProfile error:', error); return null; }
  return {
    fullName: data.full_name || '',
    role: data.role || '',
    function: data.function || '',
    functionOther: data.function_other || '',
    seniority: data.seniority || '',
    aiExperience: data.ai_experience || '',
    ambition: data.ambition || '',
    challenge: data.challenge || '',
    availability: data.availability || '',
    experienceDescription: data.experience_description || '',
    goalDescription: data.goal_description || '',
    onboardingCompleted: data.onboarding_completed ?? false,
    currentLevel: data.current_level ?? 1,
    streakDays: data.streak_days ?? 0,
  };
}

export async function updateCurrentLevel(
  userId: string,
  level: number,
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ current_level: level, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return !error;
}

// ─── ORG FUNCTIONS (Phase 4) ───

export interface ScoredMember {
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  role: string;
  level: number;
  score: number;
  completionPct: number;
  streakDays: number;
  artefactCount: number;
  insightCount: number;
  activeDays30: number;
  isCurrentUser: boolean;
}

const LEADERBOARD_PALETTE = [
  '#A8F0E0', '#C3D0F5', '#F5B8A0', '#F7E8A4', '#38B2AC',
  '#E9D5FF', '#FED7AA', '#FECACA', '#D1FAE5', '#E0E7FF',
];

export async function getOrgLeaderboard(
  orgId: string,
  currentUserId: string,
): Promise<ScoredMember[]> {
  // 1. Get all active members
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id, role')
    .eq('org_id', orgId)
    .eq('active', true);

  if (!members || members.length === 0) return [];

  const userIds = members.map(m => m.user_id);

  // 2. Batch fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, current_level, streak_days')
    .in('id', userIds);

  // 3. Batch fetch phase completions
  const { data: topicRows } = await supabase
    .from('topic_progress')
    .select('user_id, elearn_completed_at, read_completed_at, watch_completed_at, practise_completed_at')
    .in('user_id', userIds);

  // 4. Batch fetch artefact counts
  const { data: artefactRows } = await supabase
    .from('artefacts')
    .select('user_id')
    .in('user_id', userIds)
    .is('archived_at', null);

  // 5. Batch fetch insight counts
  const { data: insightRows } = await supabase
    .from('application_insights')
    .select('user_id')
    .in('user_id', userIds);

  // 6. Batch fetch activity counts (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: activityRows } = await supabase
    .from('activity_log')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .gte('created_at', thirtyDaysAgo);

  // 7. Compute scores
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const memberRoleMap = new Map(members.map(m => [m.user_id, m.role]));

  // Phase completions per user
  const phaseCountMap = new Map<string, number>();
  (topicRows || []).forEach((row: Record<string, unknown>) => {
    const uid = row.user_id as string;
    const count = phaseCountMap.get(uid) || 0;
    let phases = 0;
    if (row.elearn_completed_at) phases++;
    if (row.read_completed_at) phases++;
    if (row.watch_completed_at) phases++;
    if (row.practise_completed_at) phases++;
    phaseCountMap.set(uid, count + phases);
  });

  // Artefact counts per user
  const artefactCountMap = new Map<string, number>();
  (artefactRows || []).forEach((row: Record<string, unknown>) => {
    const uid = row.user_id as string;
    artefactCountMap.set(uid, (artefactCountMap.get(uid) || 0) + 1);
  });

  // Insight counts per user
  const insightCountMap = new Map<string, number>();
  (insightRows || []).forEach((row: Record<string, unknown>) => {
    const uid = row.user_id as string;
    insightCountMap.set(uid, (insightCountMap.get(uid) || 0) + 1);
  });

  // Active days per user (distinct calendar days in last 30 days)
  const userDaySets = new Map<string, Set<string>>();
  (activityRows || []).forEach((row: Record<string, unknown>) => {
    const uid = row.user_id as string;
    const day = (row.created_at as string).split('T')[0];
    if (!userDaySets.has(uid)) userDaySets.set(uid, new Set());
    userDaySets.get(uid)!.add(day);
  });
  const activeDaysMap = new Map<string, number>();
  userDaySets.forEach((days, userId) => activeDaysMap.set(userId, days.size));

  const scored: ScoredMember[] = userIds.map((userId, idx) => {
    const profile = profileMap.get(userId);
    const phasesCompleted = phaseCountMap.get(userId) || 0;
    const artefactCount = Math.min(artefactCountMap.get(userId) || 0, 20);
    const insightCount = Math.min(insightCountMap.get(userId) || 0, 10);
    const streakDays = Math.min(profile?.streak_days || 0, 14);
    const activeDays30 = Math.min(activeDaysMap.get(userId) || 0, 30);

    const score =
      (phasesCompleted * 4) +
      (artefactCount * 25) +
      (insightCount * 30) +
      (streakDays * 5) +
      (activeDays30 * 2);

    const totalPhases = 20; // 5 levels × 4 phases
    const completionPct = Math.round((phasesCompleted / totalPhases) * 100);

    const fullName = profile?.full_name || 'Unknown';
    const initials = fullName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U';

    return {
      userId,
      fullName,
      initials,
      avatarColor: LEADERBOARD_PALETTE[idx % LEADERBOARD_PALETTE.length],
      role: memberRoleMap.get(userId) || 'learner',
      level: profile?.current_level || 1,
      score,
      completionPct,
      streakDays: profile?.streak_days || 0,
      artefactCount: artefactCountMap.get(userId) || 0,
      insightCount: insightCountMap.get(userId) || 0,
      activeDays30: activeDaysMap.get(userId) || 0,
      isCurrentUser: userId === currentUserId,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ─── STREAK CALCULATION ───

export async function calculateStreak(userId: string): Promise<number> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sixtyDaysAgo)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return 0;

  const days = new Set<string>();
  data.forEach((row: { created_at: string }) => {
    days.add(row.created_at.split('T')[0]);
  });

  const sortedDays = Array.from(days).sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!days.has(today) && !days.has(yesterday)) return 0;

  let streak = 0;
  let checkDate = new Date(sortedDays[0]);

  for (const day of sortedDays) {
    const expected = checkDate.toISOString().split('T')[0];
    if (day === expected) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

export async function updateStreak(userId: string): Promise<number> {
  const streak = await calculateStreak(userId);
  await supabase
    .from('profiles')
    .update({ streak_days: streak, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return streak;
}

export async function getActiveDaysThisWeek(userId: string): Promise<boolean[]> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', monday.toISOString());

  const activeDays = Array(7).fill(false) as boolean[];
  (data || []).forEach((row: { created_at: string }) => {
    const d = new Date(row.created_at);
    const dow = d.getDay();
    const monBased = dow === 0 ? 6 : dow - 1;
    activeDays[monBased] = true;
  });

  return activeDays;
}

// ─── ORG INVITE FUNCTIONS ───

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function validateAndAcceptInvite(
  userId: string,
  code: string,
): Promise<{ success: boolean; orgName?: string; memberCount?: number; error?: string }> {
  const { data: invite, error: findErr } = await supabase
    .from('org_invites')
    .select('id, org_id, role, email, accepted_by, expires_at')
    .eq('invite_code', code)
    .maybeSingle();

  if (findErr || !invite) return { success: false, error: 'Invalid invite code' };
  if (invite.accepted_by && invite.email) return { success: false, error: 'This invite has already been used' };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { success: false, error: 'This invite has expired' };

  // Check user isn't already in an org
  const { data: existing } = await supabase
    .from('user_org_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (existing) return { success: false, error: 'You are already a member of an organisation' };

  // Create membership
  const { error: memberErr } = await supabase
    .from('user_org_memberships')
    .insert({
      user_id: userId,
      org_id: invite.org_id,
      role: invite.role,
    });
  if (memberErr) return { success: false, error: 'Failed to join organisation' };

  // Update profile with org_id
  await supabase
    .from('profiles')
    .update({ org_id: invite.org_id })
    .eq('id', userId);

  // Mark invite as accepted (for email-specific invites)
  if (invite.email) {
    await supabase
      .from('org_invites')
      .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  // Get org info for confirmation
  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', invite.org_id)
    .single();

  const { count } = await supabase
    .from('user_org_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', invite.org_id)
    .eq('active', true);

  return {
    success: true,
    orgName: org?.name || 'Your organisation',
    memberCount: count || 1,
  };
}

export async function createInvite(
  orgId: string,
  createdBy: string,
  email?: string,
  role: string = 'learner',
): Promise<{ code: string } | null> {
  const code = generateInviteCode();
  const { error } = await supabase
    .from('org_invites')
    .insert({
      org_id: orgId,
      email: email || null,
      invite_code: code,
      role,
      created_by: createdBy,
    });
  if (error) return null;
  return { code };
}

export async function getOrgInvites(orgId: string): Promise<Array<{
  id: string; email: string | null; code: string; role: string;
  acceptedBy: string | null; createdAt: Date;
}>> {
  const { data } = await supabase
    .from('org_invites')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    email: row.email as string | null,
    code: row.invite_code as string,
    role: row.role as string,
    acceptedBy: row.accepted_by as string | null,
    createdAt: new Date(row.created_at as string),
  }));
}

export async function deleteInvite(inviteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('org_invites')
    .delete()
    .eq('id', inviteId);
  return !error;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ role: newRole })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  return !error;
}

export async function removeMember(
  orgId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ active: false })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (!error) {
    await supabase.from('profiles').update({ org_id: null }).eq('id', userId);
  }
  return !error;
}

export async function createWorkshopSession(
  orgId: string,
  createdBy: string,
  level: number,
  name: string,
  code: string,
  date?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('workshop_sessions')
    .insert({
      org_id: orgId,
      level,
      code,
      session_name: name,
      session_date: date || null,
      created_by: createdBy,
    });
  return !error;
}

export async function updateOrgName(
  orgId: string,
  name: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('organisations')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', orgId);
  return !error;
}

export async function getOrgWorkshopSessions(orgId: string): Promise<Array<{
  id: string; level: number; code: string; name: string; date: string | null; active: boolean;
}>> {
  const { data } = await supabase
    .from('workshop_sessions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    level: row.level as number,
    code: row.code as string,
    name: (row.session_name as string) || '',
    date: row.session_date as string | null,
    active: row.active as boolean,
  }));
}

export async function deactivateWorkshopSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workshop_sessions')
    .update({ active: false })
    .eq('id', sessionId);
  return !error;
}

// ─── ORGANISATION QUERIES (PRD-10) ───

function dbToOrganisation(row: Record<string, unknown>): Organisation {
  return {
    id: row.id as string,
    name: row.name as string,
    domain: (row.domain as string) || null,
    tier: (row.tier as Organisation['tier']) || null,
    active: row.active as boolean,
    levelAccess: Array.isArray(row.level_access) ? row.level_access as number[] : [1, 2, 3, 4, 5],
    branding: (row.branding as OrgBranding) || {},
    maxUsers: (row.max_users as number) || null,
    contactEmail: (row.contact_email as string) || null,
    contactName: (row.contact_name as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getOrganisation(orgId: string): Promise<Organisation | null> {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .single();
  if (error) { console.error('getOrganisation error:', error); return null; }
  return dbToOrganisation(data as Record<string, unknown>);
}

export async function listOrganisations(): Promise<Organisation[]> {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .order('name');
  if (error) { console.error('listOrganisations error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => dbToOrganisation(row));
}

export async function createOrganisation(input: {
  name: string;
  domain?: string;
  tier?: string;
  levelAccess?: number[];
  maxUsers?: number;
  contactEmail?: string;
  contactName?: string;
}, actorId: string): Promise<Organisation | null> {
  const { data, error } = await supabase
    .from('organisations')
    .insert({
      name: input.name,
      domain: input.domain || null,
      tier: input.tier || null,
      level_access: input.levelAccess || [1, 2, 3, 4, 5],
      max_users: input.maxUsers || null,
      contact_email: input.contactEmail || null,
      contact_name: input.contactName || null,
    })
    .select()
    .single();
  if (error) { console.error('createOrganisation error:', error); return null; }

  const org = dbToOrganisation(data as Record<string, unknown>);
  await writeAuditLog({
    actorId,
    action: 'org.create',
    targetType: 'organisation',
    targetId: org.id,
    metadata: { org_name: org.name, tier: org.tier },
  });
  return org;
}

export async function updateOrganisation(orgId: string, updates: {
  name?: string;
  domain?: string | null;
  tier?: string | null;
  levelAccess?: number[];
  branding?: OrgBranding;
  maxUsers?: number | null;
  contactEmail?: string | null;
  contactName?: string | null;
}, actorId: string): Promise<boolean> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.domain !== undefined) row.domain = updates.domain;
  if (updates.tier !== undefined) row.tier = updates.tier;
  if (updates.levelAccess !== undefined) row.level_access = updates.levelAccess;
  if (updates.branding !== undefined) row.branding = updates.branding;
  if (updates.maxUsers !== undefined) row.max_users = updates.maxUsers;
  if (updates.contactEmail !== undefined) row.contact_email = updates.contactEmail;
  if (updates.contactName !== undefined) row.contact_name = updates.contactName;

  const { error } = await supabase
    .from('organisations')
    .update(row)
    .eq('id', orgId);
  if (error) { console.error('updateOrganisation error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'org.update',
    targetType: 'organisation',
    targetId: orgId,
    orgId,
    metadata: updates,
  });
  return true;
}

// ─── MEMBERSHIP QUERIES (PRD-10) ───

export async function getUserMemberships(userId: string): Promise<OrgMembership[]> {
  const { data, error } = await supabase
    .from('user_org_memberships')
    .select('id, user_id, org_id, role, cohort_id, enrolled_via, enrolled_at, active, organisations(name)')
    .eq('user_id', userId)
    .eq('active', true);
  if (error) { console.error('getUserMemberships error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    orgId: row.org_id as string,
    orgName: ((row.organisations as Record<string, unknown>)?.name as string) || '',
    role: row.role as OrgMemberRole,
    cohortId: (row.cohort_id as string) || null,
    enrolledVia: (row.enrolled_via as string) || null,
    enrolledAt: row.enrolled_at as string,
    active: row.active as boolean,
  }));
}

export async function createMembership(input: {
  userId: string;
  orgId: string;
  role: OrgMemberRole;
  cohortId?: string;
  enrolledVia?: string;
}, actorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .insert({
      user_id: input.userId,
      org_id: input.orgId,
      role: input.role,
      cohort_id: input.cohortId || null,
      enrolled_via: input.enrolledVia || null,
    });
  if (error) { console.error('createMembership error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'user.enroll',
    targetType: 'user',
    targetId: input.userId,
    orgId: input.orgId,
    metadata: { role: input.role, cohort_id: input.cohortId },
  });
  return true;
}

export async function deactivateMembership(membershipId: string, actorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ active: false })
    .eq('id', membershipId);
  if (error) { console.error('deactivateMembership error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'user.deactivate',
    targetType: 'membership',
    targetId: membershipId,
  });
  return true;
}

// ─── COHORT QUERIES (PRD-10) ───

function dbToCohort(row: Record<string, unknown>): Cohort {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    description: (row.description as string) || null,
    startDate: (row.start_date as string) || null,
    endDate: (row.end_date as string) || null,
    active: row.active as boolean,
    createdBy: (row.created_by as string) || null,
    createdAt: row.created_at as string,
  };
}

export async function listCohorts(orgId: string): Promise<Cohort[]> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) { console.error('listCohorts error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => dbToCohort(row));
}

export async function createCohort(input: {
  orgId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}, actorId: string): Promise<Cohort | null> {
  const { data, error } = await supabase
    .from('cohorts')
    .insert({
      org_id: input.orgId,
      name: input.name,
      description: input.description || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      created_by: actorId,
    })
    .select()
    .single();
  if (error) { console.error('createCohort error:', error); return null; }

  const cohort = dbToCohort(data as Record<string, unknown>);
  await writeAuditLog({
    actorId,
    action: 'cohort.create',
    targetType: 'cohort',
    targetId: cohort.id,
    orgId: input.orgId,
    metadata: { name: input.name },
  });
  return cohort;
}

export async function updateCohort(cohortId: string, updates: {
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean;
}, actorId: string): Promise<boolean> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.startDate !== undefined) row.start_date = updates.startDate;
  if (updates.endDate !== undefined) row.end_date = updates.endDate;
  if (updates.active !== undefined) row.active = updates.active;

  const { error } = await supabase
    .from('cohorts')
    .update(row)
    .eq('id', cohortId);
  if (error) { console.error('updateCohort error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'cohort.update',
    targetType: 'cohort',
    targetId: cohortId,
    metadata: updates,
  });
  return true;
}

// ─── ENROLLMENT CHANNEL QUERIES (PRD-10) ───

function dbToChannel(row: Record<string, unknown>): EnrollmentChannel {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    cohortId: (row.cohort_id as string) || null,
    type: row.type as EnrollmentChannel['type'],
    value: row.value as string,
    label: (row.label as string) || null,
    maxUses: (row.max_uses as number) || null,
    usesCount: (row.uses_count as number) || 0,
    expiresAt: (row.expires_at as string) || null,
    active: row.active as boolean,
    createdBy: (row.created_by as string) || null,
    createdAt: row.created_at as string,
  };
}

export async function listChannels(orgId: string): Promise<EnrollmentChannel[]> {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) { console.error('listChannels error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => dbToChannel(row));
}

export async function createChannel(input: {
  orgId: string;
  cohortId?: string;
  type: 'link' | 'code' | 'domain';
  value: string;
  label?: string;
  maxUses?: number;
  expiresAt?: string;
}, actorId: string): Promise<EnrollmentChannel | null> {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .insert({
      org_id: input.orgId,
      cohort_id: input.cohortId || null,
      type: input.type,
      value: input.value,
      label: input.label || null,
      max_uses: input.maxUses || null,
      expires_at: input.expiresAt || null,
      created_by: actorId,
    })
    .select()
    .single();
  if (error) { console.error('createChannel error:', error); return null; }

  const channel = dbToChannel(data as Record<string, unknown>);
  await writeAuditLog({
    actorId,
    action: 'channel.create',
    targetType: 'enrollment_channel',
    targetId: channel.id,
    orgId: input.orgId,
    metadata: { channel_type: input.type, channel_value: input.value },
  });
  return channel;
}

export async function lookupChannel(value: string): Promise<EnrollmentChannel | null> {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .select('*')
    .eq('value', value)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  return dbToChannel(data as Record<string, unknown>);
}

export async function incrementChannelUses(channelId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_channel_uses', { channel_id: channelId });
  if (error) {
    // Fallback: manual increment if RPC doesn't exist
    const { data } = await supabase
      .from('enrollment_channels')
      .select('uses_count')
      .eq('id', channelId)
      .single();
    if (data) {
      const { error: updateErr } = await supabase
        .from('enrollment_channels')
        .update({ uses_count: (data.uses_count || 0) + 1 })
        .eq('id', channelId);
      return !updateErr;
    }
    return false;
  }
  return true;
}

export async function deactivateChannel(channelId: string, actorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('enrollment_channels')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', channelId);
  if (error) { console.error('deactivateChannel error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'channel.deactivate',
    targetType: 'enrollment_channel',
    targetId: channelId,
  });
  return true;
}

// ─── AUDIT LOG (PRD-10) ───

export async function writeAuditLog(entry: AuditLogEntry): Promise<boolean> {
  const { error } = await supabase
    .from('audit_log')
    .insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      org_id: entry.orgId || null,
      metadata: entry.metadata || {},
    });
  if (error) {
    console.error('writeAuditLog error:', error);
    return false;
  }
  return true;
}

export async function queryAuditLog(filters: {
  orgId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<Array<AuditLogEntry & { id: string; createdAt: string }>> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.orgId) query = query.eq('org_id', filters.orgId);
  if (filters.actorId) query = query.eq('actor_id', filters.actorId);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

  const { data, error } = await query;
  if (error) { console.error('queryAuditLog error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    actorId: row.actor_id as string,
    action: row.action as string,
    targetType: (row.target_type as string) || undefined,
    targetId: (row.target_id as string) || undefined,
    orgId: (row.org_id as string) || undefined,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  }));
}

// ─── FEATURE FLAGS (PRD-15) ───

export interface FeatureFlagRow {
  id: string;
  key: string;
  description: string | null;
  orgId: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getFeatureFlags(): Promise<FeatureFlagRow[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key');
  if (error) { console.error('getFeatureFlags error:', error); return []; }
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    key: row.key as string,
    description: (row.description as string) || null,
    orgId: (row.org_id as string) || null,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateFeatureFlag error:', error); return false; }
  return true;
}

export async function createFlagOverride(key: string, orgId: string, enabled: boolean, description?: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .insert({ key, org_id: orgId, enabled, description: description || null });
  if (error) { console.error('createFlagOverride error:', error); return false; }
  return true;
}

export async function deleteFlagOverride(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteFlagOverride error:', error); return false; }
  return true;
}

// ─── ORG WEEKLY ACTIVITY (for cohort page charts) ───

export async function getOrgWeeklyActivity(orgId: string): Promise<number[]> {
  // Get all active member IDs
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('active', true);

  if (!members || members.length === 0) return Array(7).fill(0);

  const userIds = members.map(m => m.user_id);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('activity_log')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .gte('created_at', monday.toISOString());

  // Count distinct users per day
  const dayUserSets: Set<string>[] = Array.from({ length: 7 }, () => new Set());
  (data || []).forEach((row: Record<string, unknown>) => {
    const d = new Date(row.created_at as string);
    const dow = d.getDay();
    const monBased = dow === 0 ? 6 : dow - 1;
    dayUserSets[monBased].add(row.user_id as string);
  });

  return dayUserSets.map(s => s.size);
}

// ─── ORG-WIDE ACTIVITY FEED (for cohort sidebar) ───

export async function getOrgRecentActivity(
  orgId: string,
  limit: number = 10,
): Promise<Array<{
  userId: string;
  fullName: string;
  action: string;
  level: number | null;
  topicId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}>> {
  // Get active member IDs
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('active', true);

  if (!members || members.length === 0) return [];
  const userIds = members.map(m => m.user_id);

  // Fetch recent activity across all members
  const { data, error } = await supabase
    .from('activity_log')
    .select('user_id, action, level, topic_id, metadata, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('getOrgRecentActivity error:', error); return []; }

  // Batch fetch names
  const uniqueUserIds = [...new Set((data || []).map((r: Record<string, unknown>) => r.user_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueUserIds);
  const nameMap = new Map((profiles || []).map((p: Record<string, unknown>) => [p.id as string, p.full_name as string]));

  return (data || []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    fullName: nameMap.get(row.user_id as string) || 'Unknown',
    action: row.action as string,
    level: row.level as number | null,
    topicId: row.topic_id as number | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  }));
}

// ─── MEMBER DETAIL (for cohort detail drawer) ───

export async function getMemberActivityLog(
  userId: string,
  limit: number = 8,
): Promise<Array<{
  action: string;
  level: number | null;
  topicId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}>> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('action, level, topic_id, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getMemberActivityLog error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    action: row.action as string,
    level: row.level as number | null,
    topicId: row.topic_id as number | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  }));
}

export async function getMemberArtefacts(
  userId: string,
): Promise<Array<{
  id: string;
  name: string;
  type: string;
  level: number;
  sourceTool: string | null;
  createdAt: string;
}>> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('id, name, type, level, source_tool, created_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('getMemberArtefacts error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    level: row.level as number,
    sourceTool: row.source_tool as string | null,
    createdAt: row.created_at as string,
  }));
}

// ─── ADMIN: USER MANAGEMENT (PRD-13) ───

export interface AdminUserRow {
  membershipId: string;
  userId: string;
  fullName: string;
  orgId: string;
  orgName: string;
  orgRole: OrgMemberRole;
  cohortId: string | null;
  cohortName: string | null;
  currentLevel: number;
  enrolledAt: string;
  enrolledVia: string | null;
  pendingEmail: string | null;
  platformRole: string;
  email: string;
}

export interface AdminUserDetail {
  levelProgress: Array<{ level: number; tool_used: boolean; workshop_attended: boolean }>;
  savedPrompts: Array<{ source_tool: string }>;
  lastActivityTs: string | null;
}

export async function fetchAdminUsers(params: {
  page: number;
  pageSize: number;
  orgId?: string;
  levelFilter?: number;
  searchTerm?: string;
  sortColumn?: string;
  sortAsc?: boolean;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  let query = supabase
    .from('user_org_memberships')
    .select(`
      id, user_id, org_id, role, cohort_id, enrolled_at, enrolled_via, active, pending_email,
      organisations(name),
      cohorts(name),
      profiles!inner(
        full_name, current_level, platform_role, email
      )
    `, { count: 'exact' })
    .eq('active', true);

  if (params.orgId) query = query.eq('org_id', params.orgId);
  if (params.levelFilter) {
    query = query.eq('profiles.current_level', params.levelFilter);
  }
  if (params.searchTerm) {
    query = query.ilike('profiles.full_name', `%${params.searchTerm}%`);
  }

  const from = (params.page - 1) * params.pageSize;
  query = query.range(from, from + params.pageSize - 1);

  if (params.sortColumn) {
    query = query.order(params.sortColumn, { ascending: params.sortAsc ?? true });
  } else {
    query = query.order('enrolled_at', { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) { console.error('fetchAdminUsers error:', error); return { users: [], total: 0 }; }

  const users: AdminUserRow[] = (data || []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    const org = row.organisations as Record<string, unknown> | null;
    const cohort = row.cohorts as Record<string, unknown> | null;
    return {
      membershipId: row.id as string,
      userId: row.user_id as string,
      fullName: (profile?.full_name as string) || '',
      orgId: row.org_id as string,
      orgName: (org?.name as string) || '',
      orgRole: (row.role as OrgMemberRole) || 'learner',
      cohortId: (row.cohort_id as string) || null,
      cohortName: (cohort?.name as string) || null,
      currentLevel: (profile?.current_level as number) || 1,
      enrolledAt: row.enrolled_at as string,
      enrolledVia: (row.enrolled_via as string) || null,
      pendingEmail: (row.pending_email as string) || null,
      platformRole: (profile?.platform_role as string) || 'learner',
      email: (profile?.email as string) || '',
    };
  });

  return { users, total: count || 0 };
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const [progressRes, promptsRes, insightsRes] = await Promise.all([
    supabase.from('level_progress').select('level, tool_used, workshop_attended').eq('user_id', userId),
    supabase.from('saved_prompts').select('source_tool').eq('user_id', userId),
    supabase.from('application_insights').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);

  // Also check level_progress and saved_prompts for last activity
  let lastTs: string | null = null;
  const allTimestamps: string[] = [];
  if (insightsRes.data?.[0]) allTimestamps.push(insightsRes.data[0].created_at as string);

  return {
    levelProgress: (progressRes.data || []).map((r: Record<string, unknown>) => ({
      level: r.level as number,
      tool_used: r.tool_used as boolean,
      workshop_attended: r.workshop_attended as boolean,
    })),
    savedPrompts: (promptsRes.data || []).map((r: Record<string, unknown>) => ({
      source_tool: (r.source_tool as string) || 'unknown',
    })),
    lastActivityTs: allTimestamps.length > 0 ? allTimestamps.sort().reverse()[0] : lastTs,
  };
}

export async function fetchUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('fetchUserProfile error:', error); return null; }
  return data;
}

export async function updateMembershipRole(
  membershipId: string,
  newRole: OrgMemberRole,
  actorId: string,
  orgId?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ role: newRole })
    .eq('id', membershipId);
  if (error) { console.error('updateMembershipRole error:', error); return false; }

  await writeAuditLog({
    actorId,
    action: 'user.role_change',
    targetType: 'membership',
    targetId: membershipId,
    orgId,
    metadata: { new_role: newRole },
  });
  return true;
}

// ─── PROJECT SUBMISSIONS (PRD 17) ───
//
// SQL migration — run in Supabase dashboard before deploying:
//
// create table if not exists project_submissions (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid not null references auth.users(id),
//   level int not null check (level >= 1 and level <= 5),
//   status text not null default 'draft'
//     check (status in ('draft', 'submitted', 'passed', 'needs_revision')),
//   tool_name text,
//   platform_used text,
//   tool_link text,
//   screenshot_paths text[],
//   reflection_text text,
//   adoption_scope text
//     check (adoption_scope is null or adoption_scope in (
//       'just-me', 'immediate-team', 'wider-department', 'organisation-wide'
//     )),
//   outcome_text text,
//   case_study_problem text,
//   case_study_solution text,
//   case_study_outcome text,
//   case_study_learnings text,
//   review_dimensions jsonb,
//   review_summary text,
//   review_encouragement text,
//   review_passed boolean,
//   reviewed_at timestamptz,
//   submitted_at timestamptz,
//   completed_at timestamptz,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now(),
//   unique (user_id, level)
// );
//
// alter table project_submissions enable row level security;
// create policy "Users can read own submissions" on project_submissions for select using (auth.uid() = user_id);
// create policy "Users can insert own submissions" on project_submissions for insert with check (auth.uid() = user_id);
// create policy "Users can update own submissions" on project_submissions for update using (auth.uid() = user_id);
// create index project_submissions_user_level on project_submissions(user_id, level);
//
// alter table level_progress
//   add column if not exists project_completed boolean default false,
//   add column if not exists project_completed_at timestamptz;
//
// Storage bucket: project-screenshots (private, 5MB limit, image/png, image/jpeg, image/webp)
// create policy "Users upload own screenshots" on storage.objects for insert
//   with check (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
// create policy "Users read own screenshots" on storage.objects for select
//   using (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
// create policy "Users delete own screenshots" on storage.objects for delete
//   using (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

export interface ProjectSubmission {
  id: string;
  userId: string;
  level: number;
  status: 'draft' | 'submitted' | 'passed' | 'needs_revision';
  toolName: string | null;
  platformUsed: string | null;
  toolLink: string | null;
  screenshotPaths: string[];
  reflectionText: string | null;
  adoptionScope: string | null;
  outcomeText: string | null;
  caseStudyProblem: string | null;
  caseStudySolution: string | null;
  caseStudyOutcome: string | null;
  caseStudyLearnings: string | null;
  reviewDimensions: unknown | null;
  reviewSummary: string | null;
  reviewEncouragement: string | null;
  reviewPassed: boolean | null;
  reviewedAt: number | null;
  submittedAt: number | null;
  completedAt: number | null;
  artefactId: string | null;
  createdAt: number;
  updatedAt: number;
}

function dbToProjectSubmission(row: Record<string, unknown>): ProjectSubmission {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    level: row.level as number,
    status: row.status as ProjectSubmission['status'],
    toolName: (row.tool_name as string) || null,
    platformUsed: (row.platform_used as string) || null,
    toolLink: (row.tool_link as string) || null,
    screenshotPaths: (row.screenshot_paths as string[]) || [],
    reflectionText: (row.reflection_text as string) || null,
    adoptionScope: (row.adoption_scope as string) || null,
    outcomeText: (row.outcome_text as string) || null,
    caseStudyProblem: (row.case_study_problem as string) || null,
    caseStudySolution: (row.case_study_solution as string) || null,
    caseStudyOutcome: (row.case_study_outcome as string) || null,
    caseStudyLearnings: (row.case_study_learnings as string) || null,
    reviewDimensions: row.review_dimensions || null,
    reviewSummary: (row.review_summary as string) || null,
    reviewEncouragement: (row.review_encouragement as string) || null,
    reviewPassed: row.review_passed as boolean | null,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string).getTime() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at as string).getTime() : null,
    completedAt: row.completed_at ? new Date(row.completed_at as string).getTime() : null,
    artefactId: (row.artefact_id as string) || null,
    createdAt: new Date((row.created_at as string) || Date.now()).getTime(),
    updatedAt: new Date((row.updated_at as string) || Date.now()).getTime(),
  };
}

export async function getProjectSubmission(userId: string, level: number): Promise<ProjectSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('level', level)
      .maybeSingle();
    if (error || !data) return null;
    return dbToProjectSubmission(data as Record<string, unknown>);
  } catch { return null; }
}

export async function getProjectSubmissionById(userId: string, id: string): Promise<ProjectSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return dbToProjectSubmission(data as Record<string, unknown>);
  } catch { return null; }
}

export async function getLevelSubmissions(userId: string, level: number): Promise<ProjectSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('level', level)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(dbToProjectSubmission);
  } catch { return []; }
}

export async function getAllProjectSubmissions(userId: string): Promise<ProjectSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', userId);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(dbToProjectSubmission);
  } catch { return []; }
}

/** Create or update the linked artefact for a reviewed project submission */
export async function upsertProjectArtefact(
  userId: string,
  submission: ProjectSubmission,
  tierLabel: string,
  tierLetter: string,
): Promise<string | null> {
  try {
    const proofName = submission.toolName
      ? `${submission.toolName} — Level ${submission.level} Project`
      : `Level ${submission.level} Project Proof`;

    const preview = submission.reflectionText
      ? submission.reflectionText.slice(0, 180) + (submission.reflectionText.length > 180 ? '…' : '')
      : 'Project submission';

    const content: Record<string, unknown> = {
      submissionId: submission.id,
      level: submission.level,
      tier: tierLetter,
      tierLabel,
      toolName: submission.toolName,
      platformUsed: submission.platformUsed,
      toolLink: submission.toolLink,
      reflectionText: submission.reflectionText,
      adoptionScope: submission.adoptionScope,
      outcomeText: submission.outcomeText,
      reviewDimensions: submission.reviewDimensions,
      reviewSummary: submission.reviewSummary,
      reviewEncouragement: submission.reviewEncouragement,
      reviewPassed: submission.reviewPassed,
      screenshotPaths: submission.screenshotPaths,
    };
    if (submission.caseStudyProblem) content.caseStudyProblem = submission.caseStudyProblem;
    if (submission.caseStudySolution) content.caseStudySolution = submission.caseStudySolution;
    if (submission.caseStudyOutcome) content.caseStudyOutcome = submission.caseStudyOutcome;
    if (submission.caseStudyLearnings) content.caseStudyLearnings = submission.caseStudyLearnings;

    // Update existing artefact if linked
    if (submission.artefactId) {
      const ok = await updateArtefactContent(submission.artefactId, userId, content);
      if (ok) {
        // Also update name + preview
        await supabase
          .from('artefacts')
          .update({ name: proofName, preview: preview.slice(0, 200), updated_at: new Date().toISOString() })
          .eq('id', submission.artefactId)
          .eq('user_id', userId);
        return submission.artefactId;
      }
    }

    // Create new artefact
    const result = await createArtefactFromTool(userId, {
      name: proofName,
      type: 'project_proof',
      level: submission.level,
      sourceTool: 'project-proof',
      content,
      preview,
    });
    if (!result) return null;

    // Link the artefact to the submission
    await supabase
      .from('project_submissions')
      .update({ artefact_id: result.id, updated_at: new Date().toISOString() })
      .eq('id', submission.id)
      .eq('user_id', userId);

    return result.id;
  } catch (err) {
    console.error('upsertProjectArtefact error:', err);
    return null;
  }
}

// ─── TOOLKIT PROJECT CHIPS ───
//
// create table if not exists toolkit_project_chips (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid not null references auth.users(id) on delete cascade,
//   level integer not null check (level between 1 and 5),
//   tool_id text not null,
//   chip_data jsonb not null default '{}',
//   generated_at timestamptz not null default now(),
//   unique(user_id, level)
// );
// alter table toolkit_project_chips enable row level security;
// create policy "Users can read own chips" on toolkit_project_chips for select using (auth.uid() = user_id);
// create policy "Users can insert own chips" on toolkit_project_chips for insert with check (auth.uid() = user_id);
// create policy "Users can update own chips" on toolkit_project_chips for update using (auth.uid() = user_id);
// create index toolkit_project_chips_user on toolkit_project_chips(user_id);

export interface ToolkitProjectChip {
  id: string;
  userId: string;
  level: number;
  toolId: string;
  chipData: Record<string, string>;
  generatedAt: string;
}

function dbToChip(row: Record<string, unknown>): ToolkitProjectChip {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    level: row.level as number,
    toolId: row.tool_id as string,
    chipData: (row.chip_data as Record<string, string>) || {},
    generatedAt: row.generated_at as string,
  };
}

export async function getToolkitProjectChips(userId: string): Promise<ToolkitProjectChip[]> {
  try {
    const { data, error } = await supabase
      .from('toolkit_project_chips')
      .select('*')
      .eq('user_id', userId);
    if (error) { console.error('getToolkitProjectChips error:', error); return []; }
    return (data as Record<string, unknown>[]).map(dbToChip);
  } catch (err) { console.error('getToolkitProjectChips error:', err); return []; }
}

export async function upsertToolkitProjectChips(
  userId: string,
  chips: Omit<ToolkitProjectChip, 'id' | 'userId' | 'generatedAt'>[]
): Promise<boolean> {
  try {
    const rows = chips.map(c => ({
      user_id: userId,
      level: c.level,
      tool_id: c.toolId,
      chip_data: c.chipData,
      generated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('toolkit_project_chips')
      .upsert(rows, { onConflict: 'user_id,level' });
    if (error) { console.error('upsertToolkitProjectChips error:', error); return false; }
    return true;
  } catch (err) { console.error('upsertToolkitProjectChips error:', err); return false; }
}

export async function upsertProjectDraft(
  userId: string,
  level: number,
  fields: Partial<{
    toolName: string;
    platformUsed: string;
    toolLink: string;
    screenshotPaths: string[];
    reflectionText: string;
    adoptionScope: string;
    outcomeText: string;
    caseStudyProblem: string;
    caseStudySolution: string;
    caseStudyOutcome: string;
    caseStudyLearnings: string;
  }>,
): Promise<boolean> {
  try {
    const row: Record<string, unknown> = {
      user_id: userId,
      level,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    if (fields.toolName !== undefined) row.tool_name = fields.toolName;
    if (fields.platformUsed !== undefined) row.platform_used = fields.platformUsed;
    if (fields.toolLink !== undefined) row.tool_link = fields.toolLink;
    if (fields.screenshotPaths !== undefined) row.screenshot_paths = fields.screenshotPaths;
    if (fields.reflectionText !== undefined) row.reflection_text = fields.reflectionText;
    if (fields.adoptionScope !== undefined) row.adoption_scope = fields.adoptionScope;
    if (fields.outcomeText !== undefined) row.outcome_text = fields.outcomeText;
    if (fields.caseStudyProblem !== undefined) row.case_study_problem = fields.caseStudyProblem;
    if (fields.caseStudySolution !== undefined) row.case_study_solution = fields.caseStudySolution;
    if (fields.caseStudyOutcome !== undefined) row.case_study_outcome = fields.caseStudyOutcome;
    if (fields.caseStudyLearnings !== undefined) row.case_study_learnings = fields.caseStudyLearnings;

    const { error } = await supabase
      .from('project_submissions')
      .upsert(row, { onConflict: 'user_id,level' });
    if (error) return false;
    return true;
  } catch { return false; }
}

export interface ReviewProjectResponse {
  dimensions: {
    id: string;
    name: string;
    status: 'strong' | 'developing' | 'needs_attention';
    feedback: string;
  }[];
  overallPassed: boolean;
  summary: string;
  encouragement: string;
}

export async function submitProject(
  userId: string,
  level: number,
  submission: ProjectSubmission,
  screenshotDataUris: string[],
  projectBrief: { projectTitle: string; projectDescription: string; deliverable: string; challengeConnection: string },
  learnerProfile: { role: string; function: string; seniority: string; aiExperience: string },
): Promise<{ success: boolean; review: ReviewProjectResponse | null; error: string | null }> {
  try {
    const now = new Date().toISOString();

    // 1. Set status to 'submitted'
    await supabase
      .from('project_submissions')
      .update({ status: 'submitted', submitted_at: now, updated_at: now })
      .eq('user_id', userId)
      .eq('level', level);

    // 2. Call the review API
    const response = await fetch('/api/review-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        projectBrief,
        submission: {
          toolName: submission.toolName,
          platformUsed: submission.platformUsed,
          toolLink: submission.toolLink,
          reflectionText: submission.reflectionText,
          adoptionScope: submission.adoptionScope,
          outcomeText: submission.outcomeText,
          caseStudyProblem: submission.caseStudyProblem,
          caseStudySolution: submission.caseStudySolution,
          caseStudyOutcome: submission.caseStudyOutcome,
          caseStudyLearnings: submission.caseStudyLearnings,
        },
        screenshots: screenshotDataUris,
        learnerProfile,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      // Revert status to draft on failure
      await supabase
        .from('project_submissions')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('level', level);
      throw new Error(errData.error || 'Review API failed');
    }

    const review: ReviewProjectResponse = await response.json();

    // 3. Store the review results
    const newStatus = review.overallPassed ? 'passed' : 'needs_revision';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      review_dimensions: review.dimensions,
      review_summary: review.summary,
      review_encouragement: review.encouragement,
      review_passed: review.overallPassed,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (review.overallPassed) {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('project_submissions')
      .update(updateData)
      .eq('user_id', userId)
      .eq('level', level);

    // 4. If passed, update level_progress
    if (review.overallPassed) {
      const { data: existing } = await supabase
        .from('level_progress')
        .select('user_id')
        .eq('user_id', userId)
        .eq('level', level)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('level_progress')
          .update({ project_completed: true, project_completed_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('level', level);
      } else {
        await supabase
          .from('level_progress')
          .insert({
            user_id: userId,
            level,
            tool_used: false,
            workshop_attended: false,
            project_completed: true,
            project_completed_at: new Date().toISOString(),
          });
      }
    }

    return { success: true, review, error: null };
  } catch (err) {
    // Revert status to draft on any error (network failure, JSON parse, etc.)
    await supabase
      .from('project_submissions')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('level', level);
    return { success: false, review: null, error: (err as Error).message };
  }
}

export async function uploadProjectScreenshot(
  userId: string,
  level: number,
  file: File,
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${level}/${timestamp}_${safeName}`;
    const { error } = await supabase.storage
      .from('project-screenshots')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return null;
    return path;
  } catch { return null; }
}

export async function deleteProjectScreenshot(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('project-screenshots')
      .remove([path]);
    return !error;
  } catch { return false; }
}

export async function getScreenshotUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('project-screenshots')
      .createSignedUrl(path, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  } catch { return null; }
}
