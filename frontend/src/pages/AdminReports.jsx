import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { reportApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABEL = { open: "OPEN", resolved: "RESOLVED", dismissed: "DISMISSED" };

export default function AdminReports() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.roles?.includes("admin")) load(); }, [user?.id, status]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await reportApi.adminList({ status, limit: 40 });
      setItems(data.items || []);
    } finally { setLoading(false); }
  }

  const doAction = async (r, action) => {
    let note = null;
    if (action === "takedown") note = `Action per report ${r.id}`;
    try {
      await reportApi.adminResolve(r.id, action, note);
      toast.success(`Report resolved: ${action}`);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  const doDismiss = async (r) => {
    const reason = window.prompt("Dismissal note?") || null;
    try {
      await reportApi.adminDismiss(r.id, reason);
      toast.success("Report dismissed");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  if (user && !user.roles?.includes("admin")) return <Navigate to="/" replace />;

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Admin · Reports" subtitle={`${items.length} ${status}`} />
      <div className="px-4 sm:px-6 lg:px-8 pb-2 flex gap-2">
        {["open", "resolved", "dismissed"].map((s) => (
          <Button
            key={s}
            size="sm"
            onClick={() => setStatus(s)}
            className={`rounded-full h-9 ${status === s ? "btn-brand border-0" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
            data-testid={`admin-reports-tab-${s}`}
          >{s[0].toUpperCase() + s.slice(1)}</Button>
        ))}
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-2 mt-1">
        {loading ? <div className="h-24 rounded-2xl bg-white/5 animate-pulse" /> : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="admin-reports-empty">
            {status === "open" ? "Queue is clear ✓" : "No reports"}
          </div>
        ) : items.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4" data-testid={`admin-report-${r.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold">
                  {r.reason.toUpperCase()} · {r.target_type}
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{STATUS_LABEL[r.status]}</span>
                </div>
                {r.target_label ? (
                  <a
                    href={r.target_link || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm mt-1 block text-white/90 truncate hover:underline"
                    data-testid={`admin-report-target-${r.id}`}
                  >
                    {r.target_label}
                  </a>
                ) : (
                  <div className="text-xs text-white/60 truncate mt-0.5">Target: {r.target_id}</div>
                )}
                {r.description && <p className="mt-1.5 text-sm text-white/80 whitespace-pre-wrap">{r.description}</p>}
                {r.resolution_action && <div className="mt-1 text-xs text-white/50">Action: {r.resolution_action} {r.resolution_note ? `· ${r.resolution_note}` : ""}</div>}
              </div>
              {r.status === "open" && (
                <div className="flex flex-col gap-1">
                  {r.target_type === "listing" && (
                    <Button size="sm" variant="destructive" onClick={() => doAction(r, "takedown")} className="rounded-full h-8" data-testid={`resolve-takedown-${r.id}`}>Takedown</Button>
                  )}
                  {r.target_type === "user" && (
                    <Button size="sm" variant="destructive" onClick={() => doAction(r, "ban")} className="rounded-full h-8" data-testid={`resolve-ban-${r.id}`}>Ban user</Button>
                  )}
                  <Button size="sm" onClick={() => doAction(r, "warn")} className="rounded-full h-8 bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border-0" data-testid={`resolve-warn-${r.id}`}>Warn</Button>
                  <Button size="sm" variant="outline" onClick={() => doDismiss(r)} className="rounded-full h-8 bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid={`dismiss-${r.id}`}>Dismiss</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
