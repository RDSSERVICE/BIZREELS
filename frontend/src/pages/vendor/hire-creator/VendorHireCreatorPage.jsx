import React, { useState } from 'react';
import { FiUserCheck, FiSearch, FiSliders, FiMapPin, FiStar, FiDollarSign, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorHireCreatorPage() {
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [maxBudget, setMaxBudget] = useState(5000);

  const mockCreators = [
    {
      id: 'c1',
      name: 'Rohan Verma (Rohan Media)',
      city: 'Mumbai',
      distanceKm: 4.2,
      category: 'Fashion',
      rating: 4.9,
      bio: 'Fashion & Lifestyle Content Creator. 100k+ reach across Instagram & YouTube.',
      pricing: { oneReel: 800, threeReels: 2100 },
      travelAvailable: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c2',
      name: 'Ananya Tech Reviews',
      city: 'Delhi',
      distanceKm: 12.0,
      category: 'Electronics',
      rating: 4.8,
      bio: 'Gadget reviewer & tech video ad generator. High converting reel ads.',
      pricing: { oneReel: 1200, threeReels: 3000 },
      travelAvailable: false,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const handleHireRequest = (creatorName) => {
    toast.success(`Hire Request sent to ${creatorName}! They will respond within 24 hours.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiUserCheck className="text-pink-400" />
            <span>Hire Influencers & Reel Creators</span>
          </h2>
          <p className="text-xs text-slate-400">Search and hire creators by Distance, City, Category, Budget, and Rating</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creator by name or specialty..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="Fashion">Fashion</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Restaurant">Restaurant</option>
          </select>
        </div>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCreators.map((c) => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <img src={c.image} alt={c.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">{c.name}</h4>
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <FiStar size={12} className="fill-amber-400" /> {c.rating}
                  </span>
                </div>
                <p className="text-xs text-pink-400 font-semibold">{c.category} • {c.city} ({c.distanceKm} km away)</p>
                <p className="text-xs text-slate-300 mt-2 line-clamp-2">{c.bio}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold">1 Reel Package</span>
                <p className="text-sm font-extrabold text-emerald-400">₹{c.pricing.oneReel}</p>
              </div>

              <button
                onClick={() => handleHireRequest(c.name)}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <FiSend size={14} />
                <span>Hire Creator</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
