import React, { useState } from 'react';
import { Play, Video, CheckCircle } from 'lucide-react';
import { VideoData } from '../../../data/topicContent';

interface WatchViewProps {
  videos: VideoData[];
  accentColor: string;
  accentDark: string;
  onCompletePhase: () => void;
}

const WatchView: React.FC<WatchViewProps> = ({ videos, accentColor, accentDark, onCompletePhase }) => {
  const [watchedVideos, setWatchedVideos] = useState<Set<number>>(new Set());
  const [activeQuiz, setActiveQuiz] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<number>>(new Set());

  const markWatched = (idx: number) => {
    setWatchedVideos((prev) => new Set(prev).add(idx));
    // If video has quiz, show it
    if (videos[idx]?.quiz?.length) {
      setActiveQuiz(idx);
    }
  };

  const handleQuizAnswer = (videoIdx: number, qIdx: number, optionIdx: number) => {
    const key = `${videoIdx}-${qIdx}`;
    setQuizAnswers((prev) => ({ ...prev, [key]: optionIdx }));
  };

  const isQuizComplete = (videoIdx: number): boolean => {
    const video = videos[videoIdx];
    if (!video?.quiz?.length) return true;
    return video.quiz.every((_, qIdx) => quizAnswers[`${videoIdx}-${qIdx}`] !== undefined);
  };

  const handleCompleteQuiz = (videoIdx: number) => {
    setCompletedQuizzes((prev) => new Set(prev).add(videoIdx));
    setActiveQuiz(null);
  };

  const allDone = videos.every((_, idx) => watchedVideos.has(idx) && (completedQuizzes.has(idx) || !videos[idx]?.quiz?.length));

  return (
    <div>
      {/* Hero section */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {/* Header strip */}
        <div style={{ background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Video size={20} color={accentColor} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>Curated Videos</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Watch these expert videos to build deeper understanding</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {watchedVideos.size} of {videos.length} watched
          </div>
        </div>

        {/* Video cards */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: videos.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
            {videos.map((video, idx) => {
              const isWatched = watchedVideos.has(idx);
              const quizDone = completedQuizzes.has(idx);
              return (
                <div key={video.id} style={{ borderRadius: 14, border: isWatched ? `1px solid ${accentColor}66` : '1px solid #E2E8F0', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  {/* 16:9 Thumbnail */}
                  <div onClick={() => markWatched(idx)} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isWatched ? (
                        <CheckCircle size={40} color={accentDark} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                        </div>
                      )}
                    </div>
                    <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>
                      {video.duration}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: accentDark, background: `${accentColor}33`, padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>
                      {video.channel}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4, lineHeight: 1.3 }}>{video.title}</div>
                    <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>{video.desc}</div>
                    {isWatched && video.quiz?.length > 0 && !quizDone && (
                      <button onClick={() => setActiveQuiz(idx)} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, border: 'none', background: accentColor, color: accentDark, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Take Quiz
                      </button>
                    )}
                    {quizDone && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: accentDark }}>✓ Quiz completed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quiz overlay */}
      {activeQuiz !== null && videos[activeQuiz]?.quiz && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '28px 32px', marginBottom: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 16 }}>
            Quiz — {videos[activeQuiz].title}
          </div>
          {videos[activeQuiz].quiz.map((q, qIdx) => {
            const key = `${activeQuiz}-${qIdx}`;
            const selected = quizAnswers[key] ?? null;
            return (
              <div key={qIdx} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 8, lineHeight: 1.5 }}>{qIdx + 1}. {q.q}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selected === oIdx;
                    const isCorrect = oIdx === q.correct;
                    const showResult = selected !== null;
                    let bg = '#F7FAFC';
                    let border = '1px solid #E2E8F0';
                    if (showResult && isCorrect) { bg = '#F0FFF4'; border = '1px solid #48BB78'; }
                    else if (showResult && isSelected && !isCorrect) { bg = '#FFF5F5'; border = '1px solid #FC8181'; }
                    else if (isSelected) { bg = '#E6FFFA'; border = `1px solid ${accentColor}`; }

                    return (
                      <button key={oIdx} onClick={() => handleQuizAnswer(activeQuiz, qIdx, oIdx)} disabled={selected !== null}
                        style={{ textAlign: 'left', padding: '8px 14px', borderRadius: 8, border, background: bg, cursor: selected !== null ? 'default' : 'pointer', fontSize: 13, color: '#4A5568', lineHeight: 1.5, transition: 'all 0.15s' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {isQuizComplete(activeQuiz) && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button onClick={() => handleCompleteQuiz(activeQuiz)} style={{ padding: '8px 24px', borderRadius: 20, border: 'none', background: accentColor, color: accentDark, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Complete Quiz →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Complete button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onCompletePhase}
          disabled={!allDone}
          onMouseEnter={(e) => { if (allDone) { (e.currentTarget as HTMLElement).style.background = accentDark; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; } }}
          onMouseLeave={(e) => { if (allDone) { (e.currentTarget as HTMLElement).style.background = accentColor; (e.currentTarget as HTMLElement).style.color = accentDark; } }}
          style={{
            background: allDone ? accentColor : '#E2E8F0',
            color: allDone ? accentDark : '#A0AEC0',
            border: 'none', borderRadius: 24, padding: '12px 32px',
            fontSize: 15, fontWeight: 700,
            cursor: allDone ? 'pointer' : 'default',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {allDone ? 'Complete Watch →' : `Watch all videos to continue (${watchedVideos.size}/${videos.length})`}
        </button>
      </div>
    </div>
  );
};

export default WatchView;
