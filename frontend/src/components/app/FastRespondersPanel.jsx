import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock } from "lucide-react";
import api from "@/lib/api";

function fmtRT(seconds) {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

export default function FastRespondersPanel({ city = null, limit = 5, className = "" }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    const params = { limit };
    if (city) params.city = city;
    api.get("/v1/vendors/leaderboard/fast-responders", { params })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [city, limit]);

  if (!items) return <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />;
  if (items.length === 0) return null;

  return (
    <section className={`glass rounded-2xl p-4 ${className}`} data-testid="fast-responders-panel">
      <div className="flex items-center gap-2 mb-2 text-xs text-white/60 uppercase tracking-wider font-semibold">
        <Zap className="h-3.5 w-3.5 text-yellow-300" /> Fast Responders {city ? `in ${city}` : ""}
      </div>
      <div className="space-y-2">
        {items.map((v, idx) => (
          <Link
            key={v.id}
            to={`/vendor/${v.id}`}
            data-testid={`fast-responder-${v.id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-6 text-center text-xs font-bold text-white/40">#{idx + 1}</div>
            {v.profile_pic ? (
              <img src={v.profile_pic} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold">
                {(v.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{v.name || "—"}</div>
              <div className="text-[10px] text-white/60">{v.city || "—"} · Trust {v.trust_score}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs font-semibold">
                <Clock className="h-3 w-3 text-white/60" /> {fmtRT(v.avg_response_time_seconds)}
              </div>
              <div className="text-[9px] text-white/50">{Math.round((v.chat_response_rate || 0) * 100)}% w/in 24h</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
