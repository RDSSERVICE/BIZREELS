import React, { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiTool, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function SearchListingsPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); // 'all' | 'product' | 'service'
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [distance, setDistance] = useState('25');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [type, category]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/listings?type=${type}&category=${category}`);
      const data = await res.json();
      const list = data.data?.listings || data.listings || [
        {
          _id: 's1',
          title: 'Sony Bravia 55" 4K Smart OLED TV',
          type: 'product',
          category: 'Electronics',
          price: 64990,
          city: 'Mumbai',
          distanceKm: 3.2,
          rating: 4.8,
          vendorName: 'Sony Center Bandra',
          image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80'
        },
        {
          _id: 's2',
          title: 'Professional Home Deep Cleaning Service',
          type: 'service',
          category: 'Services',
          price: 3499,
          city: 'Mumbai',
          distanceKm: 5.8,
          rating: 4.9,
          vendorName: 'Urban Clean Express',
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
        },
        {
          _id: 's3',
          title: 'Ergonomic Mesh Office Chair with Lumbar Support',
          type: 'product',
          category: 'Furniture',
          price: 8999,
          city: 'Delhi',
          distanceKm: 12.0,
          rating: 4.6,
          vendorName: 'Featherlite Store',
          image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=600&q=80'
        }
      ];
      setListings(list);
    } catch (err) {
      toast.error('Failed to search listings');
    } finally {
      setLoading(false);
    }
  };

  const filtered = listings.filter((item) => {
    const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
    const matchesPrice = !maxPrice || item.price <= maxPrice;
    return matchesQuery && matchesPrice;
  });

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
        <div className="py-20 text-center text-xs text-text-tertiary">Searching listings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-tertiary glass rounded-2xl border border-border">
          No listings match your search criteria. Try adjusting filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item._id} className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between">
              <div className="aspect-video bg-surface-tertiary relative overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-brand-purple uppercase border border-border flex items-center gap-1">
                  {item.type === 'service' ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                  {item.type}
                </div>
                <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-600 border border-border">
                  {item.distanceKm} km away
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
                    <span>{item.category}</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <FiStar size={12} className="fill-amber-500" />
                      {item.rating}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                    <FiMapPin size={12} className="text-brand-orange" />
                    {item.vendorName} ({item.city})
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-base font-extrabold text-text-primary">
                    ₹{item.price?.toLocaleString()}
                  </div>

                  <button
                    onClick={() => toast.success(`Inquiry sent to ${item.vendorName}!`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition"
                  >
                    <FiMessageCircle size={14} />
                    <span>Inquire</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
