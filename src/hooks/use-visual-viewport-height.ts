"use client";

import { useEffect, useState } from "react";

interface VisualViewportSize {
  height: number;
  offsetTop: number;
}

function readVisualViewport(): VisualViewportSize {
  if (typeof window === "undefined") {
    return { height: 0, offsetTop: 0 };
  }

  const vv = window.visualViewport;
  if (vv) {
    return { height: vv.height, offsetTop: vv.offsetTop };
  }

  return { height: window.innerHeight, offsetTop: 0 };
}

/** Tracks iOS/Android visual viewport — shrinks when the software keyboard opens. */
export function useVisualViewportHeight() {
  const [size, setSize] = useState<VisualViewportSize>(readVisualViewport);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setSize({ height: vv.height, offsetTop: vv.offsetTop });

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return size;
}
