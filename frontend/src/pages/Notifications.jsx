import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiCheckCircle,
  FiTrash2,
  FiMessageSquare,
  FiDollarSign,
  FiHeart,
  FiStar,
  FiFileText
} from 'react-icons/fi';
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useDeleteAlertMutation
} from '../features/settings/notificationsApi';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Notifications = () => {
  const { data: notifyRes, isLoading, refetch } = useGetNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [activeFilter, setActiveFilter] = useState('all'); // all | messages | replies | price_drops | offers

  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();
  const [deleteAlert] = useDeleteAlertMutation();

  const notifications = notifyRes?.data?.notifications || [];

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'messages') return n.type === 'admin_message' || n.type === 'message';
    if (activeFilter === 'replies') return n.type === 'vendor_reply';
    if (activeFilter === 'price_drops') return n.type === 'price_drop';
    if (activeFilter === 'offers') return n.type === 'offer';
    return true;
  });

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      toast.success('All notifications marked as read.');
      refetch();
    } catch (e) {
      toast.error('Failed to update.');
    }
  };

  const handleMarkSingle = async (id) => {
    try {
      await markRead(id).unwrap();
      refetch();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id).unwrap();
      toast.success('Alert removed.');
      refetch();
    } catch (e) {
      toast.error('Failed to remove.');
    }
  };

  // Get matching icon based on alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'message':
        return { icon: FiMessageSquare, color: 'text-brand-purple bg-brand-purple/10' };
      case 'quote':
        return { icon: FiFileText, color: 'text-brand-orange bg-brand-orange/10' };
      case 'payment':
        return { icon: FiDollarSign, color: 'text-success bg-success/10' };
      case 'like':
        return { icon: FiHeart, color: 'text-brand-pink bg-brand-pink/10' };
      case 'hire':
        return { icon: FiStar, color: 'text-brand-pink bg-brand-pink/10' };
      default:
        return { icon: FiBell, color: 'text-text-secondary bg-surface-secondary' };
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-fade-in pb-16">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-purple/10 rounded-premium text-brand-purple">
            <FiBell className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-brand-navy font-display">Notification Alert Log</h2>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              Review live quotes, hires, payments, and system remarks.
            </span>
          </div>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <FiCheckCircle /> Mark read
          </button>
        )}
      </div>

      {/* Filters tab */}
      <div className="flex bg-surface-tertiary/75 p-1 rounded-premium gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'messages', label: 'Messages' },
          { id: 'replies', label: 'Vendor Replies' },
          { id: 'price_drops', label: 'Price Drops' },
          { id: 'offers', label: 'Offers' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 text-[10px] font-bold rounded-premium whitespace-nowrap transition-all cursor-pointer flex-grow text-center
              ${activeFilter === f.id
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:text-brand-purple hover:bg-surface-secondary/40'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Alerts Logs Viewports ────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader /></div>
        ) : filteredNotifications.length === 0 ? (
          <div className="glass p-12 text-center rounded-premium text-text-secondary">
            <p className="font-bold text-brand-navy">Inbox details clean</p>
            <p className="text-xs mt-1">No matching notification alert records found.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((n) => {
              const alert = getAlertIcon(n.type);
              const Icon = alert.icon;
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => !n.isRead && handleMarkSingle(n._id)}
                  className={`glass p-4 rounded-premium border-white/50 shadow-glass flex justify-between items-start gap-4 transition-all hover:bg-surface-secondary/20
                    ${!n.isRead ? 'border-l-4 border-brand-purple bg-brand-purple/[0.01]' : 'border-l-4 border-transparent'}
                  `}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-premium shrink-0 ${alert.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-brand-navy truncate">
                        {n.title}
                      </span>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-text-tertiary mt-1">
                        {new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n._id);
                    }}
                    className="p-2 hover:bg-error-light/35 rounded-premium text-text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
