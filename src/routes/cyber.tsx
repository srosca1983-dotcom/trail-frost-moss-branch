import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, Fragment } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CYBER_MODULE_ORDER,
  CYBER_MODULES,
  classifyCrew,
  moduleCounts,
  seatsForModule,
  type CyberModuleId,
  type CyberSeat,
} from "@/lib/crew/cyber";
import { todayUtc } from "@/lib/crew/dates";
import {
  DEFAULT_CYBER_SESSION,
  cyberModuleFilename,
  cyberPersonFilename,
  fillCyberCertificates,
  fillCyberRoster,
  fillPersonCyberPack,
  type CyberSession,
} from "@/lib/crew/fill-cyber";
import { departmentLabel } from "@/lib/crew/ratings";
import { listCrew, recordCyberTraining } from "@/lib/crew/server";
import { SMS_TRAINING } from "@/lib/crew/sms-training";
import { VESSEL } from "@/lib/crew/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cyber")({ component: Page });

type ReadyFile = { id: string; label: string; name: string; url: string };

function readStored(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

function downloadPdf(bytes: Uint8Array, name: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}

function Page() {
  return (
    <Desk>
      <CyberDesk />
    </Desk>
  );
}

function CyberDesk() {
  const qc = useQueryClient();
  const roster = useQuery({ queryKey: ["crew"], queryFn: () => listCrew() });
  const [date, setDate] = useState(() => todayUtc().toISOString().slice(0, 10));
  const [facilitator, setFacilitator] = useState(() =>
    readStored("crew-ledger-cyber-facilitator", DEFAULT_CYBER_SESSION.facilitatorName),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState<ReadyFile[]>([]);

  const seats = useMemo(() => classifyCrew(roster.data ?? []), [roster.data]);
  const counts = moduleCounts(seats);
  const session: CyberSession = {
    date,
    durationMin: DEFAULT_CYBER_SESSION.durationMin,
    facilitatorName: facilitator.trim() || DEFAULT_CYBER_SESSION.facilitatorName,
    facilitatorOrg: VESSEL,
  };

  function remember() {
    localStorage.setItem("crew-ledger-cyber-facilitator", session.facilitatorName);
  }

  function pushReady(label: string, name: string, url: string) {
    setReady((prev) => {
      const next = prev.filter((f) => f.name !== name);
      next.unshift({ id: `${name}-${Date.now()}`, label, name, url });
      for (const dropped of prev.filter((f) => f.name === name)) URL.revokeObjectURL(dropped.url);
      return next.slice(0, 12);
    });
  }

  async function stamp(module: CyberModuleId, crewIds: string[]) {
    if (!crewIds.length) return;
    try {
      await recordCyberTraining({ data: { module, crewIds, issued: date } });
      await qc.invalidateQueries({ queryKey: ["nse-board"] });
      await qc.invalidateQueries({ queryKey: ["crew"] });
      await qc.invalidateQueries({ queryKey: ["expiring"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Printed, but NSE board did not update");
    }
  }

  async function run(label: string, work: () => Promise<{ bytes: Uint8Array; name: string; readyLabel: string }>) {
    if (!date) {
      toast.error("Set the date first.");
      return;
    }
    remember();
    setBusy(label);
    try {
      const { bytes, name, readyLabel } = await work();
      const url = downloadPdf(bytes, name);
      pushReady(readyLabel, name, url);
      toast.success(`${readyLabel}. Sign after class.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fill papers");
    } finally {
      setBusy(null);
    }
  }

  function fillModuleCerts(id: CyberModuleId) {
    const list = seatsForModule(seats, id);
    const mod = CYBER_MODULES[id];
    return run(`${id}-certs`, async () => {
      const bytes = await fillCyberCertificates(id, list, session);
      await stamp(
        id,
        list.map((s) => s.crewId),
      );
      return {
        bytes,
        name: cyberModuleFilename(id, "certs", date),
        readyLabel: `${mod.short} certificates · ${list.length || 1}`,
      };
    });
  }

  function fillModuleRoster(id: CyberModuleId) {
    const list = seatsForModule(seats, id);
    const mod = CYBER_MODULES[id];
    return run(`${id}-roster`, async () => ({
      bytes: await fillCyberRoster(id, list, session),
      name: cyberModuleFilename(id, "roster", date),
      readyLabel: `${mod.short} sign-in · ${list.length}`,
    }));
  }

  function fillSeat(seat: CyberSeat) {
    return run(seat.crewId, async () => {
      const bytes = await fillPersonCyberPack(seat, session);
      for (const id of seat.modules) await stamp(id, [seat.crewId]);
      return {
        bytes,
        name: cyberPersonFilename(seat, date),
        readyLabel: `${seat.fullName} · ${seat.modules.length} cert${seat.modules.length === 1 ? "" : "s"}`,
      };
    });
  }

  async function fillAll() {
    if (!date) {
      toast.error("Set the date first.");
      return;
    }
    remember();
    setBusy("all");
    try {
      for (const id of CYBER_MODULE_ORDER) {
        const list = seatsForModule(seats, id);
        const certs = await fillCyberCertificates(id, list, session);
        const rosterBytes = await fillCyberRoster(id, list, session);
        const certName = cyberModuleFilename(id, "certs", date);
        const rosterName = cyberModuleFilename(id, "roster", date);
        pushReady(
          `${CYBER_MODULES[id].short} certificates · ${list.length || 1}`,
          certName,
          downloadPdf(certs, certName),
        );
        pushReady(
          `${CYBER_MODULES[id].short} sign-in · ${list.length}`,
          rosterName,
          downloadPdf(rosterBytes, rosterName),
        );
        await stamp(
          id,
          list.map((s) => s.crewId),
        );
      }
      toast.success("All three classes printed. Sign after class.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fill papers");
    } finally {
      setBusy(null);
    }
  }

  const grouped = useMemo(() => {
    const order = ["deck", "engine", "steward"] as const;
    return order.map((d) => ({ dept: d, rows: seats.filter((s) => s.department === d) })).filter((g) => g.rows.length);
  }, [seats]);

  return (
    <>
      <PageHeader
        kicker="Cyber class"
        title="Three talks. Print, teach, sign."
        description="Mod 1 is everyone. Mod 2 and 3 are officers and the electrician. Certificates stamp the NSE board. Sign after class."
      />

      <section className="mb-6 rounded-xl bg-paper p-5 shadow-border sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-sage">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-sage">Your name (prints on the cert)</span>
            <Input
              value={facilitator}
              onChange={(e) => setFacilitator(e.target.value)}
              placeholder="Sorin Rosca, Chief Mate"
            />
          </label>
          <Button className="h-10" onClick={() => void fillAll()} disabled={Boolean(busy) || !seats.length}>
            {busy === "all" ? "Printing…" : "Print all three"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          15 minutes each · {VESSEL}.{" "}
          <a href={SMS_TRAINING.smm08.url} className="text-steel-2 hover:underline" target="_blank" rel="noreferrer">
            SMM-SMM-08
          </a>
        </p>
      </section>

      {ready.length ? (
        <section className="mb-6 rounded-xl bg-ink p-4 text-paper sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Ready — print these</p>
          <ul className="mt-3 space-y-2">
            {ready.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-paper/90">{f.label}</span>
                <a href={f.url} download={f.name} className="shrink-0 text-steel hover:underline">
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ol className="grid gap-4 lg:grid-cols-3">
        {CYBER_MODULE_ORDER.map((id, i) => {
          const mod = CYBER_MODULES[id];
          const n = counts[id];
          return (
            <li key={id} className="flex flex-col rounded-xl bg-paper p-5 shadow-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-sage">
                    {i + 1} · {mod.short}
                  </p>
                  <h2 className="mt-1 font-display text-xl tracking-tight">{mod.audience}</h2>
                </div>
                <p className="font-mono text-3xl tabular-nums text-ink">{roster.isLoading ? "—" : n}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{mod.title}</p>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {mod.materials.map((m) => (
                  <li key={m.href}>
                    <a href={m.href} target="_blank" rel="noreferrer" className="text-steel-2 hover:underline">
                      {m.kind === "handout" ? "Open handout" : "Open talking points"}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2 pt-5">
                <Button onClick={() => void fillModuleCerts(id)} disabled={Boolean(busy)}>
                  {busy === `${id}-certs` ? "Printing…" : `Print ${n} certificate${n === 1 ? "" : "s"}`}
                </Button>
                <Button variant="outline" onClick={() => void fillModuleRoster(id)} disabled={Boolean(busy)}>
                  {busy === `${id}-roster` ? "Printing…" : "Print sign-in sheet"}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="mt-8">
        <h2 className="font-display text-xl tracking-tight">Who sits in which class</h2>
        <p className="mt-1 text-sm text-muted">Print one person from the row if they missed the group.</p>

        <div className="mt-4 hidden overflow-hidden rounded-xl shadow-border md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-center">1</th>
                <th className="px-4 py-3 text-center">2</th>
                <th className="px-4 py-3 text-center">3</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-paper">
              {grouped.map((g) => (
                <Fragment key={g.dept}>
                  <tr className="bg-paper-2/80">
                    <td colSpan={6} className="px-4 py-2 text-[11px] uppercase tracking-wider text-sage">
                      {departmentLabel(g.dept)}
                    </td>
                  </tr>
                  {g.rows.map((s) => (
                    <tr key={s.crewId}>
                      <td className="px-4 py-3">
                        <Link to="/crew/$crewId" params={{ crewId: s.crewId }} className="font-medium hover:underline">
                          {s.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{s.positionLabel}</td>
                      <td className="px-4 py-3 text-center">
                        <Need yes={s.awareness} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Need yes={s.ot} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Need yes={s.key} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={() => void fillSeat(s)}>
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {!seats.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    {roster.isLoading ? "Loading articles…" : "Nobody is signed on."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {seats.map((s) => (
            <article key={s.crewId} className="rounded-xl bg-paper p-4 shadow-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to="/crew/$crewId" params={{ crewId: s.crewId }} className="font-medium hover:underline">
                    {s.fullName}
                  </Link>
                  <p className="text-xs text-muted">{s.positionLabel}</p>
                </div>
                <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void fillSeat(s)}>
                  Print
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.awareness ? <Badge tone="steel">1</Badge> : null}
                {s.ot ? <Badge tone="steel">2</Badge> : null}
                {s.key ? <Badge tone="ok">3</Badge> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Need({ yes }: { yes?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
        yes ? "bg-ok/15 text-ok" : "bg-paper-2 text-faint",
      )}
    >
      {yes ? "Y" : "—"}
    </span>
  );
}
