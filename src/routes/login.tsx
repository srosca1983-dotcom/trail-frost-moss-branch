import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { VESSEL } from "@/lib/crew/types";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  if (!authEnabled) return <Navigate to="/" />;
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Sunrise Vessel Operations</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Crew Ledger</h1>
        <p className="mt-2 text-sm text-muted">
          Sign-on desk for {VESSEL}. Officers only — crew packets stay on this account.
        </p>
        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <p className="mt-6 text-xs text-faint">
          Sign-in keeps packets on your account. Unsigned visitors cannot read the ledger.
        </p>
      </div>
    </main>
  );
}
