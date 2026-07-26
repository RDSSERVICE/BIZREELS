import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';

/**
 * SubscriptionModal — Vendor subscription upgrade plans
 */
export default function SubscriptionModal({ isOpen, onClose }) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Vendor Subscription Upgrade Plans" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-text-secondary">Upgrade to unlock unlimited listings, top search priority, and product boost features:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-2xl border border-brand-purple/30 space-y-3">
            <h4 className="font-bold text-sm text-brand-purple font-display">Verified Vendor Plan</h4>
            <span className="text-xl font-black text-text-primary">₹499 <span className="text-xs font-normal text-text-tertiary">/ month</span></span>
            <ul className="text-xs text-text-secondary space-y-1.5">
              <li>✓ List up to 50 Products & Services</li>
              <li>✓ Official 🟢 Verified Badge</li>
              <li>✓ 2x Product Search Visibility</li>
            </ul>
            <Link to="/vendor/subscription" className="block w-full text-center py-2 gradient-brand text-white text-xs font-bold rounded-xl">Upgrade Now</Link>
          </div>
          <div className="glass p-5 rounded-2xl border border-brand-orange/30 space-y-3">
            <h4 className="font-bold text-sm text-brand-orange font-display">VIP Boost Plan</h4>
            <span className="text-xl font-black text-text-primary">₹1,299 <span className="text-xs font-normal text-text-tertiary">/ month</span></span>
            <ul className="text-xs text-text-secondary space-y-1.5">
              <li>✓ Unlimited Listings</li>
              <li>✓ Official 🔵 VIP Verified Badge</li>
              <li>✓ 5 Free Reel Boosts Included</li>
            </ul>
            <Link to="/vendor/subscription" className="block w-full text-center py-2 bg-brand-orange text-white text-xs font-bold rounded-xl">Upgrade VIP</Link>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
