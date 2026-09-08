import { Link, Navigate } from "react-router-dom";
import { Users, ListChecks, Flag, ShieldCheck, TrendingUp, IndianRupee, KeyRound, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetAdminOverviewQuery, useGetIntegrationSettingsQuery } from "@/features/admin/adminApi";

function StatCard({ label, value, icon: Icon, colorClass = "text-[#1a1a1a]", bgClass = "bg-[#f8f4ec]", testId }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex items-center justify-between" data-testid={testId}>
      <div>
        <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider">{label}</span>
        <h4 className="text-2xl font-black text-[#1a1a1a] mt-1 font-display tracking-tight">{value}</h4>
      </div>
      <div className={`p-3 ${bgClass} ${colorClass} rounded-xl border border-[#e3dccb]/60`}>
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

  return (
    <div className="w-full max-w-7xl mx-auto animate-page-enter flex flex-col gap-6 pb-16">
      {/* Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e3dccb] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1a1a1a] font-display tracking-tight">HQ Stats Dashboard</h2>
          <p className="text-[11px] text-[#8c827a] font-medium mt-1">
            Active Mode: <strong className="text-[#1a1a1a] font-bold">Administrator</strong> &bull; Total System Users: <strong className="text-[#1a1a1a] font-bold">{ov?.total_users || 0}</strong>
          </p>
        </div>
      </div>

      <div className="px-1 pb-8 flex-1 space-y-6">
        {loading ? (
          <div className="h-24 rounded-2xl bg-[#f8f4ec] animate-pulse border border-[#e3dccb]" />
        ) : ov ? (
          <>
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total users" value={ov.total_users.toLocaleString()} icon={Users} colorClass="text-[#1a1a1a]" bgClass="bg-[#f8f4ec]" testId="stat-users" />
              <StatCard label="Vendors" value={ov.total_vendors.toLocaleString()} icon={ShieldCheck} colorClass="text-[#d99a3d]" bgClass="bg-[#f8f4ec]" testId="stat-vendors" />
              <StatCard label="Active listings" value={ov.active_listings.toLocaleString()} icon={ListChecks} colorClass="text-[#1a1a1a]" bgClass="bg-[#f8f4ec]" testId="stat-listings" />
              <StatCard label="Completed deals" value={ov.completed_deals.toLocaleString()} icon={TrendingUp} colorClass="text-emerald-700" bgClass="bg-emerald-50" testId="stat-deals" />
              <StatCard label="GMV" value={`₹${(ov.total_gmv_paise/100).toLocaleString(undefined,{maximumFractionDigits:0})}`} icon={IndianRupee} colorClass="text-[#1a1a1a]" bgClass="bg-[#f8f4ec]" testId="stat-gmv" />
              <StatCard label="Active 7d" value={ov.active_users_last_7d.toLocaleString()} icon={Users} colorClass="text-sky-700" bgClass="bg-sky-50" testId="stat-active-7d" />
            </div>

            {/* Moderation Backlog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Pending KYC Requests" value={ov.pending_kyc_count.toLocaleString()} icon={ShieldCheck} colorClass="text-[#d99a3d]" bgClass="bg-amber-50" testId="stat-pending-kyc" />
              <StatCard label="Open Reports Queue" value={ov.open_reports_count.toLocaleString()} icon={Flag} colorClass="text-rose-700" bgClass="bg-rose-50" testId="stat-open-reports" />
            </div>

            {/* Action Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <Link to="/admin/users" data-testid="link-admin-users" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Users Directory</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Manage user status, frozen wallets, and account bans.</p>
                </div>
              </Link>

              <Link to="/admin/listings" data-testid="link-admin-listings" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Moderate Listings</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Moderate active seller products and enforce takedowns.</p>
                </div>
              </Link>

              <Link to="/admin/reports" data-testid="link-admin-reports" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Resolution Hub</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Evaluate user-reported listings and dismiss claims.</p>
                </div>
              </Link>

              <Link to="/admin/kyc" data-testid="link-admin-kyc" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">KYC Document Queue</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Verify user Aadhaar, PAN, and identity documents.</p>
                </div>
              </Link>

              <Link to="/admin/approvals" data-testid="link-admin-approvals" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Approvals & Categories</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Add categories, manage verification, and sponsorship boosts.</p>
                </div>
              </Link>

              <Link to="/admin/console" data-testid="link-admin-console" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Admin Console</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Inspect transactions, commission tables, and audit logs.</p>
                </div>
              </Link>

              <Link to="/admin/settings" data-testid="link-admin-settings" className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs hover:border-[#1a1a1a] hover:shadow-xs transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] transition-all">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">Integrations & Keys</h4>
                  <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">Manage keys for Cloudinary, SMS gateway, AI, and Razorpay.</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-[#8c827a] text-xs border border-[#e3dccb]">Unable to load stats. Check if backend connection is active.</div>
        )}
      </div>
    </div>
  );
}
