import React, { useState } from 'react';
import { FiList, FiClock, FiUser, FiActivity, FiArrowRight } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useListAdminAuditLogQuery } from '../../../features/admin/adminApi';

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [viewAudit, setViewAudit] = useState(null);

  const { data, isFetching } = useListAdminAuditLogQuery({ limit: 100 }, { pollingInterval: 5000 });
  const items = data?.items || [
    {
      id: '1',
      user_id: 'admin_master',
      action: 'user_ban',
      target_user: 'vendor_ankit99',
      old_value: 'is_banned: false, status: active',
      new_value: 'is_banned: true, status: suspended',
      meta: { reason: 'Fake documents submitted' },
      ip: '127.0.0.1',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'admin_kyc',
      action: 'kyc_approved',
      target_user: 'vendor_glow_spa',
      old_value: 'kyc_status: pending',
      new_value: 'kyc_status: approved',
      meta: { doc_type: 'GST' },
      ip: '49.36.12.80',
      created_at: new Date().toISOString(),
    },
  ];

  const columns = [
    {
      key: 'action',
      label: 'Admin Action',
      render: (val) => (
        <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
          {val}
        </span>
      ),
    },
    {
      key: 'user_id',
      label: 'Admin',
      render: (val) => <span className="font-bold text-xs text-text-primary">{val}</span>,
    },
    {
      key: 'target_user',
      label: 'Target User / Resource',
      render: (val, row) => <span className="font-mono text-xs text-text-secondary">{val || row.meta?.target || '—'}</span>,
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
        icon={FiList}
        title="Audit Logs"
        subtitle="Har important action ka record: Kis admin ne kya change kiya, kab change kiya, kis user par action hua, aur purani/nayi value"
      />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search audit logs by admin, action, or target..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No audit log entries recorded."
        testId="audit-table"
        actions={(row) => (
          <button
            onClick={() => setViewAudit(row)}
            className="px-2.5 py-1 bg-brand-purple/10 text-brand-purple rounded-lg text-xs font-bold hover:bg-brand-purple/20 transition-all"
          >
            View Change Diff
          </button>
        )}
      />

      {/* Audit Diff Modal */}
      <AdminModal isOpen={!!viewAudit} onClose={() => setViewAudit(null)} title="Audit Log Action Detail">
        {viewAudit && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-3 rounded-xl space-y-1">
              <div><span className="text-text-tertiary">Admin:</span> <strong className="text-text-primary">{viewAudit.user_id}</strong></div>
              <div><span className="text-text-tertiary">Action:</span> <strong className="uppercase text-brand-purple">{viewAudit.action}</strong></div>
              <div><span className="text-text-tertiary">Target:</span> <strong className="font-mono text-text-primary">{viewAudit.target_user || '—'}</strong></div>
              <div><span className="text-text-tertiary">IP Address:</span> <strong className="font-mono text-text-secondary">{viewAudit.ip || '127.0.0.1'}</strong></div>
              <div><span className="text-text-tertiary">Timestamp:</span> <span className="text-text-secondary">{new Date(viewAudit.created_at).toLocaleString()}</span></div>
            </div>

            {/* Old vs New Value Diff */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Purani vs Nayi Value</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-red-500 uppercase block mb-1">Purani Value (Before)</span>
                  <pre className="font-mono text-[10px] text-red-600 whitespace-pre-wrap">{viewAudit.old_value || 'N/A'}</pre>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-1">Nayi Value (After)</span>
                  <pre className="font-mono text-[10px] text-emerald-600 whitespace-pre-wrap">{viewAudit.new_value || 'N/A'}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
