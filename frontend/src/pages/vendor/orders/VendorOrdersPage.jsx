import React, { useState } from 'react';
import { FiShoppingCart, FiCheck, FiX, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'accepted' | 'completed' | 'cancelled'

  const [orders, setOrders] = useState([
    { id: 'ORD-901', customer: 'Amit Verma', items: 'Sony Bravia 55" OLED TV (Qty: 1)', total: 64990, status: 'new', date: 'Today 10:15 AM' },
    { id: 'ORD-899', customer: 'Neha Singh', items: 'Ergonomic Office Chair (Qty: 2)', total: 17998, status: 'accepted', date: 'Yesterday' },
    { id: 'ORD-850', customer: 'Vikram Mehta', items: 'AC Deep Chemical Wash Service', total: 1499, status: 'completed', date: 'Jul 12' },
    { id: 'ORD-812', customer: 'Suresh Kumar', items: 'Leather Sofa Set', total: 24999, status: 'cancelled', date: 'Jul 05' },
  ]);

  const handleStatusChange = (id, newStatus) => {
    setOrders(orders.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    toast.success(`Order ${id} marked as ${newStatus.toUpperCase()}`);
  };

  const filtered = orders.filter((o) => o.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiShoppingCart className="text-pink-400" />
            <span>Order Requests Management</span>
          </h2>
          <p className="text-xs text-slate-400">Accept, track, complete, or reject incoming online customer order requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {['new', 'accepted', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
              activeTab === tab ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab} Orders
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((o) => (
          <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-indigo-400">{o.id}</span>
                <span className="text-[10px] text-slate-500">• {o.date}</span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1">{o.customer}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{o.items}</p>
              <p className="text-xs font-bold text-emerald-400 mt-1">Total: ₹{o.total.toLocaleString()}</p>
            </div>

            {o.status === 'new' && (
              <div className="flex items-center gap-2">
                <button onClick={() => handleStatusChange(o.id, 'accepted')} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                  <FiCheck size={14} /> Accept
                </button>
                <button onClick={() => handleStatusChange(o.id, 'cancelled')} className="px-3 py-2 bg-rose-500/10 text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1">
                  <FiX size={14} /> Reject
                </button>
              </div>
            )}

            {o.status === 'accepted' && (
              <button onClick={() => handleStatusChange(o.id, 'completed')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                <FiCheckCircle size={14} /> Mark Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
