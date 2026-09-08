import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiUsers, FiUserCheck, FiFilm, FiLayers, FiShield,
  FiSettings, FiGrid, FiArrowRight, FiZap, FiFolder, FiMapPin,
  FiInbox, FiMail, FiMessageSquare, FiShoppingBag, FiCreditCard,
  FiStar, FiBarChart2, FiCpu, FiBell, FiGift, FiAlertTriangle,
  FiFileText, FiLock, FiList, FiPieChart, FiTerminal
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_TARGETS = [
  { name: 'Dashboard Overview', path: '/admin/dashboard', icon: FiGrid, category: 'Overview' },
  { name: 'System Console', path: '/admin/console', icon: FiTerminal, category: 'Overview' },
  { name: 'Customer Directory', path: '/admin/customers', icon: FiUsers, category: 'User Management' },
  { name: 'Vendor Directory', path: '/admin/vendors', icon: FiUserCheck, category: 'User Management' },
  { name: 'Creator Directory', path: '/admin/creators', icon: FiFilm, category: 'User Management' },
  { name: 'KYC Verifications Queue', path: '/admin/kyc', icon: FiShield, category: 'Verification' },
  { name: 'Catalog Listings', path: '/admin/listings', icon: FiLayers, category: 'Content' },
  { name: 'Reels Videos & Moderation', path: '/admin/reels', icon: FiFilm, category: 'Content' },
  { name: 'Boost Plans & Ads', path: '/admin/boost', icon: FiZap, category: 'Content' },
  { name: 'Categories Hierarchy', path: '/admin/categories', icon: FiFolder, category: 'Content' },
  { name: 'Geo Location & Radius', path: '/admin/locations', icon: FiMapPin, category: 'Operations' },
  { name: 'Requirements & Inquiries', path: '/admin/requirements', icon: FiInbox, category: 'Operations' },
  { name: 'Contact Inquiries', path: '/admin/contact-inquiries', icon: FiMail, category: 'Operations' },
  { name: 'Live Chat Monitor', path: '/admin/chat', icon: FiMessageSquare, category: 'Operations' },
  { name: 'Orders & Closed Deals', path: '/admin/orders', icon: FiShoppingBag, category: 'Operations' },
  { name: 'Wallet & Ledger Management', path: '/admin/wallet', icon: FiCreditCard, category: 'Finance' },
  { name: 'Subscription Plans & Users', path: '/admin/subscriptions', icon: FiCreditCard, category: 'Finance' },
  { name: 'Commission Rates & GST', path: '/admin/commission', icon: FaRupeeSign, category: 'Finance' },
  { name: 'Reviews & Feedback', path: '/admin/reviews', icon: FiStar, category: 'Engagement' },
  { name: 'Platform Analytics', path: '/admin/analytics', icon: FiBarChart2, category: 'Engagement' },
  { name: 'AI Features & Prompt Config', path: '/admin/ai', icon: FiCpu, category: 'Engagement' },
  { name: 'Broadcast Notifications', path: '/admin/notifications', icon: FiBell, category: 'Engagement' },
  { name: 'Coupons & Promotional Offers', path: '/admin/offers', icon: FiGift, category: 'Engagement' },
  { name: 'Reports & Content Moderation', path: '/admin/moderation', icon: FiAlertTriangle, category: 'Moderation' },
  { name: 'CMS & Legal Pages', path: '/admin/cms', icon: FiFileText, category: 'System' },
  { name: 'Application Settings', path: '/admin/app-settings', icon: FiSettings, category: 'System' },
  { name: 'Credit Purchasing Rates', path: '/admin/credit-rates', icon: FiZap, category: 'System' },
  { name: 'Admin Security & Password', path: '/admin/security', icon: FiLock, category: 'System' },
  { name: 'System Audit Logs', path: '/admin/audit', icon: FiList, category: 'System' },
  { name: 'Financial Tax Reports', path: '/admin/financial-reports', icon: FiPieChart, category: 'System' },
];

/**
 * AdminQuickSearchModal — Command Palette (Ctrl+K) for instant navigation & search
 */
export default function AdminQuickSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K keydown shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          document.dispatchEvent(new CustomEvent('open-admin-search'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = NAV_TARGETS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-[#e3dccb] shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            {/* Search Header Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#e3dccb] bg-[#f8f4ec] gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#e3dccb] flex items-center justify-center text-[#d99a3d] shadow-2xs">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 28 admin modules... (e.g. KYC, Orders, Wallet)"
                className="w-full bg-transparent text-xs font-black text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#ede5d8] text-slate-500 hover:text-[#1a1a1a] transition-all cursor-pointer"
                title="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-white">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-400">
                  No matching admin modules found for "{query}".
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f8f4ec] text-left group transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#f8f4ec] text-[#1a1a1a] group-hover:bg-[#1a1a1a] group-hover:text-[#d99a3d] border border-[#e3dccb] transition-all shrink-0 shadow-2xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-[#1a1a1a] group-hover:text-[#1a1a1a] block leading-tight truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with Hint */}
            <div className="px-4 py-2 border-t border-[#e3dccb] bg-[#f8f4ec] flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>Navigate with arrow keys or click</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#e3dccb] text-[9px] font-mono text-slate-500 shadow-2xs">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
