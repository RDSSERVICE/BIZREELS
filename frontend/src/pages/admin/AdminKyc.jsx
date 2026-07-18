import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useGetKycQueueQuery, useApproveKycMutation, useRejectKycMutation } from "@/features/admin/adminApi";

export default function AdminKyc() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");

  const { data, isFetching } = useGetKycQueueQuery(undefined, { skip: !isAdmin, pollingInterval: 4000 });
  const items = data?.items || [];

  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const act = async (promise) => {
    try { await promise.unwrap(); toast.success("Done"); }
    catch { toast.error("Failed"); }
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16">
      {/* Banner Header */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-navy font-display">KYC Verification Queue</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Evaluate, approve, or reject user identity document claims. Pending requests: <strong className="text-brand-navy">{items.length}</strong>
          </p>
        </div>
      </div>

      <div className="px-1 flex-1">
        {isFetching ? (
          <div className="h-24 rounded-2xl bg-slate-200/50 animate-pulse border border-slate-200" />
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200" data-testid="admin-kyc-empty">Queue empty &bull; All KYC checks cleared!</div>
        ) : (
          <div className="space-y-4" data-testid="admin-kyc-list">
            {items.map((k) => (
              <div key={k.id} className="glass rounded-2xl p-5 border border-white/50 shadow-glass flex flex-col gap-4" data-testid={`kyc-item-${k.id}`}>
                <div>
                  <h4 className="text-sm font-bold text-brand-navy font-display">User Reference ID: {k.user_id}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 capitalize font-semibold">Document: {k.doc_type} &bull; No: {k.doc_number}</p>
                </div>
                
                {k.doc_url && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden max-w-md bg-slate-50">
                    <img src={resolveMediaUrl(k.doc_url)} alt="KYC Document Preview" className="max-h-64 w-full object-contain" />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button data-testid={`approve-${k.id}`} size="sm" onClick={() => act(approveKyc(k.id))} className="rounded-xl h-9 bg-brand-purple hover:bg-brand-purple-800 text-white font-bold text-xs px-4">
                    Approve KYC
                  </Button>
                  <Button data-testid={`reject-${k.id}`} size="sm" onClick={() => { const r = window.prompt("Reason for rejection?"); if (r) act(rejectKyc({ id: k.id, reason: r })); }} variant="outline" className="rounded-xl h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4">
                    Reject KYC
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
