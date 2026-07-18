/**
 * Admin Console — Phase 7f admin panel expansion.
 *
 * A single tabbed console at /admin/console that surfaces the 4 new admin
 * lists (transactions, orders, commissions, audit log). Ships with sane
 * defaults + minimal filtering; each list uses the new /api/v1/admin/*
 * endpoints via RTK Query. Full-page dedicated views (/admin/transactions,
 * etc.) can be split out later — for the first drop, one console keeps
 * navigation lean.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download, IndianRupee, ScrollText, ShoppingBag, Wallet, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API_CONFIG from "@/config";
import {
  useListAdminTransactionsQuery,
  useListAdminOrdersQuery,
  useListAdminCommissionsQuery,
  useGetCommissionSummaryQuery,
  useListAdminAuditLogQuery,
  useSetGlobalCommissionRateMutation,
  useMarkCommissionPaidMutation,
} from "@/features/admin/adminApi";

const TABS = [
  { key: "transactions", label: "Transactions", icon: Wallet },
  { key: "orders",       label: "Orders",       icon: ShoppingBag },
  { key: "commissions",  label: "Commissions",  icon: IndianRupee },
  { key: "audit",        label: "Audit Log",    icon: ScrollText },
];

// Each tab's data comes from its own RTK Query hook. Only the active tab's
// query is ever "hot" thanks to `skip`, so switching tabs doesn't fire every
// endpoint — but results stay cached, so flipping back to a previously
// visited tab is instant.
function useTabData(tab) {
  const txs = useListAdminTransactionsQuery({ limit: 50 }, { skip: tab !== "transactions" });
  const orders = useListAdminOrdersQuery({ limit: 50 }, { skip: tab !== "orders" });
  const commissions = useListAdminCommissionsQuery({ limit: 50 }, { skip: tab !== "commissions" });
  const summary = useGetCommissionSummaryQuery(undefined, { skip: tab !== "commissions" });
  const audit = useListAdminAuditLogQuery({ limit: 50 }, { skip: tab !== "audit" });

  const byTab = {
    transactions: { data: txs.data, isFetching: txs.isFetching, refetch: txs.refetch },
    orders: { data: orders.data, isFetching: orders.isFetching, refetch: orders.refetch },
    commissions: { data: commissions.data, isFetching: commissions.isFetching, refetch: () => { commissions.refetch(); summary.refetch(); } },
    audit: { data: audit.data, isFetching: audit.isFetching, refetch: audit.refetch },
  };

  return {
    items: byTab[tab]?.data?.items || [],
    loading: byTab[tab]?.isFetching || false,
    meta: tab === "commissions" ? summary.data : null,
    reload: byTab[tab]?.refetch || (() => {}),
  };
}

export default function AdminConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("transactions");
  const { items, loading, meta, reload } = useTabData(tab);
  const [rate, setRate] = useState("");

  const [setGlobalCommissionRate] = useSetGlobalCommissionRateMutation();
  const [markCommissionPaid] = useMarkCommissionPaidMutation();

  const setGlobalRate = async () => {
    const r = parseFloat(rate);
    if (!(r >= 0 && r <= 1)) return toast.error("Enter a rate between 0 and 1 (e.g. 0.05)");
    try {
      const data = await setGlobalCommissionRate(r).unwrap();
      toast.success(`Global commission rate set to ${(data.global_rate * 100).toFixed(1)}%`);
      setRate("");
    } catch (e) { toast.error(e?.data?.message || e?.data?.detail || "Failed"); }
  };

  const markPaid = async (id) => {
    try { await markCommissionPaid(id).unwrap(); toast.success("Marked paid"); }
    catch (e) { toast.error(e?.data?.message || e?.data?.detail || "Failed"); }
  };

  const downloadCsv = () => {
    const url = `${API_CONFIG.BASE_URL}/admin/transactions.csv`;
    const win = window.open(url, "_blank"); if (!win) toast.error("Popup blocked");
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <button onClick={() => navigate("/admin/dashboard")} data-testid="console-back" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
      <ScreenHeader title="Admin Console" subtitle="Transactions · orders · commissions · audit log" />

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 sticky top-0 bg-neutral-950/90 backdrop-blur z-10 pt-1 pb-2 border-b border-white/5">
        <div className="flex gap-1 overflow-x-auto pb-1" data-testid="console-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                data-testid={`tab-${t.key}`}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t.key ? "bg-gradient-brand text-white" : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            );
          })}
          <button onClick={reload} className="ml-auto px-2 py-1.5 text-white/50 hover:text-white" data-testid="console-refresh">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 pb-24 space-y-2" data-testid={`console-content-${tab}`}>
        {tab === "commissions" && (
          <div className="glass rounded-2xl p-4 mb-3 border border-emerald-500/20" data-testid="commission-summary">
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Last 30 days</div>
            <div className="font-heading text-2xl font-bold text-emerald-300" data-testid="commission-total">
              ₹{(meta?.total_earned_inr ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-white/50">Total commission accrued</div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="New global rate (0.05 = 5%)"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-9 rounded-lg bg-white/5 border-white/10 text-xs"
                data-testid="commission-rate-input"
              />
              <Button onClick={setGlobalRate} className="h-9 px-3 btn-brand text-xs" data-testid="commission-rate-save">Save</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-white/40 text-sm">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-10 text-white/40 text-sm">No data yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="glass rounded-xl p-3 text-xs" data-testid={`row-${tab}-${it.id}`}>
            {tab === "transactions" && (
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${it.kind === "wallet" ? "bg-purple-500/20" : "bg-emerald-500/20"}`}>
                  {it.kind === "wallet" ? <Wallet className="h-4 w-4 text-purple-300" /> : <IndianRupee className="h-4 w-4 text-emerald-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.reference || "—"}</div>
                  <div className="text-[10px] text-white/50">{it.kind} · {it.status} · {it.provider || "-"}</div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold">₹{((it.amount_paise || 0) / 100).toLocaleString("en-IN")}</div>
                  <div className="text-[9px] text-white/40">{new Date(it.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )}
            {tab === "orders" && (
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">{it.listing_title || `Deal ${it.id.slice(-6)}`}</div>
                  <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">{it.status}</div>
                </div>
                <div className="text-[10px] text-white/50 mt-1">
                  Buyer <span className="font-mono">{(it.buyer_id || "").slice(-6)}</span> ↔ Seller <span className="font-mono">{(it.seller_id || "").slice(-6)}</span> · ₹{it.final_amount || it.current_offer || 0}
                </div>
              </div>
            )}
            {tab === "commissions" && (
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-4 w-4 ${it.status === "paid_out" ? "text-emerald-400" : "text-amber-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">₹{it.amount_inr} <span className="text-white/40 text-[10px]">({(it.rate * 100).toFixed(1)}% of ₹{it.deal_amount_inr})</span></div>
                  <div className="text-[10px] text-white/50">Vendor <span className="font-mono">{(it.vendor_id || "").slice(-6)}</span> · Deal {(it.deal_id || "").slice(-6)}</div>
                </div>
                {it.status === "accrued" ? (
                  <button onClick={() => markPaid(it.id)} data-testid={`mark-paid-${it.id}`} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">Mark paid</button>
                ) : (
                  <span className="text-[10px] text-emerald-300">Paid</span>
                )}
              </div>
            )}
            {tab === "audit" && (
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{it.action}</div>
                  <div className="text-[10px] text-white/40">{new Date(it.created_at).toLocaleString()}</div>
                </div>
                <div className="text-[10px] text-white/50 mt-1">User <span className="font-mono">{(it.user_id || "").slice(-6)}</span> · IP {it.ip || "—"}</div>
                {it.meta && <pre className="text-[9px] text-white/40 mt-1 overflow-x-auto">{JSON.stringify(it.meta).slice(0, 200)}</pre>}
              </div>
            )}
          </div>
        ))}

        {tab === "transactions" && items.length > 0 && (
          <button onClick={downloadCsv} data-testid="download-csv" className="mt-4 w-full glass rounded-xl px-4 py-2 text-xs flex items-center justify-center gap-2 hover:bg-white/5">
            <Download className="h-3 w-3" /> Export CSV
          </button>
        )}
      </div>
    </div>
  );
}
