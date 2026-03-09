/*
 * SQL MIGRATION — Run this in the Supabase dashboard before deploying this page:
 *
 * create table artefacts (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references profiles(id) on delete cascade,
 *   name text not null,
 *   type text not null check (type in ('prompt', 'agent', 'workflow', 'dashboard', 'app_spec')),
 *   level integer not null check (level between 1 and 5),
 *   content jsonb not null default '{}',
 *   preview text,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now(),
 *   last_opened_at timestamptz,
 *   archived_at timestamptz
 * );
 *
 * alter table artefacts enable row level security;
 * create policy "Users own their artefacts" on artefacts
 *   for all using (auth.uid() = user_id);
 *
 * create index artefacts_user_level on artefacts(user_id, level);
 * create index artefacts_user_type on artefacts(user_id, type);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type ArtefactType = 'prompt' | 'agent' | 'workflow' | 'dashboard' | 'app_spec';

export interface Artefact {
  id: string;
  name: string;
  type: ArtefactType;
  level: number;
  preview: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date | null;
}

export interface ArtefactContent {
  promptText?: string;
  persona?: string;
  systemPrompt?: string;
  constraints?: string[];
  summary?: string;
  nodeCount?: number;
  agentCount?: number;
  humanCheckpoints?: number;
  nodes?: { name: string }[];
  title?: string;
  description?: string;
  componentCount?: number;
  layout?: Record<string, unknown>;
  userTypes?: string[];
  spec?: Record<string, unknown>;
}

export interface ArtefactWithContent extends Artefact {
  content: ArtefactContent;
}

// ── Mock data (TODO: Replace with Supabase queries) ──────────────────────

const MOCK_ARTEFACTS: Artefact[] = [
  {
    id: 'a1',
    name: 'Customer Onboarding Email Prompt',
    type: 'prompt',
    level: 1,
    preview: 'Write a personalised onboarding email for a new SaaS customer. Include their company name, the plan they selected, and three quick-start tips tailored to their industry…',
    createdAt: new Date('2026-03-07T10:30:00'),
    updatedAt: new Date('2026-03-07T10:30:00'),
    lastOpenedAt: new Date('2026-03-08T14:00:00'),
  },
  {
    id: 'a2',
    name: 'Weekly Report Summariser',
    type: 'prompt',
    level: 1,
    preview: 'Summarise this weekly team update into three sections: Achievements, Blockers, and Next Steps. Use bullet points and keep each section under 50 words…',
    createdAt: new Date('2026-03-05T09:00:00'),
    updatedAt: new Date('2026-03-06T11:00:00'),
    lastOpenedAt: new Date('2026-03-06T11:00:00'),
  },
  {
    id: 'a3',
    name: 'HR Policy Q&A Agent',
    type: 'agent',
    level: 2,
    preview: '"Friendly HR advisor — You are an internal HR assistant that answers employee questions about company policies…"',
    createdAt: new Date('2026-03-04T15:00:00'),
    updatedAt: new Date('2026-03-04T15:00:00'),
    lastOpenedAt: new Date('2026-03-07T09:30:00'),
  },
  {
    id: 'a4',
    name: 'Client Brief Analyst',
    type: 'agent',
    level: 2,
    preview: '"Strategic consultant — Analyse client briefs and extract key requirements, budget constraints, timeline expectations…"',
    createdAt: new Date('2026-03-03T12:00:00'),
    updatedAt: new Date('2026-03-03T12:00:00'),
    lastOpenedAt: null,
  },
  {
    id: 'a5',
    name: 'Invoice Processing Pipeline',
    type: 'workflow',
    level: 3,
    preview: '6 nodes · 2 agents — Automated invoice intake, extraction, validation, approval routing, and payment scheduling',
    createdAt: new Date('2026-03-02T14:00:00'),
    updatedAt: new Date('2026-03-02T14:00:00'),
    lastOpenedAt: new Date('2026-03-08T10:00:00'),
  },
  {
    id: 'a6',
    name: 'Content Review Workflow',
    type: 'workflow',
    level: 3,
    preview: '4 nodes · 1 agent — Draft review, AI quality check, human approval gate, and publication trigger',
    createdAt: new Date('2026-03-01T10:00:00'),
    updatedAt: new Date('2026-03-01T10:00:00'),
    lastOpenedAt: new Date('2026-03-05T16:00:00'),
  },
  {
    id: 'a7',
    name: 'Sales Performance Dashboard',
    type: 'dashboard',
    level: 4,
    preview: '8 components — Real-time sales metrics with AI-generated insights, pipeline forecasts, and team performance comparisons',
    createdAt: new Date('2026-02-28T11:00:00'),
    updatedAt: new Date('2026-02-28T11:00:00'),
    lastOpenedAt: new Date('2026-03-06T14:00:00'),
  },
  {
    id: 'a8',
    name: 'Team Wellbeing Tracker',
    type: 'app_spec',
    level: 5,
    preview: '"Manager, Employee, HR Admin — A lightweight app that collects weekly pulse surveys and uses AI to surface trends…"',
    createdAt: new Date('2026-02-25T09:00:00'),
    updatedAt: new Date('2026-02-25T09:00:00'),
    lastOpenedAt: new Date('2026-03-04T11:00:00'),
  },
];

const MOCK_CONTENT: Record<string, ArtefactContent> = {
  a1: {
    promptText:
      'Write a personalised onboarding email for a new SaaS customer.\n\nContext:\n- Company name: {{company_name}}\n- Plan selected: {{plan_name}}\n- Industry: {{industry}}\n\nRequirements:\n1. Open with a warm, professional greeting that references their company by name\n2. Confirm their plan and what it includes\n3. Provide three quick-start tips tailored to their industry\n4. Include a clear call-to-action to book an onboarding call\n5. Sign off with the customer success team name\n\nTone: Warm, confident, helpful. Not overly casual.\nLength: 200-300 words.',
  },
  a2: {
    promptText:
      'Summarise this weekly team update into three sections:\n\n1. **Achievements** — What was completed this week\n2. **Blockers** — What is preventing progress\n3. **Next Steps** — What is planned for next week\n\nUse bullet points. Keep each section under 50 words.\nIf no blockers are mentioned, write "No blockers reported."\n\nInput:\n{{weekly_update_text}}',
  },
  a3: {
    persona: 'Friendly HR advisor',
    systemPrompt:
      'You are an internal HR assistant that answers employee questions about company policies, benefits, leave entitlements, and workplace procedures. Always reference the specific policy document when answering. If you are unsure, say so and direct the employee to their HR business partner.',
    constraints: [
      'Never give legal advice — always recommend consulting Legal for legal questions',
      'Do not discuss individual employee cases or performance reviews',
      'Always cite the relevant policy section number',
      'Respond in a warm, approachable tone',
      'Keep answers under 200 words unless the question requires detailed explanation',
    ],
  },
  a4: {
    persona: 'Strategic consultant',
    systemPrompt:
      'Analyse client briefs and extract key requirements, budget constraints, timeline expectations, and success criteria. Present findings in a structured format that the account team can use for proposal development.',
    constraints: [
      'Always identify explicit vs. implied requirements',
      'Flag any missing information the client should provide',
      'Use the standard proposal framework for output structure',
    ],
  },
  a5: {
    summary:
      'Automated invoice intake, extraction, validation, approval routing, and payment scheduling',
    nodeCount: 6,
    agentCount: 2,
    humanCheckpoints: 1,
    nodes: [
      { name: 'Email intake trigger' },
      { name: 'PDF extraction agent' },
      { name: 'Data validation' },
      { name: 'Approval routing' },
      { name: 'Human review checkpoint' },
      { name: 'Payment scheduling' },
    ],
  },
  a6: {
    summary:
      'Draft review, AI quality check, human approval gate, and publication trigger',
    nodeCount: 4,
    agentCount: 1,
    humanCheckpoints: 1,
    nodes: [
      { name: 'Draft submission' },
      { name: 'AI quality review' },
      { name: 'Human approval gate' },
      { name: 'Publish to CMS' },
    ],
  },
  a7: {
    title: 'Sales Performance Dashboard',
    description:
      'Real-time sales metrics with AI-generated insights, pipeline forecasts, and team performance comparisons. Designed for regional sales managers who need a daily snapshot of their team\'s progress.',
    componentCount: 8,
    layout: { type: 'grid', columns: 3 },
  },
  a8: {
    title: 'Team Wellbeing Tracker',
    description:
      'A lightweight app that collects weekly pulse surveys and uses AI to surface trends, flag concerns early, and recommend interventions to managers.',
    userTypes: ['Manager', 'Employee', 'HR Admin'],
    spec: {
      summary:
        'Three-role application with weekly pulse collection, AI trend analysis, and manager-facing dashboards with recommended actions.',
    },
  },
};

// ── Hook ──────────────────────────────────────────────────────────────────

export function useArtefactsData() {
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [loading, setLoading] = useState(true);
  const contentCache = useRef<Record<string, ArtefactContent>>({});

  // Load all artefacts (without content) on mount
  useEffect(() => {
    // TODO: Replace with Supabase query:
    // select id, name, type, level, preview, created_at, updated_at, last_opened_at
    // from artefacts where user_id = {userId} and archived_at is null order by created_at desc
    const timer = setTimeout(() => {
      setArtefacts([...MOCK_ARTEFACTS]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Load content for a single artefact
  const loadContent = useCallback(async (id: string): Promise<ArtefactContent | null> => {
    if (contentCache.current[id]) return contentCache.current[id];
    // TODO: Replace with Supabase query:
    // select content from artefacts where id = {id} and user_id = {userId}
    // Also: update artefacts set last_opened_at = now() where id = {id}
    return new Promise((resolve) => {
      setTimeout(() => {
        const content = MOCK_CONTENT[id] || null;
        if (content) contentCache.current[id] = content;
        resolve(content);
      }, 150);
    });
  }, []);

  // Rename artefact
  const renameArtefact = useCallback(async (id: string, newName: string): Promise<boolean> => {
    // TODO: Replace with Supabase:
    // update artefacts set name = {newName}, updated_at = now() where id = {id} and user_id = {userId}
    setArtefacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: newName, updatedAt: new Date() } : a))
    );
    return true;
  }, []);

  // Duplicate artefact
  const duplicateArtefact = useCallback(async (id: string): Promise<Artefact | null> => {
    const source = artefacts.find((a) => a.id === id);
    if (!source) return null;
    // TODO: Replace with Supabase insert...returning
    const newArtefact: Artefact = {
      ...source,
      id: `dup-${Date.now()}`,
      name: `${source.name} (copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: null,
    };
    setArtefacts((prev) => [newArtefact, ...prev]);
    // Copy cached content if available
    if (contentCache.current[id]) {
      contentCache.current[newArtefact.id] = { ...contentCache.current[id] };
    }
    return newArtefact;
  }, [artefacts]);

  // Archive artefact
  const archiveArtefact = useCallback(async (id: string): Promise<boolean> => {
    // TODO: Replace with Supabase:
    // update artefacts set archived_at = now(), updated_at = now() where id = {id} and user_id = {userId}
    setArtefacts((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  // Update last_opened_at
  const markOpened = useCallback(async (id: string) => {
    // TODO: Replace with Supabase:
    // update artefacts set last_opened_at = now() where id = {id}
    setArtefacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lastOpenedAt: new Date() } : a))
    );
  }, []);

  // Update content (for inline editing like prompt text)
  const updateContent = useCallback(async (id: string, content: ArtefactContent): Promise<boolean> => {
    // TODO: Replace with Supabase:
    // update artefacts set content = {content}, updated_at = now() where id = {id} and user_id = {userId}
    contentCache.current[id] = content;
    setArtefacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, updatedAt: new Date() } : a))
    );
    return true;
  }, []);

  return {
    artefacts,
    loading,
    loadContent,
    renameArtefact,
    duplicateArtefact,
    archiveArtefact,
    markOpened,
    updateContent,
  };
}