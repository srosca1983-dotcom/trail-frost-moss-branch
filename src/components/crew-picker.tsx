import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { positionLabel } from "@/lib/crew/ratings";
import { cn } from "@/lib/utils";

export type CrewPickerPerson = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  lastPosition?: string | null;
  status?: string | null;
  mmcNumber?: string | null;
};

const STATUS_ORDER: Record<string, number> = { current: 0, vacation: 1, applicant: 2, past: 3 };

function statusLabel(s: string | null | undefined) {
  if (s === "current") return "aboard";
  if (s === "vacation") return "leave";
  if (s === "applicant") return "applicant";
  if (s === "past") return "past";
  return s ?? "";
}

function matchesQuery(p: CrewPickerPerson, q: string) {
  if (!q) return true;
  const hay = [p.fullName, p.lastName, p.firstName, p.lastPosition, positionLabel(p.lastPosition), p.mmcNumber, p.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => hay.includes(tok));
}

export function CrewPicker({
  people,
  value,
  onChange,
  excludeIds = [],
  placeholder = "Search mariners…",
  emptyLabel = "Pick mariner…",
  compact = false,
  disabled = false,
}: {
  people: CrewPickerPerson[];
  value: string;
  onChange: (id: string) => void;
  excludeIds?: string[];
  placeholder?: string;
  emptyLabel?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);

  const options = useMemo(() => {
    const skip = new Set(excludeIds);
    return people
      .filter((p) => !skip.has(p.id) && matchesQuery(p, q))
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.status ?? ""] ?? 9;
        const sb = STATUS_ORDER[b.status ?? ""] ?? 9;
        if (sa !== sb) return sa - sb;
        return (a.lastName ?? a.fullName).localeCompare(b.lastName ?? b.fullName);
      });
  }, [people, excludeIds, q]);

  const selected = people.find((p) => p.id === value) ?? null;

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQ("");
    setHi(0);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = options[hi];
      if (hit) choose(hit.id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQ("");
          setHi(0);
        }
      }}
    >
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-md border border-border bg-paper px-3 font-normal text-ink hover:bg-paper-2",
          compact ? "h-8 max-w-64 px-2 text-xs" : "h-10 text-sm",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-faint")}>
          {selected ? selected.fullName : emptyLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-80 rounded-lg border border-border bg-paper p-2 shadow-border"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHi(0);
              }}
              onKeyDown={onKey}
              placeholder={placeholder}
              className="h-10 pl-8"
              autoComplete="off"
            />
          </div>
          <ul className="mt-2 max-h-64 overflow-y-auto" role="listbox">
            {options.length === 0 ? (
              <li className="px-2 py-3 text-sm text-muted">
                {people.length === 0 ? "Loading roster…" : "No mariner matches that name."}
              </li>
            ) : (
              options.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.id === value}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm",
                      i === hi ? "bg-paper-2" : "hover:bg-paper-2",
                      p.id === value ? "text-ink" : "text-ink",
                    )}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => choose(p.id)}
                  >
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-xs text-muted">
                      {[positionLabel(p.lastPosition) || null, statusLabel(p.status)].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
