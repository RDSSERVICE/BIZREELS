import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminListings() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.roles?.includes("admin")) load(); }, [user?.id, flagged]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminApi.listListings({ flagged: flagged || undefined, limit: 40 });
      setItems(data.items || []);
    } finally { setLoading(false); }
  }

  const act = async (fn, ok = "Done") => {
    try { await fn; toast.success(ok); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  if (user && !user.roles?.includes("admin")) return <Navigate to="/" replace />;

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Admin · Listings" subtitle={flagged ? "Taken down" : "All active"} />
      <div className="px-4 sm:px-6 lg:px-8 flex gap-2 pb-2">
        <Button size="sm" onClick={() => setFlagged(false)} className={`rounded-full h-9 ${!flagged ? "btn-brand border-0" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`} data-testid="admin-listings-tab-all">All</Button>
        <Button size="sm" onClick={() => setFlagged(true)} className={`rounded-full h-9 ${flagged ? "btn-brand border-0" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`} data-testid="admin-listings-tab-taken">Taken down</Button>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-2 mt-1">
        {loading ? <div className="h-24 rounded-2xl bg-white/5 animate-pulse" /> : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="admin-listings-empty">Nothing here.</div>
        ) : items.map((li) => (
          <div key={li.id} className="glass rounded-2xl p-4" data-testid={`admin-listing-${li.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{li.title}</div>
                <div className="text-xs text-white/60 mt-0.5">₹{Number(li.price).toLocaleString()} · {li.status}</div>
                {li.is_takendown && <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">TAKEN DOWN</span>}
              </div>
              <div className="flex flex-col gap-1">
                {li.is_takendown ? (
                  <Button size="sm" onClick={() => act(adminApi.restoreListing(li.id), "Restored")} className="rounded-full h-8 btn-brand border-0" data-testid={`restore-${li.id}`}>Restore</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => { if (window.confirm("Take down this listing?")) act(adminApi.takedownListing(li.id), "Taken down"); }} className="rounded-full h-8" data-testid={`takedown-${li.id}`}>Takedown</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
