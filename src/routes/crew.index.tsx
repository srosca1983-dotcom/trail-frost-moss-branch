import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { ExtraDaysControl } from "@/components/extra-days";
import { ExpiryChip } from "@/components/expiry-chip";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShort } from "@/lib/crew/dates";
import { remainingUpgrades } from "@/lib/crew/permanents";
import { positionLabel } from "@/lib/crew/ratings";
import { extraTripsLabel, isOfficerRotary, watchLabel } from "@/lib/crew/shipping";
import { addExtraDays, changeBillet, getShipRoster, listCrew, rateUp, updateAssignment } from "@/lib/crew/server";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { billetByCode, listBilletChanges, type BilletChangeOption } from "@/lib/crew/billets";
import { walkOff, type WalkOff } from "@/lib/crew/ports";
import type { CrewStatus, RosterSlot } from "@/lib/crew/types";
import { VESSEL } from "@/lib/crew/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/")({
  validateSearch: (s: Record<string, unknown>): { view?: CrewView } => {
    const v = s.view;
    if (v === "aboard" || v === "vacant" || v === "due" || v === "board" || v === "ledger" || v === "change") return { view: v };
    return {};
  },
  loader: () => getShipRoster(),
  staleTime: 60_000,
  component: Page,
});

type CrewView = "aboard" | "vacant" | "due" | "board" | "ledger" | "change";

function displayName(s: string) {
  const t = s.trim();
  if (t.length > 1 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
    return t
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return t;
}

function foldName(s: string) {
  return s
    .toLowerCase()
    .replace(/yous[aeu]f/g, "yusuf")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type AssignmentPatch = {
  billetCode?: string | null;
  watch?: string | null;
  assignmentType?: string | null;
  seniorityClass?: string | null;
  dueOff?: string | null;
};

function Page() {
  return (
    <Desk>
      <Roster />
    </Desk>
  );
}

function dueTone(days: number | null, walk?: WalkOff) {
  if (days === null) return "missing";
  if (days < 0) return "expired";
  if (walk?.when === "next") return "watch";
  if (walk?.thisCall || days <= 11) return "soon";
  if (days <= 30) return "watch";
  return "ok";
}

function dueText(days: number | null, date: string | null | undefined, walk?: WalkOff) {
  if (days === null) return date ? formatShort(date) : "No due-off";
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  const left = days <= 21 ? `${days}d left` : formatShort(date);
  if (walk?.when === "next") return `${left} · next ${walk.port}`;
  return left;
}

function occupantWalk(o: { daysLeft: number | null; tour: { port?: string | null } }, thisPort: string, nextPort: string) {
  return walkOff({ daysLeft: o.daysLeft, embarkPort: o.tour.port, thisPort, nextPort });
}

function Roster() {
  const qc = useQueryClient();
  const view = Route.useSearch().view ?? "aboard";
  const initial = Route.useLoaderData();
  const ship = useQuery({
    queryKey: ["ship-roster"],
    queryFn: () => getShipRoster(),
    initialData: initial,
  });
  const ledger = useQuery({
    queryKey: ["crew"],
    queryFn: () => listCrew(),
    enabled: view === "ledger",
  });
  const [tab, setTab] = useState<CrewStatus | "all">("applicant");
  const [qstr, setQstr] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (view === "ledger") setTab("applicant");
  }, [view]);

  const mut = useMutation({
    mutationFn: updateAssignment,
    onSuccess: async () => {
      toast.success("Assignment updated");
      await invalidateDesk(qc);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });
  const extraMut = useMutation({
    mutationFn: addExtraDays,
    onSuccess: async (res) => {
      toast.success(res.due.date ? `Due off ${formatShort(res.due.date)}` : "Extra days saved");
      await invalidateDesk(qc);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save extra days"),
  });
  const rateMut = useMutation({
    mutationFn: rateUp,
    onSuccess: async (res) => {
      toast.success(res.question ?? "Rate updated");
      await invalidateDesk(qc);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up"),
  });
  const jobMut = useMutation({
    mutationFn: changeBillet,
    onSuccess: async (res) => {
      if (res.kind === "trade") toast.success(`Traded watches with ${res.withName}.`);
      else if (res.kind === "move") toast.success(`Moved to ${res.toTitle}.`);
      await invalidateDesk(qc);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change watch"),
  });

  const rows = useMemo(() => {
    const list = ledger.data ?? [];
    const needle = foldName(qstr.trim());
    const rank: Record<string, number> = { applicant: 0, current: 1, vacation: 2, past: 3 };
    return list
      .filter((c) => {
        if (tab !== "all" && c.status !== tab) return false;
        if (!needle) return true;
        const hay = foldName(
          [c.fullName, c.firstName, c.lastName, c.ssLast4, c.mmcNumber, c.email, c.cellPhone, c.lastPosition, c.city, c.state, c.billetCode]
            .filter(Boolean)
            .join(" "),
        );
        return hay.includes(needle);
      })
      .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || a.fullName.localeCompare(b.fullName));
  }, [ledger.data, tab, qstr]);

  const data = ship.data;
  const byDept = useMemo(() => {
    const slots = data?.slots ?? [];
    return {
      deck: slots.filter((s) => s.billet.department === "deck"),
      engine: slots.filter((s) => s.billet.department === "engine"),
      steward: slots.filter((s) => s.billet.department === "steward"),
    };
  }, [data]);
  const aboardNames = useMemo(
    () =>
      (data?.slots ?? []).flatMap((s) =>
        s.occupants.map((o) => ({
          id: o.crew.id,
          fullName: o.crew.fullName,
          billetCode: s.billet.code,
          assignmentType: o.tour.assignmentType,
        })),
      ),
    [data],
  );

  async function saveJob(crewId: string, fromBillet: string, patch: AssignmentPatch) {
    try {
      if (patch.billetCode && patch.billetCode !== fromBillet) {
        await jobMut.mutateAsync({ data: { crewId, toBillet: patch.billetCode } });
        return;
      }
      await mut.mutateAsync({
        data: {
          crewId,
          watch: billetByCode(fromBillet)?.watch ?? patch.watch,
          assignmentType: patch.assignmentType,
          seniorityClass: patch.seniorityClass,
          dueOff: patch.dueOff,
        },
      });
    } catch {
      /* toast already fired */
    }
  }

  return (
    <>
      <PageHeader
        kicker={VESSEL}
        title="Who is aboard, and when they are due off."
        description="Joined and due-off on one page, in ship order: Master, Chief Mate, down. They walk at the port they signed on. 12 days left is the next home-port call — the trip after, not this Long Beach. Extra time is whole trips — one trip is 14 days."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/crew/print" search={{ kind: "generic" }}>
                <Printer className="size-4" /> Crew list
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/crew/print" search={{ kind: "imo" }}>
                IMO list
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/crew/print" search={{ kind: "watch" }}>
                Watch bill
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/crew/print" search={{ kind: "enoad" }}>
                eNOAD
              </Link>
            </Button>
            <Button asChild>
              <Link to="/sign-on">Sign on</Link>
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">
          {(
            [
              ["aboard", "Aboard"],
              ["change", "Crew change"],
              ["vacant", "Vacant"],
              ["due", "Due off"],
              ["board", "Board"],
              ["ledger", "Ledger"],
            ] as const
          ).map(([id, label]) => (
            <Link
              key={id}
              to="/crew"
              search={id === "aboard" ? {} : { view: id }}
              className={cn("rounded-md px-3 py-1.5 text-sm", view === id ? "bg-ink text-paper" : "text-muted hover:text-ink")}
            >
              {label}
            </Link>
          ))}
        </div>
        {data ? (
          <p className="text-sm text-muted">
            {data.aboard} aboard · {data.vacant} vacant · {data.dueSoon} walking this call
            {data.overdue ? ` · ${data.overdue} overdue` : ""}
          </p>
        ) : null}
      </div>

      {view === "aboard" ? (
        <AboardView
          slots={data?.slots ?? []}
          loading={!data}
          error={ship.isError ? (ship.error instanceof Error ? ship.error.message : "unknown error") : null}
          saving={extraMut.isPending || rateMut.isPending || jobMut.isPending}
          thisPort={data?.run?.thisPort ?? "Long Beach"}
          nextPort={data?.run?.nextPort ?? "Honolulu"}
          onExtra={(crewId, extraDays) => extraMut.mutate({ data: { crewId, extraDays } })}
          onRate={(crewId, toBillet) => rateMut.mutate({ data: { crewId, toBillet } })}
          onChangeJob={(crewId, toBillet) => jobMut.mutate({ data: { crewId, toBillet } })}
        />
      ) : view === "change" ? (
        <ChangeView
          slots={data?.slots ?? []}
          loading={!data}
          thisPort={data?.run?.thisPort ?? "this port"}
          nextPort={data?.run?.nextPort ?? "Honolulu"}
        />
      ) : view === "vacant" ? (
        <VacantView slots={data?.slots ?? []} loading={!data} />
      ) : view === "due" ? (
        <DueView
          slots={data?.slots ?? []}
          loading={!data}
          error={ship.isError ? (ship.error instanceof Error ? ship.error.message : "unknown error") : null}
          saving={extraMut.isPending || rateMut.isPending || jobMut.isPending}
          thisPort={data?.run?.thisPort ?? "Long Beach"}
          nextPort={data?.run?.nextPort ?? "Honolulu"}
          onExtra={(crewId, extraDays) => extraMut.mutate({ data: { crewId, extraDays } })}
          onRate={(crewId, toBillet) => rateMut.mutate({ data: { crewId, toBillet } })}
          onChangeJob={(crewId, toBillet) => jobMut.mutate({ data: { crewId, toBillet } })}
        />
      ) : view === "board" ? (
        <>
          {data?.questions.length ? (
            <section className="mb-6 rounded-xl bg-paper p-4 shadow-border sm:p-5">
              <h2 className="font-display text-lg tracking-tight">Need a call</h2>
              <p className="mt-1 text-sm text-muted">If a rating or watch is ambiguous, it stays here until you pick.</p>
              <ul className="mt-3 space-y-3">
                {data.questions.map((q) => (
                  <li key={q.id} className="rounded-lg bg-paper-2 px-3 py-3">
                    <div className="font-medium">{q.title}</div>
                    <p className="mt-0.5 text-sm text-muted">{q.detail}</p>
                    {q.crewId ? (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/crew/$crewId" params={{ crewId: q.crewId }}>
                            Open file
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {data?.vacation.length ? (
            <section className="mb-6 rounded-xl bg-ink p-4 text-paper shadow-border sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Off the ship</p>
              <ul className="mt-3 space-y-2">
                {data.vacation.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to="/crew/$crewId" params={{ crewId: v.id }} className="hover:underline">
                      {v.fullName}
                      <span className="ml-2 text-paper/60">
                        {positionLabel(v.lastPosition)} ·{" "}
                        {isOfficerRotary(v.unionHall, v.lastAssignment ?? v.assignmentType) ? "rotary leave" : "vacation"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {!data ? (
            <p className="text-sm text-muted">
              {ship.isError
                ? `Could not load the board: ${ship.error instanceof Error ? ship.error.message : "unknown error"}`
                : "Loading the board…"}
            </p>
          ) : (
            <div className="space-y-8">
              <DeptBlock
                title="Deck"
                slots={byDept.deck}
                aboard={aboardNames}
                editing={editing}
                setEditing={setEditing}
                saving={mut.isPending || jobMut.isPending}
                onSave={(crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)}
              />
              <DeptBlock
                title="Engine"
                slots={byDept.engine}
                aboard={aboardNames}
                editing={editing}
                setEditing={setEditing}
                saving={mut.isPending || jobMut.isPending}
                onSave={(crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)}
              />
              <DeptBlock
                title="Steward"
                slots={byDept.steward}
                aboard={aboardNames}
                editing={editing}
                setEditing={setEditing}
                saving={mut.isPending || jobMut.isPending}
                onSave={(crewId, fromBillet, patch) => void saveJob(crewId, fromBillet, patch)}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">
              {(["all", "current", "applicant", "vacation", "past"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
                >
                  {t === "all" ? "All" : t === "applicant" ? "New files" : t}
                </button>
              ))}
            </div>
            <Input
              value={qstr}
              onChange={(e) => setQstr(e.target.value)}
              placeholder="Name, last 4, MMC…"
              className="sm:max-w-xs"
              aria-label="Search roster"
            />
          </div>
          <div className="overflow-hidden rounded-xl shadow-border">
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mariner</th>
                    <th className="px-4 py-3 font-medium">Billet</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">On / due</th>
                    <th className="px-4 py-3 font-medium">MMC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-paper">
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-paper-2/60">
                      <td className="px-4 py-3">
                        <Link to="/crew/$crewId" params={{ crewId: c.id }} className="font-medium hover:underline">
                          {displayName(c.fullName)}
                        </Link>
                        <div className="text-xs text-muted">{c.city && c.state ? `${c.city}, ${c.state}` : c.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {c.lastBillet ? `${c.lastBillet} · ` : ""}
                        {positionLabel(c.lastPosition)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={c.status === "current" ? "current" : c.status === "vacation" ? "steel" : c.status === "applicant" ? "neutral" : "past"}
                        >
                          {c.status === "current" ? "aboard" : c.status === "vacation" ? "off the ship" : c.status === "applicant" ? "not aboard yet" : "past"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatShort(c.lastSignOn)}
                        {c.lastDueOff ? ` → ${formatShort(c.lastDueOff)}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <ExpiryChip date={c.mmcExpiration} />
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted">
                        {ledger.isLoading ? "Loading ledger…" : "No mariners match."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AboardView({
  slots,
  occupancySlots,
  loading,
  error,
  saving,
  thisPort,
  nextPort,
  onExtra,
  onRate,
  onChangeJob,
}: {
  slots: RosterSlot[];
  occupancySlots?: RosterSlot[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  thisPort: string;
  nextPort: string;
  onExtra: (crewId: string, extraDays: number) => void;
  onRate: (crewId: string, toBillet: string) => void;
  onChangeJob: (crewId: string, toBillet: string) => void;
}) {
  const people = useMemo(() => {
    const list = slots.flatMap((slot) =>
      slot.occupants.map((o) => ({
        slot,
        occupant: o,
      })),
    );
    return list.sort(
      (a, b) =>
        a.slot.billet.sortOrder - b.slot.billet.sortOrder ||
        a.slot.billet.code.localeCompare(b.slot.billet.code) ||
        (a.occupant.tour.signOn ?? "").localeCompare(b.occupant.tour.signOn ?? "") ||
        a.occupant.crew.fullName.localeCompare(b.occupant.crew.fullName),
    );
  }, [slots]);

  const aboard = useMemo(
    () =>
      (occupancySlots ?? slots).flatMap((slot) =>
        slot.occupants.map((occupant) => ({
          id: occupant.crew.id,
          fullName: occupant.crew.fullName,
          billetCode: slot.billet.code,
          assignmentType: occupant.tour.assignmentType,
        })),
      ),
    [occupancySlots, slots],
  );

  if (loading) {
    return <p className="text-sm text-muted">{error ? `Could not load articles: ${error}` : "Loading who is aboard…"}</p>;
  }
  if (people.length === 0) {
    return (
      <div className="rounded-xl bg-paper p-6 shadow-border">
        <p className="font-medium">No one is signed on.</p>
        <p className="mt-1 text-sm text-muted">Open sign-on to put a name on articles.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 hidden overflow-hidden rounded-xl shadow-border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Due off</th>
                <th className="px-4 py-3 font-medium">Extra trips</th>
                <th className="px-4 py-3 font-medium">Change watch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-paper">
              {people.map(({ slot, occupant: o }, i) => {
                const walk = occupantWalk(o, thisPort, nextPort);
                const tone = dueTone(o.daysLeft, walk);
                return (
                  <tr key={o.crew.id} className="align-middle">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{slot.billet.title}</div>
                      <div className="text-xs text-muted">
                        {slot.billet.code} · {watchLabel(o.tour.watch ?? slot.billet.watch)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="font-medium hover:underline">
                        {o.crew.fullName}
                      </Link>
                      <div className="text-xs text-muted">
                        {o.daysOn != null ? `${o.daysOn}d on` : ""}
                        {o.sailingUp ? " · rated up" : ""}
                      </div>
                      <RateUpButtons
                        permanentRating={o.crew.permanentRating}
                        lastPosition={o.crew.lastPosition}
                        crewId={o.crew.id}
                        saving={saving}
                        onRate={onRate}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{formatShort(o.tour.signOn)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tone === "missing" ? "neutral" : tone}>{dueText(o.daysLeft, o.due.date, walk)}</Badge>
                      <div className="mt-1 text-[11px] leading-snug text-muted">
                        {o.due.baseDate && o.extraDays ? `Rule ${formatShort(o.due.baseDate)}` : o.due.rule}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ExtraDaysControl
                        compact
                        extraDays={o.extraDays ?? 0}
                        baseDate={o.due.baseDate ?? o.due.date}
                        dueOff={o.due.date}
                        saving={saving}
                        onSave={(n) => onExtra(o.crew.id, n)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ChangeJobSelect
                        fromCode={slot.billet.code}
                        crewId={o.crew.id}
                        aboard={aboard}
                        saving={saving}
                        onPick={(to) => onChangeJob(o.crew.id, to)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="block space-y-3 md:hidden">
        {people.map(({ slot, occupant: o }, i) => {
          const walk = occupantWalk(o, thisPort, nextPort);
          const tone = dueTone(o.daysLeft, walk);
          return (
            <li key={o.crew.id} className="rounded-xl bg-paper p-4 shadow-border">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sage">
                {i + 1} · {slot.billet.title}
              </p>
              <div className="mt-1 flex items-start justify-between gap-3">
                <div>
                  <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="font-medium hover:underline">
                    {o.crew.fullName}
                  </Link>
                  <p className="text-xs text-muted">{watchLabel(o.tour.watch ?? slot.billet.watch)}</p>
                  {o.sailingUp ? <p className="text-xs text-muted">rated up</p> : null}
                  <RateUpButtons
                    permanentRating={o.crew.permanentRating}
                    lastPosition={o.crew.lastPosition}
                    crewId={o.crew.id}
                    saving={saving}
                    onRate={onRate}
                  />
                </div>
                <Badge tone={tone === "missing" ? "neutral" : tone}>{dueText(o.daysLeft, o.due.date, walk)}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-sage">Joined</dt>
                  <dd>{formatShort(o.tour.signOn)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-sage">Due off</dt>
                  <dd>{formatShort(o.due.date)}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <ExtraDaysControl
                  extraDays={o.extraDays ?? 0}
                  baseDate={o.due.baseDate ?? o.due.date}
                  dueOff={o.due.date}
                  saving={saving}
                  onSave={(n) => onExtra(o.crew.id, n)}
                />
              </div>
              <div className="mt-3">
                <ChangeJobSelect
                  fromCode={slot.billet.code}
                  crewId={o.crew.id}
                  aboard={aboard}
                  saving={saving}
                  onPick={(to) => onChangeJob(o.crew.id, to)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function VacantView({ slots, loading }: { slots: RosterSlot[]; loading: boolean }) {
  const vacant = slots.filter((s) => s.occupants.length === 0);
  if (loading) {
    return <p className="text-sm text-muted">Loading vacant billets…</p>;
  }
  if (!vacant.length) {
    return (
      <div className="rounded-xl bg-paper p-6 shadow-border">
        <p className="font-medium">No vacant billets.</p>
        <p className="mt-1 text-sm text-muted">Every slot on articles has a name.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl shadow-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
          <tr>
            <th className="px-4 py-3 font-medium">Billet</th>
            <th className="px-4 py-3 font-medium">Watch</th>
            <th className="px-4 py-3 font-medium">Hall</th>
            <th className="px-4 py-3 font-medium">Usual assignment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-paper">
          {vacant.map((s) => (
            <tr key={s.billet.code}>
              <td className="px-4 py-3">
                <div className="font-medium">{s.billet.title}</div>
                <div className="font-mono text-xs text-muted">{s.billet.code}</div>
              </td>
              <td className="px-4 py-3 text-sm">{watchLabel(s.billet.watch)}</td>
              <td className="px-4 py-3 text-sm">{s.billet.unionHall}</td>
              <td className="px-4 py-3 text-sm capitalize text-muted">{s.billet.defaultAssignment.toLowerCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChangeView({
  slots,
  loading,
  thisPort,
  nextPort,
}: {
  slots: RosterSlot[];
  loading: boolean;
  thisPort: string;
  nextPort: string;
}) {
  const tagged = slots.flatMap((slot) =>
    slot.occupants.map((o) => ({ slot, occupant: o, walk: occupantWalk(o, thisPort, nextPort) })),
  );
  const leavingThis = tagged.filter((row) => row.walk.thisCall);
  const leavingNext = tagged.filter((row) => row.walk.when === "next");
  const vacantNow = slots.filter((s) => s.occupants.length === 0);
  const opening = leavingThis.filter(({ slot }) => slot.occupants.length === 1);
  if (loading) {
    return <p className="text-sm text-muted">Loading crew change…</p>;
  }
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {thisPort} this call · {nextPort} next. They walk at the port they signed on. 12 days left is the trip after — next
        home port, not this {thisPort}.
      </p>
      <section className="overflow-hidden rounded-xl shadow-border">
        <div className="bg-paper-2 px-4 py-3">
          <h2 className="font-display text-lg tracking-tight">Getting off {thisPort} this call</h2>
        </div>
        {leavingThis.length === 0 ? (
          <p className="bg-paper px-4 py-6 text-sm text-muted">Nobody walks this {thisPort}.</p>
        ) : (
          <ul className="divide-y divide-border bg-paper">
            {leavingThis.map(({ slot, occupant: o, walk }) => {
              const tone = dueTone(o.daysLeft, walk);
              return (
                <li key={o.crew.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="font-medium hover:underline">
                      {o.crew.fullName}
                    </Link>
                    <div className="text-xs text-muted">
                      {slot.billet.shortTitle} · {watchLabel(o.tour.watch ?? slot.billet.watch)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={tone === "missing" ? "neutral" : tone}>{dueText(o.daysLeft, o.due.date, walk)}</Badge>
                    <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="text-sm text-steel-2 hover:underline">
                      Sign off
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="overflow-hidden rounded-xl shadow-border">
        <div className="bg-paper-2 px-4 py-3">
          <h2 className="font-display text-lg tracking-tight">Trip after — next home port</h2>
        </div>
        {leavingNext.length === 0 ? (
          <p className="bg-paper px-4 py-6 text-sm text-muted">Nobody is walking the next home-port call.</p>
        ) : (
          <ul className="divide-y divide-border bg-paper">
            {leavingNext.map(({ slot, occupant: o, walk }) => {
              const tone = dueTone(o.daysLeft, walk);
              return (
                <li key={o.crew.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="font-medium hover:underline">
                      {o.crew.fullName}
                    </Link>
                    <div className="text-xs text-muted">
                      {slot.billet.shortTitle} · {watchLabel(o.tour.watch ?? slot.billet.watch)} · signed on {o.tour.port || "this run"}
                    </div>
                  </div>
                  <Badge tone={tone === "missing" ? "neutral" : tone}>{dueText(o.daysLeft, o.due.date, walk)}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="overflow-hidden rounded-xl shadow-border">
        <div className="bg-paper-2 px-4 py-3">
          <h2 className="font-display text-lg tracking-tight">Empty now — joining {thisPort}</h2>
        </div>
        {vacantNow.length === 0 ? (
          <p className="bg-paper px-4 py-6 text-sm text-muted">No vacant billets until someone signs off.</p>
        ) : (
          <ul className="divide-y divide-border bg-paper">
            {vacantNow.map((s) => (
              <li key={s.billet.code} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{s.billet.shortTitle}</span>
                  <span className="ml-2 text-xs text-muted">
                    {watchLabel(s.billet.watch)} · {s.billet.unionHall}
                  </span>
                </span>
                <Link to="/sign-on" className="text-sm text-steel-2 hover:underline">
                  Sign on
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="overflow-hidden rounded-xl shadow-border">
        <div className="bg-paper-2 px-4 py-3">
          <h2 className="font-display text-lg tracking-tight">Opens when they leave this call</h2>
        </div>
        {opening.length === 0 ? (
          <p className="bg-paper px-4 py-6 text-sm text-muted">No extra slots open from this call’s walk-offs.</p>
        ) : (
          <ul className="divide-y divide-border bg-paper">
            {opening.map(({ slot, occupant: o }) => (
              <li key={o.crew.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{slot.billet.shortTitle}</span>
                  <span className="ml-2 text-xs text-muted">after {o.crew.fullName}</span>
                </span>
                <Link to="/sign-on" className="text-sm text-steel-2 hover:underline">
                  Sign on
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DueView({
  slots,
  loading,
  error,
  saving,
  thisPort,
  nextPort,
  onExtra,
  onRate,
  onChangeJob,
}: {
  slots: RosterSlot[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  thisPort: string;
  nextPort: string;
  onExtra: (crewId: string, extraDays: number) => void;
  onRate: (crewId: string, toBillet: string) => void;
  onChangeJob: (crewId: string, toBillet: string) => void;
}) {
  const thisSlots = slots
    .map((slot) => ({
      ...slot,
      occupants: slot.occupants.filter((o) => occupantWalk(o, thisPort, nextPort).thisCall),
    }))
    .filter((slot) => slot.occupants.length > 0);
  const nextSlots = slots
    .map((slot) => ({
      ...slot,
      occupants: slot.occupants.filter((o) => occupantWalk(o, thisPort, nextPort).when === "next"),
    }))
    .filter((slot) => slot.occupants.length > 0);
  if (loading) {
    return <p className="text-sm text-muted">{error ? `Could not load articles: ${error}` : "Loading who is due off…"}</p>;
  }
  if (!thisSlots.length && !nextSlots.length) {
    return (
      <div className="rounded-xl bg-paper p-6 shadow-border">
        <p className="font-medium">Nobody is walking this call or the trip after.</p>
        <p className="mt-1 text-sm text-muted">12 days left means next home port, not this {thisPort}.</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-display text-lg tracking-tight">Walking {thisPort} this call</h2>
        {thisSlots.length ? (
          <AboardView
            slots={thisSlots}
            occupancySlots={slots}
            loading={false}
            error={null}
            saving={saving}
            thisPort={thisPort}
            nextPort={nextPort}
            onExtra={onExtra}
            onRate={onRate}
            onChangeJob={onChangeJob}
          />
        ) : (
          <p className="rounded-xl bg-paper px-4 py-6 text-sm text-muted shadow-border">Nobody walks this {thisPort}.</p>
        )}
      </div>
      <div>
        <h2 className="mb-3 font-display text-lg tracking-tight">Trip after — next home port</h2>
        {nextSlots.length ? (
          <AboardView
            slots={nextSlots}
            occupancySlots={slots}
            loading={false}
            error={null}
            saving={saving}
            thisPort={thisPort}
            nextPort={nextPort}
            onExtra={onExtra}
            onRate={onRate}
            onChangeJob={onChangeJob}
          />
        ) : (
          <p className="rounded-xl bg-paper px-4 py-6 text-sm text-muted shadow-border">Nobody is walking the next home-port call.</p>
        )}
      </div>
    </div>
  );
}

function DeptBlock({
  title,
  slots,
  aboard,
  editing,
  setEditing,
  saving,
  onSave,
}: {
  title: string;
  slots: RosterSlot[];
  aboard: Array<{ id: string; fullName: string; billetCode: string | null; assignmentType?: string | null }>;
  editing: string | null;
  setEditing: (id: string | null) => void;
  saving: boolean;
  onSave: (crewId: string, fromBillet: string, patch: AssignmentPatch) => void;
}) {
  return (
    <section>
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-xl shadow-border">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="px-4 py-3 font-medium">Billet</th>
                <th className="px-4 py-3 font-medium">Watch</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">On</th>
                <th className="px-4 py-3 font-medium">Due off</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-paper">
              {slots.map((slot) =>
                slot.occupants.length === 0 ? (
                  <tr key={slot.billet.code} className="bg-paper-2/40">
                    <td className="px-4 py-3 font-mono text-xs">{slot.billet.shortTitle}</td>
                    <td className="px-4 py-3 text-xs text-muted">{watchLabel(slot.billet.watch)}</td>
                    <td className="px-4 py-3 text-sm text-faint">Vacant</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {slot.billet.unionHall} · {slot.billet.defaultAssignment.toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-muted">—</td>
                    <td className="px-4 py-3 text-muted">—</td>
                    <td className="px-4 py-3" />
                  </tr>
                ) : (
                  slot.occupants.map((o, i) => (
                    <SlotRow
                      key={`${slot.billet.code}-${o.crew.id}`}
                      slot={slot}
                      aboard={aboard}
                      showBillet={i === 0}
                      occupant={o}
                      editing={editing === o.crew.id}
                      saving={saving}
                      onEdit={() => setEditing(editing === o.crew.id ? null : o.crew.id)}
                      onSave={(patch) => onSave(o.crew.id, slot.billet.code, patch)}
                    />
                  ))
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SlotRow({
  slot,
  aboard,
  showBillet,
  occupant,
  editing,
  saving,
  onEdit,
  onSave,
}: {
  slot: RosterSlot;
  aboard: Array<{ id: string; fullName: string; billetCode: string | null; assignmentType?: string | null }>;
  showBillet: boolean;
  occupant: RosterSlot["occupants"][number];
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (patch: AssignmentPatch) => void;
}) {
  const o = occupant;
  const tone = dueTone(o.daysLeft);
  const [watch, setWatch] = useState(o.tour.watch ?? slot.billet.watch ?? "");
  const [kind, setKind] = useState(o.tour.assignmentType ?? "");
  const [siu, setSiu] = useState(o.tour.seniorityClass ?? "");
  const [due, setDue] = useState(o.due.date ?? "");
  const [billet, setBillet] = useState(slot.billet.code);
  const jobOptions = listBilletChanges(slot.billet.code, aboard, o.crew.id);

  return (
    <tr className={cn(slot.occupants.length > 1 ? "bg-warn/5" : undefined)}>
      <td className="px-4 py-3 align-top font-mono text-xs">{showBillet ? slot.billet.shortTitle : ""}</td>
      <td className="px-4 py-3 align-top text-xs text-muted">{watchLabel(o.tour.watch ?? slot.billet.watch)}</td>
      <td className="px-4 py-3 align-top">
        <Link to="/crew/$crewId" params={{ crewId: o.crew.id }} className="font-medium hover:underline">
          {o.crew.fullName}
        </Link>
        <div className="text-xs text-muted">
          {o.daysOn != null ? `${o.daysOn}d on` : ""}
          {o.crew.expiredCount > 0 ? ` · ${o.crew.expiredCount} expired tickets` : ""}
        </div>
        {o.sailingUp ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge tone="watch">rated up</Badge>
            <span className="text-[11px] text-muted">
              Perm {positionLabel(o.crew.permanentRating)} · {o.covering}
            </span>
          </div>
        ) : (o.tour.assignmentType ?? "").toUpperCase() === "RELIEF" ? (
          <div className="mt-0.5 text-[11px] text-faint">
            {o.tour.relieving ? `Relief covering ${o.tour.relieving}` : "Trip relief"}
          </div>
        ) : o.crew.permanentRating ? (
          <div className="mt-0.5 text-[11px] text-faint">Permanent {positionLabel(o.crew.permanentRating)}</div>
        ) : null}
        {editing ? (
          <div className="mt-3 grid max-w-lg gap-2 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">Change watch · same family only</span>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                value={billet}
                onChange={(e) => {
                  const code = e.target.value;
                  setBillet(code);
                  const next = billetByCode(code);
                  if (next?.watch) setWatch(next.watch);
                }}
              >
                <option value={slot.billet.code}>{slot.billet.shortTitle}</option>
                {jobOptions.map((opt) => (
                  <option key={`${opt.kind}-${opt.code}-${opt.label}`} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted">Watch</span>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                value={watch}
                onChange={(e) => setWatch(e.target.value)}
              >
                <option value="">Unassigned</option>
                <option value="day">Day</option>
                <option value="12-4">12–4</option>
                <option value="4-8">4–8</option>
                <option value="8-12">8–12</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted">Assignment</span>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="PERMANENT">Permanent</option>
                <option value="ROTARY">Rotary</option>
                <option value="RELIEF">Relief</option>
                <option value="CADET">Cadet</option>
                <option value="APPRENTICE">Apprentice</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted">SIU class</span>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                value={siu}
                onChange={(e) => setSiu(e.target.value)}
              >
                <option value="">Not on file · A 75–120</option>
                <option value="A">A · 75–120d</option>
                <option value="B">B · 180d or 1 RT</option>
                <option value="C">C · 60d or 1 RT</option>
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">Discharge date (this wins over the 56-day / union rule)</span>
              <Input type="date" className="mt-1" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  onSave({
                    billetCode: billet,
                    watch: watch || null,
                    assignmentType: kind || null,
                    seniorityClass: siu || null,
                    dueOff: due || null,
                  })
                }
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top text-xs">
        <div>{(o.tour.assignmentType ?? "—").toLowerCase()}</div>
        {(o.tour.assignmentType ?? "").toUpperCase() === "RELIEF" && o.tour.relieving ? (
          <div className="text-muted">covering {o.tour.relieving}</div>
        ) : (
          <div className="text-muted">{o.tour.unionHall ?? ""}</div>
        )}
      </td>
      <td className="px-4 py-3 align-top text-xs text-muted">{formatShort(o.tour.signOn)}</td>
      <td className="px-4 py-3 align-top">
        <Badge tone={tone === "missing" ? "neutral" : tone}>{dueText(o.daysLeft, o.due.date)}</Badge>
        <div className="mt-1 max-w-[14rem] text-[11px] leading-snug text-muted">{o.due.rule}</div>
        {o.extraDays ? <div className="mt-1 text-[11px] text-warn">{extraTripsLabel(o.extraDays)}</div> : null}
      </td>
      <td className="px-4 py-3 align-top">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {editing ? "Close" : "Edit"}
        </Button>
      </td>
    </tr>
  );
}

function ChangeJobSelect({
  fromCode,
  crewId,
  aboard,
  saving,
  onPick,
}: {
  fromCode: string;
  crewId: string;
  aboard: Array<{ id: string; fullName: string; billetCode: string | null; assignmentType?: string | null }>;
  saving: boolean;
  onPick: (toBillet: string) => void;
}) {
  const options = listBilletChanges(fromCode, aboard, crewId);
  const [pending, setPending] = useState<BilletChangeOption | null>(null);
  if (!options.length && !pending) return null;
  return (
    <>
      {options.length ? (
        <select
          key={`${crewId}-${fromCode}`}
          className="block h-9 w-full min-w-[11rem] max-w-[16rem] rounded-md border border-border bg-paper px-2 text-xs"
          defaultValue=""
          disabled={saving}
          aria-label="Change watch"
          onChange={(e) => {
            const v = e.target.value;
            const picked = options.find((o) => o.code === v) ?? null;
            e.target.value = "";
            if (picked) setPending(picked);
          }}
        >
          <option value="">Change watch…</option>
          {options.map((opt) => (
            <option key={`${opt.kind}-${opt.code}-${opt.label}`} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
      {pending && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
              onClick={() => setPending(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`trade-title-${crewId}`}
                className="w-full max-w-md rounded-xl bg-paper p-5 shadow-border"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Change watch</p>
                <h2 id={`trade-title-${crewId}`} className="mt-1 font-display text-xl tracking-tight">
                  {pending.label}?
                </h2>
                <p className="mt-2 text-sm text-muted">They swap watches. Due-off stays with each person.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      onPick(pending.code);
                      setPending(null);
                    }}
                  >
                    {pending.kind === "trade" ? "Yes, trade" : "Yes, move"}
                  </Button>
                  <Button variant="outline" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function RateUpButtons({
  permanentRating,
  lastPosition,
  crewId,
  saving,
  onRate,
}: {
  permanentRating: string | null | undefined;
  lastPosition: string | null | undefined;
  crewId: string;
  saving: boolean;
  onRate: (crewId: string, toBillet: string) => void;
}) {
  const upgrades = remainingUpgrades(permanentRating, lastPosition);
  if (!upgrades.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {upgrades.map((u) => (
        <button
          key={u.billet}
          type="button"
          disabled={saving}
          onClick={() => onRate(crewId, u.billet)}
          className="rounded-md bg-paper-2 px-2 py-0.5 text-[11px] text-ink hover:bg-paper-3 disabled:opacity-40"
        >
          Rate up to {u.title}
        </button>
      ))}
    </div>
  );
}
