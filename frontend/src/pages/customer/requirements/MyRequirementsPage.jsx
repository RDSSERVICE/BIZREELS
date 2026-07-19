import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiPlus, FiShoppingBag, FiTool, FiClock, FiMessageSquare } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetRequirementsQuery } from '../../../features/customer/requirementsApi';

const TABS = [
  { key: 'product', label: 'Product Requirements', icon: FiShoppingBag },
  { key: 'service', label: 'Service Requirements', icon: FiTool },
];

export default function MyRequirementsPage() {
  const [activeTab, setActiveTab] = useState('product');
  const { data, isFetching } = useGetRequirementsQuery(undefined, { pollingInterval: 5000 });

  const requirements = data?.data?.requirements || data?.data || data?.requirements || [
    {
      _id: 'req-1',
      type: 'product',
      title: 'Bulk Order: 10 Gaming Laptops i7 16GB RAM',
      category: 'Electronics',
      budget: 750000,
      quantity: 10,
      status: 'active',
      quotesReceived: 3,
      createdAt: '2026-07-15'
    },
    {
      _id: 'req-2',
      type: 'service',
      title: 'Full House Interior Designing & Woodwork',
      category: 'Services',
      budget: 400000,
      quantity: 1,
      status: 'active',
      quotesReceived: 5,
      createdAt: '2026-07-12'
    }
  ];

  const filteredRequirements = requirements.filter(
    (r) => (r.type || 'product') === activeTab
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFileText}
        title="My Requirements"
        subtitle="Manage your product and service requests and review vendor quotes"
      >
        <Link
          to="/customer/post-requirement"
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlus size={16} /> Post New Requirement
        </Link>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !requirements.length ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-3 border border-border">
          <FiFileText size={36} className="mx-auto text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">No {activeTab} requirements posted yet</h3>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto">
            Post your first requirement to get competitive quotes directly from verified vendors.
          </p>
          <Link
            to="/customer/post-requirement"
            className="inline-block mt-2 px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium"
          >
            Post Requirement Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequirements.map((req) => (
            <div
              key={req._id}
              className="glass rounded-2xl p-5 border border-white/50 shadow-card hover:shadow-card-hover transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded">
                    {req.category}
                  </span>
                  <h3 className="text-sm font-bold text-text-primary mt-1">{req.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <AdminStatusBadge status={req.status || 'active'} />
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Budget: ₹{req.budget?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-text-tertiary gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FiClock size={13} />
                    {req.createdAt}
                  </span>
                  <span className="flex items-center gap-1 text-brand-purple font-semibold">
                    <FiMessageSquare size={13} />
                    {req.quotesReceived || 0} Quotes Received
                  </span>
                </div>

                <Link
                  to="/customer/chat"
                  className="px-3.5 py-1.5 glass border border-border text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl transition"
                >
                  View Vendor Responses
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
