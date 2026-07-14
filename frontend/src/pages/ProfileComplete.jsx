import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, MapPin, ShieldCheck, Plus, Star, ChevronRight, Loader2, Check, Search, Navigation2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi, locationApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Expanded list per user request (~40 cities). The `city` step is a free-text
// input + quick-pick chips — user can type any city name if theirs isn't listed.
const INDIA_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal",
  "Surat", "Coimbatore", "Chandigarh", "Kochi", "Vadodara", "Ludhiana", "Agra",
  "Nashik", "Faridabad", "Meerut", "Rajkot", "Vasai-Virar", "Varanasi",
  "Srinagar", "Aurangabad", "Amritsar", "Navi Mumbai", "Prayagraj", "Ranchi",
  "Howrah", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
  "Kota", "Guwahati", "Solapur", "Bareilly", "Moradabad", "Mysuru", "Gurugram",
  "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Ghaziabad", "Noida",
];

const STEPS = [
  { key: "photo", title: "Profile Photo", icon: Camera },
  { key: "city", title: "Your City", icon: MapPin },
  { key: "kyc", title: "Verify Identity", icon: ShieldCheck },
  { key: "listing", title: "Post First Listing", icon: Plus, vendorOnly: true },
  { key: "review", title: "Ask for Review", icon: Star, vendorOnly: true },
];

export default function ProfileComplete() {
  const { user, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isVendor = (user?.roles || []).includes("vendor");
  const activeSteps = useMemo(
    () => STEPS.filter((s) => !s.vendorOnly || isVendor),
    [isVendor],
  );

  // Deep-link support: `/profile/complete?step=city` jumps straight to the city step.
  const requestedStepKey = (params.get("step") || "").trim();
  const initialStep = Math.max(
    0,
    activeSteps.findIndex((s) => s.key === requestedStepKey),
  );

  const [step, setStep] = useState(initialStep === -1 ? 0 : initialStep);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.profile_pic || "");
  const [city, setCity] = useState(user?.city || "");
  const [citySearch, setCitySearch] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (initialStep >= 0 && initialStep !== step) setStep(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);

  const s = activeSteps[step];
  const Icon = s.icon;
  const isLast = step === activeSteps.length - 1;
  const progress = ((step + 1) / activeSteps.length) * 100;

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return INDIA_CITIES;
    return INDIA_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch]);

  const commitAndNext = async (payload) => {
    setSaving(true);
    try {
      if (payload) {
        const { data } = await userApi.update(payload);
        // Backend responds `{user: {...}}`; unwrap so local state doesn't
        // become `{user: {...}}` (which caused city step to look "not saved").
        updateLocalUser(data?.user || data);
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

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await locationApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (data?.city) {
            setCity(data.city);
            setCitySearch("");
            toast.success(`Detected ${data.city}`);
          } else {
            toast.error("Could not detect city — please type it below");
          }
        } catch (e) {
          toast.error(e?.response?.data?.detail || "Location lookup failed");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        toast.error(err?.message || "Location permission denied — please type your city");
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Complete Profile" subtitle={`Step ${step + 1} of ${activeSteps.length}`} />
      <div className="px-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-brand transition-all"
            style={{ width: `${progress}%` }}
            data-testid="progress-bar"
          />
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
            {photoUrl && (
              <img
                src={photoUrl}
                alt="preview"
                className="h-32 w-32 rounded-full mx-auto object-cover"
                data-testid="photo-preview"
              />
            )}
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
          <div className="space-y-4" data-testid="city-step-content">
            {/* Free-text input — the fix for the reported bug */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Type your city (e.g. Bhopal, Nashik, Jaipur)"
                maxLength={80}
                className="h-14 rounded-xl bg-white/5 border-white/10 pl-9"
                data-testid="city-input"
              />
              {city && (
                <button
                  type="button"
                  onClick={() => setCity("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/80"
                  data-testid="city-clear"
                >
                  Clear
                </button>
              )}
            </div>

            <Button
              onClick={useMyLocation}
              disabled={geoLoading}
              data-testid="use-my-location"
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-2 disabled:opacity-50"
              variant="outline"
            >
              {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation2 className="h-4 w-4 text-emerald-400" />}
              {geoLoading ? "Detecting your city…" : "Use my current location"}
            </Button>

            {/* Search + quick-pick chips (filter the extended list) */}
            <div className="pt-2">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                <Input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities…"
                  className="h-10 pl-9 rounded-xl bg-white/5 border-white/10 text-sm"
                  data-testid="city-search"
                />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Popular cities</div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1" data-testid="city-grid">
                {filteredCities.length === 0 && (
                  <div className="col-span-2 text-xs text-white/50 py-3 text-center" data-testid="city-empty">
                    No match. Just type your city in the box above ↑
                  </div>
                )}
                {filteredCities.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCity(c); setCitySearch(""); }}
                    data-testid={`city-${c}`}
                    className={`p-2.5 rounded-xl text-sm border text-left transition-colors ${
                      city === c
                        ? "bg-gradient-brand border-transparent font-semibold"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {city && (
              <div
                className="glass rounded-xl px-3 py-2.5 text-xs text-emerald-300/90"
                data-testid="city-preview"
              >
                Selected city: <span className="font-heading font-semibold text-white">{city}</span>
              </div>
            )}
          </div>
        )}

        {s.key === "kyc" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Verify your identity to unlock trusted-seller badge, higher chat limits, and priority in search.
            </p>
            <Button onClick={() => navigate("/kyc")} className="w-full h-12 btn-brand" data-testid="go-to-kyc">
              Upload documents
            </Button>
          </div>
        )}

        {s.key === "listing" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">Add your first product or service to start receiving buyer requests.</p>
            <Button
              onClick={() => navigate("/vendor/listing/new")}
              className="w-full h-12 btn-brand"
              data-testid="go-to-listing"
            >
              Create listing
            </Button>
          </div>
        )}

        {s.key === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Send a review request link to your first customer. Reviews boost your trust score by 15 points on average.
            </p>
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
            if (s.key === "city") {
              const c = (city || "").trim();
              if (!c) { toast.error("Please pick or type a city, or tap Skip"); return; }
              return commitAndNext({ city: c });
            }
            return commitAndNext(null);
          }}
          disabled={saving}
          className="flex-1 btn-brand"
          data-testid="save-continue"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLast ? (
            <><Check className="h-4 w-4 mr-1" /> Finish</>
          ) : (
            <>Save & continue <ChevronRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    </PhoneScreen>
  );
}
