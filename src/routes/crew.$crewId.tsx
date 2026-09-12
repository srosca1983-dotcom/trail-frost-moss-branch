import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, type DragEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { ExtraDaysControl } from "@/components/extra-days";
import { ExpiryChip } from "@/components/expiry-chip";
import { PortSelect } from "@/components/port-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CrewPicker } from "@/components/crew-picker";
import { addDays, formatDate, formatShort, daysUntil, daysAboard, todayUtc } from "@/lib/crew/dates";
import { downloadPdf } from "@/lib/crew/crew-list";
import { buildSignOffPdf, signOffFilename } from "@/lib/crew/fill-signoff";
import { enoadGaps, walkOff } from "@/lib/crew/ports";
import { positionLabel, requirementApplies } from "@/lib/crew/ratings";
import { packetFromFile, slimPacket, TICKET_ACCEPT, ticketFileProblem } from "@/lib/crew/pdf";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { getCrew, getVesselRun, listRequirements, setCrewStatus, rateUp, dropBackToPermanent, addExtraDays, parsePackets, commitTickets, updateCrewIdentity, deleteCrew, mergeCrewFiles, listCrew } from "@/lib/crew/server";
import { DOC_TYPE_TO_REQ } from "@/lib/crew/requirements";
import { NSE_CODES, NSE_KINDS, NSE_SHORT, PERMANENT_CREW } from "@/lib/crew/nse";
import { coveringLabel, isRatedUp, remainingUpgrades } from "@/lib/crew/permanents";
import { sameFamilyName, sameGivenName } from "@/lib/crew/match";
import { extraTripsLabel, watchLabel, computeDueOff, remainingCoveredDays, isOfficerRotary, setDateFromTour } from "@/lib/crew/shipping";
import { VESSEL } from "@/lib/crew/types";
import { SmmPrintPanel } from "@/components/smm-print-panel";
import { expiredPrintableSmm } from "@/lib/crew/smm-print";
import { detailToParsed } from "@/lib/crew/map";

export const Route = createFileRoute("/crew/$crewId")({
  loader: ({ params }) => getCrew({ data: { id: params.crewId } }),
  staleTime: 60_000,
  component: Page,
});

function Page() {
  const { crewId } = Route.useParams();
  return (
    <Desk>
      <Profile key={crewId} id={crewId} />
    </Desk>
  );
}

function Profile({ id }: { id: string }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["crew", id], queryFn: () => getCrew({ data: { id } }), initialData: Route.useLoaderData() });
  const reqs = useQuery({ queryKey: ["requirements"], queryFn: () => listRequirements() });
  const [tab, setTab] = useState<"overview" | "docs" | "tours" | "packet">("overview");
  const [reading, setReading] = useState(false);
  const [over, setOver] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [mergePick, setMergePick] = useState("");
  const [mergeTyped, setMergeTyped] = useState("");

  const statusMut = useMutation({
    mutationFn: (status: "current" | "past" | "vacation") =>
      setCrewStatus({ data: { id, status, signOff: status === "current" ? null : new Date().toISOString().slice(0, 10) } }),
    onSuccess: (res, status) => {
      void invalidateDesk(qc);
      if (status === "past") {
        toast.success("Off articles. Billet vacant. Leaving sheet downloaded.");
      } else if (res.resumed && res.dueOff) {
        const left =
          res.remaining != null && res.tourDays != null ? `${res.remaining} of ${res.tourDays} days left · ` : "";
        toast.success(`Back aboard. ${left}due off ${formatDate(res.dueOff)}`);
      } else if (res.remaining != null && !res.resumed) {
        toast.success(
          `Rotary leave started. Clock paused with ${res.remaining} of ${res.tourDays ?? 120} days left.`,
        );
      } else {
        toast.success("Back aboard.");
      }
      if (res.warning) toast.message(res.warning);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update articles"),
  });
  const rateMut = useMutation({
    mutationFn: rateUp,
    onSuccess: (res) => {
      void invalidateDesk(qc);
      toast.success(res.question ?? "Rate updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rate up"),
  });
  const dropMut = useMutation({
    mutationFn: dropBackToPermanent,
    onSuccess: () => {
      void invalidateDesk(qc);
      toast.success("Back on their permanent job");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not drop back"),
  });
  const extraMut = useMutation({
    mutationFn: addExtraDays,
    onSuccess: (res) => {
      void invalidateDesk(qc);
      toast.success(res.due.date ? `Due off ${formatDate(res.due.date)}` : "Extra days saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save extra days"),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteCrew({ data: { id } }),
    onSuccess: (res) => {
      void invalidateDesk(qc);
      toast.success(`${res.fullName} removed from the ledger.`);
      void nav({ to: "/crew" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete that file"),
  });
  const rosterQ = useQuery({ queryKey: ["crew"], queryFn: () => listCrew(), staleTime: 60_000 });
  const mergeMut = useMutation({
    mutationFn: (otherId: string) => mergeCrewFiles({ data: { a: id, b: otherId } }),
    onSuccess: (res) => {
      void invalidateDesk(qc);
      toast.success(`Kept ${res.keepName}. Removed ${res.absorbedName}.`);
      setMergePick("");
      setMergeTyped("");
      if (res.keepId !== id) void nav({ to: "/crew/$crewId", params: { crewId: res.keepId } });
      else void q.refetch();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not combine those files"),
  });
  const identMut = useMutation({
    mutationFn: updateCrewIdentity,
    onSuccess: () => {
      void invalidateDesk(qc);
      toast.success("Coast Guard fields saved");
      setEditingIdent(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save identity"),
  });
  const runQ = useQuery({ queryKey: ["vessel-run"], queryFn: () => getVesselRun() });
  const [editingIdent, setEditingIdent] = useState(false);
  const [signOffOpen, setSignOffOpen] = useState(false);

  const c = q.data;
  if (q.isLoading) return <p className="text-sm text-muted">Opening file…</p>;
  if (!c) return <p className="text-sm text-muted">Mariner not found.</p>;

  const formCodes = new Set(c.forms.map((f) => f.formCode.toUpperCase()));
  const docCodes = new Set(c.documents.map((d) => DOC_TYPE_TO_REQ[d.docType]).filter(Boolean));
  const permanent = PERMANENT_CREW.find((p) => p.id === c.id);
  const ratedUp = isRatedUp(c.permanentRating, c.lastPosition);
  const upgrades = remainingUpgrades(c.permanentRating, c.lastPosition);
  const openTour = c.tours.find((t) => !t.signOff) ?? c.tours[0];
  const rotary = isOfficerRotary(openTour?.unionHall ?? c.unionHall, openTour?.assignmentType ?? c.assignmentType);
  const kind = (openTour?.assignmentType ?? c.assignmentType ?? "").toUpperCase();
  const leaveUsed = rotary && ((openTour?.leaveCount ?? 0) >= 1 || Boolean(openTour?.leaveStartedOn));
  const canLeave =
    c.status === "current" && kind !== "RELIEF" && kind !== "CADET" && kind !== "APPRENTICE" && !leaveUsed;
  const crewId = c.id;
  const crewName = c.fullName;

  async function ingestTicket(file: File) {
    const problem = ticketFileProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setReading(true);
    try {
      const payload = slimPacket(await packetFromFile(file));
      const parsed = await parsePackets({ data: { packets: [payload], skipBust: true } });
      const r = parsed[0];
      if (!r?.person) {
        throw new Error(r?.error ?? "Could not read that file. Drop the passport or MMC photo by itself.");
      }
      if (r.person.lastName && c.lastName && !sameFamilyName(r.person.lastName, c.lastName)) {
        toast.error(`That packet is ${r.person.fullName}, not ${crewName}. Drop it on Inbox so it opens its own file.`);
        return;
      }
      if (
        r.person.lastName &&
        c.lastName &&
        sameFamilyName(r.person.lastName, c.lastName) &&
        r.person.firstName &&
        c.firstName &&
        r.person.firstName.replace(/[^A-Za-z]/g, "").length >= 2 &&
        !sameGivenName(r.person.firstName, c.firstName)
      ) {
        toast.error(`That packet is ${r.person.fullName}, not ${crewName}. Drop it on Inbox if it is a different mariner.`);
        return;
      }
      if (!r.person.documents.length) {
        toast.error("Matched the name. Tickets were not on that scan — drop the passport or MMC photo.");
        return;
      }
      const res = await commitTickets({
        data: { crewId, person: r.person, filename: file.name },
      });
      await invalidateDesk(qc);
      const readAs =
        r.person.fullName && r.person.fullName !== crewName ? ` Read as ${r.person.fullName}.` : "";
      toast.success(`Saved ${res.upserted} ticket${res.upserted === 1 ? "" : "s"} to ${crewName}.${readAs}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      setReading(false);
    }
  }
  const openLeave = openTour?.leaveStartedOn ? (daysAboard(openTour.leaveStartedOn) ?? 0) : 0;
  const clock = openTour
    ? remainingCoveredDays({
        signOn: openTour.signOn,
        unionHall: openTour.unionHall ?? c.unionHall,
        assignmentType: openTour.assignmentType ?? c.assignmentType,
        siuClass: (openTour.seniorityClass as "A" | "B" | "C") ?? (c.seniorityClass as "A" | "B" | "C") ?? null,
        lengthDays: openTour.lengthDays,
        extraDays: openTour.extraDays,
        leaveDays: openTour.leaveDays,
        leaveStartedOn: openTour.leaveStartedOn,
      })
    : null;
  const computedDue = openTour
    ? computeDueOff({
        signOn: openTour.signOn,
        unionHall: openTour.unionHall ?? c.unionHall,
        assignmentType: openTour.assignmentType ?? c.assignmentType,
        siuClass: (openTour.seniorityClass as "A" | "B" | "C") ?? (c.seniorityClass as "A" | "B" | "C") ?? null,
        lengthDays: openTour.lengthDays,
        explicitEnd: setDateFromTour(openTour),
        extraDays: openTour.extraDays,
        leaveDays: (openTour.leaveDays ?? 0) + openLeave,
      })
    : null;
  const daysLeft = daysUntil(computedDue?.date ?? openTour?.dueOff);
  const walk = walkOff({
    daysLeft,
    embarkPort: openTour?.port,
    thisPort: runQ.data?.thisPort ?? "Long Beach",
    nextPort: runQ.data?.nextPort ?? "Honolulu",
  });
  const medical = c.documents.find((d) => d.docType === "medical");
  const drugFree = c.documents.find((d) => d.docType === "drug_free");
  const expiredSmm = expiredPrintableSmm(c.documents);
  const mergeOther = (rosterQ.data ?? []).find((p) => p.id === mergePick) ?? null;
  const namesDiffer = Boolean(
    mergeOther?.lastName && c.lastName && !sameFamilyName(c.lastName, mergeOther.lastName),
  );
  const coastGaps = enoadGaps({
    lastName: c.lastName,
    fullName: c.fullName,
    dob: c.dob,
    sex: c.sex,
    passportNumber: c.passportNumber,
    mmcNumber: c.mmcNumber,
    passportExpiration: c.passportExpiration,
    mmcExpiration: c.mmcExpiration,
    embarkPort: openTour?.port,
  });

  return (
    <>
      <Link to="/crew" className="mb-4 inline-flex items-center gap-1 text-sm text-steel-2 hover:underline">
        <ArrowLeft className="size-4" /> Roster
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">{VESSEL}</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">{c.fullName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={c.status === "current" ? "current" : c.status === "vacation" ? "steel" : c.status === "applicant" ? "steel" : "past"}>
              {c.status === "vacation" && openTour?.leaveStartedOn ? "rotary leave" : c.status}
            </Badge>
            <span className="text-sm text-muted">
              {c.billetCode ? `${c.billetCode} · ` : ""}
              {positionLabel(c.lastPosition)}
              {c.watch ? ` · ${watchLabel(c.watch)}` : ""}
            </span>
            {c.ssLast4 ? <span className="font-mono text-xs text-faint">··{c.ssLast4}</span> : null}
            {ratedUp ? <Badge tone="watch">rated up</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status !== "current" ? (
            <Button onClick={() => statusMut.mutate("current")}>
              {openTour?.leaveStartedOn ? "Return from leave" : "Mark aboard"}
            </Button>
          ) : (
            <>
              <Button variant="outline" type="button" onClick={() => setSignOffOpen(true)}>
                Sign off — they are leaving
              </Button>
              {canLeave ? (
                <Button variant="outline" onClick={() => statusMut.mutate("vacation")}>
                  {rotary ? "Rotary leave" : "On vacation"}
                </Button>
              ) : null}
            </>
          )}
          {c.status !== "current" ? (
            <Button variant="outline" asChild>
              <Link to="/sign-on" search={{ crewId: c.id }}>
                Sign them back on
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {c.tours.length > 0 ? (
        <p className="mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm">
          {openTour?.leaveStartedOn && c.status === "vacation" ? (
            <>
              On rotary leave since {formatDate(openTour.leaveStartedOn)}.
              {clock?.remaining != null && clock.tourDays != null
                ? ` ${clock.remaining} of ${clock.tourDays} covered days left.`
                : ""}
              {computedDue?.date ? ` Due off ${formatDate(computedDue.date)} if they return today.` : ""}
            </>
          ) : (
            <>
              Been on {VESSEL} {c.tours.length === 1 ? "once" : `${c.tours.length} times`}. Last signed on{" "}
              {formatDate(c.tours[0].signOn)}
              {c.tours[0].signOff
                ? ` · off ${formatDate(c.tours[0].signOff)}`
                : c.status === "current"
                  ? ` · articles open${(computedDue?.date ?? c.tours[0].dueOff) ? ` · due off ${formatDate(computedDue?.date ?? c.tours[0].dueOff)}` : ""}${walk.when === "next" ? ` · they walk next ${walk.port}, not this ${runQ.data?.thisPort ?? "call"}` : walk.thisCall ? ` · this ${walk.port}` : ""}`
                  : " · signed off"}
              .
            </>
          )}
        </p>
      ) : (
        <p className="mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm">
          {c.status === "vacation" ? "Permanent on vacation. No open tour." : "No George II tour on file yet."}
        </p>
      )}

      {c.status === "current" && coastGaps.length ? (
        <div className="mt-4 rounded-xl bg-warn/15 px-4 py-3 text-sm">
          <p className="font-medium">Master cannot file eNOAD until: {coastGaps.join(", ")}.</p>
          <p className="mt-1 text-muted">Type it on this file. Long Beach and Honolulu both need it.</p>
        </div>
      ) : null}

      <div className="mt-6 flex gap-1 rounded-lg bg-paper-2 p-1">
        {(["overview", "docs", "tours", "packet"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-ink text-paper" : "text-muted"}`}
          >
            {t === "docs" ? "Tickets" : t}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title="Assignment">
            <Row k="Sailing" v={c.billetCode ? `${c.billetCode} · ${positionLabel(c.lastPosition)}` : positionLabel(c.lastPosition)} />
            <Row k="Permanent job" v={c.permanentRating ? positionLabel(c.permanentRating) : c.assignmentType === "PERMANENT" ? "Permanent — seat not assigned" : null} />
            {ratedUp ? <Row k="Covering" v={coveringLabel(c.permanentRating, c.lastPosition)} /> : null}
            {openTour?.assignmentType === "RELIEF" && openTour.relieving ? (
              <Row k="Covering" v={openTour.relieving} />
            ) : null}
            <Row k="Watch" v={watchLabel(c.watch)} />
            <Row k="Union" v={c.unionHall} />
            <Row
              k="Type"
              v={
                c.assignmentType === "RELIEF" && openTour?.relieving
                  ? `relief covering ${openTour.relieving}`
                  : c.assignmentType
                    ? c.assignmentType.toLowerCase()
                    : null
              }
            />
            {c.seniorityClass ? <Row k="SIU class" v={c.seniorityClass} /> : null}
            {openTour && !openTour.signOff ? (
              <>
                <Row
                  k="Due off"
                  v={formatDate(computedDue?.date ?? openTour.dueOff)}
                  extra={
                    daysLeft != null ? (
                      <Badge
                        tone={
                          daysLeft < 0 ? "expired" : walk.thisCall ? "soon" : walk.when === "next" ? "watch" : "ok"
                        }
                      >
                        {daysLeft < 0
                          ? `Overdue ${Math.abs(daysLeft)}d`
                          : walk.when === "next"
                            ? `${daysLeft}d left · next ${walk.port}`
                            : `${daysLeft}d left`}
                      </Badge>
                    ) : undefined
                  }
                />
                <Row k="Rule" v={computedDue?.rule ?? openTour.dueOffRule} />
                {rotary && clock && clock.tourDays != null ? (
                  <Row
                    k={(openTour.unionHall ?? c.unionHall) === "MEBA" ? "MEBA 90-day clock" : "MM&P 120-day clock"}
                    v={
                      clock.remaining == null
                        ? null
                        : `${clock.covered ?? 0} covered · ${clock.remaining} remaining`
                    }
                    extra={openTour.leaveStartedOn ? <Badge tone="steel">paused</Badge> : undefined}
                  />
                ) : null}
                {openTour.leaveDays ? (
                  <Row k="Leave taken" v={`${openTour.leaveDays}d (not covered employment)`} />
                ) : null}
                {openTour.leaveStartedOn ? <Row k="Leave started" v={formatDate(openTour.leaveStartedOn)} /> : null}
                {c.status === "current" ? (
                  <div className="pt-2">
                    <ExtraDaysControl
                      extraDays={openTour.extraDays ?? 0}
                      baseDate={
                        (computedDue?.date ?? openTour.dueOff)
                          ? addDays(computedDue?.date ?? openTour.dueOff, -(openTour.extraDays ?? 0))
                          : null
                      }
                      dueOff={computedDue?.date ?? openTour.dueOff}
                      saving={extraMut.isPending}
                      onSave={(n) => extraMut.mutate({ data: { crewId: c.id, extraDays: n } })}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            {c.status === "current" && (upgrades.length || ratedUp) ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {upgrades.map((u) => (
                  <Button
                    key={u.billet}
                    size="sm"
                    disabled={rateMut.isPending}
                    onClick={() => rateMut.mutate({ data: { crewId: c.id, toBillet: u.billet } })}
                  >
                    Rate up to {u.title}
                  </Button>
                ))}
                {ratedUp ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={dropMut.isPending}
                    onClick={() => dropMut.mutate({ data: { crewId: c.id } })}
                  >
                    Drop back to {positionLabel(c.permanentRating)}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {c.permanentRating || c.assignmentType === "PERMANENT" ? (
              <div className="pt-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/permanents">Change permanents list</Link>
                </Button>
              </div>
            ) : null}
          </Card>
          <IdentityCard
            crew={c}
            embarkPort={openTour?.port ?? ""}
            editing={editingIdent}
            saving={identMut.isPending}
            onEdit={() => setEditingIdent(true)}
            onCancel={() => setEditingIdent(false)}
            onSave={(patch) => identMut.mutate({ data: { crewId: c.id, ...patch } })}
          />
          <Card title="Credentials">
            <Row k="MMC" v={c.mmcNumber} extra={<ExpiryChip date={c.mmcExpiration} />} />
            <Row
              k="Medical"
              v={medical?.expiresOn ? formatDate(medical.expiresOn) : medical ? "On file" : "Missing"}
              extra={<ExpiryChip date={medical?.expiresOn} />}
            />
            <Row
              k="Drug-free"
              v={drugFree?.expiresOn ? formatDate(drugFree.expiresOn) : drugFree ? "On file" : "Missing"}
              extra={<ExpiryChip date={drugFree?.expiresOn} />}
            />
            <Row k="Passport" v={c.passportNumber} extra={<ExpiryChip date={c.passportExpiration} />} />
            <Row k="Hair / eyes" v={[c.hairColor, c.eyeColor].filter(Boolean).join(" / ")} />
            <Row k="Height / weight" v={[c.height, c.weight].filter(Boolean).join(" · ")} />
            <Row k="Glasses" v={c.glasses ? (c.spareGlasses ? "Yes, spare aboard" : "Yes") : "No"} />
            {c.medications ? <Row k="Medications" v={c.medications} /> : null}
            {c.medicalRemarks ? <Row k="Medical notes" v={c.medicalRemarks} /> : null}
          </Card>
          {permanent || c.permanentRating ? (
            <Card title="NSE training">
              <p className="mb-2 text-xs text-muted">
                {permanent?.onSheet
                  ? `${permanent.sheetName} on the NS5 permanents list.`
                  : permanent
                    ? "Permanent — omitted from the NS5 sheet."
                    : `Permanent ${positionLabel(c.permanentRating)}.`}
              </p>
              {NSE_KINDS.map((k) => {
                const d = c.documents.find((doc) => doc.docType === k);
                return (
                  <Row
                    key={k}
                    k={`${NSE_SHORT[k]} · ${NSE_CODES[k]}`}
                    v={d?.expiresOn ? formatDate(d.expiresOn) : "Missing"}
                    extra={<ExpiryChip date={d?.expiresOn} />}
                  />
                );
              })}
              <div className="pt-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/training">Open NSE board</Link>
                </Button>
              </div>
              {expiredSmm.length ? (
                <div className="pt-3">
                  <SmmPrintPanel
                    items={[
                      {
                        crewId: c.id,
                        fullName: c.fullName,
                        position: c.lastPosition,
                        kinds: expiredSmm,
                        person: detailToParsed(c),
                      },
                    ]}
                    compact
                  />
                </div>
              ) : null}
            </Card>
          ) : null}
          <Card title="Next of kin">
            {c.nok.length === 0 ? <p className="text-sm text-muted">None on file.</p> : null}
            {c.nok.map((n) => (
              <div key={n.id} className="mb-3 text-sm last:mb-0">
                <div className="font-medium">{n.fullName}</div>
                <div className="text-muted">
                  {n.relationship}
                  {n.phone ? ` · ${n.phone}` : ""}
                  {n.cellPhone && n.cellPhone !== n.phone ? ` · ${n.cellPhone}` : ""}
                </div>
                <div className="text-xs text-faint">{[n.addressLine, n.city, n.state, n.zip].filter(Boolean).join(", ")}</div>
              </div>
            ))}
          </Card>
          <Card title="Sign-on checklist">
            <ul className="space-y-1.5 text-sm">
              {(reqs.data ?? [])
                .filter((r) => requirementApplies(r.appliesTo, c.lastPosition))
                .map((r) => {
                const present = formCodes.has(r.code.toUpperCase()) || docCodes.has(r.code);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <span className={present ? "text-ink" : "text-muted"}>{r.label}</span>
                    <Badge tone={present ? "ok" : r.required ? "expired" : "neutral"}>{present ? "On file" : "Missing"}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Combine with another file">
            <p className="text-sm text-muted">
              If two files were opened for the same person, pick the other one. Tickets, tours, and next of kin land on the stronger file. The extra file is removed.
            </p>
            <div className="mt-3">
              <CrewPicker
                people={rosterQ.data ?? []}
                excludeIds={[c.id]}
                value={mergePick}
                onChange={(id) => {
                  setMergePick(id);
                  setMergeTyped("");
                }}
                emptyLabel="Search the other file…"
                placeholder="Type a last name…"
              />
            </div>
            {mergeOther ? (
              <p className="mt-2 text-sm text-muted">
                Combining with {mergeOther.fullName}
                {mergeOther.lastPosition ? ` · ${positionLabel(mergeOther.lastPosition)}` : ""}
                {mergeOther.status ? ` · ${mergeOther.status}` : ""}.
              </p>
            ) : null}
            {namesDiffer ? (
              <p className="mt-2 text-sm text-warn">
                Last names do not match. Only continue if this is the same person.
              </p>
            ) : null}
            <label className="mt-3 block text-xs text-muted">
              Type {c.lastName || "this last name"} to confirm
              <Input
                value={mergeTyped}
                onChange={(e) => setMergeTyped(e.target.value)}
                className="mt-1"
                autoComplete="off"
                placeholder={c.lastName ?? ""}
              />
            </label>
            <Button
              className="mt-3"
              variant="outline"
              disabled={
                mergeMut.isPending
                || !mergePick
                || mergeTyped.trim().toLowerCase() !== (c.lastName ?? "").trim().toLowerCase()
                || !(c.lastName ?? "").trim()
              }
              onClick={() => mergeMut.mutate(mergePick)}
            >
              {mergeMut.isPending ? "Combining…" : "Combine files"}
            </Button>
          </Card>
          <Card title="Delete this file">
            <p className="text-sm text-muted">
              Removes the whole profile — tickets, tours, and next of kin. This does not sign them off; use Sign off if they are leaving the ship.
            </p>
            <label className="mt-3 block text-xs text-muted">
              Type {c.lastName || "their last name"} to confirm
              <Input
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                className="mt-1"
                autoComplete="off"
                placeholder={c.lastName ?? ""}
              />
            </label>
            <Button
              className="mt-3"
              variant="outline"
              disabled={
                deleteMut.isPending ||
                deleteTyped.trim().toLowerCase() !== (c.lastName ?? "").trim().toLowerCase() ||
                !(c.lastName ?? "").trim()
              }
              onClick={() => deleteMut.mutate()}
            >
              {deleteMut.isPending ? "Removing…" : "Delete profile"}
            </Button>
          </Card>
        </div>
      ) : null}

      {tab === "docs" ? (
        <div className="mt-6">
          <label
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void ingestTicket(file);
            }}
            className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-6 text-center ${
              over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50"
            }`}
          >
            <input
              type="file"
              accept={TICKET_ACCEPT}
              className="sr-only"
              disabled={reading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void ingestTicket(file);
              }}
            />
            <p className="font-medium">{reading ? "Reading…" : "Drop a ticket on this file"}</p>
            <p className="mt-1 text-xs text-muted">PDF or a photo of the MMC, TWIC, passport, medical, HAZMAT cert — not a full packet.</p>
          </label>
          {expiredSmm.length ? (
            <div className="mb-4">
              <SmmPrintPanel
                items={[
                  {
                    crewId: c.id,
                    fullName: c.fullName,
                    position: c.lastPosition,
                    kinds: expiredSmm,
                    person: detailToParsed(c),
                  },
                ]}
                compact
              />
            </div>
          ) : null}
          <div className="min-w-0 overflow-x-auto rounded-xl shadow-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.documents.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.label}</div>
                    {d.notes ? <div className="text-xs text-muted">{d.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{d.docNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(d.issuedOn)}</td>
                  <td className="px-4 py-3">
                    <ExpiryChip date={d.expiresOn} />
                  </td>
                </tr>
              ))}
              {c.documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No tickets on file.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </div>
      ) : null}

      {tab === "tours" ? (
        <ol className="mt-6 space-y-3">
          {c.tours.map((t) => (
            <li key={t.id} className="rounded-xl bg-paper p-5 shadow-border">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl">
                  {positionLabel(t.position)} · {t.vessel}
                </h3>
                <span className="font-mono text-xs text-muted">
                  {formatDate(t.signOn)} – {t.signOff ? formatDate(t.signOff) : c.status === "current" ? "open" : "signed off"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {[
                  t.port,
                  t.assignmentType,
                  t.watch ? watchLabel(t.watch) : null,
                  t.billetCode ? `billet ${t.billetCode}` : null,
                  t.relieving ? `relieving ${t.relieving}` : null,
                  t.lengthDays ? `${t.lengthDays} days` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {t.dueOff && !t.signOff ? (
                <p className="mt-1 text-sm">
                  Due off {formatShort(t.dueOff)}
                  {t.dueOffRule ? ` · ${t.dueOffRule}` : ""}
                  {t.extraDays ? ` · ${extraTripsLabel(t.extraDays)}` : ""}
                  {t.leaveDays ? ` · +${t.leaveDays}d rotary leave` : ""}
                  {t.leaveStartedOn ? ` · on leave since ${formatDate(t.leaveStartedOn)}` : ""}
                </p>
              ) : null}
              {t.notes ? <p className="mt-1 text-sm">{t.notes}</p> : null}
            </li>
          ))}
          {c.tours.length === 0 ? <p className="text-sm text-muted">No tours recorded.</p> : null}
        </ol>
      ) : null}

      {tab === "packet" ? (
        <ul className="mt-6 divide-y divide-border rounded-xl bg-paper shadow-border">
          {c.forms.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-mono text-xs text-sage">{f.formCode}</span>
                <span className="ml-2">{f.formLabel}</span>
              </span>
              <span className="text-xs text-muted">{formatDate(f.completedOn)}</span>
            </li>
          ))}
          {c.forms.length === 0 ? <li className="px-4 py-8 text-center text-muted">No packet forms stored.</li> : null}
        </ul>
      ) : null}

      {c.notes ? <p className="mt-6 text-sm text-muted">{c.notes}</p> : null}

      {signOffOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
              <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-paper p-5 shadow-border">
                <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Leaving this call</p>
                <h2 className="mt-1 font-display text-xl tracking-tight">Take {c.fullName} off articles?</h2>
                <p className="mt-2 text-sm text-muted">
                  This is discharge — they walk at {runQ.data?.thisPort ?? "this port"}. Their name comes off the crew list,{" "}
                  {c.billetCode ? `billet ${c.billetCode} goes vacant` : "the slot goes vacant"}, and a one-page leaving sheet
                  downloads for the file. Not a join packet. Not a watch trade.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    disabled={statusMut.isPending}
                    onClick={() => {
                      void (async () => {
                        try {
                          const bytes = await buildSignOffPdf({
                            fullName: c.fullName,
                            lastName: c.lastName,
                            position: c.lastPosition,
                            billetCode: c.billetCode,
                            watch: c.watch,
                            signOn: openTour?.signOn,
                            dueOff: computedDue?.date ?? openTour?.dueOff,
                            port: openTour?.port,
                            thisPort: runQ.data?.thisPort,
                            assignmentType: openTour?.assignmentType ?? c.assignmentType,
                            signOff: todayUtc().toISOString().slice(0, 10),
                          });
                          downloadPdf(bytes, signOffFilename({ fullName: c.fullName, lastName: c.lastName }));
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Could not print leaving papers");
                        }
                        statusMut.mutate("past");
                        setSignOffOpen(false);
                      })();
                    }}
                  >
                    Print leaving sheet and sign off
                  </Button>
                  <Button variant="outline" onClick={() => setSignOffOpen(false)}>
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

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-paper p-5 shadow-border">
      <h2 className="font-display text-lg tracking-tight">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({ k, v, extra }: { k: string; v: string | null | undefined; extra?: ReactNode }) {
  if (!v) return null;
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{k}</span>
      <span className="flex items-center gap-2 text-right">
        {v}
        {extra}
      </span>
    </div>
  );
}

function IdentityCard({
  crew,
  embarkPort,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  crew: {
    sex: string | null;
    dob: string | null;
    placeOfBirth: string | null;
    citizenship: string | null;
    cellPhone: string | null;
    email: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    nearestAirport: string | null;
    airportCode: string | null;
    maritimeCollege: string | null;
    yearGraduated: string | null;
    combatVeteran: boolean;
    passportNumber: string | null;
    passportExpiration: string | null;
  };
  embarkPort: string;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: {
    sex: string | null;
    dob: string | null;
    placeOfBirth: string | null;
    citizenship: string | null;
    cellPhone: string | null;
    passportNumber: string | null;
    passportExpiration: string | null;
    embarkPort: string | null;
  }) => void;
}) {
  const [sex, setSex] = useState(crew.sex ?? "");
  const [dob, setDob] = useState(crew.dob ?? "");
  const [pob, setPob] = useState(crew.placeOfBirth ?? "");
  const [cit, setCit] = useState(crew.citizenship ?? "UNITED STATES");
  const [phone, setPhone] = useState(crew.cellPhone ?? "");
  const [pass, setPass] = useState(crew.passportNumber ?? "");
  const [passExp, setPassExp] = useState(crew.passportExpiration ?? "");
  const [port, setPort] = useState(embarkPort);
  useEffect(() => {
    if (!editing) return;
    setSex(crew.sex ?? "");
    setDob(crew.dob ?? "");
    setPob(crew.placeOfBirth ?? "");
    setCit(crew.citizenship ?? "UNITED STATES");
    setPhone(crew.cellPhone ?? "");
    setPass(crew.passportNumber ?? "");
    setPassExp(crew.passportExpiration ?? "");
    setPort(embarkPort);
  }, [editing]);
  return (
    <Card title="Coast Guard / personal">
      {editing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="text-muted">Sex</span>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="">Needed for eNOAD</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted">Date of birth</span>
            <Input type="date" className="mt-1" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Place of birth</span>
            <Input className="mt-1" value={pob} onChange={(e) => setPob(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Citizenship</span>
            <Input className="mt-1" value={cit} onChange={(e) => setCit(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Phone</span>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Embarked</span>
            <PortSelect value={port} onChange={setPort} allowEmpty emptyLabel="Where they joined" />
          </label>
          <label className="text-xs">
            <span className="text-muted">Passport number</span>
            <Input className="mt-1" value={pass} onChange={(e) => setPass(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Passport expires</span>
            <Input type="date" className="mt-1" value={passExp} onChange={(e) => setPassExp(e.target.value)} />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() =>
                onSave({
                  sex: sex || null,
                  dob: dob || null,
                  placeOfBirth: pob || null,
                  citizenship: cit || null,
                  cellPhone: phone || null,
                  passportNumber: pass || null,
                  passportExpiration: passExp || null,
                  embarkPort: port || null,
                })
              }
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Row k="Sex" v={crew.sex} />
          <Row k="Date of birth" v={formatDate(crew.dob)} />
          <Row k="Place of birth" v={crew.placeOfBirth} />
          <Row k="Citizenship" v={crew.citizenship} />
          <Row k="Contact" v={crew.cellPhone} />
          <Row k="Email" v={crew.email} />
          <Row k="Embarked" v={embarkPort} />
          <Row k="Passport" v={crew.passportNumber} extra={<ExpiryChip date={crew.passportExpiration} />} />
          <Row k="Address" v={[crew.addressLine, crew.city, crew.state, crew.zip].filter(Boolean).join(", ")} />
          <Row k="Airport" v={[crew.nearestAirport, crew.airportCode].filter(Boolean).join(" · ")} />
          <Row k="College" v={[crew.maritimeCollege, crew.yearGraduated].filter(Boolean).join(", ")} />
          {crew.combatVeteran ? <Row k="Veteran" v="Combat veteran" /> : null}
          <div className="pt-2">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              Edit Coast Guard fields
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
