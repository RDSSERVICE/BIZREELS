import React, { useState } from 'react';
import {
  FiUsers, FiEye, FiEdit, FiPauseCircle, FiSlash, FiTrash2, FiClock, FiX,
  FiCheckCircle, FiLock, FiUnlock, FiDownload, FiFilter, FiActivity, FiSearch,
  FiDollarSign, FiShoppingBag, FiStar, FiArrowUpRight, FiCalendar, FiRefreshCw,
  FiMapPin, FiUserCheck, FiGift, FiBell, FiShield, FiFileText
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { API_BASE } from '../../../lib/api';
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
  useDeleteUserMutation
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
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'reset-password'
  const [activeTab, setActiveTab] = useState('overview'); // tabs in View modal
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
  const [deleteUser] = useDeleteUserMutation();

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
        if (!window.confirm(`Verify and approve KYC for "${userName}"?`)) return;
        await verifyAccount(userId).unwrap();
        toast.success(`Customer "${userName}" account is now verified`);
      } else if (action === 'delete') {
        if (!window.confirm(`Soft delete customer "${userName}"? This marks account as deleted, hiding it from the system.`)) return;
        await deleteUser(userId).unwrap();
        toast.success(`Customer "${userName}" has been soft-deleted`);
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
  const handleExport = () => {
    const access = localStorage.getItem('bizreels_access_token') || localStorage.getItem('accessToken') || '';
    const query = new URLSearchParams({
      q: search,
      status,
      kyc_status: kycStatus,
      has_orders: hasOrders,
      from: fromDate,
      to: toDate,
      sort,
    }).toString();

    fetch(`${API_BASE}/admin/customers/export?${query}`, {
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
        a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('CSV Export downloaded successfully');
      })
      .catch(() => {
        toast.error('Failed to export customer records');
      });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiUsers}
        title="Customer Management Console"
        subtitle="Manage customer directories, view spendings, order history, reset passwords, and approve KYC."
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
            { label: 'Total Customers', val: stats?.totalCustomers, trend: stats?.growthTrend, icon: FiUsers, color: 'text-brand-purple' },
            { label: 'Active Customers', val: stats?.activeCustomers, sub: 'Not banned/suspended', icon: FiUserCheck, color: 'text-emerald-500' },
            { label: 'Returning Customers', val: stats?.returningCustomers, sub: 'More than 1 order', icon: FiShoppingBag, color: 'text-amber-500' },
            { label: 'Verified Accounts', val: stats?.verifiedCustomers, sub: 'KYC Approved', icon: FiShield, color: 'text-blue-500' },
            { label: 'Suspended / Blocked', val: `${stats?.suspendedCustomers || 0} / ${stats?.blockedCustomers || 0}`, sub: 'Disabled accounts', icon: FiSlash, color: 'text-red-500' }
          ].map((card, idx) => (
            <div key={idx} className="glass rounded-2xl p-4 border border-white/50 shadow-glass flex items-center justify-between transition-all hover:scale-[1.02]">
              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">{card.label}</span>
                <span className="text-xl font-black text-text-primary mt-1 block">{card.val ?? 0}</span>
                {card.trend !== undefined ? (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5">
                    <FiArrowUpRight className="w-3.5 h-3.5" /> +{card.trend}% growth (30d)
                  </span>
                ) : (
                  <span className="text-[9px] text-text-tertiary mt-0.5 block">{card.sub}</span>
                )}
              </div>
              <div className={`p-2.5 rounded-xl bg-surface-secondary ${card.color}`}>
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
            <FiFilter className="w-4 h-4 text-brand-purple" />
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
              placeholder="Search by ID, name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>

          {/* Account Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
          >
            <option value="">All Account Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Blocked">Blocked</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* KYC Status */}
          <select
            value={kycStatus}
            onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
          >
            <option value="">All KYC Statuses</option>
            <option value="Verified">Verified Accounts</option>
            <option value="Unverified">Unverified Accounts</option>
          </select>

          {/* Has Orders Filter */}
          <select
            value={hasOrders}
            onChange={(e) => { setHasOrders(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
          >
            <option value="">All Orders Presence</option>
            <option value="true">With Orders</option>
            <option value="false">Without Orders</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Sorting option */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Sort by</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            >
              <option value="newest_first">Newest First</option>
              <option value="oldest_first">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="highest_spending">Highest Spending</option>
              <option value="lowest_spending">Lowest Spending</option>
              <option value="most_orders">Most Orders</option>
              <option value="least_orders">Least Orders</option>
              <option value="last_login">Last Login</option>
            </select>
          </div>

          {/* Registration Date range: from */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Registered From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>

          {/* Registration Date range: to */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Registered To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- CUSTOMERS TABLE --- */}
      <div className="glass rounded-2xl border border-white/50 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/40">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Customer ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">KYC Verification</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Account Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Joined / Last Login</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Orders / Spent</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingCustomers ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 h-16 skeleton" />
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-xs text-text-tertiary">
                    No customers found matching the criteria. Try refining filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const accountStatus = c.is_banned ? 'Blocked' : c.is_active ? 'Active' : 'Suspended';
                  return (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-brand-purple/5 transition-colors">
                      {/* Name / Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {c.profile_pic ? (
                            <img src={c.profile_pic} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-[11px] font-black">
                              {(c.name || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-text-primary block text-xs leading-tight">{c.name || 'Unknown'}</span>
                            <span className="text-[10px] text-text-tertiary mt-0.5 block">{c.phone || c.email || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-text-secondary select-all">{c.id}</span>
                      </td>

                      {/* KYC status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={c.kyc_status || 'unverified'} />
                      </td>

                      {/* Account status badge */}
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={accountStatus} />
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

                      {/* Orders / Spendings */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-bold text-text-primary">{c.total_orders} Orders</span>
                          <span className="text-[10px] font-extrabold text-brand-purple">₹{(c.total_spent || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUserId(c.id); setModalType('view'); setActiveTab('overview'); }}
                            className="p-2 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
                            title="View Customer Profile"
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
                            <button
                              onClick={() => handleAction('verify', c.id, c.name)}
                              className="p-2 rounded-lg hover:bg-blue-500/10 text-text-tertiary hover:text-blue-500 transition-all"
                              title="Approve Account Verification"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {c.is_active ? (
                            <button
                              onClick={() => handleAction('suspend', c.id, c.name)}
                              className="p-2 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition-all"
                              title="Suspend Account"
                            >
                              <FiPauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('activate', c.id, c.name)}
                              className="p-2 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                              title="Activate Account"
                            >
                              <FiUserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(c.is_banned ? 'unban' : 'ban', c.id, c.name)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                            title={c.is_banned ? 'Unblock Customer' : 'Block Customer'}
                          >
                            <FiSlash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction('delete', c.id, c.name)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                            title="Delete Customer Profile"
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
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of {totalItems} customer records
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
                      ? 'bg-brand-purple text-white shadow-premium'
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
        title="Reset Customer Password"
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
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all"
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

      {/* --- DETAILED VIEW MODAL --- */}
      <AdminModal
        isOpen={modalType === 'view'}
        onClose={() => { setModalType(null); setSelectedUserId(null); }}
        title="Customer Workspace Details"
        maxWidth="max-w-5xl"
      >
        {loadingDetail || !customerDetail ? (
          <div className="py-24 text-center text-text-tertiary text-xs flex flex-col items-center justify-center gap-2">
            <FiRefreshCw className="w-6 h-6 animate-spin text-brand-purple" />
            Loading customer comprehensive profiles...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Modal Header Profile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/40 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                {customerDetail.profile.profile_pic ? (
                  <img src={customerDetail.profile.profile_pic} alt={customerDetail.profile.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white text-base font-black">
                    {(customerDetail.profile.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    {customerDetail.profile.name}
                    <AdminStatusBadge status={customerDetail.profile.is_banned ? 'Blocked' : customerDetail.profile.is_active ? 'Active' : 'Suspended'} />
                  </h4>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    ID: <span className="font-mono text-text-secondary select-all">{customerDetail.profile.id}</span>
                  </p>
                </div>
              </div>

              {/* Quick statistics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">SPENT</span>
                  <span className="text-xs font-black text-brand-purple mt-0.5 block">₹{customerDetail.stats.total_spent.toLocaleString()}</span>
                </div>
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">WALLET</span>
                  <span className="text-xs font-black text-emerald-500 mt-0.5 block">₹{(customerDetail.wallet.balance_inr_paise / 100).toLocaleString()}</span>
                </div>
                <div className="bg-surface p-2 rounded-xl border border-border text-center min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-tertiary block">REWARDS</span>
                  <span className="text-xs font-black text-amber-500 mt-0.5 block">{customerDetail.wallet.credits} pts</span>
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border overflow-x-auto gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: FiUsers },
                { id: 'orders', label: 'Orders & Payments', icon: FiShoppingBag },
                { id: 'wishlist', label: 'Wishlist & Reviews', icon: FiStar },
                { id: 'referrals', label: 'Referrals & Support', icon: FiGift },
                { id: 'logs', label: 'Activity & Audit Logs', icon: FiFileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
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
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Profile Details</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Email', customerDetail.profile.email],
                        ['Phone', customerDetail.profile.phone],
                        ['Verification status', customerDetail.profile.kyc_status.toUpperCase()],
                        ['Wallet status', customerDetail.wallet.is_frozen ? 'Frozen' : 'Active'],
                        ['Referral code', customerDetail.profile.referral_code || 'None generated'],
                        ['Registered on', new Date(customerDetail.profile.created_at).toLocaleString()],
                        ['Last login', customerDetail.profile.lastLoginAt ? new Date(customerDetail.profile.lastLoginAt).toLocaleString() : 'Never'],
                        ['Last login IP', customerDetail.profile.lastLoginIp || '—']
                      ].map(([label, val]) => (
                        <div key={label} className="bg-surface-secondary p-2.5 rounded-xl border border-border/50">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase block">{label}</span>
                          <span className="text-xs text-text-primary font-semibold mt-0.5 block">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1 pt-2">Saved Address</h5>
                    <div className="bg-surface-secondary p-3 rounded-xl border border-border text-xs text-text-secondary">
                      {customerDetail.profile.address ? (
                        <div className="space-y-1">
                          <p><span className="font-bold text-text-primary">Street Address:</span> {customerDetail.profile.address.address}</p>
                          <p><span className="font-bold text-text-primary">City:</span> {customerDetail.profile.address.city}</p>
                          <p><span className="font-bold text-text-primary">District/State/Pincode:</span> {customerDetail.profile.address.district}, {customerDetail.profile.address.state} - {customerDetail.profile.address.pincode}</p>
                        </div>
                      ) : (
                        <p className="text-text-tertiary text-center py-2">No saved address information.</p>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Status Timeline</h5>
                    <div className="space-y-2.5">
                      {customerDetail.timeline.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-6 text-center">No timeline activity logged.</p>
                      ) : (
                        customerDetail.timeline.slice(0, 5).map((t, idx) => (
                          <div key={t.id || idx} className="flex gap-2 text-xs">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-brand-purple mt-1 flex-shrink-0" />
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

              {/* TAB 2: ORDERS & PAYMENTS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Orders section */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Order History</h5>
                    <div className="overflow-x-auto max-h-[250px] border border-border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                          <tr className="border-b border-border">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5 text-right">Price</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetail.orders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-text-tertiary">No orders placed.</td>
                            </tr>
                          ) : (
                            customerDetail.orders.map(o => (
                              <tr key={o.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                                <td className="p-2">{new Date(o.created_at).toLocaleDateString()}</td>
                                <td className="p-2 font-bold text-text-primary">{o.item_name}</td>
                                <td className="p-2 capitalize">{o.type}</td>
                                <td className="p-2 text-right font-extrabold text-brand-purple">₹{o.price.toLocaleString()}</td>
                                <td className="p-2 text-right capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    o.status === 'completed' || o.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                                    o.status === 'cancelled' || o.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payments section */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Payment History</h5>
                    <div className="overflow-x-auto max-h-[250px] border border-border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-secondary font-bold text-[10px] text-text-tertiary uppercase">
                          <tr className="border-b border-border">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Purpose</th>
                            <th className="p-2.5">Razorpay ID</th>
                            <th className="p-2.5 text-right">Amount</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetail.payments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-text-tertiary">No payment history found.</td>
                            </tr>
                          ) : (
                            customerDetail.payments.map(p => (
                              <tr key={p.id} className="border-b border-border/40 hover:bg-surface-secondary/20">
                                <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                                <td className="p-2 font-bold text-text-primary">{p.purpose.replace(/_/g, ' ')}</td>
                                <td className="p-2 font-mono text-[10px] text-text-tertiary">{p.razorpay_payment_id || p.razorpay_order_id}</td>
                                <td className="p-2 text-right font-extrabold text-emerald-500">₹{(p.amount_paise / 100).toLocaleString()}</td>
                                <td className="p-2 text-right capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    p.status === 'captured' || p.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WISHLIST & REVIEWS */}
              {activeTab === 'wishlist' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wishlist */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Saved Wishlist</h5>
                    <div className="space-y-2">
                      {customerDetail.wishlist.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">Wishlist is empty.</p>
                      ) : (
                        customerDetail.wishlist.map(w => (
                          <div key={w.id} className="flex items-center justify-between bg-surface-secondary border border-border p-2 rounded-xl text-xs">
                            <div>
                              <span className="font-bold text-text-primary block">{w.title}</span>
                              <span className="text-[9px] text-text-tertiary uppercase mt-0.5 block">{w.category || 'General'}</span>
                            </div>
                            <span className="font-bold text-brand-purple">₹{w.price.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Reviews written */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Reviews Written</h5>
                    <div className="space-y-2">
                      {customerDetail.reviews.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">No reviews submitted.</p>
                      ) : (
                        customerDetail.reviews.map(r => (
                          <div key={r._id || r.id} className="bg-surface-secondary border border-border p-3 rounded-xl text-xs space-y-1.5">
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
                </div>
              )}

              {/* TAB 4: REFERRALS & SUPPORT */}
              {activeTab === 'referrals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Referral History */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Users Referred</h5>
                    {customerDetail.referrals.referred_by && (
                      <div className="bg-brand-purple/5 border border-brand-purple/20 p-2.5 rounded-xl text-xs mb-2">
                        <span className="text-[9px] font-bold text-brand-purple uppercase tracking-wider block">Referred By</span>
                        <span className="font-bold text-text-primary mt-0.5 block">{customerDetail.referrals.referred_by.name} ({customerDetail.referrals.referred_by.code})</span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">Status: <span className="capitalize">{customerDetail.referrals.referred_by.status}</span></span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {customerDetail.referrals.list.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">No referrals registered yet.</p>
                      ) : (
                        customerDetail.referrals.list.map(ref => (
                          <div key={ref._id || ref.id} className="flex items-center justify-between bg-surface-secondary border border-border p-2.5 rounded-xl text-xs">
                            <div>
                              <span className="font-bold text-text-primary block">User ID: {ref.referred_user_id.slice(-6)}</span>
                              <span className="text-[9px] text-text-tertiary block mt-0.5">Status: <span className="font-bold capitalize">{ref.status}</span></span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500">+{ref.referrer_reward || 0} pts</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Support inquiries */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border pb-1">Support / Product Inquiries</h5>
                    <div className="space-y-2">
                      {customerDetail.inquiries.length === 0 ? (
                        <p className="text-xs text-text-tertiary py-8 text-center">No product inquiries logged.</p>
                      ) : (
                        customerDetail.inquiries.map(inq => (
                          <div key={inq._id || inq.id} className="bg-surface-secondary border border-border p-3 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                              <span className="font-bold text-text-primary">Listing: {inq.listing?.title || 'General Inquiry'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                inq.status === 'closed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {inq.status}
                              </span>
                            </div>
                            <p className="text-text-secondary font-medium">"{inq.message}"</p>
                            <div className="flex items-center justify-between text-[9px] text-text-tertiary">
                              <span>To: {inq.vendor?.name || 'Vendor'}</span>
                              <span>{new Date(inq.createdAt || inq.created_at).toLocaleDateString()}</span>
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
                          {customerDetail.activityLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-text-tertiary">No activity logged.</td>
                            </tr>
                          ) : (
                            customerDetail.activityLogs.map(l => (
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
                          {customerDetail.loginHistory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-text-tertiary">No login history recorded.</td>
                            </tr>
                          ) : (
                            customerDetail.loginHistory.map(l => (
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

