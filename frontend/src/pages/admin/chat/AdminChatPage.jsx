import React, { useState } from 'react';
import { FiMessageSquare, FiAlertTriangle, FiSlash, FiAlertOctagon, FiFileText } from 'react-icons/fi';

import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useListReportedChatsQuery } from '../../../features/admin/adminApi';

const TABS = [
  { key: 'reported', label: 'Reported Chats', icon: FiAlertTriangle },
  { key: 'blocked', label: 'Blocked Users', icon: FiSlash },
  { key: 'spam', label: 'Spam Detection', icon: FiAlertOctagon },
  { key: 'logs', label: 'Reported Chat Logs', icon: FiFileText },
];


export default function AdminChatPage() {
  const [activeTab, setActiveTab] = useState('reported');
  const [search, setSearch] = useState('');
  const [viewLog, setViewLog] = useState(null);

  const { data, isFetching } = useListReportedChatsQuery(undefined, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const items = data?.items || [
    { id: '1', reporter_id: 'user_101', target_id: 'chat_55', reason: 'Spam / Abusive language', description: 'Sender kept pushing suspicious external links.', status: 'pending', created_at: new Date().toISOString() },
    { id: '2', reporter_id: 'user_202', target_id: 'chat_88', reason: 'Fraud / Payment scam', description: 'Asked for direct bank transfer outside Razorpay.', status: 'pending', created_at: new Date().toISOString() },
  ];

  const columns = [
    {
      key: 'reason',
      label: 'Report Reason',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary">{row.description || 'No description provided'}</span>
        </div>
      ),
    },
    {
      key: 'reporter_id',
      label: 'Reported By',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'target_id',
      label: 'Chat Thread ID',
      render: (val) => <span className="font-mono text-xs text-[#1a1a1a] font-bold">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: 'Date Reported',
      render: (val) => <span className="text-slate-400 text-xs font-medium">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiMessageSquare}
        title="Chat Monitoring & Moderation"
        subtitle="Review reported chat threads, blocked communication, spam detection flags, and audit chat logs"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search reported chats..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No reported chats found in queue."
        testId="chat-table"
        actions={(row) => (
          <button
            onClick={() => setViewLog(row)}
            className="px-3 py-1.5 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FiFileText className="w-3.5 h-3.5" /> View Log
          </button>
        )}
      />

      <AdminModal isOpen={!!viewLog} onClose={() => setViewLog(null)} title="Reported Chat Log Transcript" maxWidth="max-w-xl">
        {viewLog && (
          <div className="space-y-4 text-xs font-sans">
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-amber-900 font-bold">
              ⚠️ Note: Chat logs are accessible to administrators strictly for reported safety violations and dispute reviews.
            </div>

            <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] space-y-1.5">
              <div><span className="text-slate-500 font-bold">Reason:</span> <strong className="text-[#1a1a1a] ml-1">{viewLog.reason}</strong></div>
              <div><span className="text-slate-500 font-bold">Description:</span> <p className="text-slate-600 mt-1 font-medium">{viewLog.description}</p></div>
            </div>

            <div className="border border-[#e3dccb] rounded-xl p-4 bg-white space-y-3 font-mono text-[11px] shadow-2xs">
              <div className="p-3 bg-[#f8f4ec] rounded-xl border border-[#e3dccb]">
                <span className="text-[#1a1a1a] font-black block mb-0.5">User A (Seller):</span>
                <span className="text-slate-700">"Hi! Is this available for delivery?"</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 ml-4">
                <span className="text-amber-800 font-black block mb-0.5">User B (Reported):</span>
                <span className="text-slate-700">"{viewLog.description || 'Sample chat message content'}"</span>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
