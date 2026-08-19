import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AdminActionMenu — Reusable popover menu for table row actions
 * Prevents horizontal layout overflow by grouping actions into a dropdown menu.
 * 
 * @param {Array<{ label: string, icon?: React.ElementType, onClick: Function, danger?: boolean, disabled?: boolean, hidden?: boolean }>} actions
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
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-secondary hover:text-text-primary transition-all focus:outline-none"
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
            className="absolute right-0 mt-1 w-44 rounded-xl glass border border-white/60 shadow-modal bg-surface/95 backdrop-blur-md z-50 py-1 overflow-hidden"
          >
            {visibleActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (action.onClick && !action.disabled) {
                      action.onClick();
                    }
                  }}
                  disabled={action.disabled}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all ${
                    action.disabled
                      ? 'opacity-40 cursor-not-allowed text-text-tertiary'
                      : action.danger
                      ? 'text-error hover:bg-error/10 text-error'
                      : 'text-text-primary hover:bg-brand-purple/10 hover:text-brand-purple'
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
