import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ShoppingBag, Store, Palette, ShieldCheck, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ROLE_META = {
  customer: { label: "Customer", icon: ShoppingBag, gradient: "from-purple-500 to-purple-700",
              desc: "Browse & buy locally", home: "/feed" },
  vendor:   { label: "Vendor",   icon: Store,        gradient: "from-pink-500 to-pink-700",
              desc: "Sell products & services", home: "/vendor/dashboard" },
  creator:  { label: "Creator",  icon: Palette,      gradient: "from-orange-500 to-orange-700",
              desc: "Portfolio & hire", home: "/creator/dashboard" },
  admin:    { label: "Admin",    icon: ShieldCheck,  gradient: "from-emerald-500 to-emerald-700",
              desc: "Platform ops",            home: "/admin" },
};

export function homeForRole(role) {
  return ROLE_META[role]?.home || "/feed";
}

export default function RoleSwitcherChip() {
  const { user, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (!user) return;
    userApi.roleActivity().then(({ data }) => setActivity(data)).catch(() => {});
  }, [user?.id, user?.current_role]);

  if (!user) return null;

  const current = user.current_role || (user.roles || [])[0] || "customer";
  const meta = ROLE_META[current] || ROLE_META.customer;
  const Icon = meta.icon;
  const roles = user.roles || [];

  // Any OTHER role has pending activity? show a dot
  const otherActivity = (() => {
    if (!activity) return 0;
    let n = 0;
    for (const r of roles) {
      if (r === current) continue;
      const b = activity[r];
      if (!b) continue;
      n += (b.chat_unread || 0) + (b.pending_deals || 0);
    }
    return n;
  })();

  const doSwitch = async (role) => {
    if (role === current || switching) return;
    setSwitching(true);
    try {
      const { data } = await userApi.switchRole(role);
      updateLocalUser(data.user || { ...user, current_role: role });
      toast.success(`Switched to ${ROLE_META[role]?.label || role} panel`);
      navigate(homeForRole(role), { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Role switch failed");
    } finally {
      setSwitching(false);
    }
  };

  const addRole = () => navigate("/profile?add=role");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="role-switcher-chip"
          className={`relative h-9 px-3 rounded-full bg-gradient-to-r ${meta.gradient} text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-shadow`}
        >
          {switching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
          <span>{meta.label}</span>
          <ChevronDown className="h-3 w-3 opacity-80" />
          {otherActivity > 0 && (
            <span
              data-testid="role-activity-dot"
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-black"
              aria-label={`${otherActivity} pending in other panels`}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" data-testid="role-switcher-menu">
        <DropdownMenuLabel className="text-xs text-white/60 uppercase tracking-wider">Switch panel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.filter((r) => r !== "admin" || current === "admin").map((role) => {
          const m = ROLE_META[role]; if (!m) return null;
          const I = m.icon;
          const active = role === current;
          return (
            <DropdownMenuItem
              key={role}
              disabled={active}
              onClick={() => doSwitch(role)}
              data-testid={`role-option-${role}`}
              className="flex items-start gap-3 py-2.5 cursor-pointer data-[disabled]:opacity-50"
            >
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0`}>
                <I className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1">
                  {m.label}{active && <span className="text-[10px] text-emerald-400">· active</span>}
                </div>
                <div className="text-[11px] text-white/50 truncate">{m.desc}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={addRole} data-testid="role-add-btn" className="flex items-center gap-2 text-sm cursor-pointer">
          <Plus className="h-4 w-4" /> Add another role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
