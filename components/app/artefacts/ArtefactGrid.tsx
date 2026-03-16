import React from 'react';
import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Bot, GitBranch, LayoutDashboard, Layers,
  BookOpen, FileText,
} from 'lucide-react';
import { LEVEL_FULL_NAMES } from '../../../data/levelTopics';
import ArtefactCard from './ArtefactCard';
import type { Artefact, ArtefactType } from '../../../hooks/useArtefactsData';

const TYPE_LABELS: Record<ArtefactType, string> = {
  prompt: 'Prompt', agent: 'Agent', workflow: 'Workflow', dashboard: 'Dashboard',
  app_spec: 'App Spec', build_guide: 'Build Guide', prd: 'PRD',
};

const GHOST_TYPES: { type: ArtefactType; level: number; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { type: 'prompt', level: 1, Icon: Zap },
  { type: 'agent', level: 2, Icon: Bot },
  { type: 'build_guide', level: 2, Icon: BookOpen },
  { type: 'workflow', level: 3, Icon: GitBranch },
  { type: 'prd', level: 4, Icon: FileText },
  { type: 'app_spec', level: 5, Icon: Layers },
];

interface Props {
  artefacts: Artefact[];
  selectedId: string | null;
  hasArtefacts: boolean;
  hasActiveFilters: boolean;
  searchQuery: string;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClearFilters: () => void;
}

const ArtefactGrid: React.FC<Props> = ({
  artefacts, selectedId, hasArtefacts, hasActiveFilters, searchQuery,
  onOpen, onDuplicate, onArchive, onRename, onClearFilters,
}) => {
  const navigate = useNavigate();

  // Empty state A: Zero artefacts
  if (!hasArtefacts) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {GHOST_TYPES.map(({ type, level, Icon }) => (
            <div
              key={type}
              style={{
                borderRadius: 14, border: '1px dashed #E2E8F0',
                background: '#FAFAFA', padding: '18px 20px', opacity: 0.7,
                display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8, background: '#F0F0F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={15} color="#CBD5E0" />
              </div>
              <div style={{ width: '60%', height: 14, background: '#E2E8F0', borderRadius: 6 }} />
              <div style={{ width: '90%', height: 10, background: '#F0F0F0', borderRadius: 4 }} />
              <div style={{ width: '70%', height: 10, background: '#F0F0F0', borderRadius: 4 }} />
              <div style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 10 }}>
                Complete {LEVEL_FULL_NAMES[level]} topics to create your first {TYPE_LABELS[type]}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
            Your artefacts appear here as you complete learning activities.
          </div>
          <button
            onClick={() => navigate('/app/level')}
            style={{
              background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 24,
              padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Go to Current Level →
          </button>
        </div>
      </div>
    );
  }

  // Empty state B/C: Filters or search active, no results
  if (artefacts.length === 0) {
    const isSearch = searchQuery.length > 0;
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <SearchX size={36} color="#CBD5E0" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
          {isSearch ? `No results for "${searchQuery}"` : 'No artefacts match your filters'}
        </div>
        <div style={{ fontSize: 13, color: '#718096', marginTop: 6 }}>
          {isSearch
            ? 'Check the spelling, or try searching for the artefact type instead.'
            : 'Try adjusting your search or removing a filter.'}
        </div>
        <button
          onClick={onClearFilters}
          style={{
            background: '#38B2AC', color: '#FFFFFF', border: 'none', borderRadius: 24,
            padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', marginTop: 16,
          }}
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {artefacts.map((a, i) => (
        <ArtefactCard
          key={a.id}
          artefact={a}
          isSelected={a.id === selectedId}
          index={i}
          onOpen={onOpen}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onRename={onRename}
        />
      ))}
    </div>
  );
};

export default ArtefactGrid;