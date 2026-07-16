import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Sparkles, Loader2, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requirementApi, proposalApi, chatApi, aiApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiMatches, setAiMatches] = useState([]);
  const [aiMatching, setAiMatching] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    requirementApi.get(id).then(({ data }) => { if (!alive) return; setReq(data); })
      .catch(() => setReq(null))
      .finally(() => setLoading(false));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (req && user?.id === req.customer_id) {
      requirementApi.proposals(id).then(({ data }) => setProposals(data.items || [])).catch(() => {});
    }
  }, [req, id, user?.id]);

  const acceptProposal = async (pid) => {
    try {
      const { data } = await proposalApi.accept(pid);
      toast.success("Proposal accepted, chat opened");
      if (data.thread_id) navigate(`/chat/${data.thread_id}`);
    } catch { toast.error("Failed"); }
  };
  const shortlist = async (pid) => { try { await proposalApi.shortlist(pid); toast.success("Shortlisted"); const { data } = await requirementApi.proposals(id); setProposals(data.items || []); } catch { toast.error("Failed"); } };
  const rejectP = async (pid) => { try { await proposalApi.reject(pid); toast.success("Rejected"); const { data } = await requirementApi.proposals(id); setProposals(data.items || []); } catch { toast.error("Failed"); } };

  const runAiMatch = async () => {
    if (aiMatching) return;
    setAiMatching(true);
    try {
      const { data } = await aiApi.matchVendors({ requirement_id: id, limit: 8 });
      setAiMatches(data?.matches || []);
      if (!data?.matches?.length) toast.message("AI found no strong matches yet");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI matcher failed");
    } finally {
      setAiMatching(false);
    }
  };

  if (loading) return <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter"><div className="p-6 text-white/60">Loading…</div></div>;
  if (!req) return <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter"><div className="p-6 text-white/60">Not found</div></div>;

  const isOwner = user?.id === req.customer_id;

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <button onClick={() => navigate(-1)} data-testid="req-back" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-4 space-y-4 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold" data-testid="req-title">{req.title}</h1>
            <div className="mt-1 text-xs text-white/60 flex items-center gap-2">
              <MapPin className="h-3 w-3" /> {req.location?.area}, {req.location?.city}
              <span>·</span>
              <span className="capitalize">{(req.urgency || "flexible").replace("_", " ")}</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 capitalize">{req.status}</span>
        </div>

        {req.description && <p className="text-sm text-white/80 whitespace-pre-wrap">{req.description}</p>}

        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-white/60">Budget</div>
          <div className="text-lg font-heading font-bold">
            {req.budget_min || req.budget_max
              ? `₹${(req.budget_min || 0).toLocaleString("en-IN")} – ₹${(req.budget_max || 0).toLocaleString("en-IN")}`
              : "Flexible"}
          </div>
        </div>

        {isOwner ? (
          <>
            <section data-testid="ai-matches-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold">🎯 AI-Recommended Vendors</h3>
                <button
                  onClick={runAiMatch}
                  disabled={aiMatching}
                  data-testid="ai-match-btn"
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 disabled:opacity-40"
                >
                  {aiMatching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-pink-400" />}
                  {aiMatching ? "Matching…" : aiMatches.length ? "Re-run" : "Find with AI"}
                </button>
              </div>
              {aiMatches.length > 0 ? (
                <div className="space-y-2" data-testid="ai-matches-list">
                  {aiMatches.map((m) => (
                    <Link to={`/vendor/${m.vendor_id}`} key={m.vendor_id + m.top_listing_id} className="block glass rounded-2xl p-3 hover:bg-white/5" data-testid={`ai-match-${m.vendor_id}`}>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-sm shrink-0">
                          {m.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate flex items-center gap-1">
                            {m.vendor_name}
                            <BadgeCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                          </div>
                          <div className="text-xs text-white/60 truncate">{m.top_listing_title}</div>
                          {m.reasons?.length > 0 && (
                            <div className="text-[10px] text-white/50 mt-1 truncate">{m.reasons.slice(0, 2).join(" · ")}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl p-4 text-center text-white/50 text-xs">Tap "Find with AI" to see the best-matching vendors from the platform.</div>
              )}
            </section>

            <section data-testid="proposals-section">
              <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Proposals ({proposals.length})</h3>
            {proposals.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-white/60 text-sm">No proposals yet.</div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div key={p.id} className="glass rounded-2xl p-4" data-testid={`prop-${p.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold">
                        {(p.vendor?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.vendor?.name || "Vendor"}</div>
                        {p.quoted_price != null && <div className="text-xs text-white/60">Quoted: ₹{p.quoted_price.toLocaleString("en-IN")}</div>}
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 capitalize">{p.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{p.message}</p>
                    {p.status === "sent" && (
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => shortlist(p.id)} data-testid={`shortlist-${p.id}`} size="sm" variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white">Shortlist</Button>
                        <Button onClick={() => rejectP(p.id)} data-testid={`reject-${p.id}`} size="sm" variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white">Reject</Button>
                        <Button onClick={() => acceptProposal(p.id)} data-testid={`accept-${p.id}`} size="sm" className="rounded-full btn-brand border-0">Accept</Button>
                      </div>
                    )}
                    {p.status === "shortlisted" && (
                      <div className="mt-3">
                        <Button onClick={() => acceptProposal(p.id)} data-testid={`accept-${p.id}`} size="sm" className="rounded-full btn-brand border-0">Accept & open chat</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          </>
        ) : user?.roles?.includes("vendor") && req.status === "open" ? (
          <Button
            data-testid="req-send-proposal-btn"
            onClick={async () => {
              try {
                const msg = window.prompt("Your message to the customer:");
                if (!msg) return;
                await proposalApi.create({ requirement_id: id, message: msg });
                toast.success("Proposal sent");
              } catch { toast.error("Failed"); }
            }}
            className="w-full h-12 rounded-full btn-brand border-0 font-semibold"
          >Send Proposal</Button>
        ) : null}
      </div>
    </div>
  );
}
