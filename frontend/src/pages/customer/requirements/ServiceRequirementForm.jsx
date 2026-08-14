import React, { useState, useEffect } from 'react';
import {
  FiTool, FiDollarSign, FiMapPin, FiUpload, FiImage, FiVideo, FiX, FiClock, FiGlobe, FiAlertCircle, FiCpu, FiTarget
} from 'react-icons/fi';
import { SearchableCategorySelect, SearchableSubcategoryMultiSelect } from './SearchableSelects';

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
  onSubmit
}) {
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
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Service Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Need Video Editor for YouTube Reels / Wedding Photographer"
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Service Category</label>
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
              placeholder="Specify custom category name"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-4 py-2 mt-2 bg-surface border border-brand-purple/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple animate-fade-in"
            />
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Subcategory / Specialization</label>
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
              placeholder="Specify custom subcategory name"
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Service Model</label>
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
          Reference Design Briefs / Video Samples (Optional)
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
            uploading ? 'border-border text-text-tertiary' : 'border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5'
          }`}>
            <FiUpload size={14} />
            <span>{uploading ? 'Uploading...' : `Add Reference Images (${photos.length}/5)`}</span>
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
              uploading ? 'border-border text-text-tertiary' : 'border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5'
            }`}>
              <FiVideo size={14} />
              <span>{uploading ? '...' : 'Add Video Sample'}</span>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Min Budget (₹)</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Max Budget (₹)</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Location Requirement *</label>
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
              <span>On-Site</span>
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
              <span>Remote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Venue Details: Show only if On-Site */}
      {locationType === 'on-site' && (
        <div className="glass rounded-xl p-4 border border-border/50 space-y-4">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <FiTarget size={12} className="text-brand-orange" />
            Service Venue Location
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">State *</label>
              {statesList.length > 0 ? (
                <select
                  required
                  value={state === 'Remote' ? '' : state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="">Select State</option>
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
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">District *</label>
              {districtsList.length > 0 ? (
                <select
                  required
                  value={district === 'Remote' ? '' : district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="">Select District</option>
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
                  placeholder="e.g. Pune"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">City/Town *</label>
              <input
                type="text"
                required
                value={city === 'Online' ? '' : city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Shivaji Nagar"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Pin Code</label>
              <input
                type="text"
                value={pincode === '000000' ? '' : pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="e.g. 411005"
                maxLength={6}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Full Service Address/Venue *</label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Provide the complete address of the event venue / office location..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Within Distance</label>
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
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Brief Description *</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what service you need (e.g. editing YouTube videos, shooting wedding portrait)..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* AI Detailed Specs Generator */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Detailed Scope of Work & Milestones</label>
          <button
            type="button"
            onClick={handleGenerateSpecs}
            disabled={isGeneratingSpecs}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-lg text-[10px] font-bold hover:bg-brand-purple hover:text-white transition disabled:opacity-50"
          >
            <FiCpu className={isGeneratingSpecs ? 'animate-spin' : ''} />
            {isGeneratingSpecs ? 'Generating...' : '✨ Generate with AI'}
          </button>
        </div>
        <textarea
          rows={6}
          value={detailedSpecifications}
          onChange={(e) => setDetailedSpecifications(e.target.value)}
          placeholder="Detailed scope of work, tools, technologies, specific deliverables and deadlines. Fill manually or click 'Generate with AI' to draft..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple font-mono"
        />
      </div>

      {/* Expected Delivery Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Expected Completion/Delivery Date</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Preferred Time of Service</label>
          <input
            type="text"
            value={expectedDeliveryTime}
            onChange={(e) => setExpectedDeliveryTime(e.target.value)}
            placeholder="e.g. Weekends only, flexible, 9 AM - 6 PM"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Service Model preference */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Service Model Preference</label>
        <select
          value={serviceModel}
          onChange={(e) => {
            setServiceModel(e.target.value);
            setCustomServiceModel('');
          }}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
        >
          <option value="">No Preference (Any)</option>
          <option value="onsite">On-Site (Physically present at venue)</option>
          <option value="remote">Remote (Delivered entirely online)</option>
          <option value="hybrid">Hybrid (Mix of on-site and remote work)</option>
          <option value="other">Other (Specify)</option>
        </select>
        {serviceModel === 'other' && (
          <input
            type="text"
            required
            placeholder="Specify preferred service model"
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
          Special Requirements & Terms (Optional)
        </label>
        <textarea
          rows={2}
          value={otherConditions}
          onChange={(e) => setOtherConditions(e.target.value)}
          placeholder="e.g. Must bring own high-end video gear, past portfolio examples required..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || uploading}
        className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? 'Publishing Service brief...' : 'Post Service Brief Now'}
      </button>
    </form>
  );
}
