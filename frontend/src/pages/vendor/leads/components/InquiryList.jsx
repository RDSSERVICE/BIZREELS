import React, { useState } from 'react';
import { FiInbox, FiSearch, FiX } from 'react-icons/fi';
import InquiryCard from './InquiryCard';

export default function InquiryList({
  inquiries = [],
  emptyText = 'No customer enquiries found.',
  onReply,
  onClose,
  onDelete
}) {
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');

  const filteredInquiries = inquiries.filter((item) => {
    // Status filter
    if (inquiryStatusFilter !== 'all') {
      if (inquiryStatusFilter === 'sent' && item.status !== 'sent') return false;
      if (inquiryStatusFilter === 'replied' && item.status !== 'replied') return false;
      if (inquiryStatusFilter === 'closed' && item.status !== 'closed') return false;
    }
    // Text search
    if (!inquirySearch.trim()) return true;
    const q = inquirySearch.toLowerCase();
    const customerName = (item.customer?.name || item.customerName || '').toLowerCase();
    const customerPhone = (item.customer?.phone || '').toLowerCase();
    const customerEmail = (item.customer?.email || '').toLowerCase();
    const listingTitle = (item.listing?.title || '').toLowerCase();
    const message = (item.message || item.msg || '').toLowerCase();
    return (
      customerName.includes(q) ||
      customerPhone.includes(q) ||
      customerEmail.includes(q) ||
      listingTitle.includes(q) ||
      message.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-secondary/50 p-3 rounded-xl border border-border text-xs">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
          <input
            type="text"
            value={inquirySearch}
            onChange={(e) => setInquirySearch(e.target.value)}
            placeholder="Search by customer name, phone, message, or listing..."
            className="w-full pl-9 pr-8 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
          {inquirySearch && (
            <button
              onClick={() => setInquirySearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 font-semibold text-text-secondary w-full sm:w-auto shrink-0">
          <span>Status:</span>
          <select
            value={inquiryStatusFilter}
            onChange={(e) => setInquiryStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="all">All ({inquiries.length})</option>
            <option value="sent">New / Unreplied</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Inquiry Cards List */}
      {filteredInquiries.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-tertiary space-y-2">
          <FiInbox size={36} className="mx-auto text-brand-purple opacity-40" />
          <p className="font-bold text-text-primary text-sm">
            {inquirySearch ? 'No matching enquiries found' : emptyText}
          </p>
          <p className="max-w-xs mx-auto text-text-tertiary">
            {inquirySearch
              ? 'Try adjusting your search keywords or clear filters.'
              : 'Customer enquiries and product questions from your listings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((e) => (
            <InquiryCard
              key={e._id || e.id}
              inquiry={e}
              onReply={onReply}
              onClose={onClose}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
