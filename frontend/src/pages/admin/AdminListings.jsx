import { useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useListAdminListingsQuery, useTakedownListingMutation, useRestoreListingMutation } from "@/features/admin/adminApi";

export default function AdminListings() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [flagged, setFlagged] = useState(false);

  const { data, isFetching } = useListAdminListingsQuery(
    { flagged: flagged || undefined, limit: 40 },
    { skip: !isAdmin, pollingInterval: 4000 }
  );
  const items = data?.items || [];

  const [takedownListing] = useTakedownListingMutation();
  const [restoreListing] = useRestoreListingMutation();

  const act = async (promise, ok = "Done") => {
    try { await promise.unwrap(); toast.success(ok); }
    catch (err) { toast.error(err?.data?.message || err?.data?.detail || "Failed"); }
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16">
      {/* Banner Header */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-navy font-display">Moderate Listings</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Review live products/services or enforce administrative takedowns. Listings count: <strong className="text-brand-navy">{items.length}</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-1 flex gap-2">
        <Button onClick={() => setFlagged(false)} className={`rounded-xl h-10 px-4 text-xs font-bold transition-all border ${!flagged ? "bg-brand-purple text-white border-brand-purple shadow-premium" : "bg-white text-text-secondary border-slate-200 hover:text-brand-purple"}`} data-testid="admin-listings-tab-all">All Active</Button>
        <Button onClick={() => setFlagged(true)} className={`rounded-xl h-10 px-4 text-xs font-bold transition-all border ${flagged ? "bg-brand-purple text-white border-brand-purple shadow-premium" : "bg-white text-text-secondary border-slate-200 hover:text-brand-purple"}`} data-testid="admin-listings-tab-taken">Taken Down</Button>
      </div>

      <div className="px-1 pb-8 flex-1 space-y-3">
        {isFetching ? (
          <div className="h-24 rounded-2xl bg-slate-200/50 animate-pulse border border-slate-200" />
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200" data-testid="admin-listings-empty">No listings found in this category.</div>
        ) : items.map((li) => (
          <div key={li.id} className="glass rounded-2xl p-5 border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-testid={`admin-listing-${li.id}`}>
            <div>
              <h4 className="text-sm font-bold text-brand-navy font-display">{li.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Price: <strong className="text-brand-navy">₹{Number(li.price).toLocaleString()}</strong> &bull; Status: {li.status}</p>
              {li.is_takendown && (
                <span className="text-[9px] font-extrabold uppercase bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 mt-2 inline-block">
                  taken down
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {li.is_takendown ? (
                <Button size="sm" onClick={() => act(restoreListing(li.id), "Restored")} className="rounded-xl h-9 text-xs bg-brand-purple hover:bg-brand-purple-800 text-white font-bold px-4" data-testid={`restore-${li.id}`}>
                  Restore Listing
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => { if (window.confirm("Take down this listing?")) act(takedownListing(li.id), "Taken down"); }} className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-4" data-testid={`takedown-${li.id}`}>
                  Takedown
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
