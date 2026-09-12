import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "ok" | "watch" | "soon" | "expired" | "steel" | "current" | "past";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-muted",
  ok: "bg-ok/15 text-ok",
  watch: "bg-warn/15 text-warn",
  soon: "bg-warn/20 text-warn",
  expired: "bg-danger/15 text-danger",
  steel: "bg-steel/20 text-steel-2",
  current: "bg-ok/15 text-ok",
  past: "bg-paper-2 text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
