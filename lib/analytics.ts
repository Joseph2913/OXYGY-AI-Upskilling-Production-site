import { supabase } from './supabase';

// ─── Types ───

export interface DateRange {
  label: string;
  days: number | null; // null = all time
  start: Date;
}

export interface DashboardMetrics {
  totalOrgs: number;
  totalUsers: number;
  activeUsers: number;
  activeRate: number;
  avgCompletionRate: number;
  toolUsageRate: number;
  orgHealthRows: OrgHealthRow[];
  funnelStages: FunnelStage[];
  featureAdoption: FeatureAdoptionRow[];
  trends: Record<string, number | null>;
}

export interface OrgHealthRow {
  id: string;
  name: string;
  tier: string;
  enrolled: number;
  activeRate: number;
  completionRate: number;
  toolUsageRate: number;
  lastActivity: string | null;
  health: 'green' | 'amber' | 'red';
}

export interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
}

export interface FeatureAdoptionRow {
  tool: string;
  label: string;
  level: number;
  colour: string;
  userCount: number;
  percentage: number;
}

export interface OrgAnalytics {
  enrolled: number;
  activeRate: number;
  completionRate: number;
  toolUsageRate: number;
  levelDistribution: { level: number; count: number; percentage: number }[];
  toolAdoption: FeatureAdoptionRow[];
  completionTimeline: { date: string; levels: Record<number, number> }[];
  stalledUsers: StalledUser[];
  cohortComparison: CohortRow[];
  trends: Record<string, number | null>;
}

export interface StalledUser {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  lastActive: string | null;
  daysInactive: number;
}

export interface CohortRow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  members: number;
  activeRate: number;
  avgLevel: number;
  toolUsageRate: number;
}

// ─── Constants ───

const LEVEL_COLOURS: Record<number, string> = {
  1: '#A8F0E0',
  2: '#C3D0F5',
  3: '#F7E8A4',
  4: '#F5B8A0',
  5: '#38B2AC',
};

const TOOL_DEFINITIONS = [
  { tool: 'prompt-playground', label: 'Prompt Playground', level: 1 },
  { tool: 'agent-builder', label: 'Agent Builder', level: 2 },
  { tool: 'workflow-designer', label: 'Workflow Canvas', level: 3 },
  { tool: 'dashboard-designer', label: 'App Designer', level: 4 },
  { tool: 'product-architecture', label: 'App Evaluator', level: 5 },
];

// ─── Date Range Helpers ───

export function getDateRange(days: number | null): DateRange {
  const now = new Date();
  if (days === null) {
    return { label: 'All Time', days: null, start: new Date('2020-01-01') };
  }
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const labels: Record<number, string> = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' };
  return { label: labels[days] || `Last ${days} days`, days, start };
}

function getPreviousPeriodStart(dateRange: DateRange): Date {
  if (dateRange.days === null) return new Date('2020-01-01');
  const prev = new Date(dateRange.start);
  prev.setDate(prev.getDate() - dateRange.days);
  return prev;
}

// ─── Health Score ───

export function calculateHealth(
  activeRate: number, completionRate: number, enrolledCount: number
): 'green' | 'amber' | 'red' {
  if (enrolledCount < 3) return 'amber';
  if (activeRate >= 50 && completionRate >= 30) return 'green';
  if (activeRate < 25 || (enrolledCount >= 10 && completionRate < 10)) return 'red';
  return 'amber';
}

// ─── Cross-Client Dashboard Fetch ───

export async function fetchDashboardAnalytics(dateRange: DateRange): Promise<DashboardMetrics> {
  const since = dateRange.start.toISOString();

  const [
    orgCountRes,
    totalUsersRes,
    activeUsersRes,
    levelProgressRes,
    savedPromptsRes,
    orgDetailsRes,
    profilesRes,
  ] = await Promise.all([
    supabase.from('organisations').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('user_org_memberships').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.rpc('count_active_users', { since_date: since }),
    supabase.from('level_progress').select('user_id, level, tool_used, tool_used_at, workshop_attended'),
    supabase.from('saved_prompts').select('user_id, source_tool, saved_at'),
    supabase.from('organisations').select(`
      id, name, tier, active, level_access,
      user_org_memberships(user_id, active)
    `).eq('active', true).order('name'),
    supabase.from('profiles').select('id, current_level, role, function, seniority, updated_at'),
  ]);

  const totalOrgs = orgCountRes.count || 0;
  const totalUsers = totalUsersRes.count || 0;
  const activeUsers = (activeUsersRes.data as number) || 0;
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const levelProgress = (levelProgressRes.data || []) as {
    user_id: string; level: number; tool_used: boolean;
    tool_used_at: string | null; workshop_attended: boolean;
  }[];
  const savedPrompts = (savedPromptsRes.data || []) as {
    user_id: string; source_tool: string; saved_at: string;
  }[];
  const orgs = (orgDetailsRes.data || []) as {
    id: string; name: string; tier: string; active: boolean;
    level_access: number[];
    user_org_memberships: { user_id: string; active: boolean }[];
  }[];
  const profiles = (profilesRes.data || []) as {
    id: string; current_level: number; role: string; function: string;
    seniority: string; updated_at: string;
  }[];

  // Build a set of all enrolled user IDs
  const enrolledUserIds = new Set<string>();
  orgs.forEach(org => {
    (org.user_org_memberships || []).forEach(m => {
      if (m.active) enrolledUserIds.add(m.user_id);
    });
  });

  // Completion rate: per user, (levels with tool_used=true) / (total levels available in their org)
  const userOrgMap = new Map<string, string[]>(); // userId -> orgIds
  orgs.forEach(org => {
    (org.user_org_memberships || []).forEach(m => {
      if (m.active) {
        if (!userOrgMap.has(m.user_id)) userOrgMap.set(m.user_id, []);
        userOrgMap.get(m.user_id)!.push(org.id);
      }
    });
  });
  const orgLevelAccess = new Map<string, number[]>();
  orgs.forEach(org => orgLevelAccess.set(org.id, org.level_access || [1, 2, 3, 4, 5]));

  // Group level progress by user
  const userLevelProgress = new Map<string, Set<number>>();
  levelProgress.forEach(lp => {
    if (lp.tool_used) {
      if (!userLevelProgress.has(lp.user_id)) userLevelProgress.set(lp.user_id, new Set());
      userLevelProgress.get(lp.user_id)!.add(lp.level);
    }
  });

  let completionSum = 0;
  let completionCount = 0;
  enrolledUserIds.forEach(userId => {
    const orgIds = userOrgMap.get(userId) || [];
    // Use first org's level access
    const orgId = orgIds[0];
    const levels = orgId ? (orgLevelAccess.get(orgId) || [1, 2, 3, 4, 5]) : [1, 2, 3, 4, 5];
    const completed = userLevelProgress.get(userId)?.size || 0;
    completionSum += levels.length > 0 ? completed / levels.length : 0;
    completionCount++;
  });
  const avgCompletionRate = completionCount > 0 ? Math.round((completionSum / completionCount) * 100) : 0;

  // Tool usage rate
  const usersWithTool = userLevelProgress.size;
  const toolUsageRate = totalUsers > 0 ? Math.round((usersWithTool / totalUsers) * 100) : 0;

  // Org health rows
  const orgHealthRows: OrgHealthRow[] = orgs.map(org => {
    const members = (org.user_org_memberships || []).filter(m => m.active);
    const enrolled = members.length;
    const memberIds = new Set(members.map(m => m.user_id));
    const levels = org.level_access || [1, 2, 3, 4, 5];

    // Active rate for this org
    let orgActiveCount = 0;
    memberIds.forEach(uid => {
      const hasActivity =
        levelProgress.some(lp => lp.user_id === uid && lp.tool_used_at && new Date(lp.tool_used_at) >= dateRange.start) ||
        savedPrompts.some(sp => sp.user_id === uid && new Date(sp.saved_at) >= dateRange.start);
      if (hasActivity) orgActiveCount++;
    });
    const orgActiveRate = enrolled > 0 ? Math.round((orgActiveCount / enrolled) * 100) : 0;

    // Completion rate for this org
    let orgCompSum = 0;
    memberIds.forEach(uid => {
      const completed = userLevelProgress.get(uid)?.size || 0;
      orgCompSum += levels.length > 0 ? completed / levels.length : 0;
    });
    const orgCompletionRate = enrolled > 0 ? Math.round((orgCompSum / enrolled) * 100) : 0;

    // Tool usage for this org
    let orgToolUsers = 0;
    memberIds.forEach(uid => {
      if (userLevelProgress.has(uid)) orgToolUsers++;
    });
    const orgToolUsageRate = enrolled > 0 ? Math.round((orgToolUsers / enrolled) * 100) : 0;

    // Last activity
    let lastActivity: string | null = null;
    memberIds.forEach(uid => {
      levelProgress.forEach(lp => {
        if (lp.user_id === uid && lp.tool_used_at) {
          if (!lastActivity || lp.tool_used_at > lastActivity) lastActivity = lp.tool_used_at;
        }
      });
      savedPrompts.forEach(sp => {
        if (sp.user_id === uid) {
          if (!lastActivity || sp.saved_at > lastActivity) lastActivity = sp.saved_at;
        }
      });
    });

    return {
      id: org.id,
      name: org.name,
      tier: org.tier || 'foundation',
      enrolled,
      activeRate: orgActiveRate,
      completionRate: orgCompletionRate,
      toolUsageRate: orgToolUsageRate,
      lastActivity,
      health: calculateHealth(orgActiveRate, orgCompletionRate, enrolled),
    };
  });

  // Sort: red first, then amber, then green
  const healthOrder = { red: 0, amber: 1, green: 2 };
  orgHealthRows.sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);

  // Engagement funnel
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const completedOnboarding = [...enrolledUserIds].filter(uid => {
    const p = profileMap.get(uid);
    return p && p.role && p.function && p.seniority;
  }).length;

  const usersByLevel = new Map<number, Set<string>>();
  const usersCompletedLevel = new Map<number, Set<string>>();
  levelProgress.forEach(lp => {
    if (!enrolledUserIds.has(lp.user_id)) return;
    if (!usersByLevel.has(lp.level)) usersByLevel.set(lp.level, new Set());
    usersByLevel.get(lp.level)!.add(lp.user_id);
    if (lp.tool_used) {
      if (!usersCompletedLevel.has(lp.level)) usersCompletedLevel.set(lp.level, new Set());
      usersCompletedLevel.get(lp.level)!.add(lp.user_id);
    }
  });

  const funnelStages: FunnelStage[] = [
    { label: 'Enrolled', count: totalUsers, percentage: 100 },
    { label: 'Completed Onboarding', count: completedOnboarding, percentage: totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0 },
    { label: 'Started Level 1', count: usersByLevel.get(1)?.size || 0, percentage: totalUsers > 0 ? Math.round(((usersByLevel.get(1)?.size || 0) / totalUsers) * 100) : 0 },
    { label: 'Completed Level 1', count: usersCompletedLevel.get(1)?.size || 0, percentage: totalUsers > 0 ? Math.round(((usersCompletedLevel.get(1)?.size || 0) / totalUsers) * 100) : 0 },
    { label: 'Started Level 2', count: usersByLevel.get(2)?.size || 0, percentage: totalUsers > 0 ? Math.round(((usersByLevel.get(2)?.size || 0) / totalUsers) * 100) : 0 },
    { label: 'Completed Level 2', count: usersCompletedLevel.get(2)?.size || 0, percentage: totalUsers > 0 ? Math.round(((usersCompletedLevel.get(2)?.size || 0) / totalUsers) * 100) : 0 },
    { label: 'Started Level 3+', count: ([3, 4, 5].reduce((s, l) => s + (usersByLevel.get(l)?.size || 0), 0)), percentage: totalUsers > 0 ? Math.round(([3, 4, 5].reduce((s, l) => s + (usersByLevel.get(l)?.size || 0), 0) / totalUsers) * 100) : 0 },
  ];

  // Feature adoption
  const toolUserSets = new Map<string, Set<string>>();
  savedPrompts.forEach(sp => {
    if (!sp.source_tool || !enrolledUserIds.has(sp.user_id)) return;
    if (!toolUserSets.has(sp.source_tool)) toolUserSets.set(sp.source_tool, new Set());
    toolUserSets.get(sp.source_tool)!.add(sp.user_id);
  });
  // Also count artefacts if saved_prompts source_tool is empty — check level_progress tool_used
  const featureAdoption: FeatureAdoptionRow[] = TOOL_DEFINITIONS.map(td => {
    const users = toolUserSets.get(td.tool)?.size || 0;
    return {
      tool: td.tool,
      label: `${td.label} (L${td.level})`,
      level: td.level,
      colour: LEVEL_COLOURS[td.level],
      userCount: users,
      percentage: totalUsers > 0 ? Math.round((users / totalUsers) * 100) : 0,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Trends (simplified: compare current period vs previous period)
  // For V1, trends are null (we'd need separate queries for the previous period)
  const trends: Record<string, number | null> = {
    totalOrgs: null,
    totalUsers: null,
    activeUsers: null,
    avgCompletionRate: null,
    toolUsageRate: null,
  };

  return {
    totalOrgs, totalUsers, activeUsers, activeRate,
    avgCompletionRate, toolUsageRate,
    orgHealthRows, funnelStages, featureAdoption, trends,
  };
}

// ─── Per-Org Analytics Fetch ───

export async function fetchOrgAnalytics(orgId: string, dateRange: DateRange): Promise<OrgAnalytics> {
  const since = dateRange.start.toISOString();

  // Get org details first for level_access
  const { data: orgData } = await supabase
    .from('organisations')
    .select('level_access')
    .eq('id', orgId)
    .single();
  const levelAccess = (orgData?.level_access as number[]) || [1, 2, 3, 4, 5];

  // Get user IDs in this org
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id, cohort_id')
    .eq('org_id', orgId)
    .eq('active', true);
  const userIds = (members || []).map(m => m.user_id);
  const memberCohorts = members || [];

  if (userIds.length === 0) return emptyOrgAnalytics();

  const [
    activeCountRes,
    levelProgressRes,
    savedPromptsRes,
    profilesRes,
    cohortsRes,
  ] = await Promise.all([
    supabase.rpc('count_active_users_for_org', { target_org_id: orgId, since_date: since }),
    supabase.from('level_progress')
      .select('user_id, level, tool_used, tool_used_at, workshop_attended, updated_at')
      .in('user_id', userIds),
    supabase.from('saved_prompts')
      .select('user_id, source_tool, saved_at')
      .in('user_id', userIds),
    supabase.from('profiles')
      .select('id, current_level, full_name, email, updated_at')
      .in('id', userIds),
    supabase.from('cohorts')
      .select('id, name, start_date, end_date')
      .eq('org_id', orgId)
      .eq('active', true),
  ]);

  const enrolled = userIds.length;
  const activeCount = (activeCountRes.data as number) || 0;
  const activeRate = enrolled > 0 ? Math.round((activeCount / enrolled) * 100) : 0;

  const levelProgress = (levelProgressRes.data || []) as {
    user_id: string; level: number; tool_used: boolean;
    tool_used_at: string | null; workshop_attended: boolean; updated_at: string;
  }[];
  const savedPrompts = (savedPromptsRes.data || []) as {
    user_id: string; source_tool: string; saved_at: string;
  }[];
  const profiles = (profilesRes.data || []) as {
    id: string; current_level: number; full_name: string; updated_at: string;
  }[];
  const cohorts = (cohortsRes.data || []) as {
    id: string; name: string; start_date: string | null; end_date: string | null;
  }[];

  // Completion rate
  const userCompletedLevels = new Map<string, Set<number>>();
  levelProgress.forEach(lp => {
    if (lp.tool_used) {
      if (!userCompletedLevels.has(lp.user_id)) userCompletedLevels.set(lp.user_id, new Set());
      userCompletedLevels.get(lp.user_id)!.add(lp.level);
    }
  });
  let compSum = 0;
  userIds.forEach(uid => {
    const completed = userCompletedLevels.get(uid)?.size || 0;
    compSum += levelAccess.length > 0 ? completed / levelAccess.length : 0;
  });
  const completionRate = enrolled > 0 ? Math.round((compSum / enrolled) * 100) : 0;

  // Tool usage rate
  const usersWithTool = userCompletedLevels.size;
  const toolUsageRate = enrolled > 0 ? Math.round((usersWithTool / enrolled) * 100) : 0;

  // Level distribution
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const levelCounts = new Map<number, number>();
  userIds.forEach(uid => {
    const p = profileMap.get(uid);
    const level = p?.current_level || 1;
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  });
  const levelDistribution = [1, 2, 3, 4, 5].map(level => ({
    level,
    count: levelCounts.get(level) || 0,
    percentage: enrolled > 0 ? Math.round(((levelCounts.get(level) || 0) / enrolled) * 100) : 0,
  }));

  // Tool adoption (scoped to this org)
  const toolUserSets = new Map<string, Set<string>>();
  const userIdSet = new Set(userIds);
  savedPrompts.forEach(sp => {
    if (!sp.source_tool || !userIdSet.has(sp.user_id)) return;
    if (!toolUserSets.has(sp.source_tool)) toolUserSets.set(sp.source_tool, new Set());
    toolUserSets.get(sp.source_tool)!.add(sp.user_id);
  });
  const toolAdoption: FeatureAdoptionRow[] = TOOL_DEFINITIONS.map(td => {
    const users = toolUserSets.get(td.tool)?.size || 0;
    return {
      tool: td.tool,
      label: `${td.label} (L${td.level})`,
      level: td.level,
      colour: LEVEL_COLOURS[td.level],
      userCount: users,
      percentage: enrolled > 0 ? Math.round((users / enrolled) * 100) : 0,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Completion timeline
  const completionTimeline = buildCompletionTimeline(levelProgress, dateRange);

  // Stalled users (inactive 14+ days)
  const now = new Date();
  const stalledUsers: StalledUser[] = [];
  userIds.forEach(uid => {
    const profile = profileMap.get(uid);
    let lastActive: string | null = null;

    levelProgress.forEach(lp => {
      if (lp.user_id === uid && lp.updated_at) {
        if (!lastActive || lp.updated_at > lastActive) lastActive = lp.updated_at;
      }
    });
    savedPrompts.forEach(sp => {
      if (sp.user_id === uid) {
        if (!lastActive || sp.saved_at > lastActive) lastActive = sp.saved_at;
      }
    });

    if (lastActive) {
      const daysInactive = Math.floor((now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
      if (daysInactive >= 14) {
        stalledUsers.push({
          id: uid,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          currentLevel: profile?.current_level || 1,
          lastActive,
          daysInactive,
        });
      }
    }
  });
  stalledUsers.sort((a, b) => b.daysInactive - a.daysInactive);

  // Cohort comparison
  const cohortComparison: CohortRow[] = cohorts.length >= 2 ? cohorts.map(cohort => {
    const cohortMemberIds = memberCohorts
      .filter(m => m.cohort_id === cohort.id)
      .map(m => m.user_id);
    const cohortMemberSet = new Set(cohortMemberIds);
    const memberCount = cohortMemberIds.length;

    // Active rate for cohort
    let cohortActiveCount = 0;
    cohortMemberIds.forEach(uid => {
      const hasActivity =
        levelProgress.some(lp => lp.user_id === uid && lp.updated_at && new Date(lp.updated_at) >= dateRange.start) ||
        savedPrompts.some(sp => sp.user_id === uid && new Date(sp.saved_at) >= dateRange.start);
      if (hasActivity) cohortActiveCount++;
    });
    const cohortActiveRate = memberCount > 0 ? Math.round((cohortActiveCount / memberCount) * 100) : 0;

    // Avg level
    let levelSum = 0;
    cohortMemberIds.forEach(uid => {
      const p = profileMap.get(uid);
      levelSum += p?.current_level || 1;
    });
    const avgLevel = memberCount > 0 ? Math.round((levelSum / memberCount) * 10) / 10 : 0;

    // Tool usage
    let cohortToolUsers = 0;
    cohortMemberIds.forEach(uid => {
      if (userCompletedLevels.has(uid)) cohortToolUsers++;
    });
    const cohortToolUsageRate = memberCount > 0 ? Math.round((cohortToolUsers / memberCount) * 100) : 0;

    return {
      id: cohort.id,
      name: cohort.name,
      startDate: cohort.start_date,
      endDate: cohort.end_date,
      members: memberCount,
      activeRate: cohortActiveRate,
      avgLevel,
      toolUsageRate: cohortToolUsageRate,
    };
  }).sort((a, b) => b.activeRate - a.activeRate) : [];

  return {
    enrolled, activeRate, completionRate, toolUsageRate,
    levelDistribution, toolAdoption, completionTimeline,
    stalledUsers: stalledUsers.slice(0, 10),
    cohortComparison,
    trends: { enrolled: null, activeRate: null, completionRate: null, toolUsageRate: null },
  };
}

// ─── Helpers ───

function emptyOrgAnalytics(): OrgAnalytics {
  return {
    enrolled: 0, activeRate: 0, completionRate: 0, toolUsageRate: 0,
    levelDistribution: [1, 2, 3, 4, 5].map(level => ({ level, count: 0, percentage: 0 })),
    toolAdoption: [],
    completionTimeline: [],
    stalledUsers: [],
    cohortComparison: [],
    trends: { enrolled: null, activeRate: null, completionRate: null, toolUsageRate: null },
  };
}

function buildCompletionTimeline(
  levelProgress: { user_id: string; level: number; tool_used: boolean; tool_used_at: string | null }[],
  dateRange: DateRange
): { date: string; levels: Record<number, number> }[] {
  // Get all tool_used_at dates
  const completions = levelProgress
    .filter(lp => lp.tool_used && lp.tool_used_at)
    .map(lp => ({ date: lp.tool_used_at!, level: lp.level }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (completions.length === 0) return [];

  // Determine aggregation interval
  const totalDays = dateRange.days || 365;
  const interval = totalDays > 180 ? 'month' : 'week';

  // Build date buckets
  const buckets: { date: string; levels: Record<number, number> }[] = [];
  const start = new Date(dateRange.start);
  const now = new Date();

  const current = new Date(start);
  while (current <= now) {
    const dateStr = current.toISOString().split('T')[0];
    const cumulativeLevels: Record<number, number> = {};
    for (let l = 1; l <= 5; l++) {
      cumulativeLevels[l] = completions.filter(
        c => c.level === l && c.date.split('T')[0] <= dateStr
      ).length;
    }
    buckets.push({ date: dateStr, levels: cumulativeLevels });

    if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return buckets;
}

// ─── Insight Generators ───

export function getFunnelInsight(stages: FunnelStage[]): string {
  if (stages.length < 2) return '';
  let maxDrop = 0;
  let maxDropStage = '';
  for (let i = 1; i < stages.length; i++) {
    const drop = stages[i - 1].count - stages[i].count;
    if (drop > maxDrop) {
      maxDrop = drop;
      maxDropStage = stages[i].label;
    }
  }
  if (maxDrop === 0 || !stages[0].count) return 'No significant drop-off detected.';
  const pct = Math.round((maxDrop / stages[0].count) * 100);
  return `Biggest drop-off: ${maxDropStage} (${pct}% of users don't progress past this point)`;
}

export function getLevelInsight(distribution: { level: number; count: number; percentage: number }[]): string {
  const max = distribution.reduce((a, b) => b.count > a.count ? b : a, distribution[0]);
  if (!max || max.count === 0) return 'No users in the system yet.';
  return `Most users are at Level ${max.level} — ${max.percentage}% of the cohort.`;
}

export function getCohortInsight(cohorts: CohortRow[]): string {
  if (cohorts.length < 2) return '';
  const best = cohorts[0];
  const worst = cohorts[cohorts.length - 1];
  const delta = best.activeRate - worst.activeRate;
  return `Your ${best.name} cohort is outperforming ${worst.name} by ${delta} percentage points on active rate.`;
}

export function getTimelineInsight(timeline: { date: string; levels: Record<number, number> }[]): string {
  if (timeline.length < 2) return 'Not enough data to calculate growth rate.';
  const first = timeline[0].levels[1] || 0;
  const last = timeline[timeline.length - 1].levels[1] || 0;
  const weeks = Math.max(1, timeline.length);
  const rate = Math.round((last - first) / weeks * 10) / 10;
  return `Level 1 completions are growing ${rate} per week on average.`;
}
