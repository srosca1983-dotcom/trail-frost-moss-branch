import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Component, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrewPicker } from "@/components/crew-picker";
import { cn } from "@/lib/utils";
import { positionLabel } from "@/lib/crew/ratings";
import { invalidateDesk } from "@/lib/crew/desk-query";
import { packetsFromFile, slimPacket, ticketFileProblem } from "@/lib/crew/pdf";
import { commitParsed, commitTickets, listCrew, listRecentInbox, parsePackets } from "@/lib/crew/server";
import { MAX_PACKET_FILES } from "@/lib/crew/types";
import type { ParsedPacketResult } from "@/lib/crew/types";

const LAST_FILED_KEY = "inbox-last-filed";
const LAST_RESULTS_KEY = "inbox-last-results";

type FiledRow = {
  crewId: string;
  fullName: string;
  filename: string;
  tickets: string;
  created: boolean;
  status: string;
};

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  }
}

function readLastFiled(): FiledRow[] {
  try {
    const raw = storageGet(LAST_FILED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FiledRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLastFiled(rows: FiledRow[]) {
  storageSet(LAST_FILED_KEY, JSON.stringify(rows));
}

function readLastResults(): ParsedPacketResult[] {
  try {
    const raw = storageGet(LAST_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ParsedPacketResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLastResults(rows: ParsedPacketResult[]) {
  storageSet(LAST_RESULTS_KEY, JSON.stringify(rows));
}

function filedFromResult(r: ParsedPacketResult): FiledRow | null {
  if (!r.match || !r.person) return null;
  return {
    crewId: r.match.crewId,
    fullName: r.match.fullName || r.person.fullName,
    filename: r.filename,
    tickets: r.person.documents.map((d) => d.label).filter(Boolean).slice(0, 4).join(" · ") || "File opened",
    created: r.warnings.some((w) => w.startsWith("Opened a new file")),
    status: r.match.status,
  };
}

function uniqueFiled(rows: FiledRow[]) {
  const seen = new Set<string>();
  const out: FiledRow[] = [];
  for (const r of rows) {
    const k = `${r.crewId}|${r.filename}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

async function readPacket(payload: { filename: string; pageCount: number; pages: { text?: string; image?: string }[] }) {
  try {
    const parsed = await parsePackets({ data: { packets: [payload], fileIfMissing: true, skipBust: true } });
    return parsed[0] ?? null;
  } catch {
    const textOnly = {
      filename: payload.filename,
      pageCount: payload.pageCount,
      pages: payload.pages.map((p) => ({ text: p.text, image: undefined })),
    };
    const parsed = await parsePackets({ data: { packets: [textOnly], fileIfMissing: true, skipBust: true } });
    const row = parsed[0];
    if (row) {
      row.warnings = [
        ...(row.warnings ?? []),
        "Photos were skipped so this drop would finish. Drop the passport and MMC pages if tickets are blank.",
      ];
      return row;
    }
    throw new Error("Could not read that file.");
  }
}

export const Route = createFileRoute("/ingest")({ component: Page });

function Page() {
  return (
    <Desk>
      <InboxGuard>
        <Inbox />
      </InboxGuard>
    </Desk>
  );
}

class InboxGuard extends Component<{ children: ReactNode }, { err: string | null }> {
  state: { err: string | null } = { err: null };
  static getDerivedStateFromError(err: Error) {
    return { err: err.message || "Read stopped" };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="rounded-xl bg-paper p-6 shadow-border">
          <p className="font-medium">That batch stopped.</p>
          <p className="mt-1 text-sm text-muted">
            Names already read are still on Ledger → New files. Drop the remaining PDFs again.
          </p>
          <p className="mt-2 text-xs text-faint">{this.state.err}</p>
          <Button className="mt-4" type="button" onClick={() => this.setState({ err: null })}>
            Back to inbox
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Inbox() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ i: number; n: number; name: string } | null>(null);
  const [results, setResults] = useState<ParsedPacketResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [lastFiled, setLastFiled] = useState<FiledRow[]>([]);
  const crewQ = useQuery({ queryKey: ["crew"], queryFn: () => listCrew(), staleTime: 60_000 });
  const logQ = useQuery({ queryKey: ["inbox-log"], queryFn: () => listRecentInbox(), staleTime: 15_000 });

  useEffect(() => {
    const stored = readLastFiled();
    const storedResults = readLastResults();
    if (stored.length) setLastFiled(stored);
    if (storedResults.length) setResults(storedResults);
  }, []);

  const commitMut = useMutation({
    mutationFn: commitParsed,
    onSuccess: () => {
      invalidateDesk(qc);
    },
  });

  function onPick(list: FileList | null) {
    if (busyRef.current) {
      toast.message("Wait until this batch finishes, then drop the rest.");
      return;
    }
    if (!list?.length) return;
    const next: File[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(list)) {
      const problem = ticketFileProblem(f);
      if (problem) {
        rejected.push(problem);
        continue;
      }
      next.push(f);
    }
    for (const msg of rejected) toast.error(msg);
    if (!next.length) {
      toast.error("No PDF or photo in that drop. Zip and Word files will not read.");
      return;
    }
    if (next.length > MAX_PACKET_FILES) {
      toast.error(`Cap is ${MAX_PACKET_FILES} files at a time. Load the rest in the next batch.`);
    }
    const chosen = next.slice(0, MAX_PACKET_FILES);
    setFiles(chosen);
    busyRef.current = true;
    setBusy(true);
    setProgress({ i: 0, n: chosen.length, name: "Opening…" });
    void ingestList(chosen);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    onPick(e.dataTransfer.files);
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const list = e.clipboardData?.files;
      if (!list?.length) return;
      e.preventDefault();
      onPick(list);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function ingestList(chosen: File[]) {
    if (!chosen.length) return;
    setBusy(true);
    setResults([]);
    const out: ParsedPacketResult[] = [];
    const filed: FiledRow[] = [];
    try {
      for (let i = 0; i < chosen.length; i += 1) {
        const f = chosen[i]!;
        setProgress({ i: i + 1, n: chosen.length, name: f.name });
        await new Promise((r) => setTimeout(r, 0));
        let packets: Awaited<ReturnType<typeof packetsFromFile>> = [];
        try {
          packets = await packetsFromFile(f);
        } catch (e) {
          out.push({
            filename: f.name,
            pageCount: 0,
            person: null,
            match: null,
            warnings: [],
            error: e instanceof Error ? e.message : "Could not open file",
          });
          setResults([...out]);
          writeLastResults(out);
          continue;
        }
        if (!packets.length) {
          out.push({
            filename: f.name,
            pageCount: 0,
            person: null,
            match: null,
            warnings: [],
            error: "Empty file",
          });
          setResults([...out]);
          writeLastResults(out);
          continue;
        }
        for (const pkt of packets) {
          const payload = slimPacket(pkt);
          try {
            const parsed = await readPacket(payload);
            out.push(
              parsed ?? {
                filename: pkt.filename,
                pageCount: pkt.pageCount,
                person: null,
                match: null,
                warnings: [],
                error: "Empty result",
              },
            );
          } catch (e) {
            out.push({
              filename: pkt.filename,
              pageCount: pkt.pageCount,
              person: null,
              match: null,
              warnings: [],
              error: e instanceof Error ? e.message : "Read failed",
            });
          }
          setResults([...out]);
          writeLastResults(out);
          const row = filedFromResult(out[out.length - 1]!);
          if (row) {
            filed.push(row);
            setLastFiled([...filed]);
            writeLastFiled(filed);
          }
        }
      }
      const ok = out.filter((r) => r.person).length;
      const opened = out.filter((r) => r.warnings.some((w) => w.startsWith("Opened a new file"))).length;
      const unmatched = out.filter((r) => r.person && !r.match).length;
      if (!ok) toast.error("Could not read a name on those files. Try a clearer scan, or put the last name in the filename (SASH_Rosca.pdf).");
      else
        toast.success(
          `Read ${ok} · ${opened ? `opened ${opened} new file${opened === 1 ? "" : "s"} · ` : ""}${unmatched ? `${unmatched} still need a name pick` : "saved to the ledger"}`,
        );
    } finally {
      busyRef.current = false;
      setBusy(false);
      setProgress(null);
      invalidateDesk(qc);
    }
  }

  async function saveTickets() {
    let n = 0;
    let docs = 0;
    try {
      for (const r of results) {
        if (!r.person) continue;
        const crewId = r.match?.crewId ?? picked[r.filename];
        if (!crewId) continue;
        const res = await commitTickets({
          data: { crewId, person: r.person, filename: r.filename },
        });
        docs += res.upserted;
        n += 1;
      }
      invalidateDesk(qc);
      if (!n) {
        toast.error("Need a match on file to update tickets. Pick the mariner on any unmatched row, or Save all to ledger for a new name.");
        return;
      }
      toast.success(`Updated ${n} file${n === 1 ? "" : "s"} · ${docs} ticket${docs === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save tickets");
    }
  }

  async function saveAll(signOn: boolean) {
    let n = 0;
    for (const r of results) {
      if (!r.person) continue;
      await commitMut.mutateAsync({
        data: { person: r.person, matchCrewId: r.match?.crewId ?? picked[r.filename] ?? null, signOn, filename: r.filename },
      });
      n += 1;
    }
    toast.success(`Saved ${n} mariners`);
    invalidateDesk(qc);
  }

  const currentCrew = crewQ.data ?? [];
  const serverFiled: FiledRow[] = (logQ.data ?? [])
    .filter((r) => r.crewId && r.fullName && !r.error)
    .map((r) => ({
      crewId: r.crewId!,
      fullName: r.fullName!,
      filename: r.filename,
      tickets: r.filename,
      created: r.created,
      status: r.created ? "applicant" : "",
    }));
  const shownFiled = uniqueFiled(lastFiled.length ? lastFiled : serverFiled).slice(0, 25);
  const failedReads = (logQ.data ?? []).filter((r) => r.error).slice(0, 20);
  const newestFail = failedReads[0]?.loggedAt;
  const failedWindow = newestFail
    ? failedReads.filter((r) => {
        const a = Date.parse(r.loggedAt);
        const b = Date.parse(newestFail);
        return Number.isFinite(a) && Number.isFinite(b) && b - a < 45 * 60_000;
      })
    : failedReads;

  return (
    <>
      <PageHeader
        kicker="Inbox"
        title="Drop a packet or a batch of tickets."
        description={`SASH, TWIC, MMC, passport, medical, STCW, HAZMAT — one file each, or one stacked PDF. The name is read off the page. The filename is only a hint. If they are new we open a file; they are not aboard until you sign them on. Up to ${MAX_PACKET_FILES} files.`}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-6 text-center transition-colors duration-150",
          over ? "border-steel-2 bg-steel/10" : "border-border bg-paper-2/50",
        )}
      >
        <p className="font-display text-xl">SASH batch, packets, or a single ticket</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          PDF or a photo. A stacked SASH scan is split per person. A full packet stays one file. If the name is new we open a file — they are not aboard until you sign them on.
        </p>
        <label className="mt-4 inline-flex cursor-pointer flex-col items-center gap-2">
          <span className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper">Choose files from this computer</span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            className="max-w-xs text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:text-ink"
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p className="mt-2 text-xs text-faint">
          {files.length} selected · {MAX_PACKET_FILES} max · 32 MB each
        </p>
      </div>

      {shownFiled.length ? (
        <section className="mt-4 overflow-hidden rounded-xl shadow-border">
          <div className="bg-paper-2 px-4 py-3">
            <h2 className="font-display text-lg tracking-tight">Just loaded</h2>
            <p className="text-xs text-muted">Stays here until you load the next batch so you do not file them twice.</p>
          </div>
          <ul className="divide-y divide-border bg-paper">
            {shownFiled.map((row, i) => (
              <li key={`${row.crewId}-${row.filename}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link to="/crew/$crewId" params={{ crewId: row.crewId }} className="font-medium hover:underline">
                    {row.fullName}
                  </Link>
                  <div className="truncate text-xs text-muted">
                    {row.tickets}
                    {row.status === "applicant" ? " · not aboard yet" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.created ? <Badge tone="watch">New file</Badge> : <Badge tone="steel">Updated</Badge>}
                  <Link to="/crew/$crewId" params={{ crewId: row.crewId }} className="text-sm text-steel-2 hover:underline">
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {failedWindow.length && !busy ? (
        <section className="mt-4 overflow-hidden rounded-xl shadow-border">
          <div className="bg-paper-2 px-4 py-3">
            <h2 className="font-display text-lg tracking-tight">Could not read</h2>
            <p className="text-xs text-muted">The name was not on the page. Pick who it belongs to in Extracted, or drop a clearer scan.</p>
          </div>
          <ul className="divide-y divide-border bg-paper">
            {failedWindow.map((row, i) => (
              <li key={`${row.id}-${i}`} className="px-4 py-2 text-sm">
                <span className="font-medium">{row.filename}</span>
                <span className="mt-0.5 block text-xs text-muted">{row.error}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {files.length ? (
        <ul className="mt-4 divide-y divide-border rounded-xl bg-paper shadow-border">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-xs text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!files.length || busy} onClick={() => void ingestList(files)}>
          {busy ? `Reading ${progress?.i ?? 0} of ${progress?.n ?? 0}` : "Read files again"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            setFiles([]);
            setResults([]);
            setPicked({});
            writeLastResults([]);
          }}
        >
          Clear
        </Button>
      </div>

      {progress ? (
        <p className="mt-3 text-sm text-muted">
          Reading {progress.i} / {progress.n} · {progress.name}
        </p>
      ) : null}

      {results.length ? (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Extracted</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void saveTickets()} disabled={busy}>
                Save tickets only
              </Button>
              <Button size="sm" variant="outline" onClick={() => void saveAll(false)} disabled={busy}>
                Save all to ledger
              </Button>
              <Button size="sm" variant="outline" onClick={() => void saveAll(true)} disabled={busy}>
                Save and mark aboard
              </Button>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto rounded-xl shadow-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Mariner</th>
                  <th className="px-4 py-3">Tickets read</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r, i) => (
                  <tr key={`${r.filename}-${i}`}>
                    <td className="px-4 py-3 font-mono text-xs">{r.filename}</td>
                    <td className="px-4 py-3">
                      {r.person ? (
                        <>
                          <div className="font-medium">{r.person.fullName}</div>
                          <div className="text-xs text-muted">
                            {positionLabel(r.person.lastPosition)}
                            {r.person.tour?.seniorityClass ? ` · SIU ${r.person.tour.seniorityClass}` : ""}
                          </div>
                        </>
                      ) : (
                        <span className="text-danger">{r.error ?? "Unreadable"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {r.person?.documents.length
                        ? r.person.documents.map((d) => d.label).slice(0, 4).join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.match ? (
                        r.warnings.some((w) => w.startsWith("Opened a new file")) ? (
                          <Badge tone="watch">New file</Badge>
                        ) : (
                          <Badge tone="steel">
                            Yes · {r.match.fullName.split(" ")[0]} ({r.match.confidence})
                          </Badge>
                        )
                      ) : r.person ? (
                        <CrewPicker
                          compact
                          people={currentCrew}
                          value={picked[r.filename] ?? ""}
                          onChange={(id) => setPicked((m) => ({ ...m, [r.filename]: id }))}
                          emptyLabel="Pick mariner…"
                          placeholder="Type a last name…"
                        />
                      ) : (
                        <Badge>No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.warnings.length ? (
                        <ul className="space-y-0.5 text-danger">
                          {r.warnings.slice(0, 3).map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                          {r.warnings.length > 3 ? <li>+{r.warnings.length - 3} more</li> : null}
                        </ul>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            Unknown names are opened as a file automatically — not signed on. The next certificate for that name lands on the same file. If a row did not match, type a last name in Pick mariner and use Save tickets only.
          </p>
        </div>
      ) : null}
    </>
  );
}
