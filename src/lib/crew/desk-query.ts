import type { QueryClient } from "@tanstack/react-query";

const KEYS = [
  "crew",
  "ship-roster",
  "dashboard",
  "expiring",
  "nse-board",
  "inbox-log",
  "vessel-run",
  "permanents",
  "requirements",
  "sms-sync",
] as const;

/** Refresh desk lists without refetching every query in the app. */
export function invalidateDesk(qc: QueryClient) {
  for (const key of KEYS) void qc.invalidateQueries({ queryKey: [key] });
}
