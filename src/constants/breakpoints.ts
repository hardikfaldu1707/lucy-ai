/** Tailwind `md` breakpoint — keep JS media queries aligned with Tailwind classes. */
export const MD_BREAKPOINT_PX = 768;

export const MD_MEDIA_QUERY = `(min-width: ${MD_BREAKPOINT_PX}px)` as const;
export const BELOW_MD_MEDIA_QUERY = `(max-width: ${MD_BREAKPOINT_PX - 1}px)` as const;
