import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { FiCreditCard, FiChevronRight, FiShield, FiTrendingUp } from 'react-icons/fi';
import SubscriptionTab from '../../../features/subscription/SubscriptionTab';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorSubscriptionPage() {
  const { bi } = useLanguage();
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 font-sans w-full min-w-0 animate-fade-in text-xs">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e3dccb] pb-5">
        <div className="space-y-1.5">
          {/* Breadcrumb / Category Tag */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <Link to="/vendor/dashboard" className="hover:text-[#d99a3d] transition">
              {bi('Dashboard', 'डैशबोर्ड')}
            </Link>
            <FiChevronRight size={12} className="text-slate-400" />
            <span className="text-[#d99a3d] font-black uppercase tracking-wider text-[10px]">
              {bi('Finance & Growth', 'वित्त और विकास')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight font-heading">
            {bi('Subscription & Growth Plans', 'सब्सक्रिप्शन और ग्रोथ प्लान्स')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
            {bi(
              'Unlock priority buyer leads, verified gold merchant badges, and high-impact reel promotions for your business.',
              'अपनी व्यावसायिक लिस्टिंग्स के लिए प्राथमिकता लीड्स, सत्यापित गोल्ड मर्चेंट बैज और शक्तिशाली रील प्रचार अनलॉक करें।'
            )}
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/vendor/verification"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e3dccb] text-[#1a1a1a] font-bold text-xs hover:border-[#d99a3d] hover:bg-[#faf7f0] transition shadow-2xs"
          >
            <FiShield size={14} className="text-[#d99a3d]" />
            <span>{bi('Verification Center', 'सत्यापन केंद्र')}</span>
          </Link>
          <Link
            to="/vendor/wallet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#241b15] text-[#d99a3d] font-bold text-xs hover:bg-[#342820] transition shadow-2xs"
          >
            <FiTrendingUp size={14} />
            <span>{bi('Vendor Wallet', 'विक्रेता वॉलेट')}</span>
          </Link>
        </div>
      </div>

      {/* Subscription Content Orchestrator */}
      <SubscriptionTab user={user} refetchUser={refetchUser} role="vendor" />
    </div>
  );
}
