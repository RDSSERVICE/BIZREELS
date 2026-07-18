import React, { useState } from 'react';
import { FiBell, FiShield, FiMessageSquare, FiTrendingDown, FiTag, FiCheckCircle } from 'react-icons/fi';

export default function CustomerNotificationsPage() {
  const [filter, setFilter] = useState('all'); // 'all' | 'admin' | 'vendor' | 'price' | 'offers'

  const mockNotifications = [
    {
      id: 1,
      type: 'admin',
      title: 'System Announcement',
      body: 'BizReels Platform Upgrade: New AI Reel Generator is now active for vendors & creators!',
      date: '10 mins ago',
      read: false
    },
    {
      id: 2,
      type: 'vendor',
      title: 'Vendor Reply',
      body: 'Trends Fashion Store replied to your inquiry: "Yes, size M is available in stock!"',
      date: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'price',
      title: 'Price Drop Alert! 🎉',
      body: 'Sony Bravia OLED TV 55" price dropped by ₹5,000 in your saved list!',
      date: '3 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'offers',
      title: 'Exclusive Offer Available',
      body: 'Get 15% cashback on all home cleaning service bookings today.',
      date: '1 day ago',
      read: true
    }
  ];

  const filtered = mockNotifications.filter(
    (n) => filter === 'all' || n.type === filter
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiBell className="text-indigo-400" />
            <span>Notifications</span>
          </h2>
          <p className="text-xs text-slate-400">Stay updated on admin announcements, vendor replies, price drops, and offers</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${filter === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'
            }`}
        >
          All Notifications
        </button>

        <button
          onClick={() => setFilter('admin')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition ${filter === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'
            }`}
        >
          <FiShield size={14} />
          <span>New Messages (Admin Only)</span>
        </button>

        <button
          onClick={() => setFilter('vendor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition ${filter === 'vendor' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'
            }`}
        >
          <FiMessageSquare size={14} />
          <span>Vendor Replies</span>
        </button>

        <button
          onClick={() => setFilter('price')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition ${filter === 'price' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'
            }`}
        >
          <FiTrendingDown size={14} />
          <span>Price Drop</span>
        </button>

        <button
          onClick={() => setFilter('offers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition ${filter === 'offers' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'
            }`}
        >
          <FiTag size={14} />
          <span>New Offers</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition flex items-start gap-4 ${!n.read ? 'bg-slate-900 border-indigo-500/30 shadow-lg' : 'bg-slate-950 border-slate-800/80 opacity-80'
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {n.type === 'admin' && <FiShield className="text-amber-400" size={18} />}
              {n.type === 'vendor' && <FiMessageSquare className="text-purple-400" size={18} />}
              {n.type === 'price' && <FiTrendingDown className="text-emerald-400" size={18} />}
              {n.type === 'offers' && <FiTag className="text-pink-400" size={18} />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{n.title}</h4>
                <span className="text-[10px] text-slate-500">{n.date}</span>
              </div>
              <p className="text-xs text-slate-300">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
