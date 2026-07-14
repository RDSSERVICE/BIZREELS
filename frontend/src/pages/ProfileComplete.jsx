import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, ShieldCheck, Plus, Star, ChevronRight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const INDIA_CITIES = ["Mumbai","Delhi","Bengaluru","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Bhopal","Surat","Kolhapur","Coimbatore","Chandigarh","Kochi","Vadodara"];

const STEPS = [
  { key: "photo", title: "Profile Photo", icon: Camera },
  { key: "city",  title: "Your City",     icon: MapPin },
  { key: "kyc",   title: "Verify Identity", icon: ShieldCheck },
  { key: "listing", title: "Post First Listing", icon: Plus, vendorOnly: true },
  { key: "review", title: "Ask for Review", icon: Star, vendorOnly: true },
];

export default function ProfileComplete() {
  const { user, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const isVendor = (user?.roles || []).includes("vendor");
  const activeSteps = STEPS.filter((s) => !s.vendorOnly || isVendor);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.profile_pic || "");
  const [city, setCity] = useState(user?.city || "");

  const s = activeSteps[step];
  const Icon = s.icon;
  const isLast = step === activeSteps.length - 1;
  const progress = ((step + 1) / activeSteps.length) * 100;

  const commitAndNext = async (payload) => {
    setSaving(true);
    try {
      if (payload) {
        const { data } = await userApi.update(payload);
        updateLocalUser(data);
      }
      if (isLast) {
        toast.success("Profile complete! +30 credits added");
        navigate("/dashboard");
      } else {
        setStep(step + 1);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Complete Profile" subtitle={`Step ${step + 1} of ${activeSteps.length}`} />
      <div className="px-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-brand transition-all" style={{ width: `${progress}%` }} data-testid="progress-bar" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8" data-testid={`step-${s.key}`}>
        <div className="glass rounded-2xl p-6 text-center mb-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-brand flex items-center justify-center mb-3">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-xl font-bold">{s.title}</h2>
        </div>

        {s.key === "photo" && (
          <div className="space-y-4">
            {photoUrl && <img src={photoUrl} alt="preview" className="h-32 w-32 rounded-full mx-auto object-cover" data-testid="photo-preview" />}
            <Input
              placeholder="Paste image URL (or upload via /profile)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="h-12 rounded-xl bg-white/5 border-white/10"
              data-testid="photo-url-input"
            />
          </div>
        )}

        {s.key === "city" && (
          <div className="grid grid-cols-2 gap-2" data-testid="city-grid">
            {INDIA_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                data-testid={`city-${c}`}
                className={`p-3 rounded-xl text-sm border transition-colors ${city === c ? "bg-gradient-brand border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {s.key === "kyc" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">Verify your identity to unlock trusted-seller badge, higher chat limits, and priority in search.</p>
            <Button onClick={() => navigate("/kyc")} className="w-full h-12 btn-brand" data-testid="go-to-kyc">
              Upload documents
            </Button>
          </div>
        )}

        {s.key === "listing" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">Add your first product or service to start receiving buyer requests.</p>
            <Button onClick={() => navigate("/vendor/listing/new")} className="w-full h-12 btn-brand" data-testid="go-to-listing">
              Create listing
            </Button>
          </div>
        )}

        {s.key === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">Send a review request link to your first customer. Reviews boost your trust score by 15 points on average.</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-white/5 border-white/10"
          onClick={() => (isLast ? navigate("/dashboard") : setStep(step + 1))}
          data-testid="skip-step"
        >
          Skip
        </Button>
        <Button
          onClick={() => {
            if (s.key === "photo") return commitAndNext(photoUrl ? { profile_pic: photoUrl } : null);
            if (s.key === "city") return commitAndNext(city ? { city } : null);
            return commitAndNext(null);
          }}
          disabled={saving}
          className="flex-1 btn-brand"
          data-testid="save-continue"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? <><Check className="h-4 w-4 mr-1" /> Finish</> : <>Save & continue <ChevronRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </PhoneScreen>
  );
}
