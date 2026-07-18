import { toast } from "sonner";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useGetKycQueueQuery, useApproveKycMutation, useRejectKycMutation } from "@/features/admin/adminApi";

export default function AdminKyc() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");

  const { data, isFetching } = useGetKycQueueQuery(undefined, { skip: !isAdmin });
  const items = data?.items || [];

  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const act = async (promise) => {
    try { await promise.unwrap(); toast.success("Done"); }
    catch { toast.error("Failed"); }
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="Admin · KYC Queue" subtitle={`${items.length} pending`} />
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1">
        {isFetching ? <div className="h-24 rounded-2xl bg-white/5 animate-pulse" /> : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="admin-kyc-empty">Queue empty ✓</div>
        ) : (
          <div className="space-y-3" data-testid="admin-kyc-list">
            {items.map((k) => (
              <div key={k.id} className="glass rounded-2xl p-4" data-testid={`kyc-item-${k.id}`}>
                <div className="text-sm font-semibold">User: {k.user_id}</div>
                <div className="text-xs text-white/60 mt-0.5">Doc: {k.doc_type} · {k.doc_number}</div>
                {k.doc_url && <img src={resolveMediaUrl(k.doc_url)} alt="" className="mt-2 max-h-32 rounded-lg" />}
                <div className="mt-3 flex gap-2">
                  <Button data-testid={`approve-${k.id}`} size="sm" onClick={() => act(approveKyc(k.id))} className="rounded-full btn-brand border-0">Approve</Button>
                  <Button data-testid={`reject-${k.id}`} size="sm" onClick={() => { const r = window.prompt("Reason?"); if (r) act(rejectKyc({ id: k.id, reason: r })); }} variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
