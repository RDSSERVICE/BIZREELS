import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Users, ListChecks, Flag, ShieldCheck, TrendingUp, IndianRupee, KeyRound } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function StatCard({ label, value, icon: Icon, testId }) {
  return (
    <div className="glass rounded-2xl p-4" data-testid={testId}>
      <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider font-semibold">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-heading text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.roles?.includes("admin")) return;
    adminApi.overview().then(({ data }) => setOv(data)).finally(() => setLoading(false));
  }, [user?.id]);

  if (user && !user.roles?.includes("admin")) return <Navigate to="/" replace />;

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Admin" subtitle="Emergent HQ" />
      <div className="px-6 pb-24 flex-1 space-y-4">
        {loading ? (
          <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ) : ov ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total users" value={ov.total_users.toLocaleString()} icon={Users} testId="stat-users" />
              <StatCard label="Vendors" value={ov.total_vendors.toLocaleString()} icon={ShieldCheck} testId="stat-vendors" />
              <StatCard label="Active listings" value={ov.active_listings.toLocaleString()} icon={ListChecks} testId="stat-listings" />
              <StatCard label="Completed deals" value={ov.completed_deals.toLocaleString()} icon={TrendingUp} testId="stat-deals" />
              <StatCard label="GMV" value={`₹${(ov.total_gmv_paise/100).toLocaleString(undefined,{maximumFractionDigits:0})}`} icon={IndianRupee} testId="stat-gmv" />
              <StatCard label="Active 7d" value={ov.active_users_last_7d.toLocaleString()} icon={Users} testId="stat-active-7d" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Pending KYC" value={ov.pending_kyc_count.toLocaleString()} icon={ShieldCheck} testId="stat-pending-kyc" />
              <StatCard label="Open reports" value={ov.open_reports_count.toLocaleString()} icon={Flag} testId="stat-open-reports" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/users" data-testid="link-admin-users" className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <Users className="h-5 w-5 mb-2" />
                <div className="font-heading font-semibold">Users</div>
                <div className="text-xs text-white/60 mt-0.5">Search, ban, roles</div>
              </Link>
              <Link to="/admin/listings" data-testid="link-admin-listings" className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <ListChecks className="h-5 w-5 mb-2" />
                <div className="font-heading font-semibold">Listings</div>
                <div className="text-xs text-white/60 mt-0.5">Moderate & takedown</div>
              </Link>
              <Link to="/admin/reports" data-testid="link-admin-reports" className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <Flag className="h-5 w-5 mb-2" />
                <div className="font-heading font-semibold">Reports</div>
                <div className="text-xs text-white/60 mt-0.5">{ov.open_reports_count} open</div>
              </Link>
              <Link to="/admin/kyc" data-testid="link-admin-kyc" className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <ShieldCheck className="h-5 w-5 mb-2" />
                <div className="font-heading font-semibold">KYC</div>
                <div className="text-xs text-white/60 mt-0.5">{ov.pending_kyc_count} pending</div>
              </Link>
              <Link to="/admin/settings" data-testid="link-admin-settings" className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <KeyRound className="h-5 w-5 mb-2" />
                <div className="font-heading font-semibold">Integrations</div>
                <div className="text-xs text-white/60 mt-0.5">Keys · dev mode</div>
              </Link>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm">Unable to load stats</div>
        )}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
