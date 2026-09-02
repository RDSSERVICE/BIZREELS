import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSettings, FiSliders, FiClock, FiTrash2, FiLogOut, FiSave,
  FiBriefcase, FiMapPin, FiMessageSquare, FiBell, FiCheckCircle,
  FiShield, FiPhone, FiLock, FiX, FiRefreshCw, FiAlertTriangle,
  FiChevronRight, FiFileText, FiTag
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser, setCredentials, logout } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';
import { useDeleteAccountMutation } from '../../../features/auth/authApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorSettingsPage() {
  const { bi, t } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};
  const [deleteAccountApi] = useDeleteAccountMutation();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAddressString = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      return addr.fullAddress || addr.address || '';
    }
    return '';
  };

  // Form State - All fully editable
  const [businessName, setBusinessName] = useState(
    vendorProfile.businessName || vendorProfile.shopName || vendorProfile.displayName || currentUser?.name || ''
  );
  const [category, setCategory] = useState(
    vendorProfile.category || (Array.isArray(vendorProfile.categories) && vendorProfile.categories.length > 0 ? vendorProfile.categories.join(', ') : '') || ''
  );
  const [subcategory, setSubcategory] = useState(
    vendorProfile.subcategory || (Array.isArray(vendorProfile.subCategories) && vendorProfile.subCategories.length > 0 ? vendorProfile.subCategories.join(', ') : '') || ''
  );
  const [address, setAddress] = useState(getAddressString(vendorProfile.address) || currentUser?.location?.address || '');
  const [mobileNumber, setMobileNumber] = useState(vendorProfile.mobileNumber || currentUser?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(vendorProfile.whatsappNumber || vendorProfile.whatsapp || vendorProfile.mobileNumber || currentUser?.phone || '');

  // Registered Mobile & Onboarding Categories
  const targetMobile = mobileNumber || vendorProfile.mobileNumber || currentUser?.phone || '';

  const onboardedCategories = React.useMemo(() => {
    let cats = [];
    if (Array.isArray(vendorProfile.categories) && vendorProfile.categories.length > 0) {
      cats = [...vendorProfile.categories];
    } else if (vendorProfile.category) {
      cats = [vendorProfile.category];
    } else if (vendorProfile.businessCategory) {
      cats = [vendorProfile.businessCategory];
    }
    return cats.filter(Boolean);
  }, [vendorProfile]);

  const onboardedSubcategories = React.useMemo(() => {
    let subs = [];
    if (Array.isArray(vendorProfile.subCategories) && vendorProfile.subCategories.length > 0) {
      subs = [...vendorProfile.subCategories];
    } else if (Array.isArray(vendorProfile.subcategories) && vendorProfile.subcategories.length > 0) {
      subs = [...vendorProfile.subcategories];
    } else if (vendorProfile.subcategory) {
      subs = [vendorProfile.subcategory];
    }
    return subs.filter(Boolean);
  }, [vendorProfile]);

  const displayCategory = category || (onboardedCategories.length > 0 ? onboardedCategories.join(', ') : 'Not specified (Set in Onboarding)');
  const displaySubcategory = subcategory || (onboardedSubcategories.length > 0 ? onboardedSubcategories.join(', ') : 'None');

  // Shop Close Schedule Marker
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(!!vendorProfile.isTemporaryClosed);
  const [closeScheduleReason, setCloseScheduleReason] = useState(vendorProfile.closeScheduleReason || '');
  const [autoResponseNote, setAutoResponseNote] = useState(vendorProfile.autoResponseNote || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(vendorProfile.notificationsEnabled !== false);

  // OTP & Consent Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentPhone, setOtpSentPhone] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Fetch live settings and categories on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/v1/vendors/me/settings');
        if (res.data?.success || res.success) {
          const s = res.data?.data || res.data || res;
          const vp = res.data?.vendorProfile || res.vendorProfile || {};

          const bName = s.businessName || vp.shopName || vp.displayName || vendorProfile.shopName || currentUser?.name || '';
          const cat = s.category || (Array.isArray(vp.categories) && vp.categories.length > 0 ? vp.categories.join(', ') : vp.category) || (Array.isArray(vendorProfile.categories) && vendorProfile.categories.join(', ')) || vendorProfile.category || '';
          const subCat = s.subcategory || (Array.isArray(vp.subCategories) && vp.subCategories.length > 0 ? vp.subCategories.join(', ') : (Array.isArray(vp.subcategories) ? vp.subcategories.join(', ') : vp.subcategory)) || (Array.isArray(vendorProfile.subCategories) && vendorProfile.subCategories.join(', ')) || vendorProfile.subcategory || '';
          const mob = s.mobileNumber || vp.mobileNumber || currentUser?.phone || '';
          const wMob = s.whatsappNumber || vp.whatsappNumber || vp.whatsapp || s.mobileNumber || currentUser?.phone || '';

          if (bName) setBusinessName(bName);
          setCategory(cat);
          setSubcategory(subCat);
          if (s.address) setAddress(getAddressString(s.address));
          if (s.isTemporaryClosed !== undefined) setIsTemporaryClosed(s.isTemporaryClosed);
          if (s.closeScheduleReason !== undefined) setCloseScheduleReason(s.closeScheduleReason);
          if (s.autoResponseNote !== undefined) setAutoResponseNote(s.autoResponseNote);
          if (s.notificationsEnabled !== undefined) setNotificationsEnabled(s.notificationsEnabled);
          if (mob) setMobileNumber(mob);
          if (wMob) setWhatsappNumber(wMob);
        }
      } catch (err) {
        // Fallback to redux profile
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Request Security OTP on registered mobile number
  const handleRequestOtp = async () => {
    setSendingOtp(true);
    const toastId = toast.loading('Sending verification OTP to registered mobile...');
    try {
      const res = await api.post('/v1/vendors/me/send-settings-otp');
      if (res.data?.success || res.success) {
        setOtpSentPhone(res.data?.phone || res.phone || 'registered mobile');
        if (res.data?.otp || res.otp) {
          setDevOtpHint(res.data?.otp || res.otp);
        }
        setOtpTimer(60);
        toast.success(`OTP sent to ${res.data?.phone || 'your mobile'}!`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP. Please ensure phone number is verified.', { id: toastId });
    } finally {
      setSendingOtp(false);
    }
  };

  // Open Consent & OTP Verification Modal
  const handleOpenVerification = (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      return toast.error('Business / Store Name is required');
    }
    setOtpCode('');
    setConsentGiven(false);
    setShowOtpModal(true);
    handleRequestOtp();
  };

  // Submit verified settings with OTP and consent
  const handleConfirmAndSave = async (e) => {
    e.preventDefault();
    if (!consentGiven) {
      return toast.error('कृपया सेटिंग्स व प्रोफ़ाइल बदलने की सहमती (Consent) दें।');
    }
    if (!otpCode || otpCode.trim().length < 4) {
      return toast.error('कृपया 6-अंकों का मान्य OTP दर्ज करें।');
    }

    setSaving(true);
    const toastId = toast.loading('Verifying OTP & Saving Business Settings...');

    try {
      const res = await api.post('/v1/vendors/me/settings', {
        businessName,
        category,
        subcategory,
        address,
        isTemporaryClosed,
        closeScheduleReason,
        autoResponseNote,
        notificationsEnabled,
        mobileNumber,
        whatsappNumber,
        otp: otpCode.trim(),
        consentGiven: true,
      });

      const updatedUser = res.data?.user || res.user;

      // Update Redux state
      if (updatedUser) {
        dispatch(setCredentials({
          user: {
            ...currentUser,
            ...updatedUser,
            name: businessName || currentUser?.name,
            vendorProfile: {
              ...vendorProfile,
              businessName,
              category,
              subcategory,
              address,
              isTemporaryClosed,
              closeScheduleReason,
              autoResponseNote,
              notificationsEnabled,
              mobileNumber,
              whatsappNumber,
            }
          }
        }));
      }

      setShowOtpModal(false);
      toast.success('🟢 Vendor Business Settings & Profile Updated Successfully with OTP Verification!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save settings. Please verify OTP.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShop = async () => {
    if (window.confirm('Are you sure you want to permanently delete your shop listing and vendor account?')) {
      const toastId = toast.loading('Deleting account...');
      try {
        await deleteAccountApi().unwrap();
        toast.success('Your account and shop listing have been deleted.', { id: toastId });
        dispatch(logout());
        navigate('/auth/login');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete account.', { id: toastId });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans p-2 sm:p-4 pb-16">
      <AdminPageHeader
        icon={FiSettings}
        title={bi('Vendor Store Settings & Operations', 'विक्रेता स्टोर सेटिंग्स और संचालन (Store Settings)')}
        subtitle={bi('Configure shop details, categories, operating schedule, auto-responses, and notifications with OTP verification', 'दुकान का विवरण, श्रेणियां, संचालन समय सारिणी, ऑटो-जवाब और सूचनाएं कॉन्फ़िगर करें')}
      />

      {/* Quick Jump Bar */}
      <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-3 overflow-x-auto">
        <Link
          to="/vendor/profile"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition flex items-center gap-2"
        >
          <FiBriefcase className="w-3.5 h-3.5" />
          <span>{bi('Business Profile & Branding', 'बिजनेस प्रोफाइल और ब्रांडिंग')}</span>
        </Link>
        <Link
          to="/vendor/verification"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition flex items-center gap-2"
        >
          <FiShield className="w-3.5 h-3.5" />
          <span>{bi('Verification Center', 'सत्यापन केंद्र')}</span>
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-[#e3dccb]">
          {bi('Loading vendor configuration...', 'विक्रेता कॉन्फ़िगरेशन लोड हो रहा है...')}
        </div>
      ) : (
        <form onSubmit={handleOpenVerification} className="space-y-6">
          
          {/* Security Notice Alert */}
          <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0">
              <FiShield size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wide">
                {bi('Secure Business Profile Editing Enabled', 'सुरक्षित व्यवसाय प्रोफ़ाइल संपादन सक्षम')}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {bi(
                  'All business configuration fields below are fully editable. For security, any updates will require your consent and instant verification via Mobile OTP.',
                  'नीचे दिए गए सभी व्यावसायिक कॉन्फ़िगरेशन फ़ील्ड पूरी तरह से संपादन योग्य हैं। सुरक्षा के लिए, किसी भी अपडेट के लिए मोबाइल ओटीपी के माध्यम से आपकी सहमति और तत्काल सत्यापन की आवश्यकता होगी।'
                )}
              </p>
            </div>
          </div>

          {/* Section 1: Business Profile Information */}
          <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
              <FiBriefcase className="text-[#d99a3d]" />
              <span>{bi('1. Business Profile Information', '1. व्यवसाय प्रोफाइल जानकारी')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Electronics & Services"
                  className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Primary Operating Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 12, Main Commercial Complex, City Center"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
                  />
                  <FiMapPin className="absolute left-3 top-3 text-slate-400" size={14} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Support Mobile Number (For Customer Calls)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
                  />
                  <FiPhone className="absolute left-3 top-3 text-slate-400" size={14} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  WhatsApp Support Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
                  />
                  <FiMessageSquare className="absolute left-3 top-3 text-slate-400" size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Business Categories & Subcategories (From Onboarding Details) */}
          <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3dccb] pb-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiTag className="text-[#d99a3d]" />
                <span>2. Business Category &amp; Subcategories (Onboarding Details)</span>
              </h3>
              <Link
                to="/vendor/onboarding-details"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] font-bold text-xs rounded-xl transition border border-[#e3dccb] self-start sm:self-auto"
              >
                <FiFileText size={13} className="text-[#d99a3d]" />
                <span>Edit in Onboarding Details</span>
                <FiChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Primary Category
                </label>
                <p className="text-xs font-black text-[#1a1a1a]">
                  {displayCategory}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Configured via Onboarding Setup
                </span>
              </div>

              <div className="p-3.5 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Subcategories &amp; Specializations
                </label>
                <p className="text-xs font-black text-[#1a1a1a]">
                  {displaySubcategory}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Configured via Onboarding Setup
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Shop Temporary Close Marker */}
          <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
              <FiClock className="text-[#d99a3d]" />
              <span>3. Shop / Service Close Marker Schedule</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] gap-3">
              <div>
                <h4 className="font-bold text-xs text-[#1a1a1a]">Temporary Closed Status Marker</h4>
                <p className="text-[11px] text-slate-500">When enabled, your store will display a "TEMPORARY CLOSED" badge on search and customer feeds</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemporaryClosed(!isTemporaryClosed)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  isTemporaryClosed ? 'bg-red-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isTemporaryClosed ? '🔴 STATUS: TEMPORARY CLOSED' : '🟢 STATUS: OPEN FOR BUSINESS'}
              </button>
            </div>

            {isTemporaryClosed && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                  Close Schedule Reason / Reopening Note for Customers
                </label>
                <input
                  type="text"
                  value={closeScheduleReason}
                  onChange={(e) => setCloseScheduleReason(e.target.value)}
                  placeholder="e.g. Closed for vacation until Monday 10:00 AM"
                  className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            )}
          </div>

          {/* Section 4: Customer Inquiry Auto-Response Note */}
          <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
              <FiMessageSquare className="text-[#d99a3d]" />
              <span>4. Customer Inquiry Auto-Response Note</span>
            </h3>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Auto-Reply Message for Customer Chat & Lead Inquiries
              </label>
              <textarea
                rows={2}
                value={autoResponseNote}
                onChange={(e) => setAutoResponseNote(e.target.value)}
                placeholder="Message sent automatically when a customer leaves an inquiry..."
                className="w-full px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] font-black rounded-xl text-xs hover:bg-[#3a2c22] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <FiShield size={16} />
            <span>Review &amp; Authorize Changes with Mobile OTP</span>
          </button>
        </form>
      )}

      {/* Delete Shop & Logout */}
      <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { dispatch(logout()); navigate('/auth/login'); }}
          className="flex-1 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] font-bold text-xs rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <FiLogOut size={16} /> Logout Vendor
        </button>

        <button
          onClick={handleDeleteShop}
          className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <FiTrash2 size={16} /> Delete Shop Account
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          OTP & CONSENT VERIFICATION MODAL (सहमति व OTP सत्यापन)
      ───────────────────────────────────────────────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#241b15] max-w-lg w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shadow-xs">
                  <FiShield size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a]">
                    Authorize Profile &amp; Settings Update
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">Mobile OTP Verification &amp; Consent</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-[#1a1a1a] transition p-1 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Summary of pending changes */}
            <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-3.5 space-y-2 text-xs">
              <h5 className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-wider">
                Summary of Changes:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500 font-medium">Shop Name:</span> <strong className="text-[#1a1a1a] block truncate">{businessName}</strong></div>
                <div><span className="text-slate-500 font-medium">Status:</span> <strong className={`block ${isTemporaryClosed ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}`}>{isTemporaryClosed ? 'Temporary Closed' : 'Open'}</strong></div>
                <div><span className="text-slate-500 font-medium">Onboarding Category:</span> <strong className="text-[#1a1a1a] block truncate">{displayCategory}</strong></div>
                <div><span className="text-slate-500 font-medium">Onboarding Subcategory:</span> <strong className="text-[#1a1a1a] block truncate">{displaySubcategory}</strong></div>
                <div className="col-span-2 pt-1 border-t border-[#e3dccb] flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Registered Mobile:</span>
                  <strong className="text-[#1a1a1a] font-mono">{targetMobile ? `+91 ${targetMobile}` : 'Not set'}</strong>
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#d99a3d] rounded border-gray-300 focus:ring-[#d99a3d] cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-950 leading-snug">
                  मैं पुष्टि करता/करती हूँ और अपनी व्यावसायिक सेटिंग्स व प्रोफ़ाइल अपडेट करने की सहमति (Consent) देता/देती हूँ।
                  <span className="block text-[10px] text-amber-800 font-normal mt-0.5">
                    (I hereby confirm and authorize BizReels to update my official business profile configuration).
                  </span>
                </span>
              </label>
            </div>

            {/* OTP Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <FiPhone size={14} className="text-[#d99a3d]" />
                  <span>Enter OTP sent to: <strong>{otpSentPhone || (targetMobile ? `+91 ${targetMobile}` : '+91 registered mobile')}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={sendingOtp || otpTimer > 0}
                  className="text-xs font-black text-[#d99a3d] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer border-none bg-transparent"
                >
                  {sendingOtp ? 'Sending...' : otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-Digit OTP"
                className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-center text-lg font-black text-[#1a1a1a] tracking-widest focus:outline-none focus:border-[#d99a3d]"
              />

              {devOtpHint && (
                <p className="text-[10px] text-emerald-700 font-bold text-center">
                  💡 Dev Code Hint: {devOtpHint}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 bg-[#f8f4ec] text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer border-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={saving || !consentGiven || otpCode.length < 4}
                className="flex-1 py-3 bg-[#241b15] text-[#d99a3d] font-black rounded-xl text-xs hover:bg-[#3a2c22] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
              >
                <FiCheckCircle size={14} />
                <span>{saving ? 'Saving...' : 'Verify OTP & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
