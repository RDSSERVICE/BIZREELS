import React, { useState } from 'react';
import {
  FiFilm, FiEye, FiCheckCircle, FiLock, FiSlash, FiTrash2, FiClock, FiX,
  FiFilter, FiActivity, FiSearch, FiDollarSign, FiShoppingBag, FiStar,
  FiArrowUpRight, FiCalendar, FiRefreshCw, FiMapPin, FiUserCheck, FiGift, FiBell,
  FiShield, FiFileText, FiDownload, FiPauseCircle, FiPlay, FiCopy, FiCheck,
  FiExternalLink, FiVideo, FiKey, FiUnlock, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, API_BASE } from '../../../lib/api';
import {
  useListAdminCreatorsQuery,
  useGetCreatorDetailQuery,
  useGetCreatorStatsQuery,
  useResetCustomerPasswordMutation,
  useVerifyCustomerAccountMutation,
  useActivateCustomerAccountMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteCreatorMutation,
  useRejectKycMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation
} from '../../../features/admin/adminApi';

export default function AdminCreators() {
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
  const [activeTab, setActiveTab] = useState('overview'); // tabs in View modal: overview | reels | campaigns | reviews | logs
  const [logTab, setLogTab] = useState('activity'); // activity | login
  const [previewReel, setPreviewReel] = useState(null); // video modal
  const [copiedId, setCopiedId] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // API hooks
  const { data: creatorData, isFetching: loadingCreators } = useListAdminCreatorsQuery({
    q: search || undefined,
    status: status || undefined,
    kyc_status: kycStatus || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sort: sort || undefined,
    page,
    limit: 10,
  });

  const { data: stats, isFetching: loadingStats } = useGetCreatorStatsQuery();

  const { data: creatorDetail, isFetching: loadingDetail } = useGetCreatorDetailQuery(selectedUserId, {
    skip: !selectedUserId || modalType !== 'view',
  });

  const [resetPassword, { isLoading: resettingPw }] = useResetCustomerPasswordMutation();
  const [verifyAccount] = useVerifyCustomerAccountMutation();
  const [rejectKyc, { isLoading: rejecting }] = useRejectKycMutation();
  const [activateAccount] = useActivateCustomerAccountMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [suspendUser] = useSuspendUserMutation();
  const [deleteCreator] = useDeleteCreatorMutation();
  const [freezeWallet] = useFreezeWalletMutation();
  const [unfreezeWallet] = useUnfreezeWalletMutation();

  const creators = creatorData?.items || [];
  const totalPages = creatorData?.pages || 1;
  const totalItems = creatorData?.total || 0;

  // Handle Operations
  const handleAction = async (action, userId, userName) => {
    try {
      if (action === 'ban') {
        if (!window.confirm(`Block creator "${userName}"? This blocks login instantly.`)) return;
        await banUser(userId).unwrap();
        toast.success(`Creator "${userName}" has been blocked`);
      } else if (action === 'unban') {
        await unbanUser(userId).unwrap();
        toast.success(`Creator "${userName}" has been unblocked`);
      } else if (action === 'suspend') {
        if (!window.confirm(`Suspend creator "${userName}"?`)) return;
        await suspendUser(userId).unwrap();
        toast.success(`Creator "${userName}" has been suspended`);
      } else if (action === 'activate') {
        await activateAccount(userId).unwrap();
        toast.success(`Creator "${userName}" has been activated`);
      } else if (action === 'verify') {
        if (!window.confirm(`Verify and approve KYC for "${userName}"?`)) return;
        await verifyAccount(userId).unwrap();
        toast.success(`Creator "${userName}" KYC status is now verified`);
      } else if (action === 'freeze') {
        if (!window.confirm(`Freeze wallet for "${userName}"?`)) return;
        await freezeWallet(userId).unwrap();
        toast.success(`Creator "${userName}" wallet has been frozen`);
      } else if (action === 'unfreeze') {
        await unfreezeWallet(userId).unwrap();
        toast.success(`Creator "${userName}" wallet has been unfrozen`);
      } else if (action === 'delete') {
        if (!window.confirm(`Delete Creator role and data for "${userName}"? This will not delete other roles.`)) return;
        await deleteCreator(userId).unwrap();
        toast.success(`Creator "${userName}" role and data deleted`);
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
      toast.success('Creator password reset successfully');
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
      toast.success('Creator KYC rejected with reason logged');
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

      const response = await api.get(`/v1/admin/creators/export?${query}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `creators_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV Export downloaded successfully');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export creator records');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiFilm}
        title="Creator Management Console"
        subtitle="Manage creator profiles, review KYC documents, monitor video uploads, check earnings, and configure roles."
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
            { label: 'Total Creators', val: stats?.totalCreators, trend: stats?.growthTrend, icon: FiFilm },
            { label: 'Active Creators', val: stats?.activeCreators, sub: 'Not banned/suspended', icon: FiUserCheck },
            { label: 'Verified Creators', val: stats?.verifiedCreators, sub: 'KYC Approved', icon: FiShield },
            { label: 'Total Earnings', val: `₹${(stats?.totalEarnings || 0).toLocaleString('en-IN')}`, sub: 'Settled campaign budgets', icon: FiDollarSign },
            { label: 'Reels / Campaigns', val: `${stats?.totalReels || 0} / ${stats?.totalCampaigns || 0}`, sub: 'Published clips', icon: FiShoppingBag }
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs hover:shadow-xs flex items-center justify-between transition-all">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">{card.label}</span>
                <span className="text-xl sm:text-2xl font-black text-[#1a1a1a] mt-1 block truncate tracking-tight">{card.val ?? 0}</span>
                {card.trend !== undefined ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-extrabold inline-flex items-center gap-0.5 mt-1">
                    <FiArrowUpRight className="w-3.5 h-3.5" /> +{card.trend}% (30d)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-1 block font-medium truncate">{card.sub}</span>
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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#e3dccb] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
              <FiFilter className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Search & Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4.5 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-[11px] font-bold text-white shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export Data (CSV)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by bio, name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
            />
          </div>

          {/* Account Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
          >
            <option value="">All Account Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* KYC Status */}
          <select
            value={kycStatus}
            onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
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
            className="px-4 py-2.5 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
          >
            <option value="newest_first">Newest First</option>
            <option value="oldest_first">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="highest_earnings">Highest Earnings</option>
            <option value="most_reels">Most Reels</option>
            <option value="last_login">Last Login</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Registration Date range: from */}
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest px-2">Registered From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
            />
          </div>

          {/* Registration Date range: to */}
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest px-2">Registered To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* --- CREATORS TABLE --- */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Creator</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Creator ID</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">KYC Verification</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Reels Published</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined / Last Login</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Earnings</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/50">
              {loadingCreators ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16 bg-[#f8f4ec]/30" />
                ))
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-xs text-slate-400">
                    No creators found matching the criteria. Try refining filters.
                  </td>
                </tr>
              ) : (
                creators.map((c) => {
                  const accountStatus = c.is_banned ? 'Suspended' : c.is_active ? 'Active' : 'Inactive';
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-[#fbf9f4]">
                      {/* Name / Contact */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {c.profile_pic ? (
                            <img src={c.profile_pic} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-[#e3dccb]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#d99a3d] text-[11px] font-black border border-[#1a1a1a]">
                              {(c.name || 'C')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-[#1a1a1a] block text-xs leading-tight">{c.name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{c.phone || c.email || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[10px] text-slate-500 select-all">{c.id}</span>
                      </td>

                      {/* KYC status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={c.kyc_status || 'unverified'} />
                      </td>

                      {/* Account status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={accountStatus} />
                      </td>

                      {/* Reels count */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <span className="font-bold text-text-primary">{c.total_reels}</span>
                          <span className="text-[10px] text-text-tertiary font-medium">clips</span>
                        </div>
                      </td>

                      {/* Date values */}
                      <td className="px-4 py-3 text-[10px] text-text-secondary">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3 text-text-tertiary" /> {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] text-text-tertiary font-semibold flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-text-tertiary" /> {c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString() : 'Never logged in'}
                          </span>
                        </div>
                      </td>

                      {/* Spendings */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-black text-emerald-600">₹{(c.total_earnings || 0).toLocaleString('en-IN')}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUserId(c.id); setModalType('view'); setActiveTab('overview'); }}
                            className="p-2 rounded-lg hover:bg-brand-pink/10 text-text-tertiary hover:text-brand-pink transition-all"
                            title="View Creator dossier"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(c.id);
                              setNewPassword('');
                              setModalType('reset-password');
                            }}
                            className="p-2 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition-all"
                            title="Reset Password"
                          >
                            <FiLock className="w-4 h-4" />
                          </button>
                          {c.kyc_status !== 'approved' && (
                            <>
                              <button
                                onClick={() => handleAction('verify', c.id, c.name)}
                                className="p-2 rounded-lg hover:bg-blue-500/10 text-text-tertiary hover:text-blue-500 transition-all"
                                title="Approve KYC Credentials"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserId(c.id);
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
                          {!c.is_banned ? (
                            <button
                              onClick={() => handleAction('suspend', c.id, c.name)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                              title="Suspend Creator Profile"
                            >
                              <FiPauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('unban', c.id, c.name)}
                              className="p-2 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                              title="Activate/Unsuspend Profile"
                            >
                              <FiUserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction('delete', c.id, c.name)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                            title="Delete Creator Profile"
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
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of {totalItems} creator records
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
                      ? 'bg-brand-pink text-white shadow-premium'
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
        title="Reset Creator Password"
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
              placeholder="Specify discrepancy, illegible document, or missing verification fields..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] min-h-[110px] transition-all"
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
              {rejecting ? 'Rejecting...' : 'Confirm KYC Rejection'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- DETAILED VIEW MODAL (CREATOR WORKSPACE DOSSIER) --- */}
      <AdminModal
        isOpen={modalType === 'view'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Creator Workspace Dossier"
        maxWidth="max-w-5xl"
      >
        {loadingDetail || !creatorDetail ? (
          <div className="py-24 text-center text-[#8c827a] text-xs flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-6 h-6 animate-spin text-[#1a1a1a]" />
            <span className="font-bold">Retrieving creator workspace telemetry &amp; dossiers...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Modal Header Profile Card */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {creatorDetail.profile.profile_pic ? (
                    <img
                      src={creatorDetail.profile.profile_pic}
                      alt={creatorDetail.profile.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#e3dccb] shadow-2xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center text-lg font-black shadow-2xs">
                      {(creatorDetail.profile.name || 'C')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-[#1a1a1a] tracking-tight">
                        {creatorDetail.profile.name}
                      </h4>
                      <AdminStatusBadge status={creatorDetail.profile.is_banned ? 'Suspended' : creatorDetail.profile.is_active ? 'Active' : 'Inactive'} />
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        creatorDetail.profile.kyc_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : creatorDetail.profile.kyc_status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        KYC {creatorDetail.profile.kyc_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8c827a] mt-1 font-semibold flex-wrap">
                      <span>ID:</span>
                      <code className="font-mono text-[#1a1a1a] bg-white px-1.5 py-0.5 rounded border border-[#e3dccb]">
                        {creatorDetail.profile.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(creatorDetail.profile.id);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                          toast.success('Creator ID copied');
                        }}
                        className="text-[#1a1a1a] hover:text-black transition"
                        title="Copy ID"
                      >
                        {copiedId ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[#e3dccb]">•</span>
                      <span>Roles:</span>
                      {(creatorDetail.profile.roles || ['creator']).map(r => (
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
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">EARNINGS</span>
                    <span className="text-sm sm:text-base font-black text-[#1a1a1a] mt-0.5 block tracking-tight">
                      ₹{(creatorDetail.stats.total_earnings || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">WALLET</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 mt-0.5 block tracking-tight">
                      ₹{((creatorDetail.wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[8px] font-bold text-[#8c827a] block">
                      {creatorDetail.wallet?.is_frozen ? '🔒 Frozen' : '✓ Active'}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">REELS</span>
                    <span className="text-sm sm:text-base font-black text-[#d99a3d] mt-0.5 block tracking-tight">
                      {creatorDetail.stats.total_reels || 0} clips
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Quick Operational Actions */}
              <div className="pt-3 border-t border-[#e3dccb] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {creatorDetail.profile.kyc_status !== 'approved' && (
                    <button
                      onClick={() => handleAction('verify', creatorDetail.profile.id, creatorDetail.profile.name)}
                      className="px-3 py-1.5 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" /> Approve KYC
                    </button>
                  )}
                  {creatorDetail.profile.kyc_status === 'pending' && (
                    <button
                      onClick={() => { setModalType('reject-kyc'); setSelectedUserId(creatorDetail.profile.id); }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5" /> Reject KYC
                    </button>
                  )}
                  {creatorDetail.wallet?.is_frozen ? (
                    <button
                      onClick={() => handleAction('unfreeze', creatorDetail.profile.id, creatorDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUnlock className="w-3.5 h-3.5" /> Unfreeze Wallet
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('freeze', creatorDetail.profile.id, creatorDetail.profile.name)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiLock className="w-3.5 h-3.5" /> Freeze Wallet
                    </button>
                  )}
                  {creatorDetail.profile.is_banned ? (
                    <button
                      onClick={() => handleAction('unban', creatorDetail.profile.id, creatorDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUserCheck className="w-3.5 h-3.5" /> Unban Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('ban', creatorDetail.profile.id, creatorDetail.profile.name)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5" /> Block Login
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setModalType('reset-password'); setSelectedUserId(creatorDetail.profile.id); }}
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
                { id: 'overview', label: 'Overview & Profile', icon: FiShield },
                { id: 'reels', label: 'Reels & Video Portfolio', icon: FiFilm, count: creatorDetail.reels?.length || 0 },
                { id: 'campaigns', label: 'Campaigns & Earnings', icon: FiDollarSign, count: creatorDetail.campaigns?.length || 0 },
                { id: 'reviews', label: 'Reviews Received', icon: FiStar, count: creatorDetail.reviews?.length || 0 },
                { id: 'logs', label: 'Activity & Security Logs', icon: FiFileText, count: (creatorDetail.activityLogs?.length || 0) + (creatorDetail.loginHistory?.length || 0) },
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
                  {/* Account Data Details */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5">
                      Profile Details
                    </h5>
                    {creatorDetail.profile.creatorProfile?.bio && (
                      <p className="text-xs text-[#5c554e] bg-[#f8f4ec] p-3 rounded-xl italic border border-[#e3dccb] font-medium leading-relaxed">
                        "{creatorDetail.profile.creatorProfile.bio}"
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Email', creatorDetail.profile.email],
                        ['Phone', creatorDetail.profile.phone],
                        ['KYC verification', (creatorDetail.profile.kyc_status || 'unverified').toUpperCase()],
                        ['Wallet status', creatorDetail.wallet?.is_frozen ? '🔒 Frozen' : '✓ Active'],
                        ['Availability', creatorDetail.profile.creatorProfile?.availabilityStatus || creatorDetail.profile.creatorProfile?.availability || 'Available'],
                        ['Travel Status', creatorDetail.profile.creatorProfile?.travelAvailable ? 'Available for Travel' : 'Local Only'],
                        ['Languages', Array.isArray(creatorDetail.profile.creatorProfile?.languages) ? creatorDetail.profile.creatorProfile.languages.join(', ') : creatorDetail.profile.creatorProfile?.languages || 'Hindi, English'],
                        ['City / Location', creatorDetail.profile.city || creatorDetail.profile.state || '—'],
                        ['Registered on', creatorDetail.profile.created_at ? new Date(creatorDetail.profile.created_at).toLocaleString() : '—'],
                        ['Last login', creatorDetail.profile.lastLoginAt ? new Date(creatorDetail.profile.lastLoginAt).toLocaleString() : 'Never'],
                        ['Last login IP', creatorDetail.profile.lastLoginIp || '127.0.0.1']
                      ].map(([label, val]) => (
                        <div key={label} className="bg-[#f8f4ec] p-2.5 rounded-xl border border-[#e3dccb]">
                          <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">{label}</span>
                          <span className="text-xs text-[#1a1a1a] font-bold mt-0.5 block truncate" title={val}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Campaign Rates */}
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5 pt-2">
                      Campaign Pricing Rates
                    </h5>
                    <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-xs grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[9px] font-black text-[#8c827a] uppercase block">1 Reel Price</span>
                        <span className="text-xs font-black text-[#1a1a1a]">₹{(creatorDetail.profile.creatorProfile?.pricing?.oneReel || creatorDetail.profile.creatorProfile?.pricing?.reel1 || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8c827a] uppercase block">3 Reels Bundle</span>
                        <span className="text-xs font-black text-[#1a1a1a]">₹{(creatorDetail.profile.creatorProfile?.pricing?.threeReels || creatorDetail.profile.creatorProfile?.pricing?.reel3 || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8c827a] uppercase block">Hourly Shoot</span>
                        <span className="text-xs font-black text-[#1a1a1a]">₹{(creatorDetail.profile.creatorProfile?.pricing?.hourlyRate || 0).toLocaleString('en-IN')} / hr</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#8c827a] uppercase block">Full Day Rate</span>
                        <span className="text-xs font-black text-[#1a1a1a]">₹{(creatorDetail.profile.creatorProfile?.pricing?.dayRate || 0).toLocaleString('en-IN')} / day</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5">
                      Lifecycle &amp; Status Timeline ({creatorDetail?.timeline?.length || 0})
                    </h5>
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {(creatorDetail?.timeline || []).length === 0 ? (
                        <div className="p-8 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] text-center text-[#8c827a] text-xs font-medium">
                          No timeline activity logged.
                        </div>
                      ) : (
                        (creatorDetail?.timeline || []).map((t, idx) => (
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

              {/* TAB 2: REELS & VIDEO PORTFOLIO */}
              {activeTab === 'reels' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Published Reels Catalog
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Video clips created and shared by {creatorDetail.profile.name}.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {creatorDetail.reels?.length || 0} Total Videos
                    </span>
                  </div>

                  {(creatorDetail?.reels || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiFilm className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Reels Published Yet</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This creator has not uploaded any portfolio clips.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {creatorDetail.reels.map(r => (
                        <div
                          key={r.id}
                          className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                        >
                          <div className="relative aspect-[9/12] bg-black overflow-hidden flex items-center justify-center">
                            {r.videoUrl && (
                              <video
                                src={r.videoUrl}
                                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition"
                                preload="metadata"
                              />
                            )}
                            <button
                              onClick={() => setPreviewReel(r)}
                              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#1a1a1a]/85 text-[#d99a3d] flex items-center justify-center hover:scale-110 transition shadow-lg cursor-pointer"
                              title="Play Video"
                            >
                              <FiPlay className="w-5 h-5 ml-0.5" />
                            </button>
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#1a1a1a]/80 text-[#d99a3d] text-[10px] font-black rounded-md uppercase backdrop-blur-xs">
                              {r.category || 'General'}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-2">
                            <p className="text-xs font-black text-[#1a1a1a] line-clamp-2" title={r.caption}>
                              {r.caption || 'Untitled Clip'}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-[#8c827a] font-semibold pt-1 border-t border-[#e3dccb]/70">
                              <span className="flex items-center gap-1">
                                <FiEye className="w-3.5 h-3.5 text-[#1a1a1a]" /> {(r.views || 0).toLocaleString()} views
                              </span>
                              <span className="flex items-center gap-1 font-bold text-rose-700">
                                <FiStar className="w-3.5 h-3.5" /> {(r.likes || 0).toLocaleString()} likes
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[10px] text-[#8c827a]">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => setPreviewReel(r)}
                                className="px-3 py-1 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                              >
                                <FiPlay className="w-3 h-3" /> Watch Reel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAMPAIGNS & EARNINGS */}
              {activeTab === 'campaigns' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Brand Collaboration Contracts &amp; Campaign Deals
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Track hiring proposals, contract status, escrow releases, and payments.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {creatorDetail.campaigns?.length || 0} Contracts
                    </span>
                  </div>

                  {(creatorDetail?.campaigns || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiDollarSign className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Campaign Contracts Recorded</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This creator has not participated in paid brand collaborations yet.</p>
                    </div>
                  ) : (
                    <div className="border border-[#e3dccb] rounded-2xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Vendor / Store</th>
                            <th className="p-3">Project Title</th>
                            <th className="p-3 text-right">Budget</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Payment</th>
                            <th className="p-3 text-center">Escrow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e3dccb]">
                          {creatorDetail.campaigns.map(c => (
                            <tr key={c.id} className="hover:bg-[#fbf9f4] transition">
                              <td className="p-3 text-[#8c827a] font-semibold whitespace-nowrap">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-bold text-[#1a1a1a]">
                                <div>{c.vendor?.businessName || c.vendor?.name || 'Vendor Partner'}</div>
                                {c.vendor?.phone && <div className="text-[10px] text-[#8c827a] font-normal">{c.vendor.phone}</div>}
                              </td>
                              <td className="p-3 text-[#1a1a1a] font-semibold max-w-[200px] truncate" title={c.description}>
                                {c.title}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700 whitespace-nowrap">
                                ₹{(c.budget || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  c.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.status === 'rejected' || c.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  c.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {c.payment_status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-[10px] font-bold text-[#5c554e] bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb] uppercase">
                                  {c.escrowStatus || 'held'}
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
                        Client Ratings &amp; Reviews
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Feedback left by vendors and buyers who collaborated with this creator.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {creatorDetail.reviews?.length || 0} Reviews
                    </span>
                  </div>

                  {(creatorDetail?.reviews || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiStar className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Client Reviews Yet</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This creator has not received any public reviews from brands or clients.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {creatorDetail.reviews.map(r => (
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
                                <span className="text-xs font-black text-[#1a1a1a] block">{r.author?.name || 'Client Reviewer'}</span>
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
                      Activity Logs ({creatorDetail.activityLogs?.length || 0})
                    </button>
                    <button
                      onClick={() => setLogTab('login')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        logTab === 'login'
                          ? 'bg-[#1a1a1a] text-white shadow-xs'
                          : 'bg-[#f8f4ec] text-[#8c827a] border border-[#e3dccb] hover:bg-white hover:text-[#1a1a1a]'
                      }`}
                    >
                      Login Security History ({creatorDetail.loginHistory?.length || 0})
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
                            {(creatorDetail?.activityLogs || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No activity logs recorded.
                                </td>
                              </tr>
                            ) : (
                              creatorDetail.activityLogs.map(l => (
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
                            {(creatorDetail?.loginHistory || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No login history recorded.
                                </td>
                              </tr>
                            ) : (
                              creatorDetail.loginHistory.map(l => (
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

      {/* --- INLINE VIDEO PLAYER MODAL --- */}
      <AdminModal
        isOpen={!!previewReel}
        onClose={() => setPreviewReel(null)}
        title={previewReel?.caption || 'Reel Video Preview'}
        maxWidth="max-w-lg"
      >
        {previewReel && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black border border-[#e3dccb] shadow-lg flex items-center justify-center">
              <video
                src={previewReel.videoUrl}
                controls
                autoPlay
                className="w-full max-h-[62vh] object-contain rounded-2xl"
              />
            </div>

            <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] space-y-2">
              <p className="text-xs font-black text-[#1a1a1a] leading-relaxed">
                {previewReel.caption || 'No caption provided'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#8c827a] pt-2 border-t border-[#e3dccb]">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1a1a1a]">{(previewReel.views || 0).toLocaleString()} Views</span>
                  <span className="font-bold text-rose-700">{(previewReel.likes || 0).toLocaleString()} Likes</span>
                </div>
                <a
                  href={previewReel.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1a1a1a] hover:underline"
                >
                  <FiExternalLink className="w-3.5 h-3.5" /> Source Link
                </a>
              </div>
            </div>

            <button
              onClick={() => setPreviewReel(null)}
              className="w-full py-2.5 bg-[#1a1a1a] text-white hover:bg-black font-black rounded-xl text-xs transition"
            >
              Close Video Player
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
