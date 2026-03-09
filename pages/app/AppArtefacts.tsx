import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtefactsData } from '../../hooks/useArtefactsData';
import type { ArtefactType, ArtefactContent } from '../../hooks/useArtefactsData';
import SearchFilterBar from '../../components/app/artefacts/SearchFilterBar';
import type { SortMode } from '../../components/app/artefacts/SearchFilterBar';
import ArtefactGrid from '../../components/app/artefacts/ArtefactGrid';
import QuickUsePanel from '../../components/app/artefacts/QuickUsePanel';
import { ToastContainer, showToast } from '../../components/app/Toast';
import { timeAgo } from '../../utils/timeAgo';

const AppArtefacts: React.FC = () => {
  const { artefactId } = useParams<{ artefactId?: string }>();
  const navigate = useNavigate();

  const {
    artefacts, loading, loadContent,
    renameArtefact, duplicateArtefact, archiveArtefact,
    markOpened, updateContent,
  } = useArtefactsData();

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<ArtefactType>>(new Set());
  const [activeLevels, setActiveLevels] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelContent, setPanelContent] = useState<ArtefactContent | null>(null);

  // Available levels (only levels that have artefacts)
  const availableLevels = useMemo(() => {
    const levels = new Set(artefacts.map((a) => a.level));
    return Array.from(levels).sort();
  }, [artefacts]);

  // Filter and sort
  const filteredArtefacts = useMemo(() => {
    let result = [...artefacts];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.preview && a.preview.toLowerCase().includes(q))
      );
    }

    // Type filter (OR)
    if (activeTypes.size > 0) {
      result = result.filter((a) => activeTypes.has(a.type));
    }

    // Level filter (OR)
    if (activeLevels.size > 0) {
      result = result.filter((a) => activeLevels.has(a.level));
    }

    // Sort
    if (sortMode === 'recent') {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortMode === 'oldest') {
      result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [artefacts, searchQuery, activeTypes, activeLevels, sortMode]);

  const hasActiveFilters = searchQuery.length > 0 || activeTypes.size > 0 || activeLevels.size > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveTypes(new Set());
    setActiveLevels(new Set());
  }, []);

  const toggleType = useCallback((t: ArtefactType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const toggleLevel = useCallback((l: number) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l); else next.add(l);
      return next;
    });
  }, []);

  // Open panel
  const openPanel = useCallback(async (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
    setPanelContent(null);
    navigate(`/app/artefacts/${id}`, { replace: true });
    markOpened(id);
    const content = await loadContent(id);
    setPanelContent(content);
  }, [navigate, loadContent, markOpened]);

  // Close panel
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedId(null);
    setPanelContent(null);
    setTimeout(() => navigate('/app/artefacts', { replace: true }), 250);
  }, [navigate]);

  // Handle URL-based panel open on mount
  useEffect(() => {
    if (artefactId && artefacts.length > 0 && !panelOpen) {
      const exists = artefacts.find((a) => a.id === artefactId);
      if (exists) {
        openPanel(artefactId);
      }
    }
  }, [artefactId, artefacts, panelOpen, openPanel]);

  // Actions
  const handleRename = useCallback(async (id: string, newName: string) => {
    const success = await renameArtefact(id, newName);
    if (!success) showToast("Couldn't save name. Try again.", 'error');
  }, [renameArtefact]);

  const handleDuplicate = useCallback(async (id: string) => {
    const result = await duplicateArtefact(id);
    if (result) showToast('Artefact duplicated.');
  }, [duplicateArtefact]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveArtefact(id);
    if (selectedId === id) closePanel();
    showToast('Artefact archived.');
  }, [archiveArtefact, selectedId, closePanel]);

  const handleUpdateContent = useCallback(async (id: string, content: ArtefactContent) => {
    await updateContent(id, content);
    setPanelContent(content);
    showToast('Changes saved.');
  }, [updateContent]);

  // Stats
  const totalCount = artefacts.length;
  const levelsRepresented = new Set(artefacts.map((a) => a.level)).size;
  const lastCreated = artefacts.length > 0
    ? artefacts.reduce((latest, a) => (a.createdAt > latest.createdAt ? a : latest))
    : null;

  const selectedArtefact = selectedId ? artefacts.find((a) => a.id === selectedId) || null : null;

  if (loading) {
    return (
      <div style={{ padding: '28px 36px', background: '#F7FAFC', minHeight: '100%' }}>
        <div
          style={{
            width: 24, height: 24,
            border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
            borderRadius: '50%', animation: 'artefactSpin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes artefactSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', background: '#F7FAFC', minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 20, animation: 'fadeSlideUp 0.3s ease-out both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1
              style={{
                fontSize: 28, fontWeight: 800, color: '#1A202C',
                letterSpacing: -0.4, margin: 0,
              }}
            >
              My Artefacts
            </h1>
            <p style={{ fontSize: 14, color: '#718096', marginTop: 5, margin: '5px 0 0' }}>
              Everything you've built. Find it, reuse it, improve it.
            </p>
          </div>

          {/* Stats strip */}
          {totalCount > 0 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 6 }}>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{totalCount}</div>
                <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>artefacts</div>
              </div>

              <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />

              {levelsRepresented > 0 && (
                <>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>{levelsRepresented}</div>
                    <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>levels</div>
                  </div>
                  <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />
                </>
              )}

              {lastCreated && (
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C' }}>
                    {timeAgo(lastCreated.createdAt)}
                  </div>
                  <div style={{ fontSize: 11, color: '#718096', fontWeight: 500 }}>last created</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ animation: 'fadeSlideUp 0.3s ease-out 60ms both' }}>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTypes={activeTypes}
          onToggleType={toggleType}
          activeLevels={activeLevels}
          onToggleLevel={toggleLevel}
          availableLevels={availableLevels}
          sortMode={sortMode}
          onSortChange={setSortMode}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Artefact Grid */}
      <ArtefactGrid
        artefacts={filteredArtefacts}
        selectedId={selectedId}
        hasArtefacts={artefacts.length > 0}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchQuery}
        onOpen={openPanel}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onRename={handleRename}
        onClearFilters={clearFilters}
      />

      {/* Quick-Use Panel */}
      <QuickUsePanel
        artefact={selectedArtefact}
        content={panelContent}
        isOpen={panelOpen}
        onClose={closePanel}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onUpdateContent={handleUpdateContent}
        filteredArtefacts={filteredArtefacts}
        onNavigate={openPanel}
      />

      <ToastContainer />
    </div>
  );
};

export default AppArtefacts;