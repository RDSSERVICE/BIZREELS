import React, { useState } from 'react';
import {
  FiUsers, FiEye, FiEdit, FiPauseCircle, FiSlash, FiTrash2, FiClock, FiX,
  FiCheckCircle, FiLock, FiUnlock, FiDownload, FiFilter, FiActivity, FiSearch,
  FiDollarSign, FiShoppingBag, FiStar, FiArrowUpRight, FiCalendar, FiRefreshCw,
  FiMapPin, FiUserCheck, FiGift, FiBell, FiShield, FiFileText, FiCopy, FiKey,
  FiExternalLink, FiPhone, FiMail, FiCheck
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, API_BASE } from '../../../lib/api';
import {
  useListAdminCustomersQuery,
  useGetCustomerDetailQuery,
  useGetCustomerStatsQuery,
  useResetCustomerPasswordMutation,
  useVerifyCustomerAccountMutation,
  useActivateCustomerAccountMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteCustomerMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation,
} from '../../../features/admin/adminApi';

export default function AdminCustomers() {
  // Query parameters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [hasOrders, setHasOrders] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('newest_first');
  const [page, setPage] = useState(1);

  // Modal / Detail state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'reset-password'
  const [activeTab, setActiveTab] = useState('overview'); // tabs in View modal
  const [logTab, setLogTab] = useState('activity'); // 'activity' | 'login'
  const [copiedId, setCopiedId] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // API hooks
  const { data: customerData, isFetching: loadingCustomers } = useListAdminCustomersQuery({
    q: search || undefined,
    status: status || undefined,
    kyc_status: kycStatus || undefined,
    has_orders: hasOrders || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sort: sort || undefined,
    page,
    limit: 10,
  });

  const { data: stats, isFetching: loadingStats } = useGetCustomerStatsQuery();

  const { data: customerDetail, isFetching: loadingDetail } = useGetCustomerDetailQuery(selectedUserId, {
    skip: !selectedUserId || modalType !== 'view',
  });

  const [resetPassword, { isLoading: resettingPw }] = useResetCustomerPasswordMutation();
  const [verifyAccount, { isLoading: verifying }] = useVerifyCustomerAccountMutation();
  const [activateAccount, { isLoading: activating }] = useActivateCustomerAccountMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [suspendUser] = useSuspendUserMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [freezeWallet] = useFreezeWalletMutation();
  const [unfreezeWallet] = useUnfreezeWalletMutation();

  const customers = customerData?.items || [];
  const totalPages = customerData?.pages || 1;
  const totalItems = customerData?.total || 0;

  // Handle Operations
  const handleAction = async (action, userId, userName) => {
    try {
      if (action === 'ban') {
        if (!window.confirm(`Block customer "${userName}"? This blocks login instantly.`)) return;
        await banUser(userId).unwrap();
        toast.success(`Customer "${userName}" has been blocked`);
      } else if (action === 'unban') {
        await unbanUser(userId).unwrap();
        toast.success(`Customer "${userName}" has been unblocked`);
      } else if (action === 'suspend') {
        if (!window.confirm(`Suspend customer "${userName}"?`)) return;
        await suspendUser(userId).unwrap();
        toast.success(`Customer "${userName}" has been suspended`);
      } else if (action === 'activate') {
        await activateAccount(userId).unwrap();
        toast.success(`Customer "${userName}" has been activated`);
      } else if (action === 'verify') {
        if (!window.confirm(`Verify account for "${userName}"?`)) return;
        await verifyAccount(userId).unwrap();
        toast.success(`Customer "${userName}" account is now verified`);
      } else if (action === 'freeze') {
        if (!window.confirm(`Freeze wallet for "${userName}"? This blocks withdrawals and outgoing transactions.`)) return;
        await freezeWallet(userId).unwrap();
        toast.success(`Wallet for "${userName}" has been frozen`);
      } else if (action === 'unfreeze') {
        await unfreezeWallet(userId).unwrap();
        toast.success(`Wallet for "${userName}" has been unfrozen`);
      } else if (action === 'delete') {
        if (!window.confirm(`Delete Customer role and data for "${userName}"? This will not delete other roles.`)) return;
        await deleteCustomer(userId).unwrap();
        toast.success(`Customer "${userName}" role and data deleted`);
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
      toast.success('Customer password reset successfully');
      setNewPassword('');
      setModalType(null);
      setSelectedUserId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Password reset failed');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setKycStatus('');
    setHasOrders('');
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
        has_orders: hasOrders || '',
        from: fromDate || '',
        to: toDate || '',
        sort: sort || 'newest_first',
      }).toString();

      const response = await api.get(`/v1/admin/customers/export?${query}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV Export downloaded successfully');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export customer records');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiUsers}
        title="Customer Management Console"
        subtitle="Manage shopper profiles, inspect purchase history & deals, track wallet balances, review referrals, and manage account security."
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
            { label: 'Total Customers', val: stats?.totalCustomers, trend: stats?.growthTrend, icon: FiUsers },
            { label: 'Active Shoppers', val: stats?.activeCustomers, sub: 'Not blocked/suspended', icon: FiUserCheck },
            { label: 'With Active Orders', val: stats?.customersWithActiveOrders, sub: 'In progress deliveries', icon: FiShoppingBag },
            { label: 'Returning Buyers', val: stats?.returningCustomers, sub: 'Multiple completed orders', icon: FiDollarSign },
            { label: 'Verified Accounts', val: stats?.verifiedCustomers, sub: 'Phone / Identity Verified', icon: FiShield }
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
              placeholder="Search by name, email, phone, ID..."
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
            <option value="">All Verification Statuses</option>
            <option value="Verified">Verified Accounts</option>
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
            <option value="highest_spending">Highest Spending</option>
            <option value="most_orders">Most Orders</option>
            <option value="last_login">Recent Login</option>
          </select>
        </div>
      </div>

      {/* --- CUSTOMERS DATA TABLE --- */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
              <tr>
                <th className="p-3.5">Customer Profile</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5 text-center">KYC Status</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Orders</th>
                <th className="p-3.5 text-right">Total Spent</th>
                <th className="p-3.5 text-right">Wallet</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]">
              {loadingCustomers ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[#8c827a]">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1a1a1a]" />
                    <span className="font-bold">Retrieving registered customer profiles...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[#8c827a]">
                    <FiUsers className="w-8 h-8 mx-auto mb-2 text-[#8c827a]" />
                    <span className="font-bold text-sm block text-[#1a1a1a]">No customers found</span>
                    <span className="text-xs">Try adjusting your search criteria or status filters.</span>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fbf9f4] transition-all group">
                    {/* Customer Profile & Avatar */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {c.profile_pic ? (
                          <img src={c.profile_pic} alt={c.name} className="w-9 h-9 rounded-xl object-cover border border-[#e3dccb] shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] text-[#d99a3d] font-black text-xs flex items-center justify-center shrink-0">
                            {(c.name || 'C')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-black text-[#1a1a1a] block truncate text-xs group-hover:text-black">
                            {c.name || 'Unknown Customer'}
                          </span>
                          <span className="text-[10px] text-[#8c827a] block truncate font-mono">
                            ID: {c.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3.5">
                      <div className="text-[#1a1a1a] font-semibold text-[11px]">
                        {c.email || '—'}
                      </div>
                      <div className="text-[10px] text-[#8c827a] font-medium mt-0.5">
                        {c.phone || '—'}
                      </div>
                    </td>

                    {/* KYC Status */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        c.kyc_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.kyc_status || 'unverified'}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="p-3.5 text-center">
                      <AdminStatusBadge status={c.is_banned ? 'Blocked' : c.is_active ? 'Active' : 'Suspended'} />
                    </td>

                    {/* Orders */}
                    <td className="p-3.5 text-center">
                      <span className="font-bold text-[#1a1a1a] bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb] text-[11px]">
                        {c.total_orders || 0} orders
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="p-3.5 text-right font-black text-[#1a1a1a] whitespace-nowrap">
                      ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Wallet */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="font-black text-emerald-700">
                        ₹{((c.wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-[#8c827a] font-medium">
                        {c.wallet?.credits || 0} pts
                      </div>
                      {c.wallet?.is_frozen && (
                        <span className="text-[9px] text-rose-600 font-bold block">🔒 Frozen</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserId(c.id);
                            setActiveTab('overview');
                            setModalType('view');
                          }}
                          className="px-2.5 py-1 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="View Customer Dossier"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View
                        </button>
                        {c.wallet?.is_frozen ? (
                          <button
                            onClick={() => handleAction('unfreeze', c.id, c.name)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-black transition cursor-pointer"
                            title="Unfreeze Wallet"
                          >
                            <FiUnlock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('freeze', c.id, c.name)}
                            className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-black transition cursor-pointer"
                            title="Freeze Wallet"
                          >
                            <FiLock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(c.is_banned ? 'unban' : 'ban', c.id, c.name)}
                          className={`p-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            c.is_banned
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title={c.is_banned ? 'Unblock Customer' : 'Block Customer'}
                        >
                          <FiSlash className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAction('delete', c.id, c.name)}
                          className="p-1.5 bg-[#f8f4ec] text-[#8c827a] hover:text-rose-600 hover:bg-rose-50 border border-[#e3dccb] rounded-lg text-xs transition cursor-pointer"
                          title="Delete Customer Role"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- TABLE PAGINATION --- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-[#8c827a] font-bold">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of {totalItems} customer records
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
        title="Reset Customer Password"
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

      {/* --- DETAILED VIEW MODAL: CUSTOMER WORKSPACE DOSSIER --- */}
      <AdminModal
        isOpen={modalType === 'view'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Customer Workspace Dossier"
        maxWidth="max-w-5xl"
      >
        {loadingDetail || !customerDetail ? (
          <div className="py-24 text-center text-[#8c827a] text-xs flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-6 h-6 animate-spin text-[#1a1a1a]" />
            <span className="font-bold">Retrieving customer account telemetry & purchase history...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Modal Header Profile Card */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {customerDetail.profile.profile_pic ? (
                    <img
                      src={customerDetail.profile.profile_pic}
                      alt={customerDetail.profile.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#e3dccb] shadow-2xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center text-lg font-black shadow-2xs">
                      {(customerDetail.profile.name || 'C')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-[#1a1a1a] tracking-tight">
                        {customerDetail.profile.name}
                      </h4>
                      <AdminStatusBadge status={customerDetail.profile.is_banned ? 'Blocked' : customerDetail.profile.is_active ? 'Active' : 'Suspended'} />
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        customerDetail.profile.kyc_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        KYC {customerDetail.profile.kyc_status || 'unverified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8c827a] mt-1 font-semibold flex-wrap">
                      <span>ID:</span>
                      <code className="font-mono text-[#1a1a1a] bg-white px-1.5 py-0.5 rounded border border-[#e3dccb]">
                        {customerDetail.profile.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(customerDetail.profile.id);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                          toast.success('Customer ID copied');
                        }}
                        className="text-[#1a1a1a] hover:text-black transition cursor-pointer"
                        title="Copy ID"
                      >
                        {copiedId ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[#e3dccb]">•</span>
                      <span>Roles:</span>
                      {(customerDetail.profile.roles || ['customer']).map(r => (
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
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">SPENT</span>
                    <span className="text-sm sm:text-base font-black text-[#1a1a1a] mt-0.5 block tracking-tight">
                      ₹{(customerDetail.stats?.total_spent || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">WALLET</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 mt-0.5 block tracking-tight">
                      ₹{((customerDetail.wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[8px] font-bold text-[#8c827a] block">
                      {customerDetail.wallet?.is_frozen ? '🔒 Frozen' : '✓ Active'}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 rounded-xl border border-[#e3dccb] text-center shadow-2xs min-w-[90px]">
                    <span className="text-[9px] font-black text-[#8c827a] uppercase tracking-wider block">REWARDS</span>
                    <span className="text-sm sm:text-base font-black text-[#d99a3d] mt-0.5 block tracking-tight">
                      {customerDetail.wallet?.credits || 0} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Quick Operational Actions */}
              <div className="pt-3 border-t border-[#e3dccb] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {customerDetail.wallet?.is_frozen ? (
                    <button
                      onClick={() => handleAction('unfreeze', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUnlock className="w-3.5 h-3.5" /> Unfreeze Wallet
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('freeze', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiLock className="w-3.5 h-3.5" /> Freeze Wallet
                    </button>
                  )}
                  {customerDetail.profile.is_banned ? (
                    <button
                      onClick={() => handleAction('unban', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiUserCheck className="w-3.5 h-3.5" /> Unblock Customer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('ban', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5" /> Block Customer
                    </button>
                  )}
                  {customerDetail.profile.is_active ? (
                    <button
                      onClick={() => handleAction('suspend', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiPauseCircle className="w-3.5 h-3.5" /> Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('activate', customerDetail.profile.id, customerDetail.profile.name)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setModalType('reset-password'); setSelectedUserId(customerDetail.profile.id); }}
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
                { id: 'overview', label: 'Overview & Profile', icon: FiUsers },
                { id: 'orders', label: 'Orders & Deals', icon: FiShoppingBag, count: customerDetail.orders?.length || 0 },
                { id: 'wishlist', label: 'Wishlist & Inquiries', icon: FiStar, count: (customerDetail.wishlist?.length || 0) + (customerDetail.inquiries?.length || 0) },
                { id: 'reviews', label: 'Reviews Given', icon: FiGift, count: customerDetail.reviews?.length || 0 },
                { id: 'logs', label: 'Activity & Security Logs', icon: FiFileText, count: (customerDetail.activityLogs?.length || 0) + (customerDetail.loginHistory?.length || 0) },
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
                  {/* Account Data details */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider border-b border-[#e3dccb] pb-1.5">
                      Account &amp; Contact Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Email', customerDetail.profile.email],
                        ['Phone', customerDetail.profile.phone],
                        ['KYC status', (customerDetail.profile.kyc_status || 'unverified').toUpperCase()],
                        ['Wallet status', customerDetail.wallet?.is_frozen ? '🔒 Frozen' : '✓ Active'],
                        ['Referral Code', customerDetail.profile.referral_code || '—'],
                        ['Referred by', customerDetail.referrals?.referred_by?.name ? `${customerDetail.referrals.referred_by.name} (${customerDetail.referrals.referred_by.code})` : 'Organic / Direct'],
                        ['City / Location', customerDetail.profile.address?.city || customerDetail.profile.address?.state || '—'],
                        ['Delivery Address', customerDetail.profile.address?.address ? `${customerDetail.profile.address.address}, ${customerDetail.profile.address.pincode}` : '—'],
                        ['Registered on', customerDetail.profile.created_at ? new Date(customerDetail.profile.created_at).toLocaleString() : '—'],
                        ['Last login', customerDetail.profile.lastLoginAt ? new Date(customerDetail.profile.lastLoginAt).toLocaleString() : 'Never'],
                        ['Last login IP', customerDetail.profile.lastLoginIp || '127.0.0.1']
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
                      Lifecycle &amp; Status Timeline ({customerDetail?.timeline?.length || 0})
                    </h5>
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {(customerDetail?.timeline || []).length === 0 ? (
                        <div className="p-8 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] text-center text-[#8c827a] text-xs font-medium">
                          No timeline activity logged.
                        </div>
                      ) : (
                        (customerDetail?.timeline || []).map((t, idx) => (
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

              {/* TAB 2: ORDERS & DEALS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Purchased Orders &amp; Deal Closures
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Fulfillment records for marketplace products and accepted negotiated deals.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {customerDetail.orders?.length || 0} Orders
                    </span>
                  </div>

                  {(customerDetail?.orders || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiShoppingBag className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Orders Yet</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This customer has not placed any marketplace orders yet.</p>
                    </div>
                  ) : (
                    <div className="border border-[#e3dccb] rounded-2xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#f8f4ec] font-black text-[9px] text-[#8c827a] uppercase border-b border-[#e3dccb] tracking-wider">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Vendor Partner</th>
                            <th className="p-3">Product / Service</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e3dccb]">
                          {customerDetail.orders.map(o => (
                            <tr key={o.id} className="hover:bg-[#fbf9f4] transition">
                              <td className="p-3 text-[#8c827a] font-semibold whitespace-nowrap">
                                {new Date(o.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-black text-[#1a1a1a] uppercase text-[10px]">
                                {o.type}
                              </td>
                              <td className="p-3 font-bold text-[#1a1a1a]">
                                <div>{o.vendor_name}</div>
                                {o.vendor_phone && <div className="text-[10px] text-[#8c827a] font-normal">{o.vendor_phone}</div>}
                              </td>
                              <td className="p-3 text-[#1a1a1a] font-semibold max-w-[200px] truncate" title={o.item_name}>
                                {o.item_name}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700 whitespace-nowrap">
                                ₹{(o.price || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  o.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : o.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  o.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {o.payment_status}
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

              {/* TAB 3: WISHLIST & INQUIRIES */}
              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  {/* Saved listings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Saved Wishlist Items ({customerDetail.wishlist?.length || 0})
                      </h5>
                    </div>

                    {(customerDetail?.wishlist || []).length === 0 ? (
                      <p className="text-xs text-[#8c827a] py-6 text-center bg-[#f8f4ec] rounded-xl border border-[#e3dccb]">
                        No saved listings in wishlist.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {customerDetail.wishlist.map(w => (
                          <div key={w.id} className="bg-[#f8f4ec] border border-[#e3dccb] p-3 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                            <div className="min-w-0">
                              <span className="text-xs font-black text-[#1a1a1a] block truncate" title={w.title}>
                                {w.title}
                              </span>
                              <span className="text-[10px] text-[#8c827a] block capitalize">
                                {w.category} • ₹{(w.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded border border-[#e3dccb] text-[#1a1a1a] uppercase shrink-0">
                              {w.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vendor Inquiries Sent */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Vendor Inquiries Sent ({customerDetail.inquiries?.length || 0})
                      </h5>
                    </div>

                    {(customerDetail?.inquiries || []).length === 0 ? (
                      <p className="text-xs text-[#8c827a] py-6 text-center bg-[#f8f4ec] rounded-xl border border-[#e3dccb]">
                        No product inquiries sent by this customer.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {customerDetail.inquiries.map(inq => (
                          <div key={inq.id} className="bg-[#f8f4ec] border border-[#e3dccb] p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#1a1a1a]">To: {inq.vendor_name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                inq.status === 'closed' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {inq.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#5c554e] italic">"{inq.message}"</p>
                            <div className="text-[9px] text-[#8c827a] flex items-center justify-between pt-1 border-t border-[#e3dccb]">
                              <span>Listing: {inq.listing_title}</span>
                              <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: REVIEWS GIVEN */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                    <div>
                      <h5 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
                        Customer Ratings &amp; Reviews Left
                      </h5>
                      <p className="text-[11px] text-[#8c827a] font-medium mt-0.5">
                        Feedback left by this customer for vendors, products, and services.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1a1a1a] bg-[#f8f4ec] px-3 py-1 rounded-full border border-[#e3dccb]">
                      {customerDetail.reviews?.length || 0} Reviews
                    </span>
                  </div>

                  {(customerDetail?.reviews || []).length === 0 ? (
                    <div className="p-12 text-center bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl">
                      <FiStar className="w-8 h-8 text-[#8c827a] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#1a1a1a]">No Reviews Written</h4>
                      <p className="text-xs text-[#8c827a] font-medium mt-1">This customer has not posted any product or store reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerDetail.reviews.map(r => (
                        <div key={r.id} className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-2xl space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-[#1a1a1a] block">Target: {r.target_name}</span>
                              <span className="text-[9px] text-[#8c827a] uppercase font-bold">{r.target_type}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-[#d99a3d] block">{'★'.repeat(r.rating || 5)}</span>
                              <span className="text-[9px] text-[#8c827a] block">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#5c554e] italic bg-white p-3 rounded-xl border border-[#e3dccb]">
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
                      Activity Logs ({customerDetail.activityLogs?.length || 0})
                    </button>
                    <button
                      onClick={() => setLogTab('login')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        logTab === 'login'
                          ? 'bg-[#1a1a1a] text-white shadow-xs'
                          : 'bg-[#f8f4ec] text-[#8c827a] border border-[#e3dccb] hover:bg-white hover:text-[#1a1a1a]'
                      }`}
                    >
                      Login Security History ({customerDetail.loginHistory?.length || 0})
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
                            {(customerDetail?.activityLogs || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No activity logs recorded.
                                </td>
                              </tr>
                            ) : (
                              customerDetail.activityLogs.map(l => (
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
                            {(customerDetail?.loginHistory || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-[#8c827a] font-medium">
                                  No login history recorded.
                                </td>
                              </tr>
                            ) : (
                              customerDetail.loginHistory.map(l => (
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
