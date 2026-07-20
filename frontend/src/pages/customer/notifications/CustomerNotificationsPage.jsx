import React, { useState, useEffect } from 'react';
import { FiBell, FiShield, FiMessageSquare, FiTrendingDown, FiTag } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { api } from '../../../lib/api';

const TABS = [
  { key: 'all', label: 'All Notifications', icon: FiBell },
  { key: 'admin', label: 'Admin Messages', icon: FiShield },
  { key: 'vendor', label: 'Vendor Replies', icon: FiMessageSquare },
  { key: 'price', label: 'Price Drop', icon: FiTrendingDown },
  { key: 'offers', label: 'New Offers', icon: FiTag },
];

export default function CustomerNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/notifications/me');
      const data = res.data;
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [];
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter(
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n._id || n.id}
              className={`glass rounded-2xl p-4 border transition flex items-start gap-4 ${
                !n.is_read && !n.read ? 'border-brand-purple/40 shadow-card font-semibold' : 'border-white/30 opacity-80'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
                {n.type === 'admin' || n.type === 'system' ? <FiShield className="text-amber-500" size={18} /> : null}
                {n.type === 'vendor' && <FiMessageSquare className="text-brand-purple" size={18} />}
                {n.type === 'price' && <FiTrendingDown className="text-emerald-500" size={18} />}
                {(n.type === 'offers' || n.type === 'offer') && <FiTag className="text-brand-pink" size={18} />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary">{n.title}</h4>
                  <span className="text-[10px] text-text-tertiary">{n.created_at ? new Date(n.created_at).toLocaleDateString() : n.date || 'Recent'}</span>
                </div>
                <p className="text-xs text-text-secondary">{n.body || n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
