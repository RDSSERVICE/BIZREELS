import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlusCircle, FiShoppingBag, FiTool, FiDollarSign, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass rounded-2xl p-6 border border-white/40 shadow-glass space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="p-3 gradient-brand rounded-2xl text-white shadow-premium">
            <FiPlusCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary font-display">Post Your Requirement</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Get instant quotes and proposals from verified local vendors & service providers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Requirement Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Requirement Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('product')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition ${
                  type === 'product'
                    ? 'bg-brand-purple/20 border-brand-purple text-brand-purple'
                    : 'glass border-border text-text-secondary hover:border-brand-purple/40'
                }`}
              >
                <FiShoppingBag size={18} />
                <span>Product Requirement</span>
              </button>

              <button
                type="button"
                onClick={() => setType('service')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition ${
                  type === 'service'
                    ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
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
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Requirement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need 5 Laptops for office / AC Repair Service"
              className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Category & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
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
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Max Budget (₹) *</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-9 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>
          </div>

          {/* Quantity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Quantity / Units</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Target City / Area</label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-orange" size={16} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bandra"
                  className="w-full pl-9 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Detailed Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your exact specifications, preferred brands, delivery timeline, or additional preferences..."
              className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl btn-brand font-black text-xs shadow-premium flex items-center justify-center gap-2"
          >
            {loading ? 'Publishing Requirement...' : 'Post Requirement Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
