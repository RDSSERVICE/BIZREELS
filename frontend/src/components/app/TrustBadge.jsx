import { Shield } from "lucide-react";

/** Small trust score chip. Displays score + tier color. */
export default function TrustBadge({ score, tier, size = "sm", testId }) {
  if (score === null || score === undefined) return null;
  const s = Number(score);
  const tone =
    tier === "elite" ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/40" :
    tier === "top-rated" ? "bg-green-500/20 text-green-300 border-green-500/40" :
    tier === "trusted" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" :
    "bg-white/10 text-white/70 border-white/20";
  const sizeCls = size === "xs" ? "h-5 px-1.5 text-[9px]" : "h-6 px-2 text-[10px]";
  return (
    <span
      data-testid={testId || "trust-badge"}
      className={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wider ${sizeCls} ${tone}`}
      title={tier ? `${tier} · ${s}/100` : `${s}/100`}
    >
      <Shield className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {s}
    </span>
  );
}
