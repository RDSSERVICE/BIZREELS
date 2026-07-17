import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiPlus, FiGrid, FiClock, FiActivity, FiDollarSign, FiZap, FiTarget } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const ReelBoostTab = ({ user }) => {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [boosts, setBoosts] = useState([
    { id: 'b-1', reelCaption: 'Premium leather shoes showcase 👞', views: '4.8K', clicks: 230, budget: 1500, remainingDays: 6, status: 'active', startDate: '2026-07-12', targetCategory: 'Fashion' },
    { id: 'b-2', reelCaption: 'Custom LED CCTV lighting installations ⚡', views: '1.2K', clicks: 84, budget: 1000, remainingDays: 2, status: 'active', startDate: '2026-07-14', targetCategory: 'Electronics' }
  ]);
  const [history, setHistory] = useState([
    { id: 'bh-1', reelCaption: 'Best CCTV store virtual tour 📹', views: '10.5K', clicks: 712, budget: 3000, status: 'completed', date: '2026-06-10' }
  ]);

  // Form states for buying new boost
  const [selectedReel, setSelectedReel] = useState('Premium leather shoes showcase 👞');
  const [targetAudience, setTargetAudience] = useState('Fashion & Apparel');
  const [boostDuration, setBoostDuration] = useState('7');
  const [boostBudget, setBoostBudget] = useState('1000');

  const handleBuyBoost = (e) => {
    e.preventDefault();
    if (!boostBudget || parseFloat(boostBudget) <= 0) {
      return toast.error('Please enter a valid budget.');
    }
    const newBoost = {
      id: `b-${Date.now()}`,
      reelCaption: selectedReel,
      views: '0',
      clicks: 0,
      budget: parseFloat(boostBudget),
      remainingDays: parseInt(boostDuration),
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      targetCategory: targetAudience
    };
    setBoosts([newBoost, ...boosts]);
    setShowBuyModal(false);
    toast.success('Reel Boost activated successfully!');
  };

  const handleRenewBoost = (boostId) => {
    setBoosts(prev => prev.map(b => {
      if (b.id === boostId) {
        toast.success(`Boost renewed successfully for ${b.reelCaption}!`);
        return { ...b, remainingDays: b.remainingDays + 7, budget: b.budget + 1000 };
      }
      return b;
    }));
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Reel Boost Campaigns</h3>
          <p className="text-xs text-slate-500 mt-1">Accelerate views and reach local buyers with smart sponsored algorithms.</p>
        </div>
        <Button
          onClick={() => setShowBuyModal(true)}
          variant="primary"
          className="flex items-center gap-2 text-xs py-2.5 px-5 cursor-pointer shrink-0 rounded-xl"
        >
          <FiZap className="w-4 h-4 text-brand-orange fill-brand-orange animate-bounce" /> Buy New Boost
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</span>
            <span className="text-2xl font-black text-brand-purple font-display mt-1">{boosts.filter(b => b.status === 'active').length}</span>
          </div>
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-xl">
            <FiActivity className="w-5 h-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Boost Budget</span>
            <span className="text-2xl font-black text-brand-pink font-display mt-1">₹{boosts.reduce((acc, curr) => acc + curr.budget, 0) + history.reduce((acc, curr) => acc + curr.budget, 0)}</span>
          </div>
          <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-xl">
            <FiDollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aggregated Boost Views</span>
            <span className="text-2xl font-black text-brand-orange font-display mt-1">16.5K</span>
          </div>
          <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
            <FiTrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Boost Campaigns */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Active Boosts</h4>
        {boosts.length === 0 ? (
          <div className="glass p-12 text-center text-slate-500 rounded-2xl border border-white/50 shadow-glass">
            No active boost campaigns. Accelerate sales by sponsoring a reel.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {boosts.map((boost) => (
              <div
                key={boost.id}
                className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-premium transition-all duration-300"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-lg border border-brand-purple/20">
                      {boost.targetCategory}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Started on {boost.startDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-navy font-display mt-1.5 truncate">{boost.reelCaption}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Views: <strong className="text-brand-navy">{boost.views}</strong></span>
                    <span>Clicks: <strong className="text-brand-navy">{boost.clicks}</strong></span>
                    <span>Budget: <strong className="text-brand-navy">₹{boost.budget}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Remaining Duration</span>
                    <span className="text-sm font-black text-brand-orange font-display">{boost.remainingDays} Days Left</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRenewBoost(boost.id)}
                    className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl shadow-premium hover:bg-brand-purple-800 transition-all cursor-pointer"
                  >
                    Renew Boost
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boost History */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Boost History</h4>
        <div className="glass rounded-2xl border border-white/50 shadow-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Campaign Target</th>
                  <th className="p-4">Completed Date</th>
                  <th className="p-4">Sponsor Budget</th>
                  <th className="p-4">Result Views</th>
                  <th className="p-4">Result Clicks</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-brand-navy max-w-[200px] truncate">{h.reelCaption}</td>
                    <td className="p-4">{h.date}</td>
                    <td className="p-4 font-bold text-brand-navy">₹{h.budget}</td>
                    <td className="p-4">{h.views}</td>
                    <td className="p-4">{h.clicks}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 shadow-sm">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buy Boost Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBuyModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-modal border border-slate-100 w-full max-w-md p-6 z-10 relative flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-brand-navy font-display flex items-center gap-2">
                  <FiZap className="w-5 h-5 text-brand-orange fill-brand-orange" /> Boost a Reel
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBuyBoost} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Select Reel to Boost *</label>
                  <select
                    value={selectedReel}
                    onChange={(e) => setSelectedReel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                  >
                    <option value="Premium leather shoes showcase 👞">Premium leather shoes showcase 👞</option>
                    <option value="Custom LED CCTV lighting installations ⚡">Custom LED CCTV lighting installations ⚡</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Target Audience Category *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Electronics & Tech">Electronics & Tech</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Duration (Days) *</label>
                    <select
                      value={boostDuration}
                      onChange={(e) => setBoostDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                    >
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                  <Input
                    label="Campaign Budget (₹) *"
                    type="number"
                    value={boostBudget}
                    onChange={(e) => setBoostBudget(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBuyModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                  >
                    Activate Boost
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

export default ReelBoostTab;
