-- Migration: Create curated_videos table
-- Run this in the Supabase SQL Editor before running 4-import-to-supabase.cjs

CREATE TABLE IF NOT EXISTS curated_videos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  level INT NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_tier INT,
  duration_seconds INT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TEXT,
  view_count INT,
  relevance_score FLOAT,
  learning_method_type TEXT,
  relevance_rationale TEXT,
  rank INT,          -- 1, 2, or 3 for primary picks; NULL for backup pool
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the main query patterns
CREATE INDEX IF NOT EXISTS idx_curated_videos_topic ON curated_videos (topic_id);
CREATE INDEX IF NOT EXISTS idx_curated_videos_level ON curated_videos (level);
CREATE INDEX IF NOT EXISTS idx_curated_videos_primary ON curated_videos (topic_id, is_primary);

-- Enable RLS but allow public read access (editorial content, not user data)
ALTER TABLE curated_videos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'curated_videos' AND policyname = 'curated_videos_public_read'
  ) THEN
    CREATE POLICY curated_videos_public_read ON curated_videos FOR SELECT USING (true);
  END IF;
END $$;
