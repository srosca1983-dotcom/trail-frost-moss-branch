import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMdY } from "@/lib/crew/dates";
import { getNseBoard, syncSmsRequirements, upsertNseTraining } from "@/lib/crew/server";
import {
  NSE_CODES,
  NSE_KINDS,
  NSE_SHORT,
  NSE_VALIDITY_YEARS,
  type NseBoardRow,
  type NseCertCell,
  type NseKind,
} from "@/lib/crew/nse";
import { SmmPrintPanel } from "@/components/smm-print-panel";
import { expiredPrintableSmm } from "@/lib/crew/smm-print";
import { HAZMAT_MARK, SMS_TRAINING } from "@/lib/crew/sms-training";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training")({
  loader: () => getNseBoard(),
  staleTime: 60_000,
  component: Page,
});

type Filter = "action" | "all" | "expired" | "watch" | "missing";

function Page() {
  return (
    <Desk>
      <Board />
    </Desk>
  );
}

function Board() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["nse-board"], queryFn: () => getNseBoard(), initialData: Route.useLoaderData() });
  const [filter, setFilter] = useState<Filter>("action");
  const [editing, setEditing] = useState<{ crewId: string; kind: NseKind; field: "issued" | "expires" } | null>(null);

  const mut = useMutation({
    mutationFn: upsertNseTraining,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["nse-board"] });
      await qc.invalidateQueries({ queryKey: ["expiring"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["crew"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const smsMut = useMutation({
    mutationFn: () => syncSmsRequirements(),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["nse-board"] });
      await qc.invalidateQueries({ queryKey: ["sms-sync"] });
      await qc.invalidateQueries({ queryKey: ["requirements"] });
      if (r.status === "rev-drift") toast.error("SMS revision moved — check the banner.");
      else if (r.status === "spa") toast.message("Reached SMS. Procedure pages are an app shell — coded revs still apply.");
      else toast.success("Checked SMS against SMM-PER-06 and SMM-SMM-08.");
    },
    onError: () => toast.error("Could not reach the SMS app"),
  });

  const rows = useMemo(() => {
    const list = q.data?.rows ?? [];
    if (filter === "all") return list;
    return list.filter((r) => {
      if (filter === "expired") return r.expiredCount > 0;
      if (filter === "watch") return r.watchCount > 0;
      if (filter === "missing") return r.missingCount > 0;
      return r.expiredCount > 0 || r.watchCount > 0 || r.missingCount > 0;
    });
  }, [q.data, filter]);

  const printItems = useMemo(
    () =>
      (q.data?.rows ?? [])
        .map((r) => ({
          crewId: r.crewId,
          fullName: r.fullName,
          position: r.rating,
          kinds: expiredPrintableSmm(r.certs),
        }))
        .filter((i) => i.kinds.length),
    [q.data],
  );

  function save(crewId: string, kind: NseKind, field: "issued" | "expires", value: string, cell: NseCertCell) {
    const issued = field === "issued" ? value || null : cell.issued;
    const expires = field === "expires" ? value || null : field === "issued" ? null : cell.expires;
    mut.mutate({ data: { crewId, kind, issued, expires } });
  }

  return (
    <>
      <PageHeader
        kicker="NSE training certificates"
        title="Permanent crew tickets."
        description="Columns follow SMM-PER-06 and SMM-SMM-08, not the old NS5 five-column sheet. Grey N/A is not required for that rate. Filling a 101.650 certificate on the cyber desk stamps Mod 1–3 here."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/hazmat">HAZMAT quiz</Link>
            </Button>
            <Button onClick={() => smsMut.mutate()} disabled={smsMut.isPending}>
              {smsMut.isPending ? "Checking SMS…" : "Check SMS"}
            </Button>
          </>
        }
      />

      <SmsBanner sms={q.data?.sms} />

      <div className="mb-5">
        <SmmPrintPanel items={printItems} />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">
          {(
            [
              ["action", "Action list"],
              ["all", "All"],
              ["expired", "Expired"],
              ["watch", "90 days"],
              ["missing", "Missing"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                filter === id ? "bg-ink text-paper" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {q.data ? (
          <p className="text-sm text-muted">
            <span className="text-danger">{q.data.expired} expired</span>
            {" · "}
            <span className="text-warn">{q.data.watch} in 90 days</span>
            {" · "}
            {q.data.missing} missing
          </p>
        ) : null}
      </div>

      <ul className="mb-5 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-5">
        <li className="rounded-lg bg-warn/20 px-3 py-2 text-warn">Yellow box — expires in 90 days or less</li>
        <li className="rounded-lg bg-danger/10 px-3 py-2 text-danger">Red numbers — already expired, needs updating</li>
        <li className="rounded-lg bg-paper-2 px-3 py-2 text-ink">Uncolored — still valid</li>
        <li className="rounded-lg bg-paper-2 px-3 py-2 text-steel-2">Blue writing — click to edit</li>
        <li className="rounded-lg bg-paper-2 px-3 py-2 text-faint">N/A — SMS does not require this rate</li>
      </ul>

      <div className="mb-4 hidden overflow-hidden rounded-xl shadow-border md:block">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="sticky left-0 z-20 min-w-48 bg-paper-2 px-4 py-3 font-medium shadow-[2px_0_8px_rgba(11,16,20,0.08)]" rowSpan={2}>
                  Permanent crew
                </th>
                {NSE_KINDS.map((k) => (
                  <th key={k} className="px-3 py-2 text-center font-medium" colSpan={2}>
                    {NSE_SHORT[k]}
                    <div className="mt-0.5 font-mono text-[10px] font-normal normal-case tracking-normal text-faint">
                      {NSE_CODES[k]} · {NSE_VALIDITY_YEARS[k]} {NSE_VALIDITY_YEARS[k] === 1 ? "year" : "years"}
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                {NSE_KINDS.flatMap((k) => [
                  <th key={`${k}-i`} className="px-3 py-2 text-center font-normal">
                    Issued
                  </th>,
                  <th key={`${k}-e`} className="px-3 py-2 text-center font-normal">
                    Expires
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-paper">
              {rows.map((r) => (
                <tr key={r.crewId} className="align-top">
                  <td className="sticky left-0 z-10 bg-paper px-4 py-3 shadow-[2px_0_8px_rgba(11,16,20,0.08)]">
                    <NameCell row={r} />
                  </td>
                  {NSE_KINDS.flatMap((k) => {
                    const cell = r.certs[k];
                    return [
                      <DateTd
                        key={`${r.crewId}-${k}-i`}
                        cell={cell}
                        field="issued"
                        editing={editing?.crewId === r.crewId && editing.kind === k && editing.field === "issued"}
                        saving={mut.isPending}
                        onEdit={() => setEditing({ crewId: r.crewId, kind: k, field: "issued" })}
                        onCancel={() => setEditing(null)}
                        onSave={(v) => save(r.crewId, k, "issued", v, cell)}
                      />,
                      <DateTd
                        key={`${r.crewId}-${k}-e`}
                        cell={cell}
                        field="expires"
                        editing={editing?.crewId === r.crewId && editing.kind === k && editing.field === "expires"}
                        saving={mut.isPending}
                        onEdit={() => setEditing({ crewId: r.crewId, kind: k, field: "expires" })}
                        onCancel={() => setEditing(null)}
                        onSave={(v) => save(r.crewId, k, "expires", v, cell)}
                      />,
                    ];
                  })}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={1 + NSE_KINDS.length * 2} className="px-4 py-10 text-center text-muted">
                    {q.isLoading ? "Loading the NS5 list…" : "Nobody in this band."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <article key={r.crewId} className="rounded-xl bg-paper p-4 shadow-border">
            <NameCell row={r} />
            <dl className="mt-3 divide-y divide-border">
              {NSE_KINDS.map((k) => {
                const cell = r.certs[k];
                return (
                  <div key={k} className="flex items-start justify-between gap-3 py-3">
                    <dt className="min-w-0">
                      <div className="text-sm font-medium">{NSE_SHORT[k]}</div>
                      <div className="font-mono text-[10px] text-faint">{NSE_CODES[k]}</div>
                    </dt>
                    <dd className="flex gap-2">
                      <DateBtn
                        cell={cell}
                        field="issued"
                        editing={editing?.crewId === r.crewId && editing.kind === k && editing.field === "issued"}
                        saving={mut.isPending}
                        onEdit={() => setEditing({ crewId: r.crewId, kind: k, field: "issued" })}
                        onCancel={() => setEditing(null)}
                        onSave={(v) => save(r.crewId, k, "issued", v, cell)}
                      />
                      <DateBtn
                        cell={cell}
                        field="expires"
                        editing={editing?.crewId === r.crewId && editing.kind === k && editing.field === "expires"}
                        saving={mut.isPending}
                        onEdit={() => setEditing({ crewId: r.crewId, kind: k, field: "expires" })}
                        onCancel={() => setEditing(null)}
                        onSave={(v) => save(r.crewId, k, "expires", v, cell)}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="rounded-xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-border">
            {q.isLoading ? "Loading the NS5 list…" : "Nobody in this band."}
          </p>
        ) : null}
      </div>
    </>
  );
}

function NameCell({ row }: { row: NseBoardRow }) {
  return (
    <div className="min-w-0">
      <Link to="/crew/$crewId" params={{ crewId: row.crewId }} className="font-medium hover:underline">
        {row.sheetName}
      </Link>
      <div className="mt-0.5 text-xs text-muted">
        {row.rating}
        {row.covering ? ` · ${row.covering}` : ""}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge tone={row.status === "current" ? "current" : row.status === "vacation" ? "steel" : "past"}>
          {row.status === "current" ? "aboard" : row.status === "vacation" ? "vacation" : row.status ?? "off list"}
        </Badge>
        {row.onSheet ? null : <Badge tone="steel">not on NS5</Badge>}
      </div>
    </div>
  );
}

function cellFill(cell: NseCertCell, field: "issued" | "expires"): string {
  if (!cell.required && !cell.issued && !cell.expires) return "bg-paper-2/80";
  if (field === "issued") return "bg-transparent";
  if (cell.tone === "expired") return "bg-danger/10";
  if (cell.tone === "watch" || cell.tone === "soon") return "bg-warn/25";
  if (cell.tone === "missing") return "bg-paper-2";
  return "bg-transparent";
}

function cellText(cell: NseCertCell, field: "issued" | "expires"): string {
  if (!cell.required && !cell.issued && !cell.expires) return "text-faint";
  if (field === "expires" && cell.tone === "expired") return "text-danger";
  if (cell.tone === "missing" && field === "expires") return "text-danger";
  return "text-steel-2";
}

function DateTd({
  cell,
  field,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  cell: NseCertCell;
  field: "issued" | "expires";
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
}) {
  return (
    <td className={cn("px-1 py-2 text-center", cellFill(cell, field))}>
      <DateBtn
        cell={cell}
        field={field}
        editing={editing}
        saving={saving}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
      />
    </td>
  );
}

function DateBtn({
  cell,
  field,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  cell: NseCertCell;
  field: "issued" | "expires";
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
}) {
  const value = field === "issued" ? cell.issued : cell.expires;
  const empty = !value;
  const na = !cell.required && empty;
  const needs = empty && cell.required && (cell.tone === "missing" || cell.placeholder || cell.tone === "expired") && field === "expires";
  const label = value
    ? field === "issued" && cell.kind === "hazmat" && cell.score != null
      ? `${formatMdY(value)} · ${cell.score}/20`
      : formatMdY(value)
    : na
      ? "N/A"
      : needs
        ? "Needs date"
        : "—";

  if (editing) {
    return (
      <input
        type="date"
        defaultValue={value ?? ""}
        autoFocus
        disabled={saving}
        aria-label={field === "issued" ? "Issued" : "Expires"}
        className="h-10 min-w-28 rounded-md border border-border bg-paper px-2 font-mono text-xs text-ink"
        onBlur={(e) => {
          if (e.target.value === (value ?? "")) {
            onCancel();
            return;
          }
          onSave(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter") {
            e.preventDefault();
            onSave((e.target as HTMLInputElement).value);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "inline-flex min-h-10 min-w-24 items-center justify-center rounded-md px-2 font-mono text-xs tabular-nums",
        cellFill(cell, field),
        cellText(cell, field),
      )}
    >
      {label}
    </button>
  );
}

function SmsBanner({ sms }: { sms: import("@/lib/crew/nse").NseBoard["sms"] | undefined }) {
  const drift = sms?.procedures.some((p) => p.match === false);
  return (
    <div className={cn("mb-5 rounded-xl p-5 sm:p-6", drift ? "bg-danger text-paper" : "bg-ink text-paper")}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-sage">SMS training matrix</p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-paper/80">
        {SMS_TRAINING.per06.id} Rev {SMS_TRAINING.per06.rev} · 11 Sep 2025 and {SMS_TRAINING.smm08.id} Rev {SMS_TRAINING.smm08.rev} ·
        31 Jul 2026. Mod 1 all crew. Mod 2 / 3 officers + electrician. {HAZMAT_MARK}
      </p>
      <ul className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] text-paper/70">
        {(sms?.procedures ?? []).map((p) => (
          <li key={p.id}>
            {p.id} coded Rev {p.codedRev}
            {p.liveRev ? ` · SMS Rev ${p.liveRev}${p.match === false ? " — drifted" : ""}` : " · SMS not parsed"}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-paper/60">
        Last check {sms?.checkedAt ? String(sms.checkedAt).slice(0, 16) : "never"} · {sms?.status ?? "not yet"}. Filling cyber
        certificates stamps Mod 1–3 automatically.
      </p>
    </div>
  );
}
