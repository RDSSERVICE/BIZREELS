import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetCreatorPricingQuery, useUpdateCreatorPricingMutation } from '../../../features/creator/creatorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorPricingPage() {
  const { bi } = useLanguage();
  const { data, isFetching } = useGetCreatorPricingQuery(undefined, { pollingInterval: 300000 });
  const [updatePricing] = useUpdateCreatorPricingMutation();

  const [reel1, setReel1] = useState('0');
  const [reel3, setReel3] = useState('0');
  const [reel10, setReel10] = useState('0');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [dayRate, setDayRate] = useState('0');

  useEffect(() => {
    if (data) {
      setReel1(String(data.reel1 ?? 0));
      setReel3(String(data.reel3 ?? 0));
      setReel10(String(data.reel10 ?? 0));
      setHourlyRate(String(data.hourlyRate ?? 0));
      setDayRate(String(data.dayRate ?? 0));
    }
  }, [data]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    try {
      await updatePricing({ reel1, reel3, reel10, hourlyRate, dayRate }).unwrap();
      toast.success(bi('Creator pricing rates updated!', 'क्रिएटर मूल्य दरें अपडेट हो गईं!'));
    } catch (err) {
      toast.error(err?.data?.message || bi('Failed to update pricing rates', 'मूल्य दरें अपडेट करना विफल रहा'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={TbCurrencyRupee}
        title={bi('Creator Pricing Tiers & Packages', 'क्रिएटर मूल्य निर्धारण दरें और पैकेज (Pricing Tiers)')}
        subtitle={bi('Set your reel bundle prices and hourly / day-wise shoot rates', 'अपनी रील बंडल कीमतें और प्रति घंटा / पूरे दिन के शूट की दरें निर्धारित करें')}
      />

      <form onSubmit={handleSavePricing} className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-6">
        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3">
          {bi('Reel Promotion Bundles', 'रील प्रचार बंडल दरें')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{bi('1 Reel Package (₹)', '1 रील पैकेज (₹)')}</label>
            <input
              type="number"
              value={reel1}
              onChange={(e) => setReel1(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{bi('3 Reels Package (₹)', '3 रील पैकेज (₹)')}</label>
            <input
              type="number"
              value={reel3}
              onChange={(e) => setReel3(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{bi('10 Reels Package (₹)', '10 रील पैकेज (₹)')}</label>
            <input
              type="number"
              value={reel10}
              onChange={(e) => setReel10(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
            />
          </div>
        </div>

        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 pt-2">
          {bi('Hourly / Day-wise Shoot Pricing', 'प्रति घंटा / प्रतिदिन शूट मूल्य निर्धारण')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{bi('Hourly Shoot Rate (₹)', 'प्रति घंटा शूट दर (₹)')}</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{bi('Full Day Shoot Rate (₹)', 'पूरे दिन की शूट दर (₹)')}</label>
            <input
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#241b15] text-[#d99a3d] font-black text-xs rounded-xl shadow-2xs hover:bg-[#342820] transition flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <FiSave size={16} /> <span>{bi('Save Pricing Settings', 'मूल्य दर सेटिंग्स सहेजें')}</span>
        </button>
      </form>
    </div>
  );
}
