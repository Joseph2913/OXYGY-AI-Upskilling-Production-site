import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { getArtefactCountsByLevel } from '../lib/database';
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

export function useToolkitData(): { data: ToolkitData | null; loading: boolean } {
  const { user } = useAuth();
  const { userProfile } = useAppContext();
  const [data, setData] = useState<ToolkitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const currentLevel = userProfile.currentLevel;
      const artefactCounts = await getArtefactCountsByLevel(user.id);

      const levelStats: ToolLevelStats[] = [1, 2, 3, 4, 5].map(lvl => {
        const tool = getPrimaryTool(lvl);
        const artefactsCreated = artefactCounts[lvl] || 0;
        return {
          levelNumber: lvl,
          toolId: tool?.id || '',
          artefactsCreated,
          pointsEarned: artefactsCreated * 30,
          timesUsed: artefactsCreated,
          unlocked: true, // All levels unlocked by default
        };
      });

      const totalArtefacts = levelStats.reduce((s, l) => s + l.artefactsCreated, 0);
      const totalPoints = levelStats.reduce((s, l) => s + l.pointsEarned, 0);
      const totalUsage = levelStats.reduce((s, l) => s + l.timesUsed, 0);

      setData({ currentLevel, totalArtefacts, totalPoints, totalUsage, levelStats });
      setLoading(false);
    })();
  }, [user, userProfile]);

  return { data, loading };
}
