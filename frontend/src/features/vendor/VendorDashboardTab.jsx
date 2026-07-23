import React, { useState } from 'react';
import { useGetRequirementsQuery, useSubmitQuoteMutation } from '../customer/requirementsApi';
import { useGetOrdersQuery } from '../customer/activitiesApi';
import { useGetVendorListingsQuery } from '../vendor/vendorApi';
import { FiBriefcase, FiActivity, FiUsers, FiEye, FiDollarSign, FiZap, FiPlus, FiGrid, FiArrowRight } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const VendorDashboardTab = ({ user, setActiveTab }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidDelivery, setBidDelivery] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  // API Queries & Mutations
  const { data: listingsRes } = useGetVendorListingsQuery(
    { vendor: user?._id, page: 1, limit: 50 },
    { skip: !user?._id, pollingInterval: 30000 }
  );
  const { data: leadsRes, isLoading: isLeadsLoading, refetch: refetchLeads } = useGetRequirementsQuery(
    { page: 1, limit: 30 },
    { pollingInterval: 30000 }
  );
  const { data: ordersRes } = useGetOrdersQuery(undefined, { pollingInterval: 30000 });
  const [submitBid, { isLoading: isBidding }] = useSubmitQuoteMutation();

  const myListings = listingsRes?.data || [];
  const activeLeads = leadsRes?.data || [];
  const recentOrders = ordersRes?.orders || [];

  const totalProducts = myListings.filter((l) => l.type === 'product').length;
  const totalServices = myListings.filter((l) => l.type === 'service').length;

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

  const stats = [
    { label: 'Products', val: totalProducts, color: 'text-brand-purple', bg: 'bg-brand-purple/10', icon: FiBriefcase },
    { label: 'Services', val: totalServices, color: 'text-brand-pink', bg: 'bg-brand-pink/10', icon: FiActivity },
    { label: 'Followers', val: user?.followersCount || 0, color: 'text-brand-orange', bg: 'bg-brand-orange/10', icon: FiUsers },
    { label: 'Views', val: '6.4K', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: FiEye },
    { label: 'Wallet', val: `₹${user?.walletBalance || 0}`, color: 'text-brand-purple', bg: 'bg-brand-purple/10', icon: FiDollarSign },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass p-4 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between group hover:shadow-premium transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <span className={`text-lg font-black mt-1 font-display ${stat.color}`}>{stat.val}</span>
              </div>
              <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leads and Orders summary grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby customer leads */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Nearby Customer Bids & Leads</h3>
            <button
              onClick={() => setActiveTab('leads')}
              className="text-[10px] text-brand-purple hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              View All <FiArrowRight />
            </button>
          </div>
          {isLeadsLoading ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : activeLeads.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass">
              No active customer requirement leads matching your store.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeLeads.slice(0, 3).map((lead) => (
                <div key={lead._id} className="glass p-4 rounded-2xl border border-white/50 shadow-glass flex justify-between items-center gap-4 hover:shadow-premium transition-all duration-300">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[9px] font-bold text-brand-orange uppercase">{lead.category}</span>
                    <h4 className="text-xs font-bold text-brand-navy truncate">{lead.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{lead.description}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-black text-brand-purple">₹{lead.budget}</span>
                    <button
                      onClick={() => { setSelectedLead(lead); setBidPrice(lead.budget); setBidDelivery(''); setBidNotes(''); setShowBidModal(true); }}
                      className="mt-1.5 px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Submit bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Recent Checkout Requests</h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-[10px] text-brand-purple hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              View All <FiArrowRight />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass text-xs font-semibold">
              No checkout requests logged yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.slice(0, 3).map((ord) => (
                <div key={ord._id} className="glass p-4 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-2 hover:shadow-premium transition-all duration-300">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-brand-orange uppercase truncate max-w-[120px]">{ord.listing?.title || 'Catalog item'}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase shadow-sm
                      ${ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-orange/20 text-brand-orange'}
                    `}>{ord.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-2">
                    <span>Total: <strong className="text-brand-navy">₹{ord.price}</strong></span>
                    <span>Qty: {ord.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
              <h3 className="text-lg font-bold text-brand-navy font-display">Submit Quotation Bid</h3>
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
                    placeholder="Enter pitch details..."
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

export default VendorDashboardTab;
