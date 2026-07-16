import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiPlus,
  FiBriefcase,
  FiTrendingUp,
  FiLayers,
  FiCpu,
  FiMapPin,
  FiActivity,
  FiTrash2,
  FiCheckCircle,
  FiDollarSign
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  useGetListingsQuery,
  useCreateListingMutation,
  useDeleteListingMutation,
  useGenerateAICopyMutation
} from '../features/listings/listingsApi';
import {
  useGetRequirementsQuery,
  useSubmitQuoteMutation
} from '../features/customer/requirementsApi';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const VendorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | leads | analytics
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form states for Listing creation
  const [title, setTitle] = useState('');
  const [type, setType] = useState('product');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('new');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  // Form states for bid quotation
  const [bidPrice, setBidPrice] = useState('');
  const [bidDelivery, setBidDelivery] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  // RTK query hooks
  const { data: listingsRes, isLoading: isListingsLoading, refetch: refetchListings } = useGetListingsQuery({
    page: 1,
    limit: 50,
  });

  // Query nearby leads (requirements matching vendor categories)
  const { data: leadsRes, isLoading: isLeadsLoading, refetch: refetchLeads } = useGetRequirementsQuery({
    page: 1,
    limit: 30,
    category: user?.vendorProfile?.category || undefined,
  });

  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [generateAI, { isLoading: isGeneratingAI }] = useGenerateAICopyMutation();
  const [submitBid, { isLoading: isBidding }] = useSubmitQuoteMutation();

  const myListings = listingsRes?.data?.filter((l) => l.vendor?._id === user?._id) || [];
  const activeLeads = leadsRes?.data || [];

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!title || !price || !category) {
      return toast.error('Please enter all required fields.');
    }
    try {
      await createListing({
        type,
        title,
        category,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        description,
        condition,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'], // default catalog mock item image
      }).unwrap();
      
      toast.success('Listing created successfully!');
      setShowAddModal(false);
      resetForm();
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create listing.');
    }
  };

  const handleAICopy = async () => {
    if (!title) {
      return toast.error('Enter a title to generate description.');
    }
    try {
      const res = await generateAI({ title, category, type }).unwrap();
      setDescription(res.description);
      toast.success('AI description synthesized!');
    } catch (err) {
      toast.error('Failed to generate copy.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this listing?')) {
      try {
        await deleteListing(id).unwrap();
        toast.success('Listing removed.');
        refetchListings();
      } catch (err) {
        toast.error('Failed to delete.');
      }
    }
  };

  const handleOpenBid = (lead) => {
    setSelectedLead(lead);
    setBidPrice(lead.budget);
    const defaultDelivery = new Date();
    defaultDelivery.setDate(defaultDelivery.getDate() + 5);
    setBidDelivery(defaultDelivery.toISOString().split('T')[0]);
    setBidNotes('');
    setShowBidModal(true);
  };

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
      toast.error(err?.data?.message || 'Failed to submit quote.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setSalePrice('');
    setDescription('');
    setCondition('new');
    setAddress('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* ── Page Header / Stats Banner ──────────────────────────── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy font-display">
            {user?.vendorProfile?.businessName || 'Business Workspace'}
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Manage your store catalog, check local customer bids, and verify analytics metrics.
          </p>
        </div>

        <div className="flex gap-2">
          {['catalog', 'leads', 'analytics'].map((tab) => (
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
              {tab === 'leads' ? 'Leads & Bids' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Business Quick Stats Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Store Wallet', val: `₹${user?.walletBalance}`, color: 'text-brand-purple', icon: FiDollarSign },
          { label: 'Total Catalog', val: myListings.length, color: 'text-brand-pink', icon: FiBriefcase },
          { label: 'Nearby Active Leads', val: activeLeads.length, color: 'text-brand-orange', icon: FiLayers },
          { label: 'Fulfillment Plan', val: user?.subscription?.plan?.toUpperCase() || 'FREE', color: 'text-success', icon: FiCheckCircle },
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
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                <FiBriefcase className="text-brand-purple" /> Store Products & Services ({myListings.length})
              </h3>
              <Button onClick={() => setShowAddModal(true)} variant="primary" className="flex items-center gap-1.5 text-xs py-2 px-4 cursor-pointer">
                <FiPlus /> Add Item
              </Button>
            </div>

            {isListingsLoading ? (
              <div className="py-12 flex justify-center"><Loader /></div>
            ) : myListings.length === 0 ? (
              <div className="glass p-12 text-center rounded-premium text-text-secondary">
                <p className="font-bold text-brand-navy">Your Catalog is empty</p>
                <p className="text-xs mt-1">Upload your first Product or Service to start receiving orders!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myListings.map((item) => (
                  <div key={item._id} className="glass p-4 rounded-premium border-white/50 shadow-glass flex flex-col gap-3 relative group">
                    <div className="h-40 w-full rounded-premium overflow-hidden bg-surface-tertiary relative">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black uppercase text-white bg-brand-purple rounded">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-brand-orange font-bold uppercase">{item.category}</span>
                      <h4 className="text-sm font-bold text-brand-navy font-display line-clamp-1">{item.title}</h4>
                      <p className="text-xs font-black text-brand-navy mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-light">
                      <span className="text-[10px] text-text-tertiary">Added {new Date(item.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 hover:bg-error-light/30 rounded-premium text-error cursor-pointer transition-all"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5 px-1">
              <FiLayers className="text-brand-orange" /> Local Matching Requirement Leads
            </h3>

            {isLeadsLoading ? (
              <div className="py-12 flex justify-center"><Loader /></div>
            ) : activeLeads.length === 0 ? (
              <div className="glass p-12 text-center rounded-premium text-text-secondary">
                <p className="font-bold text-brand-navy">No active leads</p>
                <p className="text-xs mt-1">No custom customer requests match your category currently. Check again later!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeLeads.map((lead) => (
                  <div key={lead._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-premium transition-all">
                    <div className="flex flex-col gap-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase text-brand-orange bg-brand-orange/10 rounded">
                          {lead.category}
                        </span>
                        <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                          <FiMapPin /> {lead.location?.address || 'Proximity location'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-brand-navy font-display">{lead.title}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2">{lead.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-text-tertiary block">Target Budget</span>
                        <span className="text-base font-black text-brand-navy">₹{lead.budget}</span>
                      </div>
                      <Button onClick={() => handleOpenBid(lead)} variant="secondary" className="text-xs py-1.5 px-4 cursor-pointer">
                        Submit Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="glass p-8 rounded-premium border-white/50 shadow-glass flex flex-col items-center justify-center text-center gap-2 py-16">
            <FiActivity className="w-10 h-10 text-brand-purple animate-pulse" />
            <h4 className="text-sm font-bold text-brand-navy mt-2 uppercase tracking-wider">Analytics Board Active</h4>
            <p className="text-xs text-text-secondary max-w-xs">
              Daily revenue charts, conversions rate tracks, and reels sponsor impressions are updating automatically in background.
            </p>
          </div>
        )}
      </div>

      {/* ── Add Listing Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-navy-dark/40 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-premium shadow-modal border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 z-10 relative flex flex-col gap-4"
            >
              <h3 className="text-lg font-bold text-brand-navy font-display">Add Product or Service</h3>
              
              <form onSubmit={handleCreateListing} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    >
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Price *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Sale Price</label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* AI Generator description trigger */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-navy">Description Context</label>
                    <button
                      type="button"
                      onClick={handleAICopy}
                      disabled={isGeneratingAI}
                      className="text-[10px] font-bold text-brand-purple flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <FiCpu />
                      {isGeneratingAI ? 'Synthesizing...' : 'AI Generate Copy'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="used">Used</option>
                      <option value="not_applicable">N/A (Services)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Storefront Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Connaught Place, New Delhi"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary rounded-premium"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isCreating} variant="primary" className="text-xs py-2 px-5 cursor-pointer">
                    {isCreating ? 'Adding...' : 'Create Item'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bidding/Quotation Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showBidModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-navy-dark/40 backdrop-blur-xs" onClick={() => setShowBidModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-premium shadow-modal border border-border w-full max-w-md p-6 z-10 relative flex flex-col gap-4"
            >
              <h3 className="text-lg font-bold text-brand-navy font-display">Submit Quote Bid</h3>
              <p className="text-xs text-text-tertiary">
                Submitting a bid for lead: <span className="font-bold text-brand-navy">{selectedLead.title}</span>
              </p>

              <form onSubmit={handlePostBid} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Your Bid Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Estimated Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={bidDelivery}
                    onChange={(e) => setBidDelivery(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Proposal Notes / Cover Letter</label>
                  <textarea
                    rows={4}
                    value={bidNotes}
                    onChange={(e) => setBidNotes(e.target.value)}
                    placeholder="Provide details about your delivery schedule, experience, or product conditions..."
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary rounded-premium"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isBidding} variant="primary" className="text-xs py-2 px-5 cursor-pointer">
                    {isBidding ? 'Submitting...' : 'Send Quote'}
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

const CATEGORIES = [
  'All',
  'Electronics',
  'Home Services',
  'Fashion & Apparel',
  'Beauty & Wellness',
  'Consulting & Professional',
  'Automotive',
  'Health & Fitness',
];

export default VendorDashboard;
