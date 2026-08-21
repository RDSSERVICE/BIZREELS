import React from 'react';
import {
  FiBookmark, FiTool, FiVideo, FiImage, FiPhone,
  FiMessageSquare, FiPackage, FiDollarSign, FiUserCheck
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../../../context/LanguageContext';

export default function ActivitiesTabBar({ activeTab, onTabChange, counts = {} }) {
  const { bi } = useLanguage();

  const dynamicTabs = [
    { key: 'saved-products', label: bi('Saved Products', 'सहेजे गए उत्पाद'), icon: FiBookmark, count: counts.savedProducts },
    { key: 'saved-services', label: bi('Saved Services', 'सहेजी गई सेवाएं'), icon: FiTool, count: counts.savedServices },
    { key: 'saved-reels', label: bi('Saved Reels', 'सहेजी गई रील्स'), icon: FiVideo, count: counts.savedReels },
    { key: 'saved-images', label: bi('Saved Images', 'सहेजी गई तस्वीरें'), icon: FiImage, count: counts.savedImages },
    { key: 'click-to-called', label: bi('Call History', 'कॉल इतिहास'), icon: FiPhone, count: counts.clickToCalled },
    { key: 'whatsapp-contacted', label: bi('WhatsApp', 'व्हाट्सएप'), icon: FaWhatsapp, count: counts.whatsappContacted },
    { key: 'chat-inquiries', label: bi('Inquiries', 'पूछताछ'), icon: FiMessageSquare, count: counts.chatInquiries },
    { key: 'my-orders', label: bi('My Orders', 'मेरे ऑर्डर'), icon: FiPackage },
    { key: 'quotes', label: bi('Quotes', 'कोटेशन्स'), icon: FiDollarSign },
    { key: 'following-vendors', label: bi('Following Vendors', 'फॉलो किए गए विक्रेता'), icon: FiUserCheck },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none font-sans">
      {dynamicTabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer border ${
              isActive
                ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d] shadow-xs'
                : 'bg-white text-slate-600 border-[#e3dccb] hover:border-[#d99a3d] hover:text-[#1a1a1a]'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-[#1a1a1a]' : 'text-slate-500'} />
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                  isActive ? 'bg-[#1a1a1a] text-white' : 'bg-[#f8f4ec] text-[#d99a3d] border border-[#e3dccb]'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
