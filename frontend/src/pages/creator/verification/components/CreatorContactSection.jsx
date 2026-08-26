import React, { useState } from 'react';
import { FiPhone, FiCheckCircle, FiAlertCircle, FiShield, FiMail, FiMessageSquare, FiX } from 'react-icons/fi';
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
    <div className="bg-white border-2 border-[#e3dccb] rounded-md shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black">
            3
          </span>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#241b15]">
              {bi('Contact Channels Verification', 'संपर्क चैनल सत्यापन')}
            </h2>
            <p className="text-xs text-slate-500">
              {bi('Verify your phone, WhatsApp, and email address with OTP', 'ओटीपी के साथ अपने फोन, व्हाट्सएप और ईमेल पते को सत्यापित करें')}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#d99a3d] bg-[#241b15] px-2.5 py-0.5 rounded">
          {bi('Instant OTP Validation', 'तुरंत ओटीपी सत्यापन')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Mobile Number */}
        <div className="p-4 rounded-md bg-[#f8f4ec] border-2 border-[#e3dccb] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                {bi('Mobile Number', 'मोबाइल नंबर')}
              </span>
              <FiPhone className="text-[#d99a3d]" size={14} />
            </div>
            <p className="text-xs font-black text-[#241b15]">
              {creatorProfile?.mobileNumber || currentUser?.phone || 'Not set'}
            </p>
            {contactVerified.mobile ? (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} className="text-emerald-600" /> {bi('Verified ✓', 'सत्यापित ✓')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.mobile)}
            onClick={() => handleSendOtp('mobile', creatorProfile?.mobileNumber || currentUser?.phone)}
            className={`w-full py-2 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
              contactVerified.mobile
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15]'
            }`}
          >
            {contactVerified.mobile ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify Mobile', 'मोबाइल सत्यापित करें')}
          </button>
        </div>

        {/* 2. WhatsApp Number */}
        <div className="p-4 rounded-md bg-[#f8f4ec] border-2 border-[#e3dccb] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                {bi('WhatsApp Number', 'व्हाट्सऐप नंबर')}
              </span>
              <FiMessageSquare className="text-[#d99a3d]" size={14} />
            </div>
            <p className="text-xs font-black text-[#241b15]">
              {creatorProfile?.whatsappNumber || creatorProfile?.mobileNumber || currentUser?.phone || 'Not set'}
            </p>
            {contactVerified.whatsapp ? (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} className="text-emerald-600" /> {bi('Verified ✓', 'सत्यापित ✓')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.whatsapp)}
            onClick={() => handleSendOtp('whatsapp', creatorProfile?.whatsappNumber || creatorProfile?.mobileNumber || currentUser?.phone)}
            className={`w-full py-2 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
              contactVerified.whatsapp
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15]'
            }`}
          >
            {contactVerified.whatsapp ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify WhatsApp', 'व्हाट्सऐप सत्यापित करें')}
          </button>
        </div>

        {/* 3. Email Address */}
        <div className="p-4 rounded-md bg-[#f8f4ec] border-2 border-[#e3dccb] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                {bi('Email Address', 'ईमेल पता')}
              </span>
              <FiMail className="text-[#d99a3d]" size={14} />
            </div>
            <p className="text-xs font-black text-[#241b15] truncate" title={creatorProfile?.email || currentUser?.email}>
              {creatorProfile?.email || currentUser?.email || 'Not set'}
            </p>
            {contactVerified.email ? (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1.5">
                <FiCheckCircle size={12} className="text-emerald-600" /> {bi('Verified ✓', 'सत्यापित ✓')}
              </span>
            ) : (
              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1.5">
                <FiAlertCircle size={12} /> {bi('Unverified', 'असत्यापित')}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={Boolean(contactVerified.email)}
            onClick={() => handleSendOtp('email', creatorProfile?.email || currentUser?.email)}
            className={`w-full py-2 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
              contactVerified.email
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15]'
            }`}
          >
            {contactVerified.email ? bi('Verified ✓', 'सत्यापित ✓') : bi('Verify Email', 'ईमेल सत्यापित करें')}
          </button>
        </div>
      </div>

      {/* Contact OTP Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#241b15] rounded-md p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#241b15] flex items-center gap-2">
                <FiShield className="text-[#d99a3d]" />
                <span>{bi(`Verify ${otpModal.type.toUpperCase()} OTP`, `${otpModal.type.toUpperCase()} ओटीपी सत्यापित करें`)}</span>
              </h4>
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '' })}
                className="text-slate-400 hover:text-[#241b15] cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {bi('Enter verification code sent to', 'पर भेजा गया सत्यापन कोड दर्ज करें')}{' '}
              <span className="font-bold text-[#241b15]">{otpModal.value || bi('contact', 'संपर्क')}</span>
            </p>

            <input
              type="text"
              maxLength={6}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value })}
              placeholder="e.g. 123456"
              className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-white border-2 border-[#241b15] rounded-md text-[#241b15] outline-hidden focus:ring-2 focus:ring-[#d99a3d]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '' })}
                className="w-1/2 py-2.5 rounded-md text-xs font-bold text-slate-700 bg-[#f8f4ec] hover:bg-[#e3dccb] transition cursor-pointer"
              >
                {bi('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-1/2 py-2.5 rounded-md text-xs font-black uppercase tracking-wider text-[#d99a3d] bg-[#241b15] hover:bg-[#342820] border border-[#241b15] shadow-xs transition disabled:opacity-50 cursor-pointer"
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
