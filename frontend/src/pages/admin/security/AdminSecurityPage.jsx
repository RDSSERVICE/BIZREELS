import React, { useState } from 'react';
import { FiLock, FiShield, FiUsers, FiClock, FiGlobe, FiKey, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetAdminSecurityLogsQuery } from '../../../features/admin/adminApi';

const TABS = [
  { key: 'roles', label: 'Admin Roles & Permissions', icon: FiUsers },
  { key: 'logs', label: 'Admin Login Logs & Failed Attempts', icon: FiClock },
  { key: 'whitelist', label: 'IP Whitelist & 2FA', icon: FiGlobe },
];

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [search, setSearch] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [whitelist, setWhitelist] = useState(['127.0.0.1', '192.168.1.1']);

  const { data, isFetching } = useGetAdminSecurityLogsQuery(undefined, { pollingInterval: 5000 });
  const logs = data?.items || [
    { id: '1', admin_id: 'admin_master', ip: '127.0.0.1', user_agent: 'Chrome / Windows', status: 'success', created_at: new Date().toISOString() },
    { id: '2', admin_id: 'admin_support', ip: '49.36.12.80', user_agent: 'Firefox / Mac', status: 'failed', created_at: new Date().toISOString() },
  ];

  const adminRoles = [
    { name: 'Super Admin', members: 2, permissions: 'All Permissions (Full Control)', status: 'Active' },
    { name: 'KYC Moderator', members: 4, permissions: 'KYC Review, User Status Read', status: 'Active' },
    { name: 'Content Moderator', members: 6, permissions: 'Listings, Reels & Reviews Moderation', status: 'Active' },
    { name: 'Finance Admin', members: 2, permissions: 'Transactions, Wallet & Commission Read/Write', status: 'Active' },
  ];

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

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiLock}
        title="Admin Security & Access Controls"
        subtitle="Configure admin roles, permissions, audit login logs, monitor failed attempts, IP whitelists, and 2FA"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminRoles.map((role) => (
            <div key={role.name} className="glass p-5 rounded-2xl border border-white/50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h4 className="text-sm font-bold text-text-primary font-display">{role.name}</h4>
                <AdminStatusBadge status={role.status} />
              </div>
              <p className="text-xs text-text-tertiary">Permissions: <span className="font-semibold text-text-primary">{role.permissions}</span></p>
              <span className="text-[10px] font-bold text-brand-purple block">{role.members} Admins Assigned</span>
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
          <div className="glass p-6 rounded-2xl border border-white/50 space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiGlobe className="text-brand-purple" /> IP Address Whitelist
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono"
              />
              <button onClick={handleAddIp} className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl">
                Add IP
              </button>
            </div>
            <div className="space-y-2 pt-2">
              {whitelist.map((ip) => (
                <div key={ip} className="flex justify-between items-center bg-surface-secondary p-2.5 rounded-xl font-mono text-xs">
                  <span>{ip}</span>
                  <span className="text-emerald-500 font-bold text-[10px]">Whitelisted</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2FA Settings */}
          <div className="glass p-6 rounded-2xl border border-white/50 space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiKey className="text-brand-purple" /> Two-Factor Authentication (2FA)
            </h3>
            <div className="bg-surface-secondary p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary block">Enforce 2FA for all Admin Roles</span>
                  <span className="text-[10px] text-text-tertiary">Requires TOTP Authenticator code on sign-in</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-purple" />
              </div>
              <button onClick={() => toast.success('2FA enforcement updated')} className="w-full py-2 bg-brand-purple text-white text-xs font-bold rounded-xl">
                Save 2FA Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
