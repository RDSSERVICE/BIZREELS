import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiTool, FiMessageCircle, FiPackage, FiHeart, FiShare2, FiPhone, FiMessageSquare, FiShoppingCart, FiClock, FiCheck, FiFilter } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
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
    return <span className="text-red-600 font-bold text-[10px] uppercase bg-red-100 px-2 py-0.5 rounded border border-red-200">Expired</span>;
  }

  return (
    <span className="text-[#1a1a1a] font-black text-[10px] bg-[#d99a3d] border border-[#1a1a1a]/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit animate-pulse">
      <FiClock className="animate-spin-slow" /> {timeLeft}
    </span>
  );
}

export default function SearchListingsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [distance, setDistance] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [inquiringId, setInquiringId] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (productId) {
      const fetchSelectedProduct = async () => {
        try {
          const res = await api.get(`/v1/listings/${productId}`);
          const item = res.data?.listing || res.data?.data?.listing || res.data || null;
          if (item) {
            setSelectedItem(item);
          }
        } catch (err) {
          console.error('Failed to fetch product for direct link view:', err);
        }
      };
      fetchSelectedProduct();
    }
  }, [productId]);

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

  const toggleDeliveryType = (t) => {
    setDeliveryType((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

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
      const itemId = item._id || item.id;
      const productLink = `${window.location.origin}/customer/product/${itemId}`;
      await api.post('/v1/chat/messages', {
        recipientId: vendorId,
        text: `Hello! I am interested in your listing: "${item.title}". Could you share more details?\nProduct Link: ${productLink}`
      });

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

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 font-sans p-2 sm:p-4 min-h-screen">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">CUSTOMER PORTAL</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            DISCOVER MARKETPLACE LISTINGS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Filter local products, services, and verified vendor storefronts by location, category, and price.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiSearch size={20} />
        </div>
      </div>

      {/* Search & Filter Controls Bento Container */}
      <div className="bg-white rounded-md p-4 sm:p-5 border border-[#e3dccb] shadow-xs space-y-4">
        {/* Top Search Input Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 flex items-center gap-2 bg-[#f8f4ec] rounded-md border border-[#e3dccb] px-3 py-1.5 focus-within:border-[#d99a3d] focus-within:ring-2 focus-within:ring-[#d99a3d]/20 transition-all">
            <div className="w-7 h-7 rounded bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center shrink-0 border border-[#1a1a1a]">
              <FiSearch size={15} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name, service, brand, or keyword..."
              className="w-full bg-transparent text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
            {/* Products / Services filter */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 sm:flex-none bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs text-[#1a1a1a] font-bold focus:outline-none focus:border-[#d99a3d] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="product">Products Only</option>
              <option value="service">Services Only</option>
            </select>

            {/* Distance select */}
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="flex-1 sm:flex-none bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-md px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              {DISTANCE_VALUES.map(d => (
                <option key={d.value} value={d.value}>{d.value === 'all' ? '📍 Anywhere' : `Within ${d.label}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Category & Price */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#e3dccb] gap-4 text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider font-extrabold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-1.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
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
            <span className="text-[#1a1a1a] font-extrabold text-xs">Max Price: ₹{maxPrice.toLocaleString()}</span>
            <input
              type="range"
              min={1000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#d99a3d] cursor-pointer w-32"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition border cursor-pointer ${
              showAdvanced
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb] hover:bg-slate-200'
            }`}
          >
            {showAdvanced ? '▲ Hide Advanced Filters' : '▼ Advanced Filters'}
          </button>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-slate-500">Searching live database listings...</div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-md border border-[#e3dccb] space-y-2 p-8 shadow-xs">
          <p className="font-extrabold text-[#1a1a1a] text-sm">No listings match your search criteria</p>
          <p className="text-xs">Try clearing search keywords or increasing max price and distance filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => {
            const itemId = item._id || item.id;
            const vendorObj = item.vendor || item.vendorId || {};
            const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Verified Vendor';
            const city = item.city || vendorObj.city || item.location?.city || 'Local';
            const rawImage = item.images?.[0] || item.image || item.mediaUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
            const imageUrl = resolveMediaUrl(rawImage);
            const isService = item.type === 'service';

            return (
              <div
                key={itemId}
                className="bg-white rounded-md border border-[#e3dccb] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                onClick={() => handleSelectItem(item)}
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <OptimizedImage src={imageUrl} alt={item.title} className="w-full h-full object-cover" width={400} />
                  <div className="absolute top-3 left-3 bg-[#241b15] text-[#d99a3d] px-2.5 py-1 rounded text-[9.5px] font-black uppercase border border-[#1a1a1a] flex items-center gap-1">
                    {isService ? <FiTool size={11} /> : <FiShoppingBag size={11} />}
                    {item.type || 'product'}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#d99a3d] text-[#1a1a1a] px-2.5 py-1 rounded text-xs font-black shadow-xs border border-[#1a1a1a]/10">
                    ₹{item.price?.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 mb-1">
                      <span className="uppercase tracking-wider">{item.category || 'General'}</span>
                      <span className="flex items-center gap-1 text-[#1a1a1a] font-extrabold bg-[#f8f4ec] px-1.5 py-0.5 rounded border border-[#e3dccb]">
                        <FiStar size={11} className="text-[#d99a3d] fill-[#d99a3d]" />
                        {item.rating || '4.8'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1a1a1a] line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-slate-500 transition mt-1 flex items-center gap-1 font-bold">
                      <FiMapPin size={12} className="text-[#d99a3d]" />
                      <span>{vendorName} ({city})</span>
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInquire(item);
                    }}
                    disabled={inquiringId === itemId}
                    className="w-full py-2 px-3 rounded text-xs font-black uppercase bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] transition border border-[#241b15] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FiMessageSquare size={14} />
                    <span>Inquire Vendor</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}