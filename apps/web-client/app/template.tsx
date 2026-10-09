import type { ReactNode } from "react";

/**
 * Unlike a layout, a template is re-created on every navigation, so each page fades in as the
 * route changes. The animation only changes opacity, which keeps `position: fixed` children
 * (the full-screen game page) working.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
