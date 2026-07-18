import { useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Search, Ban, Snowflake } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
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

  const { data, isFetching } = useListAdminUsersQuery(
    { q: appliedQ || undefined, limit: 40 },
    { skip: !isAdmin }
  );
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
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="Admin · Users" subtitle={`${items.length} shown`} />
      <div className="px-4 sm:px-6 lg:px-8 pb-2 flex items-center gap-2">
        <Input
          data-testid="admin-users-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setAppliedQ(q); }}
          placeholder="Search name or phone"
          className="h-11 rounded-xl bg-white/5 border-white/10 text-white"
        />
        <Button size="icon" onClick={() => setAppliedQ(q)} className="h-11 w-11 rounded-xl btn-brand border-0" data-testid="admin-users-search-btn">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-2 mt-2">
        {isFetching ? <div className="h-24 rounded-2xl bg-white/5 animate-pulse" /> : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="admin-users-empty">No users</div>
        ) : items.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-4" data-testid={`admin-user-${u.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{u.name || "—"} <span className="text-xs text-white/50">· {u.phone}</span></div>
                <div className="text-xs text-white/60 mt-0.5">Roles: {(u.roles || []).join(", ")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                  {u.is_banned && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">BANNED</span>}
                  {u.kyc_status === "approved" && <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">KYC</span>}
                  {u.is_subscribed_verified && <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">VERIFIED SUB</span>}
                  {typeof u.trust_score === "number" && <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/80">Trust {u.trust_score}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {u.is_banned ? (
                  <Button size="sm" onClick={() => act(unbanUser(u.id), "Unbanned")} className="rounded-full h-8" data-testid={`unban-${u.id}`}>Unban</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => { if (window.confirm(`Ban ${u.name || u.phone}?`)) act(banUser(u.id), "Banned"); }} className="rounded-full h-8" data-testid={`ban-${u.id}`}>
                    <Ban className="h-3 w-3 mr-1" /> Ban
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => act(freezeWallet(u.id), "Wallet frozen")} className="rounded-full h-8 bg-white/5 border-white/10 hover:bg-white/10 text-white" data-testid={`freeze-${u.id}`}>
                  <Snowflake className="h-3 w-3 mr-1" /> Freeze
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
