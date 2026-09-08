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
  const txs = useListAdminTransactionsQuery({ limit: 50 }, { skip: tab !== "transactions", pollingInterval: 300000 });
  const orders = useListAdminOrdersQuery({ limit: 50 }, { skip: tab !== "orders", pollingInterval: 300000 });
  const commissions = useListAdminCommissionsQuery({ limit: 50 }, { skip: tab !== "commissions", pollingInterval: 300000 });
  const summary = useGetCommissionSummaryQuery(undefined, { skip: tab !== "commissions", pollingInterval: 300000 });
  const audit = useListAdminAuditLogQuery({ limit: 50 }, { skip: tab !== "audit", pollingInterval: 300000 });

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
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16 font-sans">
      {/* Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e3dccb] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1a1a1a]">Admin Operations Console</h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Audit system logs, track vendor sales, monitor credit transactions, and define commission rates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-1 border-b border-[#e3dccb] bg-transparent">
        <div className="flex gap-1 overflow-x-auto pb-1" data-testid="console-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                data-testid={`tab-${t.key}`}
                className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  tab === t.key ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-slate-400 hover:text-[#1a1a1a]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
          <button onClick={reload} className="ml-auto px-2 py-1.5 text-slate-400 hover:text-[#1a1a1a] cursor-pointer" data-testid="console-refresh">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-1 py-4 pb-24 space-y-3" data-testid={`console-content-${tab}`}>
        {tab === "commissions" && (
          <div className="bg-[#f8f4ec] rounded-2xl p-5 border border-[#e3dccb] shadow-2xs mb-4" data-testid="commission-summary">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-black block mb-1">Accrued Commission (Last 30 days)</span>
            <div className="text-2xl font-black text-[#1a1a1a]" data-testid="commission-total">
              ₹{(meta?.total_earned_inr ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="mt-4 flex gap-2 max-w-sm">
              <Input
                placeholder="New global rate (0.05 = 5%)"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-10 rounded-xl bg-white border border-[#e3dccb] focus:border-[#1a1a1a] text-[#1a1a1a] shadow-xs text-xs font-bold"
                data-testid="commission-rate-input"
              />
              <Button onClick={setGlobalRate} className="h-10 px-5 rounded-xl bg-[#1a1a1a] hover:bg-black text-[#d99a3d] font-black text-xs cursor-pointer shadow-xs" data-testid="commission-rate-save">Save Rate</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-slate-400 text-xs font-bold">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading data…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs font-bold border border-[#e3dccb] shadow-2xs">No console records available yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex flex-col gap-3" data-testid={`row-${tab}-${it.id}`}>
            {tab === "transactions" && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${it.kind === "wallet" ? "bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    {it.kind === "wallet" ? <Wallet className="h-5 w-5" /> : <IndianRupee className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#1a1a1a] truncate">{it.reference || "System Tx"}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5 capitalize">{it.kind} &bull; {it.status} &bull; {it.provider || "internal"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#1a1a1a]">₹{((it.amount_paise || 0) / 100).toLocaleString("en-IN")}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(it.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )}
            {tab === "orders" && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-black text-[#1a1a1a] truncate">{it.listing_title || `Deal Reference: ${it.id.slice(-6)}`}</h4>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb]">
                    {it.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Buyer: <span className="font-mono text-[#1a1a1a] font-bold">{it.buyer_id}</span> &bull; Seller: <span className="font-mono text-[#1a1a1a] font-bold">{it.seller_id}</span> &bull; Amount: <strong className="text-[#1a1a1a]">₹{it.final_amount || it.current_offer || 0}</strong>
                </p>
              </div>
            )}
            {tab === "commissions" && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`h-5 w-5 ${it.status === "paid_out" ? "text-emerald-600" : "text-amber-600"}`} />
                  <div>
                    <h4 className="text-xs font-black text-[#1a1a1a]">
                      Accrued: ₹{it.amount_inr} <span className="text-slate-400 text-[10px] font-semibold">({(it.rate * 100).toFixed(1)}% of ₹{it.deal_amount_inr})</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Vendor: <span className="font-mono text-[#1a1a1a] font-bold">{it.vendor_id}</span> &bull; Deal: {it.deal_id}</p>
                  </div>
                </div>
                {it.status === "accrued" ? (
                  <button onClick={() => markPaid(it.id)} data-testid={`mark-paid-${it.id}`} className="text-[10px] px-3.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-[#d99a3d] font-black cursor-pointer shadow-xs transition border-none">
                    Mark paid
                  </button>
                ) : (
                  <span className="text-[10px] font-black text-emerald-600">Paid</span>
                )}
              </div>
            )}
            {tab === "audit" && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-black text-[#1a1a1a]">{it.action}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(it.created_at).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">User: {it.user_id} &bull; IP Address: {it.ip || "—"}</p>
                {it.meta && <pre className="text-[9px] font-mono text-slate-600 mt-2 bg-[#f8f4ec] p-2.5 rounded-xl border border-[#e3dccb] max-h-24 overflow-y-auto">{JSON.stringify(it.meta, null, 2)}</pre>}
              </div>
            )}
          </div>
        ))}

        {tab === "transactions" && items.length > 0 && (
          <button onClick={downloadCsv} data-testid="download-csv" className="mt-4 w-full bg-white rounded-xl px-4 py-2.5 text-xs font-black text-[#1a1a1a] hover:bg-[#f8f4ec] transition-colors border border-[#e3dccb] shadow-2xs flex items-center justify-center gap-2 cursor-pointer">
            <Download className="h-3.5 w-3.5 text-[#d99a3d]" /> Export Transactions CSV
          </button>
        )}
      </div>
    </div>
  );
}
