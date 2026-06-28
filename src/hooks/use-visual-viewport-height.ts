"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const KEYBOARD_HEIGHT_RATIO = 0.85;

export interface VisualViewportState {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
  keyboardOpen: boolean;
}

function readVisualViewport(): VisualViewportState {
  if (typeof window === "undefined") {
    return { height: 0, width: 0, offsetTop: 0, offsetLeft: 0, keyboardOpen: false };
  }

  const vv = window.visualViewport;
  if (vv) {
    const height = vv.height;
    return {
      height,
      width: vv.width,
      offsetTop: vv.offsetTop,
      offsetLeft: vv.offsetLeft,
      keyboardOpen: height < window.innerHeight * KEYBOARD_HEIGHT_RATIO,
    };
  }

  return {
    height: window.innerHeight,
    width: window.innerWidth,
    offsetTop: 0,
    offsetLeft: 0,
    keyboardOpen: false,
  };
}

/** Tracks iOS/Android visual viewport — shrinks when the software keyboard opens. */
export function useVisualViewport() {
  const [state, setState] = useState<VisualViewportState>(readVisualViewport);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setState(readVisualViewport());
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(rafId);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const cssVars = useMemo(
    () =>
      ({
        "--vv-height": `${state.height}px`,
        "--vv-offset-top": `${state.offsetTop}px`,
        "--vv-width": `${state.width}px`,
        "--vv-offset-left": `${state.offsetLeft}px`,
      }) as CSSProperties,
    [state.height, state.offsetTop, state.width, state.offsetLeft],
  );

  const shellStyle = useMemo(
    (): CSSProperties => ({
      ...cssVars,
      position: "fixed",
      top: state.offsetTop,
      left: 0,
      right: 0,
      width: "100%",
      height: state.height,
    }),
    [cssVars, state.height, state.offsetTop],
  );

  return { ...state, cssVars, shellStyle };
}

/** @deprecated Prefer `useVisualViewport()` — kept for backward compatibility. */
export function useVisualViewportHeight() {
  const { height, offsetTop } = useVisualViewport();
  return { height, offsetTop };
}

/** Reset iOS visual viewport scroll offset after input focus. */
export function resetVisualViewportScroll() {
  window.visualViewport?.scroll({ top: 0, left: 0 });
}
