import React, { useState } from 'react';
import { FiX, FiArrowUpRight, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * WithdrawRevenueModal
 * Modal for withdrawing cleared merchant sales revenue (₹ INR) to verified bank accounts.
 */
export default function WithdrawRevenueModal({
  isOpen,
  earningsInr = 0,
  bankDetails,
  onClose,
  onSuccess,
}) {
  const { bi } = useLanguage();
  const [amount, setAmount] = useState(earningsInr > 0 ? String(earningsInr) : '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdrawSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmt > earningsInr) {
      toast.error('Withdrawal amount cannot exceed available sales earnings.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/wallet/payout', { amount: numAmt });
      toast.success(
        `🎉 Payout request for ₹${numAmt.toLocaleString('en-IN')} submitted successfully! Funds will be transferred to your bank account.`
      );
      if (typeof onSuccess === 'function') onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit payout request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#241b15] space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FiArrowUpRight size={18} />
            </span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base font-black text-[#1a1a1a]">
                {bi('WITHDRAW SALES REVENUE', 'बिक्री आय बैंक में निकालें')}
              </h3>
              <span className="text-[10px] text-slate-500 font-bold">
                {bi('Bank IMPS / NEFT Settlement', 'बैंक आईएमपीएस / एनईएफटी हस्तांतरण')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div className="p-3.5 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {bi('Available Withdrawable Balance:', 'निकासी योग्य शेष राशि:')}
            </span>
            <span className="text-base font-black text-emerald-700 font-mono">
              ₹{Number(earningsInr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-[#1a1a1a]">
                {bi('Withdrawal Amount (₹ INR)', 'निकासी राशि (रुपये)')}
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(earningsInr))}
                className="text-[10px] font-black text-emerald-700 hover:underline cursor-pointer"
              >
                {bi('Withdraw Max', 'अधिकतम निकालें')}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={earningsInr}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-8 pr-4 py-3 bg-[#f8f4ec] border-2 border-[#e3dccb] focus:border-[#241b15] rounded-xl text-lg font-mono font-bold text-[#1a1a1a] outline-none transition"
                required
              />
            </div>
          </div>

          {/* Destination Bank Account Preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
              <FiShield size={14} className="text-emerald-600" />
              <span>{bi('Destination Bank Account', 'गंतव्य बैंक खाता')}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {bankDetails?.accountNumber
                ? `${bankDetails.bankName || 'Verified Bank'} (Acct: •••• ${String(bankDetails.accountNumber).slice(-4)})`
                : bi('Your verified business merchant bank account on file.', 'आपका पंजीकृत व्यापारिक बैंक खाता।')}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {bi('Cancel', 'रद्द करें')}
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > earningsInr}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{bi('Submitting...', 'जमा हो रहा है...')}</span>
              ) : (
                <>
                  <FiArrowUpRight size={15} strokeWidth={2.5} />
                  <span>{bi('Confirm Withdrawal', 'निकासी की पुष्टि करें')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
