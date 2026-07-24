import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiMessageSquare,
  FiShoppingBag, FiDollarSign, FiShield, FiX, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function NotificationBellDropdown({ role = 'customer' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count & list
  const fetchNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api.get('/v1/notifications/me/unread-count').catch(() => api.get('/v1/notifications/unread-count')),
        api.get('/v1/notifications/me').catch(() => api.get('/v1/notifications'))
      ]);

      const count = countRes?.data?.data?.count ?? countRes?.data?.count ?? countRes?.count ?? 0;
      setUnreadCount(Number(count) || 0);

      const itemsData = listRes?.data?.data || listRes?.data;
      const rawList = Array.isArray(itemsData?.items)
        ? itemsData.items
        : Array.isArray(itemsData?.notifications)
        ? itemsData.notifications
        : Array.isArray(itemsData)
        ? itemsData
        : [];

      setNotifications(rawList);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s

    const socket = getSocket();
    const handleNewNotification = (notif) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [notif, ...prev]);
    };

    if (socket) {
      socket.on('notification:new', handleNewNotification);
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      if (socket) {
        socket.off('notification:new', handleNewNotification);
      }
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/v1/notifications/me/read-all').catch(() => api.post('/v1/notifications/read-all'));
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    const nid = notif._id || notif.id;
    try {
      if (nid) {
        await api.post(`/v1/notifications/${nid}/read`).catch(() => api.patch(`/v1/notifications/${nid}/read`));
      }
    } catch {}

    setNotifications(prev => prev.map(n => (n._id === nid || n.id === nid) ? { ...n, isRead: true, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setIsOpen(false);

    if (notif.actionUrl || notif.action_url) {
      navigate(notif.actionUrl || notif.action_url);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
      case 'lead':
        return <FiShoppingBag className="text-emerald-500" size={16} />;
      case 'payment':
      case 'wallet':
        return <FiDollarSign className="text-amber-500" size={16} />;
      case 'kyc':
      case 'verification':
        return <FiShield className="text-blue-500" size={16} />;
      case 'message':
      case 'inquiry':
        return <FiMessageSquare className="text-brand-purple" size={16} />;
      default:
        return <FiBell className="text-brand-orange" size={16} />;
    }
  };

  const viewAllPath = role === 'admin' ? '/admin/notifications' : role === 'vendor' ? '/vendor/leads' : role === 'creator' ? '/creator/orders' : '/customer/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="p-2 text-text-secondary hover:text-brand-purple hover:bg-surface-tertiary rounded-xl transition-all relative"
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-pink text-white font-extrabold text-[10px] flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in max-h-[80vh] sm:max-h-none">
          {/* Panel Header */}
          <div className="p-4 border-b border-border bg-surface-tertiary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="text-brand-purple" size={16} />
              <h4 className="text-xs font-bold text-text-primary font-display">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-purple hover:underline flex items-center gap-1"
              >
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-tertiary">
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 15).map((n, i) => {
                const isUnread = !n.isRead && !n.is_read;
                return (
                  <div
                    key={n._id || n.id || i}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-surface-tertiary ${isUnread ? 'bg-brand-purple/5' : ''}`}
                  >
                    <div className="p-2 rounded-xl bg-surface border border-border mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className={`text-xs truncate ${isUnread ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary'}`}>
                          {n.title || 'System Alert'}
                        </h5>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-brand-pink flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-text-tertiary line-clamp-2 mt-0.5">
                        {n.body || n.message || 'Click to view details'}
                      </p>
                      <span className="text-[9px] text-text-tertiary mt-1 block">
                        {n.createdAt || n.created_at ? new Date(n.createdAt || n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-border bg-surface-tertiary text-center">
            <Link
              to={viewAllPath}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-brand-purple hover:underline inline-flex items-center gap-1"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
