import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiPlus, FiShoppingBag, FiTool, FiClock, FiMessageSquare, FiTrash2, FiEye, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useGetRequirementsQuery,
  useDeleteRequirementMutation,
  useGetQuotesForRequirementQuery
} from '../../../features/customer/requirementsApi';

const TABS = [
  { key: 'all', label: 'All Requirements', icon: FiFileText },
  { key: 'product', label: 'Product Requirements', icon: FiShoppingBag },
  { key: 'service', label: 'Service Requirements', icon: FiTool },
];

export default function MyRequirementsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReqForQuotes, setSelectedReqForQuotes] = useState(null);

  const { data, isFetching } = useGetRequirementsQuery(undefined, { pollingInterval: 4000 });
  const [deleteRequirement] = useDeleteRequirementMutation();

  const { data: quotesData, isFetching: isQuotesLoading } = useGetQuotesForRequirementQuery(
    selectedReqForQuotes?._id || selectedReqForQuotes?.id,
    { skip: !selectedReqForQuotes }
  );

  const rawList = Array.isArray(data?.data?.requirements)
    ? data.data.requirements
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.requirements)
    ? data.requirements
    : Array.isArray(data)
    ? data
    : [];

  const filteredRequirements = rawList.filter((r) => {
    if (activeTab === 'all') return true;
    const reqType = (r.type || r.requirement_type || 'product').toLowerCase();
    return reqType === activeTab;
  });

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete requirement "${title}"?`)) return;
    try {
      await deleteRequirement(id).unwrap();
      toast.success('Requirement deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const quotesList = Array.isArray(quotesData?.quotes)
    ? quotesData.quotes
    : Array.isArray(quotesData?.data)
    ? quotesData.data
    : [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFileText}
        title="My Requirements & Briefs"
        subtitle="Manage your posted product and service requirements and review vendor quote proposals"
      >
        <Link
          to="/customer/post-requirement"
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlus size={16} /> Post New Requirement
        </Link>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !rawList.length ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-3 border border-border">
          <FiFileText size={36} className="mx-auto text-brand-purple opacity-70" />
          <h3 className="text-sm font-bold text-text-primary">No {activeTab !== 'all' ? activeTab : ''} requirements posted yet</h3>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto">
            Post your requirement brief to receive direct competitive quotes from verified vendors & service providers.
          </p>
          <Link
            to="/customer/post-requirement"
            className="inline-block mt-2 px-5 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium"
          >
            Post Requirement Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequirements.map((req) => {
            const reqId = req._id || req.id;
            return (
              <div
                key={reqId}
                className="glass rounded-2xl p-5 border border-white/50 shadow-card hover:shadow-card-hover transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded">
                      {req.category_id || req.category || 'General'}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary mt-1 font-display">{req.title}</h3>
                    {req.description && (
                      <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{req.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <AdminStatusBadge status={req.status || 'open'} />
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Budget: ₹{(req.budget_max || req.budget || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-text-tertiary gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FiClock size={13} />
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN') : req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                    <button
                      onClick={() => setSelectedReqForQuotes(req)}
                      className="flex items-center gap-1 text-brand-purple font-semibold hover:underline"
                    >
                      <FiMessageSquare size={13} />
                      {req.proposals_count || req.quotesCount || 0} Quotes Received
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReqForQuotes(req)}
                      className="px-3.5 py-1.5 gradient-brand text-white text-xs font-semibold rounded-xl shadow-sm hover:opacity-90 transition flex items-center gap-1"
                    >
                      <FiEye size={13} />
                      <span>View Proposals</span>
                    </button>
                    <button
                      onClick={() => handleDelete(reqId, req.title)}
                      className="p-1.5 rounded-lg text-error bg-error/10 hover:bg-error/20 transition"
                      title="Delete Requirement"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposals Modal */}
      <AdminModal
        isOpen={!!selectedReqForQuotes}
        onClose={() => setSelectedReqForQuotes(null)}
        title={`Vendor Proposals: ${selectedReqForQuotes?.title || ''}`}
      >
        <div className="space-y-4">
          {isQuotesLoading ? (
            <div className="py-8 text-center text-xs text-text-tertiary">Loading quotes...</div>
          ) : quotesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-tertiary space-y-2">
              <FiMessageSquare className="w-8 h-8 text-brand-purple mx-auto opacity-50" />
              <p className="font-bold text-text-primary">No quotes submitted by vendors yet.</p>
              <p>Vendors will submit bids when reviewing your requirement in their lead board.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quotesList.map((q) => (
                <div key={q.id || q._id} className="bg-surface-secondary p-4 rounded-xl space-y-2 border border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-text-primary">{q.vendor_name || 'Vendor Partner'}</span>
                    <span className="font-black text-xs text-emerald-600">₹{(q.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {q.notes && <p className="text-xs text-text-tertiary">{q.notes}</p>}
                  <div className="flex justify-between items-center text-[10px] text-text-tertiary pt-1 border-t border-border/50">
                    <span>Delivery: {q.estimatedDelivery || '1-2 Days'}</span>
                    <Link to="/customer/chat" className="text-brand-purple font-bold hover:underline">
                      Chat with Vendor →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
