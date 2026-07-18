import React, { useState } from 'react';
import {
  FiBookmark, FiShoppingBag, FiTool, FiClock, FiFileText,
  FiUserCheck, FiDollarSign, FiMessageSquare, FiPackage
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CustomerActivitiesPage() {
  const [activeTab, setActiveTab] = useState('saved-products');

  const mockSavedProducts = [
    { id: 1, title: 'Sony Bravia OLED TV 55"', price: 64990, vendor: 'Sony Center' },
    { id: 2, title: 'Ergonomic Office Chair', price: 8999, vendor: 'Featherlite' }
  ];

  const mockSavedServices = [
    { id: 1, title: 'Deep Home Cleaning', price: 3499, vendor: 'Urban Clean' },
    { id: 2, title: 'AC Installation & Gas Refill', price: 1499, vendor: 'Cooling Masters' }
  ];

  const mockOrders = [
    { id: 'ORD-9081', item: 'Sony Bravia OLED TV', status: 'In Transit', total: 64990, date: '2026-07-16' },
    { id: 'ORD-8922', item: 'Office Chair', status: 'Delivered', total: 8999, date: '2026-07-10' }
  ];

  const mockInquiries = [
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

  const subTabs = [
    { id: 'saved-products', label: 'Saved Products', icon: FiBookmark },
    { id: 'saved-services', label: 'Saved Services', icon: FiTool },
    { id: 'my-orders', label: 'My Orders Request', icon: FiPackage },
    { id: 'inquiries', label: 'Inquiry History', icon: FiMessageSquare },
    { id: 'quotes', label: 'Quotes Received', icon: FiDollarSign },
    { id: 'following-vendors', label: 'Following Vendors', icon: FiUserCheck },
    { id: 'following-services', label: 'Following Service Providers', icon: FiUserCheck },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Customer Activities</h2>
        <p className="text-xs text-slate-400">View saved products, service requests, orders, inquiries, and followed vendors</p>
      </div>

      {/* Subtabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white'
                }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {activeTab === 'saved-products' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Saved Products ({mockSavedProducts.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockSavedProducts.map((p) => (
                <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-white">{p.title}</h4>
                    <p className="text-[11px] text-slate-400">By {p.vendor}</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">₹{p.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => toast.success('Added to cart')} className="px-3 py-1.5 bg-indigo-600 rounded-xl text-[11px] font-bold text-white">Buy Now</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'saved-services' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Saved Services ({mockSavedServices.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockSavedServices.map((s) => (
                <div key={s.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-white">{s.title}</h4>
                    <p className="text-[11px] text-slate-400">By {s.vendor}</p>
                    <p className="text-xs font-bold text-purple-400 mt-1">₹{s.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => toast.success('Booking requested')} className="px-3 py-1.5 bg-purple-600 rounded-xl text-[11px] font-bold text-white">Book Service</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">My Orders Request</h3>
            <div className="space-y-3">
              {mockOrders.map((o) => (
                <div key={o.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold">{o.id} • {o.date}</span>
                    <h4 className="font-bold text-xs text-white">{o.item}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-400">₹{o.total.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${o.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Inquiry History</h3>
            <div className="space-y-3">
              {mockInquiries.map((inq) => (
                <div key={inq.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-indigo-400">{inq.vendor}</span>
                    <span className="text-emerald-400 font-semibold">{inq.status}</span>
                  </div>
                  <p className="text-xs text-slate-200">{inq.subject}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Quotes Received from Vendors</h3>
            <div className="space-y-3">
              {mockQuotes.map((q) => (
                <div key={q.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-white">{q.requirement}</h4>
                    <p className="text-[11px] text-slate-400">From: {q.vendor} ({q.date})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-emerald-400">₹{q.quotePrice.toLocaleString()}</span>
                    <button onClick={() => toast.success('Quote Accepted!')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl">Accept Quote</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'following-vendors' || activeTab === 'following-services') && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Following List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'following-vendors' ? mockFollowingVendors : mockFollowingServices).map((v) => (
                <div key={v.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-white">{v.name}</h4>
                    <p className="text-[11px] text-slate-400">{v.category} • {v.city}</p>
                  </div>
                  <button onClick={() => toast.success('Unfollowed')} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-[11px] font-semibold">Following</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
