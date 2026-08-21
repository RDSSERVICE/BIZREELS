import React from 'react';
import { FiActivity, FiArrowRight, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext';

export default function ActivitiesHeader({ totalCount = 0 }) {
  const { bi } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-4 font-sans">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shadow-xs">
            <FiActivity size={16} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight">
            {bi('Customer Activity Hub', 'ग्राहक गतिविधि हब (Customer Activity Hub)')}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {bi('Track saved products, services, reels, orders, contact history, and vendor interactions', 'सहेजे गए उत्पाद, सेवाएं, रील, ऑर्डर, संपर्क इतिहास और विक्रेता बातचीत ट्रैक करें')}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/customer/search')}
          className="px-3.5 py-2 bg-white border border-[#e3dccb] hover:border-[#d99a3d] text-[#1a1a1a] text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <FiSearch size={13} className="text-[#d99a3d]" />
          <span>{bi('Search More', 'और खोजें')}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/customer/home')}
          className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
        >
          <span>{bi('Explore Feed', 'फीड देखें')}</span>
          <FiArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
