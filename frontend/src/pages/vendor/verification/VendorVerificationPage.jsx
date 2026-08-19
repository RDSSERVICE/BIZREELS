import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiShield, FiCheckCircle, FiAlertCircle, FiPhone, FiMessageSquare,
  FiMail, FiGlobe, FiFileText, FiCreditCard, FiUploadCloud, FiCheck,
  FiLock, FiZap, FiStar, FiChevronRight, FiPlus, FiTrash2, FiRefreshCw,
  FiEdit2, FiX, FiInfo
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
    completionPercentage: 0,
    tier: vendorProfile.verificationStatus || 'unverified',
    badgeLabel: 'Unverified',
    badgeColor: '⚪',
    contactVerified: {
      mobile: Boolean(vendorProfile.contactVerified?.mobile || currentUser?.isPhoneVerified),
      whatsapp: Boolean(vendorProfile.contactVerified?.whatsapp),
      email: Boolean(vendorProfile.contactVerified?.email || currentUser?.isEmailVerified),
      website: Boolean(vendorProfile.contactVerified?.website)
    },
    documents: vendorProfile.documents || {},
    paymentDetails: vendorProfile.paymentDetails || {}
  });

  // Edit / Re-verification Modes for verified items
  const [editContactMode, setEditContactMode] = useState({
    mobile: false,
    whatsapp: false,
    email: false,
    website: false,
  });

  const [editDocMode, setEditDocMode] = useState({
    aadhaar: false,
    pan: false,
    gst: false,
    shopLicense: false,
    udyamRegistration: false,
    dynamic: false,
  });

  const [editPaymentMode, setEditPaymentMode] = useState(false);

  // Editable Contact Inputs
  const [mobileInput, setMobileInput] = useState(vendorProfile.mobileNumber || currentUser?.phone || '');
  const [whatsappInput, setWhatsappInput] = useState(vendorProfile.whatsappNumber || vendorProfile.mobileNumber || currentUser?.phone || '');
  const [emailInput, setEmailInput] = useState(vendorProfile.email || currentUser?.email || '');
  const [websiteInput, setWebsiteInput] = useState(vendorProfile.website || '');

  // OTP Modal State for contact verification
  const [otpModal, setOtpModal] = useState({ open: false, type: '', value: '', code: '', reverify: false });

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

  // Aadhaar OKYC States
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarOtpCode, setAadhaarOtpCode] = useState('');
  const [aadhaarTimer, setAadhaarTimer] = useState(0);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  // PAN & GSTIN Verification States
  const [panLoading, setPanLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);

  // Countdown timer for Aadhaar OTP
  useEffect(() => {
    let interval = null;
    if (aadhaarTimer > 0) {
      interval = setInterval(() => {
        setAadhaarTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aadhaarTimer]);

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

  // Direct Website Verification
  const handleVerifyWebsite = async (url) => {
    let targetUrl = (url || websiteInput || vendorProfile.website || '').trim();
    if (!targetUrl) {
      toast.error('❌ Please enter your website URL before verifying.');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    setLoading(true);
    const toastId = toast.loading('Pinging and verifying website URL...');
    try {
      await api.post('/v1/vendors/me/verify-contact', {
        type: 'website',
        value: targetUrl
      });
      toast.success('🟢 Website URL verified successfully!', { id: toastId });
      setStatusData(prev => ({
        ...prev,
        contactVerified: { ...prev.contactVerified, website: true }
      }));
      setWebsiteInput(targetUrl);
      setEditContactMode(prev => ({ ...prev, website: false }));
      await fetchStatus();

      // Update Redux state
      if (currentUser) {
        dispatch(setCredentials({
          user: {
            ...currentUser,
            vendorProfile: {
              ...vendorProfile,
              website: targetUrl,
              contactVerified: {
                ...(vendorProfile.contactVerified || {}),
                website: true
              }
            }
          }
        }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to verify website URL', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Contact Verification OTP trigger
  const handleOpenOtpModal = async (type, value, isReverify = false) => {
    const targetValue = value || (type === 'email' ? (emailInput || vendorProfile.email || currentUser?.email) : type === 'whatsapp' ? (whatsappInput || vendorProfile.whatsappNumber || currentUser?.phone) : (mobileInput || vendorProfile.mobileNumber || currentUser?.phone));
    if (!targetValue) {
      toast.error(`Please enter a valid ${type} before verifying.`);
      return;
    }

    const toastId = toast.loading(`Sending verification code to ${type}: ${targetValue}...`);
    try {
      const res = await api.post('/v1/vendors/me/send-contact-otp', {
        type,
        value: targetValue,
        reverify: isReverify
      });
      const data = res.data || res;
      setOtpModal({ open: true, type, value: targetValue, code: '', reverify: isReverify });
      toast.success(data.message || `Verification code sent to ${targetValue}!`, { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || `Failed to send OTP to ${type}`, { id: toastId });
      setOtpModal({ open: true, type, value: targetValue, code: '', reverify: isReverify });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpModal.code || otpModal.code.trim().length < 4) {
      toast.error('Enter valid verification code (e.g. 6-digit code received via email/SMS)');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(`Verifying ${otpModal.type}...`);
    try {
      await api.post('/v1/vendors/me/verify-contact', {
        type: otpModal.type,
        value: otpModal.value,
        code: otpModal.code.trim()
      });

      toast.success(`🟢 ${otpModal.type.toUpperCase()} verified successfully!`, { id: toastId });
      const currentVerified = { ...statusData.contactVerified, [otpModal.type]: true };
      setStatusData(prev => ({
        ...prev,
        contactVerified: currentVerified
      }));

      // Exit edit mode for this contact type
      setEditContactMode(prev => ({ ...prev, [otpModal.type]: false }));
      setOtpModal({ open: false, type: '', value: '', code: '', reverify: false });
      await fetchStatus();

      // Update Redux state
      if (currentUser) {
        dispatch(setCredentials({
          user: {
            ...currentUser,
            vendorProfile: {
              ...vendorProfile,
              contactVerified: currentVerified,
              ...(otpModal.type === 'mobile' ? { mobileNumber: otpModal.value } : {}),
              ...(otpModal.type === 'whatsapp' ? { whatsappNumber: otpModal.value } : {}),
              ...(otpModal.type === 'email' ? { email: otpModal.value } : {})
            }
          }
        }));
      }

    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to verify contact', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 1. Aadhaar Send OTP Handler (Sandbox OKYC)
  const handleSendAadhaarOtp = async () => {
    const cleanNum = String(aadhaarNum || '').replace(/\D/g, '');
    if (cleanNum.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar Number');
      return;
    }

    setAadhaarLoading(true);
    const toastId = toast.loading('Initiating Aadhaar OTP with Sandbox API...');
    try {
      const res = await api.post('/v1/vendors/me/verification/aadhaar/initiate', {
        aadhaarNumber: cleanNum,
        reverify: editDocMode.aadhaar
      });
      const data = res.data || res;
      if (data.success) {
        setAadhaarOtpSent(true);
        setAadhaarRefId(data.referenceId);
        setAadhaarTimer(60);
        toast.success(data.message || 'OTP sent to mobile linked with Aadhaar!', { id: toastId });
      } else {
        toast.error(data.message || 'Could not send Aadhaar OTP', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to initiate Aadhaar OTP', { id: toastId });
    } finally {
      setAadhaarLoading(false);
    }
  };

  // 1. Aadhaar Verify OTP Handler (Sandbox OKYC)
  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarRefId) {
      toast.error('Please click "Send OTP" first.');
      return;
    }
    if (!aadhaarOtpCode || aadhaarOtpCode.trim().length < 4) {
      toast.error('Please enter the OTP received on your Aadhaar-linked mobile.');
      return;
    }

    setAadhaarLoading(true);
    const toastId = toast.loading('Verifying Aadhaar OTP with Sandbox API...');
    try {
      const res = await api.post('/v1/vendors/me/verification/aadhaar/verify-otp', {
        referenceId: aadhaarRefId,
        otp: aadhaarOtpCode.trim(),
        frontUrl: aadhaarFront,
        backUrl: aadhaarBack
      });
      const data = res.data || res;
      if (data.success) {
        toast.success(`🟢 Aadhaar Verified! Name: ${data.verification?.fullName || 'Verified'}`, { id: toastId });
        setEditDocMode(prev => ({ ...prev, aadhaar: false }));
        await fetchStatus();
      } else {
        toast.error(data.message || 'Aadhaar verification failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Aadhaar verification failed', { id: toastId });
    } finally {
      setAadhaarLoading(false);
    }
  };

  // 2. PAN Instant Verification Handler (Sandbox API)
  const handleVerifyPan = async () => {
    const cleanPan = String(panNum || '').trim().toUpperCase();
    if (!cleanPan || cleanPan.length !== 10) {
      toast.error('Please enter a valid 10-digit PAN Number (e.g. ABCDE1234F)');
      return;
    }

    setPanLoading(true);
    const toastId = toast.loading('Verifying PAN Card with Sandbox API...');
    try {
      const res = await api.post('/v1/vendors/me/verification/pan', {
        panNumber: cleanPan,
        frontUrl: panFront,
        backUrl: panBack
      });
      const data = res.data || res;
      if (data.success) {
        toast.success(`🟢 PAN Verified! Name: ${data.verification?.fullName || 'Taxpayer Validated'}`, { id: toastId });
        setEditDocMode(prev => ({ ...prev, pan: false }));
        await fetchStatus();
      } else {
        toast.error(data.message || 'PAN verification failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'PAN verification failed', { id: toastId });
    } finally {
      setPanLoading(false);
    }
  };

  // 3. GSTIN Instant Verification Handler (Sandbox API)
  const handleVerifyGstin = async () => {
    const cleanGst = String(gstNum || '').trim().toUpperCase();
    if (!cleanGst || cleanGst.length !== 15) {
      toast.error('Please enter a valid 15-digit GSTIN (e.g. 27ABCDE1234F1Z5)');
      return;
    }

    setGstLoading(true);
    const toastId = toast.loading('Verifying GSTIN with Sandbox API...');
    try {
      const res = await api.post('/v1/vendors/me/verification/gstin', {
        gstinNumber: cleanGst,
        fileUrl: gstFile
      });
      const data = res.data || res;
      if (data.success) {
        toast.success(`🟢 GSTIN Verified! Business: ${data.verification?.legalName || data.verification?.tradeName || 'Registered'}`, { id: toastId });
        setEditDocMode(prev => ({ ...prev, gst: false }));
        await fetchStatus();
      } else {
        toast.error(data.message || 'GSTIN verification failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'GSTIN verification failed', { id: toastId });
    } finally {
      setGstLoading(false);
    }
  };

  // Generic Document Submit Handler (Shop License, Udyam, Dynamic)
  const handleVerifyDocument = async (docType, docNumber, frontUrl, backUrl, fileUrl, docName) => {
    setLoading(true);
    const toastId = toast.loading(`Submitting ${docName || docType} for verification...`);
    try {
      await api.post('/v1/vendors/me/verify-document', {
        docType,
        docNumber,
        frontUrl,
        backUrl,
        fileUrl,
        docName
      });

      toast.success(`🟢 ${docName || docType.toUpperCase()} submitted successfully!`, { id: toastId });
      setEditDocMode(prev => ({ ...prev, [docType]: false }));
      await fetchStatus();

      if (docType === 'dynamic') {
        setDynamicDocName('');
        setDynamicDocNum('');
        setDynamicDocFile('');
      }
    } catch (err) {
      toast.error(`Failed to verify ${docType}`, { id: toastId });
    } finally {
      setLoading(false);
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

  // Payment Verification Handler (Sandbox Bank & UPI)
  const handleVerifyPayment = async () => {
    if (!bankAccount || bankAccount.length < 8) {
      toast.error('Please enter a valid Bank Account number.');
      return;
    }
    if (!ifscCode || ifscCode.length < 11) {
      toast.error('Please enter a valid 11-character IFSC code.');
      return;
    }

    setBankLoading(true);
    const toastId = toast.loading('Verifying Bank Account with Sandbox API...');
    try {
      const res = await api.post('/v1/vendors/me/verification/bank', {
        bankAccount,
        accountHolderName,
        ifscCode,
        bankName,
        branchName,
        statementChequeUrl: statementFile
      });

      const data = res.data || res;
      if (data.success) {
        toast.success('🟢 Bank Account verified and saved!', { id: toastId });
        setEditPaymentMode(false);
        await fetchStatus();
      } else {
        toast.error(data.message || 'Bank verification failed', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to verify payment details', { id: toastId });
    } finally {
      setBankLoading(false);
    }
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
    statusData.documents?.gst?.status === 'approved'
  );

  const handleTabClick = (tab) => {
    if (tab === 'documents' && !isPart1Complete) {
      toast.error('🔒 Complete Part 1 (Contact Verification) to unlock Part 2.');
      return;
    }
    if (tab === 'payment' && (!isPart1Complete || !isPart2Complete)) {
      toast.error('🔒 Complete Part 1 & Part 2 first to unlock Part 3.');
      return;
    }
    setActiveTab(tab);
  };

  const badgeInfo = BADGE_DESCRIPTIONS[statusData.tier] || BADGE_DESCRIPTIONS.unverified;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16 font-sans p-2 sm:p-4">
      <AdminPageHeader
        icon={FiShield}
        title="Vendor Verification & Trust Center"
        subtitle="Manage business trust tier, verify contact credentials, identity documents, and settlement accounts with edit options"
      />

      {/* Progress & Badge Status Hero Card */}
      <div className="bg-[#241b15] text-white p-6 rounded-2xl border-2 border-[#241b15] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">{badgeInfo.icon}</span>
            <span className="text-xs font-black text-[#d99a3d] uppercase tracking-widest">
              Current Trust Tier: {badgeInfo.label}
            </span>
          </div>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            Trust &amp; Compliance Center
          </h2>
          <p className="text-xs text-slate-300">
            {badgeInfo.desc}
          </p>
        </div>

        {/* Progress Circular Badge */}
        <div className="flex items-center gap-4 bg-[#1a1410] p-4 rounded-xl border border-[#3a2c22] shrink-0">
          <div className="w-14 h-14 rounded-full bg-[#241b15] border-2 border-[#d99a3d] flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-xs font-black text-[#d99a3d]">{statusData.completionPercentage || 0}%</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase">Ready</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200 block">Verification Progress</span>
            <span className="text-[10px] text-[#d99a3d] font-bold block">
              {isPart1Complete && isPart2Complete ? '3/3 Complete' : isPart1Complete ? '2/3 In Progress' : '1/3 Contacts Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Edit Guidance Note */}
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0">
          <FiEdit2 size={16} />
        </div>
        <div>
          <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wide">
            Edit &amp; Re-Verification Options Enabled
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Aap kisi bhi verified contact (Mobile, WhatsApp, Email, Website), document ya bank account ko "Edit / Change" button par click karke update ya badal sakte hain.
          </p>
        </div>
      </div>

      {/* STEP TABS HEADER */}
      <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] font-black shadow-xs'
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
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] font-black shadow-xs cursor-pointer'
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
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] font-black shadow-xs cursor-pointer'
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CONTACT INFORMATION VERIFICATION
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center gap-2">
            <FiPhone className="text-[#d99a3d]" />
            <span>Contact Channels Verification &amp; Edit Options</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Mobile Number */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Mobile Number</span>
                  <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{mobileInput || vendorProfile.mobileNumber || currentUser?.phone || 'Not set'}</p>
                  {statusData.contactVerified?.mobile && !editContactMode.mobile ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <FiCheckCircle size={12} /> Verified Phone
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                      <FiAlertCircle size={12} /> {editContactMode.mobile ? 'Editing Mobile Number' : 'Unverified'}
                    </span>
                  )}
                </div>

                {statusData.contactVerified?.mobile && !editContactMode.mobile && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-black">
                    Verified ✓
                  </span>
                )}
              </div>

              {editContactMode.mobile ? (
                <div className="space-y-2 pt-2 border-t border-[#e3dccb]">
                  <input
                    type="tel"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    placeholder="Enter new mobile number"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('mobile', mobileInput, true)}
                      className="flex-1 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Send OTP &amp; Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, mobile: false }))}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                  {statusData.contactVerified?.mobile ? (
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, mobile: true }))}
                      className="px-3 py-1.5 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#f8f4ec] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiEdit2 size={12} className="text-[#d99a3d]" />
                      <span>Edit / Change Mobile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('mobile', mobileInput || vendorProfile.mobileNumber || currentUser?.phone)}
                      className="px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Verify Mobile OTP
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. WhatsApp Number */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">WhatsApp Number</span>
                  <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{whatsappInput || vendorProfile.whatsappNumber || vendorProfile.mobileNumber || 'Not set'}</p>
                  {statusData.contactVerified?.whatsapp && !editContactMode.whatsapp ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <FiCheckCircle size={12} /> Verified WhatsApp
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                      <FiAlertCircle size={12} /> {editContactMode.whatsapp ? 'Editing WhatsApp' : 'Unverified'}
                    </span>
                  )}
                </div>

                {statusData.contactVerified?.whatsapp && !editContactMode.whatsapp && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-black">
                    Verified ✓
                  </span>
                )}
              </div>

              {editContactMode.whatsapp ? (
                <div className="space-y-2 pt-2 border-t border-[#e3dccb]">
                  <input
                    type="tel"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    placeholder="Enter new WhatsApp number"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('whatsapp', whatsappInput, true)}
                      className="flex-1 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Send OTP &amp; Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, whatsapp: false }))}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                  {statusData.contactVerified?.whatsapp ? (
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, whatsapp: true }))}
                      className="px-3 py-1.5 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#f8f4ec] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiEdit2 size={12} className="text-[#d99a3d]" />
                      <span>Edit / Change WhatsApp</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('whatsapp', whatsappInput || vendorProfile.whatsappNumber || vendorProfile.mobileNumber)}
                      className="px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Verify WhatsApp OTP
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Email Address */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Email Address</span>
                  <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{emailInput || vendorProfile.email || currentUser?.email || 'Not set'}</p>
                  {statusData.contactVerified?.email && !editContactMode.email ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <FiCheckCircle size={12} /> Verified Email
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                      <FiAlertCircle size={12} /> {editContactMode.email ? 'Editing Email Address' : 'Unverified'}
                    </span>
                  )}
                </div>

                {statusData.contactVerified?.email && !editContactMode.email && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-black">
                    Verified ✓
                  </span>
                )}
              </div>

              {editContactMode.email ? (
                <div className="space-y-2 pt-2 border-t border-[#e3dccb]">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter new email address"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('email', emailInput, true)}
                      className="flex-1 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Send OTP &amp; Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, email: false }))}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                  {statusData.contactVerified?.email ? (
                    <button
                      type="button"
                      onClick={() => setEditContactMode(prev => ({ ...prev, email: true }))}
                      className="px-3 py-1.5 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#f8f4ec] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiEdit2 size={12} className="text-[#d99a3d]" />
                      <span>Edit / Change Email</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenOtpModal('email', emailInput || vendorProfile.email || currentUser?.email)}
                      className="px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs"
                    >
                      Verify Email OTP
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. Website URL */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Business Website</span>
                  <p className="text-xs font-black text-[#1a1a1a] mt-0.5">{websiteInput || vendorProfile.website || 'Not set'}</p>
                  {statusData.contactVerified?.website && !editContactMode.website ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <FiCheckCircle size={12} /> Verified URL
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Enter URL &amp; ping to verify</span>
                  )}
                </div>

                {statusData.contactVerified?.website && !editContactMode.website && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-black">
                    Verified ✓
                  </span>
                )}
              </div>

              {editContactMode.website || !statusData.contactVerified?.website ? (
                <div className="space-y-2 pt-2 border-t border-[#e3dccb]">
                  <div className="relative">
                    <FiGlobe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="url"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="e.g. https://yourbusiness.com"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyWebsite(websiteInput)}
                      disabled={loading || !websiteInput?.trim()}
                      className="flex-1 py-1.5 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black hover:bg-[#3a2c22] cursor-pointer border-none shadow-2xs disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Ping & Verify Website'}
                    </button>
                    {statusData.contactVerified?.website && (
                      <button
                        type="button"
                        onClick={() => setEditContactMode(prev => ({ ...prev, website: false }))}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                  <button
                    type="button"
                    onClick={() => setEditContactMode(prev => ({ ...prev, website: true }))}
                    className="px-3 py-1.5 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#f8f4ec] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiEdit2 size={12} className="text-[#d99a3d]" />
                    <span>Edit / Change URL</span>
                  </button>
                </div>
              )}
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DOCUMENTS VERIFICATION (WITH EDIT / RE-VERIFY)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide border-b border-[#e3dccb] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="text-[#d99a3d]" />
              <span>Government Identity &amp; Compliance Documents</span>
            </div>
            <span className="text-xs text-[#d99a3d] font-black uppercase">Instant API Verification &amp; Edit Options</span>
          </h3>

          {/* Step indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 border-b border-[#e3dccb] pb-4 mb-4">
            {docsSequence.map((step, idx) => {
              const isCompleted = step.key === 'dynamic'
                ? (statusData.documents?.dynamicDocs && statusData.documents.dynamicDocs.length > 0)
                : (statusData.documents?.[step.key]?.status === 'approved' || statusData.documents?.[step.key]?.verified);
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">A</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Aadhaar Card (UIDAI e-KYC OTP Verification)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Verify in real-time via 12-digit Aadhaar OTP or upload document images</p>
                    </div>
                  </div>
                  {(statusData.documents?.aadhaar?.status === 'approved' || statusData.documents?.aadhaar?.verified) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                        Verified ✓ {statusData.documents.aadhaar.fullName ? `(${statusData.documents.aadhaar.fullName})` : ''}
                      </span>
                      {!editDocMode.aadhaar ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditDocMode(prev => ({ ...prev, aadhaar: true }));
                            setAadhaarOtpSent(false);
                            setAadhaarOtpCode('');
                          }}
                          className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 size={12} className="text-[#d99a3d]" />
                          <span>Re-verify / Change Aadhaar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, aadhaar: false }))}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Aadhaar OTP Flow Section */}
                <div className="bg-white p-4 rounded-xl border border-[#e3dccb] space-y-3">
                  <span className="text-[10px] font-black text-[#d99a3d] uppercase tracking-wider block">Recommended: Instant Real-Time UIDAI OTP Verification</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      maxLength={12}
                      value={aadhaarNum}
                      onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ''))}
                      placeholder="12-Digit Aadhaar Number"
                      disabled={aadhaarLoading || (statusData.documents?.aadhaar?.status === 'approved' && !editDocMode.aadhaar)}
                      className="px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />

                    <button
                      type="button"
                      onClick={handleSendAadhaarOtp}
                      disabled={aadhaarLoading || !aadhaarNum || aadhaarNum.length !== 12 || aadhaarTimer > 0 || (statusData.documents?.aadhaar?.status === 'approved' && !editDocMode.aadhaar)}
                      className="py-2.5 px-4 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                    >
                      {aadhaarLoading && !aadhaarOtpSent ? 'Sending Live OTP...' : aadhaarTimer > 0 ? `Resend in ${aadhaarTimer}s` : (aadhaarOtpSent ? 'Resend OTP' : 'Send Aadhaar OTP')}
                    </button>

                    {aadhaarOtpSent && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={aadhaarOtpCode}
                          onChange={(e) => setAadhaarOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="w-1/2 px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyAadhaarOtp}
                          disabled={aadhaarLoading || !aadhaarOtpCode}
                          className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                        >
                          {aadhaarLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verified Aadhaar Details Badge */}
                {statusData.documents?.aadhaar && (statusData.documents.aadhaar.status === 'approved' || statusData.documents.aadhaar.verified) && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                        <FiCheckCircle className="text-emerald-600" size={16} /> Aadhaar Record Verified (UIDAI Official e-KYC)
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">
                        Active Gov Record
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      {statusData.documents.aadhaar.photo && (
                        <div className="shrink-0">
                          <img
                            src={statusData.documents.aadhaar.photo.startsWith('data:') || statusData.documents.aadhaar.photo.startsWith('http') ? statusData.documents.aadhaar.photo : `data:image/jpeg;base64,${statusData.documents.aadhaar.photo}`}
                            alt="Aadhaar Photo"
                            className="w-14 h-16 object-cover rounded-lg border border-emerald-300 bg-white shadow-2xs"
                          />
                          <span className="text-[8px] text-center block text-emerald-700 font-bold mt-0.5">UIDAI Photo</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Full Name (UIDAI)</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.aadhaar.fullName || 'Verified Citizen'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Masked Aadhaar</span>
                          <strong className="text-slate-900 text-xs font-mono font-bold">{statusData.documents.aadhaar.maskedNumber || 'XXXX XXXX ****'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Gender / DOB</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.aadhaar.gender || '—'} {statusData.documents.aadhaar.dob ? `(${statusData.documents.aadhaar.dob})` : ''}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Care Of (Father/Husband)</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.aadhaar.careOf || '—'}</strong>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Official Registered Address</span>
                          <span className="text-slate-800 text-xs font-semibold leading-tight block">
                            {statusData.documents.aadhaar.fullAddress || [statusData.documents.aadhaar.city, statusData.documents.aadhaar.district, statusData.documents.aadhaar.state, statusData.documents.aadhaar.pincode].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference ID</span>
                          <strong className="text-slate-900 text-[10px] font-mono truncate block">{statusData.documents.aadhaar.referenceId || 'OKYC_VERIFIED'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Images Upload Section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Document Photos (Front &amp; Back)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('aadhaar', aadhaarNum, aadhaarFront, aadhaarBack, null, 'Aadhaar Card')}
                  disabled={loading || !aadhaarNum || (statusData.documents?.aadhaar?.status === 'approved' && !editDocMode.aadhaar)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-2xs transition border-none ${
                    statusData.documents?.aadhaar?.status === 'approved' && !editDocMode.aadhaar
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                      : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {statusData.documents?.aadhaar?.status === 'approved' && !editDocMode.aadhaar ? 'Aadhaar Verified ✓' : 'Save & Submit Aadhaar Details'}
                </button>
              </div>
            )}

            {/* 2. PAN Card */}
            {currentDocIndex === 1 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">P</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">PAN Card (Income Tax Instant Verification)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter 10-digit PAN number for real-time Income Tax record verification</p>
                    </div>
                  </div>
                  {(statusData.documents?.pan?.status === 'approved' || statusData.documents?.pan?.verified) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                        Verified ✓ {statusData.documents.pan.fullName ? `(${statusData.documents.pan.fullName})` : ''}
                      </span>
                      {!editDocMode.pan ? (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, pan: true }))}
                          className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 size={12} className="text-[#d99a3d]" />
                          <span>Re-verify / Change PAN</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, pan: false }))}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    maxLength={10}
                    value={panNum}
                    onChange={(e) => setPanNum(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    disabled={panLoading || (statusData.documents?.pan?.status === 'approved' && !editDocMode.pan)}
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

                {/* Verified PAN Details Badge */}
                {statusData.documents?.pan && (statusData.documents.pan.status === 'approved' || statusData.documents.pan.verified) && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                        <FiCheckCircle className="text-emerald-600" size={16} /> Income Tax Record Verified (NSDL / ITD Official)
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">
                        Active Taxpayer
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Taxpayer Name</span>
                        <strong className="text-slate-900 text-xs font-bold">{statusData.documents.pan.fullName || 'Taxpayer Validated'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">PAN Number</span>
                        <strong className="text-slate-900 text-xs font-mono font-bold uppercase">{statusData.documents.pan.docNumber || panNum}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Category</span>
                        <strong className="text-slate-900 text-xs font-bold">{statusData.documents.pan.category || 'Individual'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Aadhaar Link Status</span>
                        <strong className="text-emerald-800 text-xs font-bold">{statusData.documents.pan.aadhaarLinked || 'Linked / Active'}</strong>
                      </div>
                      {statusData.documents.pan.dob && (
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">DOB / Incorp Date</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.pan.dob}</strong>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference ID</span>
                        <strong className="text-slate-900 text-[10px] font-mono truncate block">{statusData.documents.pan.referenceId || 'PAN_VALIDATED'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyPan}
                  disabled={panLoading || !panNum || panNum.length !== 10 || (statusData.documents?.pan?.status === 'approved' && !editDocMode.pan)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-2xs transition border-none ${
                    statusData.documents?.pan?.status === 'approved' && !editDocMode.pan
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                      : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {statusData.documents?.pan?.status === 'approved' && !editDocMode.pan ? 'PAN Verified ✓' : panLoading ? 'Verifying with Income Tax API...' : 'Verify PAN Card'}
                </button>
              </div>
            )}

            {/* 3. GST Number */}
            {currentDocIndex === 2 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">G</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">GST Registration Certificate (GSTN Verification)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Enter 15-digit GSTIN to auto-fetch registered business name</p>
                    </div>
                  </div>
                  {(statusData.documents?.gst?.status === 'approved' || statusData.documents?.gst?.verified) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                        Verified ✓
                      </span>
                      {!editDocMode.gst ? (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, gst: true }))}
                          className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 size={12} className="text-[#d99a3d]" />
                          <span>Re-verify / Change GSTIN</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, gst: false }))}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={15}
                    value={gstNum}
                    onChange={(e) => setGstNum(e.target.value.toUpperCase())}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    disabled={gstLoading || (statusData.documents?.gst?.status === 'approved' && !editDocMode.gst)}
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{gstFile ? 'Certificate Uploaded ✓' : 'Upload GST Certificate (PDF/Image)'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setGstFile)} />
                  </label>
                </div>

                {/* Verified GSTIN Details Badge */}
                {statusData.documents?.gst && (statusData.documents.gst.status === 'approved' || statusData.documents.gst.verified) && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                        <FiCheckCircle className="text-emerald-600" size={16} /> GST Record Verified (GSTN Official Record)
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">
                        Active Tax Entity
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Trade Name</span>
                        <strong className="text-slate-900 text-xs font-bold">{statusData.documents.gst.tradeName || statusData.documents.gst.legalName || 'Registered Business'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Legal Business Name</span>
                        <strong className="text-slate-900 text-xs font-bold">{statusData.documents.gst.legalName || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">GSTIN Number</span>
                        <strong className="text-slate-900 text-xs font-mono font-bold uppercase">{statusData.documents.gst.docNumber || gstNum}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">GST Status</span>
                        <strong className="text-emerald-800 text-xs font-bold">{statusData.documents.gst.gstStatus || 'Active'}</strong>
                      </div>
                      {statusData.documents.gst.constitutionOfBusiness && (
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Constitution</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.gst.constitutionOfBusiness}</strong>
                        </div>
                      )}
                      {statusData.documents.gst.taxpayerType && (
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Taxpayer Type</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.gst.taxpayerType}</strong>
                        </div>
                      )}
                      {statusData.documents.gst.dateOfRegistration && (
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reg. Date</span>
                          <strong className="text-slate-900 text-xs font-bold">{statusData.documents.gst.dateOfRegistration}</strong>
                        </div>
                      )}
                      {statusData.documents.gst.fullAddress && (
                        <div className="col-span-2 sm:col-span-4">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Principal Place of Business</span>
                          <span className="text-slate-800 text-xs font-semibold leading-tight block">{statusData.documents.gst.fullAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyGstin}
                  disabled={gstLoading || !gstNum || gstNum.length !== 15 || (statusData.documents?.gst?.status === 'approved' && !editDocMode.gst)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-2xs transition border-none ${
                    statusData.documents?.gst?.status === 'approved' && !editDocMode.gst
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                      : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {statusData.documents?.gst?.status === 'approved' && !editDocMode.gst ? 'GSTIN Verified ✓' : gstLoading ? 'Verifying with GSTN API...' : 'Verify GSTIN Certificate'}
                </button>
              </div>
            )}

            {/* 4. Shop License */}
            {currentDocIndex === 3 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">S</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Shop &amp; Establishment Act License</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Municipal Corporation / Nagar Nigam Trade License registration</p>
                    </div>
                  </div>
                  {(statusData.documents?.shopLicense?.status === 'approved' || statusData.documents?.shopLicense) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                        Verified / Submitted ✓
                      </span>
                      {!editDocMode.shopLicense ? (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, shopLicense: true }))}
                          className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 size={12} className="text-[#d99a3d]" />
                          <span>Edit License</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, shopLicense: false }))}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={shopLicenseNum}
                    onChange={(e) => setShopLicenseNum(e.target.value)}
                    placeholder="License Registration Number"
                    disabled={loading || (statusData.documents?.shopLicense?.status === 'approved' && !editDocMode.shopLicense)}
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{shopLicenseFile ? 'License Uploaded ✓' : 'Upload License Copy'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setShopLicenseFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('shopLicense', shopLicenseNum, null, null, shopLicenseFile, 'Shop License')}
                  disabled={loading || !shopLicenseNum || (statusData.documents?.shopLicense?.status === 'approved' && !editDocMode.shopLicense)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-2xs transition border-none ${
                    statusData.documents?.shopLicense?.status === 'approved' && !editDocMode.shopLicense
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                      : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {statusData.documents?.shopLicense?.status === 'approved' && !editDocMode.shopLicense ? 'License Verified ✓' : 'Save & Submit Shop License'}
                </button>
              </div>
            )}

            {/* 5. MSME / Udyam */}
            {currentDocIndex === 4 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">U</span>
                    <div>
                      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Udyam / MSME Registration Certificate</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Ministry of Micro, Small and Medium Enterprises enterprise number</p>
                    </div>
                  </div>
                  {(statusData.documents?.udyamRegistration?.status === 'approved' || statusData.documents?.udyamRegistration) && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                        Verified / Submitted ✓
                      </span>
                      {!editDocMode.udyamRegistration ? (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, udyamRegistration: true }))}
                          className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 size={12} className="text-[#d99a3d]" />
                          <span>Edit Udyam</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditDocMode(prev => ({ ...prev, udyamRegistration: false }))}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={udyamNum}
                    onChange={(e) => setUdyamNum(e.target.value.toUpperCase())}
                    placeholder="e.g. UDYAM-XX-00-0000000"
                    disabled={loading || (statusData.documents?.udyamRegistration?.status === 'approved' && !editDocMode.udyamRegistration)}
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{udyamFile ? 'Certificate Uploaded ✓' : 'Upload Udyam Certificate'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setUdyamFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('udyamRegistration', udyamNum, null, null, udyamFile, 'MSME Udyam')}
                  disabled={loading || !udyamNum || (statusData.documents?.udyamRegistration?.status === 'approved' && !editDocMode.udyamRegistration)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-2xs transition border-none ${
                    statusData.documents?.udyamRegistration?.status === 'approved' && !editDocMode.udyamRegistration
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                      : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {statusData.documents?.udyamRegistration?.status === 'approved' && !editDocMode.udyamRegistration ? 'Udyam Verified ✓' : 'Save & Submit Udyam Certificate'}
                </button>
              </div>
            )}

            {/* 6. Custom Document */}
            {currentDocIndex === 5 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-4 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black shadow-2xs">C</span>
                  <div>
                    <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a]">Custom Compliance / Partnership Document</h4>
                    <p className="text-[10px] text-slate-400 font-bold">FSSAI License, Partnership Deed, Franchise Agreement, ISO Certificate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={dynamicDocName}
                    onChange={(e) => setDynamicDocName(e.target.value)}
                    placeholder="Document Name (e.g. FSSAI License)"
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <input
                    type="text"
                    value={dynamicDocNum}
                    onChange={(e) => setDynamicDocNum(e.target.value)}
                    placeholder="Registration / Serial Number"
                    className="px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />

                  <label className="cursor-pointer px-3.5 py-2.5 bg-white border border-dashed border-[#e3dccb] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-[#241b15] transition">
                    <FiUploadCloud size={14} className="text-[#d99a3d]" />
                    <span>{dynamicDocFile ? 'File Attached ✓' : 'Upload Document'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, setDynamicDocFile)} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDocument('dynamic', dynamicDocNum, null, null, dynamicDocFile, dynamicDocName)}
                  disabled={loading || !dynamicDocName || !dynamicDocNum}
                  className="w-full py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-2xs transition disabled:opacity-50 cursor-pointer border-none"
                >
                  Save &amp; Attach Custom Document
                </button>
              </div>
            )}

          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e3dccb]">
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className="px-4 py-2.5 bg-[#f8f4ec] text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer border border-[#e3dccb]"
            >
              ← Back to Contacts
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('payment')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                isPart2Complete
                  ? 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] shadow-2xs border-none'
                  : 'bg-[#f8f4ec] text-slate-400 border border-[#e3dccb] cursor-not-allowed'
              }`}
            >
              <span>{isPart2Complete ? 'Proceed to Part 3: Payout Details' : 'Verify at least 1 document to continue'}</span>
              {isPart2Complete ? <FiChevronRight size={16} /> : <FiLock size={14} className="text-amber-500" />}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: PAYMENT & SETTLEMENT DETAILS (WITH EDIT OPTION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5 font-sans">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#e3dccb] pb-3">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
              <FiCreditCard className="text-[#d99a3d]" />
              <span>Settlement Account &amp; Payout Details</span>
            </h3>

            {(statusData.paymentDetails?.status === 'approved' || statusData.paymentDetails?.verified) && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">
                  Verified ✓
                </span>
                {!editPaymentMode ? (
                  <button
                    type="button"
                    onClick={() => setEditPaymentMode(true)}
                    className="px-2.5 py-1 bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FiEdit2 size={12} className="text-[#d99a3d]" />
                    <span>Edit / Change Bank Account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditPaymentMode(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer border-none"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            
            {/* Bank Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">IFSC Code *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    disabled={bankLoading || (statusData.paymentDetails?.status === 'approved' && !editPaymentMode)}
                    className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-mono font-black text-[#1a1a1a] uppercase focus:outline-none focus:border-[#d99a3d]"
                  />
                  <button
                    type="button"
                    onClick={handleIfscLookup}
                    disabled={ifscLoading || ifscCode.length < 11 || (statusData.paymentDetails?.status === 'approved' && !editPaymentMode)}
                    className="py-2.5 px-3 bg-[#241b15] text-[#d99a3d] text-xs font-black rounded-xl hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer border-none whitespace-nowrap shadow-2xs"
                  >
                    {ifscLoading ? 'Checking...' : 'Auto-Fetch'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Account Number *</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 50100234567890"
                  disabled={bankLoading || (statusData.paymentDetails?.status === 'approved' && !editPaymentMode)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-mono font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Holder Name *</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As printed on Passbook / Cheque"
                  disabled={bankLoading || (statusData.paymentDetails?.status === 'approved' && !editPaymentMode)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            </div>

            {/* Bank Name and Branch Auto Display */}
            {(bankName || branchName) && (
              <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Bank &amp; Branch</span>
                  <span className="font-bold text-[#1a1a1a]">{bankName} {branchName ? `(${branchName})` : ''}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black border border-emerald-300">
                  IFSC Verified ✓
                </span>
              </div>
            )}

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

            {/* Verified Bank Details Badge */}
            {statusData.paymentDetails && (statusData.paymentDetails.status === 'approved' || statusData.paymentDetails.verified) && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                    <FiCheckCircle className="text-emerald-600" size={16} /> Bank Account Verified (NPCI Penny Drop)
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">
                    Active Settlement Account
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Account Holder</span>
                    <strong className="text-slate-900 text-xs font-bold">{statusData.paymentDetails.verifiedAccountName || statusData.paymentDetails.accountHolderName || accountHolderName || 'Verified Holder'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Bank &amp; Branch</span>
                    <strong className="text-slate-900 text-xs font-bold">{statusData.paymentDetails.bankName || bankName || 'Bank'} {statusData.paymentDetails.branchName || branchName ? `(${statusData.paymentDetails.branchName || branchName})` : ''}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">IFSC Code</span>
                    <strong className="text-slate-900 text-xs font-mono font-bold uppercase">{statusData.paymentDetails.ifscCode || ifscCode}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Bank Account No</span>
                    <strong className="text-slate-900 text-xs font-mono font-bold">{statusData.paymentDetails.maskedAccount || statusData.paymentDetails.bankAccount || bankAccount}</strong>
                  </div>
                  {(statusData.paymentDetails.city || statusData.paymentDetails.state) && (
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Branch Location</span>
                      <strong className="text-slate-900 text-xs font-bold">{[statusData.paymentDetails.city, statusData.paymentDetails.state].filter(Boolean).join(', ')}</strong>
                    </div>
                  )}
                  {statusData.paymentDetails.referenceId && (
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference ID</span>
                      <strong className="text-slate-900 text-[10px] font-mono truncate block">{statusData.paymentDetails.referenceId}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyPayment}
              disabled={bankLoading || !bankAccount || !ifscCode || (statusData.paymentDetails?.status === 'approved' && !editPaymentMode)}
              className={`w-full py-3.5 rounded-xl text-xs font-black shadow-xs transition border-none ${
                statusData.paymentDetails?.status === 'approved' && !editPaymentMode
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90'
                  : 'bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 cursor-pointer'
              }`}
            >
              {statusData.paymentDetails?.status === 'approved' && !editPaymentMode ? 'Bank Account Verified ✓' : bankLoading ? 'Verifying with Sandbox API...' : 'Verify & Save Bank Account (Sandbox API)'}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OTP MODAL FOR CONTACT VERIFICATION & UPDATES
      ───────────────────────────────────────────────────────────── */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border-2 border-[#241b15] rounded-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in">
            <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2 border-b border-[#e3dccb] pb-2.5">
              <FiShield className="text-[#d99a3d]" size={16} />
              <span>Verify {otpModal.type.toUpperCase()} OTP</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Enter verification code sent to <span className="font-extrabold text-[#1a1a1a]">{otpModal.value || 'contact'}</span>
            </p>

            <input
              type="text"
              maxLength={6}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 123456"
              className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-[#241b15] focus:outline-none focus:border-[#d99a3d]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModal({ open: false, type: '', value: '', code: '', reverify: false })}
                className="w-1/2 py-2 rounded-xl text-xs font-bold text-slate-600 bg-[#f8f4ec] border border-[#e3dccb] hover:bg-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpModal.code.length < 4}
                className="w-1/2 py-2 rounded-xl text-xs font-black text-[#d99a3d] bg-[#241b15] hover:bg-[#3a2c22] transition cursor-pointer border-none shadow-2xs disabled:opacity-50"
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
