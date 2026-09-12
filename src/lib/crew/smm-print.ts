import { PDFDocument } from "pdf-lib";
import { expiryTone } from "./dates.ts";
import { fillSignOnPacket, loadPacketTemplate } from "./fill-packet.ts";
import { emptyPerson } from "./merge.ts";
import { fillNameParts } from "./parse-fields.ts";
import { inferDepartment } from "./ratings.ts";
import type { PacketPageKey } from "./sign-on-set.ts";
import type { CrewDepartment, ParsedPerson } from "./types.ts";

/** Company SMM appendices we can fill and print. SOCP SASH is a course cert, not this packet. */
export const PRINTABLE_SMM_KINDS = ["fam", "cyber", "internet"] as const;
export type PrintableSmmKind = (typeof PRINTABLE_SMM_KINDS)[number];

export const PRINTABLE_SMM: Record<
  PrintableSmmKind,
  { page: PacketPageKey; label: string; code: string; short: string }
> = {
  fam: { page: "fam", label: "Familiarization", code: "SMM-PER-05-AP1", short: "Familiarization" },
  cyber: { page: "cyber", label: "Cyber security training", code: "SMM-SMM-08-AP3", short: "M1 Aware" },
  internet: { page: "internet", label: "Internet usage policy", code: "SMM-SMM-08-AP4", short: "Internet" },
};

export function isPrintableSmm(kind: string): kind is PrintableSmmKind {
  return (PRINTABLE_SMM_KINDS as readonly string[]).includes(kind);
}

export function expiredPrintableSmm(
  certs:
    | Partial<Record<string, { tone?: string; required?: boolean; expires?: string | null }>>
    | Array<{ docType: string; expiresOn?: string | null }>,
): PrintableSmmKind[] {
  if (Array.isArray(certs)) {
    return PRINTABLE_SMM_KINDS.filter((k) =>
      certs.some((d) => d.docType === k && expiryTone(d.expiresOn ?? null) === "expired"),
    );
  }
  return PRINTABLE_SMM_KINDS.filter((k) => {
    const cell = certs[k];
    if (!cell) return false;
    if (cell.required === false) return false;
    return cell.tone === "expired";
  });
}

export function personForSmmPrint(opts: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
}): ParsedPerson {
  const p = emptyPerson();
  p.fullName = opts.fullName;
  p.firstName = opts.firstName ?? null;
  p.lastName = opts.lastName ?? null;
  p.lastPosition = opts.position ?? null;
  return fillNameParts(p);
}

export type SmmPrintJob = {
  person: ParsedPerson;
  kinds: PrintableSmmKind[];
  department: CrewDepartment;
};

export function departmentForSmm(position: string | null | undefined, fallback: CrewDepartment = "deck"): CrewDepartment {
  return inferDepartment(position) ?? fallback;
}

export async function fillExpiredSmmPack(
  input: {
    jobs: SmmPrintJob[];
    date: string;
    officerInitials: string;
    officerName?: string | null;
  },
  template?: ArrayBuffer,
): Promise<Uint8Array> {
  const initials = input.officerInitials.trim().toUpperCase();
  if (!initials) throw new Error("Enter your initials for the Fam. Officer column.");
  if (!input.officerName?.trim()) throw new Error("Enter your full name — it goes on the form as the officer.");
  if (!input.jobs.length) throw new Error("Pick a mariner and a certificate to print.");
  const blank = template ?? (await loadPacketTemplate());
  const out = await PDFDocument.create();
  for (const job of input.jobs) {
    if (!job.kinds.length) continue;
    const bytes = await fillSignOnPacket(
      {
        person: job.person,
        startDate: input.date,
        officerInitials: initials,
        officerName: input.officerName.trim(),
        department: job.department,
        include: job.kinds.map((k) => PRINTABLE_SMM[k].page),
      },
      blank,
    );
    const src = await PDFDocument.load(bytes);
    const copied = await out.copyPages(src, src.getPageIndices());
    for (const page of copied) out.addPage(page);
  }
  if (out.getPageCount() === 0) throw new Error("No expired SMM forms to print.");
  return out.save({ updateFieldAppearances: false });
}

export function smmPackFilename(date: string, oneName?: string | null) {
  const who = (oneName ?? "expired").replace(/[^A-Za-z0-9]+/g, "");
  return `George-II-SMM-${who}-${date}.pdf`;
}

export function smmLine(kind: PrintableSmmKind) {
  return `${PRINTABLE_SMM[kind].short} · ${PRINTABLE_SMM[kind].code}`;
}
