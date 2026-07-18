import React, { useState, useEffect } from 'react';
import { FiSearch, FiSliders, FiMapPin, FiStar, FiShoppingBag, FiTool, FiPhone, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Bar Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiSearch className="text-indigo-400" />
          <span>Search Products & Services Nearby</span>
        </h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name, service, brand, or keyword..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="product">Products Only</option>
              <option value="service">Services Only</option>
            </select>

            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-indigo-400 font-semibold focus:outline-none"
            >
              <option value="5">Within 5 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
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
            <span className="font-semibold text-slate-300">Max Price: ₹{maxPrice.toLocaleString()}</span>
            <input
              type="range"
              min={1000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-indigo-500 cursor-pointer w-32"
            />
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Searching listings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
          No listings match your search criteria. Try adjusting filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col">
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-400 uppercase border border-slate-800 flex items-center gap-1">
                  {item.type === 'service' ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                  {item.type}
                </div>
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-slate-800">
                  {item.distanceKm} km away
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{item.category}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <FiStar size={12} className="fill-amber-400" />
                      {item.rating}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <FiMapPin size={12} className="text-pink-500" />
                    {item.vendorName} ({item.city})
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-base font-extrabold text-white">
                    ₹{item.price?.toLocaleString()}
                  </div>

                  <button
                    onClick={() => toast.success(`Inquiry sent to ${item.vendorName}!`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
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
