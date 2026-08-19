import React from 'react';
import {
  FiShoppingBag, FiDollarSign, FiMapPin, FiUpload, FiImage, FiVideo, FiX, FiTarget, FiAlertCircle, FiCpu
} from 'react-icons/fi';
import { SearchableCategorySelect, SearchableSubcategoryMultiSelect } from './SearchableSelects';
import { useLanguage } from '../../../context/LanguageContext';

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
  const { bi } = useLanguage();
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Product Title *', 'उत्पाद का नाम *')}</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={bi('e.g. Need 5 Laptops for office / Core i5 16GB RAM', 'उदाहरण: कार्यालय के लिए 5 लैपटॉप चाहिए')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Category', 'श्रेणी')}</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Subcategory', 'उपश्रेणी')}</label>
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

      {/* Reference Media Upload */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
          <FiImage className="inline mr-1" size={12} />
          {bi('Reference Images / Video (Optional)', 'संदर्भ चित्र / वीडियो (वैकल्पिक)')}
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
            <span>{uploading ? bi('Uploading...', 'अपलोड हो रहा है...') : bi(`Add Images (${photos.length}/5)`, `चित्र जोड़ें (${photos.length}/5)`)}</span>
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
              <span>{uploading ? '...' : bi('Add Video', 'वीडियो जोड़ें')}</span>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Min Budget (₹)', 'न्यूनतम बजट (₹)')}</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Max Budget (₹)', 'अधिकतम बजट (₹)')}</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Quantity Required *', 'आवश्यक मात्रा *')}</label>
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
          {bi('Target Delivery Location', 'डिलीवरी स्थान विवरण')}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('State *', 'राज्य *')}</label>
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
                <option value="">{bi('Select State', 'राज्य चुनें')}</option>
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
                placeholder={bi('e.g. Maharashtra', 'उदाहरण: महाराष्ट्र')}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('District *', 'जिला *')}</label>
            {districtsList.length > 0 ? (
              <select
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
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
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={bi('e.g. Pune', 'उदाहरण: पुणे')}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('City/Town *', 'शहर / कस्बा *')}</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={bi('e.g. Shivaji Nagar', 'उदाहरण: शिवाजी नगर')}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Pin Code', 'पिन कोड')}</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Full Delivery Address *', 'पूरा डिलीवरी पता *')}</label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={bi('Flat/House No., Building, Street Address, Landmark...', 'मकान नंबर, भवन, सड़क का पता, लैंडमार्क...')}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Within Distance', 'दूरी सीमा')}</label>
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
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Brief Description *', 'संक्षिप्त विवरण *')}</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={bi('Briefly describe what product you need (e.g., brand preferences, core use case)...', 'संक्षेप में बताएं कि आपको किस उत्पाद की आवश्यकता है (उदा. ब्रांड पसंद, मुख्य उपयोग)...')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* AI Detailed Specs Generator */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">{bi('Detailed Technical Specifications', 'विस्तृत तकनीकी विनिर्देश')}</label>
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
          placeholder={bi("Detailed options, measurements, technical parameters, model requirements...", "विस्तृत विकल्प, माप, तकनीकी पैरामीटर, मॉडल की आवश्यकताएं...")}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple font-mono"
        />
      </div>

      {/* Expected Delivery Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Expected Delivery Date', 'अपेक्षित डिलीवरी तिथि')}</label>
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
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Preferred Time of Delivery', 'डिलीवरी का पसंदीदा समय')}</label>
          <input
            type="text"
            value={expectedDeliveryTime}
            onChange={(e) => setExpectedDeliveryTime(e.target.value)}
            placeholder={bi('e.g. Morning 9 AM - 12 PM, Weekends only', 'उदाहरण: सुबह 9 बजे से 12 बजे तक')}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* Product Condition */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">{bi('Product Condition Preference', 'उत्पाद की स्थिति पसंद')}</label>
        <select
          value={productCondition}
          onChange={(e) => {
            setProductCondition(e.target.value);
            setCustomProductCondition('');
          }}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
        >
          <option value="">{bi('No Preference (Any)', 'कोई प्राथमिकता नहीं (कोई भी)')}</option>
          <option value="new">{bi('Brand New (Box Sealed)', 'बिल्कुल नया (सील पैक)')}</option>
          <option value="used">{bi('Used / Second Hand', 'इस्तेमाल किया हुआ / सेकेंड हैंड')}</option>
          <option value="refurbished">{bi('Refurbished / Certified Pre-owned', 'रिफर्बिश्ड / सर्टिफाइड सेकेंड हैंड')}</option>
          <option value="other">{bi('Other (Specify)', 'अन्य (निर्दिष्ट करें)')}</option>
        </select>
        {productCondition === 'other' && (
          <input
            type="text"
            required
            placeholder={bi('Specify preferred product condition', 'पसंदीदा स्थिति निर्दिष्ट करें')}
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
          {bi('Any Other Terms & Conditions (Optional)', 'अन्य नियम और शर्तें (वैकल्पिक)')}
        </label>
        <textarea
          rows={2}
          value={otherConditions}
          onChange={(e) => setOtherConditions(e.target.value)}
          placeholder={bi('e.g. Must offer minimum 6 months warranty, invoice required...', 'उदाहरण: कम से कम 6 महीने की वारंटी होनी चाहिए, चालान आवश्यक...')}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || uploading}
        className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? bi('Publishing Requirement...', 'आवश्यकता प्रकाशित की जा रही है...') : bi('Post Product Requirement Now', 'उत्पाद आवश्यकता अभी पोस्ट करें')}
      </button>
    </form>
  );
}
