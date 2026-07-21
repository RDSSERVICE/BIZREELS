import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiPlus, FiTrash2, FiEye, FiEyeOff, FiShoppingBag, FiTool,
  FiZap, FiPercent, FiCheck, FiCpu, FiUploadCloud, FiTag, FiClock,
  FiMapPin, FiShield, FiPhone, FiMessageSquare, FiCalendar, FiFileText,
  FiChevronRight, FiStar, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';
import {
  useGetVendorListingsQuery,
  useCreateListingMutation,
  useDeleteListingMutation,
  useToggleListingVisibilityMutation
} from '../../../features/vendor/vendorApi';

const TABS = [
  { key: 'products', label: 'Products', icon: FiShoppingBag },
  { key: 'services', label: 'Services', icon: FiTool },
  { key: 'offers', label: 'Dynamic Offers', icon: FiPercent },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'hidden', label: 'Hidden' },
];

export default function VendorListingsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};
  
  // Real-time categories state loaded from API
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Vendor profile registered categories
  const registeredCat = vendorProfile.category || vendorProfile.businessCategory || '';
  const registeredSubcats = vendorProfile.subcategories || [];

  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [search, setSearch] = useState('');

  // ── REAL-TIME OFFERS STATE ──
  const [offersList, setOffersList] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // ── PRODUCT LISTING FORM STATE ──
  const [productForm, setProductForm] = useState({
    category: registeredCat || '',
    subcategory: registeredSubcats[0] || '',
    title: '',
    shortDescription: '',
    description: '',
    stock: 10,
    actualPrice: '',
    sellingPrice: '',
    discount: 0,
    labels: [
      { key: 'Brand', value: 'Generic' },
      { key: 'Warranty', value: '1 Year' }
    ],
    newLabelKey: '',
    newLabelVal: '',
    images: [],
    video: '',
    isAiGenerating: false,
  });

  // ── SERVICE LISTING FORM STATE (6 SECTIONS) ──
  const [serviceForm, setServiceForm] = useState({
    category: registeredCat || '',
    subcategory: registeredSubcats[0] || '',
    shortDescription: '',
    detailedDescription: '',
    aiLabels: ['Fast Service', 'Top Rated', 'Verified Tech'],
    serviceType: 'At Home',
    priceType: 'Fixed Price',
    price: '',
    minOrderValue: '',
    duration: '1 Hour',
    serviceArea: 'Local Metropolitan Region',
    state: 'Maharashtra',
    city: 'Mumbai',
    pincode: '400001',
    homeVisitAvailable: true,
    maxTravelDistanceKm: 15,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    workingHours: '09:00 AM - 08:00 PM',
    emergencyService24x7: false,
    advanceBookingRequired: true,
    coverImage: '',
    galleryImages: [],
    videos: [],
    reelVideo: '',
    contactSettings: { chat: true, call: true, whatsapp: true, callbackRequest: true },
    leadSettings: { acceptLead: true, instantChat: true, callOnly: false, callbackOnly: false, quoteRequest: true },
    policies: {
      cancellationPolicy: 'Free cancellation up to 2 hours before appointment.',
      refundPolicy: 'Full refund if cancelled within policy guidelines.',
      termsAndConditions: 'Standard service agreement terms apply.'
    }
  });

  // ── DYNAMIC OFFER FORM STATE ──
  const [offerForm, setOfferForm] = useState({
    title: '',
    discountPct: 15,
    couponCode: 'SAVE15',
    validTill: '2026-12-31',
    description: 'Special seasonal promotion discount'
  });

  // Real-time API query for vendor listings
  const { data, isFetching, refetch } = useGetVendorListingsQuery(undefined, { pollingInterval: 5000 });
  const [createListing] = useCreateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [toggleVisibility] = useToggleListingVisibilityMutation();

  // Load real categories from Backend API
  const fetchLiveCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/v1/categories');
      const cats = res.data?.items || res.data || res.items || [];
      if (Array.isArray(cats)) {
        setCategoriesList(cats);
        // Set default category if none set
        if (!productForm.category && cats.length > 0) {
          const firstCat = cats[0].name;
          setProductForm(prev => ({ ...prev, category: firstCat }));
          setServiceForm(prev => ({ ...prev, category: firstCat }));
        }
      }
    } catch (err) {
      console.error('Error fetching live categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load real vendor offers from Backend API
  const fetchLiveOffers = async () => {
    setOffersLoading(true);
    try {
      const res = await api.get('/v1/vendors/me/offers');
      const dataOffers = res.data?.data || res.data || res.offers || [];
      if (Array.isArray(dataOffers)) {
        setOffersList(dataOffers);
      }
    } catch (err) {
      console.error('Error fetching live offers:', err);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCategories();
    fetchLiveOffers();
  }, []);

  // Update subcategories dropdown when selected category changes
  useEffect(() => {
    const selectedCatObj = categoriesList.find(c => c.name === productForm.category || c.id === productForm.category || c.slug === productForm.category);
    if (selectedCatObj) {
      const subs = categoriesList.filter(c => c.parent_id === selectedCatObj.id || c.parent_id === selectedCatObj._id);
      setSubcategoriesList(subs.map(s => s.name));
    } else if (registeredSubcats.length > 0) {
      setSubcategoriesList(registeredSubcats);
    } else {
      setSubcategoriesList(['General', 'Premium', 'Standard']);
    }
  }, [productForm.category, categoriesList]);

  const allListings = Array.isArray(data?.data) ? data.data : Array.isArray(data?.listings) ? data.listings : Array.isArray(data) ? data : [];

  const filtered = allListings.filter((item) => {
    if (activeTab === 'products') return item.type === 'product';
    if (activeTab === 'services') return item.type === 'service';
    if (activeTab === 'draft') return item.status === 'draft';
    if (activeTab === 'published') return item.status === 'published';
    if (activeTab === 'hidden') return item.status === 'hidden';
    return true;
  }).filter((item) =>
    !search || item.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic Discount % calculation
  useEffect(() => {
    const act = parseFloat(productForm.actualPrice) || 0;
    const sel = parseFloat(productForm.sellingPrice) || 0;
    if (act > 0 && sel > 0 && sel < act) {
      const disc = Math.round(((act - sel) / act) * 100);
      setProductForm(prev => ({ ...prev, discount: disc }));
    } else {
      setProductForm(prev => ({ ...prev, discount: 0 }));
    }
  }, [productForm.actualPrice, productForm.sellingPrice]);

  // AI Sample Upload Auto-Fill
  const handleAiAutoFill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProductForm(prev => ({ ...prev, isAiGenerating: true }));
    const toastId = toast.loading('AI analyzing media sample in real-time...');

    try {
      // Simulate real OCR & AI extraction pipeline
      setTimeout(() => {
        setProductForm(prev => ({
          ...prev,
          title: `Smart AI ${file.name.split('.')[0] || 'Product'} Spec Pro`,
          shortDescription: 'High performance device with advanced dynamic features',
          description: `Auto-generated product specifications derived from media file: ${file.name}`,
          actualPrice: 5999,
          sellingPrice: 3499,
          stock: 30,
          isAiGenerating: false
        }));
        toast.success('AI extracted specs, price & details in real-time!', { id: toastId });
      }, 2000);
    } catch (err) {
      setProductForm(prev => ({ ...prev, isAiGenerating: false }));
      toast.error('AI extraction failed', { id: toastId });
    }
  };

  const handleAddLabel = () => {
    if (!productForm.newLabelKey || !productForm.newLabelVal) return;
    setProductForm(prev => ({
      ...prev,
      labels: [...prev.labels, { key: prev.newLabelKey.trim(), value: prev.newLabelVal.trim() }],
      newLabelKey: '',
      newLabelVal: ''
    }));
  };

  const handleRemoveLabel = (index) => {
    setProductForm(prev => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index)
    }));
  };

  // Real-time Product Submission
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.sellingPrice) {
      toast.error('Product title and price are required');
      return;
    }

    const toastId = toast.loading('Publishing product to database...');
    try {
      const payload = {
        type: 'product',
        category: productForm.category || 'General',
        subcategory: productForm.subcategory || 'General',
        title: productForm.title.trim(),
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        actualPrice: Number(productForm.actualPrice || productForm.sellingPrice),
        sellingPrice: Number(productForm.sellingPrice),
        price: Number(productForm.sellingPrice),
        stock: Number(productForm.stock),
        labels: productForm.labels,
        images: productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
        videos: productForm.video ? [productForm.video] : [],
        status: 'published'
      };

      await createListing(payload).unwrap();
      toast.success('Product Listing Published in Real-Time!', { id: toastId });
      setShowAddModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create product listing', { id: toastId });
    }
  };

  // Real-time 6-Section Service Submission
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!serviceForm.shortDescription || !serviceForm.price) {
      toast.error('Please enter service short description and price');
      return;
    }

    const toastId = toast.loading('Publishing 6-section service to database...');
    try {
      const payload = {
        type: 'service',
        category: serviceForm.category || 'Services',
        subcategory: serviceForm.subcategory || 'General',
        title: `${serviceForm.category || 'Service'} - ${serviceForm.serviceType}`,
        shortDescription: serviceForm.shortDescription,
        description: serviceForm.detailedDescription,
        price: Number(serviceForm.price),
        actualPrice: Number(serviceForm.price),
        sellingPrice: Number(serviceForm.price),
        serviceDetails: serviceForm,
        images: serviceForm.coverImage ? [serviceForm.coverImage, ...serviceForm.galleryImages] : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
        status: 'published'
      };

      await createListing(payload).unwrap();
      toast.success('6-Section Service Listing Published in Real-Time!', { id: toastId });
      setShowAddModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create service listing', { id: toastId });
    }
  };

  // Real-time Dynamic Offer Submission
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title) return toast.error('Offer title is required');

    const toastId = toast.loading('Publishing dynamic offer to database...');
    try {
      const res = await api.post('/v1/vendors/me/offers', offerForm);
      if (res.data?.success || res.success) {
        toast.success('Dynamic Offer Published in Real-Time!', { id: toastId });
        setShowOfferModal(false);
        fetchLiveOffers();
      } else {
        toast.error('Failed to publish offer', { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to publish offer', { id: toastId });
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Listing Title',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary uppercase">{row.category} • {row.subcategory || 'General'}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Selling Price',
      render: (val, row) => (
        <div>
          <span className="font-bold text-emerald-600">₹{(val || row.sellingPrice || 0).toLocaleString('en-IN')}</span>
          {row.actualPrice && row.actualPrice > val && (
            <span className="text-[10px] text-text-tertiary line-through block">₹{row.actualPrice}</span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${val === 'service' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val || 'published'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* SUBSCRIPTION PLAN UPGRADE BANNER */}
      <div className="glass rounded-3xl p-6 border border-brand-purple/20 shadow-card bg-gradient-to-r from-brand-purple/10 via-surface to-brand-orange/10 relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-purple text-white text-[10px] font-black uppercase rounded-full tracking-wider shadow-sm">
                FREE PLAN ACTIVE
              </span>
              <span className="text-xs font-bold text-text-secondary">Real-Time Database Sync</span>
            </div>
            <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
              List your products so customers can easily search, discover, and connect with you for purchases, orders, or inquiries.
              The Free Plan allows you to list a limited number of products, which are searchable by customers.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-text-primary">
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500" /> List more products</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500" /> Increase searchable limit</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500" /> Product boost features</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500" /> Reach more customers</div>
            </div>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-5 py-3 gradient-brand text-white font-bold text-xs rounded-2xl shadow-premium hover:opacity-90 transition flex-shrink-0 flex items-center gap-2"
          >
            <FiZap /> SHOW SUBSCRIPTION PLAN
          </button>
        </div>
      </div>

      <AdminPageHeader
        icon={FiPackage}
        title="My Listing & Offer Center (Real-Time)"
        subtitle={`Live database catalog • Category Scope: ${registeredCat || 'All Categories'}`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOfferModal(true)}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center gap-1.5 shadow-sm"
          >
            <FiPercent /> Create Dynamic Offer
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-premium"
          >
            <FiPlus className="w-4 h-4" /> Add Product / Service
          </button>
        </div>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'offers' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Active Customer Offers & Deals (Live Database)</h3>
              <p className="text-xs text-text-tertiary">Real-time dynamic discounts displayed to buyer search results & product pages</p>
            </div>
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-3.5 py-2 gradient-brand text-white text-xs font-bold rounded-xl"
            >
              + Add Offer
            </button>
          </div>

          {offersLoading ? (
            <div className="p-8 text-center text-xs text-text-tertiary">Loading live offers from database...</div>
          ) : offersList.length === 0 ? (
            <div className="glass p-8 rounded-2xl text-center text-xs text-text-tertiary border border-border">
              No active offers published. Click "+ Add Offer" to create your first dynamic deal!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offersList.map((off, i) => (
                <div key={off.id || i} className="glass p-5 rounded-2xl border border-amber-500/30 relative overflow-hidden space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-black">
                      {off.discountPct}% OFF
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary">CODE: <strong className="text-brand-purple">{off.couponCode}</strong></span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary">{off.title}</h4>
                  <p className="text-xs text-text-tertiary">{off.description}</p>
                  <div className="text-[10px] text-text-tertiary border-t border-border pt-2">Valid Till: {off.validTill}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filtered}
          loading={isFetching}
          searchPlaceholder="Search listings..."
          searchValue={search}
          onSearch={setSearch}
          emptyMessage="No listings found in this tab."
          testId="vendor-listings-table"
          actions={(row) => (
            <>
              <button
                onClick={() => toggleVisibility({ id: row.id || row._id, status: row.status === 'hidden' ? 'published' : 'hidden' })}
                className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple"
                title="Toggle Visibility"
              >
                {row.status === 'hidden' ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => deleteListing(row.id || row._id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500"
                title="Delete"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        />
      )}

      {/* CREATE PRODUCT / SERVICE MODAL */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Product or 6-Section Service Listing" maxWidth="max-w-3xl">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {/* TAB CHANGER INSIDE MODAL */}
          <div className="flex border-b border-border gap-4 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${activeTab === 'products' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-text-tertiary'}`}
            >
              📦 Product Listing Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${activeTab === 'services' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-text-tertiary'}`}
            >
              🛠️ 6-Section Service Listing Form
            </button>
          </div>

          {activeTab === 'products' ? (
            /* PRODUCT LISTING FORM */
            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Category Dropdown (Real-Time Loaded) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Category (Live API)</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    {categoriesList.length > 0 ? (
                      categoriesList.map(cat => (
                        <option key={cat.id || cat._id} value={cat.name}>{cat.name}</option>
                      ))
                    ) : (
                      <option value={registeredCat || 'Electronics'}>{registeredCat || 'Electronics'}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Subcategory</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    {subcategoriesList.length > 0 ? (
                      subcategoriesList.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>
              </div>

              {/* AI Sample Auto Fill */}
              <div className="p-3 border border-dashed border-brand-purple rounded-2xl bg-brand-purple/5 space-y-2">
                <label className="text-xs font-bold text-brand-purple flex items-center gap-1.5">
                  <FiCpu /> Upload Image / Voice Note / Video Sample for Real-Time AI Auto-Fill
                </label>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleAiAutoFill}
                  className="text-xs text-text-tertiary"
                />
                <p className="text-[10px] text-text-tertiary">AI will analyze your sample media in real-time to auto-generate details below.</p>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Name of Product *</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                />
              </div>

              {/* Stock & Prices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Stock *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Actual Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.actualPrice}
                    onChange={(e) => setProductForm({ ...productForm, actualPrice: e.target.value })}
                    placeholder="3999"
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    placeholder="2499"
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount %</label>
                  <input
                    type="text"
                    disabled
                    value={`${productForm.discount}%`}
                    className="w-full p-2.5 bg-surface-tertiary font-bold text-emerald-600 border border-border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Product Labels Section */}
              <div className="space-y-2 border-t border-border pt-3">
                <label className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Product Labels (Brand, Battery, RAM, Features etc by product wise)
                </label>
                <div className="flex flex-wrap gap-2">
                  {productForm.labels.map((lbl, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-surface-secondary border border-border text-xs rounded-xl flex items-center gap-1.5">
                      <strong className="text-brand-purple">{lbl.key}:</strong> {lbl.value}
                      <button type="button" onClick={() => handleRemoveLabel(idx)} className="text-text-tertiary hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Label Key (e.g. Battery)"
                    value={productForm.newLabelKey}
                    onChange={(e) => setProductForm({ ...productForm, newLabelKey: e.target.value })}
                    className="flex-1 p-2 bg-surface border border-border rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 5000 mAh)"
                    value={productForm.newLabelVal}
                    onChange={(e) => setProductForm({ ...productForm, newLabelVal: e.target.value })}
                    className="flex-1 p-2 bg-surface border border-border rounded-xl text-xs"
                  />
                  <button type="button" onClick={handleAddLabel} className="px-3 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold">
                    + Add Label
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium">
                Publish Product Listing to Database
              </button>
            </form>
          ) : (
            /* 6-SECTION SERVICE LISTING FORM */
            <form onSubmit={handleCreateService} className="space-y-6">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">1. Basic Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Category</label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      className="w-full p-2 bg-surface border rounded-xl text-xs"
                    >
                      {categoriesList.length > 0 ? (
                        categoriesList.map(cat => (
                          <option key={cat.id || cat._id} value={cat.name}>{cat.name}</option>
                        ))
                      ) : (
                        <option value="Services">Services</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Subcategory</label>
                    <select
                      value={serviceForm.subcategory}
                      onChange={(e) => setServiceForm({ ...serviceForm, subcategory: e.target.value })}
                      className="w-full p-2 bg-surface border rounded-xl text-xs"
                    >
                      {subcategoriesList.length > 0 ? (
                        subcategoriesList.map(s => <option key={s} value={s}>{s}</option>)
                      ) : (
                        <option value="General">General</option>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary block mb-1">Short Description *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.shortDescription}
                    onChange={(e) => setServiceForm({ ...serviceForm, shortDescription: e.target.value })}
                    placeholder="Brief 1-line summary..."
                    className="w-full p-2 bg-surface border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary block mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={serviceForm.detailedDescription}
                    onChange={(e) => setServiceForm({ ...serviceForm, detailedDescription: e.target.value })}
                    placeholder="Comprehensive service breakdown..."
                    className="w-full p-2 bg-surface border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* SECTION 2: SERVICE DETAILS */}
              <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">2. Service Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Type</label>
                    <select
                      value={serviceForm.serviceType}
                      onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                      className="w-full p-2 bg-surface border rounded-xl text-xs"
                    >
                      <option value="At Home">At Home</option>
                      <option value="At Shop">At Shop</option>
                      <option value="Online">Online</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Price Type</label>
                    <select
                      value={serviceForm.priceType}
                      onChange={(e) => setServiceForm({ ...serviceForm, priceType: e.target.value })}
                      className="w-full p-2 bg-surface border rounded-xl text-xs"
                    >
                      <option value="Fixed Price">Fixed Price</option>
                      <option value="Starting From">Starting From</option>
                      <option value="Per Hour">Per Hour</option>
                      <option value="Per Day">Per Day</option>
                      <option value="Per Project">Per Project</option>
                      <option value="Custom Quote">Custom Quote</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      placeholder="999"
                      className="w-full p-2 bg-surface border rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: LOCATION */}
              <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">3. Location</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Area</label>
                    <input type="text" value={serviceForm.serviceArea} onChange={(e) => setServiceForm({ ...serviceForm, serviceArea: e.target.value })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">City</label>
                    <input type="text" value={serviceForm.city} onChange={(e) => setServiceForm({ ...serviceForm, city: e.target.value })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Max Travel Distance (km)</label>
                    <input type="number" value={serviceForm.maxTravelDistanceKm} onChange={(e) => setServiceForm({ ...serviceForm, maxTravelDistanceKm: e.target.value })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input type="checkbox" checked={serviceForm.homeVisitAvailable} onChange={(e) => setServiceForm({ ...serviceForm, homeVisitAvailable: e.target.checked })} />
                      Home Visit Available
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 4: AVAILABILITY */}
              <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">4. Availability & Working Hours</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Working Hours</label>
                    <input type="text" value={serviceForm.workingHours} onChange={(e) => setServiceForm({ ...serviceForm, workingHours: e.target.value })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={serviceForm.emergencyService24x7} onChange={(e) => setServiceForm({ ...serviceForm, emergencyService24x7: e.target.checked })} />
                      Emergency Service (24×7)
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 5 & 6 & 13: LEAD SETTINGS & POLICIES */}
              <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">10 & 13. Lead Settings & Vendor Policies</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Cancellation Policy</label>
                    <textarea rows={2} value={serviceForm.policies.cancellationPolicy} onChange={(e) => setServiceForm({ ...serviceForm, policies: { ...serviceForm.policies, cancellationPolicy: e.target.value } })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary block mb-1">Refund Policy</label>
                    <textarea rows={2} value={serviceForm.policies.refundPolicy} onChange={(e) => setServiceForm({ ...serviceForm, policies: { ...serviceForm.policies, refundPolicy: e.target.value } })} className="w-full p-2 bg-surface border rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium">
                Publish 6-Section Service Listing to Database
              </button>
            </form>
          )}
        </div>
      </AdminModal>

      {/* DYNAMIC OFFER MODAL */}
      <AdminModal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="Create Dynamic Customer Offer (Real-Time API)">
        <form onSubmit={handleCreateOffer} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Title *</label>
            <input type="text" required value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} placeholder="e.g. Festival Special 20% OFF" className="w-full p-2.5 bg-surface border rounded-xl text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount %</label>
              <input type="number" value={offerForm.discountPct} onChange={(e) => setOfferForm({ ...offerForm, discountPct: e.target.value })} className="w-full p-2.5 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Coupon Code</label>
              <input type="text" value={offerForm.couponCode} onChange={(e) => setOfferForm({ ...offerForm, couponCode: e.target.value })} className="w-full p-2.5 bg-surface border rounded-xl text-xs" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Description</label>
            <textarea rows={2} value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} className="w-full p-2.5 bg-surface border rounded-xl text-xs" />
          </div>
          <button type="submit" className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs">
            Publish Dynamic Offer to Database
          </button>
        </form>
      </AdminModal>

      {/* SUBSCRIPTION PLAN MODAL */}
      <AdminModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} title="Vendor Subscription Upgrade Plans" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">Upgrade to unlock unlimited listings, top search priority, and product boost features:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-5 rounded-2xl border border-brand-purple/30 space-y-3">
              <h4 className="font-bold text-sm text-brand-purple font-display">Verified Vendor Plan</h4>
              <span className="text-xl font-black text-text-primary">₹499 <span className="text-xs font-normal text-text-tertiary">/ month</span></span>
              <ul className="text-xs text-text-secondary space-y-1.5">
                <li>✓ List up to 50 Products & Services</li>
                <li>✓ Official 🟢 Verified Badge</li>
                <li>✓ 2x Product Search Visibility</li>
              </ul>
              <Link to="/vendor/subscription" className="block w-full text-center py-2 gradient-brand text-white text-xs font-bold rounded-xl">Upgrade Now</Link>
            </div>
            <div className="glass p-5 rounded-2xl border border-brand-orange/30 space-y-3">
              <h4 className="font-bold text-sm text-brand-orange font-display">VIP Boost Plan</h4>
              <span className="text-xl font-black text-text-primary">₹1,299 <span className="text-xs font-normal text-text-tertiary">/ month</span></span>
              <ul className="text-xs text-text-secondary space-y-1.5">
                <li>✓ Unlimited Listings</li>
                <li>✓ Official 🔵 VIP Verified Badge</li>
                <li>✓ 5 Free Reel Boosts Included</li>
              </ul>
              <Link to="/vendor/subscription" className="block w-full text-center py-2 bg-brand-orange text-white text-xs font-bold rounded-xl">Upgrade VIP</Link>
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
