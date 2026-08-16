import React from 'react';
import { FiTruck } from 'react-icons/fi';

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Requested' },
  { key: 'accepted', label: 'Order Confirmed' },
  { key: 'processing', label: 'In Preparation' },
  { key: 'shipped', label: 'Dispatched / On the Way' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Completed & Delivered' },
];

export default function OrderTrackerModal({
  isOpen,
  order,
  onClose,
}) {
  if (!isOpen || !order) return null;

  const getStepStatusIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered':
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentIdx = getStepStatusIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="glass max-w-lg w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiTruck className="text-brand-purple" /> Order Tracking status
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Listing: <span className="font-bold text-text-primary">{order.listing?.title || order.item}</span></span>
            <span>Vendor: <span className="font-bold text-text-primary">{order.vendor?.name}</span></span>
          </div>
          <div className="text-[10px] text-text-tertiary bg-surface-secondary/50 rounded-xl p-3 border border-border">
            <p>Address: <span className="font-semibold text-text-secondary">{order.address}</span></p>
            {order.expectedDeliveryDate && (
              <p className="mt-1">
                Exp. Delivery: <span className="font-semibold text-text-secondary">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
              </p>
            )}
          </div>

          {/* Visual status stepper */}
          <div className="flex flex-col gap-6 pt-4 pl-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.key} className="flex gap-4 items-start relative">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 flex items-center justify-center ${
                    isCompleted ? 'bg-brand-purple border-brand-purple text-white shadow-md' : 'bg-surface border-border'
                  }`}>
                    {isCompleted && <span className="text-[8px]">✓</span>}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block ${
                      isCurrent ? 'text-brand-purple' : isCompleted ? 'text-text-secondary' : 'text-text-tertiary'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && <span className="text-[9px] text-brand-purple/70 block mt-0.5 animate-pulse">● Active state</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
