import React, { useState } from 'react';
import { FiBell, FiShield, FiMessageSquare, FiTrendingDown, FiTag } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';

const TABS = [
  { key: 'all', label: 'All Notifications', icon: FiBell },
  { key: 'admin', label: 'Admin Messages', icon: FiShield },
  { key: 'vendor', label: 'Vendor Replies', icon: FiMessageSquare },
  { key: 'price', label: 'Price Drop', icon: FiTrendingDown },
  { key: 'offers', label: 'New Offers', icon: FiTag },
];

export default function CustomerNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');

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
    (n) => activeTab === 'all' || n.type === activeTab
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBell}
        title="Notifications Center"
        subtitle="Stay updated on admin announcements, vendor replies, price drops, and offers"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`glass rounded-2xl p-4 border transition flex items-start gap-4 ${
              !n.read ? 'border-brand-purple/40 shadow-card font-semibold' : 'border-white/30 opacity-80'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
              {n.type === 'admin' && <FiShield className="text-amber-500" size={18} />}
              {n.type === 'vendor' && <FiMessageSquare className="text-brand-purple" size={18} />}
              {n.type === 'price' && <FiTrendingDown className="text-emerald-500" size={18} />}
              {n.type === 'offers' && <FiTag className="text-brand-pink" size={18} />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary">{n.title}</h4>
                <span className="text-[10px] text-text-tertiary">{n.date}</span>
              </div>
              <p className="text-xs text-text-secondary">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
