import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Eye, MessageCircle, Handshake, CheckCircle, Share2, ArrowRight, TrendingUp } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { analyticsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import FastRespondersPanel from "@/components/app/FastRespondersPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function Kpi({ label, value, icon: Icon, testId, hint }) {
  return (
    <div className="glass rounded-2xl p-3" data-testid={testId}>
      <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase tracking-wider font-semibold">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 font-heading text-xl font-bold">{value}</div>
      {hint && <div className="text-[10px] text-white/50 mt-0.5">{hint}</div>}
    </div>
  );
}

// Simple bar chart from an array of {date, value}
function MiniBars({ items, testId }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end gap-1 h-24" data-testid={testId}>
      {items.map((it) => (
        <div key={it.date} className="flex-1 flex flex-col items-center justify-end">
          <div
            className="w-full rounded-t bg-gradient-brand"
            style={{ height: `${(it.value / max) * 100}%`, minHeight: it.value ? 2 : 0 }}
            title={`${it.date}: ${it.value}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function VendorAnalytics() {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [ov, setOv] = useState(null);
  const [ts, setTs] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.roles?.includes("vendor") && !user?.roles?.includes("admin")) return;
    setLoading(true);
    Promise.all([
      analyticsApi.overview(range),
      range !== "all" ? analyticsApi.timeseries(range, "views") : Promise.resolve({ data: { items: [] } }),
      analyticsApi.listings({ range, sort: "views", limit: 5 }),
    ]).then(([o, t, l]) => {
      setOv(o.data); setTs(t.data.items || []); setTop(l.data.items || []);
    }).finally(() => setLoading(false));
  }, [range, user?.id]);

  if (user && !user.roles?.includes("vendor") && !user.roles?.includes("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="Analytics" subtitle="Your vendor insights" />
      <div className="px-4 sm:px-6 lg:px-8 pb-2">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger data-testid="analytics-range" className="h-10 rounded-full bg-white/5 border-white/10 text-white w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-white/10 text-white">
            {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-4 mt-2">
        {loading || !ov ? (
          <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Kpi label="Views" value={ov.kpis.views.toLocaleString()} icon={Eye} testId="kpi-views" />
              <Kpi label="Chats" value={ov.kpis.chats_started.toLocaleString()} icon={MessageCircle} testId="kpi-chats" hint={`${ov.kpis.unique_chatters} unique`} />
              <Kpi label="Leads" value={ov.kpis.leads.toLocaleString()} icon={TrendingUp} testId="kpi-leads" hint={`${ov.kpis.watchers} watchers`} />
              <Kpi label="Deals" value={ov.deals_total.toLocaleString()} icon={Handshake} testId="kpi-deals" hint={`${ov.kpis.deals_completed} completed`} />
              <Kpi label="WA clicks" value={ov.kpis.wa_clicks.toLocaleString()} icon={Share2} testId="kpi-wa" />
              <Kpi label="Rating" value={ov.reviews.avg_rating.toFixed(1)} icon={CheckCircle} testId="kpi-rating" hint={`${ov.reviews.count} reviews`} />
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Conversion</div>
              <div className="grid grid-cols-3 text-center gap-2">
                <div>
                  <div className="text-lg font-heading font-bold" data-testid="conv-view-chat">{ov.conversion.view_to_chat_pct}%</div>
                  <div className="text-[10px] text-white/60">View → Chat</div>
                </div>
                <div>
                  <div className="text-lg font-heading font-bold" data-testid="conv-chat-deal">{ov.conversion.chat_to_deal_pct}%</div>
                  <div className="text-[10px] text-white/60">Chat → Deal</div>
                </div>
                <div>
                  <div className="text-lg font-heading font-bold" data-testid="conv-deal-done">{ov.conversion.deal_to_complete_pct}%</div>
                  <div className="text-[10px] text-white/60">Deal → Done</div>
                </div>
              </div>
            </div>

            {ts.length > 0 && (
              <div className="glass rounded-2xl p-4">
                <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Views (daily)</div>
                {ts.every((b) => b.value === 0) ? (
                  <div className="h-24 flex items-center justify-center text-white/50 text-xs" data-testid="timeseries-empty">
                    No traffic yet in the last {range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}. Boost a listing to get views flowing.
                  </div>
                ) : (
                  <MiniBars items={ts} testId="analytics-timeseries" />
                )}
              </div>
            )}

            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Top listings</div>
              {top.length === 0 ? (
                <div className="text-white/60 text-sm py-3 text-center" data-testid="top-listings-empty">No activity yet.</div>
              ) : (
                <div className="space-y-2">
                  {top.map((li) => (
                    <Link
                      key={li.listing_id}
                      to={`/listing/${li.slug || li.listing_id}`}
                      data-testid={`top-listing-${li.listing_id}`}
                      className="block rounded-xl hover:bg-white/5 p-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{li.title || "(untitled)"}</div>
                          <div className="text-[10px] text-white/60">
                            {li.views} views · {li.chats} chats · {li.deals} deals · {li.saves} saves
                          </div>
                        </div>
                        {li.boost_expires_at && new Date(li.boost_expires_at) > new Date() && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300">
                            SPONSORED
                          </span>
                        )}
                        <ArrowRight className="h-3 w-3 text-white/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {loading || !ov ? (
              <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ) : (
              <>
                <FastRespondersPanel city={ov.city || null} limit={5} />
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
