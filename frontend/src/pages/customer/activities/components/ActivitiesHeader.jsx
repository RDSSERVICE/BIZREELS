import React from 'react';
import { FiActivity, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function ActivitiesHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 font-display">
          <FiActivity className="text-brand-purple" /> Customer Activity Hub
        </h1>
        <p className="text-xs text-text-tertiary mt-1">
          Monitor your saved listings, direct calls, inquiries, quotes, and pre-payment service orders in real-time.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customer/search')}
          className="px-4 py-2.5 bg-surface border border-border hover:bg-surface-secondary text-text-primary text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <span>Explore Feed</span>
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}
