import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { kycApi, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminKyc() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.roles?.includes("admin")) load(); }, [user?.id]);
  async function load() { setLoading(true); try { const { data } = await kycApi.queue(); setItems(data.items || []); } finally { setLoading(false); } }

  if (user && !user.roles?.includes("admin")) return <Navigate to="/" replace />;

  const act = async (fn, id, reason) => { try { await fn; toast.success("Done"); load(); } catch { toast.error("Failed"); } };

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Admin · KYC Queue" subtitle={`${items.length} pending`} />
      <div className="px-6 pb-24 flex-1">
        {loading ? <div className="h-24 rounded-2xl bg-white/5 animate-pulse" /> : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="admin-kyc-empty">Queue empty ✓</div>
        ) : (
          <div className="space-y-3" data-testid="admin-kyc-list">
            {items.map((k) => (
              <div key={k.id} className="glass rounded-2xl p-4" data-testid={`kyc-item-${k.id}`}>
                <div className="text-sm font-semibold">User: {k.user_id}</div>
                <div className="text-xs text-white/60 mt-0.5">Doc: {k.doc_type} · {k.doc_number}</div>
                {k.doc_url && <img src={resolveMediaUrl(k.doc_url)} alt="" className="mt-2 max-h-32 rounded-lg" />}
                <div className="mt-3 flex gap-2">
                  <Button data-testid={`approve-${k.id}`} size="sm" onClick={() => act(kycApi.approve(k.id), k.id)} className="rounded-full btn-brand border-0">Approve</Button>
                  <Button data-testid={`reject-${k.id}`} size="sm" onClick={() => { const r = window.prompt("Reason?"); if (r) act(kycApi.reject(k.id, r), k.id); }} variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
