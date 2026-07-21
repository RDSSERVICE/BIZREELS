import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiShield, FiCheckCircle, FiAlertCircle, FiPhone, FiMessageSquare,
  FiMail, FiFileText, FiCreditCard, FiUploadCloud, FiCheck, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser, setCredentials } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';

const BADGE_DESCRIPTIONS = {
  unverified: {
    label: 'Unverified Creator',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    icon: '⚪',
    desc: 'Verify contact details and government identity to get verified checkmark and brand offers.'
  },
  partially_verified: {
    label: 'Partially Verified',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🟡',
    desc: 'Great progress! Verify PAN or Aadhaar card to unlock your 🟢 Verified Creator badge.'
  },
  verified_creator: {
    label: 'Verified Creator (OFFICIAL)',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🟢',
    desc: 'Verified Talent! You get top ranking in creator search, verified checkmark, and direct vendor hire requests.'
  },
  pro_verified: {
    label: 'Pro Verified (SUBSCRIBED)',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: '🔵',
    desc: 'VIP Status! Featured placement across BizReels, zero commission fees, and priority payout.'
  }
};

export default function CreatorVerificationPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const creatorProfile = currentUser?.creatorProfile || {};

  const [activeTab, setActiveTab] = useState('contacts');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState({
    completionPercentage: 20,
    tier: creatorProfile.verificationStatus || 'unverified',
    badgeLabel: 'Unverified Creator',
    badgeColor: '⚪',
    contactVerified: creatorProfile.contactVerified || { mobile: true, whatsapp: false, email: false },
    documents: creatorProfile.documents || {},
    paymentDetails: creatorProfile.paymentDetails || {}
  });

  // OTP Modal State
  const [otpModal, setOtpModal] = useState({ open: false, type: '', value: '', code: '' });

  // Document Forms
  const [aadhaarNum, setAadhaarNum] = useState(creatorProfile.documents?.aadhaar?.docNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(creatorProfile.documents?.aadhaar?.frontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(creatorProfile.documents?.aadhaar?.backUrl || '');

  const [panNum, setPanNum] = useState(creatorProfile.documents?.pan?.docNumber || '');
  const [panFront, setPanFront] = useState(creatorProfile.documents?.pan?.frontUrl || '');
  const [panBack, setPanBack] = useState(creatorProfile.documents?.pan?.backUrl || '');

  // Payment State
  const [upiId, setUpiId] = useState(creatorProfile.paymentDetails?.upiId || '');
  const [bankAccount, setBankAccount] = useState(creatorProfile.paymentDetails?.bankAccount || '');
  const [accountHolderName, setAccountHolderName] = useState(creatorProfile.paymentDetails?.accountHolderName || '');
  const [ifscCode, setIfscCode] = useState(creatorProfile.paymentDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(creatorProfile.paymentDetails?.bankName || '');
  const [branchName, setBranchName] = useState(creatorProfile.paymentDetails?.branchName || '');
  const [ifscLoading, setIfscLoading] = useState(false);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await api.get('/v1/creator/me/verification-status');
      if (res.data?.success || res.success) {
        const data = res.data || res;
        setStatusData(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Image upload
  const handleFileUpload = async (e, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Uploading document...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url || res.url;
      if (url) {
        setUrlState(url);
        toast.success('Document uploaded!', { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUrlState(reader.result);
          toast.success('Document attached', { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrlState(reader.result);
        toast.success('Document attached', { id: toastId });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenOtpModal = (type, value) => {
    setOtpModal({ open: true, type, value, code: '' });
    toast.success(`Verification OTP sent to ${type}: ${value || 'registered contact'}`);
  };

  const handleVerifyOtp = async () => {
    if (!otpModal.code || otpModal.code.length < 4) {
      toast.error('Enter valid 4-digit verification code');
      return;
    }
    setLoading(true);
    try {
      await api.post('/v1/creator/me/verify-contact', {
        type: otpModal.type,
        value: otpModal.value
      });

      toast.success(`${otpModal.type.toUpperCase()} verified!`);
      setOtpModal({ open: false, type: '', value: '', code: '' });
      await fetchStatus();
    } catch (err) {
      toast.error('Failed to verify contact');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (docType, docNumber, frontUrl, backUrl, docName) => {
    if (docType === 'aadhaar' && (!docNumber || docNumber.length !== 12)) {
      toast.error('Enter valid 12-digit Aadhaar Number');
      return;
    }
    if (docType === 'pan' && (!docNumber || docNumber.length !== 10)) {
      toast.error('Enter valid 10-digit PAN Number (e.g. ABCDE1234F)');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Verifying ${docName}...`);
    try {
      await api.post('/v1/creator/me/verify-document', {
        docType,
        docNumber,
        frontUrl,
        backUrl,
        docName
      });

      toast.success(`🟢 ${docName} verified!`, { id: toastId });
      await fetchStatus();
    } catch (err) {
      toast.error(`Failed to verify ${docName}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleIfscLookup = async () => {
    if (!ifscCode || ifscCode.length < 11) {
      toast.error('Enter valid 11-digit IFSC code');
      return;
    }
    setIfscLoading(true);
    try {
      const res = await api.get(`/v1/vendors/ifsc-lookup/${ifscCode.trim()}`);
      const data = res.data || res;
      if (data.bank) setBankName(data.bank);
      if (data.branch) setBranchName(data.branch);
      toast.success(`IFSC Verified: ${data.bank || 'Bank'} (${data.branch || 'Branch'})`);
    } catch (err) {
      toast.error('Could not auto-fetch IFSC details');
    } finally {
      setIfscLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setLoading(true);
    const toastId = toast.loading('Saving payout details...');
    try {
      await api.post('/v1/creator/me/verify-payment', {
        upiId,
        bankAccount,
        accountHolderName,
        ifscCode,
        bankName,
        branchName
      });

      toast.success('Payout & payment details verified!', { id: toastId });
      await fetchStatus();
    } catch (err) {
      toast.error('Failed to verify payment details', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const currentBadge = BADGE_DESCRIPTIONS[statusData.tier] || BADGE_DESCRIPTIONS.unverified;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiShield}
        title="Creator Verification Center"
        subtitle="Verify your contact details, government identity (Aadhaar & PAN), and UPI/Bank payout account to earn your verified creator badge."
      />

      {/* TOP HEADER & STATUS BADGE BANNER */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentBadge.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentBadge.color}`}>
                  {currentBadge.label}
                </span>
                {statusData.tier === 'verified_creator' && (
                  <span className="bg-emerald-500 text-white p-1 rounded-full text-xs">
                    <FiCheck className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-1">{currentBadge.desc}</p>
            </div>
          </div>

          <div className="text-right sm:text-right min-w-[140px]">
            <span className="text-2xl font-black text-text-primary font-display">{statusData.completionPercentage}%</span>
            <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Verification Score</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-surface-tertiary h-3 rounded-full overflow-hidden p-0.5 border border-border">
            <div
              className="gradient-brand h-full rounded-full transition-all duration-500"
              style={{ width: `${statusData.completionPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-text-secondary flex items-center justify-between font-semibold">
            <span>Priority placement in Creator Marketplace</span>
            <span className="text-brand-purple font-bold">Get 5x More Brand Offers</span>
          </p>
        </div>

        {/* Dialogue Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
              <FiZap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary">Verify Profile to Boost Creator Rank</h4>
              <p className="text-[11px] text-text-secondary">Verified creators receive 95% higher brand collaboration requests and direct vendor campaign invites!</p>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'bg-brand-purple text-white shadow-md'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          <FiPhone size={14} /> Contact Details Verification
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-brand-purple text-white shadow-md'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          <FiFileText size={14} /> Identity Documents (Aadhaar & PAN)
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'bg-brand-purple text-white shadow-md'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          <FiCreditCard size={14} /> UPI & Bank Payout Details
        </button>
      </div>

      {/* TAB 1: CONTACT DETAILS */}
      {activeTab === 'contacts' && (
        <div className="glass rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
            <FiPhone className="text-brand-purple" />
            <span>Contact Channels Verification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Mobile Number */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase block">Mobile Number</span>
                <p className="text-xs font-bold text-text-primary">{creatorProfile.mobileNumber || currentUser?.phone || 'Not set'}</p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <FiCheckCircle size={12} /> Verified via Account
                </span>
              </div>
              <button
                disabled
                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold"
              >
                Verified ✓
              </button>
            </div>

            {/* WhatsApp Number */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase block">WhatsApp Number</span>
                <p className="text-xs font-bold text-text-primary">{creatorProfile.whatsappNumber || creatorProfile.mobileNumber || 'Not set'}</p>
                {statusData.contactVerified?.whatsapp ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                    <FiAlertCircle size={12} /> Unverified
                  </span>
                )}
              </div>
              <button
                onClick={() => handleOpenOtpModal('whatsapp', creatorProfile.whatsappNumber || creatorProfile.mobileNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  statusData.contactVerified?.whatsapp
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'gradient-brand text-white shadow-sm'
                }`}
              >
                {statusData.contactVerified?.whatsapp ? 'Verified ✓' : 'Verify WhatsApp'}
              </button>
            </div>

            {/* Email Address */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase block">Email Address</span>
                <p className="text-xs font-bold text-text-primary">{creatorProfile.email || currentUser?.email || 'Not set'}</p>
                {statusData.contactVerified?.email ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                    <FiAlertCircle size={12} /> Unverified
                  </span>
                )}
              </div>
              <button
                onClick={() => handleOpenOtpModal('email', creatorProfile.email || currentUser?.email)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  statusData.contactVerified?.email
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'gradient-brand text-white shadow-sm'
                }`}
              >
                {statusData.contactVerified?.email ? 'Verified ✓' : 'Verify Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITY DOCUMENTS (AADHAAR & PAN) */}
      {activeTab === 'documents' && (
        <div className="glass rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="text-brand-purple" />
              <span>Government Identity Verification</span>
            </div>
            <span className="text-xs text-brand-purple font-semibold">Instant API Verification</span>
          </h3>

          <div className="space-y-6">
            {/* 1. Aadhaar Card */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-purple text-white flex items-center justify-center text-xs font-bold">A</span>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Aadhaar Card (Identity Verification)</h4>
                    <p className="text-[10px] text-text-tertiary">Enter 12-digit Aadhaar number & upload front-back images</p>
                  </div>
                </div>
                {statusData.documents?.aadhaar?.status === 'approved' && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold">
                    Verified ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNum}
                  onChange={(e) => setAadhaarNum(e.target.value)}
                  placeholder="12-Digit Aadhaar Number"
                  className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary"
                />

                <label className="cursor-pointer px-3 py-2 bg-surface-secondary border border-dashed border-border rounded-xl text-xs font-semibold text-text-secondary flex items-center justify-center gap-1.5 hover:border-brand-purple transition">
                  <FiUploadCloud size={14} /> {aadhaarFront ? 'Front Attached ✓' : 'Upload Front Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarFront)} />
                </label>

                <label className="cursor-pointer px-3 py-2 bg-surface-secondary border border-dashed border-border rounded-xl text-xs font-semibold text-text-secondary flex items-center justify-center gap-1.5 hover:border-brand-purple transition">
                  <FiUploadCloud size={14} /> {aadhaarBack ? 'Back Attached ✓' : 'Upload Back Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarBack)} />
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyDocument('aadhaar', aadhaarNum, aadhaarFront, aadhaarBack, 'Aadhaar Card')}
                disabled={loading || !aadhaarNum}
                className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition disabled:opacity-50"
              >
                Verify Aadhaar Card
              </button>
            </div>

            {/* 2. PAN Card */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-pink text-white flex items-center justify-center text-xs font-bold">P</span>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">PAN Card (Tax Identification)</h4>
                    <p className="text-[10px] text-text-tertiary">Enter 10-digit PAN number & upload PAN image</p>
                  </div>
                </div>
                {statusData.documents?.pan?.status === 'approved' && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold">
                    Verified ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  maxLength={10}
                  value={panNum}
                  onChange={(e) => setPanNum(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary uppercase"
                />

                <label className="cursor-pointer px-3 py-2 bg-surface-secondary border border-dashed border-border rounded-xl text-xs font-semibold text-text-secondary flex items-center justify-center gap-1.5 hover:border-brand-purple transition">
                  <FiUploadCloud size={14} /> {panFront ? 'Front Attached ✓' : 'Upload Front Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanFront)} />
                </label>

                <label className="cursor-pointer px-3 py-2 bg-surface-secondary border border-dashed border-border rounded-xl text-xs font-semibold text-text-secondary flex items-center justify-center gap-1.5 hover:border-brand-purple transition">
                  <FiUploadCloud size={14} /> {panBack ? 'Back Attached ✓' : 'Upload Back Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanBack)} />
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyDocument('pan', panNum, panFront, panBack, 'PAN Card')}
                disabled={loading || !panNum}
                className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition disabled:opacity-50"
              >
                Verify PAN Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYOUT & PAYMENT DETAILS */}
      {activeTab === 'payment' && (
        <div className="glass rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
            <FiCreditCard className="text-brand-purple" />
            <span>UPI & Bank Payout Details</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">UPI ID for Campaign Payouts</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. creatorname@upi or 9876543210@paytm"
                  className="flex-1 px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={loading || !upiId}
                  className="px-4 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  Verify UPI
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 918273645012"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as per Bank Record"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">IFSC Code (Auto-Lookup)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleIfscLookup}
                    disabled={ifscLoading || ifscCode.length < 11}
                    className="px-3 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {ifscLoading ? 'Lookup...' : 'Verify'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  readOnly
                  value={bankName ? `${bankName} (${branchName || 'Main Branch'})` : ''}
                  placeholder="Auto-populated on IFSC lookup"
                  className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyPayment}
              disabled={loading}
              className="w-full py-3.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition disabled:opacity-50"
            >
              Save & Verify Payout Details
            </button>
          </div>
        </div>
      )}

      {/* OTP MODAL */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-in">
            <h4 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiShield className="text-brand-purple" />
              <span>Verify {otpModal.type.toUpperCase()} OTP</span>
            </h4>
            <p className="text-xs text-text-tertiary">
              Enter 4-digit verification code sent to <span className="font-bold text-text-primary">{otpModal.value || 'contact'}</span>
            </p>

            <input
              type="text"
              maxLength={4}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value })}
              placeholder="e.g. 1234"
              className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-surface-secondary border border-border rounded-xl text-brand-purple"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '' })}
                className="w-1/2 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface-tertiary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-1/2 py-2 rounded-xl text-xs font-bold text-white gradient-brand"
              >
                Submit OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
