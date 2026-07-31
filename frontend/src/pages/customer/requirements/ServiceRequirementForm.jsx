import React, { useState, useEffect } from 'react';
import {
  FiTool, FiDollarSign, FiMapPin, FiUpload, FiImage, FiVideo, FiX, FiClock, FiGlobe, FiAlertCircle
} from 'react-icons/fi';

const SERVICE_DURATION_OPTIONS = [
  { value: 'one-time', label: 'One-Time Project' },
  { value: 'hourly', label: 'Hourly-Based Contract' },
  { value: 'daily', label: 'Daily-Based Contract' },
  { value: 'weekly', label: 'Weekly Retainer' },
  { value: 'monthly', label: 'Monthly Retainer' },
];

export default function ServiceRequirementForm({
  title, setTitle,
  category, setCategory,
  subcategory, setSubcategory,
  budget, setBudget,
  quantity, setQuantity,
  state, setState,
  district, setDistrict,
  city, setCity,
  pincode, setPincode,
  description, setDescription,
  otherConditions, setOtherConditions,
  photos, video, uploading,
  handleImageUpload, handleVideoUpload, removePhoto, setVideo,
  resolveMediaUrl, categories, defaultCategories,
  isLoading, onSubmit
}) {
  const [locationType, setLocationType] = useState('on-site'); // 'on-site' | 'remote'
  const [durationType, setDurationType] = useState('one-time');

  // Handle location type changes
  useEffect(() => {
    if (locationType === 'remote') {
      // Clear address details or set to Remote placeholder
      setState('Remote');
      setDistrict('Remote');
      setCity('Online');
      setPincode('000000');
    } else {
      // Reset if switched back to local
      setState('');
      setDistrict('');
      setCity('');
      setPincode('');
    }
  }, [locationType]);

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
        return 'e.g. 1 video / 1 shoot';
    }
  };

  return (
    <form onSubmit={(e) => {
      // Inject locationType info into otherConditions so it's logged in backend
      const modifiedConditions = `[Location Type: ${locationType.toUpperCase()}][Service Model: ${durationType.toUpperCase()}] ${otherConditions || ''}`;
      
      // Call onSubmit callback
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            {categories.length > 0
              ? categories.map(cat => <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>)
              : defaultCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.label}</option>)
            }
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Subcategory / Specialization</label>
          <input
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g. UGC Creation, Premiere Pro editing, Logo Design"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
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

      {/* Sample Image/Video Reference Brief Upload */}
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

      {/* Service Budget & Location Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Estimated Budget (₹) *</label>
          <div className="relative">
            <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="number"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
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
              <span>On-Site Service</span>
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
              <span>Remote (Online)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Address details: Show only if On-Site */}
      {locationType === 'on-site' && (
        <div className="glass rounded-xl p-4 border border-border/50 space-y-4">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <FiMapPin size={12} className="text-brand-orange" />
            Service Venue Location
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">State</label>
              <input
                type="text"
                value={state === 'Remote' ? '' : state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Punjab"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">District</label>
              <input
                type="text"
                value={district === 'Remote' ? '' : district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Kapurthala"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">City *</label>
              <input
                type="text"
                required={locationType === 'on-site'}
                value={city === 'Online' ? '' : city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Phagwara"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Pin Code</label>
              <input
                type="text"
                value={pincode === '000000' ? '' : pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 144401"
                maxLength={6}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>
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
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Detailed Service Brief & Scope of Work *</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the scope of work, tools to be used, delivery timelines, specific milestones, or expected outcomes..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Any Other Condition */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1 flex items-center gap-1.5">
          <FiAlertCircle size={12} className="text-brand-orange" />
          Special Requirements & Terms (Optional)
        </label>
        <textarea
          rows={3}
          value={otherConditions}
          onChange={(e) => setOtherConditions(e.target.value)}
          placeholder="e.g. Must bring own high-end video gear, past portfolio examples required, contract terms..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || uploading}
        className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
      >
        {isLoading ? 'Publishing Service brief...' : 'Post Service Brief Now'}
      </button>
    </form>
  );
}
