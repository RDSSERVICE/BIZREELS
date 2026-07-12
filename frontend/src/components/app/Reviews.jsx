import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, BadgeCheck, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reviewApi, reviewHelpfulApi } from "@/lib/api";
import { ReportButton } from "@/components/app/ReportModal";

function Stars({ value, onChange, size = "h-5 w-5", testIdPrefix }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          data-testid={testIdPrefix ? `${testIdPrefix}-${n}` : undefined}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`${size} ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ open, onOpenChange, targetType, targetId, dealId, listingId, onSaved }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await reviewApi.create({ target_type: targetType, target_id: targetId, rating, comment: comment.trim() || undefined, deal_id: dealId, listing_id: listingId });
      toast.success("Review posted");
      onOpenChange?.(false); setComment(""); setRating(5);
      onSaved?.();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Write a review</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Rating</div>
            <Stars value={rating} onChange={setRating} size="h-8 w-8" testIdPrefix="star" />
          </div>
          <Textarea data-testid="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" className="rounded-xl bg-white/5 border-white/10 min-h-24" />
          <Button data-testid="review-submit" onClick={submit} disabled={saving} className="w-full h-12 rounded-full btn-brand border-0 font-semibold">{saving ? "…" : "Post review"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewsSection({ targetType, targetId }) {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [ratingFilter, setRatingFilter] = useState(null); // 1..5 or null
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [helpfulLocal, setHelpfulLocal] = useState({}); // {reviewId: {count, marked}}

  useEffect(() => { load(); }, [targetType, targetId, sort]);
  async function load() {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        targetType === "vendor" ? reviewApi.vendorSummary(targetId) : Promise.resolve({ data: null }),
        reviewApi.list({ target_type: targetType, target_id: targetId, sort, limit: 20 }),
      ]);
      setSummary(sRes.data); setReviews(rRes.data.items || []);
    } finally { setLoading(false); }
  }

  const toggleHelpful = async (r) => {
    // Optimistic
    const key = r.id;
    const currentCount = helpfulLocal[key]?.count ?? r.helpful_count ?? 0;
    const wasMarked = helpfulLocal[key]?.marked ?? false;
    setHelpfulLocal((s) => ({ ...s, [key]: { count: currentCount + (wasMarked ? -1 : 1), marked: !wasMarked } }));
    try {
      const { data } = await reviewHelpfulApi.toggle(r.id);
      setHelpfulLocal((s) => ({ ...s, [key]: { count: data.helpful_count, marked: data.marked_helpful } }));
    } catch (err) {
      // Roll back
      setHelpfulLocal((s) => ({ ...s, [key]: { count: currentCount, marked: wasMarked } }));
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  const filtered = reviews.filter((r) => {
    if (ratingFilter && r.rating !== ratingFilter) return false;
    if (verifiedOnly && !r.is_verified_purchase) return false;
    return true;
  });

  if (loading) return <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />;
  return (
    <section data-testid="reviews-section">
      <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Reviews {summary?.total_reviews ? `(${summary.total_reviews})` : ""}</h3>
      {summary && summary.total_reviews > 0 && (
        <div className="glass rounded-2xl p-4 mb-3 flex items-center gap-4" data-testid="review-summary">
          <div>
            <div className="text-3xl font-heading font-bold">{summary.avg_rating.toFixed(1)}</div>
            <Stars value={Math.round(summary.avg_rating)} size="h-3 w-3" />
          </div>
          <div className="flex-1 text-xs text-white/60">
            {summary.verified_purchase_count} verified purchases
          </div>
        </div>
      )}
      {/* Filter chips + sort */}
      {reviews.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          {[5,4,3].map((n) => (
            <button
              key={n}
              onClick={() => setRatingFilter(ratingFilter === n ? null : n)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${
                ratingFilter === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
              data-testid={`review-filter-${n}star`}
            >
              {n} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${
              verifiedOnly ? "bg-blue-500/20 border-blue-400/40 text-blue-300" : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
            data-testid="review-filter-verified"
          >
            <BadgeCheck className="h-3 w-3" /> Verified
          </button>
          <div className="ml-auto">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="review-sort" className="h-7 w-32 rounded-full bg-white/5 border-white/10 text-xs text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="helpful">Most helpful</SelectItem>
                <SelectItem value="rating_high">Highest rated</SelectItem>
                <SelectItem value="rating_low">Lowest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-white/60 text-sm" data-testid="reviews-empty">
          {reviews.length === 0 ? "No reviews yet." : "No reviews match your filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const hc = helpfulLocal[r.id]?.count ?? r.helpful_count ?? 0;
            const marked = helpfulLocal[r.id]?.marked ?? false;
            return (
              <div key={r.id} className="glass rounded-2xl p-4" data-testid={`review-${r.id}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-xs">{(r.reviewer?.name || "?").charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{r.reviewer?.name || "Anonymous"}</div></div>
                  <Stars value={r.rating} size="h-3 w-3" />
                  {r.is_verified_purchase && <BadgeCheck className="h-4 w-4 text-blue-400" title="Verified purchase" />}
                </div>
                {r.comment && <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{r.comment}</p>}
                {r.reply && (
                  <div className="mt-3 bg-white/5 rounded-lg p-2 text-xs text-white/70">
                    <div className="font-semibold text-white/80 mb-0.5">Vendor reply</div>
                    {r.reply.text}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleHelpful(r)}
                    data-testid={`review-helpful-${r.id}`}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                      marked ? "bg-brand/20 border-brand/40 text-white" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <ThumbsUp className={`h-3 w-3 ${marked ? "fill-current" : ""}`} /> Helpful{hc ? ` (${hc})` : ""}
                  </button>
                  <ReportButton targetType="review" targetId={r.id} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
