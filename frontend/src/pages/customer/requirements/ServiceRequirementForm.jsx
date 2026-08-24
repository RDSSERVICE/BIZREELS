import React, { useState, useEffect } from 'react';
import {
  FiTool, FiDollarSign, FiMapPin, FiUpload, FiImage, FiVideo, FiX, FiClock, FiGlobe, FiAlertCircle, FiCpu, FiTarget, FiCheckCircle, FiLoader, FiCheck
} from 'react-icons/fi';
import { SearchableCategorySelect, SearchableSubcategoryMultiSelect } from './SearchableSelects';
import { useLanguage } from '../../../context/LanguageContext';

const SERVICE_DURATION_OPTIONS = [
  { value: 'one-time', label: 'One-Time Project' },
  { value: 'hourly', label: 'Hourly-Based Contract' },
  { value: 'daily', label: 'Daily-Based Contract' },
  { value: 'weekly', label: 'Weekly Retainer' },
  { value: 'monthly', label: 'Monthly Retainer' },
];

const DISTANCE_OPTIONS = [
  { value: '', label: 'No distance limit' },
  { value: '5', label: 'Within 5 Km' },
  { value: '10', label: 'Within 10 Km' },
  { value: '25', label: 'Within 25 Km' },
  { value: '50', label: 'Within 50 Km' },
  { value: '100', label: 'Within 100 Km' },
  { value: '200', label: 'Within 200 Km' },
  { value: '500', label: 'Within 500 Km' },
];

export default function ServiceRequirementForm({
  title, setTitle,
  category, setCategory,
  subcategory, setSubcategory,
  budgetMin, setBudgetMin,
  budgetMax, setBudgetMax,
  quantity, setQuantity,
  state, setState,
  district, setDistrict,
  city, setCity,
  pincode, setPincode,
  address, setAddress,
  targetDistance, setTargetDistance,
  description, setDescription,
  detailedSpecifications, setDetailedSpecifications,
  isGeneratingSpecs, handleGenerateSpecs,
  expectedDeliveryDate, setExpectedDeliveryDate,
  expectedDeliveryTime, setExpectedDeliveryTime,
  serviceModel, setServiceModel,
  customServiceModel, setCustomServiceModel,
  customCategory, setCustomCategory,
  customSubcategory, setCustomSubcategory,
  otherConditions, setOtherConditions,
  photos, video, uploading,
  handleImageUpload, handleVideoUpload, removePhoto, setVideo,
  resolveMediaUrl, categories, subcategories = [],
  isLoading, statesList = [], districtsList = [], handlePincodeChange,
  isLookingUpPincode = false, pincodeSuccessInfo = '',
  onSubmit
}) {
  const { bi } = useLanguage();
  const [locationType, setLocationType] = useState('on-site'); // 'on-site' | 'remote'
  const [durationType, setDurationType] = useState('one-time');

  // Handle location type changes
  useEffect(() => {
    if (locationType === 'remote') {
      setState('Remote');
      setDistrict('Remote');
      setCity('Online');
      setPincode('000000');
    } else {
      setState('');
      setDistrict('');
      setCity('');
      setPincode('');
    }
  }, [locationType, setState, setDistrict, setCity, setPincode]);

  // Adjust placeholder for quantity depending on duration type selected
  const getQuantityLabel = () => {
    switch (durationType) {
      case 'hourly':
        return 'Number of Hours Required *';
      case 'daily':
        return 'Number of Days Required *';
      case 'weekly':
        return 'Number of Weeks Required *';
      case 'monthly':
        return 'Number of Months Retained *';
      case 'one-time':
      default:
        return 'Number of Deliverables / Milestones *';
    }
  };

  const getQuantityPlaceholder = () => {
    switch (durationType) {
      case 'hourly':
        return 'e.g. 10 hours';
      case 'daily':
        return 'e.g. 5 days';
      case 'weekly':
        return 'e.g. 4 weeks';
      case 'monthly':
        return 'e.g. 3 months';
      case 'one-time':
      default:
        return 'e.g. 1 video, 3 designs';
    }
  };

  return (
    <form onSubmit={(e) => {
      const modifiedConditions = `[Location Type: ${locationType.toUpperCase()}][Service Model: ${durationType.toUpperCase()}] ${otherConditions || ''}`;
      onSubmit(e, modifiedConditions);
    }} className="space-y-5">
      {/* Title */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Service Title *', 'सेवा शीर्षक *')}</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={bi('e.g. Need Video Editor for YouTube Reels / Wedding Photographer', 'उदाहरण: यूट्यूब रील्स के लिए वीडियो एडिटर चाहिए')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Service Category', 'सेवा श्रेणी')}</label>
          <SearchableCategorySelect
            category={category}
            setCategory={setCategory}
            categories={categories}
            customCategory={customCategory}
            setCustomCategory={setCustomCategory}
            setSubcategory={setSubcategory}
          />
          {category === 'Other' && (
            <input
              type="text"
              required
              placeholder={bi('Specify custom category name', 'अपनी श्रेणी का नाम दर्ज करें')}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-4 py-2 mt-2 bg-surface border border-brand-purple/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple animate-fade-in"
            />
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Subcategory / Specialization', 'उपश्रेणी / विशेषज्ञता')}</label>
          <SearchableSubcategoryMultiSelect
            subcategory={subcategory}
            setSubcategory={setSubcategory}
            subcategories={subcategories}
            customSubcategory={customSubcategory}
            setCustomSubcategory={setCustomSubcategory}
          />
          {subcategory === 'Other' && (
            <input
              type="text"
              required
              placeholder={bi('Specify custom subcategory name', 'अपनी उपश्रेणी का नाम दर्ज करें')}
              value={customSubcategory}
              onChange={(e) => setCustomSubcategory(e.target.value)}
              className="w-full px-4 py-2 mt-2 bg-surface border border-brand-purple/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple animate-fade-in"
            />
          )}
        </div>
      </div>

      {/* Service Scope Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Service Model', 'सेवा का मॉडल')}</label>
          <select
            value={durationType}
            onChange={(e) => setDurationType(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            {SERVICE_DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{getQuantityLabel()}</label>
          <input
            type="number"
            required
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={getQuantityPlaceholder()}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Reference Design Briefs / Video Samples */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
          <FiImage className="inline mr-1" size={12} />
          {bi('Reference Design Briefs / Video Samples (Optional)', 'संदर्भ डिजाइन विवरण / वीडियो नमूने (वैकल्पिक)')}
        </label>
        <div className="flex flex-wrap gap-3 mb-3">
          {photos.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
              <img src={resolveMediaUrl(url)} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <FiX size={10} />
              </button>
            </div>
          ))}
          {video && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-purple/30 bg-black">
              <video src={resolveMediaUrl(video)} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <FiVideo className="text-white" size={16} />
              </div>
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <FiX size={10} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-xs font-semibold cursor-pointer transition ${
            uploading ? 'border-border text-[#a89b8d]' : 'border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5'
          }`}>
            <FiUpload size={14} />
            <span>{uploading ? bi('Uploading...', 'अपलोड हो रहा है...') : bi(`Add Reference Images (${photos.length}/5)`, `संदर्भ चित्र जोड़ें (${photos.length}/5)`)}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || photos.length >= 5}
              className="hidden"
            />
          </label>
          {!video && (
            <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-xs font-semibold cursor-pointer transition ${
              uploading ? 'border-border text-[#a89b8d]' : 'border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5'
            }`}>
              <FiVideo size={14} />
              <span>{uploading ? '...' : bi('Add Video Sample', 'वीडियो नमूना जोड़ें')}</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Budget Range & Location Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Min Budget (₹)', 'न्यूनतम बजट (₹)')}</label>
          <div className="relative">
            <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Max Budget (₹)', 'अधिकतम बजट (₹)')}</label>
          <div className="relative">
            <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Location Requirement *', 'स्थान आवश्यकता *')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLocationType('on-site')}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                locationType === 'on-site'
                  ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                  : 'glass border-border text-text-secondary hover:border-brand-purple/40'
              }`}
            >
              <FiMapPin size={12} />
              <span>{bi('On-Site', 'ऑन-साइट (स्थान पर)')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocationType('remote')}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                locationType === 'remote'
                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange shadow-sm'
                  : 'glass border-border text-text-secondary hover:border-brand-orange/40'
              }`}
            >
              <FiGlobe size={12} />
              <span>{bi('Remote', 'रिमोट (ऑनलाइन)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Venue Details: Show only if On-Site */}
      {locationType === 'on-site' && (
        <div className="glass rounded-xl p-4 sm:p-5 border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <FiTarget size={12} className="text-brand-orange" />
              {bi('Service Venue Location', 'सेवा स्थल का स्थान')}
            </label>
            <span className="text-[10px] font-semibold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
              {bi('⚡ Fast Pin Code Auto-Fill', '⚡ पिन कोड से स्वतः विवरण')}
            </span>
          </div>

          {/* Prominent Pin Code Input (First Field) */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <FiMapPin className="text-amber-600" size={14} />
                <span>{bi('Enter 6-Digit Venue Pin Code *', 'स्थान का 6-अंकों का पिन कोड दर्ज करें *')}</span>
              </label>
              <span className="text-[10px] text-slate-500">
                {bi('Type 6 digits to automatically fetch State, District & City', 'पिन कोड डालते ही राज्य, जिला और शहर स्वतः भर जाएंगे')}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={pincode === '000000' ? '' : pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="e.g. 411005 / 110001 / 400001"
                maxLength={6}
                className="w-full pl-4 pr-24 py-2.5 bg-white border border-amber-300/80 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                {isLookingUpPincode && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                    <FiLoader className="animate-spin" size={14} />
                    <span>{bi('Fetching...', 'प्राप्त हो रहा है...')}</span>
                  </div>
                )}
                {!isLookingUpPincode && pincodeSuccessInfo && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <FiCheckCircle size={13} className="text-emerald-600" />
                    <span>{bi('Fetched', 'प्राप्त')}</span>
                  </div>
                )}
              </div>
            </div>

            {pincodeSuccessInfo && (
              <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>📍 {pincodeSuccessInfo}</span>
              </div>
            )}
          </div>

          {/* State, District & City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('State *', 'राज्य *')}</label>
              {statesList.length > 0 ? (
                <select
                  required
                  value={state === 'Remote' ? '' : state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="">{bi('Select State', 'राज्य चुनें')}</option>
                  {statesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={state === 'Remote' ? '' : state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={bi('e.g. Maharashtra', 'उदाहरण: महाराष्ट्र')}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('District *', 'जिला *')}</label>
              {districtsList.length > 0 ? (
                <select
                  required
                  value={district === 'Remote' ? '' : district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="">{bi('Select District', 'जिला चुनें')}</option>
                  {districtsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={district === 'Remote' ? '' : district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={bi('e.g. Pune', 'उदाहरण: पुणे')}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('City / Town / Area *', 'शहर / कस्बा / क्षेत्र *')}</label>
              <input
                type="text"
                required
                value={city === 'Online' ? '' : city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={bi('e.g. Shivaji Nagar / Central Market', 'उदाहरण: शिवाजी नगर')}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Full Service Address/Venue *', 'पूरा सेवा पता / स्थल *')}</label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={bi('Provide the complete address of the event venue / office location...', 'कार्यक्रम स्थल / कार्यालय का पूरा पता दर्ज करें...')}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Within Distance (Optional)', 'दूरी सीमा (वैकल्पिक)')}</label>
            <select
              value={targetDistance}
              onChange={(e) => setTargetDistance(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              {DISTANCE_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {locationType === 'remote' && (
        <div className="bg-brand-purple/5 p-3 rounded-xl border border-brand-purple/10 flex items-center gap-2">
          <FiGlobe className="text-brand-purple shrink-0" size={16} />
          <span className="text-[11px] text-text-secondary leading-relaxed">
            <strong>Remote service requirement:</strong> This service will be delivered entirely online/remotely. Physical presence or local distance limits are not applicable.
          </span>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Brief Description *', 'संक्षिप्त विवरण *')}</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={bi('Briefly describe what service you need (e.g. editing YouTube videos, shooting wedding portrait)...', 'संक्षेप में बताएं कि आपको किस सेवा की आवश्यकता है (उदा. यूट्यूब वीडियो एडिटिंग, शादी की फोटोग्राफी)...')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* AI Detailed Specs Generator */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">{bi('Detailed Scope of Work & Milestones', 'कार्य का विस्तृत विवरण और चरण')}</label>
          <button
            type="button"
            onClick={handleGenerateSpecs}
            disabled={isGeneratingSpecs}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-lg text-[10px] font-bold hover:bg-brand-purple hover:text-white transition disabled:opacity-50"
          >
            <FiCpu className={isGeneratingSpecs ? 'animate-spin' : ''} />
            {isGeneratingSpecs ? bi('Generating...', 'बनाया जा रहा है...') : bi('✨ Generate with AI', '✨ AI के साथ ड्राफ्ट बनाएं')}
          </button>
        </div>
        <textarea
          rows={6}
          value={detailedSpecifications}
          onChange={(e) => setDetailedSpecifications(e.target.value)}
          placeholder={bi("Detailed scope of work, tools, technologies, specific deliverables and deadlines...", "कार्य का विस्तृत विवरण, उपकरण, प्रौद्योगिकियां, विशिष्ट समय सीमा...")}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple font-mono"
        />
      </div>

      {/* Expected Delivery Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Expected Completion/Delivery Date', 'अपेक्षित पूरा करने की तिथि')}</label>
          <input
            type="date"
            value={expectedDeliveryDate}
            min={(() => {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const dd = String(today.getDate()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd}`;
            })()}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Preferred Time of Service', 'सेवा का पसंदीदा समय')}</label>
          <input
            type="text"
            value={expectedDeliveryTime}
            onChange={(e) => setExpectedDeliveryTime(e.target.value)}
            placeholder={bi('e.g. Weekends only, flexible, 9 AM - 6 PM', 'उदाहरण: केवल सप्ताहांत, सुबह 9 से शाम 6')}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Service Model preference */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Service Model Preference', 'सेवा मॉडल की पसंद')}</label>
        <select
          value={serviceModel}
          onChange={(e) => {
            setServiceModel(e.target.value);
            setCustomServiceModel('');
          }}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
        >
          <option value="">{bi('No Preference (Any)', 'कोई प्राथमिकता नहीं (कोई भी)')}</option>
          <option value="onsite">{bi('On-Site (Physically present at venue)', 'ऑन-साइट (स्थल पर भौतिक उपस्थिति)')}</option>
          <option value="remote">{bi('Remote (Delivered entirely online)', 'रिमोट (ऑनलाइन वितरित)')}</option>
          <option value="hybrid">{bi('Hybrid (Mix of on-site and remote work)', 'हाइब्रिड (ऑन-साइट और रिमोट का मिश्रण)')}</option>
          <option value="other">{bi('Other (Specify)', 'अन्य (निर्दिष्ट करें)')}</option>
        </select>
        {serviceModel === 'other' && (
          <input
            type="text"
            required
            placeholder={bi('Specify preferred service model', 'पसंदीदा सेवा मॉडल निर्दिष्ट करें')}
            value={customServiceModel}
            onChange={(e) => setCustomServiceModel(e.target.value)}
            className="w-full px-4 py-2 mt-2 bg-surface border border-brand-purple/45 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        )}
      </div>

      {/* Any Other Condition */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1 flex items-center gap-1.5">
          <FiAlertCircle size={12} className="text-brand-orange" />
          {bi('Special Requirements & Terms (Optional)', 'विशेष आवश्यकताएं एवं शर्तें (वैकल्पिक)')}
        </label>
        <textarea
          rows={2}
          value={otherConditions}
          onChange={(e) => setOtherConditions(e.target.value)}
          placeholder={bi('e.g. Must bring own high-end video gear, past portfolio examples required...', 'उदाहरण: अपने उच्च-स्तरीय वीडियो उपकरण लाने होंगे, पिछले पोर्टफोलियो उदाहरण आवश्यक...')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || uploading}
        className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? bi('Publishing Service brief...', 'सेवा विवरण प्रकाशित हो रहा है...') : bi('Post Service Brief Now', 'सेवा आवश्यकता अभी पोस्ट करें')}
      </button>
    </form>
  );
}
