import React, { useState } from 'react';
import { useGetRequirementsQuery, useSubmitQuoteMutation } from '../customer/requirementsApi';
import { FiTrendingUp, FiPlus, FiArrowRight, FiInfo, FiLayers, FiDollarSign, FiClock, FiX, FiBriefcase } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const LeadsEnquiriesTab = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // all | products | services | quotes
  const [selectedLead, setSelectedLead] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  
  // Bid Form States
  const [bidPrice, setBidPrice] = useState('');
  const [bidDelivery, setBidDelivery] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  // API Queries & Mutations
  const { data: leadsRes, isLoading: isLeadsLoading, refetch: refetchLeads } = useGetRequirementsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 30000 }
  );
  const [submitBid, { isLoading: isBidding }] = useSubmitQuoteMutation();

  const activeLeads = leadsRes?.data || [];

  // Filter leads based on type or category
  const filteredLeads = activeLeads.filter((lead) => {
    if (activeSubTab === 'products') return lead.type === 'product';
    if (activeSubTab === 'services') return lead.type === 'service';
    return true; // default all
  });

  const handlePostBid = async (e) => {
    e.preventDefault();
    if (!bidPrice || !bidDelivery) {
      return toast.error('Enter bid pricing and delivery date.');
    }
    try {
      await submitBid({
        requirementId: selectedLead._id,
        price: parseFloat(bidPrice),
        estimatedDelivery: bidDelivery,
        notes: bidNotes,
      }).unwrap();

      toast.success('Your quote has been submitted!');
      setShowBidModal(false);
      refetchLeads();
    } catch (err) {
      toast.error('Failed to submit quote.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Leads & Enquiries Marketplace</h3>
          <p className="text-xs text-slate-500 mt-1">Place direct quotations on customer requirements and match incoming leads.</p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/50">
          {[
            { id: 'all', label: 'All Matches' },
            { id: 'products', label: 'Product Leads' },
            { id: 'services', label: 'Service Leads' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${activeSubTab === tab.id ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads listing cards */}
      {isLeadsLoading ? (
        <div className="py-16 flex justify-center"><Loader /></div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass p-16 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass flex flex-col items-center gap-3">
          <FiInfo className="w-8 h-8 text-brand-purple/60" />
          <p className="text-sm font-semibold">No requirement leads match your business profile right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeads.map((lead) => (
            <motion.div
              layout
              key={lead._id}
              className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col justify-between gap-4 hover:shadow-premium transition-all duration-300"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-brand-orange/15 text-brand-orange rounded-lg">
                    {lead.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{lead.type.toUpperCase()}</span>
                </div>
                <h4 className="text-sm font-bold text-brand-navy font-display mt-1">{lead.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{lead.description}</p>
                {lead.location && (
                  <span className="text-[10px] text-slate-400 block mt-1">📍 Near: {lead.location?.address || 'City Area'}</span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Estimated Budget</span>
                  <span className="text-sm font-black text-brand-purple">₹{lead.budget}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedLead(lead); setBidPrice(lead.budget); setBidDelivery(''); setBidNotes(''); setShowBidModal(true); }}
                  className="px-4 py-2 bg-brand-purple text-white hover:bg-brand-purple-800 text-xs font-bold rounded-xl transition-all shadow-premium cursor-pointer flex items-center gap-1.5"
                >
                  Place Quotation <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submit Bid Modal */}
      <AnimatePresence>
        {showBidModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBidModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-modal border border-slate-100 w-full max-w-md p-6 z-10 relative flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-brand-navy font-display flex items-center gap-2">
                  <FiBriefcase className="text-brand-purple w-5 h-5" /> Submit Quotation Bid
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Submitting a bid for lead: <span className="font-bold text-brand-navy">{selectedLead.title}</span>
              </p>

              <form onSubmit={handlePostBid} className="flex flex-col gap-4">
                <Input
                  label="Your Bid Price (₹) *"
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  required
                />
                <Input
                  label="Estimated Delivery Date *"
                  type="date"
                  value={bidDelivery}
                  onChange={(e) => setBidDelivery(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy uppercase">Proposal notes / details</label>
                  <textarea
                    rows={3}
                    value={bidNotes}
                    onChange={(e) => setBidNotes(e.target.value)}
                    placeholder="Provide details about execution delivery quality..."
                    className="w-full p-3.5 bg-slate-50/50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isBidding}
                    variant="primary"
                    className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                  >
                    Send Quote
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

export default LeadsEnquiriesTab;
