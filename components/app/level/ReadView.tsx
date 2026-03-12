import React, { useState } from 'react';
import { BookOpen, ExternalLink, MessageSquare } from 'lucide-react';
import { ArticleData } from '../../../data/topicContent';

interface ReadViewProps {
  articles: ArticleData[];
  accentColor: string;
  accentDark: string;
  onCompletePhase: () => void;
}

const ReadView: React.FC<ReadViewProps> = ({ articles, accentColor, accentDark, onCompletePhase }) => {
  const [readArticles, setReadArticles] = useState<Set<number>>(new Set());

  const markRead = (idx: number) => {
    setReadArticles((prev) => new Set(prev).add(idx));
  };

  const allRead = readArticles.size >= articles.length;

  return (
    <div>
      {/* Hero section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`,
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <BookOpen size={20} color={accentColor} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
              Curated Reading
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Read these articles to deepen your understanding
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {readArticles.size} of {articles.length} read
          </div>
        </div>

        {/* Article cards */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {articles.map((article, idx) => {
              const isRead = readArticles.has(idx);
              return (
                <div
                  key={article.id}
                  style={{
                    borderRadius: 14,
                    border: isRead ? `1px solid ${accentColor}66` : '1px solid #E2E8F0',
                    background: isRead ? `${accentColor}08` : '#FFFFFF',
                    padding: '24px 28px',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: accentDark, background: `${accentColor}33`, padding: '3px 10px', borderRadius: 20 }}>
                          {article.source}
                        </span>
                        <span style={{ fontSize: 11, color: '#A0AEC0' }}>{article.readTime}</span>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', marginBottom: 6, lineHeight: 1.3 }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, marginBottom: 14 }}>
                        {article.desc}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (article.url === '#') e.preventDefault();
                            markRead(idx);
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 13, fontWeight: 600, color: accentDark, textDecoration: 'none',
                            padding: '6px 14px', borderRadius: 8, background: `${accentColor}22`, transition: 'background 0.15s',
                          }}
                        >
                          <ExternalLink size={12} />
                          {isRead ? 'Read again' : 'Read article'}
                        </a>
                        {isRead && (
                          <span style={{ fontSize: 12, color: accentDark, fontWeight: 600 }}>
                            ✓ Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reflection block — show per-article reflections if available, else generic */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '28px 32px',
          marginBottom: 24,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={18} color={accentDark} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accentDark, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Reflection
          </div>
          {articles.some((a) => a.reflection) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articles.filter((a) => a.reflection).map((a, i) => (
                <div key={i} style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 600 }}>Article {i + 1}:</span> {a.reflection}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7 }}>
              Consider how the concepts in these articles connect to your current role. What's one
              specific workflow where you could apply this thinking this week?
            </div>
          )}
        </div>
      </div>

      {/* Complete button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onCompletePhase}
          disabled={!allRead}
          onMouseEnter={(e) => {
            if (allRead) {
              (e.currentTarget as HTMLElement).style.background = accentDark;
              (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
            }
          }}
          onMouseLeave={(e) => {
            if (allRead) {
              (e.currentTarget as HTMLElement).style.background = accentColor;
              (e.currentTarget as HTMLElement).style.color = accentDark;
            }
          }}
          style={{
            background: allRead ? accentColor : '#E2E8F0',
            color: allRead ? accentDark : '#A0AEC0',
            border: 'none',
            borderRadius: 24,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: allRead ? 'pointer' : 'default',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {allRead ? 'Complete Reading →' : `Read all articles to continue (${readArticles.size}/${articles.length})`}
        </button>
      </div>
    </div>
  );
};

export default ReadView;
