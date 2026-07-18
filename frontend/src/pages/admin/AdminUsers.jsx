import { useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Search, Ban, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  useListAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useFreezeWalletMutation,
} from "@/features/admin/adminApi";

export default function AdminUsers() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");

  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");

  const { data, isFetching } = useListAdminUsersQuery({ q: appliedQ }, { skip: !isAdmin, pollingInterval: 4000 });
  const items = data?.items || [];

  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [freezeWallet] = useFreezeWalletMutation();

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
          <h2 className="text-xl font-black text-brand-navy font-display">Users Directory</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Search, ban, freeze, or assign user roles. Total users: <strong className="text-brand-navy">{items.length}</strong>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-1 flex items-center gap-2">
        <Input
          data-testid="admin-users-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setAppliedQ(q); }}
          placeholder="Search by name, phone or email..."
          className="h-11 rounded-xl bg-white border border-slate-200 focus:border-brand-purple text-brand-navy shadow-sm text-sm"
        />
        <Button onClick={() => setAppliedQ(q)} className="h-11 px-5 rounded-xl bg-brand-purple hover:bg-brand-purple-800 text-white font-bold" data-testid="admin-users-search-btn">
          <Search className="h-4 w-4 mr-1.5" /> Search
        </Button>
      </div>

      <div className="px-1 pb-8 flex-1 space-y-3">
        {isFetching ? (
          <div className="h-24 rounded-2xl bg-slate-200/50 animate-pulse border border-slate-200" />
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200" data-testid="admin-users-empty">No users found matching query.</div>
        ) : items.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-5 border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-testid={`admin-user-${u.id}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black font-display text-sm">
                {u.name?.slice(0,2).toUpperCase() || 'US'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy font-display">{u.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{u.email || u.phone} &bull; ID: {u.id.slice(-6)}</p>
                <div className="flex gap-1.5 mt-2">
                  {(u.roles || []).map((r) => (
                    <span key={r} className="text-[9px] font-extrabold uppercase bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/5">
                      {r}
                    </span>
                  ))}
                  {u.is_banned && (
                    <span className="text-[9px] font-extrabold uppercase bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                      banned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {u.is_banned ? (
                <Button size="sm" variant="outline" onClick={() => act(unbanUser(u.id), "User unbanned")} className="rounded-xl h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600">
                  Unban User
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => act(banUser(u.id), "User banned")} className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white">
                  <Ban className="h-3 w-3 mr-1" /> Ban User
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => act(freezeWallet(u.id), "Wallet frozen")} className="rounded-xl h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600" data-testid={`freeze-${u.id}`}>
                <Snowflake className="h-3 w-3 mr-1" /> Freeze Wallet
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
