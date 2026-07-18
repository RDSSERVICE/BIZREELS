import React, { useState } from 'react';
import { useSearchCreatorsQuery, useProposeHireMutation } from './marketplaceApi';
import { FiSearch, FiSliders, FiUsers, FiStar, FiMapPin, FiDollarSign, FiPlus, FiX } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const VendorSideHireCreator = ({ user }) => {
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Search/Filter states
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchDistance, setSearchDistance] = useState(15);
  const [searchRating, setSearchRating] = useState('');

  // Propose Collab states
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [campaignDeliverables, setCampaignDeliverables] = useState('');

  // API Queries & Mutations
  const { data: creatorsRes, isLoading: isCreatorsLoading } = useSearchCreatorsQuery({
    city: searchCity || undefined,
    category: searchCategory || undefined,
    budget: searchBudget || undefined,
    rating: searchRating || undefined
  });
  const [proposeHire, { isLoading: isHiring }] = useProposeHireMutation();

  const creatorsList = creatorsRes?.data || [];

  const handleProposeHire = async (e) => {
    e.preventDefault();
    if (!campaignTitle || !campaignBudget) {
      return toast.error('Please enter campaign title and budget.');
    }
    try {
      await proposeHire({
        creatorId: selectedCreator._id,
        title: campaignTitle,
        budget: parseFloat(campaignBudget),
        deliverables: campaignDeliverables,
      }).unwrap();
      toast.success('Sponsorship contract proposed successfully!');
      setShowHireModal(false);
      setCampaignTitle('');
      setCampaignBudget('');
      setCampaignDeliverables('');
    } catch (err) {
      toast.error('Failed to propose contract.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Search Filter Header */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
          <FiSliders className="text-brand-purple" /> Filter Creator Marketplace
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <Input
            label="Search City"
            placeholder="e.g. Delhi"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-navy uppercase">Niche Category</label>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none h-[42px]"
            >
              <option value="">All Niches</option>
              <option value="Fashion">Fashion</option>
              <option value="Electronics">Electronics</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Restaurant">Restaurant</option>
            </select>
          </div>
          <Input
            label="Max Budget (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={searchBudget}
            onChange={(e) => setSearchBudget(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-navy uppercase">Min Rating</label>
            <select
              value={searchRating}
              onChange={(e) => setSearchRating(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none h-[42px]"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-brand-navy uppercase">
              <span>Distance</span>
              <span>{searchDistance} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={searchDistance}
              onChange={(e) => setSearchDistance(parseInt(e.target.value))}
              className="w-full accent-brand-purple h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* Creators Grid Listing */}
      {isCreatorsLoading ? (
        <div className="py-16 flex justify-center"><Loader /></div>
      ) : creatorsList.length === 0 ? (
        <div className="glass p-16 text-center text-slate-500 rounded-2xl border border-white/50 shadow-glass">
          No creators found matching these search criteria. Try relaxing your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatorsList.map((creator) => (
            <div
              key={creator._id}
              className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col justify-between gap-4 hover:shadow-premium transition-all duration-300"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={creator.avatarUrl || 'https://via.placeholder.com/80'}
                    alt={creator.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-sm font-bold text-brand-navy truncate">{creator.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <FiMapPin className="text-brand-purple" /> {creator.creatorProfile?.city || 'Delhi'} &bull; {searchDistance} km away
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-semibold">{creator.creatorProfile?.bio || 'Professional Reels Creator'}</p>
                
                <div className="flex gap-2 flex-wrap items-center mt-1">
                  {(creator.creatorProfile?.languages || ['English', 'Hindi']).slice(0, 2).map((lang, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded-lg">
                      {lang}
                    </span>
                  ))}
                  <div className="flex items-center gap-1 text-brand-orange font-bold text-[10px] ml-auto">
                    <FiStar className="fill-current w-3.5 h-3.5" />
                    <span>{creator.creatorProfile?.rating || '4.8'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Pricing starter</span>
                  <span className="text-xs font-black text-brand-navy">₹500 / Reel</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCreator(creator); setCampaignBudget('500'); setCampaignTitle(''); setCampaignDeliverables(''); setShowHireModal(true); }}
                  className="px-4 py-2 bg-brand-purple text-white hover:bg-brand-purple-800 text-xs font-bold rounded-xl transition-all shadow-premium cursor-pointer"
                >
                  Propose Hire
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Propose Sponsorship Modal */}
      <AnimatePresence>
        {showHireModal && selectedCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHireModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-modal border border-slate-100 w-full max-w-md p-6 z-10 relative flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-brand-navy font-display">Propose Reels Sponsorship</h3>
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Propose a video campaign contract with creator: <span className="font-bold text-brand-navy">{selectedCreator.name}</span></p>

              <form onSubmit={handleProposeHire} className="flex flex-col gap-4">
                <Input
                  label="Campaign Title *"
                  placeholder="e.g. Leather Shoe Ad Campaign"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  required
                />
                <Input
                  label="Campaign Budget (₹) *"
                  type="number"
                  placeholder="e.g. 5000"
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy uppercase">Deliverables Details</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 1 Instagram Reel within 5 days, raw files included"
                    value={campaignDeliverables}
                    onChange={(e) => setCampaignDeliverables(e.target.value)}
                    className="w-full p-3.5 bg-slate-50/50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHireModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isHiring}
                    variant="primary"
                    className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                  >
                    {isHiring ? 'Proposing...' : 'Propose Contract'}
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

export default VendorSideHireCreator;
