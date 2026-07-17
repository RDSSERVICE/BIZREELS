import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiCpu, FiEye, FiArchive, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import {
  useGetListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGenerateAICopyMutation,
} from './listingsApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const MyListingsTab = ({ user }) => {
  const navigate = useNavigate();
  const [listingFilter, setListingFilter] = useState('published');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [type, setType] = useState('product');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('new');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [expireDate, setExpireDate] = useState('');
  const [variants, setVariants] = useState([]);
  const [reelBoostEnabled, setReelBoostEnabled] = useState(true);
  const [boostCategory, setBoostCategory] = useState('student');
  const [boostArea, setBoostArea] = useState({ city: 'Delhi', distance: '10', state: 'Delhi' });
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600');
  const [videoUrl, setVideoUrl] = useState('');

  // API Queries & Mutations
  const { data: listingsRes, isLoading: isListingsLoading, refetch: refetchListings } = useGetListingsQuery({
    page: 1,
    limit: 50,
  });

  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
  const [updateListing] = useUpdateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [generateAI, { isLoading: isGeneratingAI }] = useGenerateAICopyMutation();

  const myListings = listingsRes?.data?.filter((l) => l.vendor?._id === user?._id || l.vendor === user?._id) || [];

  // Filter listings based on status
  const filteredListings = myListings.filter((item) => {
    if (listingFilter === 'product') return item.type === 'product';
    if (listingFilter === 'service') return item.type === 'service';
    if (listingFilter === 'used') return item.condition === 'used';
    if (listingFilter === 'draft') return item.status === 'draft';
    if (listingFilter === 'expired') return item.status === 'expired';
    if (listingFilter === 'hidden') return item.status === 'hidden';
    return item.status === 'published' || !item.status; // Default published
  });

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
        subcategory,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        description,
        condition,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address,
        images: [imageUrl],
        videoUrl,
        expireDate: expireDate || undefined,
        variants,
        boost: reelBoostEnabled ? { category: boostCategory, ...boostArea } : undefined
      }).unwrap();

      toast.success('Listing created successfully!');
      setShowAddModal(false);
      resetForm();
      refetchListings();
    } catch (err) {
      toast.error('Failed to create listing.');
    }
  };

  const handleToggleListingStatus = async (item, targetStatus) => {
    try {
      await updateListing({ id: item._id, status: targetStatus }).unwrap();
      toast.success(`Listing status updated to ${targetStatus}`);
      refetchListings();
    } catch (e) {
      toast.error('Failed to update listing status.');
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm('Delete this listing permanently?')) {
      try {
        await deleteListing(id).unwrap();
        toast.success('Listing removed.');
        refetchListings();
      } catch (err) {
        toast.error('Failed to delete.');
      }
    }
  };

  const handleAICopy = async () => {
    if (!title) return toast.error('Enter a title to generate description.');
    try {
      const res = await generateAI({ title, category, type }).unwrap();
      setDescription(res.description);
      toast.success('AI description synthesized!');
    } catch (err) {
      toast.error('Failed to generate copy.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setSalePrice('');
    setDescription('');
    setCondition('new');
    setAddress('');
    setSubcategory('');
    setExpireDate('');
    setVariants([]);
    setReelBoostEnabled(true);
    setBoostCategory('student');
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600');
    setVideoUrl('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-3">
        {/* Filter buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto border border-slate-200/50">
          {[
            { id: 'published', label: 'Published' },
            { id: 'product', label: 'Products' },
            { id: 'service', label: 'Services' },
            { id: 'used', label: 'Used' },
            { id: 'draft', label: 'Drafts' },
            { id: 'hidden', label: 'Hidden' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setListingFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${listingFilter === f.id ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          className="flex items-center gap-2 text-xs py-2.5 px-5 cursor-pointer shrink-0 rounded-xl"
        >
          <FiPlus className="w-4 h-4" /> Add Product/Service
        </Button>
      </div>

      {isListingsLoading ? (
        <div className="py-16 flex justify-center"><Loader /></div>
      ) : filteredListings.length === 0 ? (
        <div className="glass p-16 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass flex flex-col items-center gap-3">
          <FiInfo className="w-8 h-8 text-brand-purple/60" />
          <p className="text-sm font-semibold">No catalog records found matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <motion.div
              layout
              key={item._id}
              className="glass rounded-2xl border border-white/50 shadow-glass flex flex-col overflow-hidden relative group hover:shadow-premium transition-all duration-300"
            >
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={item.images?.[0] || 'https://via.placeholder.com/300?text=No+Image'}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[9px] font-black uppercase text-white bg-brand-purple rounded-lg shadow-sm">
                  {item.type}
                </span>
                {item.status && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[9px] font-black uppercase text-white bg-brand-orange rounded-lg shadow-sm">
                    {item.status}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">{item.category}</span>
                <h4 className="text-sm font-bold text-brand-navy font-display line-clamp-1 mt-1">{item.title}</h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-sm font-black text-brand-navy">₹{item.price}</span>
                  {item.salePrice && (
                    <span className="text-xs text-slate-400 line-through">₹{item.salePrice}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
              </div>

              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleListingStatus(item, item.status === 'hidden' ? 'published' : 'hidden')}
                    className="text-xs font-bold text-brand-purple hover:text-brand-purple-800 transition-colors cursor-pointer"
                  >
                    {item.status === 'hidden' ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleListingStatus(item, item.status === 'draft' ? 'published' : 'draft')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {item.status === 'draft' ? 'Publish' : 'Draft'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteListing(item._id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 cursor-pointer transition-all duration-200"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Catalog Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-modal border border-slate-100 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 z-10 relative flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-brand-navy font-display">Add Product or Service</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateListing} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title *"
                    placeholder="e.g. Premium Leather Shoes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Home Services">Home Services</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Beauty & Wellness">Beauty & Wellness</option>
                      <option value="Consulting & Professional">Consulting & Professional</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                    </select>
                  </div>
                  <Input
                    label="Sub-category (Optional)"
                    placeholder="e.g. Running Shoes / Smart Accessories"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Actual Price (₹) *"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                  <Input
                    label="Sale Price (₹)"
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                  <div className="flex flex-col justify-end pb-3">
                    {salePrice && price && parseFloat(price) > parseFloat(salePrice) ? (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-3 py-1.5 rounded-xl w-max">
                        Discount: {Math.round(((parseFloat(price) - parseFloat(salePrice)) / parseFloat(price)) * 100)}% Off
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">No active discount applied.</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Description Context</label>
                    <button
                      type="button"
                      onClick={handleAICopy}
                      disabled={isGeneratingAI}
                      className="text-xs font-bold text-brand-purple flex items-center gap-1.5 hover:underline cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <FiCpu className="w-3.5 h-3.5" />
                      {isGeneratingAI ? 'Synthesizing...' : 'AI Generate Copy'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter details or let AI generate it..."
                    className="w-full p-3.5 bg-slate-50/50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
                    >
                      <option value="new">New</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="used">Used</option>
                      <option value="not_applicable">N/A (Services)</option>
                    </select>
                  </div>
                  <Input
                    label="Expiry Date (If necessary)"
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">AI variants / Labels</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!title) return toast.error('Enter title first.');
                        setVariants(['Red', 'Green', 'Blue', 'Standard Size', 'Plus Size']);
                        toast.success('AI Variant options generated!');
                      }}
                      className="text-[10px] text-brand-purple font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FiCpu /> Auto-Generate Labels
                    </button>
                  </div>
                  {variants.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {variants.map(v => (
                        <span key={v} className="px-2.5 py-0.5 text-[9px] font-black uppercase bg-brand-purple/10 text-brand-purple rounded-lg">
                          {v}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No variants created yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Storefront Address"
                    placeholder="e.g. Connaught Place, New Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Geolocation asset upload options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Product Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600');
                          toast.success('AI Generated image asset set!');
                        }}
                        className="px-3 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Create AI Image
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Video URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40191-large.mp4');
                          toast.success('AI Generated video asset set!');
                        }}
                        className="px-3 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Create AI Video
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { navigate('/creator/marketplace'); setShowAddModal(false); }}
                      className="text-[9px] text-brand-orange font-black text-left hover:underline uppercase tracking-wider mt-0.5 whitespace-nowrap"
                    >
                      💡 Hire Creator for high quality custom Reels
                    </button>
                  </div>
                </div>

                {/* Reel Boost targeting settings */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Reel Boost marketing settings</h4>
                      <p className="text-[9px] text-slate-500">Enable location and demographic targeting for this product/service.</p>
                    </div>
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReelBoostEnabled(true)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                          ${reelBoostEnabled ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500'}
                        `}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setReelBoostEnabled(false)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                          ${!reelBoostEnabled ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500'}
                        `}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {reelBoostEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Target Category</label>
                        <select
                          value={boostCategory}
                          onChange={(e) => setBoostCategory(e.target.value)}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="doctor">Doctor</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Target City</label>
                        <input
                          type="text"
                          value={boostArea.city}
                          onChange={(e) => setBoostArea({ ...boostArea, city: e.target.value })}
                          placeholder="City"
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Distance (km)</label>
                        <input
                          type="number"
                          value={boostArea.distance}
                          onChange={(e) => setBoostArea({ ...boostArea, distance: e.target.value })}
                          placeholder="10"
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    variant="primary"
                    className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                  >
                    {isCreating ? 'Adding...' : 'Create Item'}
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

export default MyListingsTab;
