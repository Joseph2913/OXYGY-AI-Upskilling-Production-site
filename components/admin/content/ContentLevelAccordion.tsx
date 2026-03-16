import React, { useState, useMemo } from 'react';
import { ChevronRight, Check, Minus } from 'lucide-react';
import AdminCard from '../AdminCard';
import AdminSectionLabel from '../AdminSectionLabel';
import { LEVEL_TOPICS, LEVEL_FULL_NAMES, LEVEL_ACCENT_COLORS, LEVEL_ACCENT_DARK_COLORS } from '../../../data/levelTopics';
import { TOPIC_CONTENT } from '../../../data/topicContent';

interface TopicStatus {
  level: number;
  topicId: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  hasContent: boolean;
  phases: {
    elearn: { available: boolean; count: number };
    read: { available: boolean; count: number };
    watch: { available: boolean; count: number };
    practice: { available: boolean };
  };
  overallStatus: 'published' | 'partial' | 'empty';
}

function getTopicStatus(level: number, topicId: number): TopicStatus {
  const content = TOPIC_CONTENT[`${level}-${topicId}`];
  const topic = (LEVEL_TOPICS[level] || []).find(t => t.id === topicId);

  const hasSlides = (content?.slides?.length || 0) > 0;
  const hasArticles = (content?.articles?.length || 0) > 0;
  const hasVideos = (content?.videos?.length || 0) > 0;

  const phases = {
    elearn: { available: hasSlides, count: content?.slides?.length || 0 },
    read: { available: hasArticles, count: content?.articles?.length || 0 },
    watch: { available: hasVideos, count: content?.videos?.length || 0 },
    practice: { available: true },
  };

  const phaseCount = [hasSlides, hasArticles, hasVideos].filter(Boolean).length;
  const overallStatus: TopicStatus['overallStatus'] = phaseCount === 0 ? 'empty' : phaseCount === 3 ? 'published' : 'partial';

  return {
    level, topicId,
    title: topic?.title || 'Unknown',
    subtitle: topic?.subtitle || '',
    estimatedMinutes: topic?.estimatedMinutes || 0,
    hasContent: phaseCount > 0,
    phases,
    overallStatus,
  };
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: '#C6F6D5', color: '#22543D', label: 'Published' },
  partial: { bg: '#FEFCBF', color: '#975A16', label: 'Partial' },
  empty: { bg: '#EDF2F7', color: '#A0AEC0', label: 'No Content' },
};

const PHASE_LABELS: Array<{ key: 'elearn' | 'read' | 'watch' | 'practice'; label: string }> = [
  { key: 'elearn', label: 'E-Learn' },
  { key: 'read', label: 'Read' },
  { key: 'watch', label: 'Watch' },
  { key: 'practice', label: 'Practice' },
];

const ContentLevelAccordion: React.FC = () => {
  const levels = [1, 2, 3, 4, 5];

  const levelData = useMemo(() => levels.map(level => {
    const topics = LEVEL_TOPICS[level] || [];
    const statuses = topics.map(t => getTopicStatus(level, t.id));
    const hasAnyContent = statuses.some(s => s.hasContent);
    return { level, name: LEVEL_FULL_NAMES[level], topics: statuses, hasAnyContent };
  }), []);

  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    levelData.forEach(ld => { init[ld.level] = ld.hasAnyContent; });
    return init;
  });

  const toggleLevel = (level: number) => {
    setExpanded(prev => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <AdminCard padding="0">
      <div style={{ padding: '20px 24px 0', marginBottom: 0 }}>
        <AdminSectionLabel text="Content By Level" />
      </div>

      {levelData.map(ld => {
        const isExpanded = expanded[ld.level];
        const accent = LEVEL_ACCENT_COLORS[ld.level];
        const accentDark = LEVEL_ACCENT_DARK_COLORS[ld.level];

        return (
          <div key={ld.level}>
            {/* Level header */}
            <button onClick={() => toggleLevel(ld.level)} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0', borderBottom: 'none',
              background: 'transparent', cursor: 'pointer', border: 'none',
              borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: '#E2E8F0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ChevronRight size={14} color="#A0AEC0" style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: accent, color: accentDark,
                }}>
                  L{ld.level}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
                  Level {ld.level}: {ld.name}
                </span>
                <span style={{ fontSize: 12, color: '#A0AEC0' }}>
                  ({ld.topics.filter(t => t.hasContent).length}/{ld.topics.length} topics)
                </span>
              </div>
              {!ld.hasAnyContent && (
                <span style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' }}>No content yet</span>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ paddingBottom: 12 }}>
                {!ld.hasAnyContent ? (
                  <div style={{
                    margin: '0 24px 16px', padding: '20px 24px',
                    background: '#F7FAFC', borderRadius: 10,
                    border: '1px dashed #E2E8F0', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, color: '#A0AEC0' }}>
                      No content has been created for this level yet.
                    </div>
                    <div style={{ fontSize: 11, color: '#CBD5E0', marginTop: 4 }}>
                      Content is added via the codebase — check data/topicContent.ts
                    </div>
                  </div>
                ) : (
                  ld.topics.map(topic => {
                    const badge = STATUS_BADGE[topic.overallStatus];
                    return (
                      <div key={topic.topicId} style={{
                        margin: '0 24px 12px', padding: '16px 20px',
                        background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
                            {topic.title}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                            background: badge.bg, color: badge.color,
                          }}>
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                          {topic.subtitle}
                        </div>
                        <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>
                          ~{topic.estimatedMinutes} min
                        </div>

                        {/* Phase indicators */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                          {PHASE_LABELS.map(ph => {
                            const phaseData = topic.phases[ph.key];
                            const available = ph.key === 'practice' ? phaseData.available : (phaseData as { available: boolean; count: number }).available;
                            const count = ph.key === 'practice' ? 0 : (phaseData as { available: boolean; count: number }).count;
                            return (
                              <div key={ph.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {available ? (
                                  <Check size={12} color="#48BB78" />
                                ) : (
                                  <Minus size={12} color="#CBD5E0" />
                                )}
                                <span style={{
                                  fontSize: 12, fontWeight: 500,
                                  color: available ? '#2D3748' : '#A0AEC0',
                                }}>
                                  {ph.label} {available && count > 0 ? `(${count})` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Preview link */}
                        {topic.overallStatus !== 'empty' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <a
                              href={`/app/level?level=${topic.level}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12, fontWeight: 600, color: '#38B2AC',
                                cursor: 'pointer', textDecoration: 'none',
                              }}
                            >
                              Preview →
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </AdminCard>
  );
};

export default ContentLevelAccordion;
