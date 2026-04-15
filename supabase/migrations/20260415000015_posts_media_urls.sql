-- Migration: add media_urls array column to posts for carousel support
-- Allows up to 10 files per post (images, videos, PDFs)
-- Keeps media_url for backward compatibility (= media_urls[0])

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.posts.media_urls IS 'Array of media URLs for carousel posts (up to 10 files)';
