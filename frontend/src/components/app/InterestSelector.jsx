import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FiCheck, FiChevronRight, FiShoppingBag, FiCoffee, FiTool,
  FiTruck, FiShoppingCart, FiHeart, FiHome, FiBookOpen, FiFolder 
} from 'react-icons/fi';
import { FaCouch, FaLaptop } from 'react-icons/fa';
import { api } from '../../lib/api';

const DEFAULT_CATEGORIES = [
  {
    name: 'Electronics & IT',
    icon: FaLaptop,
    subs: ['Laptops', 'Smartphones', 'Tablets', 'Cameras', 'Computer Accessories', 'Printers', 'Networking', 'Software']
  },
  {
    name: 'Fashion & Apparel',
    icon: FiShoppingBag,
    subs: ['Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear', 'Footwear', 'Jewellery', 'Watches', 'Bags & Wallets', 'Ethnic Wear']
  },
  {
    name: 'Restaurant & Food',
    icon: FiCoffee,
    subs: ['Fast Food', 'Fine Dining', 'Bakery & Sweets', 'Beverages', 'Catering', 'Cloud Kitchen', 'Street Food', 'Organic Food']
  },
  {
    name: 'Services & Repairs',
    icon: FiTool,
    subs: ['AC Repair', 'Plumbing', 'Electrician', 'Carpentry', 'Painting', 'Pest Control', 'Appliance Repair', 'Cleaning']
  },
  {
    name: 'Furniture & Home Decor',
    icon: FaCouch,
    subs: ['Sofas', 'Beds', 'Tables', 'Wardrobes', 'Lighting', 'Curtains', 'Wall Art', 'Kitchenware']
  },
  {
    name: 'Automobile & Parts',
    icon: FiTruck,
    subs: ['Cars', 'Bikes', 'Spare Parts', 'Tyres', 'Car Accessories', 'Service Center', 'EV', 'Commercial Vehicles']
  },
  {
    name: 'Grocery & Daily Essentials',
    icon: FiShoppingCart,
    subs: ['Fruits & Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Baby Care', 'Pet Supplies', 'Stationery']
  },
  {
    name: 'Healthcare & Beauty',
    icon: FiHeart,
    subs: ['Pharmacy', 'Skin Care', 'Hair Care', 'Fitness', 'Dental', 'Ayurveda', 'Salon & Spa', 'Eye Care']
  },
  {
    name: 'Real Estate & Construction',
    icon: FiHome,
    subs: ['Residential', 'Commercial', 'Plots', 'Rentals', 'Building Materials', 'Interior Design', 'Architecture', 'Labour']
  },
  {
    name: 'Education & Coaching',
    icon: FiBookOpen,
    subs: ['School Tuition', 'Competitive Exams', 'Skill Development', 'Language Classes', 'Music & Art', 'IT Training', 'MBA Coaching', 'Online Courses']
  },
];

const getCategoryIcon = (categoryName, defaultIcon) => {
  const name = (categoryName || '').toLowerCase();
  const iconStr = typeof defaultIcon === 'string' ? defaultIcon : '';

  if (name.includes('electronic') || name.includes('it') || iconStr === '💻' || iconStr === '📱') {
    return FaLaptop;
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
    return FaCouch;
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
  
  return FiFolder;
};

export default function InterestSelector({ selected = [], setSelected }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [expandedCategory, setExpandedCategory] = useState(null);

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
              icon: getCategoryIcon(c.name, c.icon_url),
              dbId: c._id,
              subs: (c.children || []).map(sub => sub.name),
            }));
          if (formatted.length >= 5) {
            setCategories(formatted);
          }
        }
      } catch (err) {
        // Fall back to DEFAULT_CATEGORIES
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
    if (subcategory === null) {
      const isCatSelected = selected.some(s => s.category === category && !s.subcategory);
      if (isCatSelected) {
        // Deselect the category and all of its subcategories
        setSelected(prev => prev.filter(s => s.category !== category));
      } else {
        // Select the parent category itself (catch-all)
        setSelected(prev => [...prev, { category, subcategory: null }]);
      }
    } else {
      const exists = isSelected(category, subcategory);
      if (exists) {
        setSelected(prev =>
          prev.filter(s => !(s.category === category && s.subcategory === subcategory))
        );
      } else {
        setSelected(prev => [...prev, { category, subcategory }]);
      }
    }
  };

  const toggleCategory = (categoryName) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
    }
  };

  const categorySelectedCount = (categoryName) => {
    return selected.filter(s => s.category === categoryName).length;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat, idx) => {
        const isExpanded = expandedCategory === cat.name;
        const count = categorySelectedCount(cat.name);
        const isCatSelected = selected.some(s => s.category === cat.name);
        const IconComponent = cat.icon || FiFolder;

        return (
          <div
            key={cat.name}
            className={`rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
              isCatSelected
                ? 'border-brand-purple/50 bg-brand-purple/5 shadow-premium'
                : 'border-white/10 hover:border-brand-purple/30 bg-white/5 shadow-card'
            }`}
          >
            {/* Category Header */}
            <div
              onClick={() => toggleCategory(cat.name)}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(cat.name);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCatSelected 
                      ? 'gradient-brand text-white shadow-premium' 
                      : 'bg-white/5 text-text-secondary border border-white/10 group-hover:bg-brand-purple/10 group-hover:text-brand-purple group-hover:border-brand-purple/20'
                  }`}
                >
                  <IconComponent size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-purple transition-colors">
                    {cat.name}
                  </h4>
                  {count > 0 && (
                    <span className="text-[8px] font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-full">
                      {count} selected
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Interactive Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(cat.name);
                  }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                    isCatSelected
                      ? 'bg-brand-purple border-brand-purple text-white shadow-sm'
                      : 'border-white/20 bg-transparent text-transparent hover:border-brand-purple/40'
                  }`}
                >
                  <FiCheck size={10} className={isCatSelected ? 'scale-100' : 'scale-0'} />
                </div>
                <FiChevronRight
                  className={`text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                  size={12}
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
                  <div className="px-4 pb-4 pt-0 flex flex-wrap gap-1.5">
                    {cat.subs.map((sub) => {
                      const subSelected = isSelected(cat.name, sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(cat.name, sub);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-200 border ${
                            subSelected
                              ? 'bg-brand-purple text-white border-brand-purple shadow-sm scale-105'
                              : 'bg-surface-secondary text-text-secondary border-border hover:border-brand-purple/40 hover:text-brand-purple'
                          }`}
                        >
                          {subSelected && <FiCheck className="inline mr-1" size={8} />}
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
