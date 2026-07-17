import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlusSquare,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiCheckCircle,
  FiBriefcase,
  FiChevronDown,
  FiX,
  FiLayers,
  FiUser
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  useGetRequirementsQuery,
  useCreateRequirementMutation,
  useGetQuotesForRequirementQuery,
  useUpdateQuoteStatusMutation
} from '../features/customer/requirementsApi';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import LocationPicker from '../components/common/LocationPicker';

const CATEGORIES = [
  'Electronics',
  'Home Services',
  'Fashion & Apparel',
  'Beauty & Wellness',
  'Consulting & Professional',
  'Automotive',
  'Health & Fitness',
];

const RequirementsNew = () => {
  const user = useSelector(selectCurrentUser);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  
  // Create Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [address, setAddress] = useState('New Delhi, India');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  // RTK Query calls
  const { data: reqsRes, isLoading, refetch } = useGetRequirementsQuery({
    customerId: user?._id,
  }, { refetchOnMountOrArgChange: true });

  const { data: quotesRes, isLoading: isQuotesLoading, refetch: refetchQuotes } = useGetQuotesForRequirementQuery(selectedReqId, {
    skip: !selectedReqId,
  });

  const [createReq, { isLoading: isPosting }] = useCreateRequirementMutation();
  const [updateQuoteStatus, { isLoading: isPaying }] = useUpdateQuoteStatusMutation();

  const myRequirements = reqsRes?.data || [];
  const quotesList = quotesRes?.quotes || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !budget || !deadline || !description) {
      return toast.error('Please enter all required fields.');
    }

    try {
      await createReq({
        title,
        description,
        category,
        budget: parseFloat(budget),
        deadline,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      }).unwrap();

      toast.success('Requirement posted successfully!');
      setShowAddForm(false);
      resetForm();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to post requirement.');
    }
  };

  const handleAcceptBid = async (quote) => {
    const confirmPayment = window.confirm(
      `Accept bid and pay ₹${quote.price} from your wallet balance? Current balance: ₹${user?.walletBalance}`
    );
    if (!confirmPayment) return;

    if (user?.walletBalance < quote.price) {
      return toast.error('Insufficient wallet balance. Recharge your wallet first.');
    }

    try {
      await updateQuoteStatus({
        quoteId: quote._id,
        status: 'accepted',
        requirementId: selectedReqId,
      }).unwrap();

      toast.success('Bid accepted! Payment settled successfully.');
      refetchQuotes();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process bid acceptance.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBudget('');
    setDeadline('');
    setAddress('New Delhi, India');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy font-display">
            Requirement Bidding <span className="gradient-text font-black">Center</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Post your custom business briefs, receive local vendor quotes, compare offers, and process escrow-like settlements.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setShowAddForm(true)} variant="primary" className="flex items-center gap-1.5 text-xs py-2.5 px-5 cursor-pointer">
            <FiPlusSquare /> Post Requirement
          </Button>
        </div>
      </div>

      {/* ── Main Viewports Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Requirements List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">My Requirements</h3>
          
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader /></div>
          ) : myRequirements.length === 0 ? (
            <div className="glass p-8 text-center rounded-premium text-text-secondary">
              <p className="font-bold text-brand-navy">No active posts</p>
              <p className="text-xs mt-1">Get custom quotes by posting a requirement above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myRequirements.map((req) => (
                <div
                  key={req._id}
                  onClick={() => setSelectedReqId(req._id)}
                  className={`glass p-4 rounded-premium border-white/50 hover:shadow-premium cursor-pointer transition-all flex flex-col gap-2.5 border-l-4
                    ${selectedReqId === req._id 
                      ? 'border-brand-purple shadow-premium bg-brand-purple/[0.02]' 
                      : 'border-l-transparent'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase text-brand-purple bg-brand-purple/10 rounded">
                      {req.category}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded
                      ${req.status === 'open' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-success/10 text-success'}
                    `}>
                      {req.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-brand-navy font-display line-clamp-1">{req.title}</h4>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">{req.description}</p>
                  
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-border-light text-[10px] text-text-tertiary">
                    <span className="font-bold text-brand-navy">Budget: ₹{req.budget}</span>
                    <span>{req.quotesCount || 0} Quotes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quotation Bids list and comparison */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Quotes Comparison Hub</h3>

          {!selectedReqId ? (
            <div className="glass p-12 text-center rounded-premium text-text-secondary flex flex-col items-center justify-center py-24">
              <FiLayers className="w-10 h-10 text-brand-purple/20 mb-2" />
              <p className="font-bold text-brand-navy">No Requirement Selected</p>
              <p className="text-xs mt-1">Select one of your posted requirements from the left list to review vendor quotation proposals.</p>
            </div>
          ) : isQuotesLoading ? (
            <div className="py-12 flex justify-center"><Loader /></div>
          ) : quotesList.length === 0 ? (
            <div className="glass p-12 text-center rounded-premium text-text-secondary">
              <p className="font-bold text-brand-navy">No bids received yet</p>
              <p className="text-xs mt-1">Nearby local vendors are being notified of your requirements. Bids will appear here shortly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {quotesList.map((quote) => (
                <div key={quote._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col gap-4 hover:shadow-premium transition-all">
                  <div className="flex justify-between items-start">
                    {/* Vendor avatar */}
                    <div className="flex items-center gap-3">
                      <img
                        src={quote.vendor?.avatarUrl || 'https://via.placeholder.com/150'}
                        alt={quote.vendor?.name}
                        className="w-10 h-10 rounded-full border border-brand-purple object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-navy">
                          {quote.vendor?.vendorProfile?.businessName || quote.vendor?.name}
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          Verified local business
                        </span>
                      </div>
                    </div>

                    {/* Quote Pricing */}
                    <div className="text-right">
                      <span className="text-[10px] text-text-tertiary block">Proposal Price</span>
                      <span className="text-base font-black text-brand-purple">₹{quote.price}</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/55 p-3 rounded-premium border border-border-light">
                    {quote.notes || 'No proposals notes provided.'}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <FiClock /> Delivery: {new Date(quote.estimatedDelivery).toLocaleDateString()}
                    </span>
                    
                    {quote.status === 'pending' ? (
                      <Button
                        onClick={() => handleAcceptBid(quote)}
                        variant="primary"
                        className="text-[10px] py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiCheckCircle /> Accept & Pay
                      </Button>
                    ) : (
                      <span className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider text-[8px]
                        ${quote.status === 'accepted' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
                      `}>
                        {quote.status} ({quote.paymentStatus})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Requirement Posting Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-navy-dark/40 backdrop-blur-xs" onClick={() => setShowAddForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-premium shadow-modal border border-border w-full max-w-lg p-6 z-10 relative flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-navy font-display">Post Custom Requirement</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-surface-secondary rounded-full text-text-secondary cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Requirement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need CCTV installation setup for store"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Target Budget (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy">Fulfillment Deadline *</label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Location Details & Coordinates *</label>
                  <LocationPicker
                    initialAddress={address}
                    initialLat={lat}
                    initialLng={lng}
                    onChange={(loc) => {
                      setAddress(loc.address);
                      setLat(loc.lat.toString());
                      setLng(loc.lng.toString());
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-navy">Requirement Details *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide description about installation criteria, size, colors, delivery timeline specifications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-secondary rounded-premium"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isPosting} variant="primary" className="text-xs py-2 px-5 cursor-pointer">
                    {isPosting ? 'Posting...' : 'Post Brief'}
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

export default RequirementsNew;
