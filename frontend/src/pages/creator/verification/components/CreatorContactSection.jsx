import React, { useState } from 'react';
import { FiPhone, FiCheckCircle, FiAlertCircle, FiShield, FiMail, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

export default function CreatorContactSection({
  statusData,
  creatorProfile,
  currentUser,
  onRefresh
}) {
  const { bi } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState({ open: false, type: '', value: '', code: '' });

  const contactVerified = statusData?.contactVerified || {};

  const handleSendOtp = async (type, value) => {
    if (!value) {
      toast.error(bi(`Please provide a valid ${type}`, `${type} के लिए मान्य विवरण दर्ज करें`));
      return;
    }
    const toastId = toast.loading(bi(`Sending verification code to ${value}...`, `${value} पर सत्यापन कोड भेजा जा रहा है...`));
    try {
      const res = await api.post('/v1/creator/me/send-contact-otp', { type, value });
      toast.success(res.data?.message || bi(`Verification OTP sent to ${type}!`, `${type} पर सत्यापन ओटीपी भेज दिया गया है!`), { id: toastId });
      setOtpModal({ open: true, type, value, code: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || bi(`Failed to send OTP to ${type}`, `${type} पर ओटीपी भेजना विफल रहा`), { id: toastId });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpModal.code || otpModal.code.length < 4) {
      toast.error(bi('Please enter a valid 4 to 6 digit verification code', '4 से 6 अंकों का मान्य सत्यापन कोड दर्ज करें'));
      return;
    }
    setLoading(true);
    const toastId = toast.loading(bi('Verifying code...', 'कोड सत्यापित किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verify-contact', {
        type: otpModal.type,
        value: otpModal.value,
        code: otpModal.code
      });

      toast.success(res.data?.message || `${otpModal.type.toUpperCase()} verified successfully!`, { id: toastId });
      setOtpModal({ open: false, type: '', value: '', code: '' });
      if (typeof onRefresh === 'function') await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || bi('Failed to verify contact code', 'संपर्क कोड सत्यापित करना विफल रहा'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 shadow-card space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-text-primary font-heading flex items-center gap-2">
          <FiPhone className="text-brand-purple" />
          <span>{bi('Contact Channels Verification', 'संपर्क चैनल सत्यापन')}</span>
        </h3>
        <span className="text-[11px] font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full">
          {bi('Instant OTP Validation', 'तुरंत ओटीपी सत्यापन')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Mobile Number */}
        <div className="p-5 rounded-2xl bg-surface border border-border/70 flex flex-col justify-between gap-4 shadow-sm hover:border-brand-purple/40 transition">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{bi('Mobile Number', 'मोबाइल नंबर')}</span>
              <FiPhone className="text-text-tertiary" size={14} />
            </div>
            <p className="text-xs font-bold text-text-primary">
              {creatorProfile?.mobileNumber || currentUser?.phone || 'Not set'}
            </p>
            {contactVerified.mobile ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} /> {bi('Verified', 'सत्यापित')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.mobile)}
            onClick={() => handleSendOtp('mobile', creatorProfile?.mobileNumber || currentUser?.phone)}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
              contactVerified.mobile
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-not-allowed'
                : 'gradient-brand text-white shadow-sm hover:opacity-90 cursor-pointer'
            }`}
          >
            {contactVerified.mobile ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify Mobile', 'मोबाइल सत्यापित करें')}
          </button>
        </div>

        {/* 2. WhatsApp Number */}
        <div className="p-5 rounded-2xl bg-surface border border-border/70 flex flex-col justify-between gap-4 shadow-sm hover:border-brand-purple/40 transition">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{bi('WhatsApp Number', 'व्हाट्सऐप नंबर')}</span>
              <FiMessageSquare className="text-text-tertiary" size={14} />
            </div>
            <p className="text-xs font-bold text-text-primary">
              {creatorProfile?.whatsappNumber || creatorProfile?.mobileNumber || currentUser?.phone || 'Not set'}
            </p>
            {contactVerified.whatsapp ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} /> {bi('Verified', 'सत्यापित')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.whatsapp)}
            onClick={() => handleSendOtp('whatsapp', creatorProfile?.whatsappNumber || creatorProfile?.mobileNumber || currentUser?.phone)}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
              contactVerified.whatsapp
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-not-allowed'
                : 'gradient-brand text-white shadow-sm hover:opacity-90 cursor-pointer'
            }`}
          >
            {contactVerified.whatsapp ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify WhatsApp', 'व्हाट्सऐप सत्यापित करें')}
          </button>
        </div>

        {/* 3. Email Address */}
        <div className="p-5 rounded-2xl bg-surface border border-border/70 flex flex-col justify-between gap-4 shadow-sm hover:border-brand-purple/40 transition">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{bi('Email Address', 'ईमेल पता')}</span>
              <FiMail className="text-text-tertiary" size={14} />
            </div>
            <p className="text-xs font-bold text-text-primary truncate" title={creatorProfile?.email || currentUser?.email}>
              {creatorProfile?.email || currentUser?.email || 'Not set'}
            </p>
            {contactVerified.email ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} /> {bi('Verified', 'सत्यापित')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.email)}
            onClick={() => handleSendOtp('email', creatorProfile?.email || currentUser?.email)}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
              contactVerified.email
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-not-allowed'
                : 'gradient-brand text-white shadow-sm hover:opacity-90 cursor-pointer'
            }`}
          >
            {contactVerified.email ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify Email', 'ईमेल सत्यापित करें')}
          </button>
        </div>
      </div>

      {/* Contact OTP Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-in">
            <h4 className="text-sm font-bold text-text-primary font-heading flex items-center gap-2">
              <FiShield className="text-brand-purple" />
              <span>{bi(`Verify ${otpModal.type.toUpperCase()} OTP`, `${otpModal.type.toUpperCase()} ओटीपी सत्यापित करें`)}</span>
            </h4>
            <p className="text-xs text-text-tertiary">
              {bi('Enter verification code sent to', 'पर भेजा गया सत्यापन कोड दर्ज करें')} <span className="font-bold text-text-primary">{otpModal.value || bi('contact', 'संपर्क')}</span>
            </p>

            <input
              type="text"
              maxLength={6}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value })}
              placeholder="e.g. 123456"
              className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-surface-secondary border border-border rounded-xl text-brand-purple focus:outline-none focus:border-brand-purple"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '' })}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-surface-tertiary hover:bg-surface-secondary transition"
              >
                {bi('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? bi('Verifying...', 'सत्यापित किया जा रहा है...') : bi('Submit OTP', 'ओटीपी जमा करें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
