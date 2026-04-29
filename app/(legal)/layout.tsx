/**
 * Phase 5 CD-01 — route group pass-through. The root layout (app/layout.tsx)
 * already mounts fonts, <Toaster />, <Analytics />, <SpeedInsights />.
 * This file exists only to logically group `/privacy` + `/terms` under the
 * (legal) route segment, which keeps top-level app/ uncluttered.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
