"use client";

import { useEffect, useState } from "react";
import { TOUCH_CHAT_VIEWPORT_QUERY } from "@/constants/breakpoints";

/** True on touch phones/tablets up to 1023px — enables visual-viewport keyboard shell. */
export function useTouchChatViewport(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(TOUCH_CHAT_VIEWPORT_QUERY);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return matches;
}
