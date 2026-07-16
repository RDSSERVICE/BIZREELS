import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ShoppingBag, Store, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScreenHeader from "@/components/app/ScreenHeader";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ROLE_META = [
  { key: "customer", icon: ShoppingBag },
  { key: "vendor", icon: Store },
  { key: "creator", icon: Camera },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateLocalUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [roles, setRoles] = useState(user?.roles?.length ? user.roles.filter(r => r !== "admin") : ["customer"]);
  const [loading, setLoading] = useState(false);

  const toggleRole = (r) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (roles.length === 0) {
      toast.error("Pick at least one role");
      return;
    }
    setLoading(true);
    try {
      // Update name
      const { data: updated } = await userApi.update({ name: name.trim() });
      let currentUser = updated.user;

      // Ensure all selected roles are added
      for (const r of roles) {
        if (!currentUser.roles.includes(r)) {
          const { data: addRes } = await userApi.addRole(r);
          currentUser = addRes.user;
        }
      }

      // Ensure current_role is one of the picked roles
      if (!roles.includes(currentUser.current_role) && roles[0]) {
        const { data: sw } = await userApi.switchRole(roles[0]);
        currentUser = sw.user;
      }

      updateLocalUser(currentUser);
      toast.success("Profile ready");
      navigate("/feed", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to save";
      toast.error(typeof msg === "string" ? msg : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="max-w-md mx-auto">
      <ScreenHeader
        title={t("onboarding.title")}
        subtitle={t("onboarding.subtitle")}
      />
      <form onSubmit={submit} className="px-4 sm:px-6 pt-2 pb-10 space-y-6">
        <label className="block">
          <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
            {t("onboarding.name_label")}
          </span>
          <Input
            data-testid="onboarding-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("onboarding.name_placeholder")}
            className="mt-2 h-14 rounded-xl bg-white/5 border-white/10 text-base placeholder:text-white/30 focus-visible:ring-pink-500 focus-visible:border-pink-500"
            maxLength={60}
            autoFocus
          />
        </label>

        <div>
          <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">
            {t("onboarding.roles_label")}
          </div>
          <div className="mt-3 space-y-2">
            {ROLE_META.map(({ key, icon: Icon }) => {
              const checked = roles.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`role-option-${key}`}
                  onClick={() => toggleRole(key)}
                  className={`w-full rounded-2xl border p-4 flex items-center gap-4 text-left transition-colors ${
                    checked
                      ? "border-pink-500/60 bg-pink-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      checked ? "bg-gradient-brand text-white" : "bg-white/5 text-white/70"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold">
                      {t(`onboarding.role_${key}`)}
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {t(`onboarding.role_${key}_desc`)}
                    </div>
                  </div>
                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                      checked ? "bg-white text-black border-white" : "border-white/20"
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          data-testid="onboarding-continue-btn"
          disabled={loading}
          className="w-full h-14 rounded-full btn-brand text-base font-semibold border-0 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("onboarding.continue")}
        </Button>
      </form>
      </div>
    </div>
  );
}
