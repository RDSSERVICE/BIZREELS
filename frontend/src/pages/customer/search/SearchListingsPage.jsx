import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiTool, FiMessageCircle, FiPackage, FiHeart, FiShare2, FiPhone, FiMessageSquare, FiShoppingCart, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api, resolveMediaUrl } from '../../../lib/api';
import OptimizedImage from '../../../components/common/OptimizedImage';
import { useAuth } from '../../../context/AuthContext';

const DISTANCE_VALUES = [
  { value: 'all', label: 'Anywhere' },
  { value: '2', label: '2 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: '50 km' }
];

function OfferCountdown({ validTill }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(validTill) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' ') + ' left');
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [validTill]);

  if (timeLeft === 'Expired') {
    return <span className="text-red-500 font-bold text-[10px] uppercase bg-red-500/10 px-2 py-0.5 rounded shadow-sm">Expired</span>;
  }

  return (
    <span className="text-brand-orange font-bold text-[10px] bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit animate-pulse">
      <FiClock className="animate-spin-slow" /> {timeLeft}
    </span>
  );
}

export default function SearchListingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); // 'all' | 'product' | 'service'
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [distance, setDistance] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [inquiringId, setInquiringId] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    if (!item) return;
    try {
      const listingId = item._id || item.id;
      await api.get(`/v1/listings/${listingId}`);
    } catch (err) {
      console.error('Failed to trigger listing view increment:', err);
    }
  };
  const [coords, setCoords] = useState(null);
  const [geocodedCache, setGeocodedCache] = useState({});
  const [savedItems, setSavedItems] = useState({});
  const [likedItems, setLikedItems] = useState({});
  const [orderConfirmedModal, setOrderConfirmedModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewsList, setReviewsList] = useState([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deliveryType, setDeliveryType] = useState([]);
  const [condition, setCondition] = useState('all');
  const [sellerType, setSellerType] = useState('all');
  const [minRating, setMinRating] = useState('all');
  const [hasOffers, setHasOffers] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [shopName, setShopName] = useState('');

  const toggleDeliveryType = (type) => {
    setDeliveryType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Fetch coordinates on mount / user location change
  useEffect(() => {
    const getCustomerCoords = async () => {
      // Prioritize user profile coordinates if they are valid (non-zero)
      if (user && user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
        const [lng, lat] = user.location.coordinates;
        if (parseFloat(lng) !== 0 || parseFloat(lat) !== 0) {
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
          return;
        }
      }

      // If user profile coordinates are [0, 0] or unset, try to geocode their address details using Google Maps API
      if (user && user.location && (user.location.city || user.location.address || user.location.pincode)) {
        const addressParts = [];
        if (user.location.address) addressParts.push(user.location.address);
        if (user.location.city) addressParts.push(user.location.city);
        if (user.location.state) addressParts.push(user.location.state);
        if (user.location.pincode) addressParts.push(user.location.pincode);
        const addressQuery = addressParts.join(', ');

        if (addressQuery.trim()) {
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (apiKey) {
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${apiKey}`);
              const data = await res.json();
              if (data && data.results && data.results.length > 0) {
                const loc = data.results[0].geometry.location;
                setCoords({ lat: loc.lat, lng: loc.lng });
                return;
              }
            }
          } catch (err) {
            console.warn('Google Geocoding error for customer:', err);
          }
        }
      }

      // Fallback to browser geolocation
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
    };

    getCustomerCoords();
  }, [user]);

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
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories');
        const items = res.data?.items || res.data?.data || [];
        setCategories(items);
      } catch (err) {
        console.warn('Failed to fetch categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Geocode vendor/listing locations if coordinates are [0, 0] or missing
  useEffect(() => {
    const geocodeVendors = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || listings.length === 0) return;

      const locationsToGeocode = [];
      for (const item of listings) {
        const vendorObj = item.vendor || item.vendorId || {};
        const city = item.city || vendorObj.city || item.location?.city;
        const address = item.location?.address || vendorObj.location?.address || vendorObj.address;
        const state = item.location?.state || vendorObj.location?.state || vendorObj.state;
        const pincode = item.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;

        const vendorCoords = (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
          ? vendorObj.location.coordinates
          : null;
        const itemCoords = (item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2 && (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0))
          ? item.location.coordinates
          : null;

        const targetCoords = itemCoords || vendorCoords;

        if (!targetCoords) {
          const locStr = [address, city, state, pincode].filter(Boolean).join(', ') || city;
          if (locStr && locStr.trim() && !geocodedCache[locStr]) {
            locationsToGeocode.push(locStr);
          }
        }
      }

      const uniqueToGeocode = [...new Set(locationsToGeocode)];
      if (uniqueToGeocode.length === 0) return;

      const newCacheResults = {};
      let updated = false;

      for (const locStr of uniqueToGeocode) {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locStr)}&key=${apiKey}`);
          const data = await res.json();
          if (data && data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            newCacheResults[locStr] = { lat: loc.lat, lng: loc.lng };
            updated = true;
          }
        } catch (err) {
          console.warn('Google Geocoding error for vendor:', locStr, err);
        }
      }

      if (updated) {
        setGeocodedCache(prev => ({ ...prev, ...newCacheResults }));
      }
    };

    geocodeVendors();
  }, [listings, geocodedCache]);

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

  const handleShare = async (item) => {
    const url = window.location.href;
    const shareData = {
      title: item.title || 'BizReels',
      text: `Check out ${item.title} on BizReels!`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('🔗 Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsApp = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const phone = vendorObj.phone || vendorObj.vendorProfile?.whatsapp || vendorObj.vendorProfile?.whatsappNumber || vendorObj.whatsappNumber || '';
    if (!phone) {
      toast.error('WhatsApp number not available for this vendor');
      return;
    }
    const text = encodeURIComponent(`Hi! I am interested in your item: "${item.title}". Please send more details.`);
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    // Track interaction for analytics overview
    try {
      const listingId = item._id || item.id;
      const targetUserId = vendorObj._id || vendorObj.id;
      await api.post('/v1/users/me/track-interaction', {
        type: 'whatsapp_contact',
        listingId,
        targetUserId,
      });
    } catch (err) {
      console.error('Failed to track WhatsApp interaction:', err);
    }

    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const handleCallRequest = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const listingId = item._id || item.id;
    try {
      await api.post('/v1/inquiries', {
        listingId,
        message: 'Customer requested a phone call callback.'
      });

      // Track interaction for analytics overview
      try {
        const targetUserId = vendorObj._id || vendorObj.id;
        await api.post('/v1/users/me/track-interaction', {
          type: 'click_to_call',
          listingId,
          targetUserId,
        });
      } catch (trackErr) {
        console.error('Failed to track call interaction:', trackErr);
      }

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
  }, [query, type, category, maxPrice, distance, coords, condition, sellerType, minRating, hasOffers, shopName, openNow, deliveryType]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (category !== 'all') params.append('category', category);
      if (query.trim()) params.append('search', query.trim());
      if (maxPrice < 200000) params.append('maxPrice', maxPrice);
      if (distance && distance !== 'all') params.append('distance', distance);
      if (condition !== 'all') params.append('condition', condition);
      if (sellerType !== 'all') params.append('sellerType', sellerType);
      if (minRating !== 'all') params.append('minRating', minRating);
      if (hasOffers) params.append('has_offer', 'true');
      if (shopName.trim()) params.append('shopName', shopName.trim());
      if (openNow) params.append('openNow', 'true');
      if (deliveryType.length > 0) params.append('deliveryType', deliveryType.join(','));
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

      // Track interaction for analytics overview
      try {
        await api.post('/v1/users/me/track-interaction', {
          type: 'chat_inquiry',
          listingId: item._id || item.id,
          targetUserId: vendorId,
        });
      } catch (trackErr) {
        console.error('Failed to track inquiry interaction:', trackErr);
      }

      toast.success(`Inquiry sent to ${vendorObj.name || vendorObj.shopName || 'Vendor'}! Redirecting to chat...`);
      const vendorName = encodeURIComponent(vendorObj.shopName || vendorObj.name || 'Vendor');
      const vendorAvatar = encodeURIComponent(vendorObj.avatarUrl || vendorObj.logo || '');
      navigate(`/customer/chat?vendorId=${vendorId}&name=${vendorName}&avatar=${vendorAvatar}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send inquiry to vendor');
    } finally {
      setInquiringId(null);
    }
  };

  // Calculate selected item distance formatted text
  let detailDistStr = '';
  if (selectedItem) {
    const vendorObj = selectedItem.vendor || selectedItem.vendorId || {};
    const city = selectedItem.city || vendorObj.city || selectedItem.location?.city;
    const address = selectedItem.location?.address || vendorObj.location?.address || vendorObj.address;
    const state = selectedItem.location?.state || vendorObj.location?.state || vendorObj.state;
    const pincode = selectedItem.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;
    const locStr = [address, city, state, pincode].filter(Boolean).join(', ') || city;

    const vendorCoords = (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
      ? vendorObj.location.coordinates
      : (geocodedCache[locStr] ? [geocodedCache[locStr].lng, geocodedCache[locStr].lat] : null);
    const itemCoords = (selectedItem.location && Array.isArray(selectedItem.location.coordinates) && selectedItem.location.coordinates.length === 2 && (selectedItem.location.coordinates[0] !== 0 || selectedItem.location.coordinates[1] !== 0))
      ? selectedItem.location.coordinates
      : null;

    const targetCoords = itemCoords || vendorCoords;

    if (coords && targetCoords && (coords.lat !== 0 || coords.lng !== 0)) {
      const [targetLng, targetLat] = targetCoords;
      const R = 6371; // Earth radius in km
      const dLat = (targetLat - coords.lat) * (Math.PI / 180);
      const dLng = (targetLng - coords.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords.lat * (Math.PI / 180)) *
        Math.cos(targetLat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculatedKm = R * c;
      if (calculatedKm < 6000) {
        detailDistStr = `${calculatedKm.toFixed(1)} km away from you`;
      } else {
        detailDistStr = 'Nearby';
      }
    } else if (selectedItem.distance !== undefined && selectedItem.distance !== null && selectedItem.distance / 1000 < 6000) {
      const km = selectedItem.distance / 1000;
      detailDistStr = `${km.toFixed(1)} km away from you`;
    } else if (selectedItem.distanceKm !== undefined && selectedItem.distanceKm !== null && Number(selectedItem.distanceKm) < 6000) {
      detailDistStr = `${Number(selectedItem.distanceKm).toFixed(1)} km away from you`;
    } else {
      detailDistStr = 'Nearby';
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSearch}
        title="Search Products & Services Nearby"
        subtitle="Filter local products, services, and vendor listings by distance, category, and price"
      />

      {/* Search & Filter Header Container */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
        {/* Top Search Row */}
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
            {/* A. Products / Services tab */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Types</option>
              <option value="product">Products Only</option>
              <option value="service">Services Only</option>
            </select>

            {/* B. Distance */}
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-brand-purple font-semibold focus:outline-none focus:border-brand-purple"
            >
              {DISTANCE_VALUES.map(d => (
                <option key={d.value} value={d.value}>{d.value === 'all' ? '📍 Anywhere' : `Within ${d.label}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Category & Price */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Categories</option>
              {(categories.length > 0 ? categories : [
                { name: 'Electronics' },
                { name: 'Fashion' },
                { name: 'Furniture' },
                { name: 'Services' },
                { name: 'Automobile' },
                { name: 'Grocery' },
                { name: 'Healthcare' },
                { name: 'Restaurant' },
                { name: 'Education' },
              ]).map(cat => (
                <option key={cat._id || cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
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

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${
              showAdvanced
                ? 'bg-brand-purple text-white border-brand-purple'
                : 'bg-surface-tertiary text-text-secondary border-border hover:border-brand-purple/40'
            }`}
          >
            {showAdvanced ? '▲ Hide Filters' : '▼ Advanced Filters'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-border animate-fade-in">
            {/* C. Delivery Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Delivery Type</label>
              <div className="flex flex-wrap gap-1.5">
                {['Home Delivery', 'Shop Pickup', 'Courier Available', 'COD Available'].map(dt => (
                  <button
                    key={dt}
                    onClick={() => toggleDeliveryType(dt)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition border ${
                      deliveryType.includes(dt)
                        ? 'bg-brand-purple text-white border-brand-purple'
                        : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            {/* D. Product Type / Condition */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Product Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Conditions</option>
                <option value="new">New</option>
                <option value="used">Old / Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            {/* E. Seller / Vendor Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Seller Type</label>
              <select
                value={sellerType}
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Sellers</option>
                <option value="verified">✅ Verified Vendor</option>
                <option value="gst_verified">📋 GST Verified</option>
                <option value="local">📍 Local Seller</option>
              </select>
            </div>

            {/* F. Rating */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="all">Any Rating</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="3">⭐ 3+ Stars</option>
                <option value="2">⭐ 2+ Stars</option>
                <option value="1">⭐ 1+ Star</option>
              </select>
            </div>

            {/* H. Offers */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Offers & Discounts</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOffers}
                  onChange={(e) => setHasOffers(e.target.checked)}
                  className="accent-brand-purple w-4 h-4 rounded"
                />
                <span className="text-xs text-text-primary font-semibold">Show items with offers only</span>
              </label>
            </div>

            {/* J. Shop Availability */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Shop Availability</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded"
                />
                <span className="text-xs text-text-primary font-semibold">🟢 Open Now</span>
              </label>
            </div>

            {/* K. Shop Name */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Search by Shop Name</label>
              <div className="relative">
                <FiShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Kumar Electronics, Sharma Services..."
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>
          </div>
        )}
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
            let distStr = 'Local';
            const itemAddress = item.location?.address || vendorObj.location?.address || vendorObj.address;
            const itemState = item.location?.state || vendorObj.location?.state || vendorObj.state;
            const itemPincode = item.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;
            const itemLocStr = [itemAddress, city, itemState, itemPincode].filter(Boolean).join(', ') || city;

            const vendorCoords = (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
              ? vendorObj.location.coordinates
              : (geocodedCache[itemLocStr] ? [geocodedCache[itemLocStr].lng, geocodedCache[itemLocStr].lat] : null);
            const itemCoords = (item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2 && (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0))
              ? item.location.coordinates
              : null;

            const targetCoords = itemCoords || vendorCoords;

            if (coords && targetCoords && (coords.lat !== 0 || coords.lng !== 0)) {
              const [targetLng, targetLat] = targetCoords;
              const R = 6371; // Earth radius in km
              const dLat = (targetLat - coords.lat) * (Math.PI / 180);
              const dLng = (targetLng - coords.lng) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(coords.lat * (Math.PI / 180)) *
                Math.cos(targetLat * (Math.PI / 180)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const calculatedKm = R * c;
              if (calculatedKm < 6000) {
                distStr = `${calculatedKm.toFixed(1)} km`;
              }
            } else if (item.distance !== undefined && item.distance !== null && item.distance / 1000 < 6000) {
              const km = item.distance / 1000;
              distStr = `${km.toFixed(1)} km`;
            } else if (item.distanceKm !== undefined && item.distanceKm !== null && Number(item.distanceKm) < 6000) {
              distStr = `${Number(item.distanceKm).toFixed(1)} km`;
            }

            return (
              <div
                key={itemId}
                className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                onClick={() => handleSelectItem(item)}
              >
                <div className="aspect-video bg-surface-tertiary relative overflow-hidden">
                  <OptimizedImage src={imageUrl} alt={item.title} className="w-full h-full object-cover" width={400} />
                  <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-brand-purple uppercase border border-border flex items-center gap-1">
                    {isService ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                    {item.type || 'product'}
                  </div>
                  <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-600 border border-border">
                    {distStr === 'Local' ? 'Nearby' : `${distStr} away`}
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
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        const vendorId = vendorObj._id || vendorObj.id || item.vendor;
                        if (vendorId) {
                          navigate(`/customer/vendor/${vendorId}`);
                        }
                      }}
                      className="text-xs text-text-tertiary hover:text-brand-purple cursor-pointer transition mt-1 flex items-center gap-1 font-medium"
                    >
                      <FiMapPin size={12} className="text-brand-orange" />
                      <span>{vendorName} ({city}) {distStr !== 'Local' && <strong className="text-emerald-600 font-bold ml-1">• {distStr} away</strong>}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-base font-extrabold text-text-primary">
                      ₹{Number(item.price || 0).toLocaleString()}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectItem(item); }}
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
                <p
                  onClick={() => {
                    const vendorId = selectedItem.vendor?._id || selectedItem.vendor?.id || selectedItem.vendor;
                    if (vendorId) {
                      setSelectedItem(null);
                      navigate(`/customer/vendor/${vendorId}`);
                    }
                  }}
                  className="text-xs text-text-tertiary hover:text-brand-purple cursor-pointer transition flex items-center gap-1 mt-0.5 font-medium"
                >
                  <FiMapPin className="text-brand-orange" /> {(selectedItem.vendor?.shopName || selectedItem.vendor?.name || 'Verified Vendor')} ({selectedItem.city || 'Local Shop'})
                  {detailDistStr && <strong className="text-emerald-600 font-bold ml-1.5">• {detailDistStr}</strong>}
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
                  <OptimizedImage
                    src={resolveMediaUrl(selectedItem.images?.[0] || selectedItem.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f')}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                    width={600}
                  />
                </div>
                {selectedItem.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedItem.images.map((img, idx) => (
                      <OptimizedImage key={idx} src={resolveMediaUrl(img)} alt="" className="w-14 h-14 rounded-xl object-cover border border-border cursor-pointer" width={100} />
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
                      onClick={() => toggleSave(selectedItem._id || selectedItem.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${savedItems[selectedItem._id || selectedItem.id] ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface-tertiary border-border text-text-secondary'}`}
                    >
                      <FiStar className={`w-5 h-5 ${savedItems[selectedItem._id || selectedItem.id] ? 'fill-amber-500 text-amber-500' : 'text-text-secondary'}`} />
                      <span>{savedItems[selectedItem._id || selectedItem.id] ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => toggleLike(selectedItem._id || selectedItem.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${likedItems[selectedItem._id || selectedItem.id] ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-surface-tertiary border-border text-text-secondary'}`}
                    >
                      <FiHeart className={`w-5 h-5 ${likedItems[selectedItem._id || selectedItem.id] ? 'fill-red-500 text-red-500' : 'text-text-secondary'}`} />
                      <span>{likedItems[selectedItem._id || selectedItem.id] ? 'Liked' : 'Like'}</span>
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

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => handleCallRequest(selectedItem)}
                      className="py-3 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 text-[11px] sm:text-xs font-bold text-blue-600 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <FiPhone className="w-4 h-4 text-blue-600" />
                      <span className="truncate">Call Request</span>
                    </button>
                    <button
                      onClick={() => handleInquire(selectedItem)}
                      className="py-3 rounded-2xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 text-[11px] sm:text-xs font-bold text-purple-600 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <FiMessageSquare className="w-4 h-4 text-purple-600" />
                      <span className="truncate">Chat / Inquiry</span>
                    </button>
                    <button
                      onClick={() => handleOrderRequest(selectedItem)}
                      className="py-3 rounded-2xl gradient-brand text-white text-[11px] sm:text-xs font-bold shadow-premium hover:brightness-105 transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <FiShoppingCart className="w-4 h-4 text-white" />
                      <span className="truncate">Order Request</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details Section */}
            {selectedItem.type === 'service' && selectedItem.serviceDetails && (
              <div className="pt-4 border-t border-border mt-3 space-y-4">
                <span className="text-[10px] font-bold text-brand-purple uppercase block tracking-wider">Service Details & Availability:</span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-secondary p-4 rounded-2xl border border-border">
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Service Location Type</span>
                    <span className="text-xs font-bold text-text-primary">{selectedItem.serviceDetails.serviceType || 'On-site'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Price Unit / Type</span>
                    <span className="text-xs font-bold text-text-primary">{selectedItem.serviceDetails.priceType || 'Fixed Price'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Min Order Value</span>
                    <span className="text-xs font-bold text-emerald-600">₹{(selectedItem.serviceDetails.minOrderValue || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Standard Duration</span>
                    <span className="text-xs font-bold text-text-primary">{selectedItem.serviceDetails.durationText || '1 Hour'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Working Hours</span>
                    <span className="text-xs font-bold text-text-primary">{selectedItem.serviceDetails.workingHours || '09:00 AM - 08:00 PM'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Emergency Service (24x7)</span>
                    <span className={`text-xs font-bold uppercase ${selectedItem.serviceDetails.emergencyService24x7 ? 'text-emerald-600' : 'text-text-tertiary'}`}>
                      {selectedItem.serviceDetails.emergencyService24x7 ? 'Yes (24/7)' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Additional availability highlights */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${selectedItem.serviceDetails.homeVisitAvailable ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                    {selectedItem.serviceDetails.homeVisitAvailable ? '✓ Home Visit Available' : '✗ No Home Visits'}
                  </span>
                  {selectedItem.serviceDetails.maxTravelDistanceKm && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                      ↔ Max Travel Distance: {selectedItem.serviceDetails.maxTravelDistanceKm} km
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${selectedItem.serviceDetails.advanceBookingRequired ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20'}`}>
                    {selectedItem.serviceDetails.advanceBookingRequired ? '⚠ Advance Booking Required' : 'Instant Booking'}
                  </span>
                </div>

                {/* Working Days */}
                {selectedItem.serviceDetails.workingDays && selectedItem.serviceDetails.workingDays.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-tertiary block">Operational Days:</span>
                    <div className="flex gap-1 flex-wrap">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const active = selectedItem.serviceDetails.workingDays.includes(day);
                        return (
                          <span key={day} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${active ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface-tertiary text-text-tertiary border-border'}`}>
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Service Area & Location */}
                {selectedItem.serviceDetails.serviceArea && (
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Service Coverage Area</span>
                    <p className="text-xs text-text-secondary">{selectedItem.serviceDetails.serviceArea}</p>
                  </div>
                )}

                {/* Policies */}
                {selectedItem.serviceDetails?.policies && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    {selectedItem.serviceDetails.policies.cancellationPolicy && (
                      <div className="bg-surface p-3 rounded-xl border border-border">
                        <span className="text-[9px] font-bold text-brand-orange block uppercase">Cancellation Policy</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{selectedItem.serviceDetails.policies.cancellationPolicy}</p>
                      </div>
                    )}
                    {selectedItem.serviceDetails.policies.refundPolicy && (
                      <div className="bg-surface p-3 rounded-xl border border-border">
                        <span className="text-[9px] font-bold text-emerald-600 block uppercase">Refund Policy</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{selectedItem.serviceDetails.policies.refundPolicy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Active Offers Section */}
            {((selectedItem.offers && selectedItem.offers.length > 0) || (selectedItem.vendor?.offers && selectedItem.vendor.offers.length > 0)) && (
              <div className="pt-4 border-t border-border mt-3 space-y-2 bg-gradient-to-r from-brand-pink/5 via-brand-purple/5 to-transparent p-4 rounded-2xl border border-brand-purple/10">
                <span className="text-[10px] font-bold text-brand-purple uppercase block tracking-wider">Active Deals & Limited-Time Offers:</span>
                <div className="space-y-3">
                  {[...(selectedItem.offers || []), ...(selectedItem.vendor?.offers || [])]
                    .filter(off => off.is_active !== false)
                    .map((off, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-surface p-3 rounded-xl border border-brand-pink/20 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-brand-pink text-white rounded text-[10px] font-black uppercase">
                              {off.discountPct}% OFF
                            </span>
                            <span className="text-xs font-bold text-text-primary">{off.title}</span>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{off.description}</p>
                          <div className="text-[10px] text-text-tertiary">
                            Use Code: <strong className="text-brand-purple font-mono uppercase bg-brand-purple/5 px-1.5 py-0.5 rounded">{off.couponCode}</strong>
                          </div>
                        </div>
                        {off.validTill && (
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className="text-[10px] text-text-tertiary">Expires: {new Date(off.validTill).toLocaleDateString()}</span>
                            <OfferCountdown validTill={off.validTill} />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

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