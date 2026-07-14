import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Send, IndianRupee, Check, CheckCheck, Sparkles, Loader2 } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { chatApi, dealApi, aiApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

export default function ChatThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    chatApi.getThread(threadId).then(({ data }) => { if (alive) setThread(data); }).catch(() => navigate("/chat"));
    chatApi.messages(threadId, { limit: 100 }).then(({ data }) => {
      if (!alive) return;
      const items = [...(data.items || [])].reverse();
      setMsgs(items);
    });
    chatApi.read(threadId).catch(() => {});

    const s = getSocket();
    if (s) {
      s.emit("thread:join", { thread_id: threadId });
      const onNew = (m) => {
        if (m.thread_id === threadId) {
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.receiver_id === user?.id) chatApi.read(threadId).catch(() => {});
        }
      };
      const onRead = (evt) => {
        if (evt.thread_id === threadId) {
          setMsgs((prev) => prev.map((m) => m.receiver_id === evt.reader_id ? { ...m, read_at: evt.read_at } : m));
        }
      };
      const onTyping = (evt) => {
        if (evt.thread_id === threadId && evt.user_id !== user?.id) {
          setTyping(evt.is_typing);
          if (evt.is_typing) setTimeout(() => setTyping(false), 3000);
        }
      };
      s.on("message:new", onNew);
      s.on("message:read", onRead);
      s.on("thread:typing", onTyping);
      return () => {
        alive = false;
        s.emit("thread:leave", { thread_id: threadId });
        s.off("message:new", onNew);
        s.off("message:read", onRead);
        s.off("thread:typing", onTyping);
      };
    }
    return () => { alive = false; };
  }, [threadId, user?.id, navigate]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await chatApi.send(threadId, { type: "text", text: t });
      // Socket will echo it back; no manual push
    } catch {
      toast.error("Failed to send");
    }
  };

  const sendOffer = async () => {
    const amt = Number(offer);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    try {
      await dealApi.create({ thread_id: threadId, initial_offer: amt, note: `Offer: ₹${amt.toLocaleString("en-IN")}` });
      setOffer(""); setOfferOpen(false);
      toast.success("Offer sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send offer");
    }
  };

  const onType = () => {
    const s = getSocket();
    if (s) s.emit("typing", { thread_id: threadId, is_typing: true });
  };

  // Phase 7d: Gemini negotiation helper (Feature 6)
  const runAiNegotiate = async (ask) => {
    if (!thread) return;
    setAiBusy(true);
    setAiInsight(null);
    try {
      // Direction inference: if the peer of this thread is a listing owner,
      // the current user is the buyer; else seller. When ambiguous, default buyer.
      const peerId = (thread.participants || []).find((p) => String(p) !== String(user?.id));
      const iAmSeller = String(thread.context_owner_id || thread.listing_owner_id || "") === String(user?.id);
      const direction = iAmSeller ? "seller" : "buyer";
      const { data } = await aiApi.negotiate({
        thread_id: threadId,
        // deal_id auto-resolved server-side from thread if any
        direction,
        ask,
      });
      if (!data?.ok) {
        toast.error(data?.error?.slice(0, 100) || "AI negotiation failed");
        return;
      }
      const r = data.result || {};
      if (ask === "write_message" || ask === "suggest_counter") {
        if (r.suggested_message) {
          setText(r.suggested_message);
          toast.success("AI draft added — edit or send");
        }
        if (ask === "suggest_counter" && r.suggested_offer_inr) {
          setOffer(String(r.suggested_offer_inr));
          setOfferOpen(true);
        }
      } else if (ask === "analyze_situation") {
        setAiInsight(r);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI failed");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <PhoneScreen className="flex flex-col">
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center gap-3" data-testid="chat-header">
        <button onClick={() => navigate("/chat")} className="h-9 w-9 rounded-full glass flex items-center justify-center" data-testid="chat-back-btn">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Chat</div>
          <div className="text-[10px] text-white/50 truncate">{thread?.thread_type || "…"}</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2" data-testid="chat-messages">
        {aiInsight && (
          <div className="glass rounded-2xl p-3 border border-pink-500/30 space-y-1.5" data-testid="ai-insight-card">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <div className="text-xs font-heading font-semibold">AI negotiation insight</div>
              <button onClick={() => setAiInsight(null)} className="ml-auto text-[10px] text-white/40 hover:text-white/80" data-testid="ai-insight-close">Dismiss</button>
            </div>
            {aiInsight.analysis && <div className="text-xs text-white/80 leading-relaxed">{aiInsight.analysis}</div>}
            {aiInsight.next_best_move && <div className="text-xs text-emerald-300/90"><span className="font-semibold">Next best move: </span>{aiInsight.next_best_move}</div>}
            {aiInsight.likely_acceptance_price_inr ? (
              <div className="text-[11px] text-white/60">Likely acceptance: ₹{Number(aiInsight.likely_acceptance_price_inr).toLocaleString("en-IN")} · confidence: {aiInsight.confidence || "medium"}</div>
            ) : null}
          </div>
        )}
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          const isSystem = m.type === "system";
          const isQuote = m.type === "quote";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.id}`}>
              {isSystem ? (
                <div className="mx-auto text-[10px] text-white/50 bg-white/5 px-3 py-1 rounded-full">{m.text}</div>
              ) : (
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-gradient-brand text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                  {isQuote ? (
                    <div>
                      <div className="text-xs opacity-80">Offer</div>
                      <div className="font-bold">₹{new Intl.NumberFormat("en-IN").format(m.quote?.amount || 0)}</div>
                      {m.quote?.note && <div className="text-xs opacity-90 mt-0.5">{m.quote.note}</div>}
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                  )}
                  {mine && (
                    <div className="text-[10px] flex justify-end mt-0.5 opacity-80">
                      {m.read_at ? (
                        <CheckCheck data-testid={`read-tick-${m.id}`} className="h-3 w-3 text-blue-300" />
                      ) : m.delivered_at ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {typing && <div className="text-[10px] text-white/50" data-testid="typing-indicator">typing…</div>}
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-black/85 backdrop-blur-lg px-3 py-3 flex items-center gap-2">
        <button onClick={() => setOfferOpen(true)} data-testid="send-offer-btn" className="h-11 w-11 rounded-full glass flex items-center justify-center">
          <IndianRupee className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="ai-negotiate-trigger"
              disabled={aiBusy}
              className="h-11 w-11 rounded-full glass flex items-center justify-center disabled:opacity-40"
              aria-label="AI negotiation helper"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-pink-400" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56" data-testid="ai-negotiate-menu">
            <DropdownMenuItem onClick={() => runAiNegotiate("write_message")} data-testid="ai-negotiate-reply">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-pink-400" /> Draft a reply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runAiNegotiate("suggest_counter")} data-testid="ai-negotiate-counter">
              <IndianRupee className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Suggest counter offer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runAiNegotiate("analyze_situation")} data-testid="ai-negotiate-analyze">
              🤖 Analyze this deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          data-testid="message-input"
          value={text}
          onChange={(e) => { setText(e.target.value); onType(); }}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Message…"
          className="h-11 rounded-full bg-white/5 border-white/10 flex-1"
        />
        <Button onClick={send} data-testid="send-btn" className="h-11 w-11 rounded-full btn-brand border-0 p-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Send an offer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input data-testid="offer-amount-input" inputMode="numeric" value={offer} onChange={(e) => setOffer(e.target.value.replace(/\D/g, ""))} placeholder="Amount in ₹" className="h-12 rounded-xl bg-white/5 border-white/10" />
            <Button data-testid="offer-submit-btn" onClick={sendOffer} className="w-full h-12 rounded-full btn-brand border-0 font-semibold">Send offer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PhoneScreen>
  );
}
