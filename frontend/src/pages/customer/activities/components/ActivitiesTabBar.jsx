import React from 'react';
import {
  FiBookmark, FiTool, FiVideo, FiImage, FiPhone,
  FiMessageSquare, FiPackage, FiDollarSign, FiUserCheck
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function ActivitiesTabBar({ activeTab, onTabChange, counts = {} }) {
  const dynamicTabs = [
    { key: 'saved-products', label: 'Saved Products', icon: FiBookmark, count: counts.savedProducts },
    { key: 'saved-services', label: 'Saved Services', icon: FiTool, count: counts.savedServices },
    { key: 'saved-reels', label: 'Saved Reels', icon: FiVideo, count: counts.savedReels },
    { key: 'saved-images', label: 'Saved Images', icon: FiImage, count: counts.savedImages },
    { key: 'click-to-called', label: 'Click to Called', icon: FiPhone, count: counts.clickToCalled },
    { key: 'whatsapp-contacted', label: 'WhatsApp', icon: FaWhatsapp, count: counts.whatsappContacted },
    { key: 'chat-inquiries', label: 'Chat/Inquiry', icon: FiMessageSquare, count: counts.chatInquiries },
    { key: 'my-orders', label: 'My Orders Request', icon: FiPackage },
    { key: 'quotes', label: 'Quotes Received', icon: FiDollarSign },
    { key: 'following-vendors', label: 'Following Vendors', icon: FiUserCheck },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border pb-2">
      {dynamicTabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
              isActive
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-premium'
                : 'bg-surface hover:bg-surface-secondary text-text-secondary border border-border/50'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-white' : 'text-text-tertiary'} />
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-white/20 text-white font-bold' : 'bg-brand-purple/10 text-brand-purple'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
