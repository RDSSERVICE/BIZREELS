import React from 'react';
import { FiZap, FiDollarSign, FiTrendingUp, FiPackage, FiVideo, FiImage, FiCpu, FiInbox, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { useGetVendorDashboardQuery } from '../../../features/vendor/vendorApi';
import { tokenStore } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorCreditRatesPage() {
  const { bi } = useLanguage();
  const { data: profileRes } = useGetMeQuery(undefined, {
    skip: !tokenStore.getUser(),
  });
  const { data: dashboardRes, isLoading } = useGetVendorDashboardQuery(undefined, {
    pollingInterval: 300000,
  });

  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const credits = metrics.credits || { available: 0, deposited: 0, earned: 0, used: 0 };
  const creditRates = metrics.creditRates || {
    productListing: 1,
    reelPost: 1,
    aiImage: 2,
    aiVideo30s: 15,
    reelBoost1Day: 10,
    validLead: 1,
  };

  const rateConfig = [
    { key: 'productListing', label: bi('1 Product Listing', '1 उत्पाद लिस्टिंग'), value: creditRates.productListing, icon: FiPackage, unit: 'Credit / Product', desc: bi('Deducted when publishing a new product to active catalog.', 'सक्रिय सूची में एक नया उत्पाद प्रकाशित करते समय कटौती की जाती है।') },
    { key: 'reelPost', label: bi('1 Reel Post', '1 रील पोस्ट'), value: creditRates.reelPost, icon: FiVideo, unit: 'Credit / Reel', desc: bi('Consumed when publishing a new promotional business reel.', 'एक नया प्रचार व्यवसाय रील प्रकाशित करते समय उपयोग किया जाता है।') },
    { key: 'aiImage', label: bi('1 AI Image', '1 एआई इमेज'), value: creditRates.aiImage, icon: FiImage, unit: 'AI Credits', desc: bi('Used for generating high-fidelity product images in AI Studio.', 'एआई स्टूडियो में उच्च-गुणवत्ता वाले उत्पाद चित्र बनाने के लिए उपयोग किया जाता है।') },
    { key: 'aiVideo30s', label: bi('30 sec AI Video', '30 सेकंड एआई वीडियो'), value: creditRates.aiVideo30s, icon: FiCpu, unit: 'AI Credits', desc: bi('Charged for rendering dynamic AI product video advertisements.', 'डायनामिक एआई उत्पाद वीडियो विज्ञापन रेंडर करने के लिए लिया जाता है।') },
    { key: 'reelBoost1Day', label: bi('1 Reel Boost (1 Day)', '1 रील बूस्ट (1 दिन)'), value: creditRates.reelBoost1Day, icon: FiZap, unit: 'Boost Credits / Day', desc: bi('Credits per day to promote a reel in feed and local searches.', 'फीड और स्थानीय खोजों में रील को बढ़ावा देने के लिए प्रति दिन क्रेडिट।') },
    { key: 'validLead', label: bi('1 Valid Lead', '1 मान्य लीड'), value: creditRates.validLead, icon: FiInbox, unit: 'Lead Credit', desc: bi('Charged to unlock contact details for customer search requirements.', 'ग्राहक खोज आवश्यकताओं के लिए संपर्क विवरण अनलॉक करने का शुल्क।') },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans p-2 sm:p-4 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiZap}
        title={bi('Credit Rates & Consumption Limits', 'क्रेडिट दरें और खपत सीमाएं (Credit Rates)')}
        subtitle={bi('Inspect live credit consumption costs per platform action determined by admin console', 'प्रशासक कंसोल द्वारा निर्धारित लाइव क्रेडिट खपत लागत का निरीक्षण करें')}
      >
        <Link
          to="/vendor/wallet"
          className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none"
        >
          <FiDollarSign size={16} /> {bi('Manage Wallet & Topup', 'वॉलेट प्रबंधित करें')} <FiArrowRight size={14} />
        </Link>
      </AdminPageHeader>

      {/* Credit Wallet Stat Cards */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
            <FiDollarSign className="text-[#d99a3d]" size={18} /> {bi('CREDIT BALANCE BREAKDOWN', 'क्रेडिट बैलेंस विवरण')}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
          <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] text-center shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">AVAILABLE</span>
            <span className="text-2xl font-black text-emerald-600 block">{credits.available}</span>
            <span className="text-[10px] text-slate-500 font-bold block">₹{credits.available} Equivalent</span>
          </div>

          <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] text-center shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">DEPOSITED</span>
            <span className="text-2xl font-black text-blue-600 block">{credits.deposited}</span>
            <span className="text-[10px] text-slate-500 font-bold block">₹{credits.deposited} Total Topup</span>
          </div>

          <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] text-center shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">EARNED / REWARD</span>
            <span className="text-2xl font-black text-amber-600 block">{credits.earned}</span>
            <span className="text-[10px] text-slate-500 font-bold block">₹{credits.earned} Bonus Credits</span>
          </div>

          <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] text-center shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">CONSUMED HISTORY</span>
            <span className="text-2xl font-black text-rose-600 block">{credits.used}</span>
            <span className="text-[10px] text-slate-500 font-bold block">Credits Spent</span>
          </div>
        </div>
      </div>

      {/* Credit Rates Grid */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
            <FiZap className="text-[#d99a3d]" size={18} /> {bi('ACTIVE CREDIT CONSUMPTION RATES', 'सक्रिय क्रेडिट खपत दरें')}
          </h3>
          <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
            LIVE CONFIG
          </span>
        </div>

        {isLoading ? (
          <div className="text-center text-xs font-bold text-slate-400 py-10">
            Loading active rates from server...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rateConfig.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="bg-[#f8f4ec] p-4.5 rounded-2xl border border-[#e3dccb] flex gap-4 items-start hover:border-[#241b15] transition-all shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-[#241b15] text-[#d99a3d] border border-[#241b15] flex items-center justify-center shrink-0 shadow-xs">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-[#1a1a1a] truncate">{item.label}</span>
                      <span className="px-2 py-0.5 bg-[#241b15] text-[#d99a3d] rounded text-[11px] font-black shrink-0">
                        {item.value} {item.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 flex gap-3 items-start">
          <FiTrendingUp className="text-amber-700 w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-amber-900">{bi('Dynamic Consumption Notice', 'डायनामिक खपत सूचना')}</h4>
            <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
              {bi(
                'These credit consumption rates are configured live by platform admin console. Performing platform actions deducts credits according to these active thresholds.',
                'ये क्रेडिट खपत दरें प्लेटफॉर्म एडमिन कंसोल द्वारा लाइव कॉन्फ़िगर की जाती हैं। प्लेटफॉर्म क्रियाएं करने से इन सक्रिय सीमाओं के अनुसार क्रेडिट घट जाते हैं।'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

