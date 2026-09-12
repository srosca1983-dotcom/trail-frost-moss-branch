import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { ExpiryChip } from "@/components/expiry-chip";
import { PageHeader } from "@/components/page-header";
import { PortSelect } from "@/components/port-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { expiryTone, formatDate, formatShort } from "@/lib/crew/dates";
import { extraFilename, fillExtraForm } from "@/lib/crew/fill-extras";
import { fillSignOnPacket, packetFilename } from "@/lib/crew/fill-packet";
import { detailToParsed } from "@/lib/crew/map";
import { clusterResults, mergeParsed, missingForPacket, type PersonCluster } from "@/lib/crew/merge";
import { packetFromFile, slimPacket, TICKET_ACCEPT, ticketFileProblem } from "@/lib/crew/pdf";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { deadJoinTickets, enoadGaps } from "@/lib/crew/ports";
import { departmentLabel, inferDepartment, positionLabel } from "@/lib/crew/ratings";
import { commitParsed, getCrew, getVesselRun, listCrew, parsePackets, proposeJoin } from "@/lib/crew/server";
import { computeDueOff, normalizeAssignment, normalizeUnion, watchLabel } from "@/lib/crew/shipping";
import {
  EXTRA_FORM_LABEL,
  needsRenew,
  paperworkForJoining,
  ticketsForPerson,
  union401kLabel,
  type ExtraFormKey,
  type PaperworkSet,
} from "@/lib/crew/sign-on-set";
import { VESSEL_BILLETS, billetByCode } from "@/lib/crew/billets";
import { MAX_PACKET_FILES, VESSEL } from "@/lib/crew/types";
import type { AssignmentKind, CrewDepartment, CrewMatch, ParsedPacketResult, ParsedPerson, SiuClass, UnionHall } from "@/lib/crew/types";

type Search = { crewId?: string };
type ExtraFile = { key: ExtraFormKey; label: string; url: string; name: string };

export const Route = createFileRoute("/sign-on")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    crewId: typeof s.crewId === "string" ? s.crewId : undefined,
  }),
  loaderDeps: ({ search }) => ({ crewId: search.crewId }),
  loader: async ({ deps }) => {
    const [roster, run, stored] = await Promise.all([
      listCrew(),
      getVesselRun(),
      deps.crewId ? getCrew({ data: { id: deps.crewId } }) : Promise.resolve(null),
    ]);
    return { roster, run, stored };
  },
  staleTime: 60_000,
  component: Page,
});

function Page() {
  return (
    <Desk>
      <SignOn />
    </Desk>
  );
}

function SignOn() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const initial = Route.useLoaderData();
  const roster = useQuery({ queryKey: ["crew"], queryFn: () => listCrew(), initialData: initial.roster });
  const runQ = useQuery({ queryKey: ["vessel-run"], queryFn: () => getVesselRun(), initialData: initial.run });
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<"idle" | "reading" | "parsing" | "filling">("idle");
  const [progress, setProgress] = useState<string | null>(null);
  const [results, setResults] = useState<ParsedPacketResult[]>([]);
  const [clusterIx, setClusterIx] = useState(0);
  const [draft, setDraft] = useState<ParsedPerson | null>(null);
  const [match, setMatch] = useState<CrewMatch | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [port, setPort] = useState("");
  const [fromLedger, setFromLedger] = useState(false);
  const [packetUrl, setPacketUrl] = useState<string | null>(null);
  const [packetName, setPacketName] = useState<string | null>(null);
  const [extraFiles, setExtraFiles] = useState<ExtraFile[]>([]);
  const [pick, setPick] = useState("");
  const [officerInitials, setOfficerInitials] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("crew-ledger-fam-initials") ?? "";
  });
  const [department, setDepartment] = useState<CrewDepartment | "">("");
  const [deptManual, setDeptManual] = useState(false);
  const [billetCode, setBilletCode] = useState("");
  const [watch, setWatch] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [unionHall, setUnionHall] = useState("");
  const [seniorityClass, setSeniorityClass] = useState("");
  const [dueOff, setDueOff] = useState("");
  const [dueOffManual, setDueOffManual] = useState(false);
  const [dueRule, setDueRule] = useState("");
  const [lengthDays, setLengthDays] = useState("");
  const [relieving, setRelieving] = useState("");
  const [ask, setAsk] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [assignTouched, setAssignTouched] = useState(false);
  const [identityChanged, setIdentityChanged] = useState(false);
  const [w4Needed, setW4Needed] = useState(false);
  const [depositChanged, setDepositChanged] = useState(false);
  const [enroll401k, setEnroll401k] = useState(false);
  const [ticketOverride, setTicketOverride] = useState("");
  const [instructorName, setInstructorName] = useState(() => {
    if (typeof window === "undefined") return "Sorin Rosca, Chief Mate";
    return localStorage.getItem("crew-ledger-hazmat-instructor") ?? "Sorin Rosca, Chief Mate";
  });

  const stored = useQuery({
    queryKey: ["crew", search.crewId],
    queryFn: () => getCrew({ data: { id: search.crewId! } }),
    enabled: Boolean(search.crewId),
    initialData: search.crewId && initial.stored?.id === search.crewId ? initial.stored : undefined,
  });

  useEffect(() => {
    if (!port && runQ.data?.thisPort) setPort(runQ.data.thisPort);
  }, [runQ.data, port]);

  useEffect(() => {
    return () => {
      if (packetUrl) URL.revokeObjectURL(packetUrl);
    };
  }, [packetUrl]);

  useEffect(() => {
    return () => {
      for (const e of extraFiles) URL.revokeObjectURL(e.url);
    };
  }, [extraFiles]);

  useEffect(() => {
    if (!stored.data || files.length) return;
    const person = detailToParsed(stored.data);
    const m: CrewMatch = {
      crewId: stored.data.id,
      fullName: stored.data.fullName,
      status: stored.data.status,
      lastPosition: stored.data.lastPosition,
      confidence: "high",
      reasons: ["name"],
      priorTours: stored.data.tours,
    };
    const w = stored.data.documents
      .filter((d) => expiryTone(d.expiresOn) === "expired" || expiryTone(d.expiresOn) === "soon")
      .map((d) =>
        expiryTone(d.expiresOn) === "expired" ? `${d.label} is expired.` : `${d.label} expires within 30 days.`,
      );
    setDraft(person);
    setMatch(m);
    setWarnings(w);
    setFromLedger(true);
    setStartDate("");
    setPort(runQ.data?.thisPort || person.tour?.port || "");
    setResults([]);
    setDeptManual(false);
    const inferred = inferDepartment(person.lastPosition);
    setDepartment(inferred ?? "");
    setAssignTouched(false);
    setBilletCode(stored.data.billetCode ?? "");
    setWatch(stored.data.watch ?? "");
    setAssignmentType(stored.data.assignmentType ?? "");
    setUnionHall(stored.data.unionHall ?? "");
    setSeniorityClass(stored.data.seniorityClass ?? "");
    setDueOffManual(false);
    setLengthDays("");
    setRelieving(stored.data.tours.find((t) => !t.signOff)?.relieving ?? stored.data.tours[0]?.relieving ?? "");
    setIdentityChanged(false);
    setW4Needed(false);
    setDepositChanged(false);
    setEnroll401k(false);
    setTicketOverride("");
    clearPacket();
  }, [stored.data, files.length]);

  const parseMut = useMutation({ mutationFn: parsePackets });
  const commitMut = useMutation({
    mutationFn: commitParsed,
    onSuccess: async (res) => {
      toast.success(res.returning ? "Returning mariner updated" : "Mariner added to the ledger");
      invalidateDesk(qc);
      await nav({ to: "/crew/$crewId", params: { crewId: res.crewId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  function clearPacket() {
    setPacketUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPacketName(null);
    setExtraFiles((prev) => {
      for (const e of prev) URL.revokeObjectURL(e.url);
      return [];
    });
  }

  function onPick(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const problem = ticketFileProblem(f);
      if (problem) {
        toast.error(problem);
        continue;
      }
      next.push(f);
    }
    if (next.length > MAX_PACKET_FILES) {
      toast.error(`Cap is ${MAX_PACKET_FILES} files at a time.`);
    }
    setFiles(next.slice(0, MAX_PACKET_FILES));
    setFromLedger(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    onPick(e.dataTransfer.files);
  }

  const clusters = useMemo(() => clusterResults(results), [results]);

  async function applyCluster(c: PersonCluster) {
    let person = c.person;
    let fromFile = false;
    if (c.match?.crewId) {
      try {
        const stored = await getCrew({ data: { id: c.match.crewId } });
        if (stored) {
          const before = missingForPacket(c.person).length;
          person = mergeParsed([c.person, detailToParsed(stored)]);
          fromFile = missingForPacket(person).length < before;
        }
      } catch {
        /* uploaded draft stands */
      }
    }
    setDraft(person);
    setMatch(c.match);
    setWarnings(
      fromFile
        ? [...c.warnings.filter((w) => !/ledger file/i.test(w)), "Blank fields were filled from their ledger file."]
        : c.warnings,
    );
    setFromLedger(fromFile);
    setStartDate(person.tour?.signOn ?? "");
    setPort(runQ.data?.thisPort || person.tour?.port || "");
    setDeptManual(false);
    setDepartment(inferDepartment(person.lastPosition) ?? "");
    setAssignTouched(false);
    setBilletCode(person.tour?.billetCode ?? "");
    setWatch(person.tour?.watch ?? "");
    setAssignmentType(normalizeAssignment(person.tour?.assignmentType) ?? "");
    setUnionHall(normalizeUnion(person.tour?.unionHall) ?? "");
    setSeniorityClass(person.tour?.seniorityClass ?? "");
    setLengthDays(person.tour?.lengthDays ? String(person.tour.lengthDays) : "");
    setRelieving(person.tour?.relieving ?? "");
    setDueOffManual(Boolean(person.tour?.dueOff));
    setDueOff(person.tour?.dueOff ?? "");
    setIdentityChanged(false);
    setW4Needed(false);
    setDepositChanged(false);
    setEnroll401k(false);
    setTicketOverride("");
    clearPacket();
  }

  async function readFiles() {
    if (!files.length) return;
    setBusy("reading");
    setResults([]);
    const out: ParsedPacketResult[] = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        setProgress(`${i + 1} / ${files.length} · ${f.name}`);
        setBusy(i === 0 ? "reading" : "parsing");
        const payload = slimPacket(await packetFromFile(f));
        setBusy("parsing");
        const parsed = await parseMut.mutateAsync({ data: { packets: [payload] } });
        out.push(parsed[0] ?? { filename: f.name, pageCount: 0, person: null, match: null, warnings: [], error: "Empty result" });
        setResults([...out]);
      }
      const grouped = clusterResults(out);
      setClusterIx(0);
      if (grouped[0]) applyCluster(grouped[0]);
      toast.success(`Read ${out.length} file${out.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read files");
    } finally {
      setBusy("idle");
      setProgress(null);
    }
  }

  function withTour(person: ParsedPerson): ParsedPerson {
    return {
      ...person,
      lastPosition: person.lastPosition,
      tour: {
        vessel: VESSEL,
        position: person.lastPosition,
        signOn: startDate || person.tour?.signOn || null,
        signOff: person.tour?.signOff ?? null,
        port: port || person.tour?.port || null,
        relieving: relieving || person.tour?.relieving || null,
        assignmentType: assignmentType || person.tour?.assignmentType || null,
        lengthDays: lengthDays ? Number(lengthDays) : (person.tour?.lengthDays ?? null),
        dispatchRef: person.tour?.dispatchRef ?? null,
        unionHall: unionHall || person.tour?.unionHall || null,
        watch: watch || person.tour?.watch || null,
        billetCode: billetCode || person.tour?.billetCode || null,
        seniorityClass: seniorityClass || person.tour?.seniorityClass || null,
        dueOff: dueOff || person.tour?.dueOff || null,
      },
    };
  }

  const personForAssign = draft;

  useEffect(() => {
    const position = personForAssign?.lastPosition ?? null;
    if (!position) return;
    let cancelled = false;
    void proposeJoin({
      data: {
        position,
        watch: watch || null,
        crewId: match?.crewId ?? search.crewId ?? null,
        billetCode: billetCode || null,
      },
    }).then((p) => {
      if (cancelled) return;
      setAsk(p.question);
      setConfidence(p.confidence);
      if (assignTouched) return;
      if (p.pick && !billetCode) setBilletCode(p.pick.code);
      if (p.watch && !watch) setWatch(p.watch);
      if (p.unionHall && !unionHall) setUnionHall(p.unionHall);
      if (p.assignmentType && !assignmentType) setAssignmentType(p.assignmentType);
      if (p.relieving && !relieving) setRelieving(p.relieving);
    });
    return () => {
      cancelled = true;
    };
  }, [personForAssign?.lastPosition]);

  useEffect(() => {
    if (dueOffManual) return;
    if (!startDate) {
      setDueOff("");
      setDueRule("");
      return;
    }
    const due = computeDueOff({
      signOn: startDate,
      unionHall: (unionHall as UnionHall) || null,
      assignmentType: (assignmentType as AssignmentKind) || null,
      siuClass: (seniorityClass as SiuClass) || null,
      lengthDays: lengthDays ? Number(lengthDays) : (personForAssign?.tour?.lengthDays ?? null),
    });
    setDueOff(due.date ?? "");
    setDueRule(due.rule);
  }, [startDate, unionHall, assignmentType, seniorityClass, lengthDays, dueOffManual, personForAssign?.tour?.lengthDays]);

  const tickets = useMemo(() => (draft ? ticketsForPerson(draft) : []), [draft]);
  const joiningRating = billetByCode(billetCode)?.title ?? draft?.lastPosition ?? null;
  const joiningSet: PaperworkSet = useMemo(() => {
    const cyber = tickets.find((t) => t.code === "CYBER");
    const net = tickets.find((t) => t.code === "INTERNET");
    const haz = tickets.find((t) => t.code === "HAZMAT");
    return paperworkForJoining({
      returning: Boolean(match),
      unionHall: (unionHall as UnionHall) || null,
      position: joiningRating,
      identityChanged,
      w4Needed,
      depositChanged,
      enroll401k,
      cyberExpired: cyber ? needsRenew(cyber.tone) : true,
      internetExpired: net ? needsRenew(net.tone) : true,
      hazmatExpired: haz ? needsRenew(haz.tone) : true,
    });
  }, [match, unionHall, identityChanged, w4Needed, depositChanged, enroll401k, tickets, joiningRating]);

  async function fillPacket() {
    if (!draft) return;
    if (!startDate) {
      toast.error("Enter the starting date first.");
      return;
    }
    if (!officerInitials.trim()) {
      toast.error("Enter your initials for the Fam. Officer column.");
      return;
    }
    if (!department) {
      toast.error("Pick the department — Deck, Engine, or Steward.");
      return;
    }
    setBusy("filling");
    try {
      const person = withTour(draft);
      const set = joiningSet;
      const bytes = await fillSignOnPacket({
        person,
        startDate,
        port,
        officerInitials: officerInitials.trim().toUpperCase(),
        department,
        include: set.packetPages,
      });
      const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPacketUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPacketName(packetFilename(person, startDate));

      const nextExtras: ExtraFile[] = [];
      for (const key of set.extras) {
        try {
          const extraBytes = await fillExtraForm(key, {
            person,
            startDate,
            port,
            unionHall,
            enroll401k,
            instructorName: instructorName.trim() || "Sorin Rosca, Chief Mate",
            returning: Boolean(match),
          });
          const extraBlob = new Blob([Uint8Array.from(extraBytes)], { type: "application/pdf" });
          nextExtras.push({
            key,
            label: EXTRA_FORM_LABEL[key],
            url: URL.createObjectURL(extraBlob),
            name: extraFilename(key, person, startDate),
          });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `Could not fill ${EXTRA_FORM_LABEL[key]}`);
        }
      }
      setExtraFiles((prev) => {
        for (const e of prev) URL.revokeObjectURL(e.url);
        return nextExtras;
      });
      toast.success("This joining’s papers filled. Signatures, full SSN, and bank numbers left blank.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fill packet");
    } finally {
      setBusy("idle");
    }
  }

  const suggestions = useMemo(() => {
    const needle = pick.trim().toLowerCase();
    const list = roster.data ?? [];
    if (!needle) return list.filter((c) => c.status !== "current").slice(0, 6);
    return list
      .filter((c) =>
        [c.fullName, c.ssLast4, c.mmcNumber, c.lastPosition].filter(Boolean).join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [roster.data, pick]);

  const person = draft;
  const saving = commitMut.isPending;
  const missing = person ? missingForPacket(person) : [];
  const deadTickets = person
    ? deadJoinTickets({ mmcExpiration: person.mmcExpiration, documents: person.documents })
    : [];
  const coastGaps = person
    ? enoadGaps({
        lastName: person.lastName,
        fullName: person.fullName,
        dob: person.dob,
        sex: person.sex,
        passportNumber: person.passportNumber,
        mmcNumber: person.mmcNumber,
        passportExpiration: person.passportExpiration,
        mmcExpiration: person.mmcExpiration,
        embarkPort: port,
      })
    : [];

  function patch<K extends keyof ParsedPerson>(key: K, value: ParsedPerson[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    if (key === "lastPosition") {
      if (!deptManual) setDepartment(inferDepartment(typeof value === "string" ? value : null) ?? "");
      setAssignTouched(false);
      setBilletCode("");
      setWatch("");
    }
    clearPacket();
  }

  return (
    <>
      <PageHeader
        kicker="Articles"
        title="Fill this joining’s papers."
        description="SRO-CM-06 and SMM-PER-05 decide the set. New joiners get the company packet. Returning crew only get what the book still requires this assignment — familiarization every time they come back. Union 401(k) and door tag print with the packet. HAZMAT certificate only for deck officers when the 3-year card is missing or expired. Signatures, full SSN, and bank numbers stay blank."
        actions={
          <Button variant="outline" asChild>
            <Link to="/ingest">Load many packets</Link>
          </Button>
        }
      />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150",
          over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50",
        )}
      >
        <input
          type="file"
          accept={TICKET_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => onPick(e.target.files)}
        />
        <p className="font-display text-xl">Drop union docs here</p>
        <p className="mt-1 text-sm text-muted">SIU · MM&P · MEBA · MMC · passport · dispatch · DOT · medical · PDF or photo</p>
        <p className="mt-1 text-xs text-faint">{files.length} selected · {MAX_PACKET_FILES} max this pass</p>
      </label>

      {files.length ? (
        <ul className="mt-4 divide-y divide-border rounded-xl bg-paper shadow-border">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-xs text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!files.length || busy !== "idle"} onClick={() => void readFiles()}>
          {busy === "reading" || busy === "parsing" ? "Reading…" : "Read files"}
        </Button>
        <Button
          variant="outline"
          disabled={busy !== "idle"}
          onClick={() => {
            setFiles([]);
            setResults([]);
            setDraft(null);
            setMatch(null);
            setFromLedger(false);
            setAssignTouched(false);
            setBilletCode("");
            setWatch("");
            setAssignmentType("");
            setUnionHall("");
            setAsk(null);
            setIdentityChanged(false);
            setW4Needed(false);
            setDepositChanged(false);
            setEnroll401k(false);
            setTicketOverride("");
            clearPacket();
          }}
        >
          Clear
        </Button>
      </div>
      {progress ? <p className="mt-2 text-sm text-muted">{progress}</p> : null}

      <section className="mt-6 rounded-xl bg-paper p-5 shadow-border">
        <h2 className="font-display text-lg">Or pick a returning mariner</h2>
        <p className="mt-1 text-sm text-muted">Auto-fill the packet from their file. You still enter the starting date.</p>
        <Input
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          placeholder="Search name, last 4, MMC…"
          className="mt-3"
          aria-label="Search returning crew"
        />
        <ul className="mt-3 divide-y divide-border">
          {suggestions.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:bg-paper-2/80"
                onClick={() => {
                  setFiles([]);
                  setPick("");
                  void nav({ to: "/sign-on", search: { crewId: c.id } });
                }}
              >
                <span>
                  <span className="font-medium">{c.fullName}</span>
                  <span className="ml-2 text-xs text-muted">
                    {positionLabel(c.lastPosition)}
                    {c.ssLast4 ? ` · ··${c.ssLast4}` : ""}
                  </span>
                </span>
                {c.expiredCount > 0 ? (
                  <Badge tone="expired">{c.expiredCount} expired</Badge>
                ) : (
                  <Badge tone="ok">Clear</Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {clusters.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {clusters.map((c, i) => (
            <Button
              key={c.key}
              size="sm"
              variant={i === clusterIx ? "default" : "outline"}
              onClick={() => {
                setClusterIx(i);
                void applyCluster(c);
              }}
            >
              {c.person.fullName}
            </Button>
          ))}
        </div>
      ) : null}

      {person ? (
        <div className="mt-8 space-y-4">
          {person.signOnRequired === false && match ? (
            <div className="rounded-xl bg-warn/15 p-5">
              <p className="font-medium text-warn">Hall marked this job no sign-on required.</p>
              <p className="mt-1 text-sm text-muted">They have a prior file on this ship. You can still fill a packet if the Master wants one on file.</p>
            </div>
          ) : null}

          {match ? (
            <div className="rounded-xl bg-ink p-5 text-paper">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Returning crew</p>
              <h2 className="mt-1 font-display text-2xl">{match.fullName} has been on this ship before.</h2>
              <p className="mt-2 text-sm text-paper/80">
                {match.priorTours.length
                  ? match.priorTours
                      .slice(0, 3)
                      .map(
                        (t) =>
                          `${positionLabel(t.position)} ${formatDate(t.signOn)}${t.signOff ? `–${formatDate(t.signOff)}` : ""}`,
                      )
                      .join(" · ")
                  : "Prior file exists in the ledger."}{" "}
                Match: {match.reasons.join(", ")} ({match.confidence}).
                {fromLedger ? " Blank fields on the upload were filled from that file." : ""}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-ink p-5 text-paper">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sage">New to the vessel</p>
              <h2 className="mt-1 font-display text-2xl">Full sign-on packet required.</h2>
              <p className="mt-2 text-sm text-paper/80">
                No matching MMC, passport, last four, or name+DOB in the ledger
                {person.signOnRequired === false
                  ? " — hall marked no sign-on required, but they have never sailed this ship, so we still fill a new packet."
                  : "."}
              </p>
            </div>
          )}

          <section className="rounded-xl bg-paper p-5 shadow-border">
            <h2 className="font-display text-xl">Starting date</h2>
            <p className="mt-1 text-sm text-muted">Required before we fill the packet. Dispatch reporting date is suggested when we have it.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="text-muted">Sign-on date</span>
                <Input
                  type="date"
                  className="mt-1"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    clearPacket();
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="text-muted">Port they join</span>
                <PortSelect
                  value={port}
                  onChange={(v) => {
                    setPort(v);
                    clearPacket();
                  }}
                  allowEmpty
                  emptyLabel="This port"
                />
              </label>
              <label className="text-sm">
                <span className="text-muted">Sex</span>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                  value={person.sex ?? ""}
                  onChange={(e) => patch("sex", e.target.value || null)}
                >
                  <option value="">Needed for eNOAD</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted">Rating</span>
                <Input
                  className="mt-1"
                  value={person.lastPosition ?? ""}
                  onChange={(e) => patch("lastPosition", e.target.value || null)}
                  placeholder="AB, QEE, 3/M…"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-paper p-5 shadow-border">
            <h2 className="font-display text-xl">Billet and watch</h2>
            <p className="mt-1 text-sm text-muted">
              Auto-assigned from the rating when we can. If two slots fit, or the watch is not on the articles, pick it here.
            </p>
            {ask ? (
              <div className="mt-3 rounded-lg bg-warn/15 px-3 py-3 text-sm">
                <p className="font-medium text-warn">{confidence === "low" ? "Need a call" : "Confirm"}</p>
                <p className="mt-0.5 text-muted">{ask}</p>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-muted">Billet</span>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                  value={billetCode}
                  onChange={(e) => {
                    setAssignTouched(true);
                    const next = e.target.value;
                    setBilletCode(next);
                    const b = VESSEL_BILLETS.find((x) => x.code === next);
                    if (b) {
                      if (b.watch) setWatch(b.watch);
                      setUnionHall(b.unionHall);
                      void proposeJoin({
                        data: {
                          position: person.lastPosition,
                          watch: b.watch,
                          crewId: match?.crewId ?? search.crewId ?? null,
                          billetCode: next,
                        },
                      }).then((p) => {
                        if (p.assignmentType) setAssignmentType(p.assignmentType);
                        if (p.relieving) setRelieving(p.relieving);
                        else if (p.assignmentType !== "RELIEF") setRelieving("");
                        if (p.question) setAsk(p.question);
                      });
                    }
                  }}
                >
                  <option value="">Pick a slot</option>
                  {VESSEL_BILLETS.filter(
                    (b) =>
                      b.code === billetCode ||
                      !(inferDepartment(person.lastPosition) || department) ||
                      b.department === (inferDepartment(person.lastPosition) || department),
                  ).map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.shortTitle}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted">Watch</span>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                  value={watch}
                  onChange={(e) => {
                    setAssignTouched(true);
                    setWatch(e.target.value);
                  }}
                >
                  <option value="">Unassigned</option>
                  <option value="day">Day</option>
                  <option value="12-4">12–4</option>
                  <option value="4-8">4–8</option>
                  <option value="8-12">8–12</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted">Assignment</span>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                  value={assignmentType}
                  onChange={(e) => {
                    setAssignTouched(true);
                    setAssignmentType(e.target.value);
                  }}
                >
                  <option value="">—</option>
                  <option value="PERMANENT">Permanent</option>
                  <option value="ROTARY">Rotary</option>
                  <option value="RELIEF">Relief</option>
                  <option value="CADET">Cadet</option>
                  <option value="APPRENTICE">Apprentice</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted">Union</span>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                  value={unionHall}
                  onChange={(e) => {
                    setAssignTouched(true);
                    setUnionHall(e.target.value);
                  }}
                >
                  <option value="">—</option>
                  <option value="MMP">MM&P</option>
                  <option value="MEBA">MEBA</option>
                  <option value="SIU">SIU</option>
                  <option value="NONE">None</option>
                </select>
              </label>
              {unionHall === "SIU" && assignmentType === "ROTARY" ? (
                <label className="text-sm">
                  <span className="text-muted">SIU class</span>
                  <select
                    className="mt-1 flex h-10 w-full rounded-md border border-border bg-paper px-2 text-sm"
                    value={seniorityClass}
                    onChange={(e) => {
                      setAssignTouched(true);
                      setSeniorityClass(e.target.value);
                    }}
                  >
                    <option value="">Not on file · Class A 75–120</option>
                    <option value="A">A · 75–120d</option>
                    <option value="B">B · 180d or 1 RT</option>
                    <option value="C">C · 60d or 1 RT</option>
                  </select>
                </label>
              ) : null}
              {assignmentType === "RELIEF" ? (
                <>
                  <label className="text-sm">
                    <span className="text-muted">Covering (relieving)</span>
                    <Input
                      className="mt-1"
                      value={relieving}
                      onChange={(e) => {
                        setAssignTouched(true);
                        setRelieving(e.target.value);
                      }}
                      placeholder="Permanent who still holds the job"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted">Relief length (days)</span>
                    <Input
                      className="mt-1"
                      inputMode="numeric"
                      value={lengthDays}
                      onChange={(e) => {
                        setAssignTouched(true);
                        setLengthDays(e.target.value);
                      }}
                      placeholder={unionHall === "SIU" ? "SIU 45–60 or dispatch days" : "Dispatch days"}
                    />
                  </label>
                </>
              ) : null}
              <label className="text-sm sm:col-span-2">
                <span className="text-muted">Discharge {dueOffManual ? "(overrides the rule)" : ""}</span>
                <Input
                  type="date"
                  className="mt-1"
                  value={dueOff}
                  onChange={(e) => {
                    setDueOffManual(true);
                    setDueOff(e.target.value);
                  }}
                />
                {dueRule ? <p className="mt-1 text-xs text-muted">{dueRule}{dueOff ? ` · ${formatShort(dueOff)}` : ""}</p> : null}
              </label>
            </div>
            {watch ? <p className="mt-2 text-xs text-muted">Watch: {watchLabel(watch)}</p> : null}
          </section>

          <section className="rounded-xl bg-paper p-5 shadow-border">
            <h2 className="font-display text-xl">Familiarization officer</h2>
            <p className="mt-1 text-sm text-muted">
              Your initials go in the Fam. Officer column on every row. Crew member column stays blank. 72-hour items fill for their department only.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-muted">Your initials</span>
                <Input
                  className="mt-1 uppercase"
                  value={officerInitials}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().slice(0, 8);
                    setOfficerInitials(v);
                    try {
                      localStorage.setItem("crew-ledger-fam-initials", v.trim());
                    } catch {
                      /* ignore */
                    }
                    clearPacket();
                  }}
                  placeholder="e.g. JDS"
                  aria-label="Familiarization officer initials"
                />
              </label>
              <div className="text-sm">
                <span className="text-muted">Department</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(["deck", "engine", "steward"] as const).map((d) => (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant={department === d ? "default" : "outline"}
                      onClick={() => {
                        setDepartment(d);
                        setDeptManual(true);
                        clearPacket();
                      }}
                    >
                      {departmentLabel(d)}
                    </Button>
                  ))}
                </div>
                {department ? (
                  <p className="mt-2 text-xs text-muted">
                    {deptManual ? "Set by you." : `From rating (${positionLabel(person.lastPosition)}).`} 72-hour block: {departmentLabel(department)}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-warn">Could not read department from the papers — pick one.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-paper p-5 shadow-border">
            <h2 className="font-display text-xl">{person.fullName}</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Field k="Rating" v={positionLabel(person.lastPosition)} />
              <Field k="DOB" v={formatDate(person.dob)} />
              <Field k="MMC" v={person.mmcNumber} extra={<ExpiryChip date={person.mmcExpiration} />} />
              <Field k="Passport" v={person.passportNumber} extra={<ExpiryChip date={person.passportExpiration} />} />
              <Field k="Phone" v={person.cellPhone || person.homePhone} />
              <Field k="Email" v={person.email} />
              <Field k="Address" v={[person.addressLine, person.city, person.state, person.zip].filter(Boolean).join(", ")} />
              <Field k="Next of kin" v={person.nextOfKin ? `${person.nextOfKin.fullName} (${person.nextOfKin.relationship ?? "—"})` : null} />
              <Field
                k="Prior employers"
                v={
                  person.previousEmployers.length
                    ? person.previousEmployers
                        .slice(0, 3)
                        .map((e) => e.name)
                        .join(" · ")
                    : null
                }
              />
            </dl>
            {missing.length ? (
              <p className="mt-3 text-sm text-warn">Still missing: {missing.join(", ")}. Packet fills what we have; blanks stay blank.</p>
            ) : (
              <p className="mt-3 text-sm text-ok">Enough to fill identity fields on the original forms.</p>
            )}
          </section>

          <section className="rounded-xl bg-paper p-5 shadow-border">
            <h2 className="font-display text-xl">This joining</h2>
            <p className="mt-1 text-sm text-muted">
              {match
                ? "Returning — SRO-CM-06 4.2. MMC, drug-free card, and medical certificate checked every time. Familiarization (SMM-PER-05 rev 5) is filled every return."
                : "New to the vessel — SRO-CM-06 4.1 full company packet, plus familiarization and medical sign-on."}
            </p>
            {joiningSet.notes.map((n) => (
              <p key={n} className="mt-1 text-xs text-muted">
                {n}
              </p>
            ))}

            <h3 className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage">Tickets</h3>
            <ul className="mt-2 divide-y divide-border">
              {tickets
                .slice()
                .sort((a, b) => {
                  const rank: Record<string, number> = { expired: 0, soon: 1, missing: 2, watch: 3, ok: 4 };
                  return (rank[a.tone] ?? 9) - (rank[b.tone] ?? 9);
                })
                .map((t) => (
                  <li key={t.code} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{t.label}</span>
                      {t.note ? <span className="ml-2 text-xs text-muted">{t.note}</span> : null}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{t.expiresOn ? formatShort(t.expiresOn) : "—"}</span>
                      <ExpiryChip date={t.expiresOn} />
                    </span>
                  </li>
                ))}
            </ul>

            <h3 className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage">Forms this assignment</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {joiningSet.forms.map((f) => (
                <li key={f.key} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="font-medium">{f.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{f.why}</span>
                  </span>
                  <Badge tone={f.required ? "steel" : "neutral"}>{f.required ? "Print" : "If needed"}</Badge>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-3 rounded-lg bg-paper-2/80 p-4">
              {match ? (
                <>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-steel"
                      checked={identityChanged}
                      onChange={(e) => {
                        setIdentityChanged(e.target.checked);
                        clearPacket();
                      }}
                    />
                    <span>
                      Address, next of kin, or tickets changed
                      <span className="mt-0.5 block text-xs text-muted">SRO-CM-06 4.2 — fill SRO-PER-003 only if anything changed.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-steel"
                      checked={w4Needed}
                      onChange={(e) => {
                        setW4Needed(e.target.checked);
                        clearPacket();
                      }}
                    />
                    <span>
                      Need a new W-4
                      <span className="mt-0.5 block text-xs text-muted">Returning crew only get a W-4 if withholding changed.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-steel"
                      checked={depositChanged}
                      onChange={(e) => {
                        setDepositChanged(e.target.checked);
                        clearPacket();
                      }}
                    />
                    <span>
                      Direct deposit change
                      <span className="mt-0.5 block text-xs text-muted">Account and routing stay blank for them to write in.</span>
                    </span>
                  </label>
                </>
              ) : null}
              {unionHall === "MMP" || unionHall === "SIU" ? (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-steel"
                    checked={enroll401k}
                    onChange={(e) => {
                      setEnroll401k(e.target.checked);
                      clearPacket();
                    }}
                  />
                  <span>
                    Enroll in {union401kLabel(unionHall as UnionHall)} this assignment
                    <span className="mt-0.5 block text-xs text-muted">
                      {unionHall === "MMP"
                        ? "Off = MM&P opt-out, which they must complete each time they sign on. Contribution % stays blank."
                        : "Off = decline on the Empower form. Contribution % stays blank either way."}
                    </span>
                  </span>
                </label>
              ) : unionHall === "MEBA" ? (
                <p className="text-sm text-muted">
                  MEBA 401(k) and converted overtime print with name and employer only. Elections and hours stay blank.
                </p>
              ) : null}
              {joiningSet.extras.includes("hazmat-cert") ? (
                <label className="block text-sm">
                  <span className="text-muted">HAZMAT instructor</span>
                  <Input
                    className="mt-1"
                    value={instructorName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setInstructorName(v);
                      try {
                        localStorage.setItem("crew-ledger-hazmat-instructor", v);
                      } catch {
                        /* ignore */
                      }
                      clearPacket();
                    }}
                    placeholder="Sorin Rosca, Chief Mate"
                  />
                </label>
              ) : null}
            </div>
          </section>

          {deadTickets.length ? (
            <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm">
              <p className="font-medium text-danger">Dead ticket — cannot finish articles.</p>
              <ul className="mt-1 list-disc pl-5 text-muted">
                {deadTickets.map((t) => (
                  <li key={t.code}>
                    {t.label}
                    {t.expiresOn ? ` expired ${formatShort(t.expiresOn)}` : ""}
                  </li>
                ))}
              </ul>
              <label className="mt-3 block text-sm">
                <span className="text-muted">Why they are still signing on</span>
                <Input
                  className="mt-1"
                  value={ticketOverride}
                  onChange={(e) => setTicketOverride(e.target.value)}
                  placeholder="Master’s call, replacement arriving, etc."
                />
              </label>
            </div>
          ) : null}

          {coastGaps.length ? (
            <div className="rounded-xl bg-warn/15 px-4 py-3 text-sm">
              <p className="font-medium">eNOAD still needs: {coastGaps.join(", ")}.</p>
              <p className="mt-1 text-muted">You can sign them on. The Master cannot file until these are on the file.</p>
            </div>
          ) : null}

          {warnings.length ? (
            <ul className="space-y-1 text-sm text-danger">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button disabled={busy !== "idle" || !startDate || !officerInitials.trim() || !department} onClick={() => void fillPacket()}>
              {busy === "filling" ? "Filling this joining…" : "Fill papers for this joining"}
            </Button>
            <Button
              variant="outline"
              disabled={saving || !startDate}
              onClick={() => {
                if (!billetCode) {
                  toast.error("Pick which billet they are joining.");
                  return;
                }
                if (deadTickets.length && !ticketOverride.trim()) {
                  toast.error("MMC, medical, TWIC, or drug-free is expired. Type why you are still signing them on.");
                  return;
                }
                const ready = withTour(person);
                commitMut.mutate({
                  data: {
                    person: ready,
                    matchCrewId: match?.crewId ?? null,
                    signOn: true,
                    filename: fromLedger ? "ledger" : files.map((f) => f.name).join(", ") || "union-docs",
                    ticketOverride: deadTickets.length ? ticketOverride.trim() : null,
                  },
                });
              }}
            >
              {saving ? "Saving…" : match ? "Sign on returning mariner" : "Sign on as new"}
            </Button>
            {fromLedger ? null : (
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() =>
                  commitMut.mutate({
                    data: {
                      person: withTour(person),
                      matchCrewId: match?.crewId ?? null,
                      signOn: false,
                      filename: files.map((f) => f.name).join(", ") || "union-docs",
                    },
                  })
                }
              >
                Save to ledger only
              </Button>
            )}
          </div>

          {packetUrl ? (
            <section className="rounded-xl bg-paper p-5 shadow-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">Company packet this joining</h2>
                  <p className="text-sm text-muted">
                    Only the SRO-CM-06 / SMM-PER-05 pages for this assignment. Fam. Officer initials on the checklist; crew-member column left blank.
                  </p>
                </div>
                <Button asChild>
                  <a href={packetUrl} download={packetName ?? "sign-on-packet.pdf"}>
                    Download packet
                  </a>
                </Button>
              </div>
              <iframe
                title="Filled sign-on packet"
                src={packetUrl}
                className="mt-4 h-[720px] w-full rounded-lg bg-paper-2 outline outline-1 -outline-offset-1 outline-ink/10"
              />
            </section>
          ) : null}

          {extraFiles.length ? (
            <section className="rounded-xl bg-paper p-5 shadow-border">
              <h2 className="font-display text-xl">Also print</h2>
              <p className="mt-1 text-sm text-muted">
                Union 401(k), MEBA converted OT if they sail MEBA, and a door nametag for this joining person only
                {joiningSet.extras.includes("hazmat-cert")
                  ? ". HAZMAT certificate for this deck officer if the 3-year card is due."
                  : ". HAZMAT certificate is not printed for this rate."}
              </p>
              <ul className="mt-4 divide-y divide-border">
                {extraFiles.map((e) => (
                  <li key={e.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="font-medium">{e.label}</span>
                    <Button asChild size="sm">
                      <a href={e.url} download={e.name}>
                        Download
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
              {extraFiles[0] ? (
                <iframe
                  title={extraFiles[0].label}
                  src={extraFiles[0].url}
                  className="mt-4 h-[520px] w-full rounded-lg bg-paper-2 outline outline-1 -outline-offset-1 outline-ink/10"
                />
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Field({ k, v, extra }: { k: string; v: string | null | undefined; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{k}</dt>
      <dd className="flex items-center gap-2 text-right">
        {v || "—"}
        {extra}
      </dd>
    </div>
  );
}
