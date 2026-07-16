import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { notifApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); const s = getSocket(); if (s) { const h = () => load(); s.on("notification:new", h); return () => s.off("notification:new", h); } }, []);
  async function load() { setLoading(true); try { const { data } = await notifApi.list({ limit: 50 }); setItems(data.items || []); } finally { setLoading(false); } }

  const readAll = async () => { try { await notifApi.readAll(); toast.success("All read"); load(); } catch { toast.error("Failed"); } };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader
        title="Notifications"
        right={<Button data-testid="read-all-btn" onClick={readAll} variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"><CheckCheck className="h-4 w-4 mr-1" />Read all</Button>}
      />
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="notifs-empty"><Bell className="h-8 w-8 mx-auto text-white/40 mb-2" /><div className="text-sm text-white/70">All caught up!</div></div>
        ) : (
          <div className="space-y-2" data-testid="notifs-list">
            {items.map((n) => (
              <Link
                key={n.id}
                to={n.action_url || "#"}
                onClick={() => notifApi.read(n.id).catch(() => {})}
                data-testid={`notif-${n.id}`}
                className={`block glass rounded-2xl p-4 ${!n.is_read ? "border-pink-500/40" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${!n.is_read ? "bg-gradient-brand" : "bg-white/10"}`}><Bell className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{n.title}</div>
                    {n.body && <div className="text-xs text-white/70 mt-0.5 line-clamp-2">{n.body}</div>}
                    <div className="text-[10px] text-white/40 mt-1 capitalize">{n.type.replace("_", " ")}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
