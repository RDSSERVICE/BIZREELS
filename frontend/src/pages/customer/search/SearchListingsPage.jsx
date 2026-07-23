import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiTool, FiMessageCircle, FiPackage, FiHeart, FiShare2, FiPhone, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api, resolveMediaUrl } from '../../../lib/api';

export default function SearchListingsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); // 'all' | 'product' | 'service'
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [distance, setDistance] = useState('25');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiringId, setInquiringId] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [coords, setCoords] = useState(null);
  const [savedItems, setSavedItems] = useState({});
  const [likedItems, setLikedItems] = useState({});
  const [orderConfirmedModal, setOrderConfirmedModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewsList, setReviewsList] = useState([]);

  // Fetch coordinates on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Fetch saved/liked interactions
  const fetchInteractions = async () => {
    try {
      const [savedRes, likedRes] = await Promise.all([
        api.get('/v1/interactions/me/saved'),
        api.get('/v1/interactions/me/liked')
      ]);
      const savedMap = {};
      const likedMap = {};

      const savedList = savedRes.data?.items || savedRes.data?.data?.items || savedRes.data || [];
      const likedList = likedRes.data?.items || likedRes.data?.data?.items || likedRes.data || [];

      savedList.forEach(item => {
        const id = item._id || item.id;
        if (id) savedMap[id] = true;
      });
      likedList.forEach(item => {
        const id = item._id || item.id;
        if (id) likedMap[id] = true;
      });

      setSavedItems(savedMap);
      setLikedItems(likedMap);
    } catch (err) {
      console.warn('Failed to fetch interactions:', err);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  // Fetch listing reviews
  const fetchReviews = async (listingId) => {
    try {
      const res = await api.get(`/v1/reviews/listing/${listingId}`);
      const data = res.data;
      const list = data.data?.reviews || data.reviews || data.data || [];
      setReviewsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to fetch reviews:', err);
      setReviewsList([]);
    }
  };

  useEffect(() => {
    if (!selectedItem) {
      setReviewsList([]);
      return;
    }
    fetchReviews(selectedItem._id || selectedItem.id);
  }, [selectedItem]);

  const toggleSave = async (id) => {
    const isSaved = !!savedItems[id];
    setSavedItems((prev) => ({ ...prev, [id]: !isSaved }));
    try {
      if (isSaved) {
        await api.post(`/v1/listings/${id}/unsave`);
      } else {
        await api.post(`/v1/listings/${id}/save`);
      }
      toast.success(!isSaved ? '⭐ Saved to My Favorites!' : 'Removed from Saved');
    } catch (err) {
      setSavedItems((prev) => ({ ...prev, [id]: isSaved }));
      toast.error('Failed to update saved status');
    }
  };

  const toggleLike = async (id) => {
    const isLiked = !!likedItems[id];
    setLikedItems((prev) => ({ ...prev, [id]: !isLiked }));
    try {
      await api.post(`/v1/listings/${id}/like`);
      toast.success(!isLiked ? '❤️ Liked!' : 'Unliked');
    } catch (err) {
      setLikedItems((prev) => ({ ...prev, [id]: isLiked }));
      toast.error('Failed to update like status');
    }
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: `Check out ${item.title} on BizReels!`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('🔗 Link copied to clipboard!');
    }
  };

  const handleWhatsApp = (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const phone = vendorObj.phone || vendorObj.whatsappNumber || '919876543210';
    const text = encodeURIComponent(`Hi! I am interested in your item: "${item.title}". Please send more details.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleCallRequest = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const listingId = item._id || item.id;
    try {
      await api.post('/v1/inquiries', {
        listingId,
        message: 'Customer requested a phone call callback.'
      });
      toast.success(`📞 Call request sent to ${vendorObj.name || vendorObj.shopName || 'Vendor'}! They will call you shortly.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send call request';
      toast.error(msg);
    }
  };

  const handleOrderRequest = async (item) => {
    try {
      const listingId = item._id || item.id;

      await api.post('/v1/orders', {
        listingId,
        quantity: 1,
        address: 'Customer Primary Address'
      });

      setOrderConfirmedModal(true);
      toast.success('🎉 Order Request Confirmed and sent to Vendor!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order request';
      toast.error(msg);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return toast.error('Enter review comment');
    if (!selectedItem) return;

    try {
      const targetListing = selectedItem._id || selectedItem.id;
      await api.post('/v1/reviews', {
        targetListingId: targetListing,
        rating: reviewRating,
        comment: reviewText.trim()
      });

      setReviewText('');
      toast.success('Review posted successfully!');
      fetchReviews(targetListing);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to post review';
      toast.error(msg);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, category, maxPrice, distance, coords]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (category !== 'all') params.append('category', category);
      if (query.trim()) params.append('search', query.trim());
      if (maxPrice < 200000) params.append('maxPrice', maxPrice);
      if (distance) params.append('distance', distance);
      if (coords) {
        params.append('lat', coords.lat);
        params.append('lng', coords.lng);
      }

      const res = await api.get(`/v1/listings?${params.toString()}`);
      const data = res.data;
      const list = data.data?.listings || data.listings || data.data || (Array.isArray(data) ? data : []);

      setListings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Search query failed:', err);
      toast.error('Could not fetch listings. Showing latest products.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInquire = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const vendorId = vendorObj._id || vendorObj.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable for this listing');
      return;
    }

    setInquiringId(item._id || item.id);
    try {
      await api.post('/v1/chat/messages', {
        recipientId: vendorId,
        text: `Hello! I am interested in your listing: "${item.title}". Could you share more details?`
      });
      toast.success(`Inquiry sent to ${vendorObj.name || vendorObj.shopName || 'Vendor'}! Redirecting to chat...`);
      navigate('/customer/chat');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send inquiry to vendor');
    } finally {
      setInquiringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSearch}
        title="Search Products & Services Nearby"
        subtitle="Filter local products, services, and vendor listings by distance, category, and price"
      />

      {/* Search & Filter Header Container */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name, service, brand, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Types</option>
              <option value="product">Products Only</option>
              <option value="service">Services Only</option>
            </select>

            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-brand-purple font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="5">Within 5 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Furniture">Furniture</option>
              <option value="Services">Services</option>
              <option value="Automobile">Automobile</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Max Price: ₹{maxPrice.toLocaleString()}</span>
            <input
              type="range"
              min={1000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-brand-purple cursor-pointer w-32"
            />
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-20 text-center text-xs text-text-tertiary">Searching live database listings...</div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-tertiary glass rounded-2xl border border-border space-y-2">
          <p className="font-bold text-text-secondary">No listings match your search criteria</p>
          <p className="text-[11px]">Try clearing search keywords or increasing max price and distance filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const itemId = item._id || item.id;
            const vendorObj = item.vendor || item.vendorId || {};
            const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Verified Vendor';
            const city = item.city || vendorObj.city || item.location?.city || 'Local';
            const rawImage = item.images?.[0] || item.image || item.mediaUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
            const imageUrl = resolveMediaUrl(rawImage);
            const isService = item.type === 'service';
            const dist = item.distanceKm || item.distance || '3.5';

            return (
              <div
                key={itemId}
                className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-video bg-surface-tertiary relative overflow-hidden">
                  <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-brand-purple uppercase border border-border flex items-center gap-1">
                    {isService ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                    {item.type || 'product'}
                  </div>
                  <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-600 border border-border">
                    {dist} km away
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
                      <span>{item.category || 'General'}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <FiStar size={12} className="fill-amber-500" />
                        {item.rating || '4.8'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-text-primary line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                      <FiMapPin size={12} className="text-brand-orange" />
                      {vendorName} ({city})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-base font-extrabold text-text-primary">
                      ₹{Number(item.price || 0).toLocaleString()}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition"
                    >
                      <FiPackage size={14} />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL PRODUCT & SERVICE DETAIL MODAL WITH CUSTOMER ACTIONS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="px-2.5 py-1 bg-brand-purple/10 text-brand-purple rounded-full text-[10px] font-bold uppercase">
                  {selectedItem.type || 'Product'} • {selectedItem.category || 'General'}
                </span>
                <h2 className="text-xl font-bold text-text-primary font-display mt-1">{selectedItem.title}</h2>
                <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                  <FiMapPin className="text-brand-orange" /> {(selectedItem.vendor?.shopName || selectedItem.vendor?.name || 'Verified Vendor')} ({selectedItem.city || 'Local Shop'})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-surface-tertiary text-text-tertiary font-bold hover:text-text-primary flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Media Preview */}
              <div className="space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden bg-surface-tertiary border border-border">
                  <img
                    src={resolveMediaUrl(selectedItem.images?.[0] || selectedItem.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f')}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedItem.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedItem.images.map((img, idx) => (
                      <img key={idx} src={resolveMediaUrl(img)} alt="" className="w-14 h-14 rounded-xl object-cover border border-border cursor-pointer" />
                    ))}
                  </div>
                )}
              </div>

              {/* Specs & Pricing */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-text-primary">₹{Number(selectedItem.sellingPrice || selectedItem.price || 0).toLocaleString()}</span>
                    {selectedItem.actualPrice > selectedItem.price && (
                      <span className="text-xs text-text-tertiary line-through">₹{selectedItem.actualPrice}</span>
                    )}
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-md">In Stock</span>
                  </div>

                  <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                    {selectedItem.description || selectedItem.shortDescription || 'High quality product available directly from verified local shop vendor.'}
                  </p>

                  {/* Dynamic Labels */}
                  {selectedItem.labels?.length > 0 && (
                    <div className="pt-3 border-t border-border mt-3 space-y-1">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase">Product Labels:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedItem.labels.map((l, idx) => (
                          <span key={idx} className="px-2 py-1 bg-surface-tertiary text-text-primary rounded-lg text-[10px] font-semibold border border-border">
                            {l.key}: {l.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION MENU BUTTONS FOR CUSTOMER PORTAL */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Customer Actions Menu:</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => toggleSave(selectedItem._id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${savedItems[selectedItem._id] ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface-tertiary border-border text-text-secondary'}`}
                    >
                      <FiStar className={`w-5 h-5 ${savedItems[selectedItem._id] ? 'fill-amber-500 text-amber-500' : 'text-text-secondary'}`} />
                      <span>{savedItems[selectedItem._id] ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => toggleLike(selectedItem._id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${likedItems[selectedItem._id] ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-surface-tertiary border-border text-text-secondary'}`}
                    >
                      <FiHeart className={`w-5 h-5 ${likedItems[selectedItem._id] ? 'fill-red-500 text-red-500' : 'text-text-secondary'}`} />
                      <span>{likedItems[selectedItem._id] ? 'Liked' : 'Like'}</span>
                    </button>
                    <button
                      onClick={() => handleShare(selectedItem)}
                      className="p-2 rounded-xl bg-surface-tertiary border border-border text-xs font-bold text-text-secondary flex flex-col items-center gap-1 hover:text-text-primary"
                    >
                      <FiShare2 className="w-5 h-5 text-text-secondary" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => handleWhatsApp(selectedItem)}
                      className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 flex flex-col items-center gap-1 hover:bg-emerald-500/20"
                    >
                      <FaWhatsapp className="w-5 h-5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleCallRequest(selectedItem)}
                      className="py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-500 hover:bg-blue-500/20 flex items-center justify-center gap-1.5"
                    >
                      <FiPhone className="w-4 h-4 text-blue-500" />
                      <span>Call Request</span>
                    </button>
                    <button
                      onClick={() => handleInquire(selectedItem)}
                      className="py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-500 hover:bg-purple-500/20 flex items-center justify-center gap-1.5"
                    >
                      <FiMessageSquare className="w-4 h-4 text-purple-500" />
                      <span>Chat / Inquiry</span>
                    </button>
                    <button
                      onClick={() => handleOrderRequest(selectedItem)}
                      className="py-2.5 rounded-xl gradient-brand text-white text-xs font-bold shadow-premium hover:opacity-90 flex items-center justify-center gap-1.5"
                    >
                      <FiShoppingCart className="w-4 h-4 text-white" />
                      <span>Order Request</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Customer Reviews & Ratings</h4>
              
              <form onSubmit={handleAddReview} className="flex gap-2 items-center">
                <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} className="bg-surface-tertiary border border-border rounded-xl px-3 py-2 text-xs font-bold text-amber-500">
                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                  <option value={3}>⭐⭐⭐ (3)</option>
                </select>
                <input
                  type="text"
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Write your review for this product/vendor..."
                  className="flex-1 bg-surface-tertiary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                />
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold">Post Review</button>
              </form>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {reviewsList.length === 0 ? (
                  <p className="text-text-tertiary text-center py-4 text-xs">No reviews yet. Be the first to review!</p>
                ) : (
                  reviewsList.map(r => (
                    <div key={r._id || r.id} className="p-2.5 rounded-xl bg-surface-tertiary border border-border text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-text-primary">{r.author?.name || r.user || 'Anonymous'}</span>
                        <p className="text-text-secondary text-[11px] mt-0.5">{r.comment}</p>
                      </div>
                      <span className="text-amber-500 font-bold">{r.rating}★</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER CONFIRMED POPUP */}
      {orderConfirmedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 text-3xl font-bold flex items-center justify-center mx-auto border border-emerald-500/30">
              ✓
            </div>
            <h3 className="text-lg font-bold text-text-primary font-display">Order Request Confirmed!</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your order request has been successfully transmitted to the vendor. The vendor will contact you directly to confirm delivery and payment details.
            </p>
            <button
              onClick={() => setOrderConfirmedModal(false)}
              className="w-full py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
