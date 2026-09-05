import React, { useState } from 'react';
import {
  FiFileText, FiShield, FiCheckCircle, FiAlertCircle, FiUploadCloud,
  FiUser, FiCalendar, FiMapPin, FiCheck, FiRefreshCw, FiClock, FiXCircle, FiSend
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

export default function CreatorIdentityDocumentsSection({
  statusData,
  creatorProfile,
  onRefresh
}) {
  const { bi } = useLanguage();
  const documents = statusData?.documents || creatorProfile?.documents || {};
  const aadhaarDoc = documents.aadhaar || {};
  const panDoc = documents.pan || {};

  const aadhaarStatus = aadhaarDoc.status || 'unverified';
  const panStatus = panDoc.status || 'unverified';

  const isAadhaarApproved = aadhaarStatus === 'approved';
  const isAadhaarPending = aadhaarStatus === 'pending';
  const isAadhaarRejected = aadhaarStatus === 'rejected' || aadhaarStatus === 'failed';
  const aadhaarRejectionReason = aadhaarDoc.rejectionReason || aadhaarDoc.failureReason;

  const isPanApproved = panStatus === 'approved';
  const isPanPending = panStatus === 'pending';
  const isPanRejected = panStatus === 'rejected' || panStatus === 'failed';
  const panRejectionReason = panDoc.rejectionReason || panDoc.failureReason;

  // Aadhaar Form State
  const [aadhaarNum, setAadhaarNum] = useState(aadhaarDoc.docNumber || aadhaarDoc.maskedNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(aadhaarDoc.frontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(aadhaarDoc.backUrl || '');
  const [aadhaarOtpStage, setAadhaarOtpStage] = useState('input'); // 'input' | 'otp'
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  // PAN Form State
  const [panNum, setPanNum] = useState(panDoc.docNumber || panDoc.maskedNumber || '');
  const [panFront, setPanFront] = useState(panDoc.frontUrl || '');
  const [panBack, setPanBack] = useState(panDoc.backUrl || '');
  const [panLoading, setPanLoading] = useState(false);

  // Image Upload Helper
  const handleFileUpload = async (e, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(bi('Uploading document image...', 'दस्तावेज़ की छवि अपलोड हो रही है...'));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url || res.url;
      if (!url) throw new Error('The upload did not return a document URL.');

      setUrlState(url);
      toast.success(bi('Document uploaded successfully!', 'दस्तावेज़ सफलतापूर्वक अपलोड हो गया!'), { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('Document upload failed. Please try again.', 'दस्तावेज़ अपलोड विफल रहा। कृपया फिर प्रयास करें।'), { id: toastId });
    }
  };

  // Manual Document Submission Handler
  const handleManualSubmitDocument = async (docType, docNumber, frontUrl, backUrl) => {
    if (!docNumber && !frontUrl && !backUrl) {
      toast.error(bi('Please enter a document number or attach document images', 'कृपया एक दस्तावेज़ नंबर दर्ज करें या दस्तावेज़ की छवियां संलग्न करें'));
      return;
    }
    const toastId = toast.loading(bi('Submitting document for verification review...', 'सत्यापन समीक्षा के लिए दस्तावेज़ जमा किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verify-document', {
        docType,
        docNumber,
        frontUrl,
        backUrl,
        manualSubmission: true
      });
      if (res.data?.success) {
        toast.success(res.data.message || bi('Document submitted successfully for Admin review!', 'व्यवस्थापक समीक्षा के लिए दस्तावेज़ सफलतापूर्वक जमा कर दिया गया!'), { id: toastId });
        if (typeof onRefresh === 'function') await onRefresh();
      } else {
        throw new Error(res.data?.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('Failed to submit document', 'दस्तावेज़ जमा करना विफल रहा'), { id: toastId });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. AADHAAR OKYC FLOW (SANDBOX API)
  // ─────────────────────────────────────────────────────────────
  const handleInitiateAadhaar = async () => {
    const cleanAadhaar = String(aadhaarNum).replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      toast.error(bi('Please enter a valid 12-digit Aadhaar Number', 'कृपया 12 अंकों का मान्य आधार नंबर दर्ज करें'));
      return;
    }

    setAadhaarLoading(true);
    const toastId = toast.loading(bi('Initiating Aadhaar OTP via Sandbox UIDAI API...', 'सैंडबॉक्स यूआईडीएआई एपीआई से आधार ओटीपी शुरू किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verification/aadhaar/initiate', {
        aadhaarNumber: cleanAadhaar,
        reverify: true
      });

      if (res.data?.success) {
        setAadhaarRefId(res.data.referenceId);
        setAadhaarOtpStage('otp');
        toast.success(res.data.message || bi('OTP sent to your Aadhaar-registered mobile number!', 'आपके आधार-पंजीकृत मोबाइल नंबर पर ओटीपी भेज दिया गया है!'), { id: toastId });
      } else {
        throw new Error(res.data?.message || 'Failed to initiate OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('Failed to initiate Aadhaar OTP', 'आधार ओटीपी शुरू करना विफल रहा'), { id: toastId });
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarRefId || !aadhaarOtp || aadhaarOtp.length < 4) {
      toast.error(bi('Please enter the 6-digit Aadhaar OTP code', 'कृपया 6 अंकों का आधार ओटीपी कोड दर्ज करें'));
      return;
    }

    setAadhaarLoading(true);
    const toastId = toast.loading(bi('Verifying Aadhaar OTP with Sandbox API...', 'सैंडबॉक्स एपीआई से आधार ओटीपी सत्यापित किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verification/aadhaar/verify-otp', {
        referenceId: aadhaarRefId,
        otp: aadhaarOtp.trim(),
        frontUrl: aadhaarFront,
        backUrl: aadhaarBack
      });

      if (res.data?.success) {
        toast.success(res.data.message || '🟢 Aadhaar verified successfully!', { id: toastId });
        setAadhaarOtpStage('input');
        setAadhaarOtp('');
        if (typeof onRefresh === 'function') await onRefresh();
      } else {
        throw new Error(res.data?.message || 'Verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('Invalid or expired Aadhaar OTP', 'अमान्य या समाप्त आधार ओटीपी'), { id: toastId });
    } finally {
      setAadhaarLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. PAN VERIFICATION FLOW (SANDBOX API)
  // ─────────────────────────────────────────────────────────────
  const handleVerifyPan = async () => {
    const cleanPan = String(panNum || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      toast.error('Enter a valid 10-character PAN number (e.g. ABCDE1234F)');
      return;
    }

    setPanLoading(true);
    const toastId = toast.loading(bi('Verifying PAN with Income Tax Dept via Sandbox API...', 'सैंडबॉक्स एपीआई से आयकर विभाग में पैन सत्यापित किया जा रहा है...'));
    try {
      const res = await api.post('/v1/creator/me/verification/pan', {
        panNumber: cleanPan,
        frontUrl: panFront,
        backUrl: panBack
      });

      if (res.data?.success) {
        toast.success(res.data.message || '🟢 PAN Card verified successfully!', { id: toastId });
        if (typeof onRefresh === 'function') await onRefresh();
      } else {
        throw new Error(res.data?.message || 'PAN validation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || bi('PAN Card verification failed', 'पैन कार्ड सत्यापन विफल रहा'), { id: toastId });
    } finally {
      setPanLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ══════════════════════════════════════════════════════════
          1. AADHAAR CARD OKYC SECTION
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-[#e3dccb] rounded-md shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black">
              1
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#241b15]">
                {bi('Aadhaar Card Verification', 'आधार कार्ड सत्यापन')}
              </h2>
              <p className="text-xs text-slate-500">
                {bi('UIDAI e-KYC OTP or manual front/back document upload for Admin review', 'यूआईडीएआई ई-केवाईसी ओटीपी या व्यवस्थापक समीक्षा के लिए आधार अपलोड')}
              </p>
            </div>
          </div>
          {isAadhaarApproved ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <FiCheckCircle size={14} className="text-emerald-600" /> {bi('Verified Record ✓', 'सत्यापित रिकॉर्ड ✓')}
            </span>
          ) : isAadhaarPending ? (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border-2 border-amber-300 rounded text-xs font-black flex items-center gap-1.5">
              <FiClock size={14} className="text-amber-600 animate-spin" /> {bi('Pending Admin Review ⏳', 'समीक्षा लंबित ⏳')}
            </span>
          ) : isAadhaarRejected ? (
            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border-2 border-rose-300 rounded text-xs font-black flex items-center gap-1.5">
              <FiXCircle size={14} className="text-rose-600" /> {bi('Verification Rejected ❌', 'सत्यापन अस्वीकृत ❌')}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded text-xs font-bold flex items-center gap-1.5">
              <FiAlertCircle size={14} /> {bi('Not Submitted', 'जमा नहीं किया गया')}
            </span>
          )}
        </div>

        {/* REJECTED ALERT BANNER */}
        {isAadhaarRejected && (
          <div className="p-4 rounded-md bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <FiXCircle className="text-rose-600" size={16} />
              <span>{bi('Verification Rejected by Compliance Team', 'अनुपालन टीम द्वारा सत्यापन अस्वीकृत')}</span>
            </div>
            <p className="text-xs text-rose-800 font-medium">
              <span className="font-bold">{bi('Reason:', 'कारण:')}</span> {aadhaarRejectionReason || bi('Uploaded document could not be verified. Please upload clear front & back photos.', 'अपलोड किया गया दस्तावेज़ सत्यापित नहीं किया जा सका। कृपया स्पष्ट फोटो अपलोड करें।')}
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-bold text-rose-700 block mb-2">
                {bi('You can update your document number or upload fresh images below and re-submit:', 'आप अपना विवरण अपडेट कर सकते हैं और नीचे पुनः प्रस्तुत कर सकते हैं:')}
              </span>
            </div>
          </div>
        )}

        {/* PENDING ALERT BANNER */}
        {isAadhaarPending && (
          <div className="p-4 rounded-md bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <FiClock className="text-amber-600" size={16} />
              <span>{bi('Verification Submitted & Pending Admin Approval', 'सत्यापन जमा किया गया और व्यवस्थापक स्वीकृति लंबित है')}</span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              {bi('Your Aadhaar document has been submitted and is currently under review by our compliance team. Status will update automatically upon verification.', 'आपका आधार दस्तावेज़ जमा कर दिया गया है और हमारी टीम समीक्षा कर रही है।')}
            </p>
            {(aadhaarDoc.frontUrl || aadhaarDoc.fileUrl) && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="font-bold text-[#241b15]">{bi('Attached Proof:', 'संलग्न प्रमाण:')}</span>
                <a href={aadhaarDoc.frontUrl || aadhaarDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#d99a3d] font-bold underline">
                  {bi('View Uploaded Front Image ↗', 'अपलोड की गई छवि देखें ↗')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* APPROVED RECORD DISPLAY */}
        {isAadhaarApproved ? (
          <div className="rounded-md bg-[#f8f4ec] border-2 border-emerald-300 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {aadhaarDoc.photo ? (
                <img
                  src={aadhaarDoc.photo}
                  alt="UIDAI Verified Photo"
                  className="w-16 h-16 rounded-md object-cover border-2 border-[#241b15] shadow-xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-md bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 font-black">
                  <FiUser size={28} />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#241b15] uppercase tracking-wide">
                    {aadhaarDoc.fullName || 'Verified Citizen'}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black rounded uppercase">
                    UIDAI VERIFIED
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700 tracking-wider">
                  {aadhaarDoc.maskedNumber || 'XXXX XXXX ****'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                  {aadhaarDoc.dob && (
                    <span className="flex items-center gap-1">
                      <FiCalendar size={12} className="text-[#d99a3d]" /> DOB: {aadhaarDoc.dob}
                    </span>
                  )}
                  {aadhaarDoc.gender && <span>Gender: {aadhaarDoc.gender}</span>}
                  {aadhaarDoc.careOf && <span>C/O: {aadhaarDoc.careOf}</span>}
                </div>
              </div>
            </div>

            {aadhaarDoc.fullAddress && (
              <div className="p-3 bg-white rounded-md border border-[#e3dccb] text-xs flex items-start gap-2">
                <FiMapPin className="text-[#d99a3d] shrink-0 mt-0.5" size={15} />
                <div>
                  <span className="font-bold text-[#241b15] block">{bi('Verified Registered Address:', 'सत्यापित पंजीकृत पता:')}</span>
                  <p className="text-slate-600 mt-0.5 font-medium">{aadhaarDoc.fullAddress}</p>
                  {aadhaarDoc.pincode && (
                    <span className="font-bold text-[#241b15] text-[11px] mt-1 block">PIN: {aadhaarDoc.pincode}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interactive verification input flow (for Unverified, Pending, or Rejected states) */
          <div className="space-y-4">
            {aadhaarOtpStage === 'input' ? (
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wide text-[#241b15]">
                  {bi('Enter 12-Digit Aadhaar Number', '12 अंकों का आधार नंबर दर्ज करें')}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNum}
                    onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234 5678 9012"
                    className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] tracking-wider outline-hidden transition shadow-2xs placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleInitiateAadhaar}
                    disabled={aadhaarLoading || aadhaarNum.replace(/\D/g, '').length !== 12}
                    className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                  >
                    {aadhaarLoading ? bi('Sending OTP...', 'ओटीपी भेजा जा रहा है...') : bi('Send UIDAI OTP →', 'आधार ओटीपी भेजें →')}
                  </button>
                </div>

                {/* Front & Back Image Attachment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="cursor-pointer px-3.5 py-2.5 bg-[#f8f4ec] border-2 border-dashed border-[#e3dccb] hover:border-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] flex items-center justify-center gap-2 transition">
                    <FiUploadCloud size={15} />
                    <span>{aadhaarFront ? bi('Front Attached ✓', 'फ्रंट संलग्न ✓') : bi('Attach Front Image', 'फ्रंट इमेज संलग्न करें')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarFront)} />
                  </label>
                  <label className="cursor-pointer px-3.5 py-2.5 bg-[#f8f4ec] border-2 border-dashed border-[#e3dccb] hover:border-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] flex items-center justify-center gap-2 transition">
                    <FiUploadCloud size={15} />
                    <span>{aadhaarBack ? bi('Back Attached ✓', 'बैक संलग्न ✓') : bi('Attach Back Image', 'बैक इमेज संलग्न करें')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAadhaarBack)} />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleManualSubmitDocument('aadhaar', aadhaarNum, aadhaarFront, aadhaarBack)}
                    disabled={!aadhaarNum && !aadhaarFront && !aadhaarBack}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FiSend size={13} />
                    <span>{bi('Submit Document for Admin Review', 'समीक्षा के लिए दस्तावेज़ सबमिट करें')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Aadhaar OTP Input Stage */
              <div className="p-5 rounded-md bg-[#f8f4ec] border-2 border-[#e3dccb] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#241b15]">
                    {bi('Enter 6-Digit Aadhaar OTP', '6 अंकों का आधार ओटीपी दर्ज करें')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAadhaarOtpStage('input')}
                    className="text-[11px] text-slate-600 hover:text-[#241b15] underline font-bold cursor-pointer"
                  >
                    {bi('Change Number', 'नंबर बदलें')}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={aadhaarOtp}
                  onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP code"
                  className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-white border-2 border-[#241b15] rounded-md text-[#241b15] outline-hidden focus:ring-2 focus:ring-[#d99a3d]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyAadhaarOtp}
                    disabled={aadhaarLoading || aadhaarOtp.length < 4}
                    className="flex-1 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider shadow-xs disabled:opacity-50 transition cursor-pointer"
                  >
                    {aadhaarLoading ? bi('Verifying OTP...', 'ओटीपी सत्यापित किया जा रहा है...') : bi('Confirm Aadhaar Verification ✓', 'आधार सत्यापन की पुष्टि करें ✓')}
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiateAadhaar}
                    disabled={aadhaarLoading}
                    className="px-4 py-2.5 bg-white border border-[#e3dccb] text-[#241b15] rounded-md text-xs font-bold hover:bg-[#e3dccb] transition cursor-pointer"
                  >
                    {bi('Resend', 'फिर भेजें')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. PAN CARD SECTION
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-[#e3dccb] rounded-md shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center text-xs font-black">
              2
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#241b15]">
                {bi('PAN Card (Taxpayer Identification)', 'पैन कार्ड (करदाता पहचान)')}
              </h2>
              <p className="text-xs text-slate-500">
                {bi('Instant Income Tax Dept database check or manual submission for Admin review', 'आयकर विभाग डेटाबेस जांच या व्यवस्थापक समीक्षा के लिए सबमिट करें')}
              </p>
            </div>
          </div>
          {isPanApproved ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <FiCheckCircle size={14} className="text-emerald-600" /> {bi('Verified Record ✓', 'सत्यापित रिकॉर्ड ✓')}
            </span>
          ) : isPanPending ? (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border-2 border-amber-300 rounded text-xs font-black flex items-center gap-1.5">
              <FiClock size={14} className="text-amber-600 animate-spin" /> {bi('Pending Admin Review ⏳', 'समीक्षा लंबित ⏳')}
            </span>
          ) : isPanRejected ? (
            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border-2 border-rose-300 rounded text-xs font-black flex items-center gap-1.5">
              <FiXCircle size={14} className="text-rose-600" /> {bi('Verification Rejected ❌', 'सत्यापन अस्वीकृत ❌')}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border-2 border-slate-300 rounded text-xs font-bold flex items-center gap-1.5">
              <FiAlertCircle size={14} /> {bi('Not Submitted', 'जमा नहीं किया गया')}
            </span>
          )}
        </div>

        {/* PAN REJECTED ALERT BANNER */}
        {isPanRejected && (
          <div className="p-4 rounded-md bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <FiXCircle className="text-rose-600" size={16} />
              <span>{bi('PAN Card Verification Rejected', 'पैन कार्ड सत्यापन अस्वीकृत')}</span>
            </div>
            <p className="text-xs text-rose-800 font-medium">
              <span className="font-bold">{bi('Reason:', 'कारण:')}</span> {panRejectionReason || bi('PAN details or document proof could not be validated. Please check PAN number and re-submit.', 'पैन विवरण का सत्यापन नहीं हो सका। कृपया नंबर जांचें और पुनः प्रयास करें।')}
            </p>
          </div>
        )}

        {/* PAN PENDING ALERT BANNER */}
        {isPanPending && (
          <div className="p-4 rounded-md bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <FiClock className="text-amber-600" size={16} />
              <span>{bi('PAN Verification Submitted & Pending Approval', 'पैन सत्यापन जमा किया गया और स्वीकृति लंबित है')}</span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              {bi('Your PAN document details are currently being reviewed by compliance officers.', 'आपके पैन विवरण की समीक्षा चल रही है।')}
            </p>
            {(panDoc.frontUrl || panDoc.fileUrl) && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="font-bold text-[#241b15]">{bi('Attached PAN Image:', 'संलग्न पैन छवि:')}</span>
                <a href={panDoc.frontUrl || panDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#d99a3d] font-bold underline">
                  {bi('View Uploaded Document ↗', 'अपलोड किया गया दस्तावेज़ देखें ↗')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* If verified: Render extracted PAN details */}
        {isPanApproved ? (
          <div className="rounded-md bg-[#f8f4ec] border-2 border-emerald-300 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#241b15] uppercase tracking-wide">
                    {panDoc.fullName || 'Taxpayer Validated'}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black rounded uppercase">
                    {panDoc.panStatus || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700 tracking-wider">
                  {panDoc.maskedNumber || panDoc.docNumber || 'ABCDE****F'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {panDoc.category && (
                  <span className="px-2.5 py-1 bg-white border border-[#e3dccb] rounded text-[11px] font-bold text-[#241b15]">
                    Category: {panDoc.category}
                  </span>
                )}
                {panDoc.aadhaarLinked && (
                  <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 rounded text-[11px] font-bold text-emerald-900">
                    Aadhaar: {panDoc.aadhaarLinked}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* PAN verification input flow */
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wide text-[#241b15]">
              {bi('Enter 10-Digit PAN Number', '10 अंकों का पैन नंबर दर्ज करें')}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={10}
                value={panNum}
                onChange={(e) => setPanNum(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] uppercase tracking-wider outline-hidden transition shadow-2xs placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handleVerifyPan}
                disabled={panLoading || panNum.length !== 10}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
              >
                {panLoading ? bi('Verifying PAN...', 'पैन सत्यापित किया जा रहा है...') : bi('Instant Sandbox Check →', 'सैंडबॉक्स से जांच करें →')}
              </button>
            </div>

            {/* Front & Back Image Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="cursor-pointer px-3.5 py-2.5 bg-[#f8f4ec] border-2 border-dashed border-[#e3dccb] hover:border-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] flex items-center justify-center gap-2 transition">
                <FiUploadCloud size={15} />
                <span>{panFront ? bi('Front Attached ✓', 'फ्रंट संलग्न ✓') : bi('Attach PAN Front Photo', 'पैन फ्रंट फोटो संलग्न करें')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanFront)} />
              </label>
              <label className="cursor-pointer px-3.5 py-2.5 bg-[#f8f4ec] border-2 border-dashed border-[#e3dccb] hover:border-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] flex items-center justify-center gap-2 transition">
                <FiUploadCloud size={15} />
                <span>{panBack ? bi('Back Attached ✓', 'बैक संलग्न ✓') : bi('Attach PAN Back Photo', 'पैन बैक फोटो संलग्न करें')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPanBack)} />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleManualSubmitDocument('pan', panNum, panFront, panBack)}
                disabled={!panNum && !panFront && !panBack}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiSend size={13} />
                <span>{bi('Submit PAN for Admin Review', 'समीक्षा के लिए पैन सबमिट करें')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
