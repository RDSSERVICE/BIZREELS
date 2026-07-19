import React, { useState } from 'react';
import {
  FiActivity, FiBookmark, FiTool, FiPackage, FiMessageSquare,
  FiDollarSign, FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetOrdersQuery, useGetInquiriesQuery } from '../../../features/customer/activitiesApi';

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
  const { data: ordersData, isFetching: isFetchingOrders } = useGetOrdersQuery(undefined, { pollingInterval: 5000 });
  const { data: inquiriesData, isFetching: isFetchingInquiries } = useGetInquiriesQuery(undefined, { pollingInterval: 5000 });

  const mockSavedProducts = [
    { id: 1, title: 'Sony Bravia OLED TV 55"', price: 64990, vendor: 'Sony Center' },
    { id: 2, title: 'Ergonomic Office Chair', price: 8999, vendor: 'Featherlite' }
  ];

  const mockSavedServices = [
    { id: 1, title: 'Deep Home Cleaning', price: 3499, vendor: 'Urban Clean' },
    { id: 2, title: 'AC Installation & Gas Refill', price: 1499, vendor: 'Cooling Masters' }
  ];

  const orders = ordersData?.orders || ordersData?.data || [
    { id: 'ORD-9081', item: 'Sony Bravia OLED TV', status: 'In Transit', total: 64990, date: '2026-07-16' },
    { id: 'ORD-8922', item: 'Office Chair', status: 'Delivered', total: 8999, date: '2026-07-10' }
  ];

  const inquiries = inquiriesData?.inquiries || inquiriesData?.data || [
    { id: 'INQ-101', vendor: 'Trends Boutique', subject: 'Inquiry regarding summer collection availability', status: 'Replied' },
    { id: 'INQ-102', vendor: 'Royal Furniture', subject: 'Inquiry for sofa custom fabric color options', status: 'Pending' }
  ];

  const mockQuotes = [
    { id: 'Q-55', vendor: 'TechSuppliers India', requirement: '10 Gaming Laptops', quotePrice: 720000, date: '2026-07-17' },
    { id: 'Q-56', vendor: 'WoodCraft Interiors', requirement: 'Interior Designing', quotePrice: 380000, date: '2026-07-14' }
  ];

  const mockFollowingVendors = [
    { id: 'v1', name: 'Trends Fashion Store', city: 'Mumbai', category: 'Fashion & Apparel' },
    { id: 'v2', name: 'iTech Care Electronics', city: 'Delhi', category: 'Electronics' }
  ];

  const mockFollowingServices = [
    { id: 'v3', name: 'Cooling Masters AC Repair', city: 'Mumbai', category: 'Home Appliance Service' }
  ];

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
            <h3 className="text-sm font-bold text-text-primary font-display">Saved Products ({mockSavedProducts.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockSavedProducts.map((p) => (
                <div key={p.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{p.title}</h4>
                    <p className="text-[11px] text-text-tertiary">By {p.vendor}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">₹{p.price.toLocaleString()}</p>
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
          </div>
        )}

        {activeTab === 'saved-services' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Saved Services ({mockSavedServices.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockSavedServices.map((s) => (
                <div key={s.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{s.title}</h4>
                    <p className="text-[11px] text-text-tertiary">By {s.vendor}</p>
                    <p className="text-xs font-bold text-brand-purple mt-1">₹{s.price.toLocaleString()}</p>
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
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">My Orders Request</h3>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] text-text-tertiary font-bold">{o.id} • {o.date}</span>
                    <h4 className="font-bold text-xs text-text-primary">{o.item}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600">₹{o.total?.toLocaleString()}</span>
                    <AdminStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Inquiry History</h3>
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="glass rounded-xl p-4 border border-white/30 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-brand-purple">{inq.vendor}</span>
                    <AdminStatusBadge status={inq.status} />
                  </div>
                  <p className="text-xs text-text-secondary">{inq.subject}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Quotes Received from Vendors</h3>
            <div className="space-y-3">
              {mockQuotes.map((q) => (
                <div key={q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{q.requirement}</h4>
                    <p className="text-[11px] text-text-tertiary">From: {q.vendor} ({q.date})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-emerald-600">₹{q.quotePrice.toLocaleString()}</span>
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
          </div>
        )}

        {(activeTab === 'following-vendors' || activeTab === 'following-services') && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display">Following List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'following-vendors' ? mockFollowingVendors : mockFollowingServices).map((v) => (
                <div key={v.id} className="glass rounded-xl p-4 border border-white/30 flex justify-between items-center">
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
          </div>
        )}
      </div>
    </div>
  );
}
