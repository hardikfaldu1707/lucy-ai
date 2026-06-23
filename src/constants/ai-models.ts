// Fallback model catalog when OpenRouter list is unavailable.
// Live model lists come from the OpenRouter API in the admin panel.

export interface AiModelOption {
  id: string;
  label: string;
  provider: string;
}

// Free models for dev/testing — admin can enable these for users.
// Prefer Qwen/Gemma 4 when older :free models are removed from OpenRouter.
export const DEFAULT_FREE_MODELS: AiModelOption[] = [
  { id: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (free)", provider: "Qwen" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (free)", provider: "Google" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (free)", provider: "Meta" },
  { id: "microsoft/phi-3-mini-128k-instruct:free", label: "Phi-3 Mini (free)", provider: "Microsoft" },
];

export const AI_MODELS: AiModelOption[] = [
  ...DEFAULT_FREE_MODELS,
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", provider: "OpenAI" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic" },
  { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash", provider: "Google" },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B", provider: "Meta" },
  { id: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral" },
];

export const AI_MODEL_IDS: string[] = AI_MODELS.map((m) => m.id);

export function aiModelLabel(id: string | null | undefined): string {
  if (!id) return "Default";
  return AI_MODELS.find((m) => m.id === id)?.label ?? id;
}
