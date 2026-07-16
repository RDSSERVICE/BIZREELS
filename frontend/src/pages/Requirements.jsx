import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, MapPin, Clock } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requirementApi, categoryApi, proposalApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function fmtBudget(min, max) {
  if (!min && !max) return "Budget flexible";
  if (min && max) return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
  return `Up to ₹${(max || min).toLocaleString("en-IN")}`;
}

export default function Requirements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposalOn, setProposalOn] = useState(null); // req id
  const [propMsg, setPropMsg] = useState("");
  const [propPrice, setPropPrice] = useState("");
  const isVendor = user?.roles?.includes("vendor");

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { const { data } = await requirementApi.list({ limit: 30 }); setItems(data.items || []); }
    finally { setLoading(false); }
  }

  const submitProposal = async () => {
    if (!propMsg.trim()) return toast.error("Add a short message");
    try {
      await proposalApi.create({
        requirement_id: proposalOn,
        message: propMsg.trim(),
        quoted_price: propPrice ? Number(propPrice) : undefined,
      });
      toast.success("Proposal sent");
      setProposalOn(null); setPropMsg(""); setPropPrice("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader
        title="Requirements"
        subtitle="Customer requests waiting for vendors."
        right={
          <Link to="/requirements/new" data-testid="new-requirement-btn" className="btn-brand rounded-full h-10 px-4 flex items-center gap-1 text-sm font-semibold border-0">
            <Plus className="h-4 w-4" /> Post
          </Link>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1">
        {loading ? (
          <div className="space-y-3" data-testid="req-loading">
            {[1,2,3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="req-empty">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-sm text-white/70 mb-4">No open requirements right now.</div>
            <Link to="/requirements/new"><Button className="rounded-full btn-brand border-0">Post one</Button></Link>
          </div>
        ) : (
          <div className="space-y-3" data-testid="req-list">
            {items.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4" data-testid={`req-${r.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-heading font-bold">{r.title}</div>
                    {r.description && <div className="text-xs text-white/70 mt-1 line-clamp-2">{r.description}</div>}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 capitalize shrink-0">{(r.urgency || "flexible").replace("_", " ")}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location?.city}</span>
                  <span>·</span>
                  <span>{fmtBudget(r.budget_min, r.budget_max)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={`/requirements/${r.id}`}><Button size="sm" variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10">View</Button></Link>
                  {isVendor && (
                    <Button size="sm" onClick={() => setProposalOn(r.id)} data-testid={`propose-btn-${r.id}`} className="rounded-full btn-brand border-0">Propose</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <Dialog open={!!proposalOn} onOpenChange={(v) => !v && setProposalOn(null)}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Send proposal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea data-testid="proposal-message" value={propMsg} onChange={(e) => setPropMsg(e.target.value)} placeholder="How can you help?" className="rounded-xl bg-white/5 border-white/10 min-h-24" />
            <Input data-testid="proposal-price" inputMode="numeric" value={propPrice} onChange={(e) => setPropPrice(e.target.value.replace(/\D/g, ""))} placeholder="Quoted price (optional)" className="h-12 rounded-xl bg-white/5 border-white/10" />
            <Button data-testid="proposal-submit" onClick={submitProposal} className="w-full h-12 rounded-full btn-brand border-0 font-semibold">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PhoneScreen>
  );
}
