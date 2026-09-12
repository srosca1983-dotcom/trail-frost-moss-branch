import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "./app-shell";

export function Desk({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (!authEnabled) return <AppShell>{children}</AppShell>;
  if (isPending) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-md bg-paper-2" />
          <div className="h-28 animate-pulse rounded-xl bg-paper-2" />
          <div className="h-48 animate-pulse rounded-xl bg-paper-2" />
        </div>
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <AppShell>{children}</AppShell>;
}
