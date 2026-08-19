import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiUsers, FiUserCheck, FiFilm, FiLayers, FiShield, FiSettings, FiGrid, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_TARGETS = [
  { name: 'Dashboard Overview', path: '/admin/dashboard', icon: FiGrid, category: 'Navigation' },
  { name: 'Customer Directory', path: '/admin/customers', icon: FiUsers, category: 'Users' },
  { name: 'Vendor Directory', path: '/admin/vendors', icon: FiUserCheck, category: 'Users' },
  { name: 'Creator Directory', path: '/admin/creators', icon: FiFilm, category: 'Users' },
  { name: 'KYC Verifications Queue', path: '/admin/kyc', icon: FiShield, category: 'Verification' },
  { name: 'Content Listings', path: '/admin/listings', icon: FiLayers, category: 'Content' },
  { name: 'Reels Moderation', path: '/admin/reels', icon: FiFilm, category: 'Content' },
  { name: 'App Settings & Features', path: '/admin/app-settings', icon: FiSettings, category: 'System' },
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
          // Trigger open via parent
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-[#e3dccb] shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            {/* Search Header Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#e3dccb] bg-[#f8f4ec] gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1D4ED8]">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search sections... (e.g. Customers, KYC, Reels)"
                className="w-full bg-transparent text-xs font-black text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1 bg-white">
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
                        <div className="p-2 rounded-lg bg-[#f8f4ec] text-[#1D4ED8] group-hover:bg-[#0F172A] group-hover:text-[#EAB308] border border-[#e3dccb] transition-all">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#1a1a1a] group-hover:text-[#1D4ED8] block leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with Hint */}
            <div className="px-4 py-2 border-t border-[#e3dccb] bg-[#f8f4ec] flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>Quick Search Palette</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#e3dccb] text-[9px] text-slate-700 shadow-2xs">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
