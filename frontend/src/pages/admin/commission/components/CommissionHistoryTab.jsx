import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useListCommissionHistoryQuery } from '../../../../features/admin/adminApi';

export default function CommissionHistoryTab() {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useListCommissionHistoryQuery({ page, limit: 20 });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const formatConfigType = (type) => {
    return (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-4 text-xs animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Commission Audit Trails</h3>
      <p className="text-[10px] text-text-tertiary">
        Append-only transaction registry tracking all changes made to platform commission rates, boost charges, or GST settings by portal admins.
      </p>

      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Rule Type</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Reference</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px] w-24">Old Value</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px] w-24">New Value</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Modified By</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Audit Reason</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">IP Address</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Change Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-tertiary animate-pulse">Loading logs...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-tertiary">No configuration change logs found.</td></tr>
              ) : (
                items.map((log) => {
                  const isCredits = log.config_type.includes('credits') || log.config_type.includes('boost') || log.config_type.includes('ad_charge') || log.config_type.includes('lead_cost');
                  const suffix = isCredits ? ' cr' : '%';
                  
                  return (
                    <tr key={log.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-text-secondary">
                        {formatConfigType(log.config_type)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{log.category_name || 'Global'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">
                        {log.old_rate}{suffix}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {log.new_rate}{suffix}
                      </td>
                      <td className="px-4 py-3 font-bold text-text-primary">
                        {log.admin_name || 'System Admin'}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={log.reason}>
                        <span className="text-text-secondary">{log.reason}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="px-4 py-3 text-text-tertiary">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN') : '—'}
                        <span className="text-[9px] block">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-secondary/30">
            <span className="text-[10px] text-text-tertiary">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} events
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-text-secondary px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
