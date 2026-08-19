import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiPlay, FiPlus, FiGrid, FiZap, FiShield, FiTrendingUp, FiShoppingBag, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SEO from '../../components/common/SEO';
import { useGetHomeTrendingFeedQuery } from '../../features/home/homeApi';
import { useListCategoriesQuery } from '../../features/admin/adminApi';

const getCategoryIcon = (name = '') => {
  const n = (name || '').toLowerCase();
  if (n.includes('electronic')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" /></svg>;
  if (n.includes('fashion') || n.includes('cloth') || n.includes('apparel')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M6 8h12l-1 13H7z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  if (n.includes('home') || n.includes('furni')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M4 13a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3H4z" /><path d="M5 16v3M19 16v3" /><path d="M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>;
  if (n.includes('vehicle') || n.includes('auto') || n.includes('car')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 16v-2.5a2 2 0 0 1 1.3-1.9l1.8-.6L7.6 7.8A2 2 0 0 1 9.4 7h5.2a2 2 0 0 1 1.8 1.1l1.7 3.3 2 .8a2 2 0 0 1 1.3 1.9V16" /><line x1="3" y1="16" x2="21" y2="16" /><circle cx="7.5" cy="16.5" r="1.7" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16.5" r="1.7" fill="currentColor" stroke="none" /></svg>;
  if (n.includes('real estate') || n.includes('property') || n.includes('build')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="11" y2="6" /><line x1="13" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="11" y2="10" /><line x1="13" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="11" y2="14" /><line x1="13" y1="14" x2="15" y2="14" /><rect x="10" y="17" width="4" height="5" /></svg>;
  if (n.includes('food') || n.includes('grocer') || n.includes('dine')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
  if (n.includes('beauty') || n.includes('salon') || n.includes('health') || n.includes('well')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 21s-7-4.6-9.5-9C1 8.5 2.5 5 6 5c2 0 3.4 1.2 4 2.2C10.6 6.2 12 5 14 5c3.5 0 5 3.5 3.5 7-2.5 4.4-9.5 9-9.5 9z" /></svg>;
  if (n.includes('gift') || n.includes('hamp')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
  if (n.includes('solar') || n.includes('energ')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
  if (n.includes('educat') || n.includes('train') || n.includes('book')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
  if (n.includes('digital') || n.includes('market') || n.includes('servic')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="3" y="8" width="18" height="11" rx="2" /><path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" /><line x1="3" y1="13" x2="21" y2="13" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
};

export default function Home() {
  const navigate = useNavigate();
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const { data: homeFeedData } = useGetHomeTrendingFeedQuery();
  const feed = homeFeedData?.data || {};

  const getHighResMedia = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('images.unsplash.com')) {
      return url.replace(/w=\d+/, 'w=800').replace(/h=\d+/, 'h=1050').replace(/q=\d+/, 'q=85');
    }
    return url;
  };

  const trendingList = feed.trendingProducts || [
    { num: '01', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=1050&fit=crop&q=85', title: 'Premium Office Chair', sub: 'ErgoComfort Pro', meta: '1.2K views · 86 leads' },
    { num: '02', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1050&fit=crop&q=85', title: 'Digital Marketing Service', sub: 'Grow Your Brand Online', meta: '980 views · 64 leads' },
    { num: '03', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=1050&fit=crop&q=85', title: 'Solar Rooftop System', sub: 'Save Electricity Bills', meta: '875 views · 59 leads' },
    { num: '04', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=1050&fit=crop&q=85', title: 'Modern Modular Kitchen', sub: 'Designs That Inspire', meta: '765 views · 51 leads' },
    { num: '05', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=1050&fit=crop&q=85', title: 'Corporate Gift Hampers', sub: 'For Every Occasion', meta: '680 views · 48 leads' },
    { num: '06', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1050&fit=crop&q=85', title: 'Luxury Bridal Makeup', sub: 'Glow Studio', meta: '610 views · 42 leads' },
    { num: '07', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=1050&fit=crop&q=85', title: 'Luxury Fleet Rental', sub: 'Prestige Cars', meta: '590 views · 39 leads' },
    { num: '08', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1050&fit=crop&q=85', title: 'Commercial Interior Design', sub: 'Apex Architects', meta: '540 views · 35 leads' },
  ];

  const featuredCards = feed.featuredCards || [
    { badge: 'Featured', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=1050&fit=crop&q=85', views: '2.1K', title: 'ErgoComfort Pro Premium Office Chair', category: 'Furniture' },
    { badge: null, img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=1050&fit=crop&q=85', views: '1.8K', title: 'Social Media Growth Service', category: 'Digital Marketing' },
    { badge: null, img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=1050&fit=crop&q=85', views: '3.4K', title: 'Solar Rooftop System 3kW On-Grid', category: 'Energy' },
    { badge: 'Hot Deal', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=1050&fit=crop&q=85', views: '1.5K', title: 'Custom Italian Modular Kitchen', category: 'Home & Living' },
    { badge: 'Popular', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=1050&fit=crop&q=85', views: '2.9K', title: 'Premium Festive Gift Hampers', category: 'Corporate Gifts' },
  ];

  const statsList = feed.stats || [
    { number: '12K+', label: 'Businesses', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" /></svg> },
    { number: '2.4M+', label: 'Leads Generated', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /><path d="M16 8.2a3 3 0 1 1 0 5.8" /><path d="M21.5 20c0-3-1.9-5.5-4.5-6.2" /></svg> },
    { number: '8.7M+', label: 'Products & Services', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 8V6a6 6 0 0 1 12 0v2" /><rect x="3" y="8" width="18" height="13" rx="2" /></svg> },
    { number: '₹350Cr+', label: 'Business Volume', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /></svg> },
  ];

  // Dynamic 7.5s image rotator - products cycle ONE BY ONE
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);

  const allMediaPool = React.useMemo(() => {
    const pool = [];
    (feed.featuredCards || featuredCards).forEach((c) => {
      if (c.img) pool.push({ ...c, img: getHighResMedia(c.img) });
    });
    (feed.trendingProducts || trendingList).forEach((t) => {
      if (t.img) {
        pool.push({
          id: t.id,
          badge: 'Trending',
          img: getHighResMedia(t.img),
          views: t.meta ? t.meta.split(' ')[0] : '1.2K',
          title: t.title,
          category: t.category || t.sub || 'Products'
        });
      }
    });
    return pool.length > 0 ? pool : featuredCards;
  }, [feed]);

  React.useEffect(() => {
    if (!allMediaPool || allMediaPool.length === 0) return;
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % allMediaPool.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [allMediaPool.length]);

  const activeProduct = React.useMemo(() => {
    if (!allMediaPool || allMediaPool.length === 0) return featuredCards[0];
    const idx = activeCardIndex % allMediaPool.length;
    return {
      ...allMediaPool[idx],
      currentIndex: idx,
      totalCount: allMediaPool.length
    };
  }, [allMediaPool, activeCardIndex]);

  // Panel 3 Dynamic Image Rotator (Every 10 seconds)
  const [panelImageIndex, setPanelImageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPanelImageIndex((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentPanelItem = React.useMemo(() => {
    if (!allMediaPool || allMediaPool.length === 0) return null;
    const idx = (panelImageIndex + 1) % allMediaPool.length;
    return allMediaPool[idx];
  }, [allMediaPool, panelImageIndex]);

  const defaultCategoryList = React.useMemo(() => [
    { name: 'Electronics' },
    { name: 'Fashion' },
    { name: 'Home & Living' },
    { name: 'Vehicles' },
    { name: 'Real Estate' },
    { name: 'Food & Grocery' },
    { name: 'Beauty & Salon' },
    { name: 'Corporate Gifts' },
    { name: 'Solar & Energy' },
    { name: 'Digital Marketing' },
    { name: 'Education & Training' },
    { name: 'Health & Wellness' },
    { name: 'Automotive Services' },
    { name: 'Events & Weddings' },
    { name: 'Industrial Equipment' },
    { name: 'Travel & Tourism' }
  ], []);

  const { data: dbCatRes } = useListCategoriesQuery(undefined, { pollingInterval: 60000 });
  const dbCategories = dbCatRes?.items || dbCatRes?.data || dbCatRes || [];

  const categoriesToDisplay = React.useMemo(() => {
    const feedCats = feed.categories || [];
    const dbCats = Array.isArray(dbCategories) ? dbCategories : [];
    const combinedApiCats = [...feedCats, ...dbCats];

    const existingNames = new Set();
    const uniqueApiCats = [];
    combinedApiCats.forEach(c => {
      const name = c.name || c.categoryName || '';
      if (name && !existingNames.has(name.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        uniqueApiCats.push({ ...c, name });
      }
    });

    const fillList = defaultCategoryList.filter(d => !existingNames.has(d.name.toLowerCase()));
    return [...uniqueApiCats, ...fillList];
  }, [feed.categories, dbCategories, defaultCategoryList]);

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f2ede4] min-h-screen select-none font-sans">
      <SEO
        title="Watch. Discover. Shop. — India's Visual Commerce Platform"
        description="Discover local vendors, chat direct, deal fair. India's first visual reels commerce platform."
        url="https://bizreels.in/"
      />

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="py-3 sm:py-5 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#f2ede4] rounded-2xl border border-[#e3dccb] overflow-hidden shadow-xs relative">
            
            {/* LEFT HERO PANEL */}
            <div className="lg:col-span-7 p-5 sm:p-8 md:p-10 flex flex-col justify-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="font-black text-[32px] sm:text-5xl lg:text-6xl uppercase leading-[1.02] tracking-tight text-[#1a1a1a]"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                PRODUCTS.<br />
                SERVICES.<br />
                <span className="text-[#d99a3d] block mt-0.5">REAL RESULTS.</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mt-4 text-xs sm:text-base text-[#4a4a4a] leading-relaxed font-semibold max-w-md"
              >
                Reels that showcase what you offer. Generate leads. Grow your business. Close more sales.
              </motion.p>

              {/* ACTION BUTTONS ROW */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 w-full sm:w-auto"
              >
                <button
                  onClick={() => navigate('/local-reels')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <span>Start Exploring</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/auth/register?role=vendor')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm border-2 border-[#d8d2c5] hover:border-[#b8b0a0] text-[#1a1a1a] bg-white/40 hover:bg-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <span>I'm a Business</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </motion.div>

              {/* SOCIAL PROOF BADGE */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-7 sm:mt-9 flex items-center gap-3"
              >
                <div className="flex -space-x-2">
                  {[12, 33, 15].map((id) => (
                    <img
                      key={id}
                      src={`https://i.pravatar.cc/64?img=${id}`}
                      alt="BizReels user"
                      className="w-8 h-8 rounded-full border-2 border-[#f2ede4] object-cover bg-slate-300"
                    />
                  ))}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#1a1a1a] leading-tight">
                  Join <span className="text-[#d99a3d] font-black">12K+ businesses</span> growing with BizReels
                </div>
              </motion.div>

              {/* BACKDROP LOGO WATERMARK */}
              <img
                src="/hero-logo.png"
                alt=""
                aria-hidden="true"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 opacity-25 pointer-events-none z-0 hidden sm:block"
              />
            </div>

            {/* RIGHT HERO PANEL */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="lg:col-span-5 bg-[#241b15] p-5 sm:p-8 lg:p-10 flex flex-col justify-center text-white"
            >
              <p className="text-[11px] font-black tracking-widest text-[#d99a3d] uppercase mb-5">
                Made for Business Growth
              </p>

              <div className="space-y-4 sm:space-y-5 mb-6">
                {[
                  {
                    title: 'Showcase Products',
                    desc: 'Highlight your products and services in short reels.',
                    icon: <FiPlay className="w-4 h-4 text-[#d99a3d]" />
                  },
                  {
                    title: 'Generate Leads',
                    desc: 'Capture quality leads interested in what you offer.',
                    icon: <FiZap className="w-4 h-4 text-[#d99a3d]" />
                  },
                  {
                    title: 'Close More Sales',
                    desc: 'Convert views into real customers and revenue.',
                    icon: <FiTrendingUp className="w-4 h-4 text-[#d99a3d]" />
                  },
                ].map(({ title, desc, icon }) => (
                  <div key={title} className="flex items-start gap-3.5 pb-4 border-b border-[#3a3630] last:border-b-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg border-2 border-[#d99a3d]/50 bg-[#d99a3d]/10 flex items-center justify-center shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">{title}</h3>
                      <p className="text-xs text-[#c9c4bb] leading-relaxed font-medium">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/auth/register?role=vendor')}
                className="w-full py-3.5 px-5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-between transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                <span>List Your Product / Service</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section className="pb-4 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] bg-white/95 backdrop-blur-xs rounded-2xl border border-[#e3dccb] shadow-xs overflow-hidden">
            
            {/* STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#e3dccb]">
              {statsList.map((stat, idx) => (
                <div key={stat.label || idx} className="flex items-center gap-3 p-3.5 sm:p-5">
                  <div className="w-9 h-9 rounded-xl border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] shrink-0 bg-[#f8f4ec]">
                    {stat.svg}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-lg font-black text-[#1a1a1a] leading-tight tracking-tight">
                      {stat.number}
                    </div>
                    <div className="text-[11px] font-semibold text-[#5a5a5a] truncate mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA SIDE BAR */}
            <button
              onClick={() => navigate('/auth/register')}
              className="bg-[#d99a3d] hover:bg-[#c8872b] p-4 sm:p-5 flex items-center justify-between gap-4 border-none cursor-pointer text-left transition-colors w-full lg:w-auto"
            >
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1a1a1a] leading-tight">
                  For Businesses of Every Size
                </h3>
                <p className="text-[11px] font-bold text-[#3a2f1f] mt-0.5">
                  Start for free. Pay only when you grow.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a] shrink-0">
                <FiArrowRight className="w-4 h-4" />
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORIES (MOBILE CAROUSEL BAR) ─────────────── */}
      <section className="pb-4 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-[#e3dccb] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Header Title */}
            <div className="flex items-center gap-3 shrink-0 lg:border-r border-[#e3dccb] lg:pr-5 w-full lg:w-auto">
              <div className="w-1.5 h-8 bg-[#d99a3d] rounded-full shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase tracking-wide">
                  Browse by Categories
                </h2>
                <p className="text-[11px] text-[#6a655b] font-medium mt-0.5">
                  Find products &amp; services that fit your needs
                </p>
              </div>
            </div>

            {/* Category Pills (Touch Swipeable on Mobile) */}
            <div className="flex items-center gap-2.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none snap-x">
              {categoriesToDisplay.slice(0, 5).map((cat, idx) => {
                const catName = cat.name || 'Category';
                return (
                  <button
                    key={cat._id || catName || idx}
                    type="button"
                    onClick={() => navigate(`/listings/search?category=${encodeURIComponent(catName)}`)}
                    className="snap-start flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#f8f4ec] hover:bg-[#241b15] text-[#241b15] hover:text-[#d99a3d] border border-[#e3dccb] hover:border-[#241b15] transition-all cursor-pointer shadow-2xs whitespace-nowrap group shrink-0 active:scale-[0.98]"
                  >
                    <span className="text-[#d99a3d] group-hover:text-[#d99a3d] shrink-0">
                      {getCategoryIcon(catName)}
                    </span>
                    <span className="text-xs font-black tracking-tight">
                      {catName}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="snap-start flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 border border-transparent active:scale-[0.98]"
              >
                <span>Explore All ({categoriesToDisplay.length})</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS & REEL SHOWCASE (MOBILE TOUCH CAROUSEL) ── */}
      <section className="pb-4 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* LEFT: TRENDING LIST */}
            <div className="lg:col-span-4 bg-[#241b15] p-5 sm:p-6 text-white rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="font-black text-base sm:text-lg uppercase text-white leading-tight">
                    <span className="text-[#d99a3d] block">Trending</span>
                    <span>Products &amp; Services</span>
                  </div>
                  <button
                    onClick={() => navigate('/local-reels')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d99a3d] hover:underline cursor-pointer"
                  >
                    <span>View All</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {trendingList.map(({ num, img, title, sub, meta, id }, i) => {
                    const isCurrent = (activeProduct?.currentIndex || 0) === i;
                    return (
                      <div
                        key={id || num || i}
                        onClick={() => setActiveCardIndex(i)}
                        className={`cursor-pointer group flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all border-b last:border-b-0 ${
                          isCurrent
                            ? 'bg-[#d99a3d]/15 border-[#d99a3d]/40 shadow-xs'
                            : 'border-[#3a3630] hover:bg-[#2e261f]'
                        }`}
                      >
                        <div className={`text-xs font-black w-5 shrink-0 ${isCurrent ? 'text-[#d99a3d]' : 'text-[#8a8578]'}`}>
                          {num}
                        </div>
                        <img src={img} alt={title} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800 border border-white/10" />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-xs font-bold leading-tight transition-colors ${isCurrent ? 'text-[#d99a3d]' : 'text-white group-hover:text-[#d99a3d]'}`}>
                            {title}
                          </div>
                          <div className="truncate text-[11px] text-[#8a8578] mt-0.5 font-medium">
                            {sub}
                          </div>
                          <div className="truncate text-[10px] text-[#8a8578] font-bold mt-0.5">
                            {meta}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MIDDLE: SPOTLIGHT PRODUCT CARD (ONE BY ONE SEQUENTIAL SHOWCASE) */}
            <div className="lg:col-span-5 bg-[#241b15] p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#3a3630]">
              {/* Header & Navigation */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#3a3630]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d] animate-ping shrink-0" />
                    <span className="text-xs font-black text-[#d99a3d] uppercase tracking-wider">
                      {activeProduct?.badge || 'Top Pick Product'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#a89b8d]">
                      {String((activeProduct?.currentIndex || 0) + 1).padStart(2, '0')} / {String(activeProduct?.totalCount || allMediaPool.length || 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : (allMediaPool.length || 1) - 1))}
                        className="w-7 h-7 rounded-lg bg-[#1a1813] hover:bg-[#3a3630] text-[#d99a3d] flex items-center justify-center transition-colors cursor-pointer border border-[#3a3630]"
                        title="Previous Product"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveCardIndex((prev) => (prev + 1) % (allMediaPool.length || 1))}
                        className="w-7 h-7 rounded-lg bg-[#1a1813] hover:bg-[#3a3630] text-[#d99a3d] flex items-center justify-center transition-colors cursor-pointer border border-[#3a3630]"
                        title="Next Product"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-by-1 Product Card Frame */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-xl overflow-hidden bg-[#1a1813] border border-[#3a3630]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeProduct?.img || activeCardIndex}
                      initial={{ opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                      src={activeProduct?.img}
                      alt={activeProduct?.title}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 border border-white/10">
                    <FiPlay className="w-3.5 h-3.5 text-[#d99a3d] fill-[#d99a3d]" />
                    <span>{activeProduct?.views || '1.8K views'}</span>
                  </div>

                  {activeProduct?.category && (
                    <div className="absolute top-3 right-3 bg-[#d99a3d] text-[#1a1a1a] text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md z-10 tracking-wide">
                      {activeProduct.category}
                    </div>
                  )}
                </div>

                {/* Product Title & Details */}
                <div className="mt-3.5">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight line-clamp-1">
                    {activeProduct?.title}
                  </h3>
                  <p className="text-xs text-[#8a8578] font-medium truncate mt-0.5">
                    {activeProduct?.sub || activeProduct?.category || 'Verified Business Partner'}
                  </p>
                </div>
              </div>

              {/* Action Button & Dot Indicators */}
              <div className="mt-3 pt-3 border-t border-[#3a3630] flex flex-col gap-2.5">
                <button
                  onClick={() => navigate(activeProduct?.id ? `/listings/search?q=${encodeURIComponent(activeProduct.title)}` : '/auth/register')}
                  className="w-full py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-black text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Get Quote / Order Now</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {allMediaPool.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveCardIndex(dotIdx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        dotIdx === (activeProduct?.currentIndex || 0)
                          ? 'w-6 bg-[#d99a3d]'
                          : 'w-1.5 bg-[#3a3630] hover:bg-[#8a8578]'
                      }`}
                      title={`Go to product ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: CREATOR CTA */}
            <div className="lg:col-span-3 bg-[#d99a3d] p-6 text-[#1a1a1a] flex flex-col justify-between rounded-2xl min-h-[240px]">
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                  Create.<br />Share.<br />Generate Leads.
                </h2>
                <div className="w-7 h-1 bg-[#1a1a1a] my-3" />
                <p className="text-xs sm:text-sm font-semibold text-[#3a2f1f] leading-relaxed">
                  Upload reels of your products or services and connect with potential buyers.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => navigate('/auth/register?tab=upload')}
                  className="w-12 h-12 rounded-xl bg-[#1a1a1a] text-[#d99a3d] flex items-center justify-center shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform"
                >
                  <FiPlus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigate('/auth/register?tab=upload')}
                  className="flex items-center gap-1.5 text-xs font-black text-[#1a1a1a] cursor-pointer hover:underline"
                >
                  <span>Upload Reel</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHY BUSINESSES CHOOSE BIZREELS ───────────────────────── */}
      <section className="pb-4 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* PANEL 1: WHY CHOOSE */}
            <div className="rounded-2xl bg-[#241b15] p-6 flex flex-col justify-between text-white">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#d99a3d] uppercase tracking-wide mb-4">
                  Why Businesses<br />Choose BizReels
                </h2>
                <ul className="space-y-3 mb-6">
                  {[
                    'Targeted audience actively looking to buy',
                    'Short reels that explain and sell better',
                    'Quality leads delivered to your dashboard',
                    'Affordable pricing with real impact',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-xs text-[#c9c4bb] font-medium leading-normal">
                      <FiCheckCircle className="w-4 h-4 text-[#d99a3d] shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs transition-all shadow-xs self-start cursor-pointer active:scale-[0.98]"
              >
                <span>Learn More</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PANEL 2: TESTIMONIAL */}
            <div className="rounded-2xl bg-[#d99a3d] p-6 flex flex-col justify-between text-[#1a1a1a]">
              <div>
                <div className="text-4xl font-black font-serif text-[#1a1a1a] opacity-70 mb-2">&ldquo;</div>
                <p className="text-xs sm:text-sm font-extrabold text-[#1a1a1a] leading-relaxed">
                  BizReels helped us generate 500+ quality leads in just 30 days. Sales increased by 40%.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1a1a1a]/20 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop"
                  alt="Rohit Mehra"
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#1a1a1a]"
                />
                <div>
                  <div className="text-xs font-black text-[#1a1a1a]">Rohit Mehra</div>
                  <div className="text-[11px] font-bold text-[#3a2f1f]">Founder, SolarBright</div>
                </div>
              </div>
            </div>

            {/* PANEL 3: LIVE REEL ROTATOR */}
            <div className="rounded-2xl overflow-hidden relative min-h-[220px] bg-[#241b15] border border-[#3a3630]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentPanelItem?.img || panelImageIndex}
                  initial={{ opacity: 0, scale: 1.05, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  src={currentPanelItem?.img || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=1050&fit=crop&q=85"}
                  alt={currentPanelItem?.title || "BizReels live feed"}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </AnimatePresence>

              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-[#d99a3d] text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-2 border border-[#d99a3d]/40 z-10">
                <span className="w-2 h-2 rounded-full bg-[#d99a3d] animate-ping" />
                <span>LIVE REEL FEED</span>
              </div>

              {currentPanelItem?.title && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white z-10">
                  <p className="text-xs font-black uppercase truncate">{currentPanelItem.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#d99a3d] font-bold">{currentPanelItem.category || 'Featured'}</span>
                    <span className="text-[10px] text-slate-300 font-semibold">{currentPanelItem.views || '2.1K'} views</span>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL 4: NUMERICAL STATS */}
            <div className="rounded-2xl bg-white border border-[#e3dccb] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[#1a1a1a] uppercase tracking-wide mb-3">
                  Success by the Numbers
                </h2>
                <div className="w-6 h-0.5 bg-[#1a1a1a] mb-4" />

                <div className="space-y-3">
                  {[
                    { num: '12K+', label: 'Active Businesses' },
                    { num: '2.4M+', label: 'Leads Generated' },
                    { num: '8.7M+', label: 'Reel Views' },
                    { num: '₹350Cr+', label: 'Business Volume' },
                  ].map(({ num, label }, i, arr) => (
                    <div key={label} className="flex items-center justify-between pb-2 border-b border-[#e3dccb] last:border-b-0 last:pb-0">
                      <span className="text-xs font-medium text-[#5a5a5a]">{label}</span>
                      <span className="text-sm font-black text-[#1a1a1a]">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ────────────────────────────────────── */}
      <section className="pb-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#c8872b] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <FiZap className="w-6 h-6 text-[#d99a3d]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#1a1a1a]">
                  Ready to grow your business?
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#3a2f1f] mt-0.5">
                  List your product or service and start getting leads today.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/auth/register')}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#1a1a1a] hover:bg-black text-[#d99a3d] font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── EXPLORE ALL CATEGORIES MODAL ──────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-[#241b15] text-white p-5 flex items-center justify-between border-b border-[#3a2c22]">
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#d99a3d] uppercase tracking-wide">Explore All Categories</h3>
                <p className="text-xs text-[#a89b8d] mt-0.5">Browse marketplace by industry &amp; specialized services</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-[#3a2c22] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body Grid */}
            <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
              {categoriesToDisplay.map((cat, idx) => {
                const catName = cat.name || 'Category';
                return (
                  <button
                    key={cat._id || catName || idx}
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false);
                      navigate(`/listings/search?category=${encodeURIComponent(catName)}`);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-[#241b15] text-[#1a1a1a] hover:text-[#d99a3d] border border-[#e3dccb] hover:border-[#241b15] transition-all cursor-pointer group shadow-2xs text-center h-24 active:scale-[0.97]"
                  >
                    <div className="text-[#d99a3d] mb-1.5 p-2 rounded-lg bg-[#f8f4ec] group-hover:bg-[#3a2c22] transition-colors">
                      {getCategoryIcon(catName)}
                    </div>
                    <span className="text-xs font-black line-clamp-2 leading-tight">
                      {catName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#ede6d8] border-t border-[#e3dccb] flex items-center justify-between">
              <span className="text-xs font-bold text-[#5a5043]">
                {categoriesToDisplay.length} Categories Available
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  navigate('/listings/search');
                }}
                className="px-4 py-2 rounded-xl bg-[#241b15] text-[#d99a3d] text-xs font-extrabold hover:bg-[#1a1a1a] transition-all cursor-pointer"
              >
                View Marketplace Feed →
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
