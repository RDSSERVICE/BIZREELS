import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBell, FiShield, FiMessageSquare, FiTrendingDown, FiTag, FiClock,
  FiShoppingBag, FiDollarSign, FiCheck, FiTrash2, FiExternalLink, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

const TABS = [
  { key: 'all', label: 'All Notifications', icon: FiBell },
  { key: 'orders', label: 'Orders & Leads', icon: FiShoppingBag },
  { key: 'offers', label: 'Offers & Discounts', icon: FiTag },
  { key: 'messages', label: 'Messages & Inquiries', icon: FiMessageSquare },
  { key: 'system', label: 'System & Security', icon: FiShield },
];

function OfferCountdown({ validTill }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(validTill) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' ') + ' left');
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [validTill]);

  if (timeLeft === 'Expired') {
    return <span className="text-red-500 font-bold text-[10px] uppercase bg-red-500/10 px-2 py-0.5 rounded shadow-xs shrink-0">Expired</span>;
  }

  return (
    <span className="text-brand-orange font-bold text-[10px] bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit animate-pulse shrink-0">
      <FiClock className="animate-spin-slow" /> {timeLeft}
    </span>
  );
}

export default function CustomerNotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const pathname = location.pathname;
  const isVendorPortal = pathname.includes('/vendor');
  const isCreatorPortal = pathname.includes('/creator');

  // Determine the active role for this page based on the URL
  const activeRole = isVendorPortal ? 'vendor' : isCreatorPortal ? 'creator' : 'customer';

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/notifications/me?role=${activeRole}`).catch(() => api.get(`/v1/notifications?role=${activeRole}`));
      const data = res.data?.data || res.data;
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [];
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        let matchesRole = false;
        if (notif.recipientRole) {
          matchesRole = notif.recipientRole === activeRole;
        } else {
          const url = (notif.actionUrl || notif.action_url || '').toLowerCase();
          if (isVendorPortal) {
            matchesRole = url.startsWith('/vendor');
          } else if (isCreatorPortal) {
            matchesRole = url.startsWith('/creator');
          } else {
            matchesRole = url.startsWith('/customer') || (!url.startsWith('/vendor') && !url.startsWith('/creator') && !url.startsWith('/admin'));
          }
        }

        if (matchesRole) {
          setNotifications((prev) => [notif, ...prev]);
        }
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification', handleNewNotification);
      };
    }
  }, [pathname, activeRole]);

  const handleMarkAllRead = async () => {
    try {
      await api.post(`/v1/notifications/me/read-all?role=${activeRole}`).catch(() => api.post(`/v1/notifications/read-all?role=${activeRole}`));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, is_read: true, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleNotificationClick = async (n) => {
    const nid = n._id || n.id;
    if (nid && (!n.isRead && !n.is_read && !n.read)) {
      try {
        await api.post(`/v1/notifications/${nid}/read`).catch(() => api.patch(`/v1/notifications/${nid}/read`));
        setNotifications((prev) =>
          prev.map((item) => ((item._id === nid || item.id === nid) ? { ...item, isRead: true, is_read: true, read: true } : item))
        );
      } catch {}
    }

    const actionUrl = n.actionUrl || n.action_url;
    if (actionUrl) {
      let target = actionUrl;
      if (activeRole === 'vendor' && !target.startsWith('/vendor') && !target.startsWith('http')) {
        if (target.startsWith('/wallet')) target = '/vendor/wallet';
        else if (target.startsWith('/subscription')) target = '/vendor/subscription';
        else if (target.startsWith('/chat')) target = '/vendor/chat';
        else if (target.startsWith('/leads') || target.startsWith('/inquiries')) target = '/vendor/leads';
      } else if (activeRole === 'creator' && !target.startsWith('/creator') && !target.startsWith('http')) {
        if (target.startsWith('/wallet')) target = '/creator/wallet';
        else if (target.startsWith('/subscription')) target = '/creator/subscription';
        else if (target.startsWith('/chat')) target = '/creator/chat';
      }
      navigate(target);
    }
  };

  const handleDeleteNotification = async (nid, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/v1/notifications/${nid}`);
      setNotifications((prev) => prev.filter((item) => (item._id !== nid && item.id !== nid)));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to remove notification');
    }
  };

  const matchesTab = (n, tab) => {
    if (tab === 'all') return true;
    const t = (n.type || '').toLowerCase();
    if (tab === 'orders') {
      return ['order', 'order_status', 'lead', 'inquiry', 'quote', 'proposal', 'requirement'].includes(t);
    }
    if (tab === 'offers') {
      return ['offer', 'offers', 'deal', 'deals', 'price', 'discount'].includes(t);
    }
    if (tab === 'messages') {
      return ['message', 'chat', 'vendor', 'customer', 'reply', 'comment', 'like'].includes(t);
    }
    if (tab === 'system') {
      return ['system', 'admin', 'kyc', 'verification', 'wallet', 'payment', 'hire', 'campaign'].includes(t);
    }
    return t === tab;
  };

  const filtered = notifications.filter((n) => matchesTab(n, activeTab));
  const unreadCount = notifications.filter((n) => !n.isRead && !n.is_read && !n.read).length;

  const getNotificationIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (['order', 'lead', 'quote', 'requirement', 'proposal'].includes(t)) {
      return <FiShoppingBag className="text-emerald-600" size={18} />;
    }
    if (['payment', 'wallet'].includes(t)) {
      return <FiDollarSign className="text-amber-500" size={18} />;
    }
    if (['offer', 'offers', 'deal', 'discount', 'price'].includes(t)) {
      return <FiTag className="text-pink-500" size={18} />;
    }
    if (['message', 'chat', 'vendor', 'customer'].includes(t)) {
      return <FiMessageSquare className="text-purple-600" size={18} />;
    }
    if (['kyc', 'verification'].includes(t)) {
      return <FiShield className="text-blue-600" size={18} />;
    }
    return <FiBell className="text-[#d99a3d]" size={18} />;
  };

  // Customize headers based on role
  let headerTitle = "Notifications Center";
  let headerSubtitle = "Stay updated on orders, vendor quotes, special offers, and platform alerts";

  if (isVendorPortal) {
    headerTitle = "Vendor Notifications";
    headerSubtitle = "Track customer inquiries, lead requests, payouts, and requirement matches";
  } else if (isCreatorPortal) {
    headerTitle = "Creator Notifications";
    headerSubtitle = "Track brand sponsorships, campaign invites, milestones, and wallet payouts";
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 animate-fade-in p-3 sm:p-5 min-h-screen pb-24 lg:pb-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            NOTIFICATIONS CENTER
          </span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            {headerTitle.toUpperCase()}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {headerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-xs"
            >
              <FiCheck size={14} className="text-emerald-400" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a] shadow-xs">
            <FiBell size={20} />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = notifications.filter((n) => matchesTab(n, tab.key) && (!n.isRead && !n.is_read && !n.read)).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                  : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#d99a3d]' : 'text-slate-500'} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-[#d99a3d] text-[#241b15]' : 'bg-red-500 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/70 border border-[#e3dccb] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500 border border-[#e3dccb] shadow-xs">
          <FiCheckCircle size={36} className="mx-auto mb-2 text-slate-400" />
          <p className="font-bold text-slate-700">You're all caught up!</p>
          <p className="text-[11px] text-slate-400 mt-0.5">No notifications in this section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isUnread = !n.isRead && !n.is_read && !n.read;
            const nid = n._id || n.id;
            const actionUrl = n.actionUrl || n.action_url;

            return (
              <div
                key={nid}
                onClick={() => handleNotificationClick(n)}
                className={`bg-white rounded-2xl p-4 border transition flex items-start gap-3.5 sm:gap-4 cursor-pointer hover:shadow-md ${
                  isUnread
                    ? 'border-[#d99a3d] bg-amber-50/20 shadow-xs'
                    : 'border-[#e3dccb] hover:bg-[#fcfbfa]'
                }`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center shrink-0 shadow-xs">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className={`text-xs truncate ${isUnread ? 'font-extrabold text-[#1a1a1a]' : 'font-bold text-slate-700'}`}>
                        {n.title || 'System Notification'}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(n.type === 'offers' || n.type === 'offer') && (n.data?.validTill || n.validTill) && (
                        <OfferCountdown validTill={n.data?.validTill || n.validTill} />
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {n.createdAt || n.created_at
                          ? new Date(n.createdAt || n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {n.body || n.message || 'Click to view details.'}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    {actionUrl ? (
                      <span className="text-[11px] font-bold text-[#d99a3d] hover:underline flex items-center gap-1">
                        <span>View Details</span>
                        <FiExternalLink size={12} />
                      </span>
                    ) : <span />}

                    <button
                      onClick={(e) => handleDeleteNotification(nid, e)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer border-none bg-transparent"
                      title="Delete Notification"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
