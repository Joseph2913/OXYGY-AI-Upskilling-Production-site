import { useState, useEffect } from 'react';
import { getPrimaryTool } from '../data/toolkitData';

export interface ToolLevelStats {
  levelNumber: number;
  toolId: string;
  artefactsCreated: number;
  pointsEarned: number;
  timesUsed: number;
  unlocked: boolean;
}

export interface ToolkitData {
  currentLevel: number;
  totalArtefacts: number;
  totalPoints: number;
  totalUsage: number;
  levelStats: ToolLevelStats[];
}

/**
 * DEV MODE: Returns mock toolkit stats.
 * TODO: Replace with real Supabase queries when auth is wired up.
 */
export function useToolkitData(): { data: ToolkitData | null; loading: boolean } {
  const [data, setData] = useState<ToolkitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentLevel = 5;

      const levelStats: ToolLevelStats[] = [
        {
          levelNumber: 1,
          toolId: 'prompt-playground',
          artefactsCreated: 6,
          pointsEarned: 180,
          timesUsed: 14,
          unlocked: true,
        },
        {
          levelNumber: 2,
          toolId: 'agent-builder',
          artefactsCreated: 4,
          pointsEarned: 160,
          timesUsed: 9,
          unlocked: true,
        },
        {
          levelNumber: 3,
          toolId: 'workflow-canvas',
          artefactsCreated: 3,
          pointsEarned: 150,
          timesUsed: 7,
          unlocked: true,
        },
        {
          levelNumber: 4,
          toolId: 'dashboard-designer',
          artefactsCreated: 2,
          pointsEarned: 120,
          timesUsed: 5,
          unlocked: true,
        },
        {
          levelNumber: 5,
          toolId: 'ai-app-evaluator',
          artefactsCreated: 1,
          pointsEarned: 60,
          timesUsed: 3,
          unlocked: true,
        },
      ];

      const totalArtefacts = levelStats.reduce((s, l) => s + l.artefactsCreated, 0);
      const totalPoints = levelStats.reduce((s, l) => s + l.pointsEarned, 0);
      const totalUsage = levelStats.reduce((s, l) => s + l.timesUsed, 0);

      setData({ currentLevel, totalArtefacts, totalPoints, totalUsage, levelStats });
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
}