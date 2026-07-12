import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportApi } from "@/lib/api";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive content" },
  { value: "scam", label: "Scam / fraud" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "other", label: "Other" },
];

export function ReportButton({ targetType, targetId, size = "sm", variant = "ghost" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
        data-testid={`report-btn-${targetType}-${targetId}`}
      >
        <Flag className="h-3.5 w-3.5 mr-1" /> Report
      </Button>
      <ReportModal open={open} onOpenChange={setOpen} targetType={targetType} targetId={targetId} />
    </>
  );
}

export function ReportModal({ open, onOpenChange, targetType, targetId }) {
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await reportApi.create({
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      });
      toast.success("Report submitted. Thanks for keeping the community safe.");
      onOpenChange?.(false);
      setDescription("");
      setReason("spam");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Report content</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Reason</div>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="report-reason" className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Description (optional)</div>
            <Textarea
              data-testid="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="More context helps us moderate faster"
              className="rounded-xl bg-white/5 border-white/10 min-h-24"
            />
          </div>
          <Button
            data-testid="report-submit"
            onClick={submit}
            disabled={saving}
            className="w-full h-12 rounded-full btn-brand border-0 font-semibold"
          >
            {saving ? "…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
