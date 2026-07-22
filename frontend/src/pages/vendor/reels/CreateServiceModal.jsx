import React, { useState } from 'react';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useCreateListingMutation } from '../../../features/vendor/vendorApi';
import { FiPlus, FiTag, FiFileText, FiDollarSign, FiImage } from 'react-icons/fi';

export default function CreateServiceModal({ isOpen, onClose, initialCategory, initialSubcategory, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory || 'Home Services');
  const [subcategory, setSubcategory] = useState(initialSubcategory || 'Electrician');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [createListing, { isLoading }] = useCreateListingMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price || !category) {
      return toast.error('Please fill in Service Title, Price, and Category.');
    }

    const toastId = toast.loading('Creating new Service listing...');
    try {
      const res = await createListing({
        type: 'service',
        title,
        category,
        subcategory: subcategory || 'General',
        price: parseFloat(price) || 0,
        description,
        images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'],
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

        <div>
          <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Service Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Full Home Deep Cleaning & Sanitization"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Category *</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Sub Category</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
            />
          </div>
        </div>

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
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Service Details / Description</label>
          <textarea
            rows={3}
            placeholder="Describe what's included in this service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface border border-border rounded-xl font-bold text-xs text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium"
          >
            {isLoading ? 'Creating...' : 'Create & Select Service'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
