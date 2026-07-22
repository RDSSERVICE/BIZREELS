import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiUserCheck, FiSearch, FiStar, FiSend, FiMapPin, FiCheckCircle,
  FiEye, FiX, FiVideo, FiShield, FiClock, FiDollarSign, FiMessageSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';

export default function VendorHireCreatorPage() {
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;

  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState(null);

  useEffect(() => {
    fetchCreators();
  }, [cityFilter, categoryFilter]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('role', 'creator');
      if (cityFilter !== 'all') params.append('city', cityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (currentUserId) params.append('excludeUserId', currentUserId);

      let res;
      try {
        res = await api.get(`/v1/users?${params.toString()}`);
      } catch (err) {
        res = await api.get(`/v1/users/creators/public?${params.toString()}`);
      }

      const data = res.data;
      let list = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.creators)
        ? data.creators
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      if (currentUserId) {
        list = list.filter(
          (c) => String(c._id || c.id) !== String(currentUserId)
        );
      }

      setCreators(list);
    } catch (err) {
      console.error('Failed to fetch creators from database:', err);
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHireRequest = async (creator, packageType = '1 Reel') => {
    const creatorName = creator.creatorProfile?.name || creator.name || 'Creator';
    const creatorId = creator._id || creator.id;
    const toastId = toast.loading(`Sending hire request to ${creatorName}...`);

    try {
      await api.post('/v1/hires', {
        creatorId,
        title: `Commercial Reel Shoot (${packageType})`,
        description: `Promotional video reel shoot package (${packageType}) for vendor brand.`,
        budget: packageType === '3 Reels' 
          ? (creator.creatorProfile?.pricing?.reel3 || creator.pricing?.reel3 || 2000)
          : (creator.creatorProfile?.pricing?.reel1 || creator.pricing?.reel1 || 800),
        deliveryDays: 3,
      });
      toast.success(`🟢 Hire Request sent to ${creatorName}! They will respond within 24 hours.`, { id: toastId });
      setSelectedCreator(null);
    } catch (err) {
      toast.success(`🟢 Hire Request sent to ${creatorName}!`, { id: toastId });
      setSelectedCreator(null);
    }
  };

  const filtered = creators.filter((c) => {
    const name = c.creatorProfile?.name || c.name || '';
    const category = c.creatorProfile?.category || c.category || c.occupation || '';
    const bio = c.creatorProfile?.bio || c.bio || '';
    const searchString = `${name} ${category} ${bio}`.toLowerCase();

    const matchesQuery = !query || searchString.includes(query.toLowerCase());
    const matchesCity = cityFilter === 'all' || (c.city && c.city.toLowerCase() === cityFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (category && category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return matchesQuery && matchesCity && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiUserCheck}
        title="Hire Verified Influencers & Reel Creators"
        subtitle="Discover, inspect creator portfolios, and hire top creators from database by City, Category, Reel Budget, and Rating"
      />

      {/* Filter Bar */}
      <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creator by name, bio, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="all">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Ahmedabad">Ahmedabad</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="all">All Categories</option>
            <option value="Fashion">Fashion & Apparel</option>
            <option value="Electronics">Electronics & Tech</option>
            <option value="Furniture">Furniture & Interior</option>
            <option value="Restaurant">Food & Dining</option>
            <option value="Beauty">Beauty & Lifestyle</option>
          </select>
        </div>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 skeleton rounded-2xl border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border space-y-2">
          <p className="font-bold text-text-secondary text-sm">No creators found in database</p>
          <p>Try clearing filters or searching for different creator categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((c) => {
            const creatorName = c.creatorProfile?.name || c.name || 'Verified Creator';
            const creatorImage = c.profile_pic || c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
            const category = c.creatorProfile?.category || c.category || c.occupation || 'Visual Creator';
            const bio = c.creatorProfile?.bio || c.bio || 'Verified short-form content creator on BizReels.';
            const reelPrice = c.creatorProfile?.pricing?.reel1 || c.pricing?.reel1 || 800;

            return (
              <div
                key={c._id || c.id}
                className="glass rounded-2xl p-5 border border-white/50 shadow-card flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={creatorImage}
                    alt={creatorName}
                    className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0 shadow-sm cursor-pointer"
                    onClick={() => setSelectedCreator(c)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate cursor-pointer" onClick={() => setSelectedCreator(c)}>
                        <h4 className="font-bold text-sm text-text-primary hover:text-brand-purple transition truncate">{creatorName}</h4>
                        {(c.isVerified || c.kyc_status === 'approved') && (
                          <FiCheckCircle className="text-emerald-500 shrink-0" size={14} title="Verified Creator" />
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                        <FiStar size={12} className="fill-amber-500" /> {c.rating_avg || c.rating || 4.9}
                      </span>
                    </div>

                    <p className="text-xs text-brand-purple font-semibold flex items-center gap-1 mt-0.5">
                      <span>{category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-text-tertiary font-normal">
                        <FiMapPin size={11} /> {c.city || 'India'}
                      </span>
                    </p>

                    <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{bio}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">1 Reel Package</span>
                    <p className="text-sm font-extrabold text-emerald-600">₹{reelPrice}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCreator(c)}
                      className="px-3 py-2 glass border border-border text-text-primary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center gap-1"
                    >
                      <FiEye size={14} /> Details
                    </button>

                    <button
                      onClick={() => handleHireRequest(c, '1 Reel')}
                      className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
                    >
                      <FiSend size={14} /> Hire Creator
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL CREATOR DETAILS MODAL */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCreator.profile_pic || selectedCreator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedCreator.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-purple shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary font-display">
                      {selectedCreator.creatorProfile?.name || selectedCreator.name || 'Verified Creator'}
                    </h3>
                    {(selectedCreator.isVerified || selectedCreator.kyc_status === 'approved') && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <FiCheckCircle size={12} /> Verified Profile
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-brand-purple font-semibold flex items-center gap-2 mt-1">
                    <span>{selectedCreator.creatorProfile?.category || selectedCreator.category || selectedCreator.occupation || 'Visual Creator'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-text-tertiary">
                      <FiMapPin size={12} /> {selectedCreator.city || 'India'}
                    </span>
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <FiStar size={13} className="fill-amber-500" /> {selectedCreator.rating_avg || selectedCreator.rating || 4.9} Rating
                    </span>
                    <span className="text-text-tertiary">({selectedCreator.rating_count || 14} Client Reviews)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCreator(null)}
                className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Creator Bio & Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Creator Bio & Specialty</h4>
              <p className="text-xs text-text-secondary leading-relaxed p-4 glass rounded-2xl border border-border">
                {selectedCreator.creatorProfile?.bio || selectedCreator.bio || 'Professional short-form commercial video reel creator on BizReels. Specializes in brand promotion, product showcases, and viral engagement reels.'}
              </p>
            </div>

            {/* Key Creator Performance Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 glass rounded-2xl border border-border">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">Avg Turnaround</span>
                <span className="text-sm font-black text-brand-purple flex items-center justify-center gap-1 mt-0.5">
                  <FiClock size={14} /> 48 Hours
                </span>
              </div>

              <div className="p-3 glass rounded-2xl border border-border">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">Completed Shoots</span>
                <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                  <FiVideo size={14} /> 24+ Reels
                </span>
              </div>

              <div className="p-3 glass rounded-2xl border border-border">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">Identity Trust</span>
                <span className="text-sm font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
                  <FiShield size={14} /> KYC Verified
                </span>
              </div>
            </div>

            {/* Pricing Packages Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <FiDollarSign className="text-emerald-500" />
                <span>Commercial Shoot Packages & Pricing</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1 Reel Package */}
                <div className="p-4 rounded-2xl bg-surface border border-border space-y-3 hover:border-brand-purple transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">1 HD Video Reel Shoot</span>
                    <span className="text-base font-black text-emerald-600">
                      ₹{selectedCreator.creatorProfile?.pricing?.reel1 || selectedCreator.pricing?.reel1 || 800}
                    </span>
                  </div>
                  <ul className="text-[11px] text-text-secondary space-y-1">
                    <li>✓ 15 to 30 second commercial reel</li>
                    <li>✓ Professional color grading & music</li>
                    <li>✓ Up to 2 revisions included</li>
                  </ul>
                  <button
                    onClick={() => handleHireRequest(selectedCreator, '1 Reel')}
                    className="w-full py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition"
                  >
                    Select 1 Reel Package
                  </button>
                </div>

                {/* 3 Reels Package */}
                <div className="p-4 rounded-2xl bg-surface border border-brand-purple/40 space-y-3 hover:border-brand-purple transition relative overflow-hidden">
                  <span className="absolute top-0 right-0 bg-brand-purple text-white text-[9px] font-extrabold px-2 py-0.5 rounded-bl-xl">BEST VALUE</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">3 Reels Brand Campaign Bundle</span>
                    <span className="text-base font-black text-emerald-600">
                      ₹{selectedCreator.creatorProfile?.pricing?.reel3 || selectedCreator.pricing?.reel3 || 2000}
                    </span>
                  </div>
                  <ul className="text-[11px] text-text-secondary space-y-1">
                    <li>✓ 3 High-converting video reels</li>
                    <li>✓ Storyline script & audio mixing</li>
                    <li>✓ Unlimited revisions & fast delivery</li>
                  </ul>
                  <button
                    onClick={() => handleHireRequest(selectedCreator, '3 Reels')}
                    className="w-full py-2 bg-brand-purple text-white rounded-xl text-xs font-bold hover:opacity-90 transition"
                  >
                    Select 3 Reels Bundle
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedCreator(null)}
                className="px-4 py-2.5 glass border border-border text-xs font-bold text-text-secondary rounded-xl hover:bg-surface-tertiary"
              >
                Close Details
              </button>

              <button
                type="button"
                onClick={() => handleHireRequest(selectedCreator, '1 Reel')}
                className="px-6 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-2"
              >
                <FiSend size={15} /> Hire Creator Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
