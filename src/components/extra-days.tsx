import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, formatShort } from "@/lib/crew/dates";
import {
  extraDaysToTrips,
  extraTripsLabel,
  MAX_EXTRA_TRIPS,
  MIN_EXTRA_TRIPS,
  TRIP_DAYS,
  tripsToExtraDays,
} from "@/lib/crew/shipping";
import { cn } from "@/lib/utils";

const PRESET_TRIPS = [0, 1, 2, 3, 4];

export function ExtraDaysControl({
  extraDays,
  baseDate,
  dueOff,
  disabled,
  saving,
  onSave,
  compact = false,
}: {
  extraDays: number;
  baseDate?: string | null;
  dueOff?: string | null;
  disabled?: boolean;
  saving?: boolean;
  onSave: (extraDays: number) => void;
  compact?: boolean;
}) {
  const trips = extraDaysToTrips(extraDays);
  const [value, setValue] = useState(String(trips));
  useEffect(() => {
    setValue(String(extraDaysToTrips(extraDays)));
  }, [extraDays]);

  const parsed = Number.parseInt(value, 10);
  const nextTrips = Number.isFinite(parsed) ? parsed : trips;
  const nextDays = tripsToExtraDays(nextTrips);
  const origin = baseDate ?? (extraDays && dueOff ? addDays(dueOff, -extraDays) : dueOff);
  const preview = origin ? addDays(origin, nextDays) : dueOff;
  const dirty = nextDays !== extraDays;

  function commitTrips(n: number) {
    const days = tripsToExtraDays(n);
    setValue(String(extraDaysToTrips(days)));
    if (days !== extraDays) onSave(days);
  }

  const locked = disabled || saving;
  const btn = compact ? "h-8 w-8" : "h-11 w-11";

  return (
    <div className={cn("min-w-0", compact ? "" : "rounded-lg bg-paper-2 p-3")}>
      {!compact ? (
        <p className="text-xs text-muted">One trip is {TRIP_DAYS} days. Extra time is whole trips only.</p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label="One less trip"
          disabled={locked || trips <= MIN_EXTRA_TRIPS}
          onClick={() => commitTrips(trips - 1)}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink hover:bg-paper-3 disabled:opacity-40",
            btn,
          )}
        >
          <Minus className="size-4" />
        </button>
        <Input
          type="number"
          inputMode="numeric"
          step={1}
          aria-label="Extra trips"
          className={cn(compact ? "h-8 w-14" : "h-11 w-16", "text-center")}
          value={value}
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => commitTrips(nextTrips)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTrips(nextTrips);
          }}
        />
        <button
          type="button"
          aria-label="One more trip"
          disabled={locked || trips >= MAX_EXTRA_TRIPS}
          onClick={() => commitTrips(trips + 1)}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink hover:bg-paper-3 disabled:opacity-40",
            btn,
          )}
        >
          <Plus className="size-4" />
        </button>
        {PRESET_TRIPS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={locked}
            onClick={() => commitTrips(n)}
            className={cn(
              "rounded-md px-2 text-xs",
              compact ? "h-8" : "h-11 px-3",
              extraDaysToTrips(extraDays) === n ? "bg-ink text-paper" : "bg-paper-2 text-muted hover:text-ink",
            )}
          >
            {n === 0 ? "Rule" : `+${n}`}
          </button>
        ))}
        {dirty ? (
          <Button size="sm" disabled={saving} onClick={() => commitTrips(nextTrips)}>
            Save
          </Button>
        ) : null}
      </div>
      {extraDays || dirty ? (
        <p className="mt-1 text-[11px] text-muted">
          {extraTripsLabel(nextDays)}
          {nextDays ? ` · ${Math.abs(nextDays)}d` : ""}
          {preview ? ` · due ${formatShort(preview)}` : ""}
        </p>
      ) : compact ? null : (
        <p className="mt-1 text-[11px] text-muted">Rule date · no extra trips</p>
      )}
    </div>
  );
}
