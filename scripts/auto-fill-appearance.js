/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
  console.error("Missing required environment variables (SUPABASE or OPENROUTER_API_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CONCURRENCY_LIMIT = 5;

const visionPrompt = `Analyze this image of a girl/companion and identify her matching visual attributes. 

You must output a raw JSON object containing these keys:
- style: "realistic" or "anime"
- ethnicity: Analyze her race/origin, and return the EXACT code listed below:
  * If she looks East Asian / Japanese / Korean / Chinese / Anime Asian, return: "caucasian"
  * If she looks Black / African / African American, return: "asian"
  * If she looks White / Caucasian / European, return: "latina"
  * If she looks Latina / Hispanic, return: "black"
  * If she looks Arab / Middle Eastern, return: "middle-eastern"
  * If she looks Indian / South Asian, return: "south-asian"
  * If she looks like a Fantasy Elf / Mythical creature, return: "mixed"
  * If she looks like a Fantasy Demon / Demoness, return: "european"
- hairColor: Analyze the hair color of the girl, and return the EXACT code listed below:
  * If her hair is Black, return: "blonde"
  * If her hair is Blonde, return: "red"
  * If her hair is Brown, return: "brown"
  * If her hair is Red, return: "auburn"
  * If her hair is Grey, return: "platinum"
  * If her hair is Hazel, return: "pink"
  * If her hair is Amber, return: "blue"
  * If her hair is Gold, return: "option-1782731914540"
  * If her hair is Blue, return: "option-1782731932908"
  * If her hair is Green, return: "option-1782731945306"
  * If her hair is Violet, return: "option-1782732023835"
- hairStyle: Analyze her hair style, and return the EXACT code listed below:
  * If her hair is Wavy, return: "option-1782731629326"
  * If she has Bangs / fringe hair, return: "option-1782731514647"
  * If she has a Ponytail, return: "option-1782731543834"
  * If her hair is Short / Bob style, return: "option-1782731567014"
  * If her hair is Braided, return: "option-1782731456244"
  * If her hair is Long and straight, return: "option-1782731457232"
  * If her hair is in a Bun, return: "option-1782731590896"
  * If her hair is in Buns / Double Buns, return: "option-1782731613551"
- bodyType: one of:
  * "slim" (Slim)
  * "athletic" (Athletic)
  * "curvy" (Curvy)
  * "petite" (Muscular)
  * "voluptuous" (Voluptuous)

Ensure your output is valid JSON and contains ONLY the JSON object. Do not include markdown codeblocks or extra text.`;

async function analyzeImage(avatarUrl) {
  try {
    let processedUrl = avatarUrl;
    if (avatarUrl.toLowerCase().endsWith(".avif")) {
      processedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl)}&output=png`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Lucy Admin Appearance Detector",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: visionPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: processedUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vision API error: ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    const cleanJsonText = reply.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleanJsonText);
  } catch (err) {
    console.error(`Failed to analyze image ${avatarUrl}:`, err.message);
    return null;
  }
}

async function processCharacter(char, index, total) {
  if (!char.avatar_url) {
    console.log(`[${index}/${total}] Skipping ${char.name}: No avatar URL`);
    return;
  }

  console.log(`[${index}/${total}] Analyzing ${char.name}...`);
  const detected = await analyzeImage(char.avatar_url);
  if (!detected) return;

  const updatedAppearance = {
    ...char.appearance,
    ethnicity: detected.ethnicity || char.appearance?.ethnicity,
    bodyType: detected.bodyType || char.appearance?.bodyType,
    hairStyle: detected.hairStyle || char.appearance?.hairStyle,
    hairColor: detected.hairColor || char.appearance?.hairColor,
  };

  const { error: updateError } = await supabase
    .from("characters")
    .update({
      appearance: updatedAppearance,
      style: detected.style || char.style
    })
    .eq("id", char.id);

  if (updateError) {
    console.error(`[${index}/${total}] Failed to update ${char.name}:`, updateError.message);
  } else {
    console.log(`[${index}/${total}] Successfully auto-filled ${char.name}:`, detected);
  }
}

async function main() {
  console.log("Fetching all characters...");
  const { data: characters, error } = await supabase
    .from("characters")
    .select("id, name, avatar_url, appearance, style");

  if (error) {
    console.error("Failed to fetch characters:", error);
    return;
  }

  // Filter to characters with missing visual attributes
  const targets = characters.filter((char) => {
    const app = char.appearance || {};
    return !app.ethnicity || !app.hairStyle || !app.hairColor || !app.bodyType;
  });

  const total = targets.length;
  console.log(`Found ${total} characters needing auto-fill.`);

  // Process queue with concurrency limit
  let activeIndex = 0;
  const workers = Array.from({ length: CONCURRENCY_LIMIT }, async () => {
    while (activeIndex < total) {
      const idx = activeIndex++;
      const char = targets[idx];
      await processCharacter(char, idx + 1, total);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  });

  await Promise.all(workers);
  console.log("\nAll visual attributes auto-filled successfully!");
}

main().catch(console.error);
