import React, { useState } from 'react';
import {
  FiBriefcase, FiEye, FiCheckCircle, FiLock, FiSlash, FiTrash2, FiClock, FiX,
  FiCheck, FiFilter, FiActivity, FiSearch, FiDollarSign, FiShoppingBag, FiStar,
  FiArrowUpRight, FiCalendar, FiRefreshCw, FiMapPin, FiUserCheck, FiGift, FiBell,
  FiShield, FiFileText, FiCreditCard, FiDownload, FiPauseCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { API_BASE } from '../../../lib/api';
import {
  useListAdminVendorsQuery,
  useGetVendorDetailQuery,
  useGetVendorStatsQuery,
  useResetCustomerPasswordMutation,
  useVerifyCustomerAccountMutation,
  useActivateCustomerAccountMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteUserMutation,
  useRejectKycMutation
} from '../../../features/admin/adminApi';

export default function AdminVendors() {
  // Query parameters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('newest_first');
  const [page, setPage] = useState(1);

  // Modal / Detail state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'reset-password' | 'reject-kyc'
  const [activeTab, setActiveTab] = useState('overview'); // tabs in View modal
  const [newPassword, setNewPassword] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // API hooks
  const { data: vendorData, isFetching: loadingVendors } = useListAdminVendorsQuery({
    q: search || undefined,
    status: status || undefined,
    kyc_status: kycStatus || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sort: sort || undefined,
    page,
    limit: 10,
  });

  const { data: stats, isFetching: loadingStats } = useGetVendorStatsQuery();

  const { data: vendorDetail, isFetching: loadingDetail } = useGetVendorDetailQuery(selectedUserId, {
    skip: !selectedUserId || modalType !== 'view',
  });

  const [resetPassword, { isLoading: resettingPw }] = useResetCustomerPasswordMutation();
  const [verifyAccount] = useVerifyCustomerAccountMutation();
  const [rejectKyc, { isLoading: rejecting }] = useRejectKycMutation();
  const [activateAccount] = useActivateCustomerAccountMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [suspendUser] = useSuspendUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const vendors = vendorData?.items || [];
  const totalPages = vendorData?.pages || 1;
  const totalItems = vendorData?.total || 0;

  // Handle Operations
  const handleAction = async (action, userId, userName) => {
    try {
      if (action === 'ban') {
        if (!window.confirm(`Block vendor "${userName}"? This blocks login instantly.`)) return;
        await banUser(userId).unwrap();
        toast.success(`Vendor "${userName}" has been blocked`);
      } else if (action === 'unban') {
        await unbanUser(userId).unwrap();
        toast.success(`Vendor "${userName}" has been unblocked`);
      } else if (action === 'suspend') {
        if (!window.confirm(`Suspend vendor "${userName}"?`)) return;
        await suspendUser(userId).unwrap();
        toast.success(`Vendor "${userName}" has been suspended`);
      } else if (action === 'activate') {
        await activateAccount(userId).unwrap();
        toast.success(`Vendor "${userName}" has been activated`);
      } else if (action === 'verify') {
        if (!window.confirm(`Verify and approve KYC for "${userName}"?`)) return;
        await verifyAccount(userId).unwrap();
        toast.success(`Vendor "${userName}" KYC status is now verified`);
      } else if (action === 'delete') {
        if (!window.confirm(`Soft delete vendor "${userName}"? This marks account as deleted, hiding it from the system.`)) return;
        await deleteUser(userId).unwrap();
        toast.success(`Vendor "${userName}" has been soft-deleted`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Administrative action failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    try {
      await resetPassword({ id: selectedUserId, password: newPassword }).unwrap();
      toast.success('Vendor password reset successfully');
      setNewPassword('');
      setModalType(null);
      setSelectedUserId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Password reset failed');
    }
  };

  const handleRejectKycSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason) {
      toast.error('Please specify a rejection reason');
      return;
    }
    try {
      // Rejects the KYC queue document
      await rejectKyc({ id: selectedUserId, reason: rejectReason }).unwrap();
      toast.success('Vendor KYC rejected with reason logged');
      setRejectReason('');
      setModalType(null);
      setSelectedUserId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'KYC rejection failed');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setKycStatus('');
    setFromDate('');
    setToDate('');
    setSort('newest_first');
    setPage(1);
  };

  // Export CSV
  const handleExport = () => {
    const access = localStorage.getItem('bizreels_access_token') || localStorage.getItem('accessToken') || '';
    const query = new URLSearchParams({
      q: search,
      status,
      kyc_status: kycStatus,
      from: fromDate,
      to: toDate,
      sort,
    }).toString();

    fetch(`${API_BASE}/admin/vendors/export?${query}`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendors_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('CSV Export downloaded successfully');
      })
      .catch(() => {
        toast.error('Failed to export vendor records');
      });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Vendor Management Console"
        subtitle="Manage business profiles, review KYC registrations, view products, sales volume, and reset passwords."
      />

      {/* --- DASHBOARD STATISTICS --- */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 border border-white/50 h-24 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Vendors', val: stats?.totalVendors, trend: stats?.growthTrend, icon: FiBriefcase, color: 'text-brand-orange' },
            { label: 'Active Vendors', val: stats?.activeVendors, sub: 'Not blocked/suspended', icon: FiUserCheck, color: 'text-emerald-500' },
            { label: 'Verified Partners', val: stats?.verifiedVendors, sub: 'KYC Approved', icon: FiShield, color: 'text-blue-500' },
            { label: 'Total Sales Volume', val: `₹${(stats?.totalSales || 0).toLocaleString('en-IN')}`, sub: 'All transactions volume', icon: FiDollarSign, color: 'text-amber-500' },
            { label: 'Active Products', val: `${stats?.activeListings || 0} / ${stats?.totalListings || 0}`, sub: 'Published products', icon: FiShoppingBag, color: 'text-purple-500' }
          ].map((card, idx) => (
            <div key={idx} className="glass rounded-2xl p-4 border border-white/50 shadow-glass flex items-center justify-between transition-all hover:scale-[1.02]">
              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">{card.label}</span>
                <span className="text-xl font-black text-text-primary mt-1 block truncate max-w-[140px]">{card.val ?? 0}</span>
                {card.trend !== undefined ? (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5">
                    <FiArrowUpRight className="w-3.5 h-3.5" /> +{card.trend}% growth (30d)
                  </span>
                ) : (
                  <span className="text-[9px] text-text-tertiary mt-0.5 block">{card.sub}</span>
                )}
              </div>
              <div className={`p-2.5 rounded-xl bg-surface-secondary flex-shrink-0 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="glass rounded-2xl border border-white/50 shadow-glass p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-brand-orange" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Search & Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg border border-border text-[10px] font-bold text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-all flex items-center gap-1"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg gradient-brand text-[10px] font-bold text-white shadow-premium flex items-center gap-1.5 transition-all hover:opacity-90"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export Data (CSV)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by shop, business, name, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
            />
          </div>

          {/* Account Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
          >
            <option value="">All Account Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Blocked">Blocked</option>
          </select>

          {/* KYC Status */}
          <select
            value={kycStatus}
            onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
          >
            <option value="">All KYC Statuses</option>
            <option value="Verified">Verified Accounts</option>
            <option value="Pending">Pending Approval</option>
            <option value="Rejected">Rejected</option>
            <option value="Unverified">Unverified Accounts</option>
          </select>

          {/* Sort selection */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
          >
            <option value="newest_first">Newest First</option>
            <option value="oldest_first">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="highest_sales">Highest Sales Volume</option>
            <option value="most_listings">Most Listings</option>
            <option value="last_login">Last Login</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Registration Date range: from */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Registered From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
            />
          </div>

          {/* Registration Date range: to */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Registered To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- VENDORS TABLE --- */}
      <div className="glass rounded-2xl border border-white/50 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/40">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Vendor & Shop</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Vendor ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">KYC Verification</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Account Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Products / Active</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Joined / Last Login</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Settled Sales</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingVendors ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 h-16 skeleton" />
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-xs text-text-tertiary">
                    No vendors found matching the criteria. Try refining filters.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => {
                  const accountStatus = v.is_banned ? 'Blocked' : v.is_active ? 'Active' : 'Suspended';
                  return (
                    <tr key={v.id} className="border-b border-border/40 hover:bg-brand-orange/5 transition-colors">
                      {/* Name / Shop Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {v.profile_pic ? (
                            <img src={v.profile_pic} alt={v.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-[11px] font-black">
                              {(v.vendorProfile?.shopName || v.name || 'V')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-text-primary block text-xs leading-tight">{v.vendorProfile?.shopName || 'No Shop Name'}</span>
                            <span className="text-[10px] text-text-secondary mt-0.5 block">{v.name || 'Unknown'} • {v.phone || v.email || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-text-secondary select-all">{v.id}</span>
                      </td>

                      {/* KYC status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={v.kyc_status || 'unverified'} />
                      </td>

                      {/* Account status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={accountStatus} />
                      </td>

                      {/* Listings count */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <span className="font-bold text-text-primary">{v.active_listings}</span>
                          <span className="text-text-tertiary">/</span>
                          <span className="text-[10px] text-text-tertiary font-medium">{v.total_listings} products</span>
                        </div>
                      </td>

                      {/* Date values */}
                      <td className="px-4 py-3 text-[10px] text-text-secondary">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3 text-text-tertiary" /> {new Date(v.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] text-text-tertiary font-semibold flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-text-tertiary" /> {v.lastLoginAt ? new Date(v.lastLoginAt).toLocaleString() : 'Never logged in'}
                          </span>
                        </div>
                      </td>

                      {/* Spendings */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-black text-brand-orange">₹{(v.total_sales || 0).toLocaleString('en-IN')}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUserId(v.id); setModalType('view'); setActiveTab('overview'); }}
                            className="p-2 rounded-lg hover:bg-brand-orange/10 text-text-tertiary hover:text-brand-orange transition-all"
                            title="View Vendor Workspace"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(v.id);
                              setNewPassword('');
                              setModalType('reset-password');
                            }}
                            className="p-2 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition-all"
                            title="Reset Password"
                          >
                            <FiLock className="w-4 h-4" />
                          </button>
                          {v.kyc_status !== 'approved' && (
                            <>
                              <button
                                onClick={() => handleAction('verify', v.id, v.name)}
                                className="p-2 rounded-lg hover:bg-blue-500/10 text-text-tertiary hover:text-blue-500 transition-all"
                                title="Verify Account (Approve KYC)"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserId(v.id);
                                  setRejectReason('');
                                  setModalType('reject-kyc');
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                                title="Reject KYC Documents"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {v.is_active ? (
                            <button
                              onClick={() => handleAction('suspend', v.id, v.name)}
                              className="p-2 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition-all"
                              title="Suspend Account"
                            >
                              <FiPauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('activate', v.id, v.name)}
                              className="p-2 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                              title="Activate Account"
                            >
                              <FiUserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(v.is_banned ? 'unban' : 'ban', v.id, v.name)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                            title={v.is_banned ? 'Unblock Vendor' : 'Block Vendor'}
                          >
                            <FiSlash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction('delete', v.id, v.name)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                            title="Delete Vendor Profile"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- TABLE PAGINATION --- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-secondary/20">
            <span className="text-[10px] text-text-tertiary font-medium">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of {totalItems} vendor records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 bg-surface border border-border rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    page === i + 1
                      ? 'bg-brand-orange text-white shadow-premium'
                      : 'hover:bg-surface-tertiary text-text-secondary border border-border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 bg-surface border border-border rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- RESET PASSWORD MODAL --- */}
      <AdminModal
        isOpen={modalType === 'reset-password'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Reset Vendor Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">New Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={resettingPw}
            className="w-full py-2.5 rounded-xl gradient-brand text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
          >
            {resettingPw ? 'Resetting...' : 'Confirm Reset Password'}
          </button>
        </form>
      </AdminModal>

      {/* --- REJECT KYC MODAL --- */}
      <AdminModal
        isOpen={modalType === 'reject-kyc'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Reject KYC Documentation"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectKycSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason for Rejection</label>
            <textarea
              placeholder="Specify mismatch or missing fields..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 min-h-[100px] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={rejecting}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {rejecting ? 'Rejecting...' : 'Confirm KYC Rejection'}
          </button>
        </form>
      </AdminModal>

      {/* --- DETAILED VIEW MODAL --- */}
      <AdminModal
        isOpen={modalType === 'view'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Vendor Workspace Profile"
        maxWidth="max-w-5xl"
      >
        {loadingDetail || !vendorDetail ? (
          <div className="py-24 text-center text-text-tertiary text-xs flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-6 h-6 animate-spin text-brand-orange" />
            Loading vendor comprehensive profiles...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Modal Header Profile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/40 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                {vendorDetail.profile.profile_pic ? (
                  <img src={vendorDetail.profile.profile_pic} alt={vendorDetail.profile.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-base font-black">
                    {(vendorDetail.profile.vendorProfile?.shopName || vendorDetail.profile.name || 'V')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    {vendorDetail.profile.vendorProfile?.shopName || 'No Shop Name'}
                    <AdminStatusBadge status={vendorDetail.profile.is_banned ? 'Blocked' : vendorDetail.profile.is_active ? 'Active' : 'Suspended'} />
                  </h4>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Vendor Partner: <span className="font-bold text-text-secondary">{vendorDetail.profile.name}</span> • ID: <span className="font-mono text-text-secondary select-all">{vendorDetail.profile.id}</span>
                  </p>
                </div>
              </div>

              {/* Quick statistics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">SALES</span>
                  <span className="text-xs font-black text-brand-orange mt-0.5 block">₹{vendorDetail.stats.total_sales_volume.toLocaleString()}</span>
                </div>
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">WALLET</span>
                  <span className="text-xs font-black text-emerald-500 mt-0.5 block">₹{(vendorDetail.wallet.balance_inr_paise / 100).toLocaleString()}</span>
                </div>
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">PRODUCTS</span>
                  <span className="text-xs font-black text-purple-500 mt-0.5 block">{vendorDetail.stats.active_listings}/{vendorDetail.stats.total_listings}</span>
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border overflow-x-auto gap-2">
              {[
                { id: 'overview', label: 'Overview & Shop', icon: FiBriefcase },
                { id: 'listings', label: 'Products & Listings', icon: FiShoppingBag },
                { id: 'sales', label: 'Sales & Orders', icon: FiDollarSign },
                { id: 'reviews', label: 'Reviews Received', icon: FiStar },
                { id: 'logs', label: 'Activity & Security Logs', icon: FiFileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <tab.icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="min-h-[300px] overflow-y-auto max-h-[50vh] pr-2">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Data details */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Shop & Contact Info</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Email', vendorDetail.profile.email],
                        ['Phone', vendorDetail.profile.phone],
                        ['KYC verification', vendorDetail.profile.kyc_status.toUpperCase()],
                        ['Wallet status', vendorDetail.wallet.is_frozen ? 'Frozen' : 'Active'],
                        ['GSTIN', vendorDetail.profile.vendorProfile?.gst || '—'],
                        ['PAN number', vendorDetail.profile.vendorProfile?.pan || '—'],
                        ['Aadhaar number', vendorDetail.profile.vendorProfile?.aadhaar || '—'],
                        ['Shop category', vendorDetail.profile.vendorProfile?.category || '—'],
                        ['Registered on', new Date(vendorDetail.profile.created_at).toLocaleString()],
                        ['Last login', vendorDetail.profile.lastLoginAt ? new Date(vendorDetail.profile.lastLoginAt).toLocaleString() : 'Never'],
                        ['Last login IP', vendorDetail.profile.lastLoginIp || '—']
                      ].map(([label, val]) => (
                        <div key={label} className="bg-surface-secondary p-2.5 rounded-xl border border-border/50">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase block">{label}</span>
                          <span className="text-xs text-text-primary font-semibold mt-0.5 block">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1 pt-2">Business Address</h5>
                    <div className="bg-surface-secondary p-3 rounded-xl border border-border text-xs text-text-secondary">
                      {vendorDetail.profile.businessAddress ? (
                        <p>{vendorDetail.profile.businessAddress}</p>
                      ) : (
                        <p className="text-text-tertiary text-center py-2">No saved business address.</p>
                      )}
                    </div>

                    {/* Settlement details */}
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1 pt-2">Settlement Details</h5>
                    <div className="bg-surface-secondary p-3 rounded-xl border border-border text-xs text-text-secondary space-y-1">
                      <p><span className="font-bold text-text-primary">Bank Account:</span> {vendorDetail.profile.vendorProfile?.paymentDetails?.bankAccount || '—'}</p>
                      <p><span className="font-bold text-text-primary">IFSC Code:</span> {vendorDetail.profile.vendorProfile?.paymentDetails?.ifscCode || '—'}</p>
                      <p><span className="font-bold text-text-primary">UPI ID:</span> {vendorDetail.profile.vendorProfile?.paymentDetails?.upiId || '—'}</p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Status Timeline</h5>
                    <div className="space-y-2.5">
                      {(vendorDetail?.timeline || []).length === 0 ? (
                        <p className="text-xs text-text-tertiary py-6 text-center">No timeline activity logged.</p>
                      ) : (
                        (vendorDetail?.timeline || []).slice(0, 5).map((t, idx) => (
                          <div key={t.id || idx} className="flex gap-2 text-xs">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-brand-orange mt-1 flex-shrink-0" />
                              <div className="w-0.5 h-full bg-border" />
                            </div>
                            <div className="flex-1 bg-surface-secondary border border-border p-2.5 rounded-xl">
                              <span className="text-[9px] font-bold text-text-tertiary block">{new Date(t.created_at).toLocaleString()}</span>
                              <span className="font-bold text-text-primary block mt-0.5">{t.action.replace('USER_', '')}</span>
                              <span className="text-text-secondary mt-0.5 block">{t.description}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS & LISTINGS */}
              {activeTab === 'listings' && (
                <div className="space-y-2">
                  <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Products & Listings</h5>
                  <div className="overflow-x-auto max-h-[400px] border border-border rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                        <tr className="border-b border-border">
                          <th className="p-2.5">Date Created</th>
                          <th className="p-2.5">Listing Title</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vendorDetail?.listings || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-text-tertiary">No products published.</td>
                          </tr>
                        ) : (
                          (vendorDetail?.listings || []).map(l => (
                            <tr key={l.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                              <td className="p-2">{new Date(l.created_at).toLocaleDateString()}</td>
                              <td className="p-2 font-bold text-text-primary">{l.title}</td>
                              <td className="p-2 capitalize">{l.category}</td>
                              <td className="p-2 text-right font-extrabold text-brand-orange">₹{l.price.toLocaleString()}</td>
                              <td className="p-2 text-right capitalize">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  l.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {l.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SALES & ORDERS */}
              {activeTab === 'sales' && (
                <div className="space-y-2">
                  <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Completed Deals & Orders</h5>
                  <div className="overflow-x-auto max-h-[400px] border border-border rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                        <tr className="border-b border-border">
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5 text-right">Settled Amount</th>
                          <th className="p-2.5 text-right">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vendorDetail?.sales || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-text-tertiary">No sales logged.</td>
                          </tr>
                        ) : (
                          (vendorDetail?.sales || []).map(s => (
                            <tr key={s.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                              <td className="p-2">{new Date(s.created_at).toLocaleDateString()}</td>
                              <td className="p-2 font-bold text-text-primary">{s.customer_name}</td>
                              <td className="p-2">{s.item_name}</td>
                              <td className="p-2 capitalize">{s.type}</td>
                              <td className="p-2 text-right font-extrabold text-emerald-500">₹{s.price.toLocaleString()}</td>
                              <td className="p-2 text-right capitalize">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  s.payment_status === 'paid' || s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {s.payment_status || s.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: REVIEWS RECEIVED */}
              {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reviews written */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Reviews Received</h5>
                    <div className="space-y-2">
                      {(vendorDetail?.reviews || []).length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">No reviews received.</p>
                      ) : (
                        (vendorDetail?.reviews || []).map(r => (
                          <div key={r.id} className="bg-surface-secondary border border-border p-3 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-500">{'★'.repeat(r.rating)}</span>
                              <span className="text-[9px] text-text-tertiary">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-text-secondary italic">"{r.comment}"</p>
                            <span className="text-[9px] text-text-tertiary block capitalize">Target type: {r.target_type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Customer Inquiries */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Product Inquiries</h5>
                    <div className="space-y-2">
                      {(vendorDetail?.inquiries || []).length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">No product inquiries logged.</p>
                      ) : (
                        (vendorDetail?.inquiries || []).map(inq => (
                          <div key={inq.id} className="bg-surface-secondary border border-border p-3 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                              <span className="font-bold text-text-primary">{inq.listing?.title || 'General Inquiry'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                inq.status === 'closed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {inq.status}
                              </span>
                            </div>
                            <p className="text-text-secondary font-medium">"{inq.message}"</p>
                            <div className="flex items-center justify-between text-[9px] text-text-tertiary">
                              <span>From: {inq.customer?.name || 'Customer'}</span>
                              <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ACTIVITY & AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {/* Activity logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Activity Log</h5>
                    <div className="overflow-x-auto max-h-[200px] border border-border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                          <tr className="border-b border-border">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Action</th>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5">IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(vendorDetail?.activityLogs || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-text-tertiary">No activity logged.</td>
                            </tr>
                          ) : (
                            (vendorDetail?.activityLogs || []).map(l => (
                              <tr key={l.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                                <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                                <td className="p-2 font-bold text-text-primary">{l.action}</td>
                                <td className="p-2">{l.description}</td>
                                <td className="p-2 font-mono text-[10px] text-text-tertiary">{l.ip}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Login history */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Login History</h5>
                    <div className="overflow-x-auto max-h-[200px] border border-border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                          <tr className="border-b border-border">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">IP Address</th>
                            <th className="p-2.5">User Agent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(vendorDetail?.loginHistory || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-text-tertiary">No login history recorded.</td>
                            </tr>
                          ) : (
                            (vendorDetail?.loginHistory || []).map(l => (
                              <tr key={l.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                                <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                                <td className="p-2 font-bold text-text-primary">{l.action.replace('USER_', '')}</td>
                                <td className="p-2 font-mono text-[10px] text-text-tertiary">{l.ip}</td>
                                <td className="p-2 text-[10px] text-text-tertiary truncate max-w-[200px]" title={l.user_agent}>{l.user_agent}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

