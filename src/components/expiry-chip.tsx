import { expiryLabel, expiryTone } from "@/lib/crew/dates";
import { Badge } from "@/components/ui/badge";

export function ExpiryChip({ date }: { date: string | null | undefined }) {
  const tone = expiryTone(date);
  const badgeTone =
    tone === "expired" ? "expired" : tone === "soon" ? "soon" : tone === "watch" ? "watch" : tone === "ok" ? "ok" : "neutral";
  return <Badge tone={badgeTone}>{expiryLabel(date)}</Badge>;
}
