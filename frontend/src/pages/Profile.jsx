import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Plus, LogOut, MapPin, ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { userApi, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ADDABLE_ROLES = ["customer", "vendor", "creator"];

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateLocalUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
    profile_pic: user?.profile_pic || "",
    city: user?.city || "",
  });
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [addingRole, setAddingRole] = useState("");
  const [kyc, setKyc] = useState(null);

  useEffect(() => {
    api.get("/v1/kyc/me/status").then(({ data }) => setKyc(data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      );
      const { data } = await userApi.update(payload);
      updateLocalUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update";
      toast.error(typeof msg === "string" ? msg : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchRole = async (role) => {
    if (!role || role === user.current_role) return;
    setSwitching(true);
    try {
      const { data } = await userApi.switchRole(role);
      updateLocalUser(data.user);
      toast.success(`Switched to ${role}`);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to switch";
      toast.error(typeof msg === "string" ? msg : "Failed to switch");
    } finally {
      setSwitching(false);
    }
  };

  const handleAddRole = async () => {
    if (!addingRole) return;
    try {
      const { data } = await userApi.addRole(addingRole);
      updateLocalUser(data.user);
      toast.success(`Added ${addingRole} role`);
      setAddingRole("");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to add role";
      toast.error(typeof msg === "string" ? msg : "Failed to add role");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const availableToAdd = ADDABLE_ROLES.filter((r) => !user?.roles?.includes(r));

  return (
    <PhoneScreen>
      <div className="px-6 pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="profile-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
      </div>
      <ScreenHeader title={t("profile.title")} subtitle={`+91 ${user?.phone}`} />

      <div className="px-6 pb-10 space-y-8">
        {/* Roles panel */}
        <section className="glass rounded-2xl p-5">
          <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">
            {t("profile.roles_owned")}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {user?.roles?.map((r) => (
              <span
                key={r}
                data-testid={`profile-role-chip-${r}`}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                  r === user.current_role
                    ? "bg-gradient-brand text-white border-transparent"
                    : "bg-white/5 text-white/70 border-white/10"
                }`}
              >
                {r}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/60 mb-1.5">{t("profile.switch_role")}</div>
              <Select
                value={user?.current_role}
                onValueChange={handleSwitchRole}
                disabled={switching}
              >
                <SelectTrigger
                  data-testid="switch-role-trigger"
                  className="h-12 rounded-xl bg-white/5 border-white/10 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  {user?.roles?.map((r) => (
                    <SelectItem key={r} value={r} data-testid={`switch-role-option-${r}`}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableToAdd.length > 0 && (
              <div>
                <div className="text-xs text-white/60 mb-1.5">{t("profile.add_role")}</div>
                <div className="flex gap-2">
                  <Select value={addingRole} onValueChange={setAddingRole}>
                    <SelectTrigger
                      data-testid="add-role-trigger"
                      className="h-12 rounded-xl bg-white/5 border-white/10 text-white flex-1"
                    >
                      <SelectValue placeholder="Pick a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      {availableToAdd.map((r) => (
                        <SelectItem key={r} value={r} data-testid={`add-role-option-${r}`}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    data-testid="add-role-btn"
                    onClick={handleAddRole}
                    disabled={!addingRole}
                    className="h-12 rounded-full btn-brand px-4 border-0 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Profile edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Field label={t("profile.name")}>
            <Input data-testid="profile-name-input" value={form.name} onChange={set("name")} className="h-12 rounded-xl bg-white/5 border-white/10" />
          </Field>
          <Field label={t("profile.email")}>
            <Input data-testid="profile-email-input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="h-12 rounded-xl bg-white/5 border-white/10" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("profile.gender")}>
              <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                <SelectTrigger data-testid="profile-gender-trigger" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("profile.dob")}>
              <Input data-testid="profile-dob-input" type="date" value={form.dob} onChange={set("dob")} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" />
            </Field>
          </div>
          <Field label={t("profile.profile_pic")}>
            <Input data-testid="profile-pic-input" value={form.profile_pic} onChange={set("profile_pic")} placeholder="https://…" className="h-12 rounded-xl bg-white/5 border-white/10" />
          </Field>

          <Field label="City">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              <Input
                data-testid="profile-city-input"
                value={form.city}
                onChange={set("city")}
                placeholder="e.g. Indore, Bhopal, Jaipur"
                className="h-12 rounded-xl bg-white/5 border-white/10 pl-9"
                maxLength={80}
              />
            </div>
            <div className="mt-1.5">
              <Link to="/profile/complete?step=city" className="text-[11px] text-white/50 hover:text-white/80" data-testid="profile-open-city-wizard">
                Open city picker (with search & popular cities) →
              </Link>
            </div>
          </Field>

          <Button
            type="submit"
            data-testid="profile-save-btn"
            disabled={saving}
            className="w-full h-14 rounded-full btn-brand text-base font-semibold border-0 disabled:opacity-50"
          >
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
        </form>

        {/* Identity verification quick-link */}
        <section className="glass rounded-2xl p-5" data-testid="profile-kyc-card">
          <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">
            Identity verification
          </div>
          <Link
            to="/kyc/verify"
            className="flex items-center gap-3 -m-2 p-2 rounded-xl hover:bg-white/5 transition-colors"
            data-testid="profile-verify-link"
          >
            <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <ShieldCheck className={`h-5 w-5 ${kyc?.has_verified_identity ? "text-emerald-300" : "text-white/60"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-heading font-semibold flex items-center gap-2">
                {kyc?.has_verified_identity ? "Identity verified" : "Verify your identity"}
                {kyc?.has_verified_identity && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
              </div>
              <div className="text-[11px] text-white/50 truncate">
                {kyc
                  ? `${["aadhaar","pan","gst","bank"].filter((t) => kyc?.docs?.[t]?.status === "approved").length}/4 documents verified`
                  : "Aadhaar · PAN · GST · Bank"}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </Link>
        </section>

        <Button
          type="button"
          data-testid="profile-logout-btn"
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
        >
          <LogOut className="h-4 w-4 mr-1" /> {t("profile.logout")}
        </Button>
      </div>
    </PhoneScreen>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
