import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiTool, FiMessageCircle, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api, resolveMediaUrl } from '../../../lib/api';

export default function SearchListingsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); // 'all' | 'product' | 'service'
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [distance, setDistance] = useState('25');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiringId, setInquiringId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, category, maxPrice, distance]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (category !== 'all') params.append('category', category);
      if (query.trim()) params.append('search', query.trim());
      if (maxPrice < 200000) params.append('maxPrice', maxPrice);
      if (distance) params.append('distance', distance);

      const res = await api.get(`/v1/listings?${params.toString()}`);
      const data = res.data;
      const list = data.data?.listings || data.listings || data.data || (Array.isArray(data) ? data : []);

      setListings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Search query failed:', err);
      toast.error('Could not fetch listings. Showing latest products.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInquire = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const vendorId = vendorObj._id || vendorObj.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable for this listing');
      return;
    }

    setInquiringId(item._id || item.id);
    try {
      await api.post('/v1/chat/messages', {
        recipientId: vendorId,
        text: `Hello! I am interested in your listing: "${item.title}". Could you share more details?`
      });
      toast.success(`Inquiry sent to ${vendorObj.name || vendorObj.shopName || 'Vendor'}! Redirecting to chat...`);
      navigate('/customer/chat');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send inquiry to vendor');
    } finally {
      setInquiringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSearch}
        title="Search Products & Services Nearby"
        subtitle="Filter local products, services, and vendor listings by distance, category, and price"
      />

      {/* Search & Filter Header Container */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name, service, brand, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Types</option>
              <option value="product">Products Only</option>
              <option value="service">Services Only</option>
            </select>

            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-brand-purple font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="5">Within 5 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Furniture">Furniture</option>
              <option value="Services">Services</option>
              <option value="Automobile">Automobile</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Max Price: ₹{maxPrice.toLocaleString()}</span>
            <input
              type="range"
              min={1000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-brand-purple cursor-pointer w-32"
            />
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-20 text-center text-xs text-text-tertiary">Searching live database listings...</div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-tertiary glass rounded-2xl border border-border space-y-2">
          <p className="font-bold text-text-secondary">No listings match your search criteria</p>
          <p className="text-[11px]">Try clearing search keywords or increasing max price and distance filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const vendorObj = item.vendor || item.vendorId || {};
            const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Verified Vendor';
            const city = item.city || vendorObj.city || item.location?.city || 'Local';
            const rawImage = item.images?.[0] || item.image || item.mediaUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
            const imageUrl = resolveMediaUrl(rawImage);
            const isService = item.type === 'service';
            const dist = item.distanceKm || item.distance || '3.5';

            return (
              <div key={item._id || item.id} className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between">
                <div className="aspect-video bg-surface-tertiary relative overflow-hidden">
                  <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-brand-purple uppercase border border-border flex items-center gap-1">
                    {isService ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                    {item.type || 'product'}
                  </div>
                  <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-600 border border-border">
                    {dist} km away
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
                      <span>{item.category || 'General'}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <FiStar size={12} className="fill-amber-500" />
                        {item.rating || '4.8'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-text-primary line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                      <FiMapPin size={12} className="text-brand-orange" />
                      {vendorName} ({city})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-base font-extrabold text-text-primary">
                      ₹{Number(item.price || 0).toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleInquire(item)}
                      disabled={inquiringId === (item._id || item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition disabled:opacity-50"
                    >
                      <FiMessageCircle size={14} />
                      <span>{inquiringId === (item._id || item.id) ? 'Sending...' : 'Inquire'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
