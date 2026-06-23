import "server-only";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateCharacterImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_IMAGE_MODEL ?? "openai/gpt-4o-mini";

  // Use multimodal-capable model to produce an image URL via tool-style prompt.
  // Production: swap for Fal/Replicate dedicated image endpoint.
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_APP_URL
        ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: `Generate a tasteful portrait image for an AI companion app. Scene: ${prompt.slice(0, 400)}. Reply with only a direct HTTPS image URL if you have one, otherwise describe the image in one sentence.`,
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) return null;
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  const urlMatch = content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp)/i);
  return urlMatch?.[0] ?? null;
}
