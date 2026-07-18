import React, { useState } from 'react';
import { FiBell, FiSend, FiMessageSquare, FiMail, FiSmartphone, FiCalendar, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useSendBroadcastNotificationMutation } from '../../../features/admin/adminApi';

const TABS = [
  { key: 'broadcast', label: 'Broadcast Message', icon: FiSend },
  { key: 'channels', label: 'Notification Channels', icon: FiBell },
  { key: 'scheduled', label: 'Scheduled Notifications', icon: FiCalendar },
];

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('broadcast');
  const [form, setForm] = useState({
    channel: 'in_app', // 'in_app' | 'push' | 'sms' | 'email'
    target_role: 'all', // 'all' | 'customer' | 'vendor' | 'creator'
    title: '',
    body: '',
  });

  const [sendBroadcast, { isLoading }] = useSendBroadcastNotificationMutation();

  const handleSend = async () => {
    if (!form.title || !form.body) return toast.error('Title and message content required');
    try {
      const res = await sendBroadcast(form).unwrap();
      toast.success(`Broadcast sent to ${res.count} users!`);
      setForm({ channel: 'in_app', target_role: 'all', title: '', body: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Broadcast failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBell}
        title="Notification Center"
        subtitle="Send broadcast messages via Push, SMS, Email, or In-App notifications to customers, vendors, and creators"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'broadcast' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
            <FiSend className="text-brand-purple" /> Compose Broadcast Notification
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Notification Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="in_app">In-App Notification</option>
                <option value="push">Push Notification (FCM)</option>
                <option value="sms">SMS (MSG91)</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Target Audience</label>
              <select
                value={form.target_role}
                onChange={(e) => setForm((prev) => ({ ...prev, target_role: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Users (Everyone)</option>
                <option value="customer">Customers Only</option>
                <option value="vendor">Vendors Only</option>
                <option value="creator">Creators Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Notification Title</label>
            <input
              type="text"
              placeholder="e.g. Festival Offer! 20% cashback on all reel boosts"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Message Content</label>
            <textarea
              placeholder="Enter your message details here..."
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple h-28"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-premium"
          >
            <FiSend /> {isLoading ? 'Sending Broadcast...' : 'Send Broadcast Now'}
          </button>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl border border-white/50 space-y-2">
            <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-xl w-fit"><FiBell className="w-5 h-5" /></div>
            <h4 className="text-sm font-bold text-text-primary">In-App Notifications</h4>
            <span className="text-[10px] text-emerald-500 font-bold block">● Operational (Realtime)</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/50 space-y-2">
            <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-xl w-fit"><FiSmartphone className="w-5 h-5" /></div>
            <h4 className="text-sm font-bold text-text-primary">Push (FCM)</h4>
            <span className="text-[10px] text-emerald-500 font-bold block">● Active</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/50 space-y-2">
            <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl w-fit"><FiMessageSquare className="w-5 h-5" /></div>
            <h4 className="text-sm font-bold text-text-primary">SMS (MSG91)</h4>
            <span className="text-[10px] text-emerald-500 font-bold block">● Gateway Connected</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/50 space-y-2">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-fit"><FiMail className="w-5 h-5" /></div>
            <h4 className="text-sm font-bold text-text-primary">Email Service</h4>
            <span className="text-[10px] text-emerald-500 font-bold block">● SMTP Configured</span>
          </div>
        </div>
      )}
    </div>
  );
}
