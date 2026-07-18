import React, { useState } from 'react';
import { FiUsers, FiEye, FiEdit, FiPauseCircle, FiSlash, FiTrash2, FiClock, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteUserMutation,
  useGetUserDetailQuery,
  useUpdateUserMutation,
  useGetLoginHistoryQuery,
} from '../../../features/admin/adminApi';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'history'
  const [editForm, setEditForm] = useState({});

  const { data, isFetching } = useListAdminUsersQuery(
    { q: search || undefined, role: 'customer', limit: 100 },
    { pollingInterval: 5000 }
  );

  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [suspendUser] = useSuspendUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const { data: userDetail } = useGetUserDetailQuery(selectedUser, {
    skip: !selectedUser || (modalType !== 'view' && modalType !== 'edit'),
  });

  const { data: loginHistory } = useGetLoginHistoryQuery(selectedUser, {
    skip: !selectedUser || modalType !== 'history',
  });

  const items = data?.items || [];

  const handleAction = async (action, userId, userName) => {
    try {
      if (action === 'ban') {
        if (!window.confirm(`Block ${userName}?`)) return;
        await banUser(userId).unwrap();
        toast.success(`${userName} has been blocked`);
      } else if (action === 'unban') {
        await unbanUser(userId).unwrap();
        toast.success(`${userName} has been unblocked`);
      } else if (action === 'suspend') {
        if (!window.confirm(`Suspend ${userName}?`)) return;
        await suspendUser(userId).unwrap();
        toast.success(`${userName} has been suspended`);
      } else if (action === 'delete') {
        if (!window.confirm(`Delete ${userName}? This action cannot be undone.`)) return;
        await deleteUser(userId).unwrap();
        toast.success(`${userName} has been deleted`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser({ id: selectedUser, ...editForm }).unwrap();
      toast.success('User updated successfully');
      setModalType(null);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  const openModal = (type, userId) => {
    setSelectedUser(userId);
    setModalType(type);
    if (type === 'edit') {
      const user = items.find((u) => u.id === userId);
      if (user) setEditForm({ name: user.name || '', email: '', city: '' });
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            {(val || 'U')[0].toUpperCase()}
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
        icon={FiUsers}
        title="Customer Management"
        subtitle="View, edit, suspend, block, or delete customer accounts"
      />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search customers by name or phone..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No customers found."
        testId="customers-table"
        actions={(row) => (
          <>
            <button onClick={() => openModal('view', row.id)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all" title="View">
              <FiEye className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => openModal('edit', row.id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-text-tertiary hover:text-blue-500 transition-all" title="Edit">
              <FiEdit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleAction('suspend', row.id, row.name)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition-all" title="Suspend">
              <FiPauseCircle className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleAction(row.is_banned ? 'unban' : 'ban', row.id, row.name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all" title={row.is_banned ? 'Unblock' : 'Block'}>
              <FiSlash className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleAction('delete', row.id, row.name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all" title="Delete">
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => openModal('history', row.id)} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-text-tertiary hover:text-indigo-500 transition-all" title="Login History">
              <FiClock className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* View Detail Modal */}
      <AdminModal isOpen={modalType === 'view'} onClose={() => { setModalType(null); setSelectedUser(null); }} title="Customer Details" maxWidth="max-w-xl">
        {userDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-xl font-black">
                {(userDetail.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">{userDetail.name || 'Unknown'}</h4>
                <p className="text-xs text-text-tertiary">{userDetail.phone || '—'} • {userDetail.email || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['KYC Status', userDetail.kyc_status],
                ['Status', userDetail.is_banned ? 'Blocked' : userDetail.is_active ? 'Active' : 'Suspended'],
                ['City', userDetail.city || '—'],
                ['Rating', userDetail.rating_avg ? `★ ${userDetail.rating_avg.toFixed(1)}` : '—'],
                ['Followers', userDetail.followersCount],
                ['Following', userDetail.followingCount],
                ['Wallet Credits', userDetail.wallet?.credits || 0],
                ['Wallet Frozen', userDetail.wallet?.is_frozen ? 'Yes' : 'No'],
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

      {/* Edit Modal */}
      <AdminModal isOpen={modalType === 'edit'} onClose={() => { setModalType(null); setSelectedUser(null); }} title="Edit Customer">
        <div className="space-y-4">
          {['name', 'email', 'city'].map((field) => (
            <div key={field}>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{field}</label>
              <input
                type="text"
                value={editForm[field] || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>
          ))}
          <button
            onClick={handleSaveEdit}
            className="w-full py-2.5 rounded-xl gradient-brand text-white text-xs font-bold hover:opacity-90 transition-all"
          >
            Save Changes
          </button>
        </div>
      </AdminModal>

      {/* Login History Modal */}
      <AdminModal isOpen={modalType === 'history'} onClose={() => { setModalType(null); setSelectedUser(null); }} title="Login History" maxWidth="max-w-xl">
        {loginHistory?.items?.length > 0 ? (
          <div className="space-y-2">
            {loginHistory.items.map((log) => (
              <div key={log.id} className="flex items-center justify-between bg-surface-secondary rounded-xl p-3">
                <div>
                  <span className="text-xs font-bold text-text-primary capitalize">{log.action}</span>
                  <span className="text-[10px] text-text-tertiary block mt-0.5">
                    IP: {log.ip || '—'} • {log.user_agent ? log.user_agent.slice(0, 50) : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-text-tertiary text-xs">No login history found.</div>
        )}
      </AdminModal>
    </div>
  );
}
