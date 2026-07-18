import { useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useListAdminReportsQuery, useResolveReportMutation, useDismissReportMutation } from "@/features/admin/adminApi";

const STATUS_LABEL = { open: "OPEN", resolved: "RESOLVED", dismissed: "DISMISSED" };

export default function AdminReports() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [status, setStatus] = useState("open");

  const { data, isFetching } = useListAdminReportsQuery({ status, limit: 40 }, { skip: !isAdmin, pollingInterval: 4000 });
  const items = data?.items || [];

  const [resolveReport] = useResolveReportMutation();
  const [dismissReport] = useDismissReportMutation();

  const doAction = async (r, action) => {
    let note = null;
    if (action === "takedown") note = `Action per report ${r.id}`;
    try {
      await resolveReport({ id: r.id, action, note }).unwrap();
      toast.success(`Report resolved: ${action}`);
    } catch (err) { toast.error(err?.data?.message || err?.data?.detail || "Failed"); }
  };

  const doDismiss = async (r) => {
    const reason = window.prompt("Dismissal note?") || null;
    try {
      await dismissReport({ id: r.id, reason }).unwrap();
      toast.success("Report dismissed");
    } catch (err) { toast.error(err?.data?.message || err?.data?.detail || "Failed"); }
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16">
      {/* Banner Header */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-navy font-display">Resolution Hub</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Resolve user reports, ban offenders, take down content, or warn accounts. Active queue: <strong className="text-brand-navy">{items.length}</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-1 flex gap-2">
        {["open", "resolved", "dismissed"].map((s) => (
          <Button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-xl h-10 px-4 text-xs font-bold transition-all border ${status === s ? "bg-brand-purple text-white border-brand-purple shadow-premium" : "bg-white text-text-secondary border-slate-200 hover:text-brand-purple"}`}
            data-testid={`admin-reports-tab-${s}`}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <div className="px-1 pb-8 flex-1 space-y-3">
        {isFetching ? (
          <div className="h-24 rounded-2xl bg-slate-200/50 animate-pulse border border-slate-200" />
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200" data-testid="admin-reports-empty">
            {status === "open" ? "Queue is clear &bull; No active reports!" : "No reports found."}
          </div>
        ) : items.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-5 border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-testid={`admin-report-${r.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/5">
                  {r.reason}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Target: {r.target_type}</span>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              
              {r.target_label ? (
                <a
                  href={r.target_link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-brand-navy mt-2 block truncate hover:underline"
                  data-testid={`admin-report-target-${r.id}`}
                >
                  {r.target_label}
                </a>
              ) : (
                <div className="text-xs text-slate-500 font-semibold mt-1">Target ID: {r.target_id}</div>
              )}
              
              {r.description && <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{r.description}</p>}
              {r.resolution_action && <div className="mt-2 text-[10px] text-slate-400">Action: {r.resolution_action} {r.resolution_note ? `&bull; ${r.resolution_note}` : ""}</div>}
            </div>

            {r.status === "open" && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                {r.target_type === "listing" && (
                  <Button size="sm" variant="destructive" onClick={() => doAction(r, "takedown")} className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold" data-testid={`resolve-takedown-${r.id}`}>
                    Takedown
                  </Button>
                )}
                {r.target_type === "user" && (
                  <Button size="sm" variant="destructive" onClick={() => doAction(r, "ban")} className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold" data-testid={`resolve-ban-${r.id}`}>
                    Ban User
                  </Button>
                )}
                <Button size="sm" onClick={() => doAction(r, "warn")} className="rounded-xl h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold" data-testid={`resolve-warn-${r.id}`}>
                  Warn
                </Button>
                <Button size="sm" variant="outline" onClick={() => doDismiss(r)} className="rounded-xl h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600 font-bold" data-testid={`dismiss-${r.id}`}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
