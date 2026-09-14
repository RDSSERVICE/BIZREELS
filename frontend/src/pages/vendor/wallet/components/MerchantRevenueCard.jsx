import React from 'react';
import { FiArrowUpRight, FiShield } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * MerchantRevenueCard
 * Displays withdrawable merchant sales revenue (real fiat currency ₹ INR from buyer orders).
 * Subject to escrow clearance and bank payout withdrawal.
 */
export default function MerchantRevenueCard({
  earningsInr = 0,
  bankDetails,
  onOpenPayout,
}) {
  const { bi } = useLanguage();

  const isWithdrawable = earningsInr > 0;

  return (
    <div className="bg-white text-[#1a1a1a] p-6 sm:p-7 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col justify-between relative overflow-hidden">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            💰 {bi('ORDER SALES REVENUE', 'ऑर्डर बिक्री राजस्व')}
          </span>
          <span className="text-[10px] font-extrabold text-slate-600 bg-[#f8f4ec] border border-[#e3dccb] px-2 py-0.5 rounded-full">
            {bi('Withdrawable', 'निकासी योग्य')}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-emerald-700">₹</span>
            <span
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-3xl sm:text-4xl font-black text-[#1a1a1a] tracking-tight"
            >
              {Number(earningsInr || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {bi(
              'Net customer order earnings processed and cleared into your merchant account, withdrawable to your verified bank account.',
              'ग्राहकों के पूर्ण ऑर्डर से प्राप्त शुद्ध राशि जो बैंक में हस्तांतरणीय है।'
            )}
          </p>
        </div>

        {bankDetails?.accountNumber && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] text-xs font-semibold text-slate-600">
            <FiShield className="text-emerald-600" size={14} />
            <span>
              {bankDetails.bankName || 'Bank'}: •••• {String(bankDetails.accountNumber).slice(-4)}
            </span>
          </div>
        )}
      </div>

      <div className="pt-5 mt-4 border-t border-[#e3dccb] flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenPayout}
          disabled={!isWithdrawable}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiArrowUpRight size={18} strokeWidth={2.5} />
          <span>{bi('WITHDRAW TO BANK', 'बैंक में निकालें')}</span>
        </button>
      </div>
    </div>
  );
}
