import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, 
  FiChevronRight, 
  FiGrid, 
  FiStar, 
  FiZap,
  FiCpu,
  FiShoppingBag,
  FiCoffee,
  FiTool,
  FiSliders,
  FiTruck,
  FiShoppingCart,
  FiHeart,
  FiHome,
  FiBookOpen,
  FiBox
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useGetMeQuery } from '../../../features/auth/authApi';

/**
 * Default category tree used when API categories are empty or unavailable.
 * Each top-level has subcategories for granular interest selection.
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Electronics & IT',
    icon: '💻',
    subs: ['Laptops', 'Smartphones', 'Tablets', 'Cameras', 'Computer Accessories', 'Printers', 'Networking', 'Software']
  },
  {
    name: 'Fashion & Apparel',
    icon: '👗',
    subs: ['Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear', 'Footwear', 'Jewellery', 'Watches', 'Bags & Wallets', 'Ethnic Wear']
  },
  {
    name: 'Restaurant & Food',
    icon: '🍕',
    subs: ['Fast Food', 'Fine Dining', 'Bakery & Sweets', 'Beverages', 'Catering', 'Cloud Kitchen', 'Street Food', 'Organic Food']
  },
  {
    name: 'Services & Repairs',
    icon: '🔧',
    subs: ['AC Repair', 'Plumbing', 'Electrician', 'Carpentry', 'Painting', 'Pest Control', 'Appliance Repair', 'Cleaning']
  },
  {
    name: 'Furniture & Home Decor',
    icon: '🛋️',
    subs: ['Sofas', 'Beds', 'Tables', 'Wardrobes', 'Lighting', 'Curtains', 'Wall Art', 'Kitchenware']
  },
  {
    name: 'Automobile & Parts',
    icon: '🚗',
    subs: ['Cars', 'Bikes', 'Spare Parts', 'Tyres', 'Car Accessories', 'Service Center', 'EV', 'Commercial Vehicles']
  },
  {
    name: 'Grocery & Daily Essentials',
    icon: '🛒',
    subs: ['Fruits & Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Baby Care', 'Pet Supplies', 'Stationery']
  },
  {
    name: 'Healthcare & Beauty',
    icon: '💊',
    subs: ['Pharmacy', 'Skin Care', 'Hair Care', 'Fitness', 'Dental', 'Ayurveda', 'Salon & Spa', 'Eye Care']
  },
  {
    name: 'Real Estate & Construction',
    icon: '🏗️',
    subs: ['Residential', 'Commercial', 'Plots', 'Rentals', 'Building Materials', 'Interior Design', 'Architecture', 'Labour']
  },
  {
    name: 'Education & Coaching',
    icon: '📚',
    subs: ['School Tuition', 'Competitive Exams', 'Skill Development', 'Language Classes', 'Music & Art', 'IT Training', 'MBA Coaching', 'Online Courses']
  },
];

// Helper to map category name/emoji to premium Feather Icon components
const getCategoryIcon = (categoryName, defaultIcon) => {
  const name = (categoryName || '').toLowerCase();
  const iconStr = typeof defaultIcon === 'string' ? defaultIcon : '';

  if (name.includes('electronic') || name.includes('it') || iconStr === '💻' || iconStr === '📱') {
    return FiCpu;
  }
  if (name.includes('fashion') || name.includes('apparel') || name.includes('wear') || iconStr === '👗') {
    return FiShoppingBag;
  }
  if (name.includes('restaurant') || name.includes('food') || iconStr === '🍕' || iconStr === '🍲') {
    return FiCoffee;
  }
  if (name.includes('service') || name.includes('repair') || iconStr === '🔧' || iconStr === '🛠️') {
    return FiTool;
  }
  if (name.includes('furniture') || name.includes('decor') || iconStr === '🛋️' || iconStr === '🪑') {
    return FiSliders;
  }
  if (name.includes('automobile') || name.includes('car') || name.includes('vehicle') || name.includes('bike') || iconStr === '🚗' || iconStr === '🏍️') {
    return FiTruck;
  }
  if (name.includes('grocery') || name.includes('essential') || iconStr === '🛒') {
    return FiShoppingCart;
  }
  if (name.includes('healthcare') || name.includes('beauty') || name.includes('salon') || name.includes('fitness') || name.includes('health') || iconStr === '💊' || iconStr === '💇' || iconStr === '🏋️') {
    return FiHeart;
  }
  if (name.includes('real estate') || name.includes('construction') || name.includes('property') || iconStr === '🏗️' || iconStr === '🏠' || iconStr === '🏢') {
    return FiHome;
  }
  if (name.includes('education') || name.includes('coaching') || iconStr === '📚') {
    return FiBookOpen;
  }
  
  return FiBox; // Default fallback
};

export default function InterestSelectionPage() {
  const navigate = useNavigate();
  const { refetch } = useGetMeQuery();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selected, setSelected] = useState([]); // array of { category, subcategory }
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch categories from backend if available
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories?tree=true');
        const items = res.data?.items || [];
        if (items.length > 0) {
          const formatted = items
            .filter(c => !c.parent_id && c.is_active !== false)
            .map(c => ({
              name: c.name,
              icon: c.icon_url || '📦',
              dbId: c._id,
              subs: (c.children || []).map(sub => sub.name),
            }));
          if (formatted.length >= 5) {
            setCategories(formatted);
          }
        }
      } catch (err) {
        // Use defaults
      }
    };
    loadCategories();
  }, []);

  const isSelected = (category, subcategory) => {
    return selected.some(
      s => s.category === category && s.subcategory === (subcategory || null)
    );
  };

  const toggleSelection = (category, subcategory = null) => {
    const exists = isSelected(category, subcategory);
    if (exists) {
      setSelected(prev =>
        prev.filter(s => !(s.category === category && s.subcategory === (subcategory || null)))
      );
    } else {
      setSelected(prev => [...prev, { category, subcategory: subcategory || null }]);
    }
  };

  const toggleCategory = (categoryName) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
      // Auto-select category if not already selected
      if (!selected.some(s => s.category === categoryName && !s.subcategory)) {
        toggleSelection(categoryName);
      }
    }
  };

  const categorySelectedCount = (categoryName) => {
    return selected.filter(s => s.category === categoryName).length;
  };

  const handleContinue = async () => {
    if (selected.length < 5) {
      toast.error('Please select at least 5 interests to personalize your feed');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/v1/users/me/interests', { interests: selected });
      toast.success('Interests saved! Your feed is now personalized 🎯');
      refetch();
      navigate('/customer/home', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save interests';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 mx-auto rounded-2xl gradient-brand flex items-center justify-center shadow-premium mb-4"
        >
          <FiGrid className="text-white" size={28} />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-black text-text-primary font-display"
        >
          Choose Your <span className="gradient-text">Interests</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-text-tertiary mt-2 max-w-md mx-auto"
        >
          Select at least <strong className="text-brand-purple">5 categories</strong> that interest you.
          We'll personalize your reels & posts feed based on your choices.
        </motion.p>
      </div>

      {/* Selection Counter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 border border-white/40 shadow-card mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
            selected.length >= 5
              ? 'gradient-brand text-white shadow-premium'
              : 'bg-surface-tertiary text-text-tertiary'
          }`}>
            {selected.length}
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary">
              {selected.length >= 5 ? '✨ Great selection!' : `${5 - selected.length} more needed`}
            </p>
            <p className="text-[10px] text-text-tertiary">
              {selected.length >= 5
                ? 'You can continue or add more interests'
                : 'Select categories & subcategories below'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(Math.min(10, Math.max(5, selected.length)))].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < selected.length ? 'bg-brand-purple scale-110' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {categories.map((cat, idx) => {
          const isExpanded = expandedCategory === cat.name;
          const count = categorySelectedCount(cat.name);
          const isCatSelected = selected.some(s => s.category === cat.name);

          return (
            <motion.div
              key={cat.name}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * idx }}
              className={`glass rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
                isCatSelected
                  ? 'border-brand-purple/50 shadow-premium bg-brand-purple/5'
                  : 'border-white/30 hover:border-brand-purple/30 shadow-card'
              }`}
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(cat.name)}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = getCategoryIcon(cat.name, cat.icon);
                    return (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCatSelected 
                          ? 'gradient-brand text-white shadow-premium' 
                          : 'bg-white/5 text-text-secondary border border-white/10 group-hover:bg-brand-purple/10 group-hover:text-brand-purple group-hover:border-brand-purple/20'
                      }`}>
                        <IconComponent size={20} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xs font-bold text-text-primary group-hover:text-brand-purple transition-colors">
                      {cat.name}
                    </h3>
                    {count > 0 && (
                      <span className="text-[9px] font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-full">
                        {count} selected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCatSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center shadow-sm"
                    >
                      <FiCheck className="text-white" size={12} />
                    </motion.div>
                  )}
                  <FiChevronRight
                    className={`text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                    size={14}
                  />
                </div>
              </div>

              {/* Subcategories */}
              <AnimatePresence>
                {isExpanded && cat.subs && cat.subs.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 flex flex-wrap gap-2">
                      {cat.subs.map((sub) => {
                        const subSelected = isSelected(cat.name, sub);
                        return (
                          <button
                            key={sub}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(cat.name, sub);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 border ${
                              subSelected
                                ? 'bg-brand-purple text-white border-brand-purple shadow-sm scale-105'
                                : 'bg-surface-secondary text-text-secondary border-border hover:border-brand-purple/40 hover:text-brand-purple'
                            }`}
                          >
                            {subSelected && <FiCheck className="inline mr-1" size={10} />}
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="sticky bottom-6 z-20"
      >
        <button
          onClick={handleContinue}
          disabled={selected.length < 5 || saving}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-premium ${
            selected.length >= 5
              ? 'gradient-brand text-white hover:opacity-95 hover:shadow-lg'
              : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Your Interests...
            </>
          ) : (
            <>
              <FiZap size={16} />
              {selected.length >= 5
                ? `Continue with ${selected.length} Interests`
                : `Select ${5 - selected.length} More to Continue`}
              <FiChevronRight size={14} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
