import React, { useState } from 'react';
import { FiInbox, FiShoppingBag, FiTool, FiFileText, FiMessageCircle, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { useGetVendorLeadsQuery } from '../../../features/vendor/vendorApi';

const TABS = [
  { key: 'product-enquiries', label: 'Product Enquiries', icon: FiShoppingBag },
  { key: 'service-enquiries', label: 'Service Enquiries', icon: FiTool },
  { key: 'quote-requests', label: 'Quote Requests', icon: FiFileText },
  { key: 'requirement-matches', label: 'Requirement Matches', icon: FiInbox },
];

export default function VendorLeadsPage() {
  const [activeTab, setActiveTab] = useState('product-enquiries');
  const { data, isFetching } = useGetVendorLeadsQuery(undefined, { pollingInterval: 5000 });

  const productEnquiries = Array.isArray(data?.productEnquiries) ? data.productEnquiries : Array.isArray(data?.data) ? data.data : [];
  const serviceEnquiries = Array.isArray(data?.serviceEnquiries) ? data.serviceEnquiries : [];
  const quoteRequests = Array.isArray(data?.quoteRequests) ? data.quoteRequests : [];
  const requirementMatches = Array.isArray(data?.requirementMatches) ? data.requirementMatches : [];

  const renderEnquiryCard = (e, type = 'product') => (
    <div key={e._id || e.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
      <div>
        <h4 className="font-bold text-xs text-text-primary">{e.customer || 'Customer'} ({e.phone || 'Phone hidden'})</h4>
        <p className={`text-xs font-semibold mt-0.5 ${type === 'product' ? 'text-brand-orange' : 'text-brand-purple'}`}>
          {type === 'product' ? 'Item' : 'Service'}: {e.item || e.message}
        </p>
        <p className="text-xs text-text-secondary mt-1">"{e.message || e.msg}"</p>
      </div>
      <button
        onClick={() => toast.success(`Opened contact option for ${e.customer || 'customer'}`)}
        className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
      >
        {type === 'product' ? <FiMessageCircle size={14} /> : <FiPhone size={14} />}
        {type === 'product' ? 'Reply on WhatsApp' : 'Call Customer'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiInbox}
        title="Leads & Customer Enquiries"
        subtitle="Respond to customer inquiries, quote requests, and nearby requirement matches"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
          </div>
        ) : null}

        {activeTab === 'product-enquiries' && (
          productEnquiries.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No product enquiries found.</p>
          ) : (
            productEnquiries.map((e) => renderEnquiryCard(e, 'product'))
          )
        )}

        {activeTab === 'service-enquiries' && (
          serviceEnquiries.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No service enquiries found.</p>
          ) : (
            serviceEnquiries.map((e) => renderEnquiryCard(e, 'service'))
          )
        )}

        {activeTab === 'quote-requests' && (
          quoteRequests.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No quote requests found.</p>
          ) : (
            quoteRequests.map((q) => (
              <div key={q._id || q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{q.customer}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{q.item} • Target Budget: {q.budget}</p>
                </div>
                <button
                  onClick={() => toast.success('Quote submitted to customer!')}
                  className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition"
                >
                  Submit Proposal Quote
                </button>
              </div>
            ))
          )
        )}

        {activeTab === 'requirement-matches' && (
          requirementMatches.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No requirement matches found.</p>
          ) : (
            requirementMatches.map((m) => (
              <div key={m._id || m.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{m.title}</h4>
                  <p className="text-xs text-text-tertiary mt-0.5">Location: {m.city} ({m.distance}) • Budget: {m.budget}</p>
                </div>
                <button
                  onClick={() => toast.success('Sent interest to customer')}
                  className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition"
                >
                  Send Pitch
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
