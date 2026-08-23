import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FiCheck, FiChevronRight, FiChevronLeft, FiShoppingBag, FiCoffee, FiTool,
  FiTruck, FiShoppingCart, FiHeart, FiHome, FiBookOpen, FiFolder,
  FiSearch, FiX, FiFilter, FiCheckSquare, FiSquare, FiArrowLeft, FiArrowRight
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

export default function InterestSelector({ 
  selected = [], 
  setSelected,
  showSearch = true,
  theme = 'settings', // 'settings' | 'onboarding'
  itemsPerPage = 12
}) {
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'selected'
  const [allExpanded, setAllExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);

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

  // Filtered categories based on search query and filter mode
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return categories.filter((cat) => {
      const count = categorySelectedCount(cat.name);
      const isCatSelected = selected.some(s => s.category === cat.name);

      // Filter Mode: Selected Only
      if (filterMode === 'selected' && !isCatSelected && count === 0) {
        return false;
      }

      // Search Query Matching
      if (!query) return true;

      const catMatch = cat.name.toLowerCase().includes(query);
      const subMatch = (cat.subs || []).some(sub => sub.toLowerCase().includes(query));

      return catMatch || subMatch;
    });
  }, [categories, searchQuery, filterMode, selected]);

  // Reset to Page 1 whenever search query or filter mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode]);

  // Pagination calculations (12 categories per page)
  const totalItems = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, startIndex, endIndex]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const toggleAllExpanded = () => {
    setAllExpanded(prev => !prev);
    if (!allExpanded) {
      setExpandedCategory('__ALL__');
    } else {
      setExpandedCategory(null);
    }
  };

  const isCategoryExpanded = (catName) => {
    if (searchQuery.trim().length > 0) return true; // Auto-expand matching when searching
    if (expandedCategory === '__ALL__') return true;
    return expandedCategory === catName;
  };

  // Helper to generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* ── SEARCH & FILTER CONTROLS MENU ── */}
      {showSearch && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories & subcategories (e.g. Fashion, Electronics, Food, Fitness)..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-xl text-xs font-bold text-[#1a1a1a] placeholder-slate-400 outline-hidden transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Filter Mode Tabs & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('selected')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'selected'
                      ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Selected</span>
                  <span className="px-1.5 py-0.2 bg-[#d99a3d] text-[#1a1a1a] rounded-full text-[9px] font-black">
                    {selected.length}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={toggleAllExpanded}
                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                {allExpanded || searchQuery ? 'Collapse All' : 'Expand All'}
              </button>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-black transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Clear ({selected.length})
                </button>
              )}
            </div>
          </div>

          {/* Quick Info bar with pagination bounds */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-medium px-1 gap-1">
            <span>
              Showing <strong className="text-[#1a1a1a] font-black">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of {totalItems} categories
              {searchQuery && <span> matching "<strong className="text-[#241b15]">{searchQuery}</strong>"</span>}
            </span>
            <span className="text-[#241b15] font-black">
              {selected.length} / 5 Minimum Selected (Page {currentPage} of {totalPages})
            </span>
          </div>
        </div>
      )}

      {/* ── CATEGORY CARDS GRID (12 ITEMS PER PAGE) ── */}
      {paginatedCategories.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-black">
            <FiSearch size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700">
            No categories found matching "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="px-4 py-2 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black uppercase tracking-wider shadow-2xs cursor-pointer"
          >
            Reset Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCategories.map((cat) => {
            const isExpanded = isCategoryExpanded(cat.name);
            const count = categorySelectedCount(cat.name);
            const isCatSelected = selected.some(s => s.category === cat.name && !s.subcategory);
            const isAnySubSelected = count > 0;
            const categoryIcon = cat.icon;

            return (
              <div
                key={cat.name}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isCatSelected || isAnySubSelected
                    ? 'border-[#241b15] bg-[#f8f4ec] shadow-xs'
                    : 'border-slate-200 hover:border-[#d99a3d]/60 bg-white shadow-2xs'
                }`}
              >
                {/* Category Header Row */}
                <div
                  onClick={() => toggleCategory(cat.name)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(cat.name);
                      }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 font-black text-sm ${
                        isCatSelected 
                          ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs border border-[#241b15]' 
                          : isAnySubSelected
                          ? 'bg-[#241b15]/10 text-[#241b15] border border-[#241b15]/20'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-[#241b15] hover:text-[#d99a3d]'
                      }`}
                    >
                      {renderCategoryIcon(categoryIcon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wide">
                        {cat.name}
                      </h4>
                      {count > 0 && (
                        <span className="text-[9.5px] font-black text-[#d99a3d] bg-[#241b15] px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          {count} selected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interactive Checkbox for Entire Category */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(cat.name);
                      }}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer ${
                        isCatSelected
                          ? 'bg-[#241b15] border-[#241b15] text-[#d99a3d] shadow-2xs'
                          : isAnySubSelected
                          ? 'bg-[#d99a3d] border-[#d99a3d] text-[#1a1a1a]'
                          : 'border-slate-300 bg-white text-transparent hover:border-[#241b15]'
                      }`}
                      title={isCatSelected ? 'Deselect Category' : 'Select All / Whole Category'}
                    >
                      <FiCheck size={12} className={isCatSelected || isAnySubSelected ? 'scale-100' : 'scale-0'} />
                    </button>

                    <FiChevronRight
                      className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#241b15]' : ''}`}
                      size={14}
                    />
                  </div>
                </div>

                {/* Subcategories Container */}
                <AnimatePresence>
                  {isExpanded && cat.subs && cat.subs.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-white/70 border-t border-slate-100"
                    >
                      <div className="p-3.5 flex flex-wrap gap-1.5">
                        {cat.subs.map((sub) => {
                          const subSelected = isSelected(cat.name, sub);
                          const query = searchQuery.trim().toLowerCase();
                          const isSubQueryMatch = query && sub.toLowerCase().includes(query);

                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(cat.name, sub);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer border flex items-center gap-1 shadow-2xs ${
                                subSelected
                                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                                  : isSubQueryMatch
                                  ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border-[#d99a3d] ring-1 ring-[#d99a3d]'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {subSelected && <FiCheck size={10} className="text-[#d99a3d]" />}
                              <span>{sub}</span>
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
      )}

      {/* ── 4. PRODUCTION-GRADE PAGINATION MENU (PREV/NEXT ARROWS & PAGE NUMBERS) ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl shadow-2xs">
          <div className="text-xs text-slate-600 font-medium">
            Page <strong className="text-[#1a1a1a] font-black">{currentPage}</strong> of <strong className="text-[#1a1a1a] font-black">{totalPages}</strong> (12 categories per page)
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1a1a1a] text-xs font-black transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <FiChevronLeft size={16} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs font-bold select-none">
                      ...
                    </span>
                  );
                }
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Arrow Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1a1a1a] text-xs font-black transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
