-- Per-character AI model selection (OpenRouter model id, e.g. "anthropic/claude-3.5-sonnet").
-- Nullable: a null value falls back to the OPENROUTER_MODEL env default at request time.
alter table characters add column if not exists ai_model text;
