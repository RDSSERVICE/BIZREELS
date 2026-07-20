import { Link, Navigate } from "react-router-dom";
import { Users, ListChecks, Flag, ShieldCheck, TrendingUp, IndianRupee, KeyRound, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetAdminOverviewQuery, useGetIntegrationSettingsQuery } from "@/features/admin/adminApi";

function StatCard({ label, value, icon: Icon, colorClass = "text-brand-purple", bgClass = "bg-brand-purple/10", testId }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass flex items-center justify-between" data-testid={testId}>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <h4 className="text-xl font-black text-brand-navy mt-1.5 font-display">{value}</h4>
      </div>
      <div className={`p-3 ${bgClass} ${colorClass} rounded-2xl`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");

  const { data: ov, isFetching: loading } = useGetAdminOverviewQuery(undefined, { skip: !isAdmin, pollingInterval: 300000 });
  const { data: settings } = useGetIntegrationSettingsQuery(undefined, { skip: !isAdmin });

  if (user && !isAdmin) return <Navigate to="/" replace />;

  // Helper: compute LIVE/DEV state per integration.
  const envState = (name) => {
    if (!settings) return null;
    const b = settings[name] || {};
    const secretPresent = (
      (name === "msg91" && b.auth_key) ||
      (name === "cloudinary" && b.api_secret) ||
      (name === "razorpay" && b.key_secret) ||
      (name === "fcm" && b.service_account_json) ||
      (name === "ai_content" && (b.api_key || true))
    );
    const isLive = name === "ai_content" ? !!b.enabled : (b.dev_mode === false && !!secretPresent);
    return isLive ? "live" : "dev";
  };
  const badges = ["msg91", "cloudinary", "razorpay", "fcm", "ai_content"];

  return (
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16">
      {/* Banner Header */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-navy font-display">HQ Stats Dashboard</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Active Mode: <strong className="text-brand-navy">Administrator</strong> &bull; Total System Users: <strong className="text-brand-navy">{ov?.total_users || 0}</strong>
          </p>
        </div>
      </div>

      <div className="px-1 pb-8 flex-1 space-y-6">
        {loading ? (
          <div className="h-24 rounded-2xl bg-slate-200/50 animate-pulse border border-slate-200" />
        ) : ov ? (
          <>
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total users" value={ov.total_users.toLocaleString()} icon={Users} colorClass="text-brand-purple" bgClass="bg-brand-purple/10" testId="stat-users" />
              <StatCard label="Vendors" value={ov.total_vendors.toLocaleString()} icon={ShieldCheck} colorClass="text-brand-orange" bgClass="bg-brand-orange/10" testId="stat-vendors" />
              <StatCard label="Active listings" value={ov.active_listings.toLocaleString()} icon={ListChecks} colorClass="text-brand-pink" bgClass="bg-brand-pink/10" testId="stat-listings" />
              <StatCard label="Completed deals" value={ov.completed_deals.toLocaleString()} icon={TrendingUp} colorClass="text-success" bgClass="bg-success/10" testId="stat-deals" />
              <StatCard label="GMV" value={`₹${(ov.total_gmv_paise/100).toLocaleString(undefined,{maximumFractionDigits:0})}`} icon={IndianRupee} colorClass="text-indigo-600" bgClass="bg-indigo-50" testId="stat-gmv" />
              <StatCard label="Active 7d" value={ov.active_users_last_7d.toLocaleString()} icon={Users} colorClass="text-sky-600" bgClass="bg-sky-50" testId="stat-active-7d" />
            </div>

            {/* Moderation Backlog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Pending KYC Requests" value={ov.pending_kyc_count.toLocaleString()} icon={ShieldCheck} colorClass="text-amber-600" bgClass="bg-amber-50" testId="stat-pending-kyc" />
              <StatCard label="Open Reports Queue" value={ov.open_reports_count.toLocaleString()} icon={Flag} colorClass="text-rose-600" bgClass="bg-rose-50" testId="stat-open-reports" />
            </div>

            {/* Action Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <Link to="/admin/users" data-testid="link-admin-users" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-brand-purple/20 hover:bg-brand-purple/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-xl group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Users Directory</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage user status, frozen wallets, and account bans.</p>
                </div>
              </Link>

              <Link to="/admin/listings" data-testid="link-admin-listings" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-brand-orange/20 hover:bg-brand-orange/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl group-hover:scale-105 transition-transform">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Moderate Listings</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Moderate active seller products and enforce takedowns.</p>
                </div>
              </Link>

              <Link to="/admin/reports" data-testid="link-admin-reports" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-rose-500/20 hover:bg-rose-500/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl group-hover:scale-105 transition-transform">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Resolution Hub</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Evaluate user-reported listings and dismiss claims.</p>
                </div>
              </Link>

              <Link to="/admin/kyc" data-testid="link-admin-kyc" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-brand-pink/20 hover:bg-brand-pink/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-xl group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">KYC Document Queue</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Verify user Aadhaar, PAN, and identity documents.</p>
                </div>
              </Link>

              <Link to="/admin/approvals" data-testid="link-admin-approvals" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-purple-500/20 hover:bg-purple-500/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-105 transition-transform">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Approvals & Categories</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Add categories, manage verification, and sponsorship boosts.</p>
                </div>
              </Link>

              <Link to="/admin/console" data-testid="link-admin-console" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Admin Console</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Inspect transactions, commission tables, and audit logs.</p>
                </div>
              </Link>

              <Link to="/admin/settings" data-testid="link-admin-settings" className="glass rounded-2xl p-5 border border-white/50 shadow-glass hover:border-blue-500/20 hover:bg-blue-500/5 transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-105 transition-transform">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Integrations & Keys</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage keys for Cloudinary, SMS gateway, AI, and Razorpay.</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">Unable to load stats. Check if backend connection is active.</div>
        )}
      </div>
    </div>
  );
}
