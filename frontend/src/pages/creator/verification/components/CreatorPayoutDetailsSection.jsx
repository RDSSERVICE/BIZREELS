import React, { useState } from 'react';
import {
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiShield,
  FiZap, FiArrowRight, FiCheck
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

export default function CreatorPayoutDetailsSection({
  statusData,
  creatorProfile,
  onRefresh
}) {
  const { bi } = useLanguage();
  const paymentDetails = statusData?.paymentDetails || creatorProfile?.paymentDetails || {};
  const isUpiApproved = paymentDetails.upiVerified || paymentDetails.upiStatus === 'approved';
  const isBankApproved = (paymentDetails.verified || paymentDetails.status === 'approved') && paymentDetails.ifscVerified;

  // UPI State
  const [upiId, setUpiId] = useState(paymentDetails.upiId || '');
  const [upiLoading, setUpiLoading] = useState(false);

  // Bank State
  const [bankAccount, setBankAccount] = useState(paymentDetails.bankAccount || '');
  const [accountHolderName, setAccountHolderName] = useState(paymentDetails.accountHolderName || '');
  const [ifscCode, setIfscCode] = useState(paymentDetails.ifscCode || '');
  const [bankName, setBankName] = useState(paymentDetails.bankName || '');
  const [branchName, setBranchName] = useState(paymentDetails.branchName || '');
  const [bankLoading, setBankLoading] = useState(false);
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 1. UPI VERIFICATION FLOW (SANDBOX API / NPCI)
  // ─────────────────────────────────────────────────────────────
  const handleVerifyUpi = async () => {
    const cleanUpi = String(upiId || '').trim().toLowerCase();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      toast.error(bi('Enter a valid UPI ID format (e.g. 6395204834@ptyes, name@paytm)', 'मान्य यूपीआई आईडी दर्ज करें (जैसे 6395204834@ptyes, name@paytm)'));
      return;
    }

    setUpiLoading(true);
    const toastId = toast.loading(bi('Verifying UPI VPA with Sandbox NPCI API...', 'सैंडबॉक्स एनपीसीआई एपीआई से यूपीआई वीपीए सत्यापित किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verification/upi', {
        upiId: cleanUpi,
        accountHolderName: accountHolderName || undefined
      });

      if (res.data?.success) {
        toast.success(res.data.message || '🟢 UPI ID verified successfully!', { id: toastId });
        if (typeof onRefresh === 'function') await onRefresh();
      } else {
        throw new Error(res.data?.message || 'UPI verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('UPI ID verification failed', 'यूपीआई आईडी सत्यापन विफल रहा'), { id: toastId });
    } finally {
      setUpiLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. IFSC CODE AUTO-LOOKUP
  // ─────────────────────────────────────────────────────────────
  const handleIfscLookup = async () => {
    const cleanIfsc = String(ifscCode || '').trim().toUpperCase();
    if (cleanIfsc.length < 11) {
      toast.error(bi('Enter valid 11-digit IFSC code (e.g. SBIN0001234)', 'मान्य 11 अंकों का आईएफएससी कोड दर्ज करें (जैसे SBIN0001234)'));
      return;
    }

    setIfscLookupLoading(true);
    try {
      const res = await api.get(`/v1/vendors/ifsc-lookup/${cleanIfsc}`);
      const data = res.data || res;
      if (data.bank) setBankName(data.bank);
      if (data.branch) setBranchName(data.branch);
      toast.success(bi(`IFSC Found: ${data.bank || 'Bank'} (${data.branch || 'Branch'})`, `आईएफएससी मिला: ${data.bank || 'बैंक'} (${data.branch || 'शाखा'})`));
    } catch (err) {
      toast.error(bi('Could not auto-fetch IFSC details. You can enter bank name manually.', 'आईएफएससी विवरण स्वतः प्राप्त नहीं हो सका। आप बैंक का नाम मैन्युअल रूप से दर्ज कर सकते हैं।'));
    } finally {
      setIfscLookupLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. BANK ACCOUNT VERIFICATION FLOW (SANDBOX API)
  // ─────────────────────────────────────────────────────────────
  const handleVerifyBank = async () => {
    const cleanIfsc = String(ifscCode || '').trim().toUpperCase();
    const cleanAcc = String(bankAccount || '').trim();

    if (!cleanIfsc || cleanIfsc.length < 11) {
      toast.error(bi('Please enter a valid 11-digit IFSC code', 'कृपया मान्य 11 अंकों का आईएफएससी कोड दर्ज करें'));
      return;
    }
    if (!cleanAcc || cleanAcc.length < 8) {
      toast.error(bi('Please enter a valid bank account number (8–20 digits)', 'कृपया मान्य बैंक खाता नंबर (8 से 20 अंक) दर्ज करें'));
      return;
    }

    setBankLoading(true);
    const toastId = toast.loading(bi('Verifying Bank Account with Sandbox API...', 'सैंडबॉक्स एपीआई से बैंक खाता सत्यापित किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verification/bank', {
        ifscCode: cleanIfsc,
        bankAccount: cleanAcc,
        accountHolderName: accountHolderName.trim() || undefined,
        bankName,
        branchName
      });

      if (res.data?.success) {
        toast.success(res.data.message || '🟢 Bank Account verified successfully!', { id: toastId });
        if (typeof onRefresh === 'function') await onRefresh();
      } else {
        throw new Error(res.data?.message || 'Bank verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('Bank Account verification failed', 'बैंक खाता सत्यापन विफल रहा'), { id: toastId });
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════
          1. UPI ID PAYOUT SECTION
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-[#e3dccb] rounded-md shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black">
              1
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#241b15]">
                {bi('Instant UPI Payout ID', 'तुरंत यूपीआई भुगतान आईडी')}
              </h2>
              <p className="text-xs text-slate-500">
                {bi('Instant campaign payments directly to Google Pay, PhonePe, Paytm, BHIM', 'Google Pay, PhonePe, Paytm और BHIM पर सीधे अभियान भुगतान')}
              </p>
            </div>
          </div>
          {isUpiApproved ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <FiCheckCircle size={14} className="text-emerald-600" /> {bi('Verified VPA ✓', 'सत्यापित वीपीए ✓')}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border-2 border-amber-300 rounded text-xs font-bold flex items-center gap-1.5">
              <FiAlertCircle size={14} /> {bi('Pending Verification', 'सत्यापन लंबित')}
            </span>
          )}
        </div>

        {/* Verified UPI State Card */}
        {isUpiApproved ? (
          <div className="rounded-md bg-[#f8f4ec] border-2 border-emerald-300 p-4 sm:p-5 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#241b15] uppercase tracking-wide">
                    {paymentDetails.beneficiaryName || paymentDetails.accountHolderName || 'Verified Beneficiary'}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black rounded uppercase">
                    NPCI ACTIVE
                  </span>
                </div>
                <p className="text-xs font-bold text-[#241b15] font-mono">
                  {paymentDetails.maskedUpi || paymentDetails.upiId}
                </p>
              </div>
              {paymentDetails.pspBank && (
                <span className="px-3 py-1 bg-white border border-[#e3dccb] rounded text-xs font-bold text-[#241b15]">
                  {paymentDetails.pspBank}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* UPI Input Flow */
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wide text-[#241b15]">
              {bi('Enter Virtual Payment Address (UPI ID)', 'वर्चुअल भुगतान पता (यूपीआई आईडी) दर्ज करें')}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 6395204834@ptyes, creator@okaxis, shop@paytm"
                className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] outline-hidden transition shadow-2xs placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handleVerifyUpi}
                disabled={upiLoading || !upiId || !upiId.includes('@')}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
              >
                {upiLoading ? bi('Verifying...', 'सत्यापित किया जा रहा है...') : bi('Verify UPI via Sandbox →', 'सैंडबॉक्स से यूपीआई सत्यापित करें →')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. BANK ACCOUNT PAYOUT SECTION
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-[#e3dccb] rounded-md shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black">
              2
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#241b15]">
                {bi('Direct Bank Account Transfer', 'सीधा बैंक खाता ट्रांसफर')}
              </h2>
              <p className="text-xs text-slate-500">
                {bi('Real-time penny drop & name match verification via Sandbox API', 'सैंडबॉक्स एपीआई के माध्यम से रियल टाइम पेनी ड्रॉप और नाम मिलान सत्यापन')}
              </p>
            </div>
          </div>
          {isBankApproved ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <FiCheckCircle size={14} className="text-emerald-600" /> {bi('Verified Account ✓', 'सत्यापित खाता ✓')}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border-2 border-amber-300 rounded text-xs font-bold flex items-center gap-1.5">
              <FiAlertCircle size={14} /> {bi('Pending Verification', 'सत्यापन लंबित')}
            </span>
          )}
        </div>

        {/* Verified Bank State Card */}
        {isBankApproved ? (
          <div className="rounded-md bg-[#f8f4ec] border-2 border-emerald-300 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#241b15] uppercase tracking-wide">
                    {paymentDetails.verifiedAccountName || paymentDetails.accountHolderName || 'Verified Account Holder'}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black rounded uppercase">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700 tracking-wider">
                  {paymentDetails.maskedAccount || paymentDetails.bankAccount}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-black text-[#241b15] block">{paymentDetails.bankName || 'Bank'}</span>
                <span className="text-slate-500 text-[11px] block font-medium">
                  {paymentDetails.branchName ? `${paymentDetails.branchName} • ` : ''}IFSC: {paymentDetails.ifscCode}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Bank Account Input Flow */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#241b15] mb-1.5">
                  {bi('Bank Account Number *', 'बैंक खाता नंबर *')}
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 918273645012"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] outline-hidden transition shadow-2xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#241b15] mb-1.5">
                  {bi('Account Holder Name', 'खाताधारक का नाम')}
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Full Name as registered in Bank"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] outline-hidden transition shadow-2xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#241b15] mb-1.5">
                  {bi('IFSC Code (11 Characters) *', 'आईएफएससी कोड (11 अक्षर) *')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] uppercase tracking-wider outline-hidden transition shadow-2xs placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleIfscLookup}
                    disabled={ifscLookupLoading || ifscCode.length < 11}
                    className="px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] hover:bg-[#e3dccb] text-[#241b15] rounded-md text-xs font-black uppercase transition disabled:opacity-50 cursor-pointer"
                  >
                    {ifscLookupLoading ? '...' : bi('Lookup', 'खोजें')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-[#241b15] mb-1.5">
                  {bi('Bank Name & Branch', 'बैंक का नाम और शाखा')}
                </label>
                <input
                  type="text"
                  value={bankName ? `${bankName} (${branchName || 'Main Branch'})` : ''}
                  readOnly
                  placeholder="Auto-populated on IFSC lookup"
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border-2 border-[#e3dccb] rounded-md text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyBank}
              disabled={bankLoading || !ifscCode || !bankAccount}
              className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {bankLoading ? bi('Verifying Bank Account with Sandbox...', 'सैंडबॉक्स से बैंक खाता सत्यापित किया जा रहा है...') : bi('Verify Bank Account via Sandbox API →', 'सैंडबॉक्स एपीआई से बैंक खाता सत्यापित करें →')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
