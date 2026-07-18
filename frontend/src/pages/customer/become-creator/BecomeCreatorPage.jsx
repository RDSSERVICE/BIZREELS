import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiVideo, FiUser, FiCamera, FiDollarSign, FiMapPin, FiGlobe, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAddRoleMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function BecomeCreatorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [addRoleApi] = useAddRoleMutation();
  const [loading, setLoading] = useState(false);

  const [creatorName, setCreatorName] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [experienceYears, setExperienceYears] = useState('2');
  const [city, setCity] = useState('Mumbai');
  const [travelAvailable, setTravelAvailable] = useState('Yes');
  const [categories, setCategories] = useState(['Fashion', 'Electronics']);

  const [reelPrice1, setReelPrice1] = useState('500');
  const [reelPrice3, setReelPrice3] = useState('1200');
  const [reelPrice10, setReelPrice10] = useState('3500');
  const [hourlyRate, setHourlyRate] = useState('1000');

  const categoryOptions = [
    'Fashion', 'Electronics', 'Jewellery', 'Furniture',
    'Restaurant', 'Hotel', 'Education', 'Property',
    'Automobile', 'Agriculture'
  ];

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!creatorName || !bio) {
      toast.error('Please enter name and creator bio');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorProfile: {
            name: creatorName,
            bio,
            languages,
            experienceYears,
            city,
            travelAvailable: travelAvailable === 'Yes',
            categories,
            pricing: {
              oneReel: Number(reelPrice1),
              threeReels: Number(reelPrice3),
              tenReels: Number(reelPrice10),
              hourlyRate: Number(hourlyRate)
            },
            availabilityStatus: 'Available',
            createdAt: new Date().toISOString()
          }
        })
      });

      const roleRes = await addRoleApi({ role: 'creator' }).unwrap();
      dispatch(setCredentials({ user: roleRes.user || roleRes.data?.user }));

      toast.success('Congratulations! Your Creator Profile is active!');
      navigate('/creator/dashboard');
    } catch (err) {
      toast.error('Failed to register creator profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/40 shadow-glass text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl gradient-brand mx-auto flex items-center justify-center text-white shadow-premium">
          <FiVideo size={28} />
        </div>
        <h2 className="text-2xl font-black text-text-primary font-display">Become a Creator / Influencer</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          Create paid promotional reels, video ads, or AI avatar content for local vendors and monetize your portfolio.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/40 shadow-glass">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
              <FiUser className="text-brand-purple" />
              <span>Creator Profile & Bio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Creator / Stage Name *</label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Alex Media Studios"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">City / Base Location</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Hindi, Marathi"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="2"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Available for Outstation Travel?</label>
                <select
                  value={travelAvailable}
                  onChange={(e) => setTravelAvailable(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
                >
                  <option value="Yes">Yes, Available to Travel</option>
                  <option value="No">No, Local City Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Creator Bio & Pitch *</label>
              <textarea
                required
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Introduce yourself, your content style, equipment, audience demographics, and specialty..."
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2">
              Select Categories You Cover
            </h3>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                      selected
                        ? 'bg-brand-purple/20 border-brand-purple text-brand-purple font-bold'
                        : 'glass border-border text-text-secondary hover:border-brand-purple/40'
                    }`}
                  >
                    {selected && <FiCheck size={12} />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
              <FiDollarSign className="text-emerald-500" />
              <span>Set Your Custom Pricing Packages</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">1 Reel Rate (₹)</label>
                <input
                  type="number"
                  value={reelPrice1}
                  onChange={(e) => setReelPrice1(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">3 Reels Rate (₹)</label>
                <input
                  type="number"
                  value={reelPrice3}
                  onChange={(e) => setReelPrice3(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">10 Reels Rate (₹)</label>
                <input
                  type="number"
                  value={reelPrice10}
                  onChange={(e) => setReelPrice10(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl btn-brand font-black text-xs shadow-premium flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Activating Creator Profile...' : 'Complete Creator Registration'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
