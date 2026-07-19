import React, { useState } from 'react';
import {
  FiActivity, FiBookmark, FiTool, FiPackage, FiMessageSquare,
  FiDollarSign, FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetOrdersQuery,
  useGetInquiriesQuery,
  useGetSavedListingsQuery,
  useGetQuotesQuery,
} from '../../../features/customer/activitiesApi';

const TABS = [
  { key: 'saved-products', label: 'Saved Products', icon: FiBookmark },
  { key: 'saved-services', label: 'Saved Services', icon: FiTool },
  { key: 'my-orders', label: 'My Orders Request', icon: FiPackage },
  { key: 'inquiries', label: 'Inquiry History', icon: FiMessageSquare },
  { key: 'quotes', label: 'Quotes Received', icon: FiDollarSign },
  { key: 'following-vendors', label: 'Following Vendors', icon: FiUserCheck },
  { key: 'following-services', label: 'Following Service Providers', icon: FiUserCheck },
];

export default function CustomerActivitiesPage() {
  const [activeTab, setActiveTab] = useState('saved-products');
  const { data: ordersData } = useGetOrdersQuery(undefined, { pollingInterval: 5000 });
  const { data: inquiriesData } = useGetInquiriesQuery(undefined, { pollingInterval: 5000 });
  const { data: savedData } = useGetSavedListingsQuery(undefined, { pollingInterval: 5000 });
  const { data: quotesData } = useGetQuotesQuery(undefined, { pollingInterval: 5000 });

  const savedListings = Array.isArray(savedData?.data) ? savedData.data : Array.isArray(savedData) ? savedData : [];
  const savedProducts = savedListings.filter(item => item.type !== 'service');
  const savedServices = savedListings.filter(item => item.type === 'service');

  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : Array.isArray(ordersData?.data) ? ordersData.data : Array.isArray(ordersData) ? ordersData : [];
  const inquiries = Array.isArray(inquiriesData?.inquiries) ? inquiriesData.inquiries : Array.isArray(inquiriesData?.data) ? inquiriesData.data : Array.isArray(inquiriesData) ? inquiriesData : [];
  const quotes = Array.isArray(quotesData?.data) ? quotesData.data : Array.isArray(quotesData) ? quotesData : [];
  const followingVendors = [];
  const followingServices = [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiActivity}
        title="Customer Activities"
        subtitle="View saved products, service requests, orders, inquiries, and followed vendors"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card">
        {activeTab === 'saved-products' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Saved Products ({savedProducts.length})</h3>
            {savedProducts.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No saved products yet. Browse feed to save items!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedProducts.map((p) => (
                  <div key={p._id || p.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">{p.title}</h4>
                      <p className="text-[11px] text-text-tertiary">By {p.vendor?.name || p.vendor || 'Vendor'}</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1">₹{(p.price || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => toast.success('Added to cart')}
                      className="px-3 py-1.5 gradient-brand text-white rounded-xl text-[11px] font-bold shadow-premium"
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved-services' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Saved Services ({savedServices.length})</h3>
            {savedServices.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No saved services yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedServices.map((s) => (
                  <div key={s._id || s.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">{s.title}</h4>
                      <p className="text-[11px] text-text-tertiary">By {s.vendor?.name || s.vendor || 'Service Provider'}</p>
                      <p className="text-xs font-bold text-brand-purple mt-1">₹{(s.price || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => toast.success('Booking requested')}
                      className="px-3 py-1.5 gradient-brand text-white rounded-xl text-[11px] font-bold shadow-premium"
                    >
                      Book Service
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">My Orders Request</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No order requests placed yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o._id || o.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <span className="text-[10px] text-text-tertiary font-bold">{o._id || o.id} • {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}</span>
                      <h4 className="font-bold text-xs text-text-primary">{o.item || o.items?.[0]?.title || 'Order Item'}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600">₹{(o.total || o.total_price || 0).toLocaleString()}</span>
                      <AdminStatusBadge status={o.status || 'accepted'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Inquiry History</h3>
            {inquiries.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No inquiry history found.</p>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq._id || inq.id} className="glass rounded-xl p-4 border border-white/30 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-brand-purple">{inq.vendor?.name || inq.vendor || 'Vendor'}</span>
                      <AdminStatusBadge status={inq.status || 'Replied'} />
                    </div>
                    <p className="text-xs text-text-secondary">{inq.subject || inq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Quotes Received from Vendors</h3>
            {quotes.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">No quotes received yet.</p>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <div key={q._id || q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">{q.requirement?.title || q.requirement || 'Requirement Quote'}</h4>
                      <p className="text-[11px] text-text-tertiary">From: {q.vendor?.name || q.vendor || 'Vendor'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-emerald-600">₹{(q.price || q.quotePrice || 0).toLocaleString()}</span>
                      <button
                        onClick={() => toast.success('Quote Accepted!')}
                        className="px-3.5 py-1.5 gradient-brand text-white font-bold text-[11px] rounded-xl shadow-premium"
                      >
                        Accept Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'following-vendors' || activeTab === 'following-services') && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Following List</h3>
            {(activeTab === 'following-vendors' ? followingVendors : followingServices).length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">Not following any {activeTab === 'following-vendors' ? 'vendors' : 'services'} yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeTab === 'following-vendors' ? followingVendors : followingServices).map((v) => (
                  <div key={v._id || v.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">{v.name}</h4>
                      <p className="text-[11px] text-text-tertiary">{v.category} • {v.city}</p>
                    </div>
                    <button
                      onClick={() => toast.success('Unfollowed')}
                      className="px-3 py-1.5 glass border border-border text-text-secondary rounded-xl text-[11px] font-semibold hover:bg-surface-tertiary"
                    >
                      Following
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
