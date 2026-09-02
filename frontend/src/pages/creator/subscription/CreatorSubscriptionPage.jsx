import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { FiChevronRight, FiShield, FiTrendingUp } from 'react-icons/fi';
import SubscriptionTab from '../../../features/subscription/SubscriptionTab';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorSubscriptionPage() {
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
            <Link to="/creator/dashboard" className="hover:text-[#d99a3d] transition">
              {bi('Dashboard', 'डैशबोर्ड')}
            </Link>
            <FiChevronRight size={12} className="text-slate-400" />
            <span className="text-[#d99a3d] font-black uppercase tracking-wider text-[10px]">
              {bi('Creator Studio & Growth', 'क्रिएटर स्टूडियो और विकास')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight font-heading">
            {bi('Creator Membership & Subscriptions', 'क्रिएटर सदस्यता और सब्सक्रिप्शन')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
            {bi(
              'Manage your creator tier, get verified portfolio trust badges, and unlock direct client orders with 0 commission.',
              'अपनी क्रिएटर सदस्यता प्रबंधित करें, पोर्टफोलियो सत्यापन बैज प्राप्त करें और 0% कमीशन पर सीधे क्लाइंट ऑर्डर पाएं।'
            )}
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/creator/verification"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e3dccb] text-[#1a1a1a] font-bold text-xs hover:border-[#d99a3d] hover:bg-[#faf7f0] transition shadow-2xs"
          >
            <FiShield size={14} className="text-[#d99a3d]" />
            <span>{bi('Verification Center', 'सत्यापन केंद्र')}</span>
          </Link>
          <Link
            to="/creator/wallet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#241b15] text-[#d99a3d] font-bold text-xs hover:bg-[#342820] transition shadow-2xs"
          >
            <FiTrendingUp size={14} />
            <span>{bi('Creator Wallet', 'क्रिएटर वॉलेट')}</span>
          </Link>
        </div>
      </div>

      <SubscriptionTab user={user} refetchUser={refetchUser} role="creator" />
    </div>
  );
}
