/** Tailwind breakpoints — keep JS media queries aligned with Tailwind classes. */
export const SM_BREAKPOINT_PX = 640;
export const MD_BREAKPOINT_PX = 768;
export const LG_BREAKPOINT_PX = 1024;

export const MD_MEDIA_QUERY = `(min-width: ${MD_BREAKPOINT_PX}px)` as const;
export const BELOW_MD_MEDIA_QUERY = `(max-width: ${MD_BREAKPOINT_PX - 1}px)` as const;
export const LG_MEDIA_QUERY = `(min-width: ${LG_BREAKPOINT_PX}px)` as const;
export const BELOW_LG_MEDIA_QUERY = `(max-width: ${LG_BREAKPOINT_PX - 1}px)` as const;

/** Touch devices up to tablet width — use for chat keyboard / visual viewport shell. */
export const TOUCH_CHAT_VIEWPORT_QUERY =
  `(max-width: ${LG_BREAKPOINT_PX - 1}px) and (pointer: coarse)` as const;
