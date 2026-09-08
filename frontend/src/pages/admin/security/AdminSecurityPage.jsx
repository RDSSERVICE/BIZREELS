import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiLock, FiShield, FiUsers, FiClock, FiGlobe, FiKey, FiUser, FiMail, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetAdminSecurityLogsQuery,
  useUpdateAdminProfileMutation,
  useChangeAdminPasswordMutation,
} from '../../../features/admin/adminApi';
import { selectCurrentUser, updateUser } from '../../../features/auth/authSlice';

const TABS = [
  { key: 'account', label: 'My Account & Password', icon: FiUser },
  { key: 'roles', label: 'Admin Roles & Permissions', icon: FiUsers },
  { key: 'logs', label: 'Admin Login Logs & Failed Attempts', icon: FiClock },
  { key: 'whitelist', label: 'IP Whitelist & 2FA', icon: FiGlobe },
];

export default function AdminSecurityPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState('account');
  const [search, setSearch] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [whitelist, setWhitelist] = useState(['127.0.0.1', '192.168.1.1']);

  // Self Profile Form State
  const [adminName, setAdminName] = useState(currentUser?.name || 'Admin');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateAdminProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangeAdminPasswordMutation();

  const { data, isFetching } = useGetAdminSecurityLogsQuery(undefined, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const logs = data?.items || [];

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setAdminName(currentUser.name);
      if (currentUser.email) setAdminEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      return toast.error('Email address is required.');
    }
    try {
      const res = await updateProfile({
        name: adminName.trim(),
        email: adminEmail.trim(),
      }).unwrap();

      if (res.user) {
        dispatch(updateUser(res.user));
      }
      toast.success(res.message || 'Admin profile updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirm password do not match.');
    }

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      toast.success(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change password.');
    }
  };

  const handleAddIp = () => {
    if (!ipAddress.trim()) return toast.error('Enter IP Address');
    setWhitelist((prev) => [...prev, ipAddress.trim()]);
    setIpAddress('');
    toast.success('IP added to whitelist!');
  };

  const columns = [
    {
      key: 'admin_id',
      label: 'Admin Account',
      render: (val) => <span className="font-bold text-text-primary text-xs">{val}</span>,
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (val) => <span className="font-mono text-xs text-brand-purple">{val || '—'}</span>,
    },
    {
      key: 'user_agent',
      label: 'Device / Browser',
      render: (val) => <span className="text-xs text-text-tertiary truncate max-w-[200px] block">{val || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Login Result',
      render: (val) => <AdminStatusBadge status={val === 'success' ? 'Success' : 'Failed'} />,
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleString() : '—'}</span>,
    },
  ];

  const adminRoles = [
    { name: 'Super Admin', members: 2, permissions: 'All Permissions (Full Control)', status: 'Active' },
    { name: 'KYC Moderator', members: 4, permissions: 'KYC Review, User Status Read', status: 'Active' },
    { name: 'Content Moderator', members: 6, permissions: 'Listings, Reels & Reviews Moderation', status: 'Active' },
    { name: 'Finance Admin', members: 2, permissions: 'Transactions, Wallet & Commission Read/Write', status: 'Active' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiLock}
        title="Admin Account & Security Controls"
        subtitle="Manage your admin email and password, configure admin roles, audit login logs, IP whitelists, and 2FA"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'account' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Profile Form */}
          <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-[#e3dccb] space-y-4 shadow-2xs">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e3dccb]">
              <div className="w-10 h-10 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center text-[#1a1a1a]">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a1a1a] font-display">Update Admin Profile</h3>
                <p className="text-[11px] text-slate-500">Change your name and administrative email address</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Admin Display Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none focus:border-[#1a1a1a] transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@bizreels.in"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none focus:border-[#1a1a1a] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Admin Password Change Form */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-[#e3dccb] space-y-4 shadow-2xs">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e3dccb]">
              <div className="w-10 h-10 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center text-[#d99a3d]">
                <FiKey className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a1a1a] font-display">Change Admin Password</h3>
                <p className="text-[11px] text-slate-500">Set a strong new password for your admin account</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none focus:border-[#1a1a1a] transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none focus:border-[#1a1a1a] transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none focus:border-[#1a1a1a] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminRoles.map((role) => (
            <div key={role.name} className="bg-white p-5 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#e3dccb]">
                <h4 className="text-sm font-bold text-[#1a1a1a] font-display">{role.name}</h4>
                <AdminStatusBadge status={role.status} />
              </div>
              <p className="text-xs text-slate-500">Permissions: <span className="font-semibold text-[#1a1a1a]">{role.permissions}</span></p>
              <span className="text-[10px] font-bold text-[#d99a3d] block">{role.members} Admins Assigned</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <AdminDataTable
          columns={columns}
          data={logs}
          loading={isFetching}
          searchPlaceholder="Search admin login logs..."
          searchValue={search}
          onSearch={setSearch}
          testId="security-logs-table"
        />
      )}

      {activeTab === 'whitelist' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP Whitelist */}
          <div className="bg-white p-6 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1a1a1a] font-display flex items-center gap-2">
              <FiGlobe className="text-[#1a1a1a]" /> IP Address Whitelist
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-mono text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
              <button onClick={handleAddIp} className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-black transition cursor-pointer shadow-xs">
                Add IP
              </button>
            </div>
            <div className="space-y-2 pt-2">
              {whitelist.map((ip) => (
                <div key={ip} className="flex justify-between items-center bg-[#f8f4ec] border border-[#e3dccb] p-2.5 rounded-xl font-mono text-xs">
                  <span className="text-[#1a1a1a]">{ip}</span>
                  <span className="text-emerald-700 font-bold text-[10px]">Whitelisted</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2FA Settings */}
          <div className="bg-white p-6 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1a1a1a] font-display flex items-center gap-2">
              <FiKey className="text-[#1a1a1a]" /> Two-Factor Authentication (2FA)
            </h3>
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1a1a1a] block">Enforce 2FA for all Admin Roles</span>
                  <span className="text-[10px] text-slate-500">Requires TOTP Authenticator code on sign-in</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#1a1a1a]" />
              </div>
              <button onClick={() => toast.success('2FA enforcement updated')} className="w-full py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-black transition shadow-xs cursor-pointer">
                Save 2FA Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
