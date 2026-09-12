import { Link, useRouterState } from "@tanstack/react-router";
import {
  Anchor,
  BookOpenCheck,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  Flame,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Ship,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SMS_URL, VESSEL } from "@/lib/crew/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authEnabled } from "@/lib/auth/client";

const NAV = [
  { to: "/", label: "Crew list", icon: LayoutDashboard },
  { to: "/crew", label: "Roster", icon: Users },
  { to: "/permanents", label: "Permanents", icon: Briefcase },
  { to: "/training", label: "NSE training", icon: BookOpenCheck },
  { to: "/cyber", label: "Cyber class", icon: ShieldCheck },
  { to: "/hazmat", label: "HAZMAT quiz", icon: Flame },
  { to: "/sign-on", label: "Sign on", icon: ClipboardCheck },
  { to: "/ingest", label: "Packet inbox", icon: Upload },
  { to: "/expiry", label: "Expiry", icon: CalendarClock },
  { to: "/requirements", label: "Requirements", icon: Anchor },
] as const;

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#0b1014" />
      <path fill="#f3efe4" d="M8.5 6.5h11.2L24 11.2V24.5A1.5 1.5 0 0 1 22.5 26h-14A1.5 1.5 0 0 1 7 24.5v-16A2 2 0 0 1 8.5 6.5z" />
      <rect x="10" y="14" width="13" height="2.1" rx=".4" fill="#6ea8c9" />
      <rect x="10" y="18.2" width="9" height="1.5" rx=".35" fill="#8a9690" />
    </svg>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
              active ? "bg-ink text-paper" : "text-ink/80 hover:bg-paper-2",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
      <a
        href={SMS_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted hover:bg-paper-2 hover:text-ink"
      >
        <Ship className="size-4" strokeWidth={1.75} />
        SMS manuals
      </a>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh max-w-full bg-paper text-ink lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper px-4 lg:hidden no-print">
        <Link to="/" className="flex items-center gap-2">
          <Mark />
          <span className="font-display text-base leading-tight tracking-tight">Crew Ledger</span>
        </Link>
        <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper p-4 shadow-border">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg">Crew Ledger</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="no-print hidden border-r border-border lg:flex lg:flex-col lg:px-4 lg:py-6">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
          <Mark />
          <div>
            <div className="font-display text-lg leading-tight tracking-tight">Crew Ledger</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-sage">{VESSEL}</div>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto px-2 pt-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-sage">Sunrise Vessel Operations</p>
          <div className="mt-3">
            {!authEnabled ? null : isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-paper-2" />
            ) : user ? (
              <UserButton />
            ) : (
              <Link to="/login" className="text-sm text-steel-2 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0 max-w-full">
        <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
