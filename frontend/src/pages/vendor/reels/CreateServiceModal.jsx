import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useCreateListingMutation } from '../../../features/vendor/vendorApi';
import { FiPlus } from 'react-icons/fi';

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
        images: imageUrl
          ? [imageUrl]
          : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'],
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-text-tertiary">
          List a new service. Once created, it will be automatically selected for your Service Reel / Image Post.
        </p>

        {/* SERVICE TITLE */}
        <div>
          <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Service Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Full Home Deep Cleaning & Sanitization"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple outline-none"
          />
        </div>

        {/* CATEGORY & SUBCATEGORY — dynamic dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Category *</label>
            {availableCategories.length > 0 ? (
              <select
                required
                value={category}
                onChange={handleCategoryChange}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple outline-none"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Loading categories..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs outline-none"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Sub Category</label>
            {availableSubcategories.length > 0 ? (
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple outline-none"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. General"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs outline-none"
              />
            )}
          </div>
        </div>

        {/* PRICE & IMAGE URL */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Starting Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 499"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Service Details / Description</label>
          <textarea
            rows={3}
            placeholder="Describe what's included in this service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs outline-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface border border-border rounded-xl font-bold text-xs text-text-secondary hover:bg-surface-secondary transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1.5 hover:brightness-110"
          >
            <FiPlus size={13} />
            {isLoading ? 'Creating...' : 'Create & Select Service'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
