import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FiCheck, FiChevronRight, FiShoppingBag, FiCoffee, FiTool,
  FiTruck, FiShoppingCart, FiHeart, FiHome, FiBookOpen, FiFolder 
} from 'react-icons/fi';
import { FaCouch, FaLaptop } from 'react-icons/fa';
import { api } from '../../lib/api';



const getCategoryIcon = (categoryName) => {
  const name = (categoryName || '').toLowerCase();

  const nameMap = {
    'electronic': FaLaptop,
    'it': FaLaptop,
    'computer': FaLaptop,
    'tech': FaLaptop,
    'fashion': FiShoppingBag,
    'apparel': FiShoppingBag,
    'wear': FiShoppingBag,
    'clothing': FiShoppingBag,
    'restaurant': FiCoffee,
    'food': FiCoffee,
    'beverage': FiCoffee,
    'service': FiTool,
    'repair': FiTool,
    'furniture': FaCouch,
    'decor': FaCouch,
    'automobile': FiTruck,
    'car': FiTruck,
    'vehicle': FiTruck,
    'bike': FiTruck,
    'grocery': FiShoppingCart,
    'essential': FiShoppingCart,
    'healthcare': FiHeart,
    'beauty': FiHeart,
    'salon': FiHeart,
    'fitness': FiHeart,
    'health': FiHeart,
    'real estate': FiHome,
    'construction': FiHome,
    'property': FiHome,
    'education': FiBookOpen,
    'coaching': FiBookOpen,
  };

  for (const key of Object.keys(nameMap)) {
    if (name.includes(key)) {
      return nameMap[key];
    }
  }

  return FiFolder;
};

const renderCategoryIcon = (IconComponent) => {
  if (!IconComponent) return <FiFolder size={18} />;

  if (typeof IconComponent === 'string') {
    return <span className="text-base leading-none select-none">{IconComponent}</span>;
  }

  return <IconComponent size={18} />;
};

export default function InterestSelector({ selected = [], setSelected }) {
  const [categories, setCategories] = useState([]);
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
              icon: getCategoryIcon(c.name),
              dbId: c._id,
              subs: (c.children || []).map(sub => sub.name),
            }));
          setCategories(formatted);
        }
      } catch (err) {
        console.error('Failed to load categories in InterestSelector:', err);
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
        const categoryIcon = cat.icon;

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
                  {renderCategoryIcon(categoryIcon)}
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
