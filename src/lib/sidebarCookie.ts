// Shared by the server layout (which reads the cookie to pick the initial
// width) and the client Sidebar (which writes it on toggle).
//
// This deliberately does NOT live in Sidebar.tsx: that file is "use client",
// and a plain constant imported from a client module into a Server Component
// arrives as a client-reference proxy rather than the string itself, so the
// cookie lookup silently misses and the sidebar always renders expanded.
export const COLLAPSE_COOKIE_NAME = "s360_sidebar_collapsed";
export const COLLAPSE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
