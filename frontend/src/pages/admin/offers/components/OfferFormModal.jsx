import React, { useState, useEffect, useRef } from 'react';
import {
  FiUploadCloud,
  FiX,
  FiRefreshCw,
  FiClock,
  FiDollarSign,
  FiImage
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { mediaApi } from '../../../../lib/api';
import { generatePromoCode, formatDuration } from './offerUtils';
import { useListCategoriesQuery } from '../../../../features/admin/adminApi';

export default function OfferFormModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
  initialData = null,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    targetRoles: ['customer'],
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountLimit: '',
    usageLimit: '',
    perUserLimit: 1,
    startTime: '',
    endTime: '',
    timezone: 'Asia/Kolkata',
    priority: 0,
    terms: '',
    image: '',
    applicableCategories: [],
    status: 'Draft'
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const { data: categoriesData } = useListCategoriesQuery({});
  const categories = categoriesData?.categories || categoriesData?.items || [];

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        code: initialData.code || '',
        targetRoles: initialData.targetRoles || ['customer'],
        discountType: initialData.discountType || 'percentage',
        discountValue: initialData.discountValue || 10,
        minOrderAmount: initialData.minOrderAmount || 0,
        maxDiscountLimit: initialData.maxDiscountLimit || '',
        usageLimit: initialData.usageLimit || '',
        perUserLimit: initialData.perUserLimit || 1,
        startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
        endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
        timezone: initialData.timezone || 'Asia/Kolkata',
        priority: initialData.priority || 0,
        terms: initialData.terms || '',
        image: initialData.image || '',
        applicableCategories: initialData.applicableCategories || [],
        status: initialData.status || 'Draft'
      });
    } else {
      const now = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        code: generatePromoCode('BIZ'),
        targetRoles: ['customer'],
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 0,
        maxDiscountLimit: 500,
        usageLimit: 500,
        perUserLimit: 1,
        startTime: now.toISOString().slice(0, 16),
        endTime: nextWeek.toISOString().slice(0, 16),
        timezone: 'Asia/Kolkata',
        priority: 0,
        terms: '',
        image: '',
        applicableCategories: [],
        status: 'Draft'
      });
    }
  }, [initialData, isEditing, isOpen]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(10);
      const res = await mediaApi.upload(file, 'offers/banners', 'image', (prog) => {
        setUploadProgress(prog);
      });
      const url = res.data?.url || res.data?.data?.url || res.url;
      if (url) {
        setFormData(prev => ({ ...prev, image: url }));
        toast.success('Campaign banner uploaded successfully!');
      } else {
        throw new Error('Upload URL missing from server response.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateCode = () => {
    const prefix = formData.title ? formData.title.slice(0, 3).toUpperCase() : 'BIZ';
    setFormData(prev => ({ ...prev, code: generatePromoCode(prefix) }));
  };

  const toggleRole = (role) => {
    setFormData(prev => {
      const exists = prev.targetRoles.includes(role);
      const next = exists
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role];
      return { ...prev, targetRoles: next.length ? next : ['customer'] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please provide a campaign title.');
      return;
    }
    if (formData.discountType === 'percentage') {
      const val = Number(formData.discountValue);
      if (val < 1 || val > 100) {
        toast.error('Percentage discount must be between 1% and 100%.');
        return;
      }
    }
    if (formData.discountType === 'fixed') {
      const val = Number(formData.discountValue);
      if (val <= 0) {
        toast.error('Fixed discount amount must be greater than ₹0.');
        return;
      }
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      toast.error('End date must be after the start date.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Campaign Details' : 'Create High-Impact Campaign'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-1 font-sans">
        {/* Row 1: Title & Promo Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-black text-[#1a1a1a]">
              Campaign Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Diwali Mega Blast 20% OFF"
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#1a1a1a]">
                Promo Code
              </label>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="text-[10px] font-black text-[#1a1a1a] hover:text-[#d99a3d] flex items-center gap-1 cursor-pointer"
              >
                <FiRefreshCw className="w-2.5 h-2.5" /> Auto-Gen
              </button>
            </div>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
              placeholder="e.g. DIWALI20"
              className="w-full px-3.5 py-2 font-mono uppercase bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-black text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[#1a1a1a]">
            Campaign Subtitle / Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the offer, eligibility conditions, or special highlights..."
            className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-medium text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
          />
        </div>

        {/* Row 3: Discount Economics & Guardrails */}
        <div className="bg-[#fbf9f4] p-4 rounded-2xl border border-[#e3dccb] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#1a1a1a] flex items-center gap-1.5">
              <FiDollarSign className="w-4 h-4 text-[#d99a3d]" />
              Discount Economics & Guardrails
            </span>
            <div className="inline-flex p-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  formData.discountType === 'percentage'
                    ? 'bg-[#1a1a1a] text-[#d99a3d] font-black shadow-xs'
                    : 'text-[#8c827a]'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  formData.discountType === 'fixed'
                    ? 'bg-[#1a1a1a] text-[#d99a3d] font-black shadow-xs'
                    : 'text-[#8c827a]'
                }`}
              >
                Flat Amount (₹)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Discount Value */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1a1a1a]">
                {formData.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Flat Discount (₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={formData.discountType === 'percentage' ? '100' : '100000'}
                  required
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  className="w-full pl-3.5 pr-8 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-black text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#8c827a]">
                  {formData.discountType === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </div>

            {/* Min Order Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1a1a1a]">
                Min. Order Value (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                  placeholder="0 = No minimum"
                  className="w-full pl-3.5 pr-8 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-black text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#8c827a]">₹</span>
              </div>
            </div>

            {/* Max Discount Cap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1a1a1a]">
                Max Discount Cap (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscountLimit}
                  onChange={(e) => setFormData({ ...formData, maxDiscountLimit: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="Blank = No cap"
                  className="w-full pl-3.5 pr-8 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-black text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#8c827a]">₹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Audiences & Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Target Audience
            </label>
            <div className="flex items-center gap-1.5 pt-0.5">
              {['customer', 'vendor', 'creator'].map((role) => {
                const active = formData.targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#1a1a1a] text-[#d99a3d] border-[#1a1a1a] shadow-2xs'
                        : 'bg-[#f8f4ec] border-[#e3dccb] text-[#8c827a] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {role}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Usage Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Total Redemptions Limit
            </label>
            <input
              type="number"
              min="0"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : '' })}
              placeholder="Blank = Unlimited"
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
            />
          </div>

          {/* Per User Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Per Customer Limit
            </label>
            <input
              type="number"
              min="1"
              value={formData.perUserLimit}
              onChange={(e) => setFormData({ ...formData, perUserLimit: Number(e.target.value) || 1 })}
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Row 5: Schedule & Duration with Live Helper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Start Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-semibold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                End Date & Time <span className="text-rose-500">*</span>
              </label>
              {formData.startTime && formData.endTime && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Duration: {formatDuration(formData.startTime, formData.endTime)}
                </span>
              )}
            </div>
            <input
              type="datetime-local"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-semibold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Row 6: Artwork Banner Uploader */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1a1a1a] flex items-center justify-between">
            <span>Campaign Artwork / Banner</span>
            <span className="text-[10px] text-[#8c827a] font-medium">Recommended: 1200x600px banner</span>
          </label>

          {formData.image ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#e3dccb] group max-h-40 shadow-2xs">
              <img
                src={formData.image}
                alt="Campaign Preview"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-[#1a1a1a]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#1a1a1a] text-xs font-bold hover:bg-[#f8f4ec] cursor-pointer shadow-xs"
                >
                  Change Artwork
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-xs"
                  title="Remove image"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e3dccb] bg-[#fbf9f4] rounded-2xl p-6 text-center hover:border-[#1a1a1a] transition-all cursor-pointer"
            >
              {uploadingImage ? (
                <div className="space-y-2">
                  <div className="w-6 h-6 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-black text-[#1a1a1a]">
                    Uploading artwork... ({uploadProgress}%)
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#f8f4ec] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center mx-auto shadow-2xs">
                    <FiUploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-[#1a1a1a]">
                    Drag and drop campaign artwork, or <span className="underline text-[#d99a3d]">browse</span>
                  </p>
                  <p className="text-[10px] text-[#8c827a]">PNG, JPG, or WebP up to 5MB</p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* Row 7: Initial Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Campaign Lifecycle Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] cursor-pointer focus:outline-hidden focus:border-[#1a1a1a]"
            >
              <option value="Draft">Draft (Hidden from all users)</option>
              <option value="Scheduled">Scheduled (Queue for start date)</option>
              <option value="Active">Active (Launch immediately to users)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Feed Priority (Higher = Top of app feed)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) || 0 })}
              className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e3dccb]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-[#1a1a1a] border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadingImage}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-[#d99a3d] bg-[#1a1a1a] hover:bg-[#241b15] border border-[#1a1a1a] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Saving Campaign...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
