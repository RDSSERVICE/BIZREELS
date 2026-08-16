import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiSearch, FiPackage, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

// Subcomponents
import SearchFiltersBar from './components/SearchFiltersBar';
import ListingCard from './components/ListingCard';
import ListingDetailModal from './components/ListingDetailModal';
import OrderConfirmedModal from './components/OrderConfirmedModal';
import BookServiceModal from '../activities/components/BookServiceModal';

export default function SearchListingsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProductId = productId || searchParams.get('productId') || searchParams.get('id');
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
  const [bookingService, setBookingService] = useState(null);
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

  const toggleDeliveryType = (t) => {
    setDeliveryType((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // Direct product modal view from link/param
  useEffect(() => {
    if (queryProductId) {
      const fetchSelectedProduct = async () => {
        try {
          const res = await api.get(`/v1/listings/${queryProductId}`);
          const item = res.data?.listing || res.data?.data?.listing || res.data?.data || res.data || null;
          if (item) {
            setSelectedItem(item);
          }
        } catch (err) {
          console.error('Failed to fetch product for direct link view:', err);
        }
      };
      fetchSelectedProduct();
    }
  }, [queryProductId]);

  const handleSelectItem = (item) => {
    if (!item) return;
    const listingId = item._id || item.id;
    navigate(`/customer/listings/${listingId}`, { state: { listing: item } });
  };

  // Fetch coordinates on mount / user location change
  useEffect(() => {
    const getCustomerCoords = async () => {
      if (user && user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
        const [lng, lat] = user.location.coordinates;
        if (parseFloat(lng) !== 0 || parseFloat(lat) !== 0) {
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
          return;
        }
      }

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
              const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${apiKey}`
              );
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

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
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
        api.get('/v1/interactions/me/saved').catch(() => ({ data: { items: [] } })),
        api.get('/v1/interactions/me/liked').catch(() => ({ data: { items: [] } })),
      ]);
      const savedMap = {};
      const likedMap = {};

      const savedList = savedRes.data?.items || savedRes.data?.data?.items || savedRes.data || [];
      const likedList = likedRes.data?.items || likedRes.data?.data?.items || likedRes.data || [];

      if (Array.isArray(savedList)) {
        savedList.forEach((item) => {
          const id = item._id || item.id || item.listing_id;
          if (id) savedMap[id] = true;
        });
      }

      if (Array.isArray(likedList)) {
        likedList.forEach((item) => {
          const id = item._id || item.id || item.listing_id;
          if (id) likedMap[id] = true;
        });
      }

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

        const vendorCoords =
          vendorObj.location &&
          Array.isArray(vendorObj.location.coordinates) &&
          vendorObj.location.coordinates.length === 2 &&
          (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0)
            ? vendorObj.location.coordinates
            : null;
        const itemCoords =
          item.location &&
          Array.isArray(item.location.coordinates) &&
          item.location.coordinates.length === 2 &&
          (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0)
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
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locStr)}&key=${apiKey}`
          );
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
        setGeocodedCache((prev) => ({ ...prev, ...newCacheResults }));
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

  // Toggle Save (Bookmark)
  const toggleSave = async (id) => {
    const isSaved = !!savedItems[id];
    setSavedItems((prev) => ({ ...prev, [id]: !isSaved }));
    try {
      const res = await api.post(`/v1/listings/${id}/save`);
      const activeState = res.data?.active !== undefined ? res.data.active : !isSaved;
      setSavedItems((prev) => ({ ...prev, [id]: activeState }));
      toast.success(activeState ? '🔖 Saved to My Bookmarks!' : 'Removed from Saved');
    } catch {
      setSavedItems((prev) => ({ ...prev, [id]: isSaved }));
      toast.error('Failed to update bookmark');
    }
  };

  // Toggle Like
  const toggleLike = async (id) => {
    const isLiked = !!likedItems[id];
    setLikedItems((prev) => ({ ...prev, [id]: !isLiked }));
    try {
      const res = await api.post(`/v1/listings/${id}/like`);
      const activeState = res.data?.active !== undefined ? res.data.active : !isLiked;
      setLikedItems((prev) => ({ ...prev, [id]: activeState }));
      toast.success(activeState ? '❤️ Liked!' : 'Unliked');
    } catch {
      setLikedItems((prev) => ({ ...prev, [id]: isLiked }));
      toast.error('Failed to update like status');
    }
  };

  // Share Listing
  const handleShare = async (item) => {
    const itemId = item._id || item.id;
    const shareUrl = `${window.location.origin}/customer/search?productId=${itemId}`;
    const shareData = {
      title: item.title || 'BizReels Listing',
      text: `Check out "${item.title}" on BizReels!`,
      url: shareUrl,
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
      await navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Product link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // WhatsApp Contact
  const handleWhatsApp = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const phone =
      vendorObj.phone ||
      vendorObj.vendorProfile?.whatsapp ||
      vendorObj.vendorProfile?.whatsappNumber ||
      vendorObj.whatsappNumber ||
      '';
    if (!phone) {
      toast.error('WhatsApp contact is not configured for this vendor');
      return;
    }
    const productLink = `${window.location.origin}/customer/search?productId=${item._id || item.id}`;
    const text = encodeURIComponent(
      `Hello! I found your listing "${item.title}" on BizReels.\nLink: ${productLink}\nPlease provide more details.`
    );
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    try {
      const listingId = item._id || item.id;
      const targetUserId = vendorObj._id || vendorObj.id;
      await api.post('/v1/users/me/track-interaction', {
        type: 'whatsapp_contact',
        listingId,
        targetUserId,
      });
    } catch (err) {
      console.warn('Failed to track WhatsApp interaction:', err);
    }

    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  // Call Request
  const handleCallRequest = async (item) => {
    const vendorObj = item.vendor || item.vendorId || {};
    const listingId = item._id || item.id;
    try {
      await api.post('/v1/inquiries', {
        listingId,
        message: 'Customer requested a phone callback for this listing.',
      });

      try {
        const targetUserId = vendorObj._id || vendorObj.id;
        await api.post('/v1/users/me/track-interaction', {
          type: 'click_to_call',
          listingId,
          targetUserId,
        });
      } catch (trackErr) {
        console.warn('Failed to track call interaction:', trackErr);
      }

      toast.success(
        `📞 Callback request sent to ${vendorObj.name || vendorObj.shopName || 'Vendor'}! They will reach out soon.`
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send call request';
      toast.error(msg);
    }
  };

  // Direct Vendor Order Request
  const handleOrderRequest = async (item, orderPayload = {}) => {
    try {
      const listingId = item._id || item.id;

      await api.post('/v1/orders', {
        listingId,
        quantity: orderPayload.quantity || 1,
        address: orderPayload.address || user?.location?.address || 'Customer Primary Address',
        paymentMethod: orderPayload.paymentMethod || 'vendor_upi',
        paymentDetails: orderPayload.paymentDetails || null,
      });

      setOrderConfirmedModal(true);
      toast.success('🎉 Order Request Confirmed and transmitted to Vendor!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order request';
      toast.error(msg);
      throw err;
    }
  };

  // Post Review
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return toast.error('Please enter a review comment');
    if (!selectedItem) return;

    try {
      const targetListing = selectedItem._id || selectedItem.id;
      await api.post('/v1/reviews', {
        targetListingId: targetListing,
        rating: reviewRating,
        comment: reviewText.trim(),
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
  }, [
    query,
    type,
    category,
    maxPrice,
    distance,
    coords,
    condition,
    sellerType,
    minRating,
    hasOffers,
    shopName,
    openNow,
    deliveryType,
  ]);

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
      const itemId = item._id || item.id;
      const productLink = `${window.location.origin}/customer/search?productId=${itemId}`;
      await api.post('/v1/chat/messages', {
        recipientId: vendorId,
        text: `Hello! I am interested in your listing: "${item.title}". Could you share more details?\nProduct Link: ${productLink}`,
      });

      try {
        await api.post('/v1/users/me/track-interaction', {
          type: 'chat_inquiry',
          listingId: item._id || item.id,
          targetUserId: vendorId,
        });
      } catch (trackErr) {
        console.warn('Failed to track inquiry interaction:', trackErr);
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

    const vendorCoords =
      vendorObj.location &&
      Array.isArray(vendorObj.location.coordinates) &&
      vendorObj.location.coordinates.length === 2 &&
      (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0)
        ? vendorObj.location.coordinates
        : geocodedCache[locStr]
        ? [geocodedCache[locStr].lng, geocodedCache[locStr].lat]
        : null;
    const itemCoords =
      selectedItem.location &&
      Array.isArray(selectedItem.location.coordinates) &&
      selectedItem.location.coordinates.length === 2 &&
      (selectedItem.location.coordinates[0] !== 0 || selectedItem.location.coordinates[1] !== 0)
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
    } else if (
      selectedItem.distance !== undefined &&
      selectedItem.distance !== null &&
      selectedItem.distance / 1000 < 6000
    ) {
      const km = selectedItem.distance / 1000;
      detailDistStr = `${km.toFixed(1)} km away from you`;
    } else if (
      selectedItem.distanceKm !== undefined &&
      selectedItem.distanceKm !== null &&
      Number(selectedItem.distanceKm) < 6000
    ) {
      detailDistStr = `${Number(selectedItem.distanceKm).toFixed(1)} km away from you`;
    } else {
      detailDistStr = 'Nearby';
    }
  }

  return (
    <div className="min-h-full bg-[#f8f4ec] py-4 px-3 sm:px-6 pb-24 sm:pb-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
        
        {/* ── Page Header matching Home Feed ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3dccb] pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight">
              Explore Products & Services
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Discover verified local vendors, deals, and service providers near you
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-[#e3dccb] w-fit shadow-xs">
            {listings.length} Results Found
          </span>
        </div>

        {/* ── Search & Filter Controls Bar ── */}
        <SearchFiltersBar
          query={query}
          setQuery={setQuery}
          type={type}
          setType={setType}
          distance={distance}
          setDistance={setDistance}
          category={category}
          setCategory={setCategory}
          categories={categories}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          condition={condition}
          setCondition={setCondition}
          sellerType={sellerType}
          setSellerType={setSellerType}
          minRating={minRating}
          setMinRating={setMinRating}
          hasOffers={hasOffers}
          setHasOffers={setHasOffers}
          openNow={openNow}
          setOpenNow={setOpenNow}
          shopName={shopName}
          setShopName={setShopName}
          deliveryType={deliveryType}
          toggleDeliveryType={toggleDeliveryType}
        />

        {/* ── Search Results Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e3dccb] p-4 space-y-3 animate-pulse">
                <div className="w-full aspect-[4/3] bg-slate-200 rounded-lg" />
                <div className="w-2/3 h-4 bg-slate-200 rounded" />
                <div className="w-1/3 h-3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
            <p className="text-sm font-bold text-[#1a1a1a]">No listings match your search criteria</p>
            <p className="text-xs">Try searching with different keywords, widening the distance, or increasing budget.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => {
              const itemId = item._id || item.id;
              return (
                <ListingCard
                  key={itemId}
                  item={item}
                  coords={coords}
                  geocodedCache={geocodedCache}
                  onSelect={handleSelectItem}
                  isSaved={!!savedItems[itemId]}
                  isLiked={!!likedItems[itemId]}
                  onToggleSave={toggleSave}
                  onToggleLike={toggleLike}
                  onShare={handleShare}
                  onWhatsApp={handleWhatsApp}
                />
              );
            })}
          </div>
        )}

        {/* ── Full Product & Service Detail Modal with Direct Payment & Reviews ── */}
        <ListingDetailModal
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          detailDistStr={detailDistStr}
          savedItems={savedItems}
          likedItems={likedItems}
          toggleSave={toggleSave}
          toggleLike={toggleLike}
          handleShare={handleShare}
          handleWhatsApp={handleWhatsApp}
          handleCallRequest={handleCallRequest}
          handleInquire={handleInquire}
          handleOrderRequest={handleOrderRequest}
          reviewsList={reviewsList}
          reviewRating={reviewRating}
          setReviewRating={setReviewRating}
          reviewText={reviewText}
          setReviewText={setReviewText}
          handleAddReview={handleAddReview}
          onOpenBookService={(service) => setBookingService(service)}
        />

        {/* ── Realtime Service Booking Modal matching Customer Activities ── */}
        <BookServiceModal
          isOpen={!!bookingService}
          service={bookingService}
          onClose={() => setBookingService(null)}
          onSuccess={() => {
            setBookingService(null);
            setOrderConfirmedModal(true);
          }}
        />

        {/* ── Order Confirmed Popup ── */}
        <OrderConfirmedModal
          isOpen={orderConfirmedModal}
          onClose={() => setOrderConfirmedModal(false)}
          isService={selectedItem?.type === 'service' || !!bookingService}
        />
      </div>
    </div>
  );
}