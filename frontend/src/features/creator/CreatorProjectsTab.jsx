import React, { useState } from 'react';
import { FiBriefcase, FiCheckCircle, FiClock, FiPlay } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreatorProjectsTab = ({ user }) => {
  const [projects, setProjects] = useState([
    {
      id: 'proj_01',
      brand: 'Supertech Electronics',
      campaign: 'Wireless Earbuds UGC Video',
      deliverable: '1 UGC Shorts Reel (unboxing & sound review)',
      budget: 1500,
      deadline: '2026-07-25',
      status: 'active', // active | completed | pending_review
    },
    {
      id: 'proj_02',
      brand: 'Bite & Bite Restaurant',
      campaign: 'Gourmet Burger Review',
      deliverable: '1 Foodie Reel with Voiceover',
      budget: 1200,
      deadline: '2026-07-20',
      status: 'pending_review',
    },
    {
      id: 'proj_03',
      brand: 'GymShark Gear',
      campaign: 'Activewear workout fit check',
      deliverable: '3 Instagram Reels (1 fitness motivation, 2 apparel showoffs)',
      budget: 3500,
      deadline: '2026-07-10',
      status: 'completed',
    }
  ]);

  const handleSubmitDeliverable = (id) => {
    setProjects(prev =>
      prev.map(p => p.id === id ? { ...p, status: 'pending_review' } : p)
    );
    toast.success('Project deliverable submitted to vendor for review!');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">My Active & Past Projects</h3>
        <p className="text-xs text-slate-500 mt-1">Submit deliverables and track approval status of your sponsored campaigns.</p>
      </div>

      <div className="flex flex-col gap-4">
        {projects.map((proj) => (
          <div key={proj.id} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-premium transition-all duration-300">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-brand-purple">{proj.brand}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border
                  ${proj.status === 'active' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : ''}
                  ${proj.status === 'pending_review' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                  ${proj.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                `}>
                  {proj.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-brand-navy font-display mt-2">{proj.campaign}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1"><strong className="text-brand-navy">Deliverable:</strong> {proj.deliverable}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> Deadline: {proj.deadline}</p>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Payout</span>
                <span className="text-sm font-black text-brand-navy font-display">₹{proj.budget}</span>
              </div>

              {proj.status === 'active' && (
                <button
                  onClick={() => handleSubmitDeliverable(proj.id)}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple-800 rounded-xl shadow-premium cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <FiPlay className="w-3.5 h-3.5" /> Submit Link
                </button>
              )}
              {proj.status === 'pending_review' && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50/50 border border-amber-200/40 px-3 py-1.5 rounded-xl">
                  <FiClock className="w-4 h-4" /> Under Review
                </span>
              )}
              {proj.status === 'completed' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-200/40 px-3 py-1.5 rounded-xl">
                  <FiCheckCircle className="w-4 h-4" /> Payout Settled
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorProjectsTab;
