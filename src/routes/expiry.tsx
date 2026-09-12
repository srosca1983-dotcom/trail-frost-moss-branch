import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Desk } from "@/components/desk";
import { ExpiryChip } from "@/components/expiry-chip";
import { PageHeader } from "@/components/page-header";
import { listExpiring } from "@/lib/crew/server";
import { formatDate } from "@/lib/crew/dates";
import { positionLabel } from "@/lib/crew/ratings";
import { isOfficerRotary } from "@/lib/crew/shipping";
import type { ExpiryTone } from "@/lib/crew/types";
import { SmmPrintPanel } from "@/components/smm-print-panel";
import { expiredPrintableSmm, isPrintableSmm } from "@/lib/crew/smm-print";

export const Route = createFileRoute("/expiry")({
  loader: () => listExpiring(),
  staleTime: 60_000,
  component: Page,
});

function Page() {
  return (
    <Desk>
      <Board />
    </Desk>
  );
}

function Board() {
  const q = useQuery({ queryKey: ["expiring"], queryFn: () => listExpiring(), initialData: Route.useLoaderData() });
  const [filter, setFilter] = useState<"all" | ExpiryTone | "smm">("all");
  const rows = useMemo(() => {
    const list = q.data ?? [];
    if (filter === "smm") {
      return list.filter((d) => isPrintableSmm(d.docType) && d.tone === "expired");
    }
    if (filter === "all") {
      return list.filter((d) => d.tone !== "ok" && (d.tone !== "missing" || d.docType === "drug_free"));
    }
    return list.filter((d) => d.tone === filter);
  }, [q.data, filter]);

  const printItems = useMemo(() => {
    const byCrew = new Map<string, { crewId: string; fullName: string; position: string | null; docs: { docType: string; expiresOn: string | null }[] }>();
    for (const d of q.data ?? []) {
      if (!d.mariner || d.tone !== "expired" || !isPrintableSmm(d.docType)) continue;
      const cur = byCrew.get(d.mariner.id) ?? {
        crewId: d.mariner.id,
        fullName: d.mariner.fullName,
        position: d.mariner.lastPosition,
        docs: [],
      };
      cur.docs.push({ docType: d.docType, expiresOn: d.expiresOn });
      byCrew.set(d.mariner.id, cur);
    }
    return [...byCrew.values()].map((r) => ({
      crewId: r.crewId,
      fullName: r.fullName,
      position: r.position,
      kinds: expiredPrintableSmm(r.docs),
    }));
  }, [q.data]);

  return (
    <>
      <PageHeader
        kicker="Tickets"
        title="What has expired, and when."
        description="People aboard, rotary on vacation, and permanents. MMC, medical, and DOT drug-free sit together. Past relief and applicants stay off this list."
      />
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">
        {(["all", "expired", "soon", "watch", "ok", "smm"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${filter === t ? "bg-ink text-paper" : "text-muted"}`}
          >
            {t === "all" ? "Action list" : t === "soon" ? "30 days" : t === "watch" ? "90 days" : t === "smm" ? "Expired SMM" : t}
          </button>
        ))}
      </div>
      <div className="mb-5">
        <SmmPrintPanel items={printItems} />
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl shadow-border">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
            <tr>
              <th className="px-4 py-3">Mariner</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-paper-2/60">
                <td className="px-4 py-3">
                  {d.mariner ? (
                    <Link to="/crew/$crewId" params={{ crewId: d.mariner.id }} className="font-medium hover:underline">
                      {d.mariner.fullName}
                    </Link>
                  ) : (
                    "—"
                  )}
                  <div className="text-xs text-muted">
                    {positionLabel(d.mariner?.lastPosition ?? null)}
                    {d.mariner ? ` · ${boardRole(d.mariner)}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {d.label}
                  {d.docNumber ? <div className="font-mono text-xs text-faint">{d.docNumber}</div> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatDate(d.expiresOn)}</td>
                <td className="px-4 py-3">
                  <ExpiryChip date={d.expiresOn} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  {q.isLoading ? "Loading…" : "Nothing in this band."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function boardRole(m: {
  status?: string | null;
  assignmentType?: string | null;
  permanentRating?: string | null;
  unionHall?: string | null;
}): string {
  const status = (m.status ?? "").toLowerCase();
  if (status === "current") return "aboard";
  if (status === "vacation") {
    if (isOfficerRotary(m.unionHall, m.assignmentType)) return "rotary leave";
    return "vacation";
  }
  if (m.permanentRating || (m.assignmentType ?? "").toUpperCase() === "PERMANENT") return "permanent";
  return status || "on file";
}
