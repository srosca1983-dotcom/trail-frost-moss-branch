import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShort } from "@/lib/crew/dates";
import { positionLabel } from "@/lib/crew/ratings";
import { CHANGE_REASONS, eventTypeLabel, ratingKey, reasonLabel, slotDefByKey, type PermanentChangeReason } from "@/lib/crew/permanents";
import { changePermanent, dropBackToPermanent, getPermanentsBoard, rateUp } from "@/lib/crew/server";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { VESSEL } from "@/lib/crew/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/permanents")({
  validateSearch: (s: Record<string, unknown>): { view?: "rated" } => {
    if (s.view === "rated") return { view: "rated" };
    return {};
  },
  loader: () => getPermanentsBoard(),
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

type Panel =
  | { kind: "change"; slotKey: string }
  | { kind: "rate"; slotKey: string; crewId: string }
  | null;

function Board() {
  const qc = useQueryClient();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const ratedOnly = search.view === "rated";
  const q = useQuery({ queryKey: ["permanents"], queryFn: () => getPermanentsBoard(), initialData: Route.useLoaderData() });
  const [panel, setPanel] = useState<Panel>(null);

  const invalidate = async () => {
    await invalidateDesk(qc);
    setPanel(null);
  };

  const rateMut = useMutation({
    mutationFn: rateUp,
    onSuccess: async (res) => {
      toast.success(res.question ?? "Rate updated");
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up"),
  });

  const dropMut = useMutation({
    mutationFn: dropBackToPermanent,
    onSuccess: async () => {
      toast.success("Back on their permanent job");
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not drop back"),
  });

  const changeMut = useMutation({
    mutationFn: changePermanent,
    onSuccess: async () => {
      toast.success("Permanents list updated");
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change permanent"),
  });

  const groups = useMemo(() => {
    const slots = (q.data?.slots ?? []).filter((s) => (ratedOnly ? s.sailingUp : true));
    const order = [
      { key: "deck-off", title: "Deck officers", match: (r: string) => /MASTER|CHIEF MATE|C\/M/i.test(r) },
      { key: "eng-off", title: "Engine officers", match: (r: string) => /C\/E|1A|2A|GAS|WATCH 2|CHIEF ENG/i.test(r) },
      { key: "unlic", title: "Unlicensed permanents", match: () => true },
    ];
    const used = new Set<string>();
    return order.map((g) => {
      const list = slots.filter((s) => !used.has(s.id) && g.match(s.title + s.rating));
      list.forEach((s) => used.add(s.id));
      return { ...g, slots: list };
    }).filter((g) => g.slots.length);
  }, [q.data, ratedOnly]);

  const data = q.data;

  return (
    <>
      <PageHeader
        kicker={VESSEL}
        title="Who owns the job, and who is sailing it."
        description="Permanent chief mates, 1st A/Es, and 2nd A/Es can rate up without losing their seat. Change a permanent when they quit, get fired, or are promoted into the job."
      />

      {data ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <Stat label="Permanent seats" value={data.slots.length} hint="Rotation pairs plus Watch 2" />
            <Stat label="Vacant seats" value={data.vacant} hint="Need a new permanent" />
            <Stat label="Rated up" value={data.sailingUp} hint="Perm rank below the rate they are sailing" />
          </div>
          <div className="flex justify-end">
            <div className="flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">
              <button
                type="button"
                onClick={() => void navigate({ search: {} })}
                className={cn("rounded-md px-3 py-1.5 text-sm", !ratedOnly ? "bg-ink text-paper" : "text-muted hover:text-ink")}
              >
                All seats
              </button>
              <button
                type="button"
                onClick={() => void navigate({ search: { view: "rated" } })}
                className={cn("rounded-md px-3 py-1.5 text-sm", ratedOnly ? "bg-ink text-paper" : "text-muted hover:text-ink")}
              >
                Rated up
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{q.isError ? "Could not load permanents." : "Loading permanents…"}</p>
      )}

      {ratedOnly && data && !data.sailingUp ? (
        <div className="mb-6 rounded-xl bg-paper p-6 shadow-border">
          <p className="font-medium">Nobody is rated up.</p>
          <p className="mt-1 text-sm text-muted">A permanent sailing above their own job would show here.</p>
        </div>
      ) : null}

      {groups.map((g) => (
        <section key={g.key} className="mb-8">
          <h2 className="font-display text-xl tracking-tight">{g.title}</h2>
          <ul className="mt-3 space-y-3">
            {g.slots.map((s) => {
              const open = panel?.slotKey === s.key;
              return (
                <li key={s.id} className="rounded-xl bg-paper p-4 shadow-border sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-sage">
                        {s.title} · seat {s.seat}
                        {s.onSheet ? "" : " · not on NS5"}
                      </p>
                      {s.holder ? (
                        <>
                          <Link
                            to="/crew/$crewId"
                            params={{ crewId: s.holder.id }}
                            className="mt-1 block font-display text-2xl tracking-tight hover:underline"
                          >
                            {s.holder.fullName}
                          </Link>
                          <p className="mt-1 text-sm text-muted">
                            Permanent {positionLabel(s.holder.permanentRating ?? s.rating)}
                            {s.sailingUp ? ` · ${s.covering}` : s.holder.status === "current" ? " · sailing own job" : ""}
                          </p>
                          {s.holder.status !== "current" && s.returnOn ? (
                            <p className="mt-1 text-sm">
                              Returns {formatShort(s.returnOn)}
                              {s.returnFrom ? ` · when ${s.returnFrom} is due off` : ""}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge tone={s.holder.status === "current" ? "current" : s.holder.status === "vacation" ? "steel" : "past"}>
                              {s.holder.status === "current" ? "aboard" : s.holder.status}
                            </Badge>
                            {s.sailingUp ? <Badge tone="watch">rated up</Badge> : null}
                            <Badge tone="neutral">{s.unionHall}</Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-1 font-display text-2xl tracking-tight text-faint">Open seat</p>
                          <p className="mt-1 text-sm text-muted">No permanent assigned. Pick a replacement.</p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.holder && s.holder.status === "current" && s.upgrades.length ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPanel({ kind: "rate", slotKey: s.key, crewId: s.holder!.id })}
                        >
                          Rate up
                        </Button>
                      ) : null}
                      {s.holder && s.sailingUp && s.holder.status === "current" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dropMut.isPending}
                          onClick={() => dropMut.mutate({ data: { crewId: s.holder!.id } })}
                        >
                          Drop back
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant={open && panel?.kind === "change" ? "default" : "outline"}
                        onClick={() => setPanel(open && panel?.kind === "change" ? null : { kind: "change", slotKey: s.key })}
                      >
                        {s.holder ? "Change" : "Assign"}
                      </Button>
                    </div>
                  </div>

                  {open && panel?.kind === "rate" && s.holder ? (
                    <RatePanel
                      options={s.upgrades}
                      saving={rateMut.isPending}
                      onCancel={() => setPanel(null)}
                      onPick={(billet) => rateMut.mutate({ data: { crewId: s.holder!.id, toBillet: billet } })}
                    />
                  ) : null}

                  {open && panel?.kind === "change" ? (
                    <ChangePanel
                      slotKey={s.key}
                      hasHolder={Boolean(s.holder)}
                      currentRating={s.rating}
                      candidates={data?.candidates ?? []}
                      saving={changeMut.isPending}
                      onCancel={() => setPanel(null)}
                      onSubmit={(payload) => changeMut.mutate({ data: payload })}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {data?.events.length ? (
        <section className="mt-4">
          <h2 className="font-display text-lg tracking-tight">Recent changes</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {data.events.map((e) => (
              <li key={e.id} className="rounded-lg bg-paper-2 px-3 py-2 text-muted">
                <span className="text-ink">{eventTypeLabel(e.eventType)}</span>
                {e.reason ? ` · ${reasonLabel(e.reason as PermanentChangeReason)}` : ""}
                {e.fromRating && e.toRating ? ` · ${e.fromRating} → ${e.toRating}` : ""}
                {e.notes ? ` · ${e.notes}` : ""}
                {e.occurredOn ? ` · ${e.occurredOn}` : ""}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl bg-paper p-4 shadow-border">
      <p className="text-[11px] uppercase tracking-[0.16em] text-sage">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function RatePanel({
  options,
  saving,
  onCancel,
  onPick,
}: {
  options: Array<{ rating: string; title: string; billet: string }>;
  saving: boolean;
  onCancel: () => void;
  onPick: (billet: string) => void;
}) {
  return (
    <div className="mt-4 rounded-lg bg-paper-2 p-3">
      <p className="text-sm font-medium">Rate up this tour</p>
      <p className="mt-1 text-sm text-muted">
        Keeps their permanent seat. Articles show the higher rate until they drop back.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={o.billet} size="sm" disabled={saving} onClick={() => onPick(o.billet)}>
            {o.title}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ChangePanel({
  slotKey,
  hasHolder,
  currentRating,
  candidates,
  saving,
  onCancel,
  onSubmit,
}: {
  slotKey: string;
  hasHolder: boolean;
  currentRating: string;
  candidates: Array<{ id: string; fullName: string; lastPosition: string | null; status: CrewStatusLike }>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    slotKey: string;
    reason: PermanentChangeReason;
    replacementCrewId?: string | null;
    promoteToSlotKey?: string | null;
    notes?: string | null;
  }) => void;
}) {
  const def = slotDefByKey(slotKey);
  const [reason, setReason] = useState<PermanentChangeReason>(hasHolder ? "quit" : "assigned");
  const [replacement, setReplacement] = useState("");
  const [promoteTo, setPromoteTo] = useState("");
  const [notes, setNotes] = useState("");

  const destOptions = useMemo(() => {
    const from = ratingKey(def?.rating ?? currentRating);
    const opts: Array<{ key: string; label: string }> = [];
    if (from === "CM") {
      opts.push({ key: "perm-master-a", label: "Master · seat A" }, { key: "perm-master-b", label: "Master · seat B" });
    }
    if (from === "1AE") {
      opts.push({ key: "perm-ce-a", label: "Chief Engineer · seat A" }, { key: "perm-ce-b", label: "Chief Engineer · seat B" });
    }
    if (from === "2AE" || from === "GAS2") {
      opts.push(
        { key: "perm-1ae-a", label: "1st A/E · seat A" },
        { key: "perm-1ae-b", label: "1st A/E · seat B" },
        { key: "perm-ce-a", label: "Chief Engineer · seat A" },
        { key: "perm-ce-b", label: "Chief Engineer · seat B" },
      );
    }
    return opts;
  }, [currentRating, def]);

  const needsPerson = reason === "replaced" || reason === "assigned" || !hasHolder;
  const needsDest = reason === "promoted";

  return (
    <div className="mt-4 rounded-lg bg-paper-2 p-3">
      <p className="text-sm font-medium">{hasHolder ? "Change this permanent" : "Assign this seat"}</p>
      <p className="mt-1 text-sm text-muted">
        Quit or fired takes them off the list. Promoted moves them to a higher seat — that seat must be vacant. Replaced puts someone else in this job.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {hasHolder ? (
          <label className="text-xs">
            <span className="text-muted">Reason</span>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value as PermanentChangeReason)}
            >
              {CHANGE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {reasonLabel(r)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-muted sm:col-span-2">Assigning a new permanent to this open seat.</p>
        )}
        {needsPerson ? (
          <label className="text-xs sm:col-span-2">
            <span className="text-muted">Who takes the seat</span>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
            >
              <option value="">Pick a mariner…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                  {c.lastPosition ? ` · ${positionLabel(c.lastPosition)}` : ""}
                  {c.status !== "current" ? ` · ${c.status}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {needsDest ? (
          <label className="text-xs sm:col-span-2">
            <span className="text-muted">Promote into</span>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
              value={promoteTo}
              onChange={(e) => setPromoteTo(e.target.value)}
            >
              <option value="">Pick the higher seat…</option>
              {destOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-xs sm:col-span-2">
          <span className="text-muted">Note (optional)</span>
          <input
            className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-3 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Quit notice, promotion date…"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={saving || (needsPerson && !replacement) || (needsDest && !promoteTo)}
          onClick={() =>
            onSubmit({
              slotKey,
              reason: hasHolder ? reason : "assigned",
              replacementCrewId: needsPerson ? replacement || null : null,
              promoteToSlotKey: needsDest ? promoteTo || null : null,
              notes: notes || null,
            })
          }
        >
          Save change
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

type CrewStatusLike = "current" | "past" | "applicant" | "vacation";
