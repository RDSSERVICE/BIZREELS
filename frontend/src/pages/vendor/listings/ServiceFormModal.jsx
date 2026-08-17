import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, mediaApi } from '../../../lib/api';

// Subcomponents
import ServiceBasicInfoSection from './service-form/ServiceBasicInfoSection';
import ServiceDetailsSection from './service-form/ServiceDetailsSection';
import ServiceLocationSection from './service-form/ServiceLocationSection';
import ServiceAvailabilitySection from './service-form/ServiceAvailabilitySection';
import ServiceMediaSection from './service-form/ServiceMediaSection';
import ServiceCancellationPolicySection from './service-form/ServiceCancellationPolicySection';

/**
 * ServiceFormModal — Modular 6-section service creation/editing form
 * Sections: Basic Info, Service Details, Location, Availability, Media, Cancellation Policy
 */
export default function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  categoriesList = [],
  registeredCat = '',
  registeredSubcats = [],
  onboardedCategories = [],
  onboardedSubcategories = [],
  vendorCoords = null,
}) {
  const isEdit = !!editData;

  const defaultCat = editData?.category || registeredCat || (onboardedCategories && onboardedCategories[0]) || '';
  const defaultSub = editData?.subcategory || (registeredSubcats && registeredSubcats[0]) || (onboardedSubcategories && onboardedSubcategories[0]) || '';

  const [form, setForm] = useState({
    category: defaultCat,
    subcategory: defaultSub,
    shortDescription: '',
    detailedDescription: '',
    serviceHighlights: '',
    termsAndConditions: '',
    aiLabels: ['Fast Service', 'Top Rated', 'Verified Tech'],
    serviceType: 'At Home',
    priceType: 'Fixed Price',
    price: '',
    minOrderValue: '',
    duration: '1 Hour',
    serviceArea: 'Local Metropolitan Region',
    state: 'Maharashtra',
    city: 'Mumbai',
    pincode: '400001',
    homeVisitAvailable: true,
    maxTravelDistanceKm: 15,
    availableCities: '',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    workingHours: '09:00 AM - 08:00 PM',
    emergencyService24x7: false,
    advanceBookingRequired: true,
    bookingAvailability: 'Immediate',
    coverImage: '',
    galleryImages: [],
    videos: [],
    reelVideo: '',
    contactSettings: { chat: true, call: true, whatsapp: true, callbackRequest: true },
    leadSettings: { acceptLead: true, instantChat: true, callOnly: false, callbackOnly: false, quoteRequest: true },
    policies: {
      cancellationPolicy: 'Free cancellation up to 24 hours before visit.',
      refundPolicy: '50% refund within 24 hours. 0% after visit.',
      termsAndConditions: 'Standard service agreement terms apply.',
      freeCancellationHours: 24,
      withinWindowHours: 24,
      withinWindowRefundPercent: 50,
      afterVisitRefundPercent: 0,
    },
    status: 'published',
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic limits state
  const [maxLimits, setMaxLimits] = useState({ maxImages: 5, maxVideos: 1 });

  // Fetch max limits on mount
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const res = await api.get('/v1/listings/limits/media');
        const data = res.data?.data || res.data || {};
        if (data.maxImages !== undefined) {
          setMaxLimits({
            maxImages: Number(data.maxImages) || 5,
            maxVideos: Number(data.maxVideos) || 1,
          });
        }
      } catch (err) {
        console.warn('Could not fetch dynamic listing media limits:', err);
      }
    };
    if (isOpen) {
      fetchLimits();
    }
  }, [isOpen]);

  const allMasterServiceCats = useMemo(() => {
    const filtered = categoriesList
      .filter((c) => !c.parent_id && c.category_type === 'service')
      .map((c) => c.name);
    if (filtered.length > 0) return filtered;
    return ['Services', 'Real Estate', 'Beauty & Salon', 'Health & Fitness', 'Education & Coaching', 'Professional Services'];
  }, [categoriesList]);

  const serviceCategories = useMemo(() => {
    const onboarded = (onboardedCategories && onboardedCategories.length > 0)
      ? onboardedCategories
      : (registeredCat ? [registeredCat] : []);

    const validOnboardedServiceCats = onboarded.filter((catName) => {
      const catObj = categoriesList.find(
        (c) => !c.parent_id && (c.name === catName || c.id === catName || c._id === catName)
      );
      if (catObj) {
        return catObj.category_type === 'service';
      }
      return allMasterServiceCats.includes(catName);
    });

    if (validOnboardedServiceCats.length > 0) {
      return validOnboardedServiceCats;
    }

    return allMasterServiceCats;
  }, [categoriesList, onboardedCategories, registeredCat, allMasterServiceCats]);

  const serviceSubcategories = useMemo(() => {
    if (!form.category) return [];

    const parent = categoriesList.find(
      (c) => !c.parent_id && (c.name === form.category || c.id === form.category || c._id === form.category)
    );

    let subsFromMaster = [];
    if (parent) {
      subsFromMaster = categoriesList
        .filter((c) => (c.parent_id === parent.id || c.parent_id === parent._id) && (c.category_type === 'service' || !c.category_type))
        .map((c) => c.name);
    }

    const onboardedSubs = (onboardedSubcategories && onboardedSubcategories.length > 0)
      ? onboardedSubcategories
      : (registeredSubcats || []);

    if (onboardedSubs.length > 0) {
      const matched = subsFromMaster.filter(s => onboardedSubs.includes(s));
      const others = subsFromMaster.filter(s => !onboardedSubs.includes(s));
      if (matched.length > 0) {
        return [...matched, ...others];
      }
      if (subsFromMaster.length === 0) {
        return onboardedSubs;
      }
    }

    return subsFromMaster.length > 0 ? subsFromMaster : ['General', 'Consultation', 'Standard Service'];
  }, [categoriesList, form.category, onboardedSubcategories, registeredSubcats]);

  // Default to first category/subcategory if not set
  useEffect(() => {
    if ((!form.category || !serviceCategories.includes(form.category)) && serviceCategories.length > 0) {
      updateForm('category', serviceCategories[0]);
    }
  }, [serviceCategories, form.category]);

  useEffect(() => {
    if ((!form.subcategory || !serviceSubcategories.includes(form.subcategory)) && serviceSubcategories.length > 0) {
      updateForm('subcategory', serviceSubcategories[0]);
    }
  }, [serviceSubcategories, form.subcategory]);

  const handleCategoryChange = (val) => {
    updateForm('category', val);
    const parent = categoriesList.find(
      (c) => !c.parent_id && (c.name === val || c.id === val || c._id === val)
    );
    if (parent) {
      const subs = categoriesList.filter((c) => (c.parent_id === parent.id || c.parent_id === parent._id) && (c.category_type === 'service' || !c.category_type));
      if (subs.length > 0) {
        const onboardedMatch = (onboardedSubcategories || []).find(os => subs.some(s => s.name === os));
        updateForm('subcategory', onboardedMatch || subs[0].name);
      } else {
        updateForm('subcategory', (onboardedSubcategories && onboardedSubcategories[0]) || 'General');
      }
    } else {
      updateForm('subcategory', (onboardedSubcategories && onboardedSubcategories[0]) || 'General');
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      const sd = editData.serviceDetails || {};
      setForm({
        category: editData.category || registeredCat || '',
        subcategory: editData.subcategory || '',
        shortDescription: editData.shortDescription || '',
        detailedDescription: editData.description || '',
        serviceHighlights: sd.serviceHighlights || '',
        termsAndConditions: sd.termsAndConditions || '',
        aiLabels: sd.aiLabels || [],
        serviceType: sd.serviceType || 'At Home',
        priceType: sd.priceType || 'Fixed Price',
        price: editData.price || sd.price || '',
        minOrderValue: sd.minOrderValue || '',
        duration: sd.duration || sd.durationText || '1 Hour',
        serviceArea: sd.serviceArea || 'Local Area',
        state: sd.state || 'State',
        city: sd.city || 'City',
        pincode: sd.pincode || '',
        homeVisitAvailable: sd.homeVisitAvailable !== undefined ? sd.homeVisitAvailable : true,
        maxTravelDistanceKm: sd.maxTravelDistanceKm || 15,
        availableCities: sd.availableCities || '',
        workingDays: sd.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHours: sd.workingHours || '09:00 AM - 08:00 PM',
        emergencyService24x7: sd.emergencyService24x7 || false,
        advanceBookingRequired: sd.advanceBookingRequired !== undefined ? sd.advanceBookingRequired : true,
        bookingAvailability: sd.bookingAvailability || 'Immediate',
        coverImage: sd.coverImage || editData.images?.[0] || '',
        galleryImages: sd.galleryImages || editData.images?.slice(1) || [],
        videos: editData.videos || [],
        reelVideo: sd.reelVideo || '',
        contactSettings: sd.contactSettings || { chat: true, call: true, whatsapp: true, callbackRequest: true },
        leadSettings: sd.leadSettings || { acceptLead: true, instantChat: true, callOnly: false, callbackOnly: false, quoteRequest: true },
        policies: {
          cancellationPolicy: sd.policies?.cancellationPolicy || 'Free cancellation up to 24 hours before visit.',
          refundPolicy: sd.policies?.refundPolicy || '50% refund within 24 hours. 0% after visit.',
          termsAndConditions: sd.policies?.termsAndConditions || 'Standard service agreement terms apply.',
          freeCancellationHours: typeof sd.policies?.freeCancellationHours === 'number' ? sd.policies.freeCancellationHours : 24,
          withinWindowHours: typeof sd.policies?.withinWindowHours === 'number' ? sd.policies.withinWindowHours : 24,
          withinWindowRefundPercent: typeof sd.policies?.withinWindowRefundPercent === 'number' ? sd.policies.withinWindowRefundPercent : 50,
          afterVisitRefundPercent: typeof sd.policies?.afterVisitRefundPercent === 'number' ? sd.policies.afterVisitRefundPercent : 0,
        },
        status: editData.status || 'published',
      });
    }
  }, [editData]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // AI Description Generator
  const handleGenerateAiDescription = async () => {
    const promptText = aiPrompt.trim() || `${form.category || 'Service'} ${form.subcategory || ''} service provider`;
    setIsGeneratingAiDesc(true);
    const toastId = toast.loading('Gemini AI generating professional service description...');
    try {
      const res = await api.post('/v1/ai/generate-description', {
        prompt: promptText,
        type: 'service',
        category: form.category,
        subcategory: form.subcategory,
        context: {
          serviceType: form.serviceType,
          price: form.price,
          duration: form.duration,
          area: form.serviceArea,
        },
      });
      const data = res.data?.data || res.data;
      if (data) {
        if (data.shortDescription) updateForm('shortDescription', data.shortDescription);
        if (data.detailedDescription || data.description) {
          updateForm('detailedDescription', data.detailedDescription || data.description);
        }
        if (data.serviceHighlights) updateForm('serviceHighlights', data.serviceHighlights);
        if (data.aiLabels && Array.isArray(data.aiLabels)) updateForm('aiLabels', data.aiLabels);
        toast.success('AI description generated successfully!', { id: toastId });
      }
    } catch {
      toast.error('AI generation unavailable. Please enter details manually.', { id: toastId });
    } finally {
      setIsGeneratingAiDesc(false);
    }
  };

  // Web Speech API for voice prompt
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListeningVoice(true);
      toast('Listening... Speak service details now', { icon: '🎙️' });
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListeningVoice(false);
      toast.success('Voice captured!');
    };
    recognition.onerror = () => {
      setIsListeningVoice(false);
      toast.error('Voice input error. Please try again or type.');
    };
    recognition.onend = () => setIsListeningVoice(false);
    recognition.start();
  };

  // AI Multimodal File upload
  const handleAiAutoFillMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('AI analyzing media to auto-fill service details...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaApi.post('/v1/ai/multimodal-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res.data?.data || res.data;
      if (result) {
        if (result.title) updateForm('shortDescription', result.title);
        if (result.description) updateForm('detailedDescription', result.description);
        if (result.suggestedCategory) updateForm('category', result.suggestedCategory);
        if (result.highlights) updateForm('serviceHighlights', result.highlights);
        toast.success('Service fields auto-filled from media scan!', { id: toastId });
      }
    } catch {
      toast.error('Could not auto-fill from media. Please enter manually.', { id: toastId });
    }
  };

  // File Upload Handlers
  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = (form.coverImage ? 1 : 0) + form.galleryImages.length;
    if (currentCount + files.length > maxLimits.maxImages) {
      toast.error(`Exceeded maximum limit of ${maxLimits.maxImages} images!`);
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await mediaApi.post('/v1/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res.data?.url || res.data?.data?.url;
        if (url) uploadedUrls.push(url);
      }
      if (type === 'cover') {
        updateForm('coverImage', uploadedUrls[0] || form.coverImage);
      } else {
        updateForm('galleryImages', [...form.galleryImages, ...uploadedUrls]);
      }
      toast.success('Images uploaded successfully!', { id: toastId });
    } catch {
      toast.error('Image upload failed. Check connection/file size.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shortDescription.trim()) return toast.error('Please enter service short description');
    if (!form.price) return toast.error('Please enter service price');

    // Validate cancellation policy
    const freeHours = Number(form.policies?.freeCancellationHours ?? 24);
    const windowHours = Number(form.policies?.withinWindowHours ?? 24);
    const windowRefund = Number(form.policies?.withinWindowRefundPercent ?? 50);
    const afterRefund = Number(form.policies?.afterVisitRefundPercent ?? 0);

    if (freeHours < 0 || windowHours < 0) {
      return toast.error('Cancellation hours must be positive numbers');
    }
    if (windowRefund < 0 || windowRefund > 100 || afterRefund < 0 || afterRefund > 100) {
      return toast.error('Refund percentages must be between 0% and 100%');
    }

    setSubmitting(true);
    try {
      const generatedCancellationSummary = `Free cancellation up to ${freeHours}h before visit. ${windowRefund}% refund within ${windowHours}h. ${afterRefund}% refund after visit.`;

      const updatedPolicies = {
        ...form.policies,
        freeCancellationHours: freeHours,
        withinWindowHours: windowHours,
        withinWindowRefundPercent: windowRefund,
        afterVisitRefundPercent: afterRefund,
        cancellationPolicy: form.policies?.cancellationPolicy || generatedCancellationSummary,
        refundPolicy: form.policies?.refundPolicy || `${windowRefund}% refund within ${windowHours}h window`,
      };
      const payload = {
        type: 'service',
        category: form.category || 'Services',
        subcategory: form.subcategory || 'General',
        title: form.shortDescription,
        shortDescription: form.shortDescription,
        description: form.detailedDescription || form.shortDescription,
        price: Number(form.price),
        salePrice: Number(form.price),
        sellingPrice: Number(form.price),
        serviceDetails: {
          ...form,
          durationText: form.duration || '1 Hour',
          policies: updatedPolicies,
        },
        images: form.coverImage
          ? [form.coverImage, ...form.galleryImages]
          : form.galleryImages,
        videos: form.videos,
        location: vendorCoords ? { type: 'Point', coordinates: [vendorCoords.lng, vendorCoords.lat] } : undefined,
        status: form.status,
      };
      if (isEdit) payload._editId = editData._id || editData.id;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Service Listing' : 'Add New Service (6-Section Form)'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* SECTION 1: BASIC INFORMATION */}
        <ServiceBasicInfoSection
          form={form}
          updateForm={updateForm}
          handleCategoryChange={handleCategoryChange}
          serviceCategories={serviceCategories}
          serviceSubcategories={serviceSubcategories}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          isGeneratingAiDesc={isGeneratingAiDesc}
          isListeningVoice={isListeningVoice}
          toggleVoiceRecording={toggleVoiceRecording}
          handleGenerateAiDescription={handleGenerateAiDescription}
          handleAiAutoFillMedia={handleAiAutoFillMedia}
        />

        {/* SECTION 2: SERVICE DETAILS */}
        <ServiceDetailsSection form={form} updateForm={updateForm} />

        {/* SECTION 3: LOCATION */}
        <ServiceLocationSection form={form} updateForm={updateForm} />

        {/* SECTION 4: AVAILABILITY */}
        <ServiceAvailabilitySection form={form} updateForm={updateForm} />

        {/* SECTION 5: IMAGES & MEDIA */}
        <ServiceMediaSection
          form={form}
          updateForm={updateForm}
          setForm={setForm}
          maxLimits={maxLimits}
          coverUrlInput={coverUrlInput}
          setCoverUrlInput={setCoverUrlInput}
          galleryUrlInput={galleryUrlInput}
          setGalleryUrlInput={setGalleryUrlInput}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
        />

        {/* SECTION 6: CANCELLATION & REFUND POLICY (PRE-PAYMENT BOOKINGS) */}
        <ServiceCancellationPolicySection form={form} updateForm={updateForm} />

        {/* Status */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
            Listing Status
          </label>
          <select
            value={form.status}
            onChange={(e) => updateForm('status', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl font-black text-xs shadow-2xs disabled:opacity-50 transition cursor-pointer border-none"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Service Listing' : 'Publish Service to Database'}
        </button>
      </form>
    </AdminModal>
  );
}
