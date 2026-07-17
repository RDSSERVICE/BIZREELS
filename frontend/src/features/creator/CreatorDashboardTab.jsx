import React, { useState } from 'react';
import { FiGrid, FiUser, FiTrendingUp, FiStar, FiCalendar, FiLayers, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreatorDashboardTab = ({ user }) => {
  const [availability, setAvailability] = useState(user?.creatorProfile?.availability || 'available');

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

  const handleHireAction = (reqId, action) => {
    setHireRequests(prev =>
      prev.map(r => r._id === reqId ? { ...r, status: action } : r)
    );
    toast.success(`Request marked as ${action.toUpperCase()}`);
  };

  const stats = [
    { label: 'Total Projects', val: '14 Completed', color: 'text-brand-purple', bg: 'bg-brand-purple/10', icon: FiGrid },
    { label: 'Pending Requests', val: hireRequests.filter(r => r.status === 'pending').length, color: 'text-brand-pink', bg: 'bg-brand-pink/10', icon: FiLayers },
    { label: 'Estimated Earnings', val: '₹18,500', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: FiDollarSign },
    { label: 'Avg Review Rating', val: user?.creatorProfile?.rating || '4.8', color: 'text-brand-orange', bg: 'bg-brand-orange/10', icon: FiStar },
    { label: 'Portfolio Views', val: '1.2K', color: 'text-info', bg: 'bg-info/10', icon: FiTrendingUp }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass p-4 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between group hover:shadow-premium transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <span className={`text-sm font-black mt-1.5 font-display ${stat.color}`}>{stat.val}</span>
              </div>
              <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hire requests campaigns list */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-2 px-1">
          <FiLayers className="text-brand-pink" /> Vendor Hire Requests Campaign
        </h3>

        {hireRequests.length === 0 ? (
          <div className="glass p-12 text-center text-slate-500 rounded-2xl border border-white/50 shadow-glass">
            No pending hire requests at the moment.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {hireRequests.map((req) => (
              <div
                key={req._id}
                className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-premium transition-all duration-300"
              >
                <div className="flex flex-col gap-1 max-w-xl min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand-purple">{req.businessName}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-pink/10 text-brand-pink rounded-lg border border-brand-pink/20">
                      Sponsor Offer
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-navy font-display mt-2">{req.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{req.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Proposed Offer</span>
                    <span className="text-sm font-black text-brand-navy font-display">₹{req.budget}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{req.deliveryDays} days deadline</span>
                  </div>

                  {req.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleHireAction(req._id, 'rejected')}
                        className="px-3.5 py-2 text-xs font-bold text-red-500 border border-red-200/50 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHireAction(req._id, 'accepted')}
                        className="px-4 py-2 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple-800 rounded-xl shadow-premium cursor-pointer transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <span className={`px-4 py-2 text-xs font-bold rounded-xl capitalize shadow-sm
                      ${req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboardTab;
