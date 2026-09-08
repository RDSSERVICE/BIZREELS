import React, { useState } from 'react';
import {
  FiBriefcase, FiEye, FiCheckCircle, FiLock, FiUnlock, FiSlash, FiTrash2, FiClock, FiX,
  FiCheck, FiFilter, FiActivity, FiSearch, FiDollarSign, FiShoppingBag, FiStar,
  FiArrowUpRight, FiCalendar, FiRefreshCw, FiMapPin, FiUserCheck, FiGift, FiBell,
  FiShield, FiFileText, FiCreditCard, FiDownload, FiPauseCircle, FiCopy, FiExternalLink,
  FiPhone, FiMail, FiKey
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, API_BASE } from '../../../lib/api';
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
  useDeleteVendorMutation,
  useApproveKycMutation,
  useRejectKycMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation,
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
  const [logTab, setLogTab] = useState('activity'); // 'activity' | 'login'
  const [copiedId, setCopiedId] = useState(false);
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
  const [deleteVendor] = useDeleteVendorMutation();
  const [approveKyc] = useApproveKycMutation();
  const [freezeWallet] = useFreezeWalletMutation();
  const [unfreezeWallet] = useUnfreezeWalletMutation();

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
      } else if (action === 'freeze') {
        if (!window.confirm(`Freeze wallet for "${userName}"? This blocks withdrawals and outgoing transactions.`)) return;
        await freezeWallet(userId).unwrap();
        toast.success(`Wallet for "${userName}" has been frozen`);
      } else if (action === 'unfreeze') {
        await unfreezeWallet(userId).unwrap();
        toast.success(`Wallet for "${userName}" has been unfrozen`);
      } else if (action === 'delete') {
        if (!window.confirm(`Delete Vendor role and data for "${userName}"? This will not delete other roles.`)) return;
        await deleteVendor(userId).unwrap();
        toast.success(`Vendor "${userName}" role and data deleted`);
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
  const handleExport = async () => {
    try {
      const query = new URLSearchParams({
        q: search || '',
        status: status || '',
        kyc_status: kycStatus || '',
        from: fromDate || '',
        to: toDate || '',
        sort: sort || 'newest_first',
      }).toString();

      const response = await api.get(`/v1/admin/vendors/export?${query}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV Export downloaded successfully');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export vendor records');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Vendor Management Console"
        subtitle="Manage verified business profiles, review compliance & tax registrations, inspect products, track sales volume, and moderate stores."
      />

      {/* --- DASHBOARD STATISTICS --- */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] h-24 animate-pulse shadow-2xs" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Total Vendors', val: stats?.totalVendors, trend: stats?.growthTrend, icon: FiBriefcase },
            { label: 'Active Vendors', val: stats?.activeVendors, sub: 'Not blocked/suspended', icon: FiUserCheck },
            { label: 'Verified Partners', val: stats?.verifiedVendors, sub: 'KYC Approved', icon: FiShield },
            { label: 'Total Sales Volume', val: `₹${(stats?.totalSales || 0).toLocaleString('en-IN')}`, sub: 'All transactions volume', icon: FiDollarSign },
            { label: 'Active Products', val: `${stats?.activeListings || 0} / ${stats?.totalListings || 0}`, sub: 'Published products', icon: FiShoppingBag }
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs hover:shadow-xs flex items-center justify-between transition-all">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-widest block truncate">{card.label}</span>
                <span className="text-xl sm:text-2xl font-black text-[#1a1a1a] mt-1 block truncate tracking-tight">{card.val ?? 0}</span>
                {card.trend !== undefined ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-extrabold inline-flex items-center gap-0.5 mt-1">
                    <FiArrowUpRight className="w-3.5 h-3.5" /> +{card.trend}% (30d)
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8c827a] mt-1 block font-medium truncate">{card.sub}</span>
                )}
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] flex items-center justify-center shrink-0 shadow-2xs">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="bg-[#fbf9f4] rounded-2xl border border-[#e3dccb] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-[#d99a3d] flex items-center justify-center">
              <FiFilter className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">Search & Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white text-[11px] font-bold text-[#1a1a1a] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-[11px] font-bold text-[#d99a3d] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export Data (CSV)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c827a]" />
            <input
              type="text"
              placeholder="Search by shop, business, name, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all shadow-2xs"
            />
          </div>

          {/* Account Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all shadow-2xs"
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
            className="px-4 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all shadow-2xs"
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
            className="px-4 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all shadow-2xs"
          >
            <option value="newest_first">Newest First</option>
            <option value="oldest_first">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="highest_sales">Highest Sales</option>
            <option value="most_listings">Most Listings</option>
            <option value="last_login">Recent Login</option>
          </select>
        </div>
      </div>

      {/* --- VENDORS DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
              <tr>
                <th className="p-3.5">Vendor / Shop</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5 text-center">KYC Status</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Products</th>
                <th className="p-3.5 text-right">Sales Volume</th>
                <th className="p-3.5 text-right">Wallet</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]">
              {loadingVendors ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[#8c827a]">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1a1a1a]" />
                    <span className="font-bold">Retrieving registered vendor profiles...</span>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[#8c827a]">
                    <FiBriefcase className="w-8 h-8 mx-auto mb-2 text-[#8c827a]" />
                    <span className="font-bold text-sm block text-[#1a1a1a]">No vendors found</span>
                    <span className="text-xs">Try adjusting your search criteria or status filters.</span>
                  </td>
                </tr>
              ) : (
                vendors.map((v) => {
                  const shopName = v.vendorProfile?.shopName || v.vendorProfile?.businessName || v.name;
                  return (
                    <tr key={v.id} className="hover:bg-[#fbf9f4] transition-all group">
                      {/* Shop Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {v.profile_pic ? (
                            <img src={v.profile_pic} alt={v.name} className="w-9 h-9 rounded-xl object-cover border border-[#e3dccb] shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] text-[#d99a3d] font-black text-xs flex items-center justify-center shrink-0">
                              {(shopName || 'V')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-black text-[#1a1a1a] block truncate text-xs group-hover:text-black">
                              {shopName}
                            </span>
                            <span className="text-[10px] text-[#8c827a] block truncate font-semibold">
                              Owner: {v.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <div className="text-[#1a1a1a] font-semibold text-[11px]">
                          {v.email || '—'}
                        </div>
                        <div className="text-[10px] text-[#8c827a] font-medium mt-0.5">
                          {v.phone || '—'}
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          v.kyc_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.kyc_status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {v.kyc_status || 'unverified'}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="p-3.5 text-center">
                        <AdminStatusBadge status={v.is_banned ? 'Blocked' : v.is_active ? 'Active' : 'Suspended'} />
                      </td>

                      {/* Products */}
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-[#1a1a1a] bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb] text-[11px]">
                          {v.active_listings || 0} / {v.total_listings || 0}
                        </span>
                      </td>

                      {/* Sales Volume */}
                      <td className="p-3.5 text-right font-black text-[#1a1a1a] whitespace-nowrap">
                        ₹{(v.total_sales || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Wallet */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="font-black text-emerald-700">
                          ₹{((v.wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}
                        </div>
                        {v.wallet?.is_frozen && (
                          <span className="text-[9px] text-rose-600 font-bold block">🔒 Frozen</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUserId(v.id);
                              setActiveTab('overview');
                              setModalType('view');
                            }}
                            className="px-2.5 py-1 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="View Vendor Dossier"
                          >
                            <FiEye className="w-3.5 h-3.5" /> View
                          </button>
                          {v.wallet?.is_frozen ? (
                            <button
                              onClick={() => handleAction('unfreeze', v.id, shopName)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-black transition cursor-pointer"
                              title="Unfreeze Wallet"
                            >
                              <FiUnlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('freeze', v.id, shopName)}
                              className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-black transition cursor-pointer"
                              title="Freeze Wallet"
                            >
                              <FiLock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(v.is_banned ? 'unban' : 'ban', v.id, shopName)}
                            className={`p-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                              v.is_banned
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title={v.is_banned ? 'Unblock Vendor' : 'Block Vendor'}
                          >
                            <FiSlash className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAction('delete', v.id, shopName)}
                            className="p-1.5 bg-[#f8f4ec] text-[#8c827a] hover:text-rose-600 hover:bg-rose-50 border border-[#e3dccb] rounded-lg text-xs transition cursor-pointer"
                            title="Delete Vendor Role"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-[#8c827a] font-bold">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of {totalItems} vendor records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                    page === i + 1
                      ? 'bg-[#1a1a1a] text-[#d99a3d] shadow-2xs'
                      : 'hover:bg-white text-[#5c554e] border border-[#e3dccb]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            <label className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block mb-1">New Password *</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setModalType(null); setSelectedUserId(null); }}
              className="px-4 py-2 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl text-xs font-black hover:bg-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resettingPw}
              className="px-5 py-2 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiKey className="w-3.5 h-3.5" />
              {resettingPw ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
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
            <label className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block mb-1">Reason for Rejection *</label>
            <textarea
              placeholder="Specify discrepancy, illegible tax document, or missing compliance fields..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] min-h-[100px] transition-all"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setModalType(null); setSelectedUserId(null); }}
              className="px-4 py-2 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl text-xs font-black hover:bg-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejecting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiSlash className="w-3.5 h-3.5" />
              {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- DETAILED VIEW MODAL: VENDOR WORKSPACE DOSSIER --- */}
      <AdminModal
        isOpen={modalType === 'view'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Vendor Workspace Dossier"
        maxWidth="max-w-5xl"
      >
        {loadingDetail || !vendorDetail ? (
          <div className="py-24 text-center text-[#8c827a] text-xs flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-6 h-6 animate-spin text-[#1a1a1a]" />
            <span className="font-bold">Retrieving vendor workspace telemetry & compliance dossier...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Modal Header Profile Card */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {vendorDetail.profile.profile_pic ? (
                    <img
                      src={vendorDetail.profile.profile_pic}
                      alt={vendorDetail.profile.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#e3dccb] shadow-2xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center text-lg font-black shadow-2xs">
                      {((vendorDetail.profile.vendorProfile?.shopName || vendorDetail.profile.name || 'V')[0]).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-[#1a1a1a] tracking-tight">
                        {vendorDetail.profile.vendorProfile?.shopName || vendorDetail.profile.vendorProfile?.businessName || vendorDetail.profile.name}
                      </h4>
                      <AdminStatusBadge status={vendorDetail.profile.is_banned ? 'Blocked' : vendorDetail.profile.is_active ? 'Active' : 'Suspended'} />
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        vendorDetail.profile.kyc_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : vendorDetail.profile.kyc_status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        KYC {vendorDetail.profile.kyc_status || 'unverified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8c827a] mt-1 font-semibold flex-wrap">
                      <span>Owner: <strong className="text-[#1a1a1a]">{vendorDetail.profile.name}</strong></span>
                      <span className="text-[#e3dccb]">•</span>
                      <span>ID:</span>
                      <code className="font-mono text-[#1a1a1a] bg-white px-1.5 py-0.5 rounded border border-[#e3dccb]">
                        {vendorDetail.profile.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vendorDetail.profile.id);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                          toast.success('Vendor ID copied');
                        }}
                        className="text-[#1a1a1a] hover:text-black transition cursor-pointer"
                        title="Copy ID"
                      >
                        {copiedId ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[#e3dccb]">•</span>
                      <span>Roles:</span>
                      {(vendorDetail.profile.roles || ['vendor']).map(r => (
                        <span key={r} className="bg-white text-[#1a1a1a] px-1.5 py-0.5 rounded text-[10px] font-black uppercase border border-[#e3dccb]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick KPI Counters */}
                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">SALES</span>
                    <span className="text-sm sm:text-base font-black text-[#1a1a1a] mt-0.5 block tracking-tight">
                      ₹{(vendorDetail.stats?.total_sales_volume || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">WALLET</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 mt-0.5 block tracking-tight">
                      ₹{((vendorDetail.wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[8px] font-bold text-[#8c827a] block">
                      {vendorDetail.wallet?.is_frozen ? '🔒 Frozen' : '✓ Active'}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">PRODUCTS</span>
                    <span className="text-sm sm:text-base font-black text-[#d99a3d] mt-0.5 block tracking-tight">
                      {vendorDetail.stats?.active_listings || 0}/{vendorDetail.stats?.total_listings || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Quick Operational Actions */}
              <div className="pt-3 border-t border-[#e3dccb] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {vendorDetail.profile.kyc_status !== 'approved' && (
                    <button
                      onClick={() => handleAction('verify', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" /> Approve KYC
                    </button>
                  )}
                  {vendorDetail.profile.kyc_status === 'pending' && (
                    <button
                      onClick={() => { setModalType('reject-kyc'); setSelectedUserId(vendorDetail.profile.id); }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5" /> Reject KYC
                    </button>
                  )}
                  {vendorDetail.wallet?.is_frozen ? (
                    <button
                      onClick={() => handleAction('unfreeze', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUnlock className="w-3.5 h-3.5" /> Unfreeze Wallet
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('freeze', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiLock className="w-3.5 h-3.5" /> Freeze Wallet
                    </button>
                  )}
                  {vendorDetail.profile.is_banned ? (
                    <button
                      onClick={() => handleAction('unban', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUserCheck className="w-3.5 h-3.5" /> Unblock Vendor
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('ban', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5" /> Block Vendor
                    </button>
                  )}
                  {vendorDetail.profile.is_active ? (
                    <button
                      onClick={() => handleAction('suspend', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiPauseCircle className="w-3.5 h-3.5" /> Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('activate', vendorDetail.profile.id, vendorDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setModalType('reset-password'); setSelectedUserId(vendorDetail.profile.id); }}
                    className="px-3 py-1.5 bg-white text-[#1a1a1a] border border-[#e3dccb] hover:bg-[#f8f4ec] rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiKey className="w-3.5 h-3.5 text-[#d99a3d]" /> Reset Password
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-[#e3dccb] overflow-x-auto gap-2 pb-1.5">
              {[
                { id: 'overview', label: 'Overview & Shop', icon: FiBriefcase },
                { id: 'listings', label: 'Products & Listings', icon: FiShoppingBag, count: vendorDetail.listings?.length || 0 },
                { id: 'sales', label: 'Sales & Orders', icon: FiDollarSign, count: vendorDetail.sales?.length || 0 },
                { id: 'reviews', label: 'Reviews Received', icon: FiStar, count: vendorDetail.reviews?.length || 0 },
                { id: 'logs', label: 'Activity & Security Logs', icon: FiFileText, count: (vendorDetail.activityLogs?.length || 0) + (vendorDetail.loginHistory?.length || 0) },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#1a1a1a] text-[#d99a3d] shadow-xs'
                      : 'bg-[#f8f4ec] text-[#5c554e] border border-[#e3dccb] hover:bg-white hover:text-[#1a1a1a]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-[#8c827a] border border-[#e3dccb]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="min-h-[360px] overflow-y-auto max-h-[55vh] pr-1.5">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Shop & Contact Info */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5">
                      Shop &amp; Contact Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Email', vendorDetail.profile.email],
                        ['Phone', vendorDetail.profile.phone],
                        ['KYC Status', (vendorDetail.profile.kyc_status || 'unverified').toUpperCase()],
                        ['Verification Tier', vendorDetail.profile.vendorProfile?.verificationStatus || 'BASIC'],
                        ['GSTIN', vendorDetail.profile.vendorProfile?.documents?.gst?.docNumber || vendorDetail.profile.vendorProfile?.gst || '—'],
                        ['GST Trade Name', vendorDetail.profile.vendorProfile?.documents?.gst?.tradeName || vendorDetail.profile.vendorProfile?.documents?.gst?.legalName || '—'],
                        ['PAN number', vendorDetail.profile.vendorProfile?.documents?.pan?.docNumber || vendorDetail.profile.vendorProfile?.pan || '—'],
                        ['PAN Taxpayer Name', vendorDetail.profile.vendorProfile?.documents?.pan?.fullName || '—'],
                        ['Aadhaar (UIDAI)', vendorDetail.profile.vendorProfile?.documents?.aadhaar?.maskedNumber || vendorDetail.profile.vendorProfile?.aadhaar || '—'],
                        ['Aadhaar Holder', vendorDetail.profile.vendorProfile?.documents?.aadhaar?.fullName || '—'],
                        ['Shop Category', vendorDetail.profile.vendorProfile?.category || 'General Store'],
                        ['Business Address', vendorDetail.profile.businessAddress || '—'],
                        ['Registered on', vendorDetail.profile.created_at ? new Date(vendorDetail.profile.created_at).toLocaleString() : '—'],
                        ['Last login', vendorDetail.profile.lastLoginAt ? new Date(vendorDetail.profile.lastLoginAt).toLocaleString() : 'Never'],
                        ['Last login IP', vendorDetail.profile.lastLoginIp || '127.0.0.1']
                      ].map(([label, val]) => (
                        <div key={label} className="bg-[#f8f4ec] p-2.5 rounded-xl border border-[#e3dccb]">
                          <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">{label}</span>
                          <span className="text-xs text-[#1a1a1a] font-bold mt-0.5 block truncate" title={val}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5">
                      Lifecycle &amp; Status Timeline ({vendorDetail?.timeline?.length || 0})
                    </h5>
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {(vendorDetail?.timeline || []).length === 0 ? (
                        <div className="p-8 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] text-center text-[#8c827a] text-xs font-medium">
                          No timeline activity logged.
                        </div>
                      ) : (
                        (vendorDetail?.timeline || []).map((t, idx) => (
                          <div key={t.id || idx} className="flex gap-3 text-xs">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-[#1a1a1a] mt-1 border-2 border-[#d99a3d] shrink-0" />
                              <div className="w-0.5 h-full bg-[#e3dccb]" />
                            </div>
                            <div className="flex-1 bg-[#f8f4ec] border border-[#e3dccb] p-2.5 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-[#1a1a1a] block">
                                  {t.action.replace('USER_', '').replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] font-semibold text-[#8c827a]">
                                  {new Date(t.created_at).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#5c554e] font-medium mt-0.5 block leading-normal">
                                {t.description}
                              </span>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Published Products &amp; Services
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Catalog of items published by this vendor shop.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {vendorDetail.listings?.length || 0} Total Listings
                    </span>
                  </div>

                  {(vendorDetail?.listings || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiShoppingBag className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Listings Published</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This vendor has not added any products or services to the marketplace yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {vendorDetail.listings.map(l => (
                        <div key={l.id} className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-3.5 space-y-2 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#1a1a1a] text-[#d99a3d]">
                                {l.category || 'General'}
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                l.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {l.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-[#1a1a1a] line-clamp-2" title={l.title}>
                              {l.title}
                            </h4>
                          </div>
                          <div className="pt-2 border-t border-[#e3dccb] flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-bold text-[#8c827a] block">PRICE</span>
                              <span className="text-xs font-black text-[#1a1a1a]">₹{(l.price || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-[#8c827a] block">VIEWS</span>
                              <span className="text-xs font-black text-[#5c554e]">{(l.views || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SALES & ORDERS */}
              {activeTab === 'sales' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Customer Orders &amp; Negotiated Deals
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Track product order fulfillment, customer transactions, and deal closures.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {vendorDetail.sales?.length || 0} Orders
                    </span>
                  </div>

                  {(vendorDetail?.sales || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiDollarSign className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Sales Recorded</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This vendor has not fulfilled any customer orders yet.</p>
                    </div>
                  ) : (
                    <div className="border border-[#e3dccb] rounded-2xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Item / Service</th>
                            <th className="p-3 text-center">Quantity</th>
                            <th className="p-3 text-right">Price</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e3dccb]">
                          {vendorDetail.sales.map(s => (
                            <tr key={s.id} className="hover:bg-[#fbf9f4] transition">
                              <td className="p-3 text-[#8c827a] font-semibold whitespace-nowrap">
                                {new Date(s.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-bold text-[#1a1a1a]">
                                <div>{s.customer_name}</div>
                                {s.customer_phone && <div className="text-[10px] text-[#8c827a] font-normal">{s.customer_phone}</div>}
                              </td>
                              <td className="p-3 text-[#1a1a1a] font-semibold max-w-[200px] truncate" title={s.item_name}>
                                {s.item_name}
                              </td>
                              <td className="p-3 text-center font-bold text-[#5c554e]">
                                {s.quantity}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700 whitespace-nowrap">
                                ₹{(s.price || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  s.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : s.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  s.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {s.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REVIEWS RECEIVED */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Customer Reviews &amp; Ratings
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Feedback left by buyers who purchased products or services from this vendor.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {vendorDetail.reviews?.length || 0} Reviews
                    </span>
                  </div>

                  {(vendorDetail?.reviews || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiStar className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Reviews Yet</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This vendor has not received customer reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vendorDetail.reviews.map(r => (
                        <div key={r.id} className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-2xl space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {r.author?.profile_pic ? (
                                <img src={r.author.profile_pic} alt={r.author.name} className="w-8 h-8 rounded-full object-cover border border-[#e3dccb]" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-[#d99a3d] font-bold text-xs flex items-center justify-center">
                                  {(r.author?.name || 'C')[0]}
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-black text-[#1a1a1a] block">{r.author?.name || 'Customer Reviewer'}</span>
                                {r.author?.email && <span className="text-[10px] text-[#8c827a] block">{r.author.email}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-[#d99a3d] block">
                                {'★'.repeat(r.rating || 5)}
                              </span>
                              <span className="text-[9px] text-[#8c827a] block font-medium">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#5c554e] italic font-medium bg-white p-3 rounded-xl border border-[#e3dccb]">
                            "{r.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ACTIVITY & SECURITY LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {/* Sub-tabs switcher */}
                  <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-2">
                    <button
                      onClick={() => setLogTab('activity')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        logTab === 'activity'
                          ? 'bg-[#1a1a1a] text-white shadow-xs'
                          : 'bg-[#f8f4ec] text-[#8c827a] border border-[#e3dccb] hover:bg-white hover:text-[#1a1a1a]'
                      }`}
                    >
                      Activity Logs ({vendorDetail.activityLogs?.length || 0})
                    </button>
                    <button
                      onClick={() => setLogTab('login')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        logTab === 'login'
                          ? 'bg-[#1a1a1a] text-white shadow-xs'
                          : 'bg-[#f8f4ec] text-[#8c827a] border border-[#e3dccb] hover:bg-white hover:text-[#1a1a1a]'
                      }`}
                    >
                      Login Security History ({vendorDetail.loginHistory?.length || 0})
                    </button>
                  </div>

                  {logTab === 'activity' ? (
                    <div className="space-y-2">
                      <div className="border border-[#e3dccb] rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
                            <tr>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Action Type</th>
                              <th className="p-3">Event Description</th>
                              <th className="p-3 text-right">IP Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e3dccb]">
                            {(vendorDetail?.activityLogs || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No activity logs recorded.
                                </td>
                              </tr>
                            ) : (
                              vendorDetail.activityLogs.map(l => (
                                <tr key={l.id} className="hover:bg-[#fbf9f4] transition">
                                  <td className="p-3 text-[#8c827a] font-medium whitespace-nowrap">
                                    {new Date(l.created_at).toLocaleString()}
                                  </td>
                                  <td className="p-3 font-bold text-[#1a1a1a] whitespace-nowrap">
                                    <span className="bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb] text-[10px] font-black">
                                      {l.action}
                                    </span>
                                  </td>
                                  <td className="p-3 text-[#5c554e] font-medium">
                                    {l.description}
                                  </td>
                                  <td className="p-3 text-right font-mono text-[10px] text-[#8c827a] whitespace-nowrap">
                                    {l.ip}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border border-[#e3dccb] rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
                            <tr>
                              <th className="p-3">Date &amp; Time</th>
                              <th className="p-3">Auth Event</th>
                              <th className="p-3">IP Address</th>
                              <th className="p-3">Client User Agent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e3dccb]">
                            {(vendorDetail?.loginHistory || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No login history recorded.
                                </td>
                              </tr>
                            ) : (
                              vendorDetail.loginHistory.map(l => (
                                <tr key={l.id} className="hover:bg-[#fbf9f4] transition">
                                  <td className="p-3 text-[#8c827a] font-medium whitespace-nowrap">
                                    {new Date(l.created_at).toLocaleString()}
                                  </td>
                                  <td className="p-3 font-black text-[#1a1a1a] whitespace-nowrap">
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                                      {l.action.replace('USER_', '')}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-[10px] text-[#8c827a] whitespace-nowrap">
                                    {l.ip}
                                  </td>
                                  <td className="p-3 text-[11px] text-[#8c827a] truncate max-w-[260px]" title={l.user_agent}>
                                    {l.user_agent}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="pt-3 border-t border-[#e3dccb] flex justify-end">
              <button
                onClick={() => { setModalType(null); setSelectedUserId(null); }}
                className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
