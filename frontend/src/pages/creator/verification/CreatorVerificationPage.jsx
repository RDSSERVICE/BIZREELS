import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiCheck, FiCreditCard, FiFileText, FiPhone } from 'react-icons/fi';
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

  const tabClass = (tab) => `px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === tab
    ? 'bg-brand-purple text-white shadow-md'
    : 'glass text-text-secondary hover:text-text-primary border border-transparent hover:border-border'
    }`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      <CreatorVerificationHeader statusData={statusData} />

      <div className="flex items-center gap-2 border-b border-border/80 pb-1 overflow-x-auto scrollbar-hide">
        <button type="button" onClick={() => setActiveTab('contacts')} className={tabClass('contacts')}>
          <FiPhone size={14} /> {bi('Contact Channels Verification', 'संपर्क चैनल सत्यापन')}
          {isContactsComplete && <FiCheck className="text-emerald-500" size={14} />}
        </button>
        <button type="button" onClick={() => setActiveTab('documents')} className={tabClass('documents')}>
          <FiFileText size={14} /> {bi('Identity Documents (Aadhaar & PAN)', 'पहचान दस्तावेज़ (आधार और पैन)')}
          {isDocumentsComplete && <FiCheck className="text-emerald-500" size={14} />}
        </button>
        <button type="button" onClick={() => setActiveTab('payment')} className={tabClass('payment')}>
          <FiCreditCard size={14} /> {bi('UPI & Bank Payout Details', 'यूपीआई और बैंक भुगतान विवरण')}
          {isPayoutComplete && <FiCheck className="text-emerald-500" size={14} />}
        </button>
      </div>

      {loading && <p className="text-sm text-text-secondary">{bi('Loading verification status...', 'सत्यापन स्थिति लोड हो रही है...')}</p>}

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