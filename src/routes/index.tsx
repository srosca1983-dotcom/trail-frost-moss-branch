import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, Briefcase, CalendarClock, Download, Flame, ShieldCheck, Upload, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { ExpiryChip } from "@/components/expiry-chip";
import { PageHeader } from "@/components/page-header";
import { PortSelect } from "@/components/port-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysUntil, formatShort } from "@/lib/crew/dates";
import { downloadText } from "@/lib/crew/enoad";
import { chinaPassportGaps, isShipyardPort, isYardCall, matePort, runLine } from "@/lib/crew/ports";
import { positionLabel } from "@/lib/crew/ratings";
import { exportLedger, getDashboard, saveVesselRun } from "@/lib/crew/server";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { watchLabel } from "@/lib/crew/shipping";
import { VESSEL_BILLETS } from "@/lib/crew/billets";
import { VESSEL } from "@/lib/crew/types";

export const Route = createFileRoute("/")({
  loader: () => getDashboard(),
  staleTime: 60_000,
  component: Home,
});

function dueTone(days: number | null): "ok" | "watch" | "soon" | "expired" | "neutral" {
  if (days === null) return "neutral";
  if (days < 0) return "expired";
  if (days <= 14) return "soon";
  if (days <= 30) return "watch";
  return "ok";
}

function dueText(days: number | null, date: string | null): string {
  if (days === null) return date ? formatShort(date) : "No due-off";
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days <= 21) return `${days}d left`;
  return formatShort(date);
}

function Home() {
  return (
    <Desk>
      <DeskHome />
    </Desk>
  );
}

function DeskHome() {
  const initial = Route.useLoaderData();
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard(), initialData: initial });
  const data = q.data;
  const china = isYardCall(data?.run)
    ? (data?.current ?? [])
        .map((c) =>
          chinaPassportGaps({
            crewId: c.id,
            fullName: c.fullName,
            passportNumber: c.passportNumber,
            passportExpiration: c.passportExpiration,
          }),
        )
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
    : [];

  return (
    <>
      <PageHeader
        kicker="Sunrise Vessel Operations"
        title="Who is aboard, and when they are due off."
        description={`${VESSEL} manning board. Regular run is Long Beach ↔ Honolulu. Oakland if we call. Nantong only for the yard. Due-off follows MM&P, MEBA, and SIU shipping rules.`}
        actions={
          <>
            <Button asChild>
              <Link to="/sign-on">
                Sign someone on
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/crew" search={{ view: "change" }}>
                Crew change
              </Link>
            </Button>
            <BackupButton />
          </>
        }
      />

      {data?.run ? <RunStrip run={data.run} /> : null}

      {china.length ? (
        <div className="mt-4 rounded-xl bg-warn/15 px-4 py-3 text-sm">
          <p className="font-medium">
            {data?.run && isShipyardPort(data.run.thisPort) ? "At Nantong shipyard" : "China shipyard call"} — {china.length}{" "}
            passport{china.length === 1 ? "" : "s"} not ready.
          </p>
          <ul className="mt-2 space-y-1">
            {china.map((p) => (
              <li key={p.crewId}>
                <Link to="/crew/$crewId" params={{ crewId: p.crewId }} className="hover:underline">
                  {p.fullName}
                </Link>
                <span className="text-muted"> — {p.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Aboard now" value={data?.stats.current ?? "—"} href="/crew" hint="Current articles" />
        <Stat label="Vacant billets" value={data?.stats.vacantBillets ?? "—"} href="/crew" search={{ view: "vacant" }} hint="Open slots only" />
        <Stat
          label="Walking this call"
          value={data?.stats.dueSoonCrew ?? "—"}
          href="/crew"
          search={{ view: "due" }}
          hint={data?.stats.overdueCrew ? `${data.stats.overdueCrew} overdue` : "12d left is next home port"}
          danger={Boolean(data?.stats.overdueCrew)}
        />
        <Stat label="Expired tickets" value={data?.stats.expiredDocs ?? "—"} href="/expiry" hint="Aboard, rotary leave, permanents" danger />
        <Stat
          label="Rated up"
          value={data?.stats.sailingUp ?? "—"}
          href="/permanents"
          search={{ view: "rated" }}
          hint="Perm C/M, 1st, 2nd above rate"
        />
      </div>

      <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl bg-paper p-5 shadow-border sm:p-6">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="min-w-0 font-display text-xl tracking-tight">Currently aboard</h2>
            <Link to="/crew" className="shrink-0 text-sm text-steel-2 hover:underline">
              Full roster
            </Link>
          </div>
          {!data ? (
            <p className="mt-6 text-sm text-muted">Loading articles…</p>
          ) : data.current.length === 0 ? (
            <div className="mt-6 rounded-lg bg-paper-2 p-5">
              <p className="font-medium">No one is signed on.</p>
              <p className="mt-1 text-sm text-muted">
                {data.stats.past} mariners are on file from prior {VESSEL} tours. Sign-on will flag anyone who has been here before
                {data.stats.returningReady ? ` · ${data.stats.returningReady} have current tickets` : ""}.
              </p>
              <Button className="mt-4" asChild>
                <Link to="/sign-on">Open sign-on</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 min-w-0 divide-y divide-border">
              {data.current.map((c) => {
                const left = daysUntil(c.lastDueOff);
                const watch = c.lastWatch || VESSEL_BILLETS.find((b) => b.code === c.lastBillet)?.watch || null;
                return (
                  <li key={c.id} className="flex min-w-0 items-center justify-between gap-3 py-3">
                    <Link to="/crew/$crewId" params={{ crewId: c.id }} className="min-w-0 flex-1 overflow-hidden hover:underline">
                      <div className="truncate font-medium">{c.fullName}</div>
                      <div className="truncate text-xs text-muted">
                        {c.lastBillet ? `${c.lastBillet} · ` : ""}
                        {positionLabel(c.lastPosition)}
                        {c.permanentRating && c.permanentRating !== c.lastPosition
                          ? ` · perm ${positionLabel(c.permanentRating)}`
                          : ""}
                        {watch ? ` · ${watchLabel(watch)}` : ""}
                        {c.lastSignOn ? ` · on ${formatShort(c.lastSignOn)}` : ""}
                      </div>
                    </Link>
                    <Badge className="shrink-0" tone={dueTone(left)}>{dueText(left, c.lastDueOff)}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl bg-ink p-5 text-paper shadow-border sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Tickets</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">Expiry board</h2>
          <p className="mt-2 text-sm text-paper/75">Expired and 30-day warnings for people aboard, rotary on leave, and permanents.</p>
          <ul className="mt-4 space-y-3">
            {(data?.alerts ?? []).slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                <Link to="/crew/$crewId" params={{ crewId: a.crewId }} className="min-w-0 hover:underline">
                  <span className="block truncate text-paper/90">{a.label}</span>
                  <span className="block truncate text-xs text-paper/60">{a.marinerName}</span>
                </Link>
                <ExpiryChip date={a.expiresOn} />
              </li>
            ))}
            {data && data.alerts.length === 0 ? <li className="text-sm text-paper/70">No urgent tickets.</li> : null}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="inverse" asChild>
              <Link to="/expiry">
                <CalendarClock className="size-4" />
                Open expiry
              </Link>
            </Button>
            <Button variant="ghost" className="text-paper hover:bg-ink-3 hover:text-paper" asChild>
              <Link to="/ingest">
                <Upload className="size-4" />
                Load packets
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Quick to="/crew" icon={Users} title="Manning board" body="Deck, engine, steward. Vacant slots stay open until you assign them." />
        <Quick to="/permanents" icon={Briefcase} title="Permanents" body="Rate a C/M, 1st or 2nd up without losing the seat, or replace someone who quit, got fired, or promoted." />
        <Quick to="/training" icon={BookOpenCheck} title="NSE tickets" body="SASH, fam, cyber, internet, HAZMAT — who is expired." />
        <Quick to="/cyber" icon={ShieldCheck} title="Cyber class" body="Three talks. Print the handouts, run the class, print certificates." />
        <Quick to="/hazmat" icon={Flame} title="HAZMAT quiz" body="Study sheet and test for Master and the mates. Grade later. Print the cert if they pass." />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  href,
  search,
  hint,
  danger,
}: {
  label: string;
  value: number | string;
  href: string;
  search?: { view: string };
  hint: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={href}
      search={search as never}
      className="min-w-0 rounded-xl bg-paper p-4 shadow-border transition-[box-shadow] duration-150 hover:shadow-border-hover"
    >
      <p className="text-[11px] uppercase tracking-wider text-sage">{label}</p>
      <p className={`mt-1 font-mono text-3xl tabular-nums ${danger && value !== 0 && value !== "—" ? "text-danger" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Link>
  );
}

function Quick({ to, icon: Icon, title, body }: { to: string; icon: typeof Users; title: string; body: string }) {
  return (
    <Link to={to} className="min-w-0 rounded-xl bg-paper p-5 shadow-border transition-[box-shadow] duration-150 hover:shadow-border-hover">
      <Icon className="size-5 text-steel-2" strokeWidth={1.75} />
      <h3 className="mt-3 font-display text-lg tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </Link>
  );
}

function RunStrip({ run }: { run: { thisPort: string; nextPort: string; eta: string | null; voyageNumber: string | null } }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: saveVesselRun,
    onSuccess: async (next) => {
      await invalidateDesk(qc);
      toast.success(runLine(next));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the run"),
  });
  return (
    <section className="rounded-xl bg-paper p-4 shadow-border sm:p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-sage">This run</p>
      <p className="mt-1 text-sm text-muted">Long Beach ↔ Honolulu. Oakland if we call. Nantong is the yard, about every five years.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <label className="text-xs">
          <span className="text-muted">This port</span>
          <PortSelect
            value={run.thisPort}
            onChange={(thisPort) => mut.mutate({ data: { thisPort, nextPort: matePort(thisPort), eta: run.eta, voyageNumber: run.voyageNumber } })}
          />
        </label>
        <label className="text-xs">
          <span className="text-muted">Next port</span>
          <PortSelect
            value={run.nextPort}
            onChange={(nextPort) => mut.mutate({ data: { thisPort: run.thisPort, nextPort, eta: run.eta, voyageNumber: run.voyageNumber } })}
          />
        </label>
        <label className="text-xs">
          <span className="text-muted">ETA</span>
          <Input
            type="date"
            className="mt-1"
            value={run.eta ?? ""}
            onChange={(e) =>
              mut.mutate({ data: { thisPort: run.thisPort, nextPort: run.nextPort, eta: e.target.value || null, voyageNumber: run.voyageNumber } })
            }
          />
        </label>
        <label className="text-xs">
          <span className="text-muted">Voyage</span>
          <Input
            className="mt-1"
            defaultValue={run.voyageNumber ?? ""}
            key={run.voyageNumber ?? "voy"}
            onBlur={(e) =>
              mut.mutate({ data: { thisPort: run.thisPort, nextPort: run.nextPort, eta: run.eta, voyageNumber: e.target.value || null } })
            }
            placeholder="Optional"
          />
        </label>
      </div>
    </section>
  );
}

function BackupButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void exportLedger()
          .then((data) => {
            const day = new Date().toISOString().slice(0, 10);
            downloadText(JSON.stringify(data, null, 2), `GEORGE-II-ledger-${day}.json`, "application/json");
            toast.success("Ledger saved. People, tickets, and tours.");
          })
          .catch((e) => toast.error(e instanceof Error ? e.message : "Could not export"))
          .finally(() => setBusy(false));
      }}
    >
      <Download className="size-4" /> {busy ? "Exporting…" : "Backup ledger"}
    </Button>
  );
}
