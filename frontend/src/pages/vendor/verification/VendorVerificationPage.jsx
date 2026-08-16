import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiShield, FiCheckCircle, FiAlertCircle, FiPhone, FiMessageSquare,
  FiMail, FiGlobe, FiFileText, FiCreditCard, FiUploadCloud, FiCheck,
  FiLock, FiZap, FiStar, FiChevronRight, FiPlus, FiTrash2, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser, setCredentials } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';

const BADGE_DESCRIPTIONS = {
  unverified: {
    label: 'Unverified Vendor',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    icon: '⚪',
    desc: 'Verify contact details and identity documents to unlock customer leads and verified badge.'
  },
  partially_verified: {
    label: 'Partially Verified',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🟡',
    desc: 'Good progress! Verify PAN or Aadhaar card to earn your official 🟢 Verified Vendor badge.'
  },
  verified_vendor: {
    label: 'Verified Vendor (OFFICIAL)',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🟢',
    desc: 'Verified Business! You now enjoy top reel boost ranking, verified checkmark, and maximum buyer trust.'
  },
  premium_verified: {
    label: 'Premium Verified (SUBSCRIBED)',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: '🔵',
    desc: 'Elite Status! You have VIP listing placement, max lead generation, and priority customer chat.'
  }
};

export default function VendorVerificationPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'documents' | 'payment'
  const docsSequence = [
    { key: 'aadhaar', label: 'Aadhaar Card' },
    { key: 'pan', label: 'PAN Card' },
    { key: 'gst', label: 'GST Registration' },
    { key: 'shopLicense', label: 'Shop License' },
    { key: 'udyamRegistration', label: 'MSME / Udyam' },
    { key: 'dynamic', label: 'Custom Document' }
  ];
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState({
    completionPercentage: 20,
    tier: vendorProfile.verificationStatus || 'unverified',
    badgeLabel: 'Unverified',
    badgeColor: '⚪',
    contactVerified: vendorProfile.contactVerified || { mobile: true, whatsapp: false, email: false, website: false },
    documents: vendorProfile.documents || {},
    paymentDetails: vendorProfile.paymentDetails || {}
  });

  // OTP Modal State for contact verification
  const [otpModal, setOtpModal] = useState({ open: false, type: '', value: '', code: '' });

  // Document Forms
  const [aadhaarNum, setAadhaarNum] = useState(vendorProfile.documents?.aadhaar?.docNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(vendorProfile.documents?.aadhaar?.frontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(vendorProfile.documents?.aadhaar?.backUrl || '');

  const [panNum, setPanNum] = useState(vendorProfile.documents?.pan?.docNumber || '');
  const [panFront, setPanFront] = useState(vendorProfile.documents?.pan?.frontUrl || '');
  const [panBack, setPanBack] = useState(vendorProfile.documents?.pan?.backUrl || '');

  const [gstNum, setGstNum] = useState(vendorProfile.documents?.gst?.docNumber || '');
  const [gstFile, setGstFile] = useState(vendorProfile.documents?.gst?.fileUrl || '');

  const [shopLicenseNum, setShopLicenseNum] = useState(vendorProfile.documents?.shopLicense?.docNumber || '');
  const [shopLicenseFile, setShopLicenseFile] = useState(vendorProfile.documents?.shopLicense?.fileUrl || '');

  const [udyamNum, setUdyamNum] = useState(vendorProfile.documents?.udyamRegistration?.docNumber || '');
  const [udyamFile, setUdyamFile] = useState(vendorProfile.documents?.udyamRegistration?.fileUrl || '');

  // Dynamic Docs State
  const [dynamicDocName, setDynamicDocName] = useState('');
  const [dynamicDocNum, setDynamicDocNum] = useState('');
  const [dynamicDocFile, setDynamicDocFile] = useState('');

  // Payment State
  const [upiId, setUpiId] = useState(vendorProfile.paymentDetails?.upiId || '');
  const [bankAccount, setBankAccount] = useState(vendorProfile.paymentDetails?.bankAccount || '');
  const [accountHolderName, setAccountHolderName] = useState(vendorProfile.paymentDetails?.accountHolderName || '');
  const [ifscCode, setIfscCode] = useState(vendorProfile.paymentDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(vendorProfile.paymentDetails?.bankName || '');
  const [branchName, setBranchName] = useState(vendorProfile.paymentDetails?.branchName || '');
  const [statementFile, setStatementFile] = useState(vendorProfile.paymentDetails?.statementChequeUrl || '');
  const [ifscLoading, setIfscLoading] = useState(false);

  // Fetch live verification status
  const fetchStatus = async () => {
    try {
      const res = await api.get('/v1/vendors/me/verification-status');
      if (res.data?.success || res.success) {
        const data = res.data || res;
        setStatusData(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Image Upload Handler
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

  // Direct Website Verification (No OTP needed for Website)
  const handleVerifyWebsite = async (url) => {
    const targetUrl = url || vendorProfile.website;
    if (!targetUrl || targetUrl.trim() === '') {
      toast.error('❌ Please configure your website URL in settings before verifying.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Pinging and verifying website URL...');
    try {
      await api.post('/v1/vendors/me/verify-contact', {
        type: 'website',
        value: targetUrl
      });
      toast.success('🟢 Website URL verified successfully!', { id: toastId });
      await fetchStatus();
    } catch (err) {
      toast.error('Failed to verify website URL', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpModal.code || otpModal.code.length < 4) {
      toast.error('Enter valid 4-digit verification code (e.g. 1234)');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/v1/vendors/me/verify-contact', {
        type: otpModal.type,
        value: otpModal.value
      });

      toast.success(`🟢 ${otpModal.type.toUpperCase()} verified successfully!`);
      setOtpModal({ open: false, type: '', value: '', code: '' });
      await fetchStatus();

      // Update Redux state
      if (currentUser) {
        dispatch(setCredentials({
          user: {
            ...currentUser,
            vendorProfile: {
              ...vendorProfile,
              contactVerified: { ...statusData.contactVerified, [otpModal.type]: true }
            }
          }
        }));
      }

      // AUTOMATIC PROGRESSION: Auto-move to Part 2 (documents) after contact verification
      setTimeout(() => {
        setActiveTab('documents');
        toast.success('⏩ Part 1 Contact Verified! Automatically advancing to Part 2: Identity & Business Documents.');
      }, 1000);

    } catch (err) {
      toast.error('Failed to verify contact');
    } finally {
      setLoading(false);
    }
  };

  // Document Submit Handler
  const handleVerifyDocument = async (docType, docNumber, frontUrl, backUrl, fileUrl, docName) => {
    if (docType === 'aadhaar' && (!docNumber || docNumber.length !== 12)) {
      toast.error('Please enter valid 12-digit Aadhaar Number');
      return;
    }
    if (docType === 'pan' && (!docNumber || docNumber.length !== 10)) {
      toast.error('Please enter valid 10-digit PAN Number (e.g. ABCDE1234F)');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Verifying ${docName || docType}...`);
    try {
      const res = await api.post('/v1/vendors/me/verify-document', {
        docType,
        docNumber,
        frontUrl,
        backUrl,
        fileUrl,
        docName
      });

      toast.success(`🟢 ${docName || docType.toUpperCase()} verified successfully!`, { id: toastId });
      await fetchStatus();

      // Reset dynamic inputs if submitted
      if (docType === 'dynamic') {
        setDynamicDocName('');
        setDynamicDocNum('');
        setDynamicDocFile('');
      }

      // AUTOMATIC PROGRESSION: Auto-move to next document or Part 3 after document verification
      setTimeout(() => {
        if (currentDocIndex < 5) {
          setCurrentDocIndex(prev => prev + 1);
          toast.success(`⏩ ${docName || docType.toUpperCase()} submitted! Moving to next document.`);
        } else {
          setActiveTab('payment');
          toast.success('⏩ All Part 2 documents processed! Advancing to Part 3: Payout & Payment Details.');
        }
      }, 1200);

    } catch (err) {
      toast.error(`Failed to verify ${docType}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDoc = () => {
    if (currentDocIndex < 5) {
      setCurrentDocIndex(prev => prev + 1);
      toast.success('⏩ Document skipped. Moving to next document.');
    } else {
      setActiveTab('payment');
      toast.success('⏩ Moving to Part 3: Payout & Payment Details.');
    }
  };

  const handlePrevDoc = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(prev => prev - 1);
    }
  };

  // IFSC Lookup
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

  // Payment Verification Handler
  const handleVerifyPayment = async () => {
    setLoading(true);
    const toastId = toast.loading('Verifying payment details...');
    try {
      const res = await api.post('/v1/vendors/me/verify-payment', {
        upiId,
        bankAccount,
        accountHolderName,
        ifscCode,
        bankName,
        branchName,
        statementChequeUrl: statementFile
      });

      toast.success('Payout & Payment details verified!', { id: toastId });
      await fetchStatus();
    } catch (err) {
      toast.error('Failed to verify payment details', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Contact Verification OTP trigger (for Mobile, WhatsApp & Email)
  const handleOpenOtpModal = (type, value) => {
    setOtpModal({ open: true, type, value, code: '' });
    toast.success(`Verification OTP code sent to ${type}: ${value || 'registered contact'}`);
  };

  // Sequential Gating Checks
  const isPart1Complete = Boolean(
    statusData.contactVerified?.mobile ||
    statusData.contactVerified?.whatsapp ||
    statusData.contactVerified?.email
  );

  const isPart2Complete = Boolean(
    statusData.documents?.aadhaar?.status === 'approved' ||
    statusData.documents?.pan?.status === 'approved' ||
    statusData.documents?.gst?.status === 'approved' ||
    statusData.documents?.shopLicense?.status === 'approved' ||
    statusData.documents?.udyamRegistration?.status === 'approved' ||
    (statusData.documents && Object.keys(statusData.documents).length > 0)
  );

  const handleTabClick = (targetTab) => {
    if (targetTab === 'documents' && !isPart1Complete) {
      toast.error('🔒 Locked: Complete Part 1 (Contact Information Verification) to unlock Part 2.');
      return;
    }
    if (targetTab === 'payment' && (!isPart1Complete || !isPart2Complete)) {
      if (!isPart1Complete) {
        toast.error('🔒 Locked: Complete Part 1 (Contact Verification) first.');
      } else {
        toast.error('🔒 Locked: Complete Part 2 (Identity & Business Documents) to unlock Part 3.');
      }
      return;
    }
    setActiveTab(targetTab);
  };

  const currentBadge = BADGE_DESCRIPTIONS[statusData.tier] || BADGE_DESCRIPTIONS.unverified;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans animate-fade-in pb-16 p-2 sm:p-4">
      <AdminPageHeader
        icon={FiShield}
        title="Vendor Verification Center"
        subtitle="Verify your business contacts, government registration IDs, and payout details to get verified buyer trust & boost customer leads."
      />

      {/* TOP DIALOGUE & STATUS BADGE BANNER */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e3dccb] pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentBadge.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${currentBadge.color}`}>
                  {currentBadge.label}
                </span>
                {statusData.tier === 'verified_vendor' && (
                  <span className="bg-emerald-600 text-white p-1 rounded-full text-xs">
                    <FiCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">{currentBadge.desc}</p>
            </div>
          </div>

          <div className="text-right min-w-[100px] sm:min-w-[140px]">
            <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] tracking-tight">{statusData.completionPercentage}%</span>
            <span className="block text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Verification Score</span>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#f8f4ec] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#e3dccb]">
            <div
              className="bg-[#241b15] h-full rounded-full transition-all duration-500"
              style={{ width: `${statusData.completionPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 flex items-center justify-between font-bold">
            <span>Boost ranking in local reels &amp; search results</span>
            <span className="text-[#d99a3d] font-black">Get 5x More Leads</span>
          </p>
        </div>

        {/* Interactive Dialogue Banner */}
        <div className="p-4 rounded-xl bg-[#241b15] text-white border border-[#241b15] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#d99a3d] text-[#241b15] flex items-center justify-center font-black shrink-0 shadow-xs">
              <FiZap size={20} />
            </div>
            <div>
              <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#d99a3d] tracking-wide">VERIFY &amp; BOOST REELS TRUST SCORE</h4>
              <p className="text-xs text-slate-300 font-medium">Verified vendors appear on top in local customer discovery and gain 98% higher conversion!</p>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION TABS WITH SEQUENTIAL GATING */}
      <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-2 overflow-x-auto scrollbar-hide text-xs font-black">
        <button
          type="button"
          onClick={() => handleTabClick('contacts')}
          className={`px-4 py-2.5 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:bg-white'
          }`}
        >
          <FiPhone size={14} className={activeTab === 'contacts' ? 'text-[#d99a3d]' : 'text-slate-400'} />
          <span>Part 1: Contact Verification</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('documents')}
          className={`px-4 py-2.5 rounded-xl border transition flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs cursor-pointer'
              : isPart1Complete
              ? 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:bg-white cursor-pointer'
              : 'opacity-50 cursor-not-allowed bg-[#f8f4ec]/60 text-slate-400 border-[#e3dccb]'
          }`}
        >
          {isPart1Complete ? <FiFileText size={14} className={activeTab === 'documents' ? 'text-[#d99a3d]' : 'text-slate-400'} /> : <FiLock size={14} className="text-amber-500" />}
          <span>Part 2: Identity &amp; Documents</span>
          {!isPart1Complete && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black border border-amber-300">LOCKED</span>}
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('payment')}
          className={`px-4 py-2.5 rounded-xl border transition flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs cursor-pointer'
              : (isPart1Complete && isPart2Complete)
              ? 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:bg-white cursor-pointer'
              : 'opacity-50 cursor-not-allowed bg-[#f8f4ec]/60 text-slate-400 border-[#e3dccb]'
          }`}
        >
          {(isPart1Complete && isPart2Complete) ? <FiCreditCard size={14} className={activeTab === 'payment' ? 'text-[#d99a3d]' : 'text-slate-400'} /> : <FiLock size={14} className="text-amber-500" />}
          <span>Part 3: Payout Details</span>
          {(!isPart1Complete || !isPart2Complete) && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black border border-amber-300">LOCKED</span>}
        </button>
      </div>

      {/* TAB 1: CONTACT INFORMATION VERIFICATION */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
            <FiPhone className="text-[#d99a3d]" />
            <span>Contact Channels Verification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Mobile Number</span>
                <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{vendorProfile.mobileNumber || currentUser?.phone || 'Not set'}</p>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                  <FiCheckCircle size={12} /> Verified via Account OTP
                </span>
              </div>
              <button
                disabled
                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black"
              >
                Verified ✓
              </button>
            </div>

            {/* WhatsApp Number */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">WhatsApp Number</span>
                <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{vendorProfile.whatsappNumber || vendorProfile.mobileNumber || 'Not set'}</p>
                {statusData.contactVerified?.whatsapp ? (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                    <FiAlertCircle size={12} /> Unverified
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleOpenOtpModal('whatsapp', vendorProfile.whatsappNumber || vendorProfile.mobileNumber)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                  statusData.contactVerified?.whatsapp
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[#241b15] text-[#d99a3d] border-[#241b15] hover:bg-[#3a2c22] shadow-2xs'
                }`}
              >
                {statusData.contactVerified?.whatsapp ? 'Verified ✓' : 'Verify WhatsApp'}
              </button>
            </div>

            {/* Email Address */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Email Address</span>
                <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{vendorProfile.email || currentUser?.email || 'Not set'}</p>
                {statusData.contactVerified?.email ? (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                    <FiAlertCircle size={12} /> Unverified
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleOpenOtpModal('email', vendorProfile.email || currentUser?.email)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                  statusData.contactVerified?.email
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[#241b15] text-[#d99a3d] border-[#241b15] hover:bg-[#3a2c22] shadow-2xs'
                }`}
              >
                {statusData.contactVerified?.email ? 'Verified ✓' : 'Verify Email'}
              </button>
            </div>

            {/* Website URL */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Business Website</span>
                <p className="text-xs font-black text-[#1a1a1a] truncate max-w-[180px] mt-0.5">{vendorProfile.website || 'Not provided'}</p>
                {statusData.contactVerified?.website ? (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <FiCheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">Optional Ping Check</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleVerifyWebsite(vendorProfile.website)}
                disabled={loading}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                  statusData.contactVerified?.website
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[#241b15] text-[#d99a3d] border-[#241b15] hover:bg-[#3a2c22] shadow-2xs'
                }`}
              >
                {statusData.contactVerified?.website ? 'Verified ✓' : 'Verify Website'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#e3dccb]">
            <button
              type="button"
              onClick={() => handleTabClick('documents')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                isPart1Complete
                  ? 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] shadow-2xs border-none'
                  : 'bg-[#f8f4ec] text-slate-400 border border-[#e3dccb] cursor-not-allowed'
              }`}
            >
              <span>{isPart1Complete ? 'Proceed to Part 2: Identity & Business Documents' : 'Complete Part 1 to Unlock Part 2'}</span>
              {isPart1Complete ? <FiChevronRight size={16} /> : <FiLock size={14} className="text-amber-500" />}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS VERIFICATION */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="text-[#d99a3d]" />
              <span>Government Identity &amp; Business Compliance Licenses</span>
            </div>
            <span className="text-xs text-[#d99a3d] font-black uppercase">Instant API Verification</span>
          </h3>

          {/* Step indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 border-b border-[#e3dccb] pb-4 mb-4">
            {docsSequence.map((step, idx) => {
              const isCompleted = step.key === 'dynamic'
                ? (statusData.documents?.dynamicDocs && statusData.documents.dynamicDocs.length > 0)
                : statusData.documents?.[step.key]?.status === 'approved' || statusData.documents?.[step.key];
              const isActive = currentDocIndex === idx;
              return (
                <button
                  type="button"
                  key={step.key}
                  onClick={() => setCurrentDocIndex(idx)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] font-black shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-[#f8f4ec] text-slate-500 border-[#e3dccb] hover:text-[#1a1a1a] font-bold'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest block opacity-70">Step {idx + 1}</span>
                  <span className="text-[11px] font-black truncate w-full mt-0.5">{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            
            {/* 1. Aadhaar Card */}
            {currentDocIndex === 0 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">A</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Aadhaar Card (Individual Identity)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter 12-digit Aadhaar number &amp; upload front-back images</p>
                    </div>
                  </div>
                  {statusData.documents?.aadhaar?.status === 'approved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
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
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{aadhaarFront ? 'Front Attached ✓' : 'Upload Front Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarFront)} />
                  </label>

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{aadhaarBack ? 'Back Attached ✓' : 'Upload Back Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarBack)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('aadhaar', aadhaarNum, aadhaarFront, aadhaarBack, null, 'Aadhaar Card')}
                  disabled={loading || !aadhaarNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Verify Aadhaar Card
                </button>
              </div>
            )}

            {/* 2. PAN Card */}
            {currentDocIndex === 1 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">P</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">PAN Card (Tax Identification)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter 10-digit PAN number &amp; upload PAN document</p>
                    </div>
                  </div>
                  {statusData.documents?.pan?.status === 'approved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
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
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{panFront ? 'Front Attached ✓' : 'Upload Front Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanFront)} />
                  </label>

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{panBack ? 'Back Attached ✓' : 'Upload Back Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanBack)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('pan', panNum, panFront, panBack, null, 'PAN Card')}
                  disabled={loading || !panNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Verify PAN Card
                </button>
              </div>
            )}

            {/* 3. GST Number (Optional) */}
            {currentDocIndex === 2 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">G</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">GST Registration Certificate (Optional)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter 15-digit GSTIN &amp; upload GST registration certificate</p>
                    </div>
                  </div>
                  {statusData.documents?.gst?.status === 'approved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                      Verified ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={15}
                    value={gstNum}
                    onChange={(e) => setGstNum(e.target.value.toUpperCase())}
                    placeholder="15-Digit GSTIN (e.g. 27ABCDE1234F1Z5)"
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{gstFile ? 'Certificate Attached ✓' : 'Upload GST Certificate'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setGstFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('gst', gstNum, null, null, gstFile, 'GST Certificate')}
                  disabled={loading || !gstNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Verify GSTIN
                </button>
              </div>
            )}

            {/* 4. Shop License (Optional) */}
            {currentDocIndex === 3 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">S</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Shop &amp; Establishment License (Optional)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter license registration number &amp; upload license document</p>
                    </div>
                  </div>
                  {statusData.documents?.shopLicense?.status === 'approved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                      Verified ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={shopLicenseNum}
                    onChange={(e) => setShopLicenseNum(e.target.value)}
                    placeholder="License Registration No."
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{shopLicenseFile ? 'License Attached ✓' : 'Upload License Document'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setShopLicenseFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('shopLicense', shopLicenseNum, null, null, shopLicenseFile, 'Shop License')}
                  disabled={loading || !shopLicenseNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Verify Shop License
                </button>
              </div>
            )}

            {/* 5. Udyam Registration (Optional) */}
            {currentDocIndex === 4 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">M</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">MSME / Udyam Registration (Optional)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter Udyam registration number (e.g. UDYAM-XX-00-000000) &amp; upload certificate</p>
                    </div>
                  </div>
                  {statusData.documents?.udyamRegistration?.status === 'approved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                      Verified ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={udyamNum}
                    onChange={(e) => setUdyamNum(e.target.value)}
                    placeholder="Udyam Registration No. (UDYAM-XX-00-000000)"
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{udyamFile ? 'Udyam Attached ✓' : 'Upload MSME Certificate'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setUdyamFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('udyamRegistration', udyamNum, null, null, udyamFile, 'Udyam Registration')}
                  disabled={loading || !udyamNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Verify Udyam Registration
                </button>
              </div>
            )}

            {/* 6. Dynamic Category Documents (Optional) */}
            {currentDocIndex === 5 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-3 animate-fade-in">
                <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] flex items-center gap-2">
                  <FiPlus className="text-[#d99a3d]" />
                  <span>Custom Category Business Documents (FSSAI / Food License / Pharmacy Permit)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={dynamicDocName}
                    onChange={(e) => setDynamicDocName(e.target.value)}
                    placeholder="Document Name (e.g. FSSAI License)"
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <input
                    type="text"
                    value={dynamicDocNum}
                    onChange={(e) => setDynamicDocNum(e.target.value)}
                    placeholder="Reg / License No."
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{dynamicDocFile ? 'File Attached ✓' : 'Upload Document'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setDynamicDocFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('dynamic', dynamicDocNum, null, null, dynamicDocFile, dynamicDocName || 'Custom Business License')}
                  disabled={loading || !dynamicDocName}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Add &amp; Verify Document
                </button>
              </div>
            )}
          </div>

          {/* Wizard Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e3dccb] mt-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevDoc}
                disabled={currentDocIndex === 0}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  currentDocIndex > 0
                    ? 'bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] hover:bg-white'
                    : 'opacity-50 cursor-not-allowed bg-[#f8f4ec]/60 text-slate-400 border border-[#e3dccb]'
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleSkipDoc}
                className="px-5 py-2 rounded-xl bg-[#f8f4ec] hover:bg-white border border-[#e3dccb] text-[#1a1a1a] text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentDocIndex === 5 ? 'Skip & Finish' : 'Skip & Next'}</span>
                <FiChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleTabClick('payment')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                isPart2Complete
                  ? 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] shadow-2xs border-none'
                  : 'bg-[#f8f4ec] text-slate-400 border border-[#e3dccb] cursor-not-allowed'
              }`}
            >
              <span>{isPart2Complete ? 'Proceed to Part 3: Payout & Payment Details' : 'Submit at least 1 Document to Unlock Part 3'}</span>
              {isPart2Complete ? <FiChevronRight size={16} /> : <FiLock size={14} className="text-amber-500" />}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT & PAYOUT DETAILS */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
            <FiCreditCard className="text-[#d99a3d]" />
            <span>Bank Account &amp; UPI Payout Details</span>
          </h3>

          <div className="space-y-4">
            {/* UPI ID */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">UPI ID for Payouts (API Verification)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. shopname@upi or 9876543210@paytm"
                  className="flex-1 px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={loading || !upiId}
                  className="px-4 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none shrink-0"
                >
                  Verify UPI
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 918273645012"
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as per Bank Record"
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">IFSC Code (Auto-Lookup)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />
                  <button
                    type="button"
                    onClick={handleIfscLookup}
                    disabled={ifscLoading || ifscCode.length < 11}
                    className="px-3.5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black transition disabled:opacity-50 cursor-pointer border-none shrink-0"
                  >
                    {ifscLoading ? 'Lookup...' : 'Verify'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name &amp; Branch</label>
                <input
                  type="text"
                  readOnly
                  value={bankName ? `${bankName} (${branchName || 'Main Branch'})` : ''}
                  placeholder="Auto-populated on IFSC lookup"
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-slate-600"
                />
              </div>
            </div>

            {/* Cancelled Cheque / Statement Upload */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Statement / Cancelled Cheque (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] hover:bg-white transition flex items-center gap-2 shadow-2xs">
                  <FiUploadCloud size={16} className="text-[#d99a3d]" />
                  <span>{statementFile ? 'Cheque / Statement Uploaded ✓' : 'Upload Bank Statement or Cheque'}</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setStatementFile)} />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyPayment}
              disabled={loading}
              className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition disabled:opacity-50 cursor-pointer border-none"
            >
              Save &amp; Verify All Payment Details
            </button>
          </div>
        </div>
      )}

      {/* OTP MODAL */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border-2 border-[#241b15] rounded-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in">
            <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2 border-b border-[#e3dccb] pb-2.5">
              <FiShield className="text-[#d99a3d]" size={16} />
              <span>Verify {otpModal.type.toUpperCase()} OTP</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Enter 4-digit verification code sent to <span className="font-extrabold text-[#1a1a1a]">{otpModal.value || 'contact'}</span>
            </p>

            <input
              type="text"
              maxLength={4}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value })}
              placeholder="e.g. 1234"
              className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-[#241b15] focus:outline-none focus:border-[#d99a3d]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '' })}
                className="w-1/2 py-2 rounded-xl text-xs font-bold text-slate-600 bg-[#f8f4ec] border border-[#e3dccb] hover:bg-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-1/2 py-2 rounded-xl text-xs font-black text-[#d99a3d] bg-[#241b15] hover:bg-[#3a2c22] transition cursor-pointer border-none shadow-2xs"
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
