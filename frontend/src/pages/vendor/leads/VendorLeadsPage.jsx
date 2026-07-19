import React, { useState } from 'react';
import { FiInbox, FiShoppingBag, FiTool, FiFileText, FiMessageCircle, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
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

  const productEnquiries = data?.productEnquiries || [
    { id: '1', customer: 'Rahul Sharma', phone: '+91 98200 11223', item: 'Sony 55" OLED TV', msg: 'Interested in instant delivery to Bandra West.', date: 'Today 11:30 AM' }
  ];
  const serviceEnquiries = data?.serviceEnquiries || [
    { id: '2', customer: 'Priya Patel', phone: '+91 97111 88334', item: 'AC Repair Service', msg: 'Need gas refilling for 2 split AC units tomorrow.', date: 'Yesterday' }
  ];
  const quoteRequests = data?.quoteRequests || [
    { id: '3', customer: 'Tech Solutions Corp', phone: '+91 99000 55443', item: 'Bulk Laptops (10 Units)', budget: '₹7,50,000', date: 'Jul 15' }
  ];
  const requirementMatches = data?.requirementMatches || [
    { id: '4', title: 'Customer Request: 5 Ergonomic Office Chairs', city: 'Mumbai', budget: '₹45,000', distance: '3.5 km' }
  ];

  const renderEnquiryCard = (e, type = 'product') => (
    <div key={e.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
      <div>
        <h4 className="font-bold text-xs text-text-primary">{e.customer} ({e.phone})</h4>
        <p className={`text-xs font-semibold mt-0.5 ${type === 'product' ? 'text-brand-orange' : 'text-brand-purple'}`}>
          {type === 'product' ? 'Item' : 'Service'}: {e.item}
        </p>
        <p className="text-xs text-text-secondary mt-1">"{e.msg}"</p>
      </div>
      <button
        onClick={() => toast.success(`Opened WhatsApp chat with ${e.customer}`)}
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
        {isFetching && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
          </div>
        )}

        {activeTab === 'product-enquiries' && productEnquiries.map((e) => renderEnquiryCard(e, 'product'))}
        {activeTab === 'service-enquiries' && serviceEnquiries.map((e) => renderEnquiryCard(e, 'service'))}

        {activeTab === 'quote-requests' && quoteRequests.map((q) => (
          <div key={q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
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
        ))}

        {activeTab === 'requirement-matches' && requirementMatches.map((m) => (
          <div key={m.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
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
        ))}
      </div>
    </div>
  );
}
