import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiUser,
  FiTrendingUp,
  FiLayers,
  FiBriefcase,
  FiCheckCircle,
  FiCalendar,
  FiStar,
  FiPlus,
  FiHeart
} from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const CreatorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('portfolio'); // portfolio | hires | analytics
  const [bio, setBio] = useState(user?.creatorProfile?.bio || 'Professional content creator specializing in reels campaigns.');
  const [availability, setAvailability] = useState(user?.creatorProfile?.availability || 'available');
  const [skills, setSkills] = useState((user?.creatorProfile?.skills || ['Reels Video', 'UGC Content', 'Fashion']).join(', '));
  const [pricingTiers, setPricingTiers] = useState(
    user?.creatorProfile?.pricingTiers || [
      { label: 'Basic Reel', price: 1500, deliverables: '1 vertical video edit', deliveryDays: 3 },
      { label: 'Standard Bundle', price: 4000, deliverables: '3 vertical videos edits', deliveryDays: 7 },
      { label: 'Brand Takeover', price: 10000, deliverables: '5 high quality videos, scripts + reels boost setup', deliveryDays: 14 }
    ]
  );

  // Mock notifications list or hire briefs
  const [hireRequests, setHireRequests] = useState([
    {
      _id: 'req_01',
      businessName: 'Electra Store',
      title: 'Smartphone Unboxing campaign',
      description: 'Need a premium 30-sec unboxing reel targeting tech enthusiasts in city area.',
      budget: 3500,
      deliveryDays: 5,
      status: 'pending',
    },
    {
      _id: 'req_02',
      businessName: 'The Glow Spa',
      title: 'Facial treatment promo',
      description: 'Looking for a wellness influencer to review our treatment and visit our local store.',
      budget: 5000,
      deliveryDays: 7,
      status: 'pending',
    }
  ]);

  const handleUpdatePortfolio = (e) => {
    e.preventDefault();
    toast.success('Creator portfolio updated successfully!');
  };

  const handleHireAction = (reqId, action) => {
    setHireRequests(prev =>
      prev.map(r => r._id === reqId ? { ...r, status: action } : r)
    );
    toast.success(`Request marked as ${action.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* ── Page Header / Action tabs ───────────────────────────── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy font-display">
            Creator Studio Space
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Build your media portfolio, manage commissions pricing, and accept vendor briefs.
          </p>
        </div>

        <div className="flex gap-2">
          {['portfolio', 'hires', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-premium text-xs font-bold capitalize transition-all border cursor-pointer
                ${activeTab === tab
                  ? 'bg-brand-purple text-white border-brand-purple shadow-premium'
                  : 'bg-white text-text-secondary border-border hover:text-brand-purple'
                }
              `}
            >
              {tab === 'hires' ? 'Hire Requests' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Creator Quick Metrics ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Followers count', val: user?.followersCount || 240, color: 'text-brand-purple', icon: FiUser },
          { label: 'Profile Views', val: '1.2k', color: 'text-brand-pink', icon: FiTrendingUp },
          { label: 'Avg Rating', val: user?.creatorProfile?.rating || '4.8', color: 'text-brand-orange', icon: FiStar },
          { label: 'Studio Status', val: availability.toUpperCase(), color: availability === 'available' ? 'text-success' : 'text-error', icon: FiCalendar },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass p-5 rounded-premium border-white/50 shadow-glass flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{stat.label}</span>
                <span className={`text-xl font-black mt-1 font-display ${stat.color}`}>{stat.val}</span>
              </div>
              <div className="p-3 bg-surface-secondary rounded-premium">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tab Viewports ───────────────────────────────────────── */}
      <div className="w-full">
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Editor */}
            <div className="lg:col-span-2 glass p-6 rounded-premium border-white/50 shadow-glass">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider border-b border-border pb-3 mb-4">
                Configure Creator Profile
              </h3>

              <form onSubmit={handleUpdatePortfolio} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Skills Tags (comma separated)</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Availability Status</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    >
                      <option value="available">Available for Hires</option>
                      <option value="busy">Busy / Active Projects</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Bio Proposal</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none resize-none"
                  />
                </div>

                {/* pricing tiers grid */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-brand-navy">Configure Package pricing</label>
                  
                  {pricingTiers.map((tier, idx) => (
                    <div key={idx} className="bg-surface-secondary p-4 rounded-premium border border-border flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-brand-purple uppercase">{tier.label}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-text-tertiary">Price (₹)</label>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => {
                              const updated = [...pricingTiers];
                              updated[idx].price = parseInt(e.target.value);
                              setPricingTiers(updated);
                            }}
                            className="p-1.5 bg-white border border-border rounded text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-text-tertiary">Delivery Time (days)</label>
                          <input
                            type="number"
                            value={tier.deliveryDays}
                            onChange={(e) => {
                              const updated = [...pricingTiers];
                              updated[idx].deliveryDays = parseInt(e.target.value);
                              setPricingTiers(updated);
                            }}
                            className="p-1.5 bg-white border border-border rounded text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-1">
                          <label className="text-[10px] text-text-tertiary">Deliverables brief</label>
                          <input
                            type="text"
                            value={tier.deliverables}
                            onChange={(e) => {
                              const updated = [...pricingTiers];
                              updated[idx].deliverables = e.target.value;
                              setPricingTiers(updated);
                            }}
                            className="p-1.5 bg-white border border-border rounded text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-2">
                  <Button type="submit" variant="primary" className="text-xs py-2.5 px-6 cursor-pointer">
                    Save Portfolio Settings
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar sample preview */}
            <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-4 self-start">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Portfolio Preview</h3>
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatarUrl || 'https://via.placeholder.com/150'}
                  alt={user?.name}
                  className="w-12 h-12 rounded-full border border-brand-purple object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-navy">@{user?.name}</span>
                  <span className="text-[10px] font-bold text-brand-purple">Local Creator</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/55 p-3 rounded-premium border border-border-light">
                {bio}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {skills.split(',').map((skill, index) => (
                  <span key={index} className="px-2 py-0.5 text-[9px] font-bold bg-brand-pink/10 text-brand-pink rounded">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hires' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5 px-1">
              <FiLayers className="text-brand-pink" /> Vendor Hire Requests Campaign
            </h3>

            <div className="flex flex-col gap-3">
              {hireRequests.map((req) => (
                <div key={req._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-premium transition-all">
                  <div className="flex flex-col gap-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-purple">{req.businessName}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-pink/10 text-brand-pink rounded-full">
                        Offer
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-brand-navy font-display mt-1">{req.title}</h4>
                    <p className="text-xs text-text-secondary">{req.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-text-tertiary block">Proposed Offer</span>
                      <span className="text-sm font-black text-brand-navy">₹{req.budget}</span>
                      <span className="text-[9px] text-text-tertiary block mt-0.5">{req.deliveryDays} days deadline</span>
                    </div>
                    
                    {req.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHireAction(req._id, 'rejected')}
                          className="px-3 py-1.5 text-xs font-bold text-error border border-error/20 rounded hover:bg-error-light/10 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleHireAction(req._id, 'accepted')}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-brand-purple rounded shadow-sm hover:bg-brand-purple-800 transition-all cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs font-bold rounded capitalize
                        ${req.status === 'accepted' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}
                      `}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="glass p-8 rounded-premium border-white/50 shadow-glass flex flex-col items-center justify-center text-center gap-2 py-16">
            <FiTrendingUp className="w-10 h-10 text-brand-purple animate-pulse" />
            <h4 className="text-sm font-bold text-brand-navy mt-2 uppercase tracking-wider">Metrics and Sponsorship Insights</h4>
            <p className="text-xs text-text-secondary max-w-xs">
              Reels view insights, sponsor referrals count, and wallet transactions logs are updating in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;
