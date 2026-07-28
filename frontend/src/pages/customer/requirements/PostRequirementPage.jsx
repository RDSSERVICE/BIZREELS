import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlusCircle, FiShoppingBag, FiTool, FiDollarSign, FiMapPin,
  FiUpload, FiImage, FiVideo, FiX, FiFileText, FiTarget, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useCreateRequirementMutation } from '../../../features/customer/requirementsApi';
import { api } from '../../../lib/api';

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

export default function PostRequirementPage() {
  const navigate = useNavigate();
  const [createRequirement, { isLoading }] = useCreateRequirementMutation();
  const [type, setType] = useState('product');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('');
  const [budget, setBudget] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [targetDistance, setTargetDistance] = useState('');
  const [description, setDescription] = useState('');
  const [otherConditions, setOtherConditions] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories?top_level=true');
        const items = res.data?.items || [];
        if (items.length > 0) {
          setCategories(items);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'requirements');
        formData.append('resource_type', 'image');

        const res = await api.post('/v1/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data?.url || res.data?.secure_url || res.data?.data?.url;
        if (url) uploaded.push(url);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
    if (uploaded.length > 0) toast.success(`${uploaded.length} image(s) uploaded`);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'requirements');
      formData.append('resource_type', 'video');

      const res = await api.post('/v1/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.secure_url || res.data?.data?.url;
      if (url) {
        setVideo(url);
        toast.success('Video uploaded');
      }
    } catch (err) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !budget || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await createRequirement({
        type,
        requirementType: type,
        title,
        category,
        subcategory,
        budget: Number(budget),
        quantity: Number(quantity),
        city,
        district,
        state,
        pincode,
        targetDistance: targetDistance ? Number(targetDistance) : null,
        description,
        otherConditions: otherConditions || null,
        photos,
        video,
      }).unwrap();

      toast.success('Requirement posted successfully! Vendors will submit quotes soon.');
      navigate('/customer/my-requirements');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to post requirement';
      toast.error(msg);
    }
  };

  const defaultCategories = [
    { name: 'Electronics', label: 'Electronics & IT' },
    { name: 'Fashion', label: 'Fashion & Apparel' },
    { name: 'Furniture', label: 'Furniture & Home Decor' },
    { name: 'Services', label: 'Professional Services' },
    { name: 'Automobile', label: 'Automobile & Parts' },
    { name: 'Agriculture', label: 'Agriculture & Supplies' },
    { name: 'Property', label: 'Real Estate & Rentals' },
    { name: 'Healthcare', label: 'Healthcare & Beauty' },
    { name: 'Restaurant', label: 'Restaurant & Food' },
    { name: 'Education', label: 'Education & Coaching' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPlusCircle}
        title="Post Your Requirement"
        subtitle="Get instant quotes and proposals from verified local vendors & service providers"
      />

      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card max-w-2xl mx-auto w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Requirement Type Selector */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Requirement Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('product')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${type === 'product'
                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                    : 'glass border-border text-text-secondary hover:border-brand-purple/40'
                  }`}
              >
                <FiShoppingBag size={18} />
                <span>Product Requirement</span>
              </button>

              <button
                type="button"
                onClick={() => setType('service')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${type === 'service'
                    ? 'bg-brand-orange/10 border-brand-orange text-brand-orange shadow-sm'
                    : 'glass border-border text-text-secondary hover:border-brand-orange/40'
                  }`}
              >
                <FiTool size={18} />
                <span>Service Requirement</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Requirement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need 5 Laptops for office / AC Repair Service"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category</label>
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
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Subcategory</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Laptops, Smartphones, Repairs"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Sample Image/Video Upload */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
              <FiImage className="inline mr-1" size={12} />
              Sample Images / Video (Optional)
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                  <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
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
                  <video src={video} className="w-full h-full object-cover" muted />
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

          {/* Approximate Budget & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Approximate Budget (₹) *</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Quantity / Units</label>
              <input
                type="number"
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
              Target Location
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">State</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-purple" size={14} />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Punjab, Maharashtra"
                    className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Kapurthala, Pune"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">City *</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-orange" size={14} />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Phagwara, Delhi"
                    className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Pin Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 144401"
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            {/* Distance Selector */}
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

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your exact specifications, preferred brands, delivery timeline, or additional preferences..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Any Other Condition */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <FiAlertCircle size={12} className="text-brand-orange" />
              Any Other Condition (Optional)
            </label>
            <textarea
              rows={3}
              value={otherConditions}
              onChange={(e) => setOtherConditions(e.target.value)}
              placeholder="e.g. Must be ISI certified, delivery within 3 days, warranty required, specific color/model preferred..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || uploading}
            className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {isLoading ? 'Publishing Requirement...' : 'Post Requirement Now'}
          </button>
        </form>
      </div>
    </div>
  );
}