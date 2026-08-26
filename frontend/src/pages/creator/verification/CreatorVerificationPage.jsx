import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiCheck, FiCreditCard, FiFileText, FiPhone, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';
import CreatorVerificationHeader from './components/CreatorVerificationHeader';
import CreatorContactSection from './components/CreatorContactSection';
import CreatorIdentityDocumentsSection from './components/CreatorIdentityDocumentsSection';
import CreatorPayoutDetailsSection from './components/CreatorPayoutDetailsSection';

export default function CreatorVerificationPage() {
  const currentUser = useSelector(selectCurrentUser);
  const { bi } = useLanguage();
  const creatorProfile = currentUser?.creatorProfile || {};
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState({
    completionPercentage: 0,
    tier: creatorProfile.verificationStatus || 'unverified',
    contactVerified: {
      mobile: Boolean(creatorProfile.contactVerified?.mobile || currentUser?.isPhoneVerified),
      whatsapp: Boolean(creatorProfile.contactVerified?.whatsapp),
      email: Boolean(creatorProfile.contactVerified?.email || currentUser?.isEmailVerified)
    },
    documents: creatorProfile.documents || {},
    paymentDetails: creatorProfile.paymentDetails || {}
  });

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/creator/me/verification-status');
      if (response.data?.success || response.success) {
        setStatusData(response.data || response);
      }
    } catch (error) {
      console.error('Failed to load creator verification status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const contactVerified = statusData.contactVerified || {};
  const documents = statusData.documents || {};
  const paymentDetails = statusData.paymentDetails || {};
  const isContactsComplete = contactVerified.mobile && (contactVerified.whatsapp || contactVerified.email);
  const isDocumentsComplete = documents.aadhaar?.status === 'approved' && documents.pan?.status === 'approved';
  const isPayoutComplete = paymentDetails.upiVerified || (paymentDetails.verified && paymentDetails.ifscVerified);

  const tabClass = (tab) =>
    `px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
      activeTab === tab
        ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] shadow-xs'
        : 'bg-white text-slate-600 border border-[#e3dccb] hover:text-[#1a1a1a] hover:bg-[#f8f4ec]'
    }`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen pb-16">
      {/* Top Header Banner matching Creator Profile */}
      <CreatorVerificationHeader statusData={statusData} />

      {/* Quick Navigation Tabs matching Profile Page */}
      <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setActiveTab('documents')} className={tabClass('documents')}>
            <FiFileText size={14} />
            <span>{bi('1. Identity Docs (Aadhaar & PAN)', '1. पहचान दस्तावेज़ (आधार और पैन)')}</span>
            {isDocumentsComplete && <FiCheck className="text-emerald-500 font-black" size={15} />}
          </button>
          <button type="button" onClick={() => setActiveTab('payment')} className={tabClass('payment')}>
            <FiCreditCard size={14} />
            <span>{bi('2. Payout (UPI & Bank)', '2. भुगतान (यूपीआई और बैंक)')}</span>
            {isPayoutComplete && <FiCheck className="text-emerald-500 font-black" size={15} />}
          </button>
          <button type="button" onClick={() => setActiveTab('contacts')} className={tabClass('contacts')}>
            <FiPhone size={14} />
            <span>{bi('3. Contact Channels', '3. संपर्क चैनल')}</span>
            {isContactsComplete && <FiCheck className="text-emerald-500 font-black" size={15} />}
          </button>
        </div>

        <Link
          to="/creator/profile"
          className="px-3.5 py-2 rounded-md text-xs font-bold text-[#241b15] bg-[#f8f4ec] border border-[#e3dccb] hover:bg-[#e3dccb] transition flex items-center gap-1.5"
        >
          <FiUser size={13} />
          <span>{bi('Edit Profile Details', 'प्रोफ़ाइल विवरण संपादित करें')}</span>
        </Link>
      </div>

      {loading && (
        <div className="bg-[#f8f4ec] border border-[#e3dccb] p-3 rounded-md text-xs text-[#241b15] font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d] animate-ping" />
          <span>{bi('Loading verification status...', 'सत्यापन स्थिति लोड हो रही है...')}</span>
        </div>
      )}

      {activeTab === 'documents' && (
        <CreatorIdentityDocumentsSection
          statusData={statusData}
          creatorProfile={creatorProfile}
          onRefresh={fetchStatus}
        />
      )}

      {activeTab === 'payment' && (
        <CreatorPayoutDetailsSection
          statusData={statusData}
          creatorProfile={creatorProfile}
          onRefresh={fetchStatus}
        />
      )}

      {activeTab === 'contacts' && (
        <CreatorContactSection
          statusData={statusData}
          creatorProfile={creatorProfile}
          currentUser={currentUser}
          onRefresh={fetchStatus}
        />
      )}
    </div>
  );
}