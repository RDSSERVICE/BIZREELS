import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { chatApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

function preview(t) {
  return t?.last_message?.text || "Say hi 👋";
}

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

export default function ChatList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatApi.myThreads().then(({ data }) => setItems(data.items || [])).finally(() => setLoading(false));
    const s = getSocket();
    if (s) {
      const handler = () => chatApi.myThreads().then(({ data }) => setItems(data.items || []));
      s.on("message:new", handler);
      return () => s.off("message:new", handler);
    }
  }, [user?.id]);

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Chats" subtitle="Your conversations with vendors and customers." />
      <div className="px-4 pb-24 flex-1">
        {loading ? (
          <div className="space-y-2" data-testid="chat-loading">
            {[1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="chat-empty">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-sm text-white/70">No conversations yet. Start one from a listing.</div>
          </div>
        ) : (
          <div className="space-y-1" data-testid="chat-threads">
            {items.map((t) => (
              <Link key={t.id} to={`/chat/${t.id}`} data-testid={`thread-${t.id}`} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5">
                <div className="h-11 w-11 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold shrink-0">
                  {(t.peer?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{t.peer?.name || "Unknown"}</div>
                    <div className="text-[10px] text-white/40 shrink-0">{relTime(t.last_message?.created_at || t.updated_at)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-white/60 truncate">{preview(t)}</div>
                    {t.my_unread > 0 && (
                      <span className="text-[10px] bg-pink-500 text-white h-5 min-w-5 px-1 rounded-full flex items-center justify-center font-semibold" data-testid={`unread-${t.id}`}>
                        {t.my_unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
