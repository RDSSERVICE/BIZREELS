import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiSliders,
  FiStar,
  FiUser,
  FiCpu,
  FiSettings,
  FiDollarSign,
  FiBriefcase,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useProposeHireMutation } from '../features/creator/marketplaceApi';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

// Mock list of premium creators for marketplace discover indexing
const MOCK_CREATORS = [
  {
    _id: 'creator_001',
    name: 'Anjali Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    creatorProfile: {
      bio: 'Fashion and lifestyle vertical reels producer. Collaborated with 50+ local apparel brands to boost conversion rates.',
      skills: ['Fashion Video', 'Store Walkthrough', 'Voiceovers'],
      rating: 4.9,
      totalReviews: 24,
      pricingTiers: [
        { label: 'Basic Reel', price: 2000, deliverables: '1 vertical video edit', deliveryDays: 3 },
        { label: 'Standard Bundle', price: 5000, deliverables: '3 vertical videos edits', deliveryDays: 7 },
      ],
    },
  },
  {
    _id: 'creator_002',
    name: 'Kabir Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    creatorProfile: {
      bio: 'Food influencer and cafe review strategist. I create aesthetic reels driving footfall to local bistros.',
      skills: ['Food Review', 'Cinematic Edits', 'Storytelling'],
      rating: 4.8,
      totalReviews: 18,
      pricingTiers: [
        { label: 'Short Cafe Reel', price: 1500, deliverables: '1 vertical video', deliveryDays: 2 },
        { label: 'Promo Bundle', price: 4000, deliverables: '2 aesthetic videos + scripts', deliveryDays: 5 },
      ],
    },
  },
  {
    _id: 'creator_003',
    name: 'Nisha Gupta',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    creatorProfile: {
      bio: 'Tech reviews and local store unboxing creator. Making high-engagement gadget reels matching Gen Z vibes.',
      skills: ['Tech Unboxing', 'Reels script', 'Sponsor integrations'],
      rating: 4.7,
      totalReviews: 12,
      pricingTiers: [
        { label: 'Standard Unbox', price: 3000, deliverables: '1 high quality unbox video', deliveryDays: 4 },
      ],
    },
  },
];

const CreatorMarketplace = () => {
  const user = useSelector(selectCurrentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSkill, setActiveSkill] = useState('All');
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Hire Propose Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('5');

  const [proposeHire, { isLoading: isSubmitting }] = useProposeHireMutation();

  const handleOpenHire = (creator) => {
    setSelectedCreator(creator);
    setBudget(creator.creatorProfile?.pricingTiers?.[0]?.price || '2000');
    setTitle('');
    setDescription('');
    setShowHireModal(true);
  };

  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!title || !budget || !deliveryDays || !description) {
      return toast.error('Please enter all required fields.');
    }

    if (user?.walletBalance < parseFloat(budget)) {
      return toast.error('Insufficient wallet balance to hire. Recharge your wallet first.');
    }

    try {
      await proposeHire({
        creatorId: selectedCreator._id,
        title,
        description,
        budget: parseFloat(budget),
        deliveryDays: parseInt(deliveryDays, 10),
      }).unwrap();

      toast.success('Campaign proposed to creator successfully!');
      setShowHireModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit proposal.');
    }
  };

  // Filter creators list based on search and skill tabs
  const filteredCreators = MOCK_CREATORS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.creatorProfile.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = activeSkill === 'All' || c.creatorProfile.skills.includes(activeSkill);
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* ── Header discovery search ── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-4">
        <h2 className="text-2xl font-black text-brand-navy font-display">
          Creators <span className="gradient-text font-black">Marketplace</span>
        </h2>
        <p className="text-xs text-text-tertiary">
          Browse local content creators, discover vertical reels creators, review pricing bundles, and propose collaborations.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
            <input
              type="text"
              placeholder="Search creators bio, name, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface-secondary/70 border border-border focus:border-brand-purple rounded-premium text-sm focus:outline-none"
            />
          </div>

          <div className="flex bg-surface-secondary/70 p-1 rounded-premium gap-1 border border-border">
            {['All', 'Fashion Video', 'Food Review', 'Tech Unboxing'].map((skill) => (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                className={`px-3 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer
                  ${activeSkill === skill 
                    ? 'bg-white text-brand-purple shadow-sm' 
                    : 'text-text-secondary hover:text-brand-purple'
                  }
                `}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Creators Grid Viewports ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <motion.div
            key={creator._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-5 rounded-premium border-white/50 shadow-glass hover:shadow-premium transition-all flex flex-col gap-4"
          >
            {/* Header info */}
            <div className="flex items-center gap-3">
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="w-12 h-12 rounded-full object-cover border border-brand-purple/20"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-brand-navy font-display">
                  {creator.name}
                </span>
                <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                  <FiStar className="text-brand-orange fill-brand-orange" />
                  {creator.creatorProfile.rating} ({creator.creatorProfile.totalReviews} reviews)
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
              {creator.creatorProfile.bio}
            </p>

            {/* Skills chips */}
            <div className="flex flex-wrap gap-1">
              {creator.creatorProfile.skills.map((skill, index) => (
                <span key={index} className="px-2 py-0.5 text-[9px] font-bold bg-brand-purple/10 text-brand-purple rounded">
                  {skill}
                </span>
              ))}
            </div>

            {/* Pricing bundles preview */}
            <div className="bg-surface-secondary/55 p-3 rounded-premium border border-border-light flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-brand-purple">Pricing Packages</span>
              {creator.creatorProfile.pricingTiers.map((tier, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-navy">{tier.label}</span>
                  <span className="font-black text-brand-pink">₹{tier.price}</span>
                </div>
              ))}
            </div>

            {/* Hire Trigger */}
            <Button
              onClick={() => handleOpenHire(creator)}
              variant="primary"
              className="text-xs py-2 w-full mt-2 cursor-pointer"
            >
              Hire Creator
            </Button>
          </motion.div>
        ))}
      </div>

      {/* ── Hire Campaign Proposals Modal ── */}
      <AnimatePresence>
        {showHireModal && selectedCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-navy-dark/40 backdrop-blur-xs" onClick={() => setShowHireModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-premium shadow-modal border border-border w-full max-w-md p-6 z-10 relative flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-navy font-display">Propose Collaboration Offer</h3>
                <button onClick={() => setShowHireModal(false)} className="p-1 hover:bg-surface-secondary rounded-full text-text-secondary cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-text-tertiary">
                Hiring Creator: <span className="font-bold text-brand-navy">{selectedCreator.name}</span>. Escrow budget cost checks will deduct credentials.
              </p>

              <form onSubmit={handleSendProposal} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Campaign Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Winter Jacket Promo Reel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Proposed Budget (₹) *</label>
                    <input
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Estimated Days Timeline *</label>
                    <input
                      type="number"
                      required
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Proposal Brief Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about campaign criteria, script requirements, or target formats..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHireModal(false)}
                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary rounded-premium"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isSubmitting} variant="primary" className="text-xs py-2 px-5 cursor-pointer">
                    {isSubmitting ? 'Sending Offer...' : 'Send Proposal'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatorMarketplace;
