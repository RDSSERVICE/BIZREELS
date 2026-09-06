import React, { useState } from 'react';
import {
  FiMail,
  FiUser,
  FiPhone,
  FiClock,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
  FiMessageSquare,
  FiTag,
  FiCheck,
  FiArchive,
  FiMoreVertical,
  FiEye,
  FiCalendar
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListContactSubmissionsQuery,
  useUpdateContactSubmissionMutation,
  useDeleteContactSubmissionMutation,
} from '../../../features/admin/adminApi';

const SUBJECT_LABELS = {
  general: { label: 'General Inquiry', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  vendor_onboarding: { label: 'Vendor Onboarding', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  creator_marketplace: { label: 'Creator Marketplace', color: 'bg-purple-100 text-purple-900 border-purple-200' },
  order_refund: { label: 'Order & Refund', color: 'bg-blue-100 text-blue-900 border-blue-200' },
  grievance: { label: 'Statutory Grievance', color: 'bg-rose-100 text-rose-900 border-rose-200' },
  b2b_partnership: { label: 'B2B Partnership', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Submissions' },
  { value: 'new', label: 'New / Unread' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminContactInquiriesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading, isFetching, refetch } = useListContactSubmissionsQuery(
    {
      page,
      limit: 15,
      status: statusFilter,
      subject: subjectFilter,
      search,
    },
    { refetchOnMountOrArgChange: true }
  );

  const [updateSubmission, { isLoading: isUpdating }] = useUpdateContactSubmissionMutation();
  const [deleteSubmission, { isLoading: isDeleting }] = useDeleteContactSubmissionMutation();

  const submissions = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const newCount = data?.data?.new_count || 0;
  const totalPages = data?.data?.pages || 1;

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setAdminNotes(item.admin_notes || '');
    if (item.status === 'new') {
      // Mark as in_progress when opened
      updateSubmission({ id: item._id, status: 'in_progress' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSubmission({ id, status: newStatus }).unwrap();
      toast.success(`Status updated to "${newStatus}"`);
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;
    try {
      await updateSubmission({ id: selectedItem._id, admin_notes: adminNotes }).unwrap();
      toast.success('Admin notes saved');
      setSelectedItem((prev) => ({ ...prev, admin_notes: adminNotes }));
    } catch (err) {
      toast.error('Failed to save notes');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this submission?')) {
      return;
    }
    try {
      await deleteSubmission(id).unwrap();
      toast.success('Submission deleted');
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      toast.error('Failed to delete submission');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in p-4 sm:p-6 font-sans">
      <AdminPageHeader
        icon={FiMail}
        title="Contact Form Inquiries"
        subtitle="Manage public submissions, user questions, vendor onboarding leads, and statutory grievances"
      >
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="px-3 py-1 bg-amber-500 text-black font-black text-xs rounded-xl shadow-xs">
              {newCount} New
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white border border-[#e3dccb] hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Inquiries"
          >
            <FiRefreshCw size={15} className={isFetching ? 'animate-spin text-[#d99a3d]' : 'text-slate-600'} />
          </button>
        </div>
      </AdminPageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border-2 border-[#241b15] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or message text..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
          >
            <option value="all">All Topics</option>
            {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List Container */}
      <div className="bg-white rounded-2xl border-2 border-[#241b15] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <FiRefreshCw className="animate-spin inline mr-2" size={16} />
            Loading contact inquiries...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FiMail size={32} className="mx-auto text-slate-300" />
            <p className="font-bold text-sm text-[#1a1a1a]">No inquiries found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Any public inquiries submitted through the Contact Us form will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf7f2] border-b border-[#e3dccb] text-[#1a1a1a] uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3dccb]/60">
                {submissions.map((sub) => {
                  const subjectMeta = SUBJECT_LABELS[sub.subject] || SUBJECT_LABELS.general;
                  const isNew = sub.status === 'new';

                  return (
                    <tr
                      key={sub._id}
                      onClick={() => handleOpenDetail(sub)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isNew ? 'bg-amber-50/40 font-bold' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'new'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : sub.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : sub.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {sub.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {sub.status}
                        </span>
                      </td>

                      {/* Sender */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1a1a1a] text-xs">{sub.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{sub.email}</div>
                        {sub.phone && <div className="text-[10px] text-slate-400 font-normal">{sub.phone}</div>}
                      </td>

                      {/* Topic */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${subjectMeta.color}`}
                        >
                          {subjectMeta.label}
                        </span>
                      </td>

                      {/* Message Snippet */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-xs text-slate-600 font-normal leading-relaxed">
                          {sub.message}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(sub)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-slate-700 transition cursor-pointer"
                            title="View Full Details"
                          >
                            <FiEye size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(sub._id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-400 transition cursor-pointer"
                            title="Delete Submission"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3.5 bg-[#faf7f2] border-t border-[#e3dccb] flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong>{submissions.length}</strong> of <strong>{total}</strong> inquiries
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] font-bold text-xs disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold text-[#1a1a1a]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] font-bold text-xs disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail & Quick Reply Modal */}
      {selectedItem && (
        <AdminModal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`Inquiry from ${selectedItem.name}`}
        >
          <div className="space-y-4 text-xs">
            {/* Sender & Topic Summary Bar */}
            <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e3dccb] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-black text-sm text-[#1a1a1a]">{selectedItem.name}</h4>
                  <div className="flex items-center gap-3 text-slate-500 pt-0.5">
                    <a
                      href={`mailto:${selectedItem.email}`}
                      className="text-[#d99a3d] font-bold underline hover:text-[#b87d27]"
                    >
                      {selectedItem.email}
                    </a>
                    {selectedItem.phone && (
                      <a href={`tel:${selectedItem.phone}`} className="text-slate-700 hover:underline">
                        📞 {selectedItem.phone}
                      </a>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider ${
                    SUBJECT_LABELS[selectedItem.subject]?.color || 'bg-slate-100'
                  }`}
                >
                  {SUBJECT_LABELS[selectedItem.subject]?.label || selectedItem.subject}
                </span>
              </div>

              <div className="pt-2 border-t border-[#e3dccb]/70 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Submitted:{' '}
                  {new Date(selectedItem.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                {selectedItem.ip_address && (
                  <span className="font-mono text-[10px]">IP: {selectedItem.ip_address}</span>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                Message Content:
              </label>
              <div className="p-4 rounded-2xl bg-white border-2 border-[#241b15] text-xs sm:text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap font-sans">
                {selectedItem.message}
              </div>
            </div>

            {/* Status Switcher */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                Update Status:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['new', 'in_progress', 'resolved', 'archived'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedItem._id, st)}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer border ${
                      selectedItem.status === st
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                        : 'bg-[#faf7f2] text-slate-600 border-[#e3dccb] hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Internal Admin Follow-up Notes:
                </label>
                <button
                  onClick={handleSaveNotes}
                  type="button"
                  className="text-[11px] font-black text-[#d99a3d] hover:underline"
                >
                  Save Notes
                </button>
              </div>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about phone call resolution, customer account lookup, or escalation..."
                className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-medium text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
              />
            </div>

            {/* Direct Email Action Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedItem._id)}
                className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <FiTrash2 size={13} />
                <span>Delete</span>
              </button>

              <a
                href={`mailto:${selectedItem.email}?subject=Regarding your BizReels Inquiry (${SUBJECT_LABELS[selectedItem.subject]?.label || 'Contact'})`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] font-bold text-xs shadow-xs"
              >
                <FiMail size={14} />
                <span>Email Customer Directly</span>
              </a>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
