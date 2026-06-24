-- Structured character gallery with tags + video message type for chat.

ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'video';

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS gallery_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill gallery_items from gallery_urls and preview_video_url.
UPDATE characters c
SET gallery_items = COALESCE(
  (
    SELECT jsonb_agg(item ORDER BY ord)
    FROM (
      SELECT
        jsonb_build_object(
          'url', g.url,
          'type', 'image',
          'tags', '[]'::jsonb
        ) AS item,
        g.ord
      FROM unnest(c.gallery_urls) WITH ORDINALITY AS g(url, ord)
      UNION ALL
      SELECT
        jsonb_build_object(
          'url', c.preview_video_url,
          'type', 'video',
          'tags', '[]'::jsonb
        ),
        10000
      WHERE c.preview_video_url IS NOT NULL AND c.preview_video_url <> ''
    ) sub
  ),
  '[]'::jsonb
)
WHERE gallery_items = '[]'::jsonb OR gallery_items IS NULL;
