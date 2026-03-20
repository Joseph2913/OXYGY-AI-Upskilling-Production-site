import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getArtefacts as dbGetArtefacts,
  getArtefactContent as dbGetArtefactContent,
  renameArtefact as dbRenameArtefact,
  duplicateArtefact as dbDuplicateArtefact,
  archiveArtefact as dbArchiveArtefact,
  updateArtefactContent as dbUpdateArtefactContent,
} from '../lib/database';
import type { Artefact as DbArtefact, ArtefactContent as DbArtefactContent, ArtefactType as DbArtefactType } from '../lib/database';

export type ArtefactType = DbArtefactType;

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
  // ── Prompt (Level 1) ──
  promptText?: string;
  strategies?: Array<{
    name: string;
    why: string;
    how_applied: string;
    prompt_excerpt: string;
  }>;
  userInput?: string;

  // ── Agent (Level 2) ──
  systemPrompt?: string;
  outputFormat?: {
    json_template?: Record<string, unknown>;
    human_readable?: string;
  };
  accountability?: Array<{
    name: string;
    prompt_instruction: string;
    severity: string;
  }>;
  readinessScore?: number;
  taskDescription?: string;
  inputDescription?: string;

  // ── Shared: persona / constraints (legacy mock format) ──
  persona?: string;
  constraints?: string[];

  // ── Build Guide (Levels 2–5) ──
  markdown?: string;
  platform?: string;
  toolName?: string;

  // ── Workflow (Level 3) ──
  designMarkdown?: string;
  nodeCount?: number;
  agentCount?: number;
  humanCheckpoints?: number;
  nodes?: Array<{ name: string; type?: string }>;
  workflowName?: string;

  // ── PRD (Level 4) ──
  prdMarkdown?: string;
  sections?: Array<Record<string, unknown>>;
  brief?: Record<string, unknown>;

  // ── Dashboard (Level 4) ──
  mockupHtml?: string;
  componentCount?: number;
  description?: string;
  title?: string;

  // ── App Spec (Level 5) ──
  evaluationMarkdown?: string;
  designScore?: number;
  architectureSections?: Array<Record<string, unknown>>;
  appDescription?: string;
  problemStatement?: string;
  userTypes?: string[];
  spec?: Record<string, unknown>;
  layout?: Record<string, unknown>;

  // ── Project Proof ──
  submissionId?: string;
  tier?: string;
  tierLabel?: string;
  reflectionText?: string;
  adoptionScope?: string;
  outcomeText?: string;
  reviewDimensions?: Array<{
    id: string;
    name: string;
    status: 'strong' | 'developing' | 'needs_attention';
    feedback: string;
  }>;
  reviewSummary?: string;
  reviewEncouragement?: string;
  reviewPassed?: boolean;
  screenshotPaths?: string[];
  caseStudyProblem?: string;
  caseStudySolution?: string;
  caseStudyOutcome?: string;
  caseStudyLearnings?: string;

  // ── Generic fallback ──
  summary?: string;
  [key: string]: unknown;
}

export interface ArtefactWithContent extends Artefact {
  content: ArtefactContent;
}

function toArtefact(db: DbArtefact): Artefact {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    level: db.level,
    preview: db.preview || null,
    createdAt: db.createdAt,
    updatedAt: db.updatedAt,
    lastOpenedAt: db.lastOpenedAt,
  };
}

// ── Hook ──

export function useArtefactsData() {
  const { user } = useAuth();
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [loading, setLoading] = useState(true);
  const contentCache = useRef<Record<string, ArtefactContent>>({});

  // Load all artefacts on mount
  useEffect(() => {
    if (!user) {
      setArtefacts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const data = await dbGetArtefacts(user!.id);
      if (!cancelled) {
        setArtefacts(data.map(toArtefact));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Load content for a single artefact
  const loadContent = useCallback(async (id: string): Promise<ArtefactContent | null> => {
    if (contentCache.current[id]) return contentCache.current[id];
    if (!user) return null;
    const content = await dbGetArtefactContent(id, user.id);
    if (content) contentCache.current[id] = content as ArtefactContent;
    return (content as ArtefactContent) || null;
  }, [user]);

  // Rename artefact
  const renameArtefact = useCallback(async (id: string, newName: string): Promise<boolean> => {
    if (!user) return false;
    const ok = await dbRenameArtefact(id, user.id, newName);
    if (ok) {
      setArtefacts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: newName, updatedAt: new Date() } : a))
      );
    }
    return ok;
  }, [user]);

  // Duplicate artefact
  const duplicateArtefact = useCallback(async (id: string): Promise<Artefact | null> => {
    if (!user) return null;
    const copy = await dbDuplicateArtefact(id, user.id);
    if (!copy) return null;
    const artefact = toArtefact(copy);
    setArtefacts((prev) => [artefact, ...prev]);
    // Copy cached content if available
    if (contentCache.current[id]) {
      contentCache.current[artefact.id] = { ...contentCache.current[id] };
    }
    return artefact;
  }, [user]);

  // Archive artefact
  const archiveArtefact = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    const ok = await dbArchiveArtefact(id, user.id);
    if (ok) {
      setArtefacts((prev) => prev.filter((a) => a.id !== id));
    }
    return ok;
  }, [user]);

  // Update last_opened_at (optimistic update; actual DB update happens in loadContent)
  const markOpened = useCallback(async (id: string) => {
    setArtefacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lastOpenedAt: new Date() } : a))
    );
  }, []);

  // Update content
  const updateContent = useCallback(async (id: string, content: ArtefactContent): Promise<boolean> => {
    if (!user) return false;
    const ok = await dbUpdateArtefactContent(id, user.id, content as DbArtefactContent);
    if (ok) {
      contentCache.current[id] = content;
      setArtefacts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, updatedAt: new Date() } : a))
      );
    }
    return ok;
  }, [user]);

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
