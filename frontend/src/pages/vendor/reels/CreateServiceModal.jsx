import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useCreateListingMutation } from '../../../features/vendor/vendorApi';
import { FiPlus, FiTool, FiDollarSign, FiImage, FiX, FiUploadCloud } from 'react-icons/fi';

/**
 * CreateServiceModal
 * Accepts dynamicCategoriesData ({ [CategoryName]: [SubcategoryName, ...] })
 * and categoriesList from the admin DB so dropdowns are always in sync with admin settings.
 */
export default function CreateServiceModal({
  isOpen,
  onClose,
  initialCategory,
  initialSubcategory,
  categoriesList = [],
  dynamicCategoriesData = {},
  onCreated,
}) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Derive available parent categories from the passed dynamic map
  const availableCategories = Object.keys(dynamicCategoriesData);

  // Pick a sensible default category
  const defaultCategory = initialCategory && availableCategories.includes(initialCategory)
    ? initialCategory
    : availableCategories[0] || '';

  const [category, setCategory] = useState(defaultCategory);

  // Derive subcategories for the chosen category
  const availableSubcategories = (dynamicCategoriesData[category] || []);
  const defaultSubcategory = initialSubcategory && availableSubcategories.includes(initialSubcategory)
    ? initialSubcategory
    : availableSubcategories[0] || 'General';

  const [subcategory, setSubcategory] = useState(defaultSubcategory);

  // Sync defaults when prop data arrives asynchronously (categories fetched after mount)
  useEffect(() => {
    if (availableCategories.length > 0 && !category) {
      const cat = initialCategory && availableCategories.includes(initialCategory)
        ? initialCategory
        : availableCategories[0];
      setCategory(cat);
    }
  }, [availableCategories.length]); // eslint-disable-line

  // When category changes reset subcategory to the first child of that category
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    const subs = dynamicCategoriesData[cat] || [];
    setSubcategory(subs[0] || 'General');
  };

  const [createListing, { isLoading }] = useCreateListingMutation();

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        return toast.error('Image size must be under 15MB');
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImageUrl(evt.target.result);
          toast.success('Service photo attached!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price || !category) {
      return toast.error('Please fill in Service Title, Price, and Category.');
    }

    const toastId = toast.loading('Creating new Service listing...');
    try {
      const res = await createListing({
        type: 'service',
        title: title.trim(),
        category,
        subcategory: subcategory || 'General',
        price: parseFloat(price) || 0,
        description: description.trim(),
        images: imageUrl ? [imageUrl] : [],
      }).unwrap();

      toast.success('🟢 Service Created Successfully!', { id: toastId });
      const newService = res.data || res.listing || res;
      onCreated(newService);
      onClose();

      // Reset form
      setTitle('');
      setPrice('');
      setDescription('');
      setImageUrl('');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to create service', { id: toastId });
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Create New Service Listing" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
        
        {/* Info Banner */}
        <div className="p-3.5 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <FiTool size={16} />
          </div>
          <div>
            <p className="text-xs font-black text-[#1a1a1a]">Quick Service Creator</p>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
              List a new service. Once created, it will be automatically selected for your Service Reel / Image Post.
            </p>
          </div>
        </div>

        {/* SERVICE TITLE */}
        <div>
          <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
            Service Title <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Full Home Deep Cleaning & Sanitization"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs"
          />
        </div>

        {/* CATEGORY & SUBCATEGORY — dynamic dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
              Category <span className="text-amber-600">*</span>
            </label>
            {availableCategories.length > 0 ? (
              <select
                required
                value={category}
                onChange={handleCategoryChange}
                className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs cursor-pointer"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-[#1a1a1a]">{cat}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Loading categories..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none shadow-2xs"
              />
            )}
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
              Sub Category
            </label>
            {availableSubcategories.length > 0 ? (
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs cursor-pointer"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub} className="bg-white text-[#1a1a1a]">{sub}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. General"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] outline-none shadow-2xs"
              />
            )}
          </div>
        </div>

        {/* PRICE & IMAGE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
              Price / Rate (₹) <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 1999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 pl-8 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
              Image URL / Photo (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-3 pr-8 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs"
              />
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Clear Image"
                >
                  <FiX size={14} />
                </button>
              ) : (
                <label className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700 p-1 cursor-pointer" title="Upload Photo from Device">
                  <FiUploadCloud size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* IMAGE PREVIEW IF ATTACHED */}
        {imageUrl && (
          <div className="flex items-center gap-3 p-2.5 bg-[#f8f4ec] rounded-xl border border-[#e3dccb]">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#e3dccb] bg-white shrink-0">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-700">Photo Attached</p>
              <p className="text-[10px] text-slate-500 truncate">{imageUrl.slice(0, 45)}...</p>
            </div>
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* DESCRIPTION */}
        <div>
          <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1.5">
            Service Details / Description
          </label>
          <textarea
            rows={3}
            placeholder="Describe features and scope of this service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs resize-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-[#e3dccb] text-slate-700 hover:text-black font-bold text-xs rounded-full hover:bg-[#ede5d8] transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 border border-amber-400 cursor-pointer disabled:opacity-50"
          >
            <FiPlus size={15} />
            {isLoading ? 'Creating...' : 'Create & Select Service'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
