import React from 'react';
import { FiZap, FiPlus } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * TopupPacksSection
 * Renders available instant top-up credit packs fetched live from the database.
 */
export default function TopupPacksSection({ topupPacks = [], onSelectPack }) {
  const { bi } = useLanguage();

  if (!topupPacks || topupPacks.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
        <div>
          <h3
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2"
          >
            <FiZap className="text-[#d99a3d]" size={18} />{' '}
            {bi('AVAILABLE TOP-UP PACKS', 'उपलब्ध टॉप-अप पैक')}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {bi(
              'Instant balance deposit via Razorpay UPI, Cards & NetBanking',
              'यूपीआई और कार्ड द्वारा त्वरित बैलेंस जमा'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {topupPacks.map((pack, idx) => {
          const amtVal = pack.amount || pack.price || pack;
          const labelStr = pack.title || pack.label || `Pack ₹${amtVal}`;
          const bonusStr = pack.bonus ? `+${pack.bonus} Bonus` : null;

          return (
            <div
              key={pack.id || idx}
              className="p-4 rounded-xl bg-[#f8f4ec] border-2 border-[#e3dccb] hover:border-[#241b15] transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1a1a1a]">{labelStr}</span>
                  {bonusStr && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[9.5px]">
                      {bonusStr}
                    </span>
                  )}
                </div>
                <h4 className="text-2xl font-black text-[#1a1a1a] font-mono">
                  ₹{Number(amtVal).toLocaleString('en-IN')}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold block">
                  = {Number(amtVal).toLocaleString('en-IN')} Credits
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectPack(String(amtVal))}
                className="w-full py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] text-xs font-black rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              >
                <FiPlus size={14} />
                <span>{bi('Select Pack', 'पैक चुनें')}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
