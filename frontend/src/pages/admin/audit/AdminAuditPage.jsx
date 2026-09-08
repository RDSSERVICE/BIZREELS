import React, { useState } from 'react';
import { FiList, FiClock, FiUser, FiActivity, FiArrowRight } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useListAdminAuditLogQuery } from '../../../features/admin/adminApi';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [viewAudit, setViewAudit] = useState(null);

  const { data, isFetching } = useListAdminAuditLogQuery({ limit: 100 }, { pollingInterval: 5000 });
  const items = data?.items || [];

  const columns = [
    {
      key: 'action',
      label: 'Admin Action',
      render: (val) => (
        <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded-md bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb]">
          {val}
        </span>
      ),
    },
    {
      key: 'user_id',
      label: 'Admin',
      render: (val) => <span className="font-bold text-xs text-[#1a1a1a]">{val}</span>,
    },
    {
      key: 'target_user',
      label: 'Target User / Resource',
      render: (val, row) => <span className="font-mono text-xs text-slate-600">{val || row.meta?.target || '—'}</span>,
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (val) => <span className="text-slate-400 text-xs font-medium">{formatDate(val)}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiList}
        title="Audit Logs"
        subtitle="Immutable ledger of administrator actions: Who changed what, when, target resource, and before/after diffs"
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
            className="px-3 py-1.5 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            View Change Diff
          </button>
        )}
      />

      {/* Audit Diff Modal */}
      <AdminModal isOpen={!!viewAudit} onClose={() => setViewAudit(null)} title="Audit Log Action Detail">
        {viewAudit && (
          <div className="space-y-4 text-xs font-sans">
            <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] space-y-1.5">
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Admin:</span> <strong className="text-[#1a1a1a] font-mono">{viewAudit.user_id}</strong></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Action:</span> <strong className="uppercase text-[#d99a3d] font-black">{viewAudit.action}</strong></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Target:</span> <strong className="font-mono text-[#1a1a1a]">{viewAudit.target_user || '—'}</strong></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">IP Address:</span> <strong className="font-mono text-slate-600">{viewAudit.ip || '127.0.0.1'}</strong></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Timestamp:</span> <span className="text-slate-600 font-medium">{formatDate(viewAudit.created_at)}</span></div>
            </div>

            {/* Old vs New Value Diff */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">State Diff (Before vs After)</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                  <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider block mb-1">Previous Value (Before)</span>
                  <pre className="font-mono text-[10px] text-rose-800 whitespace-pre-wrap">{viewAudit.old_value || 'N/A'}</pre>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block mb-1">Updated Value (After)</span>
                  <pre className="font-mono text-[10px] text-emerald-800 whitespace-pre-wrap">{viewAudit.new_value || 'N/A'}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

