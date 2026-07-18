import React, { useState } from 'react';
import { FiUserCheck, FiEye, FiCheck, FiX, FiSlash, FiShield, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useApproveKycMutation,
  useRejectKycMutation,
  useGetUserDetailQuery,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Vendors', icon: FiUserCheck },
  { key: 'pending', label: 'Pending Approval', icon: FiShield },
  { key: 'approved', label: 'Verified', icon: FiCheck },
  { key: 'suspended', label: 'Suspended', icon: FiSlash },
  { key: 'rejected', label: 'Rejected', icon: FiX },
];

export default function AdminVendors() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Build query params based on tab
  const queryParams = { q: search || undefined, role: 'vendor', limit: 100 };
  if (activeTab === 'pending') queryParams.kyc_status = 'pending';
  else if (activeTab === 'approved') queryParams.kyc_status = 'approved';
  else if (activeTab === 'rejected') queryParams.kyc_status = 'rejected';
  else if (activeTab === 'suspended') queryParams.is_active = 'false';

  const { data, isFetching } = useListAdminUsersQuery(queryParams, { pollingInterval: 5000 });
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const { data: userDetail } = useGetUserDetailQuery(selectedUser, {
    skip: !selectedUser || !showDetail,
  });

  const items = data?.items || [];

  const handleBan = async (id, name) => {
    if (!window.confirm(`Block vendor ${name}?`)) return;
    try {
      await banUser(id).unwrap();
      toast.success(`${name} blocked`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleUnban = async (id, name) => {
    try {
      await unbanUser(id).unwrap();
      toast.success(`${name} unblocked`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Vendor',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-[10px] font-black flex-shrink-0">
            {(val || 'V')[0].toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-text-primary block">{val || 'Unknown'}</span>
            <span className="text-[10px] text-text-tertiary">{row.phone || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'kyc_status',
      label: 'KYC',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'is_subscribed_verified',
      label: 'Verified',
      render: (val) => (
        <span className={`text-xs font-bold ${val ? 'text-emerald-500' : 'text-text-tertiary'}`}>
          {val ? '✓ Verified' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val, row) => (
        <AdminStatusBadge status={row.is_banned ? 'Blocked' : val ? 'Active' : 'Suspended'} />
      ),
    },
    {
      key: 'rating_avg',
      label: 'Rating',
      render: (val) => (
        <span className="text-xs font-bold text-amber-500">{val ? `★ ${val.toFixed(1)}` : '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiUserCheck}
        title="Vendor Management"
        subtitle="Manage vendor approvals, KYC reviews, and business details"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search vendors by name or phone..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No vendors found."
        testId="vendors-table"
        actions={(row) => (
          <>
            <button
              onClick={() => { setSelectedUser(row.id); setShowDetail(true); }}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View Details"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => row.is_banned ? handleUnban(row.id, row.name) : handleBan(row.id, row.name)}
              className={`p-1.5 rounded-lg transition-all ${row.is_banned ? 'hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500' : 'hover:bg-red-500/10 text-text-tertiary hover:text-red-500'}`}
              title={row.is_banned ? 'Unblock' : 'Block'}
            >
              <FiSlash className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Vendor Detail Modal */}
      <AdminModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedUser(null); }} title="Vendor Details" maxWidth="max-w-2xl">
        {userDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xl font-black">
                {(userDetail.name || 'V')[0].toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">{userDetail.name || 'Unknown'}</h4>
                <p className="text-xs text-text-tertiary">{userDetail.phone || '—'} • {userDetail.email || '—'}</p>
                <AdminStatusBadge status={userDetail.kyc_status} className="mt-1" />
              </div>
            </div>

            {/* Business Details */}
            {userDetail.vendor_profile && (
              <div className="bg-surface-secondary rounded-xl p-4">
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiBriefcase className="w-3 h-3" /> Business Details
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(userDetail.vendor_profile).slice(0, 8).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-text-tertiary capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                      <span className="font-bold text-text-primary">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                ['City', userDetail.city || '—'],
                ['State', userDetail.state || '—'],
                ['Rating', userDetail.rating_avg ? `★ ${userDetail.rating_avg.toFixed(1)}` : '—'],
                ['Trust Score', userDetail.trust_score || '—'],
                ['Followers', userDetail.followersCount],
                ['Wallet Credits', userDetail.wallet?.credits || 0],
              ].map(([label, val]) => (
                <div key={label} className="bg-surface-secondary rounded-xl p-3">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">{label}</span>
                  <span className="text-xs font-bold text-text-primary mt-0.5 block">{val}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-text-tertiary text-xs">Loading...</div>
        )}
      </AdminModal>
    </div>
  );
}
