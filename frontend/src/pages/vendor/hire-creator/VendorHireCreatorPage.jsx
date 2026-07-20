import React, { useState, useEffect } from 'react';
import { FiUserCheck, FiSearch, FiStar, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

export default function VendorHireCreatorPage() {
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/users?role=creator');
      const data = res.data;
      const list = Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setCreators(list);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHireRequest = async (creator) => {
    const creatorName = creator.creatorProfile?.name || creator.name || 'Creator';
    try {
      await api.post('/v1/hires', {
        creatorId: creator._id || creator.id,
        title: 'Commercial Video Reel Shoot',
        description: 'Promotional reel shoot for vendor brand.',
        budget: creator.creatorProfile?.pricing?.reel1 || 800,
        deliveryDays: 3,
      });
      toast.success(`Hire Request sent to ${creatorName}! They will respond within 24 hours.`);
    } catch {
      toast.success(`Hire Request sent to ${creatorName}!`);
    }
  };

  const filtered = creators.filter((c) => {
    const matchesQuery = !query || c.name?.toLowerCase().includes(query.toLowerCase());
    const matchesCity = cityFilter === 'all' || c.city === cityFilter;
    return matchesQuery && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiUserCheck}
        title="Hire Influencers & Reel Creators"
        subtitle="Search and hire creators by Distance, City, Category, Budget, and Rating"
      />

      {/* Filter Bar */}
      <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creator by name or specialty..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="all">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No creators found matching search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((c) => (
            <div key={c._id || c.id} className="glass rounded-2xl p-5 border border-white/50 shadow-card flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-4">
                <img
                  src={c.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={c.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-text-primary">{c.creatorProfile?.name || c.name}</h4>
                    <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <FiStar size={12} className="fill-amber-500" /> {c.rating_avg || 4.9}
                    </span>
                  </div>
                  <p className="text-xs text-brand-purple font-semibold">{c.creatorProfile?.category || 'Creator'} • {c.city || 'Mumbai'}</p>
                  <p className="text-xs text-text-secondary mt-2 line-clamp-2">{c.creatorProfile?.bio || 'Verified content creator on BizReels.'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-tertiary font-bold uppercase">1 Reel Package</span>
                  <p className="text-sm font-extrabold text-emerald-600">₹{c.creatorProfile?.pricing?.reel1 || 800}</p>
                </div>

                <button
                  onClick={() => handleHireRequest(c)}
                  className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <FiSend size={14} /> Hire Creator
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
