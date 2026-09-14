import React from 'react';
import { FiZap } from 'react-icons/fi';
import AdminDataTable from '../../../../features/admin/components/AdminDataTable';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * CallHistoryTab
 * Exotel telephony incoming calls, durations, and credit deductions table.
 */
export default function CallHistoryTab({
  callHistory = [],
  loading = false,
  onRefresh,
}) {
  const { bi } = useLanguage();

  const callColumns = [
    {
      key: 'createdAt',
      label: bi('Date & Time', 'दिनांक और समय'),
      render: (val, row) => {
        const d = new Date(val || row?.createdAt);
        if (isNaN(d.getTime())) return <span className="text-slate-400 text-xs">N/A</span>;
        return (
          <div className="flex flex-col font-sans">
            <span className="font-black text-xs text-[#1a1a1a]">
              {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'customerName',
      label: bi('Customer Lead', 'ग्राहक लीड'),
      render: (val, row) => (
        <div className="flex flex-col font-sans">
          <span className="font-extrabold text-xs text-[#1a1a1a]">{val || 'Customer'}</span>
          <span className="text-[10px] text-slate-600 font-mono font-bold">
            {row?.customerPhone || 'Direct Dial'}
          </span>
        </div>
      ),
    },
    {
      key: 'productTitle',
      label: bi('Inquiry Subject', 'पूछताछ विषय'),
      render: (val) => (
        <span className="font-bold text-xs text-slate-800 line-clamp-1 max-w-[200px]">
          {val || 'Direct Store Line'}
        </span>
      ),
    },
    {
      key: 'status',
      label: bi('Call Status', 'कॉल स्थिति'),
      render: (val) => {
        const isCompleted = val === 'completed';
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isCompleted ? bi('Connected', 'जुड़ गया') : val || bi('Unconnected', 'अनुत्तरित')}
          </span>
        );
      },
    },
    {
      key: 'durationSeconds',
      label: bi('Duration', 'अवधि'),
      render: (val) => {
        const secs = Number(val || 0);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return (
          <span className="text-xs font-mono font-bold text-slate-700">
            {mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`}
          </span>
        );
      },
    },
    {
      key: 'creditsDeducted',
      label: bi('Credits Deducted', 'कटौती'),
      render: (val, row) => {
        const charged = row?.isCharged;
        return (
          <span className={`font-black text-xs font-mono ${charged ? 'text-rose-600' : 'text-slate-400'}`}>
            {charged ? `-${(val || 2.5).toFixed(2)} Credits` : '0.00 (No Charge)'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e3dccb] pb-3 gap-2">
        <div>
          <h3
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2"
          >
            <FiZap className="text-[#d99a3d]" size={18} />{' '}
            {bi('TELEPHONY CALL LEADS & CONNECT CHARGES', 'कॉल लीड्स और कनेक्ट शुल्क')}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {bi(
              'Incoming buyer voice calls powered by Exotel. 2.50 Credits deducted only when call connects successfully.',
              'Exotel पावर्ड कॉल्स। केवल कॉल कनेक्ट होने पर 2.50 क्रेडिट्स कटते हैं।'
            )}
          </p>
        </div>
        {typeof onRefresh === 'function' && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-[#eae3d2] text-slate-700 text-xs font-bold border border-[#e3dccb] self-start sm:self-auto cursor-pointer"
          >
            {bi('Refresh Calls', 'रीफ़्रेश करें')}
          </button>
        )}
      </div>

      <AdminDataTable
        columns={callColumns}
        data={callHistory}
        loading={loading}
        searchPlaceholder={bi('Search by customer or product...', 'ग्राहक या उत्पाद खोजें...')}
        emptyMessage={bi('No voice call interactions recorded yet.', 'अभी तक कोई कॉल बातचीत दर्ज नहीं हुई।')}
        testId="vendor-calls-table"
      />
    </div>
  );
}
