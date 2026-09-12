import { RUN_PORTS } from "@/lib/crew/ports";
import { cn } from "@/lib/utils";

export function PortSelect({
  value,
  onChange,
  id,
  allowEmpty = false,
  emptyLabel = "Pick a port",
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  id?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const listed = RUN_PORTS.some((p) => p.name === value);
  return (
    <select
      id={id}
      className={cn("mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {!listed && value ? <option value={value}>{value} — not on this run</option> : null}
      {RUN_PORTS.map((p) => (
        <option key={p.id} value={p.name}>
          {p.label}
          {p.kind === "occasional" ? " — if we call" : p.kind === "shipyard" ? " — every ~5 years" : ""}
        </option>
      ))}
    </select>
  );
}
