import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetCreatorAvailabilityQuery, useUpdateCreatorAvailabilityMutation } from '../../../features/creator/creatorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorAvailabilityPage() {
  const { bi } = useLanguage();
  const { data, refetch } = useGetCreatorAvailabilityQuery(undefined, { 
    refetchOnMountOrArgChange: true,
    pollingInterval: 60000 
  });
  const [updateAvailability] = useUpdateCreatorAvailabilityMutation();
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    const fetchedStatus = data?.status || data?.data?.status || data?.availability || data?.availabilityStatus;
    if (fetchedStatus && typeof fetchedStatus === 'string') {
      setStatus(fetchedStatus);
    }
  }, [data]);

  const handleStatusChange = async (newStatus) => {
    const prevStatus = status;
    setStatus(newStatus);
    try {
      const res = await updateAvailability({ status: newStatus }).unwrap();
      const updated = res?.status || res?.data?.status || newStatus;
      setStatus(updated);
      toast.success(bi(`Creator Availability updated to ${newStatus}`, `उपलब्धता स्थिति बदलकर ${newStatus} कर दी गई`));
      if (typeof refetch === 'function') refetch();
    } catch (err) {
      setStatus(prevStatus);
      toast.error(err?.data?.message || bi('Failed to update availability status', 'उपलब्धता स्थिति अपडेट करना विफल रहा'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={FiClock}
        title={bi('Creator Work Availability Status', 'क्रिएटर कार्य उपलब्धता स्थिति (Availability Status)')}
        subtitle={bi('Update your current status so local vendors know when you are accepting new shoot orders', 'अपनी वर्तमान स्थिति अपडेट करें ताकि स्थानीय विक्रेताओं को पता रहे कि आप नए शूट ऑर्डर स्वीकार कर रहे हैं')}
      />

      <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleStatusChange('Available')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all cursor-pointer ${
              status === 'Available'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-xs'
                : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:border-emerald-500/50'
            }`}
          >
            <FiCheckCircle size={32} className="mx-auto text-emerald-600" />
            <h4 className="text-sm font-black text-[#1a1a1a]">{bi('Available', 'उपलब्ध (Available)')}</h4>
            <p className="text-[11px] text-slate-500 font-bold">{bi('Ready to take new reel shoots & promo orders', 'नया रील शूट और प्रोमो ऑर्डर लेने के लिए तैयार')}</p>
          </button>

          <button
            onClick={() => handleStatusChange('Busy')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all cursor-pointer ${
              status === 'Busy'
                ? 'bg-amber-50 border-amber-500 text-amber-800 font-black shadow-xs'
                : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:border-amber-500/50'
            }`}
          >
            <FiAlertCircle size={32} className="mx-auto text-amber-600" />
            <h4 className="text-sm font-black text-[#1a1a1a]">{bi('Busy', 'व्यस्त (Busy)')}</h4>
            <p className="text-[11px] text-slate-500 font-bold">{bi('Currently executing ongoing vendor shoots', 'वर्तमान में चल रहे विक्रेता शूट निष्पादित कर रहे हैं')}</p>
          </button>

          <button
            onClick={() => handleStatusChange('On Leave')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all cursor-pointer ${
              status === 'On Leave'
                ? 'bg-rose-50 border-rose-500 text-rose-800 font-black shadow-xs'
                : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:border-rose-500/50'
            }`}
          >
            <FiMinusCircle size={32} className="mx-auto text-rose-600" />
            <h4 className="text-sm font-black text-[#1a1a1a]">{bi('On Leave', 'अवकाश पर (On Leave)')}</h4>
            <p className="text-[11px] text-slate-500 font-bold">{bi('Not accepting orders until further notice', 'अगली सूचना तक नए ऑर्डर स्वीकार नहीं कर रहे हैं')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
