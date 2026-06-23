-- Card preview media: optional loop video + display mode for browse/home cards
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS preview_video_url text,
  ADD COLUMN IF NOT EXISTS card_display_mode text NOT NULL DEFAULT 'image'
    CHECK (card_display_mode IN ('image', 'video'));
