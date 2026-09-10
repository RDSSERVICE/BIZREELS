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
      const listRes = await api.get(`/v1/notifications/me?role=${role}`).catch(() => api.get(`/v1/notifications?role=${role}`));

      const itemsData = listRes?.data?.data || listRes?.data;
      const rawList = Array.isArray(itemsData?.items)
        ? itemsData.items
        : Array.isArray(itemsData?.notifications)
        ? itemsData.notifications
        : Array.isArray(itemsData)
        ? itemsData
        : [];

      setNotifications(rawList);
      
      // Calculate unread count in-memory to save database lookups and prevent concurrency peaks
      const unreadCountVal = rawList.filter(n => !n.isRead).length;
      setUnreadCount(unreadCountVal);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // poll every 5 min

    const socket = getSocket();
    const handleNewNotification = (notif) => {
      // Use recipientRole field for filtering (primary)
      // Fall back to actionUrl pattern for legacy notifications without recipientRole
      let matchesRole = false;

      if (notif.recipientRole) {
        // New system: direct role match
        matchesRole = notif.recipientRole === role;
      } else {
        // Legacy fallback: match by actionUrl pattern
        const url = (notif.actionUrl || '').toLowerCase();
        if (role === 'vendor') {
          matchesRole = url.startsWith('/vendor');
        } else if (role === 'creator') {
          matchesRole = url.startsWith('/creator');
        } else if (role === 'admin') {
          matchesRole = url.startsWith('/admin');
        } else {
          matchesRole = url.startsWith('/customer') || (!url.startsWith('/vendor') && !url.startsWith('/creator') && !url.startsWith('/admin'));
        }
      }

      if (matchesRole) {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [notif, ...prev]);
      }
    };

    if (socket) {
      socket.on('notification:new', handleNewNotification);
      socket.on('notification', handleNewNotification);
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
        socket.off('notification', handleNewNotification);
      }
    };
  }, [role]);

  const handleMarkAllRead = async () => {
    try {
      // Pass role so backend only marks current role's notifications as read
      await api.post(`/v1/notifications/me/read-all?role=${role}`).catch(() => api.post(`/v1/notifications/read-all?role=${role}`));
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
      let target = notif.actionUrl || notif.action_url;
      if (role === 'vendor') {
        if (target.startsWith('/wallet')) {
          target = '/vendor/subscription';
        } else if (target.startsWith('/subscription') || target.startsWith('/subscriptions')) {
          target = '/vendor/subscription';
        } else if (target.startsWith('/chat')) {
          target = '/vendor/chat';
        } else if (target === '/notifications' || target.startsWith('/customer/notifications')) {
          target = '/vendor/notifications';
        }
      } else if (role === 'creator') {
        if (target.startsWith('/wallet')) {
          target = '/creator/wallet';
        } else if (target.startsWith('/subscription') || target.startsWith('/subscriptions')) {
          target = '/creator/subscription';
        } else if (target.startsWith('/chat')) {
          target = '/creator/chat';
        } else if (target === '/notifications' || target.startsWith('/customer/notifications')) {
          target = '/creator/notifications';
        }
      }
      navigate(target);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
      case 'lead':
        return <FiShoppingBag className="text-emerald-600" size={16} />;
      case 'payment':
      case 'wallet':
        return <FiDollarSign className="text-[#d99a3d]" size={16} />;
      case 'kyc':
      case 'verification':
        return <FiShield className="text-[#1a1a1a]" size={16} />;
      case 'message':
      case 'inquiry':
        return <FiMessageSquare className="text-[#d99a3d]" size={16} />;
      default:
        return <FiBell className="text-[#d99a3d]" size={16} />;
    }
  };

  const viewAllPath = role === 'admin' ? '/admin/notifications' : role === 'vendor' ? '/vendor/notifications' : role === 'creator' ? '/creator/notifications' : '/customer/notifications';

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="p-2 text-[#8c827a] hover:text-[#1a1a1a] hover:bg-[#f8f4ec] rounded-xl transition-all relative border border-transparent hover:border-[#e3dccb] cursor-pointer"
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-[#1a1a1a] text-[#d99a3d] border border-[#d99a3d]/40 font-black text-[10px] flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 bg-white border border-[#e3dccb] rounded-2xl shadow-xl z-[100] overflow-hidden animate-scale-in max-h-[80vh] sm:max-h-none">
          {/* Panel Header */}
          <div className="p-4 border-b border-[#e3dccb] bg-[#fbf9f4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="text-[#d99a3d]" size={16} />
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] text-[10px] font-black">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#1a1a1a] hover:text-[#d99a3d] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f0eadc]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8c827a] font-medium">
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 15).map((n, i) => {
                const isUnread = !n.isRead && !n.is_read;
                return (
                  <div
                    key={n._id || n.id || i}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-[#fbf9f4] ${isUnread ? 'bg-[#fbf9f4]' : ''}`}
                  >
                    <div className="p-2 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] mt-0.5 shadow-2xs shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className={`text-xs truncate ${isUnread ? 'font-black text-[#1a1a1a]' : 'font-bold text-[#4a423b]'}`}>
                          {n.title || 'System Alert'}
                        </h5>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-[#d99a3d] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#8c827a] line-clamp-2 mt-0.5">
                        {n.body || n.message || 'Click to view details'}
                      </p>
                      <span className="text-[9px] text-[#8c827a] mt-1 block font-medium">
                        {n.createdAt || n.created_at ? new Date(n.createdAt || n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-[#e3dccb] bg-[#fbf9f4] text-center">
            <Link
              to={viewAllPath}
              onClick={() => setIsOpen(false)}
              className="text-xs font-black text-[#1a1a1a] hover:text-[#d99a3d] inline-flex items-center gap-1 transition-colors"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
