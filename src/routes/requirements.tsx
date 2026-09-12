import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Desk } from "@/components/desk";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSmsSync, listRequirements, syncSmsRequirements } from "@/lib/crew/server";
import { SMS_CREWING_URL, SMS_URL } from "@/lib/crew/types";

export const Route = createFileRoute("/requirements")({ component: Page });

function Page() {
  return (
    <Desk>
      <Reqs />
    </Desk>
  );
}

function Reqs() {
  const reqs = useQuery({ queryKey: ["requirements"], queryFn: () => listRequirements() });
  const sms = useQuery({ queryKey: ["sms-sync"], queryFn: () => getSmsSync() });
  const sync = useMutation({
    mutationFn: () => syncSmsRequirements(),
    onSuccess: (r) => {
      toast.success(r.status.startsWith("ok") ? "Pulled the crewing book" : `SMS responded: ${r.status}`);
      void sms.refetch();
    },
    onError: () => toast.error("Could not reach the SMS app"),
  });

  return (
    <>
      <PageHeader
        kicker="SMS · Crewing"
        title="Newest sign-on requirements."
        description="This list is the SRO packet plus SMM-PER from the Safety Management crewing book. Sync pulls the live compiled copy."
        actions={
          <>
            <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
              {sync.isPending ? "Syncing…" : "Sync from SMS"}
            </Button>
            <Button variant="outline" asChild>
              <a href={SMS_CREWING_URL} target="_blank" rel="noreferrer">
                Open crewing book
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </>
        }
      />

      <div className="mb-6 rounded-xl bg-ink p-5 text-paper sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-sage">Controlled copy</p>
        <p className="mt-2 text-sm text-paper/80">
          SMS app:{" "}
          <a href={SMS_URL} className="underline" target="_blank" rel="noreferrer">
            g2sms.grok.me
          </a>
          . Last sync {sms.data?.lastSyncedAt ? String(sms.data.lastSyncedAt).slice(0, 16) : "never"} · status{" "}
          {sms.data?.status ?? "not yet"}.
        </p>
        {sms.data?.procedures?.length ? (
          <ul className="mt-3 space-y-1 font-mono text-xs text-paper/70">
            {sms.data.procedures.map((p) => (
              <li key={p.id}>
                {p.id} coded Rev {p.codedRev}
                {p.liveRev ? ` · live Rev ${p.liveRev}${p.match === false ? " — drifted" : ""}` : " · live rev not in the HTML shell"}
              </li>
            ))}
          </ul>
        ) : null}
        {sms.data?.found?.length ? (
          <p className="mt-2 font-mono text-xs text-paper/70">IDs seen: {sms.data.found.slice(0, 12).join(" · ")}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl shadow-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-2 text-[11px] uppercase tracking-wider text-sage">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Applies</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(reqs.data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.label}</div>
                  {r.notes ? <div className="text-xs text-muted">{r.notes}</div> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.kind === "certificate" ? "steel" : "neutral"}>{r.kind}</Badge>
                </td>
                <td className="px-4 py-3 text-xs capitalize text-muted">{r.appliesTo.replace("_", " ")}</td>
                <td className="px-4 py-3 text-xs uppercase text-sage">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
