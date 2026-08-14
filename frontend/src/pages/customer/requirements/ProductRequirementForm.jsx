import React from 'react';
import {
  FiShoppingBag, FiDollarSign, FiMapPin, FiUpload, FiImage, FiVideo, FiX, FiTarget, FiAlertCircle, FiCpu
} from 'react-icons/fi';

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

export default function ProductRequirementForm({
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
  productCondition, setProductCondition,
  customProductCondition, setCustomProductCondition,
  customCategory, setCustomCategory,
  customSubcategory, setCustomSubcategory,
  otherConditions, setOtherConditions,
  photos, video, uploading,
  handleImageUpload, handleVideoUpload, removePhoto, setVideo,
  resolveMediaUrl, categories, subcategories = [],
  isLoading, statesList = [], districtsList = [], handlePincodeChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Product Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Need 5 Laptops for office / Core i5 16GB RAM"
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory(''); // Reset subcategory when category changes
              setCustomCategory('');
            }}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            {categories.map(cat => (
              <option key={cat.id || cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
            <option value="Other">Other (Request Admin Approval)</option>
          </select>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Subcategory</label>
          <select
            value={subcategory}
            onChange={(e) => {
              setSubcategory(e.target.value);
              setCustomSubcategory('');
            }}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="">Select Subcategory</option>
            {subcategories.map(sub => (
              <option key={sub.id || sub._id} value={sub.name}>
                {sub.name}
              </option>
            ))}
            <option value="Other">Other (Request Admin Approval)</option>
          </select>
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

      {/* Reference Media Upload */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
          <FiImage className="inline mr-1" size={12} />
          Reference Images / Video (Optional)
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
            <span>{uploading ? 'Uploading...' : `Add Images (${photos.length}/5)`}</span>
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
              <span>{uploading ? '...' : 'Add Video'}</span>
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

      {/* Budget Range & Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Min Budget (₹)</label>
          <div className="relative">
            <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="e.g. 8000"
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
              placeholder="e.g. 15000"
              className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Quantity Required *</label>
          <input
            type="number"
            required
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Target Location Details */}
      <div className="glass rounded-xl p-4 border border-border/50 space-y-4">
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
          <FiTarget size={12} className="text-brand-orange" />
          Target Delivery Location
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">State *</label>
            {statesList.length > 0 ? (
              <select
                required
                value={state}
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
                value={state}
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
                value={district}
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
                value={district}
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
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Shivaji Nagar"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Pin Code</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="e.g. 411005"
              maxLength={6}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Full Delivery Address *</label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat/House No., Building, Street Address, Landmark..."
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

      {/* Description / Requirement details */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Brief Description *</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what product you need (e.g., brand preferences, core use case)..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* AI Detailed Specs Generator */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Detailed Technical Specifications</label>
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
          placeholder="Detailed options, measurements, technical parameters, model requirements. Fill manually or click 'Generate with AI' to draft..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple font-mono"
        />
      </div>

      {/* Expected Delivery Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Expected Delivery Date</label>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Preferred Time of Delivery</label>
          <input
            type="text"
            value={expectedDeliveryTime}
            onChange={(e) => setExpectedDeliveryTime(e.target.value)}
            placeholder="e.g. Morning 9 AM - 12 PM, Weekends only"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Product Condition */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Product Condition Preference</label>
        <select
          value={productCondition}
          onChange={(e) => {
            setProductCondition(e.target.value);
            setCustomProductCondition('');
          }}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
        >
          <option value="">No Preference (Any)</option>
          <option value="new">Brand New (Box Sealed)</option>
          <option value="used">Used / Second Hand</option>
          <option value="refurbished">Refurbished / Certified Pre-owned</option>
          <option value="other">Other (Specify)</option>
        </select>
        {productCondition === 'other' && (
          <input
            type="text"
            required
            placeholder="Specify preferred product condition"
            value={customProductCondition}
            onChange={(e) => setCustomProductCondition(e.target.value)}
            className="w-full px-4 py-2 mt-2 bg-surface border border-brand-purple/45 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        )}
      </div>

      {/* Any Other Condition */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1 flex items-center gap-1.5">
          <FiAlertCircle size={12} className="text-brand-orange" />
          Any Other Terms & Conditions (Optional)
        </label>
        <textarea
          rows={2}
          value={otherConditions}
          onChange={(e) => setOtherConditions(e.target.value)}
          placeholder="e.g. Must offer minimum 6 months warranty, invoice required..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || uploading}
        className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? 'Publishing Product Requirement...' : 'Post Product Requirement Now'}
      </button>
    </form>
  );
}
