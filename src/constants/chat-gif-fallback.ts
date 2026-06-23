export interface ChatGifItem {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  tags: string[];
}

/** Offline fallback when Tenor API key is not configured. */
export const CHAT_GIF_FALLBACK: ChatGifItem[] = [
  {
    id: "love-1",
    title: "Love",
    url: "https://media.giphy.com/media/26BRuo6sKon2OyMoU/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26BRuo6sKon2OyMoU/200w.gif",
    tags: ["love", "heart", "cute"],
  },
  {
    id: "happy-1",
    title: "Happy",
    url: "https://media.giphy.com/media/5GoVLqeAIo5Po/giphy.gif",
    previewUrl: "https://media.giphy.com/media/5GoVLqeAIo5Po/200w.gif",
    tags: ["happy", "excited", "yay"],
  },
  {
    id: "laugh-1",
    title: "Laughing",
    url: "https://media.giphy.com/media/13CoXD01Cc1hne/giphy.gif",
    previewUrl: "https://media.giphy.com/media/13CoXD01Cc1hne/200w.gif",
    tags: ["laugh", "lol", "funny"],
  },
  {
    id: "kiss-1",
    title: "Kiss",
    url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif",
    tags: ["kiss", "love", "romantic"],
  },
  {
    id: "hug-1",
    title: "Hug",
    url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVy/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVy/200w.gif",
    tags: ["hug", "cuddle", "love"],
  },
  {
    id: "wink-1",
    title: "Wink",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif",
    tags: ["wink", "flirt", "cute"],
  },
  {
    id: "sad-1",
    title: "Sad",
    url: "https://media.giphy.com/media/3o7TKUAlvi1JkuGIs0/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7TKUAlvi1JkuGIs0/200w.gif",
    tags: ["sad", "cry", "upset"],
  },
  {
    id: "angry-1",
    title: "Angry",
    url: "https://media.giphy.com/media/11sBL6HsDJlmCY/giphy.gif",
    previewUrl: "https://media.giphy.com/media/11sBL6HsDJlmCY/200w.gif",
    tags: ["angry", "mad", "annoyed"],
  },
  {
    id: "think-1",
    title: "Thinking",
    url: "https://media.giphy.com/media/3o7TKRnAoRaLrpB7Fu/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7TKRnAoRaLrpB7Fu/200w.gif",
    tags: ["think", "hmm", "curious"],
  },
  {
    id: "sleep-1",
    title: "Sleepy",
    url: "https://media.giphy.com/media/3o6Zt4HUhq7h4x3Bvi/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o6Zt4HUhq7h4x3Bvi/200w.gif",
    tags: ["sleep", "tired", "night"],
  },
  {
    id: "party-1",
    title: "Party",
    url: "https://media.giphy.com/media/l0MYK8RafaM3XSo768/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l0MYK8RafaM3XSo768/200w.gif",
    tags: ["party", "celebrate", "dance"],
  },
  {
    id: "fire-1",
    title: "Fire",
    url: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/200w.gif",
    tags: ["fire", "lit", "hot"],
  },
  {
    id: "clap-1",
    title: "Clapping",
    url: "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif",
    previewUrl: "https://media.giphy.com/media/7rj2ZgttvgomY/200w.gif",
    tags: ["clap", "applause", "bravo"],
  },
  {
    id: "wave-1",
    title: "Wave hello",
    url: "https://media.giphy.com/media/3o6Zt6ML6B3c27n316/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o6Zt6ML6B3c27n316/200w.gif",
    tags: ["wave", "hello", "hi"],
  },
  {
    id: "ok-1",
    title: "OK",
    url: "https://media.giphy.com/media/ZqlvCTNHmhrio/giphy.gif",
    previewUrl: "https://media.giphy.com/media/ZqlvCTNHmhrio/200w.gif",
    tags: ["ok", "yes", "sure"],
  },
  {
    id: "heart-eyes-1",
    title: "Heart eyes",
    url: "https://media.giphy.com/media/26BRvFzbNMRZZwFYN/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26BRvFzbNMRZZwFYN/200w.gif",
    tags: ["heart", "eyes", "love", "cute"],
  },
  {
    id: "blush-1",
    title: "Blushing",
    url: "https://media.giphy.com/media/l0MYGBRNDTxYoda76/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l0MYGBRNDTxYoda76/200w.gif",
    tags: ["blush", "shy", "cute"],
  },
  {
    id: "goodnight-1",
    title: "Good night",
    url: "https://media.giphy.com/media/3o6Zt4819NFkrSyFWM/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o6Zt4819NFkrSyFWM/200w.gif",
    tags: ["goodnight", "night", "sleep"],
  },
  {
    id: "goodmorning-1",
    title: "Good morning",
    url: "https://media.giphy.com/media/3o6Zt8MXCFv0Vpp3Nu/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o6Zt8MXCFv0Vpp3Nu/200w.gif",
    tags: ["morning", "hello", "sun"],
  },
  {
    id: "miss-1",
    title: "Miss you",
    url: "https://media.giphy.com/media/l0HlNQ03J5JxXjlle/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l0HlNQ03J5JxXjlle/200w.gif",
    tags: ["miss", "love", "you"],
  },
  {
    id: "thanks-1",
    title: "Thank you",
    url: "https://media.giphy.com/media/OSGURec6pXSda/giphy.gif",
    previewUrl: "https://media.giphy.com/media/OSGURec6pXSda/200w.gif",
    tags: ["thanks", "thank", "grateful"],
  },
  {
    id: "sorry-1",
    title: "Sorry",
    url: "https://media.giphy.com/media/3o7TKU5cJc8D3W1hBu/giphy.gif",
    previewUrl: "https://media.giphy.com/media/3o7TKU5cJc8D3W1hBu/200w.gif",
    tags: ["sorry", "apologize"],
  },
  {
    id: "dance-1",
    title: "Dance",
    url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26u4cqiYI30juCOGY/200w.gif",
    tags: ["dance", "fun", "happy"],
  },
  {
    id: "cat-1",
    title: "Cute cat",
    url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
    previewUrl: "https://media.giphy.com/media/13HgwGsXF0aiGY/200w.gif",
    tags: ["cat", "cute", "animal"],
  },
];

export function searchFallbackGifs(query: string): ChatGifItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return CHAT_GIF_FALLBACK;
  return CHAT_GIF_FALLBACK.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.tags.some((t) => t.includes(q) || q.includes(t)),
  );
}
