import React, { useState, useEffect } from 'react';
import {
  FiCpu, FiMic, FiMicOff, FiUploadCloud, FiX, FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, mediaApi } from '../../../lib/api';

/**
 * ServiceFormModal — Complete 6-section service creation/editing form
 * Sections: Basic Info, Service Details, Location, Availability, Media, Lead Settings & Policies
 * Includes AI Description Generator (Gemini) with voice input
 */
export default function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  categoriesList = [],
  subcategoriesList = [],
  registeredCat = '',
  registeredSubcats = [],
  vendorCoords = null,
}) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    category: registeredCat || '',
    subcategory: registeredSubcats[0] || '',
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
      cancellationPolicy: 'Free cancellation up to 2 hours before appointment.',
      refundPolicy: 'Full refund if cancelled within policy guidelines.',
      termsAndConditions: 'Standard service agreement terms apply.'
    },
    status: 'published',
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [uploading, setUploading] = useState(false);
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
            maxVideos: Number(data.maxVideos) || 1
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
        duration: sd.durationText || sd.duration || '1 Hour',
        serviceArea: sd.serviceArea || '',
        state: sd.state || '',
        city: sd.city || '',
        pincode: sd.pincode || '',
        homeVisitAvailable: sd.homeVisitAvailable ?? true,
        maxTravelDistanceKm: sd.maxTravelDistanceKm ?? 15,
        availableCities: sd.availableCities || '',
        workingDays: sd.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHours: sd.workingHours || '09:00 AM - 08:00 PM',
        emergencyService24x7: sd.emergencyService24x7 || false,
        advanceBookingRequired: sd.advanceBookingRequired || false,
        bookingAvailability: sd.bookingAvailability || 'Immediate',
        coverImage: sd.coverImage || editData.images?.[0] || '',
        galleryImages: sd.galleryImages || editData.images?.slice(1) || [],
        videos: editData.videos || [],
        reelVideo: sd.reelVideo || '',
        contactSettings: sd.contactSettings || { chat: true, call: true, whatsapp: true, callbackRequest: true },
        leadSettings: sd.leadSettings || { acceptLead: true, instantChat: true, callOnly: false, callbackOnly: false, quoteRequest: true },
        policies: sd.policies || {
          cancellationPolicy: 'Free cancellation up to 2 hours before appointment.',
          refundPolicy: 'Full refund if cancelled within policy guidelines.',
          termsAndConditions: 'Standard service agreement terms apply.'
        },
        status: editData.status || 'published',
      });
    }
  }, [editData]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const [isAiGeneratingMedia, setIsAiGeneratingMedia] = useState(false);

  const handleAiAutoFillMedia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsAiGeneratingMedia(true);
    const toastId = toast.loading('AI analyzing media sample in real-time...');
    try {
      let resource_type = 'image';
      if (file.type.startsWith('audio')) resource_type = 'raw';
      if (file.type.startsWith('video')) resource_type = 'video';

      const uploadRes = await mediaApi.upload(file, 'listings/ai-samples', resource_type);
      const url = uploadRes.data?.secure_url || uploadRes.data?.url || uploadRes.data?.data?.url;

      if (!url) throw new Error('File upload failed');

      // Now call AI API
      const aiRes = await api.post('/v1/ai/generate-listing-content', {
        title: aiPrompt || file.name.split('.')[0] || 'Service Sample',
        type: 'service',
        category_name: form.category,
        sub_category_name: form.subcategory,
        image_urls: resource_type === 'image' ? [url] : [],
        audio_url: resource_type === 'raw' ? url : undefined,
        video_url: resource_type === 'video' ? url : undefined,
      });

      const data = aiRes.data?.data || aiRes.data || aiRes;
      if (data && data.generated) {
        const gen = data.generated;
        setForm(prev => ({
          ...prev,
          shortDescription: gen.short_description || prev.shortDescription,
          detailedDescription: gen.description || prev.detailedDescription,
          serviceHighlights: Array.isArray(gen.features) ? gen.features.join(', ') : prev.serviceHighlights,
          price: gen.suggested_price_range_inr?.min || prev.price,
        }));
        toast.success('AI extracted service specifications & details in real-time!', { id: toastId });
      } else {
        throw new Error('AI returned empty response');
      }
    } catch (err) {
      toast.error('AI extraction failed: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsAiGeneratingMedia(false);
    }
  };

  // AI Description Generator
  const handleGenerateAiDescription = async (e) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return toast.error('Please enter or dictate a prompt for AI generation');
    setIsGeneratingAiDesc(true);
    const toastId = toast.loading('✨ Google Gemini AI is generating real-time description...');
    try {
      const res = await api.post('/v1/ai/generate-listing-content', {
        title: aiPrompt.trim().slice(0, 100),
        type: 'service',
        category_name: form.category,
        sub_category_name: form.subcategory,
        hints: aiPrompt.trim(),
      });
      const responseObj = res.data?.data || res.data || {};
      if (responseObj.ok === false) throw new Error(responseObj.error || 'AI generation failed');
      const gen = responseObj.generated || {};
      const generatedShort = gen.short_description || aiPrompt.trim().slice(0, 50);
      const generatedDetailed = gen.description || (Array.isArray(gen.features) && gen.features.length > 0
        ? `${aiPrompt.trim()}\n\nKey Highlights:\n${gen.features.map(f => `• ${f}`).join('\n')}`
        : aiPrompt.trim());
      setForm(prev => ({
        ...prev,
        shortDescription: generatedShort,
        detailedDescription: generatedDetailed,
      }));
      toast.success('✨ Gemini AI Description generated in real-time!', { id: toastId });
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to generate AI description';
      toast.error(`⚠️ ${errMsg}`, { id: toastId });
    } finally {
      setIsGeneratingAiDesc(false);
    }
  };

  // Voice Input
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error('Voice input is not supported in this browser.');
    if (isListeningVoice) { setIsListeningVoice(false); return; }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';
      recognition.onstart = () => { setIsListeningVoice(true); toast.success('🎙️ Listening... Speak service details now'); };
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        if (transcript) setAiPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.onerror = (event) => { setIsListeningVoice(false); toast.error(`Voice error: ${event.error}`); };
      recognition.onend = () => setIsListeningVoice(false);
      recognition.start();
    } catch {
      setIsListeningVoice(false);
      toast.error('Failed to start voice input');
    }
  };

  // Image upload
  const handleImageUpload = async (e, type = 'gallery') => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const toastId = toast.loading('Uploading image(s)...');
    try {
      const urls = [];
      for (const file of files) {
        const res = await mediaApi.upload(file, 'listings/services');
        const url = res.data?.secure_url || res.data?.url;
        if (url) urls.push(url);
      }
      if (type === 'cover' && urls[0]) {
        updateForm('coverImage', urls[0]);
      } else {
        setForm(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...urls] }));
      }
      toast.success(`Image(s) uploaded!`, { id: toastId });
    } catch {
      toast.error('Image upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shortDescription.trim()) return toast.error('Please enter service short description');
    if (!form.price) return toast.error('Please enter service price');
    setSubmitting(true);
    try {
      const payload = {
        type: 'service',
        category: form.category || 'Services',
        subcategory: form.subcategory || 'General',
        title: `${form.category || 'Service'} - ${form.serviceType}`,
        shortDescription: form.shortDescription,
        description: form.detailedDescription,
        price: Number(form.price),
        actualPrice: Number(form.price),
        sellingPrice: Number(form.price),
        serviceDetails: {
          ...form,
          durationText: form.duration || '1 Hour',
        },
        images: form.coverImage
          ? [form.coverImage, ...form.galleryImages]
          : form.galleryImages.length > 0
            ? form.galleryImages
            : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
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
    <AdminModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Service Listing' : 'Add New Service (6-Section Form)'} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">1. Basic Information</h4>
            <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <FiCpu size={12} /> AI Assisted
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Category (Lock to Registered)</label>
              <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" disabled>
                <option value={registeredCat || 'Services'}>{registeredCat || 'Services'}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Subcategory</label>
              <select value={form.subcategory} onChange={(e) => updateForm('subcategory', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                {registeredSubcats && registeredSubcats.length > 0 ? (
                  registeredSubcats.map(sub => <option key={sub} value={sub}>{sub}</option>)
                ) : subcategoriesList && subcategoriesList.length > 0 ? (
                  subcategoriesList.map(s => <option key={s} value={s}>{s}</option>)
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>
          </div>

          {/* AI Description Generator */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-purple flex items-center gap-1">
                <FiCpu size={14} /> AI Description Generator (Voice & Text)
              </span>
              <button type="button" onClick={toggleVoiceRecording} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${isListeningVoice ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-purple text-white hover:bg-brand-purple/90'}`} title="Speak details to AI">
                {isListeningVoice ? <FiMicOff size={12} /> : <FiMic size={12} />}
                <span>{isListeningVoice ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Tell AI about your service specialty or speak via mic..." className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple" />
              <button type="button" onClick={handleGenerateAiDescription} disabled={isGeneratingAiDesc} className="px-3.5 py-1.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition flex items-center gap-1 disabled:opacity-50 shrink-0">
                <FiCpu size={13} />
                <span>{isGeneratingAiDesc ? 'Generating...' : 'Auto-Generate'}</span>
              </button>
            </div>
            
            {/* Real-time Media Auto-Fill */}
            <div className="pt-2 border-t border-brand-purple/10 space-y-1">
              <label className="text-[10px] font-bold text-brand-purple uppercase block">Or Upload Media for AI Specifications Auto-Fill</label>
              <input type="file" accept="image/*,video/*,audio/*" onChange={handleAiAutoFillMedia} className="text-xs text-text-tertiary" />
              <p className="text-[9px] text-text-tertiary">Gemini will scan your sample photo/video/voice note to extract highlights & descriptions.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary block mb-1">Short Description *</label>
            <input type="text" required value={form.shortDescription} onChange={(e) => updateForm('shortDescription', e.target.value)} placeholder="Brief 1-line summary..." className="w-full p-2 bg-surface border rounded-xl text-xs" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-text-tertiary block">Detailed Description</label>
              <button type="button" onClick={handleGenerateAiDescription} className="text-[10px] font-bold text-brand-purple hover:underline flex items-center gap-0.5">
                <FiCpu size={10} /> Re-generate AI Description
              </button>
            </div>
            <textarea rows={4} value={form.detailedDescription} onChange={(e) => updateForm('detailedDescription', e.target.value)} placeholder="Comprehensive service breakdown..." className="w-full p-2 bg-surface border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Highlights</label>
            <textarea rows={2} value={form.serviceHighlights} onChange={(e) => updateForm('serviceHighlights', e.target.value)} placeholder="Key features and highlights..." className="w-full p-2 bg-surface border rounded-xl text-xs" />
          </div>
        </div>

        {/* SECTION 2: SERVICE DETAILS */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">2. Service Details</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Type</label>
              <select value={form.serviceType} onChange={(e) => updateForm('serviceType', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                <option value="At Home">At Home</option>
                <option value="At Shop">At Shop</option>
                <option value="Online">Online</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Price Type</label>
              <select value={form.priceType} onChange={(e) => updateForm('priceType', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                <option value="Fixed Price">Fixed Price</option>
                <option value="Starting From">Starting From</option>
                <option value="Per Hour">Per Hour</option>
                <option value="Per Day">Per Day</option>
                <option value="Per Project">Per Project</option>
                <option value="Custom Quote">Custom Quote</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Starting Price (₹) *</label>
              <input type="number" required value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="999" className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Duration *</label>
              <input type="text" required value={form.duration} onChange={(e) => updateForm('duration', e.target.value)} placeholder="e.g. 1 Hour" className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Min Order Value (₹)</label>
              <input type="number" value={form.minOrderValue} onChange={(e) => updateForm('minOrderValue', e.target.value)} placeholder="e.g. 500" className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Booking Availability</label>
              <select value={form.bookingAvailability} onChange={(e) => updateForm('bookingAvailability', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                <option value="Immediate">Immediate</option>
                <option value="Same Day">Same Day</option>
                <option value="Next Day">Next Day</option>
                <option value="2-3 Days">2-3 Days</option>
                <option value="By Appointment">By Appointment</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: LOCATION */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">3. Location & Service Area</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Area</label>
              <input type="text" value={form.serviceArea} onChange={(e) => updateForm('serviceArea', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => updateForm('city', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => updateForm('state', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => updateForm('pincode', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Available Cities</label>
              <input type="text" value={form.availableCities} onChange={(e) => updateForm('availableCities', e.target.value)} placeholder="Mumbai, Pune, Delhi..." className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Max Travel (km)</label>
              <input type="number" value={form.maxTravelDistanceKm} onChange={(e) => updateForm('maxTravelDistanceKm', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" checked={form.homeVisitAvailable} onChange={(e) => updateForm('homeVisitAvailable', e.target.checked)} />
                Home Visit Available
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: AVAILABILITY */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">4. Availability & Working Hours</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Working Hours</label>
              <input type="text" value={form.workingHours} onChange={(e) => updateForm('workingHours', e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <input type="checkbox" checked={form.emergencyService24x7} onChange={(e) => updateForm('emergencyService24x7', e.target.checked)} />
                Emergency Service (24×7)
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Working Days</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const checked = form.workingDays.includes(day);
                  return (
                    <label key={day} className="flex items-center gap-1.5 text-xs cursor-pointer bg-surface border border-border px-2.5 py-1 rounded-xl">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const newDays = e.target.checked ? [...form.workingDays, day] : form.workingDays.filter(d => d !== day);
                        updateForm('workingDays', newDays);
                      }} />
                      {day}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: IMAGES & MEDIA */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">5. Images & Media (Max {maxLimits.maxImages})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Cover Image</label>
              {form.coverImage ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => updateForm('coverImage', '')} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]">
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                ((form.coverImage ? 1 : 0) + form.galleryImages.length < maxLimits.maxImages) ? (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex flex-col items-center justify-center cursor-pointer transition gap-1">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                    <FiUploadCloud className="w-5 h-5 text-text-tertiary" />
                    <span className="text-[9px] text-text-tertiary">Upload</span>
                  </label>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[10px] text-text-tertiary text-center font-bold">
                    Limit reached
                  </div>
                )
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">Gallery Images</label>
              <div className="flex flex-wrap gap-2">
                {form.galleryImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]">
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {((form.coverImage ? 1 : 0) + form.galleryImages.length < maxLimits.maxImages) ? (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex items-center justify-center cursor-pointer transition">
                    <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} className="hidden" />
                    {uploading ? <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" /> : <FiImage className="w-4 h-4 text-text-tertiary" />}
                  </label>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[8px] text-text-tertiary text-center font-bold">
                    Max reached
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Listing Status</label>
          <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium disabled:opacity-50 transition">
          {submitting ? 'Saving...' : isEdit ? 'Update Service Listing' : 'Publish Service to Database'}
        </button>
      </form>
    </AdminModal>
  );
}
