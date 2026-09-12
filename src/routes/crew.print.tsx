import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildGenericCrewListPdf,
  buildImoCrewListPdf,
  buildWatchBillPdf,
  crewListFilename,
  DEFAULT_IMO_HEADER,
  downloadPdf,
  flattenAboard,
  flattenWatchBill,
  type CrewListKind,
  type ImoHeader,
} from "@/lib/crew/crew-list";
import {
  buildEnoadCsv,
  buildEnoadWorkbook,
  downloadText,
  enoadFilename,
  flattenEnoad,
} from "@/lib/crew/enoad";
import { formatMdY, formatShort } from "@/lib/crew/dates";
import { matePort } from "@/lib/crew/ports";
import { getShipRoster } from "@/lib/crew/server";
import { COMPANY, COMPANY_ADDRESS, VESSEL, VESSEL_PARTICULARS } from "@/lib/crew/types";

type PrintKind = CrewListKind | "enoad";
type Search = { kind?: PrintKind };

export const Route = createFileRoute("/crew/print")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    kind: s.kind === "imo" ? "imo" : s.kind === "watch" ? "watch" : s.kind === "enoad" ? "enoad" : "generic",
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const kind: PrintKind =
    search.kind === "imo" ? "imo" : search.kind === "watch" ? "watch" : search.kind === "enoad" ? "enoad" : "generic";
  const ship = useQuery({ queryKey: ["ship-roster"], queryFn: () => getShipRoster() });
  const rows = useMemo(() => flattenAboard(ship.data?.slots ?? []), [ship.data]);
  const enoadRows = useMemo(() => flattenEnoad(ship.data?.slots ?? []), [ship.data]);
  const watches = useMemo(() => flattenWatchBill(ship.data?.slots ?? []), [ship.data]);
  const [header, setHeader] = useState<ImoHeader>(() => {
    if (typeof window === "undefined") return DEFAULT_IMO_HEADER;
    try {
      const raw = localStorage.getItem("crew-ledger-imo-header");
      if (raw) return { ...DEFAULT_IMO_HEADER, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return DEFAULT_IMO_HEADER;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const run = ship.data?.run;
    if (!run) return;
    setHeader((h) => {
      if (h.port && h.lastPort) return h;
      const next = {
        ...h,
        port: h.port || run.thisPort,
        lastPort: h.lastPort || matePort(run.thisPort),
        nextPort: h.nextPort || run.nextPort,
        voyageNumber: h.voyageNumber || run.voyageNumber || "",
        date: h.date || run.eta || DEFAULT_IMO_HEADER.date,
      };
      try {
        localStorage.setItem("crew-ledger-imo-header", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [ship.data?.run]);

  function persist(next: ImoHeader) {
    setHeader(next);
    try {
      localStorage.setItem("crew-ledger-imo-header", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function download(format: "pdf" | "xls" | "csv" = "pdf") {
    setBusy(true);
    try {
      if (kind === "enoad") {
        if (format === "csv") {
          downloadText(buildEnoadCsv(enoadRows), enoadFilename("csv", header.date), "text/csv;charset=utf-8");
        } else {
          downloadText(
            buildEnoadWorkbook(enoadRows, header),
            enoadFilename("xls", header.date),
            "application/vnd.ms-excel",
          );
        }
        toast.success(format === "csv" ? "CSV saved." : "Excel saved. Crew sheet is what the Master pastes into eNOAD.");
        return;
      }
      const bytes =
        kind === "imo"
          ? await buildImoCrewListPdf(rows, header)
          : kind === "watch"
            ? await buildWatchBillPdf(watches, header.date)
            : await buildGenericCrewListPdf(rows, header.date);
      downloadPdf(bytes, crewListFilename(kind, header.date));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the file");
    } finally {
      setBusy(false);
    }
  }

  const enoadMissing = enoadRows.filter((r) => r.missing.length);
  const listMissing = rows.filter((r) => r.missing.length);
  const issued = formatMdY(header.date) || formatShort(header.date);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="no-print mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/crew" className="inline-flex items-center gap-1 text-sm text-steel-2 hover:underline">
            <ArrowLeft className="size-4" /> Roster
          </Link>
          <h1 className="mt-1 font-display text-2xl tracking-tight">
            {kind === "imo"
              ? "IMO crew list (FAL Form 5)"
              : kind === "watch"
                ? "Watch bill"
                : kind === "enoad"
                  ? "eNOAD crew list"
                  : "Crew list"}
          </h1>
          <p className="text-sm text-muted">
            {kind === "imo"
              ? "For a Nantong / China call. Fill the voyage header, then print or download. Long Beach and Honolulu use the generic list and eNOAD."
              : kind === "watch"
                ? "One page for the wheelhouse and the mess. 12–4, 4–8, 8–12, and day workers."
                : kind === "enoad"
                  ? "Excel for the Master to paste into eNOAD. Not a full Notice of Arrival — voyage, last five ports, and cargo stay on his last notice."
                  : "Generic list with date of birth. Print or download a PDF."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={kind === "generic" ? "default" : "outline"} asChild>
            <Link to="/crew/print" search={{ kind: "generic" }}>
              Generic
            </Link>
          </Button>
          <Button variant={kind === "imo" ? "default" : "outline"} asChild>
            <Link to="/crew/print" search={{ kind: "imo" }}>
              IMO FAL 5
            </Link>
          </Button>
          <Button variant={kind === "watch" ? "default" : "outline"} asChild>
            <Link to="/crew/print" search={{ kind: "watch" }}>
              Watch bill
            </Link>
          </Button>
          <Button variant={kind === "enoad" ? "default" : "outline"} asChild>
            <Link to="/crew/print" search={{ kind: "enoad" }}>
              eNOAD
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
          {kind === "enoad" ? (
            <>
              <Button disabled={busy || !enoadRows.length} onClick={() => void download("xls")}>
                <Download className="size-4" /> {busy ? "Building…" : "Download Excel"}
              </Button>
              <Button variant="outline" disabled={busy || !enoadRows.length} onClick={() => void download("csv")}>
                CSV
              </Button>
            </>
          ) : (
            <Button
              disabled={busy || (kind === "watch" ? !watches.some((g) => g.rows.length) : !rows.length)}
              onClick={() => void download("pdf")}
            >
              <Download className="size-4" /> {busy ? "Building…" : "Download PDF"}
            </Button>
          )}
        </div>
      </div>

      {kind === "imo" || kind === "enoad" ? (
        <form
          className="no-print mx-auto mb-4 grid max-w-6xl gap-3 rounded-xl bg-paper-2 p-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="text-xs">
            <span className="text-muted">Port of arrival / departure</span>
            <Input className="mt-1" value={header.port} onChange={(e) => persist({ ...header, port: e.target.value })} />
          </label>
          <label className="text-xs">
            <span className="text-muted">Date</span>
            <Input type="date" className="mt-1" value={header.date} onChange={(e) => persist({ ...header, date: e.target.value })} />
          </label>
          {kind === "imo" ? (
            <>
              <label className="text-xs">
                <span className="text-muted">Voyage number</span>
                <Input className="mt-1" value={header.voyageNumber} onChange={(e) => persist({ ...header, voyageNumber: e.target.value })} />
              </label>
              <label className="text-xs">
                <span className="text-muted">Last port of call</span>
                <Input className="mt-1" value={header.lastPort} onChange={(e) => persist({ ...header, lastPort: e.target.value })} />
              </label>
            </>
          ) : (
            <p className="self-end text-xs text-muted sm:col-span-2">
              Port and date go on the Read me sheet so the Master has them. They do not file this file as the notice.
            </p>
          )}
          <fieldset className="flex items-end gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.arrival}
                onChange={(e) => persist({ ...header, arrival: e.target.checked })}
              />
              Arrival
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.departure}
                onChange={(e) => persist({ ...header, departure: e.target.checked })}
              />
              Departure
            </label>
          </fieldset>
        </form>
      ) : (
        <div className="no-print mx-auto mb-4 flex max-w-6xl items-end gap-3 px-4">
          <label className="text-xs">
            <span className="text-muted">Date on the list</span>
            <Input type="date" className="mt-1 w-44" value={header.date} onChange={(e) => persist({ ...header, date: e.target.value })} />
          </label>
        </div>
      )}

      {kind === "enoad" && enoadMissing.length ? (
        <div className="no-print mx-auto mb-3 max-w-6xl px-4">
          <p className="text-sm text-warn">
            {enoadMissing.length} {enoadMissing.length === 1 ? "name is" : "names are"} short of 33 CFR 160.206. Fill the
            file before the Master pastes into eNOAD.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {enoadMissing.map((r) => (
              <li key={r.crewId}>
                <Link to="/crew/$crewId" params={{ crewId: r.crewId }} className="font-medium hover:underline">
                  {r.lastName}, {r.firstName}
                </Link>
                <span className="text-muted"> — {r.missing.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : kind !== "watch" && kind !== "enoad" && listMissing.length ? (
        <p className="no-print mx-auto mb-3 max-w-6xl px-4 text-sm text-warn">
          {listMissing.length} {listMissing.length === 1 ? "name is" : "names are"} missing DOB, place of birth, or an ID.
          Blanks print so they can be filled by hand.
        </p>
      ) : null}

      <article className="print-sheet mx-auto max-w-6xl bg-paper px-4 pb-10 sm:px-6">
        {kind === "imo" ? (
          <ImoSheet rows={rows} header={header} loading={!ship.data} />
        ) : kind === "watch" ? (
          <WatchSheet groups={watches} issued={issued} loading={!ship.data} />
        ) : kind === "enoad" ? (
          <EnoadSheet rows={enoadRows} header={header} loading={!ship.data} />
        ) : (
          <GenericSheet rows={rows} issued={issued} loading={!ship.data} />
        )}
      </article>
      {kind === "watch" ? (
        <style>{`@media print { @page { size: landscape; } }`}</style>
      ) : null}
    </div>
  );
}

function WatchSheet({
  groups,
  issued,
  loading,
}: {
  groups: ReturnType<typeof flattenWatchBill>;
  issued: string;
  loading: boolean;
}) {
  return (
    <div className="text-ink">
      <header className="border-b border-ink pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-sage">{COMPANY}</p>
        <h2 className="font-display text-3xl tracking-tight">Watch bill</h2>
        <p className="mt-1 text-sm">
          {VESSEL} · IMO {VESSEL_PARTICULARS.imo} · {issued}
        </p>
        <p className="text-sm text-muted">Wheelhouse and mess. Watch follows the job.</p>
      </header>
      {loading ? (
        <p className="py-8 text-sm text-muted">Loading articles…</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {groups.map((g) => (
            <section key={g.watch} className="rounded-xl bg-paper-2 p-3 print:rounded-none print:border print:border-ink print:bg-paper">
              <h3 className="font-display text-2xl tracking-tight">{g.label}</h3>
              <p className="text-[11px] uppercase tracking-wider text-sage">
                {g.rows.filter((r) => !r.vacant).length} on watch
              </p>
              <ul className="mt-3 space-y-3">
                {g.rows.map((r) => (
                  <li key={`${r.code}-${r.name}`}>
                    <div className="text-[11px] uppercase tracking-wider text-sage">{r.title}</div>
                    <div className={r.vacant ? "text-sm text-muted" : "font-medium"}>{r.name}</div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GenericSheet({
  rows,
  issued,
  loading,
}: {
  rows: ReturnType<typeof flattenAboard>;
  issued: string;
  loading: boolean;
}) {
  return (
    <div className="text-ink">
      <header className="border-b border-ink pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-sage">{COMPANY}</p>
        <h2 className="font-display text-3xl tracking-tight">Crew list</h2>
        <p className="mt-1 text-sm">
          {VESSEL} · IMO {VESSEL_PARTICULARS.imo} · Call sign {VESSEL_PARTICULARS.callSign} · Flag {VESSEL_PARTICULARS.flagCode}
        </p>
        <p className="text-sm text-muted">
          {COMPANY_ADDRESS} · Port of registry {VESSEL_PARTICULARS.portOfRegistry} · {issued} · {rows.length} souls on board
        </p>
      </header>
      {loading ? (
        <p className="py-8 text-sm text-muted">Loading articles…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 md:hidden print:hidden">
            {rows.map((r) => (
              <li key={r.crewId} className="rounded-lg bg-paper-2 px-3 py-2 text-sm">
                <div className="font-medium">{r.fullName}</div>
                <div className="text-xs text-muted">
                  {r.rank} · DOB {formatMdY(r.dob) || "needs date"} · {r.nationality}
                  {r.idNumber ? ` · ${r.idNature} ${r.idNumber}` : ""}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto md:block print:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink text-[10px] uppercase tracking-wider">
                <th className="py-2 pr-2">No.</th>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Rank / rating</th>
                <th className="py-2 pr-2">Nat.</th>
                <th className="py-2 pr-2">Date of birth</th>
                <th className="py-2 pr-2">Place of birth</th>
                <th className="py-2 pr-2">Sex</th>
                <th className="py-2">Passport / MMC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.crewId} className="border-b border-border">
                  <td className="py-1.5 pr-2 font-mono">{r.no}</td>
                  <td className="py-1.5 pr-2 font-medium">{r.fullName}</td>
                  <td className="py-1.5 pr-2">{r.rank}</td>
                  <td className="py-1.5 pr-2">{r.nationality}</td>
                  <td className="py-1.5 pr-2">{formatMdY(r.dob) || " "}</td>
                  <td className="py-1.5 pr-2">{r.placeOfBirth || " "}</td>
                  <td className="py-1.5 pr-2">{r.gender}</td>
                  <td className="py-1.5">{r.idNumber ? `${r.idNature} ${r.idNumber}` : " "}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <footer className="mt-10 grid gap-8 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Master / authorized officer</p>
          <div className="mt-8 border-b border-ink" />
        </div>
        <div>
          <p className="text-xs text-muted">Date</p>
          <div className="mt-8 border-b border-ink" />
        </div>
      </footer>
    </div>
  );
}

function ImoSheet({
  rows,
  header,
  loading,
}: {
  rows: ReturnType<typeof flattenAboard>;
  header: ImoHeader;
  loading: boolean;
}) {
  return (
    <div className="text-ink">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink pb-2">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Crew list</h2>
          <p className="text-sm text-muted">(IMO FAL Form 5)</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span>{header.arrival ? "☑" : "☐"} Arrival</span>
          <span>{header.departure ? "☑" : "☐"} Departure</span>
        </div>
      </header>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <div>1.1 Name of ship · {VESSEL_PARTICULARS.displayName}</div>
        <div>1.3 Call sign · {VESSEL_PARTICULARS.callSign}</div>
        <div>1.2 IMO number · {VESSEL_PARTICULARS.imo}</div>
        <div>1.4 Voyage number · {header.voyageNumber || "—"}</div>
        <div>2. Port of arrival/departure · {header.port || "—"}</div>
        <div>4. Flag State of ship · {VESSEL_PARTICULARS.flag}</div>
        <div>3. Date of arrival/departure · {formatMdY(header.date) || "—"}</div>
        <div>5. Last port of call · {header.lastPort || "—"}</div>
      </dl>
      {loading ? (
        <p className="py-8 text-sm text-muted">Loading articles…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 md:hidden print:hidden">
            {rows.map((r) => (
              <li key={r.crewId} className="rounded-lg bg-paper-2 px-3 py-2 text-sm">
                <div className="font-medium">
                  {r.no}. {r.familyName}, {r.givenNames}
                </div>
                <div className="text-xs text-muted">
                  {r.rank} · {r.nationality} · DOB {formatMdY(r.dob) || "needs date"} · {r.placeOfBirth || "POB —"}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto md:block print:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-ink">
                <th className="py-2 pr-1">6. No.</th>
                <th className="py-2 pr-1">7. Family name</th>
                <th className="py-2 pr-1">8. Given names</th>
                <th className="py-2 pr-1">9. Rank or rating</th>
                <th className="py-2 pr-1">10. Nationality</th>
                <th className="py-2 pr-1">11. Date of birth</th>
                <th className="py-2 pr-1">12. Place of birth</th>
                <th className="py-2 pr-1">13. Gender</th>
                <th className="py-2 pr-1">14. Nature of ID</th>
                <th className="py-2 pr-1">15. Number of ID</th>
                <th className="py-2 pr-1">16. Issuing State</th>
                <th className="py-2">17. Expiry of ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.crewId} className="border-b border-border">
                  <td className="py-1 pr-1 font-mono">{r.no}</td>
                  <td className="py-1 pr-1 font-medium">{r.familyName}</td>
                  <td className="py-1 pr-1">{r.givenNames}</td>
                  <td className="py-1 pr-1">{r.rank}</td>
                  <td className="py-1 pr-1">{r.nationality}</td>
                  <td className="py-1 pr-1">{formatMdY(r.dob) || " "}</td>
                  <td className="py-1 pr-1">{r.placeOfBirth || " "}</td>
                  <td className="py-1 pr-1">{r.gender}</td>
                  <td className="py-1 pr-1">{r.idNature}</td>
                  <td className="py-1 pr-1">{r.idNumber}</td>
                  <td className="py-1 pr-1">{r.idIssuing}</td>
                  <td className="py-1">{formatMdY(r.idExpiry) || " "}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <p className="mt-10 text-xs text-muted">18. Date and signature by master, authorized agent or officer</p>
      <div className="mt-8 max-w-sm border-b border-ink" />
    </div>
  );
}

function EnoadSheet({
  rows,
  header,
  loading,
}: {
  rows: ReturnType<typeof flattenEnoad>;
  header: ImoHeader;
  loading: boolean;
}) {
  const notice = header.arrival && header.departure ? "Arrival and departure" : header.departure ? "Departure" : "Arrival";
  return (
    <div className="text-ink">
      <header className="border-b border-ink pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-sage">{COMPANY}</p>
        <h2 className="font-display text-3xl tracking-tight">eNOAD crew list</h2>
        <p className="mt-1 text-sm">
          {VESSEL} · IMO {VESSEL_PARTICULARS.imo} · Call sign {VESSEL_PARTICULARS.callSign} · Flag {VESSEL_PARTICULARS.flagCode}
        </p>
        <p className="text-sm text-muted">
          {notice}
          {header.port ? ` · ${header.port}` : ""}
          {header.date ? ` · ${formatMdY(header.date) || header.date}` : ""} · {rows.length} souls on board · 33 CFR
          160.206
        </p>
      </header>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Master or agent copies the last accepted notice in eNOAD and updates the voyage.</li>
        <li>On Crew List, enter these names. Sex is Male or Female. Debark stays blank until the US port is known.</li>
        <li>Do not email this spreadsheet to NVMC. They only take the official workbook or XML of a complete notice.</li>
      </ol>
      {loading ? (
        <p className="py-8 text-sm text-muted">Loading articles…</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 md:hidden print:hidden">
            {rows.map((r) => (
              <li key={r.crewId} className="rounded-lg bg-paper-2 px-3 py-2 text-sm">
                <div className="font-medium">
                  {r.no}. {r.lastName}, {r.firstName} {r.middleName}
                </div>
                <div className="text-xs text-muted">
                  {r.position} · {r.nationality} · DOB {r.dobUs || "needs date"} · {r.sex || "sex —"}
                  {r.idNumber ? ` · ${r.idType} ${r.idNumber}` : " · no ID"}
                  {r.embarkPort ? ` · joined ${r.embarkPort}` : " · embark —"}
                </div>
                {r.missing.length ? <div className="mt-1 text-xs text-warn">{r.missing.join(", ")}</div> : null}
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto md:block print:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-ink text-[10px] uppercase tracking-wider">
                  <th className="py-2 pr-1">No.</th>
                  <th className="py-2 pr-1">Last</th>
                  <th className="py-2 pr-1">First</th>
                  <th className="py-2 pr-1">Middle</th>
                  <th className="py-2 pr-1">Position</th>
                  <th className="py-2 pr-1">Nat.</th>
                  <th className="py-2 pr-1">DOB</th>
                  <th className="py-2 pr-1">Sex</th>
                  <th className="py-2 pr-1">ID type</th>
                  <th className="py-2 pr-1">ID number</th>
                  <th className="py-2 pr-1">ID exp.</th>
                  <th className="py-2 pr-1">Embarked</th>
                  <th className="py-2">Missing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.crewId} className="border-b border-border">
                    <td className="py-1 pr-1 font-mono">{r.no}</td>
                    <td className="py-1 pr-1 font-medium">{r.lastName}</td>
                    <td className="py-1 pr-1">{r.firstName}</td>
                    <td className="py-1 pr-1">{r.middleName}</td>
                    <td className="py-1 pr-1">{r.position}</td>
                    <td className="py-1 pr-1">{r.nationalityCode}</td>
                    <td className="py-1 pr-1">{r.dobUs || " "}</td>
                    <td className="py-1 pr-1">{r.sex || " "}</td>
                    <td className="py-1 pr-1">{r.idType}</td>
                    <td className="py-1 pr-1">{r.idNumber}</td>
                    <td className="py-1 pr-1">{r.idExpiryUs || " "}</td>
                    <td className="py-1 pr-1">{r.embarkPort || " "}</td>
                    <td className="py-1 text-warn">{r.missing.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
