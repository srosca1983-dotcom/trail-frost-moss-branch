import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadPdf } from "@/lib/crew/crew-list";
import { todayUtc } from "@/lib/crew/dates";
import { departmentLabel, inferDepartment } from "@/lib/crew/ratings";
import {
  departmentForSmm,
  fillExpiredSmmPack,
  personForSmmPrint,
  PRINTABLE_SMM_KINDS,
  smmLine,
  smmPackFilename,
  type PrintableSmmKind,
  type SmmPrintJob,
} from "@/lib/crew/smm-print";
import type { CrewDepartment, ParsedPerson } from "@/lib/crew/types";

export type SmmPrintItem = {
  crewId: string;
  fullName: string;
  position?: string | null;
  kinds: PrintableSmmKind[];
  person?: ParsedPerson;
};

const INITIALS_KEY = "crew-ledger-fam-initials";
const NAME_KEY = "crew-ledger-fam-officer-name";

export function SmmPrintPanel({ items, compact }: { items: SmmPrintItem[]; compact?: boolean }) {
  const [initials, setInitials] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(INITIALS_KEY) ?? "";
  });
  const [officerName, setOfficerName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(NAME_KEY) ?? "";
  });
  const [date, setDate] = useState(() => todayUtc().toISOString().slice(0, 10));
  const [dept, setDept] = useState<CrewDepartment | "">("");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [kinds, setKinds] = useState<Record<string, PrintableSmmKind[]>>({});

  const available = useMemo(() => items.filter((i) => i.kinds.length), [items]);

  function selectedKinds(id: string, fallback: PrintableSmmKind[]) {
    return kinds[id] ?? fallback;
  }

  const chosen = available.filter((i) => (compact ? true : picked[i.crewId]));
  const jobsReady = chosen.filter((i) => selectedKinds(i.crewId, i.kinds).length);
  const needsDept = jobsReady.some(
    (i) => selectedKinds(i.crewId, i.kinds).includes("fam") && !inferDepartment(i.position ?? i.person?.lastPosition),
  );

  if (!available.length) return null;

  function togglePerson(id: string) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleKind(id: string, kind: PrintableSmmKind, allowed: PrintableSmmKind[]) {
    setKinds((prev) => {
      const cur = prev[id] ?? allowed;
      const next = cur.includes(kind) ? cur.filter((k) => k !== kind) : [...cur, kind];
      return { ...prev, [id]: next.filter((k) => allowed.includes(k)) };
    });
  }

  async function print() {
    const who = initials.trim().toUpperCase();
    const name = officerName.trim();
    if (!name) {
      toast.error("Type your full name — it goes on the form as the officer.");
      return;
    }
    if (!who) {
      toast.error("Enter your initials — they go in the Fam. Officer column.");
      return;
    }
    if (!jobsReady.length) {
      toast.error(compact ? "No expired SMM on this file." : "Check the mariner and the certificate to print.");
      return;
    }
    if (needsDept && !dept) {
      toast.error("Pick Deck, Engine, or Steward for familiarization.");
      return;
    }
    try {
      localStorage.setItem(INITIALS_KEY, who);
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* ignore */
    }
    setBusy(true);
    try {
      const pack: SmmPrintJob[] = jobsReady.map((i) => ({
        person: i.person ?? personForSmmPrint({ fullName: i.fullName, position: i.position }),
        kinds: selectedKinds(i.crewId, i.kinds),
        department: departmentForSmm(i.position ?? i.person?.lastPosition, dept || "deck"),
      }));
      const bytes = await fillExpiredSmmPack({ jobs: pack, date, officerInitials: who, officerName: name });
      const one = pack.length === 1 ? jobsReady[0].fullName : "expired";
      downloadPdf(bytes, smmPackFilename(date, one));
      toast.success(`Printed ${pack.length} SMM form${pack.length === 1 ? "" : "s"}. Ticket dates stay expired until you update them.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fill the SMM forms");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl bg-paper p-4 shadow-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg tracking-tight">Print expired SMM</h2>
          <p className="mt-1 text-sm text-muted">
            Pick the person and the form. Familiarization, cyber (AP3), and internet policy only. Your name and initials are filled in. They still sign. This does not renew the ticket.
          </p>
        </div>
        <Button onClick={() => void print()} disabled={busy}>
          {busy ? "Filling…" : compact ? "Print" : "Print selected"}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="block text-xs text-muted">
          Your full name
          <Input
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            className="mt-1 w-56"
            placeholder="Christopher Kluck"
            autoComplete="name"
          />
        </label>
        <label className="block text-xs text-muted">
          Your initials
          <Input
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            className="mt-1 w-28 uppercase"
            maxLength={6}
            placeholder="CK"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs text-muted">
          Date on the form
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-44" />
        </label>
        {needsDept ? (
          <label className="block text-xs text-muted">
            Department
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as CrewDepartment | "")}
              className="mt-1 flex h-10 w-40 rounded-md border border-border bg-paper px-3 text-sm text-ink"
            >
              <option value="">Pick…</option>
              {(["deck", "engine", "steward"] as const).map((d) => (
                <option key={d} value={d}>
                  {departmentLabel(d)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <ul className="mt-3 divide-y divide-border rounded-lg bg-paper-2/60 text-sm">
        {available.map((i) => {
          const on = compact || Boolean(picked[i.crewId]);
          const sel = selectedKinds(i.crewId, i.kinds);
          return (
            <li key={i.crewId} className="px-3 py-2">
              <label className="flex items-center gap-2 font-medium">
                {compact ? null : (
                  <input type="checkbox" checked={on} onChange={() => togglePerson(i.crewId)} />
                )}
                {i.fullName}
              </label>
              <div className="mt-1 flex flex-wrap gap-3 pl-6 text-xs text-muted">
                {PRINTABLE_SMM_KINDS.filter((k) => i.kinds.includes(k)).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sel.includes(k)}
                      disabled={!on}
                      onChange={() => toggleKind(i.crewId, k, i.kinds)}
                    />
                    {smmLine(k)}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
