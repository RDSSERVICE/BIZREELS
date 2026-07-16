import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Portal-based Modal Component
 * Smooth Framer Motion transitions and background overlay.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm | md | lg | xl | max
  closeOnOverlayClick = true,
  className = '',
}) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    max: 'max-w-full m-4',
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-brand-navy-dark/40 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal Content Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`relative z-10 w-full glass-strong shadow-modal rounded-premium overflow-hidden border border-white/50 ${sizeClasses[size]} ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h3 className="text-lg font-bold tracking-tight text-brand-navy">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-brand-purple hover:bg-surface-tertiary rounded-full transition-all"
            >
              <IoClose className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
