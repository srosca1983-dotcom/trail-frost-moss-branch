import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMdY, todayUtc } from "@/lib/crew/dates";
import {
  fillHazmatAnswerKey,
  fillHazmatCertificate,
  fillHazmatPacks,
  fillHazmatPersonPack,
  fillHazmatQuiz,
  fillHazmatStudy,
  hazmatCertFilename,
  hazmatPersonFilename,
  hazmatQuizFilename,
  type HazmatSession,
  DEFAULT_HAZMAT_SESSION,
} from "@/lib/crew/fill-hazmat";
import {
  HAZMAT_CFR,
  HAZMAT_PASS,
  HAZMAT_QUESTIONS,
  classifyHazmatCrew,
  passedHazmat,
  requiredHazmatSeats,
  type HazmatSeat,
} from "@/lib/crew/hazmat-quiz";
import { listCrew, recordHazmatQuiz } from "@/lib/crew/server";
import { SMS_TRAINING } from "@/lib/crew/sms-training";
import { VESSEL } from "@/lib/crew/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hazmat")({ component: Page });

type ReadyFile = { id: string; label: string; name: string; url: string };
type Grade = { score: string; date: string };

function readStored(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

function readGrades(): Record<string, Grade> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("crew-ledger-hazmat-grades");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Grade>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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
      <HazmatDesk />
    </Desk>
  );
}

function HazmatDesk() {
  const qc = useQueryClient();
  const roster = useQuery({ queryKey: ["crew"], queryFn: () => listCrew() });
  const [date, setDate] = useState(() => todayUtc().toISOString().slice(0, 10));
  const [instructor, setInstructor] = useState(() =>
    readStored("crew-ledger-hazmat-instructor", DEFAULT_HAZMAT_SESSION.instructorName),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState<ReadyFile[]>([]);
  const [grades, setGrades] = useState<Record<string, Grade>>(readGrades);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    localStorage.setItem("crew-ledger-hazmat-grades", JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    if (!roster.data) return;
    setGrades((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of roster.data) {
        if (p.hazmatScore == null) continue;
        const existing = next[p.id];
        if (existing?.score) continue;
        next[p.id] = { score: String(p.hazmatScore), date: p.hazmatIssued || date };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [roster.data, date]);

  const seats = useMemo(() => classifyHazmatCrew(roster.data ?? []), [roster.data]);
  const required = requiredHazmatSeats(seats);
  const visible = showAll ? seats : required;
  const session: HazmatSession = {
    date,
    instructorName: instructor.trim() || DEFAULT_HAZMAT_SESSION.instructorName,
  };

  function remember() {
    localStorage.setItem("crew-ledger-hazmat-instructor", session.instructorName);
  }

  function pushReady(label: string, name: string, url: string) {
    setReady((prev) => {
      const next = prev.filter((f) => f.name !== name);
      next.unshift({ id: `${name}-${Date.now()}`, label, name, url });
      for (const dropped of prev.filter((f) => f.name === name)) URL.revokeObjectURL(dropped.url);
      return next.slice(0, 12);
    });
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
      toast.success(readyLabel);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fill papers");
    } finally {
      setBusy(null);
    }
  }

  function printPacks() {
    return run("packs", async () => ({
      bytes: await fillHazmatPacks(required, session),
      name: hazmatQuizFilename("packs", "deck-officers", date),
      readyLabel: `Study + quiz · ${required.length} mates`,
    }));
  }

  function printKey() {
    return run("key", async () => ({
      bytes: await fillHazmatAnswerKey(session),
      name: hazmatQuizFilename("key", "CHIEF-MATE-ONLY", date),
      readyLabel: "Answer key — keep this",
    }));
  }

  function printStudy() {
    return run("study", async () => ({
      bytes: await fillHazmatStudy(null, session),
      name: hazmatQuizFilename("study", "blank", date),
      readyLabel: "Blank study sheet",
    }));
  }

  function printBlankQuiz() {
    return run("quiz", async () => ({
      bytes: await fillHazmatQuiz(null, session),
      name: hazmatQuizFilename("quiz", "blank", date),
      readyLabel: "Blank extra quiz (bosun / AB if you need one)",
    }));
  }

  function printSeat(seat: HazmatSeat) {
    return run(seat.crewId, async () => ({
      bytes: await fillHazmatPersonPack(seat, session),
      name: hazmatPersonFilename(seat, date),
      readyLabel: `${seat.fullName} · study + quiz`,
    }));
  }

  const saveMut = useMutation({
    mutationFn: recordHazmatQuiz,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["nse-board"] });
      await qc.invalidateQueries({ queryKey: ["crew"] });
      await qc.invalidateQueries({ queryKey: ["expiring"] });
    },
  });

  async function saveAndPrint(seat: HazmatSeat) {
    const g = grades[seat.crewId];
    const score = Number(g?.score);
    const issued = g?.date || date;
    if (!passedHazmat(score)) {
      toast.error(`${HAZMAT_PASS} of ${HAZMAT_QUESTIONS.length} to pass. No certificate on a fail.`);
      return;
    }
    remember();
    setBusy(`cert-${seat.crewId}`);
    try {
      await saveMut.mutateAsync({
        data: { crewId: seat.crewId, issued, score, instructorName: session.instructorName },
      });
      const bytes = await fillHazmatCertificate(seat, { ...session, date: issued }, score);
      const name = hazmatCertFilename(seat, issued);
      const url = downloadPdf(bytes, name);
      pushReady(`${seat.fullName} · ${score}/${HAZMAT_QUESTIONS.length} cert`, name, url);
      toast.success(`${seat.fullName} passed ${score}/${HAZMAT_QUESTIONS.length}. Sign the cert.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save score");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        kicker="HAZMAT"
        title="Hand them the quiz. Grade it later."
        description={`${required.length} seats required: Master and the three mates. Bosun and ABs are not on the SMS H mark. ${HAZMAT_QUESTIONS.length} questions, ${HAZMAT_PASS} to pass, valid 3 years.`}
      />

      <section className="mb-6 rounded-xl bg-paper p-5 shadow-border sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-sage">Date on the papers</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-sage">Your name (prints as instructor)</span>
            <Input
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Sorin Rosca, Chief Mate"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted">
          {VESSEL} · {HAZMAT_CFR}.{" "}
          <a href={SMS_TRAINING.per06.url} className="text-steel-2 hover:underline" target="_blank" rel="noreferrer">
            SMM-PER-06
          </a>
          {" · "}
          H = 1 per vessel if carrying HAZMAT. Not SMM-OPS-11.
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

      <ol className="mb-8 grid gap-4 lg:grid-cols-3">
        <li className="flex flex-col rounded-xl bg-paper p-5 shadow-border">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">1 · Hand out</p>
          <h2 className="mt-1 font-display text-xl tracking-tight">Study + quiz</h2>
          <p className="mt-2 text-sm text-muted">
            One pack per mate: study sheet then the 20-question test. They sit it without you.
          </p>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            <Button onClick={() => void printPacks()} disabled={Boolean(busy) || !required.length}>
              {busy === "packs" ? "Printing…" : `Print ${required.length} packs`}
            </Button>
            <Button variant="outline" onClick={() => void printStudy()} disabled={Boolean(busy)}>
              Extra study sheet
            </Button>
          </div>
        </li>
        <li className="flex flex-col rounded-xl bg-paper p-5 shadow-border">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">2 · You keep</p>
          <h2 className="mt-1 font-display text-xl tracking-tight">Answer key</h2>
          <p className="mt-2 text-sm text-muted">
            Do not put this in the stack you hand out. Grade when they come back.
          </p>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            <Button onClick={() => void printKey()} disabled={Boolean(busy)}>
              {busy === "key" ? "Printing…" : "Print answer key"}
            </Button>
            <Button variant="outline" onClick={() => void printBlankQuiz()} disabled={Boolean(busy)}>
              Extra blank quiz
            </Button>
          </div>
        </li>
        <li className="flex flex-col rounded-xl bg-paper p-5 shadow-border">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sage">3 · After they pass</p>
          <h2 className="mt-1 font-display text-xl tracking-tight">Enter the score</h2>
          <p className="mt-2 text-sm text-muted">
            {HAZMAT_PASS} of {HAZMAT_QUESTIONS.length} to pass. Saving prints the certificate and stamps the NSE board.
          </p>
          <p className="mt-auto pt-5 text-sm text-muted">Use the table below. Signature stays blank.</p>
        </li>
      </ol>

      <section>
        <h2 className="font-display text-xl tracking-tight">Who takes it</h2>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-muted">
            SMS H mark is Master and the three mates. Bosun and ABs are not required by the book — if they actually handle DG, 49 CFR 176.13 still applies: print a pack, grade it, save the cert here.
          </p>
          <button
            type="button"
            className="shrink-0 text-sm text-steel-2 hover:underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Hide ratings" : `Show ${seats.length - required.length} ratings (not required)`}
          </button>
        </div>

        <div className="mt-4 min-w-0 overflow-x-auto rounded-xl shadow-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">SMS</th>
                <th className="px-4 py-3">Score / {HAZMAT_QUESTIONS.length}</th>
                <th className="px-4 py-3">Test date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-paper">
              {visible.map((s) => {
                const g = grades[s.crewId] ?? { score: "", date };
                const n = Number(g.score);
                const ok = passedHazmat(n);
                return (
                  <tr key={s.crewId} className={s.required ? "" : "opacity-70"}>
                    <td className="px-4 py-3">
                      <Link to="/crew/$crewId" params={{ crewId: s.crewId }} className="font-medium hover:underline">
                        {s.fullName}
                      </Link>
                      {s.lastScore != null ? (
                        <div className="text-xs text-muted">
                          On file {s.lastScore}/{HAZMAT_QUESTIONS.length}
                          {s.lastIssued ? ` · ${formatMdY(s.lastIssued)}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.positionLabel}</td>
                    <td className="px-4 py-3">
                      {s.required ? <Badge tone="ok">Required</Badge> : <Badge>Not SMS</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        className="w-20"
                        inputMode="numeric"
                        value={g.score}
                        onChange={(e) =>
                          setGrades((prev) => ({ ...prev, [s.crewId]: { ...g, score: e.target.value } }))
                        }
                        placeholder="0–20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        className="w-40"
                        value={g.date}
                        onChange={(e) =>
                          setGrades((prev) => ({ ...prev, [s.crewId]: { ...g, date: e.target.value } }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={() => void printSeat(s)}>
                          Pack
                        </Button>
                        <Button
                          size="sm"
                          disabled={Boolean(busy) || !ok}
                          onClick={() => void saveAndPrint(s)}
                          className={cn(!ok && "opacity-50")}
                        >
                          {busy === `cert-${s.crewId}` ? "Saving…" : "Save + cert"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      </section>
    </>
  );
}
