import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AdminActionMenu — Warm Bento-Brutalism popover action menu
 */
export default function AdminActionMenu({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const visibleActions = actions.filter((a) => !a.hidden);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative inline-block text-left font-sans" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] text-[#1a1a1a] hover:bg-[#ede5d8] transition-all focus:outline-none cursor-pointer shadow-2xs"
        title="Actions"
        aria-label="Actions Menu"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-[#e3dccb] shadow-xl z-50 py-1 overflow-hidden divide-y divide-[#e3dccb]/40"
          >
            {visibleActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (action.onClick && !action.disabled) {
                      action.onClick();
                    }
                  }}
                  disabled={action.disabled}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold transition-all text-left cursor-pointer ${
                    action.disabled
                      ? 'opacity-35 cursor-not-allowed text-slate-400'
                      : action.danger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-[#1a1a1a] hover:bg-[#f8f4ec] hover:text-[#d99a3d]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
