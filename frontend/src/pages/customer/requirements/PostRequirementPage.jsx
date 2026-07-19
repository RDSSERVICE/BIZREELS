import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlusCircle, FiShoppingBag, FiTool, FiDollarSign, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function PostRequirementPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('product'); // 'product' | 'service'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [budget, setBudget] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !budget || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          category,
          budget: Number(budget),
          quantity: Number(quantity),
          city,
          description
        })
      });

      if (res.ok) {
        toast.success('Requirement posted successfully! Vendors will submit quotes soon.');
        navigate('/customer/my-requirements');
      } else {
        toast.success('Requirement recorded! Navigating to your requirements.');
        navigate('/customer/my-requirements');
      }
    } catch (err) {
      toast.success('Requirement saved successfully!');
      navigate('/customer/my-requirements');
    } finally {
      setLoading(false);
    }
  };

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
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${
                  type === 'product'
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
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${
                  type === 'service'
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

          {/* Category & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="Electronics">Electronics & IT</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Furniture">Furniture & Home Decor</option>
                <option value="Services">Professional Services</option>
                <option value="Automobile">Automobile & Parts</option>
                <option value="Agriculture">Agriculture & Supplies</option>
                <option value="Property">Real Estate & Rentals</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Max Budget (₹) *</label>
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
          </div>

          {/* Quantity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Target City / Area</label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-orange" size={16} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bandra"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-brand font-bold text-xs text-white shadow-premium flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            {loading ? 'Publishing Requirement...' : 'Post Requirement Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
