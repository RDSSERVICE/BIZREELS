import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiChevronDown, FiX, FiCheck } from 'react-icons/fi';

export function SearchableCategorySelect({
  category,
  setCategory,
  categories,
  customCategory,
  setCustomCategory,
  setSubcategory
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat =>
    (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayValue = category === 'Other' 
    ? (customCategory ? `Other: ${customCategory}` : 'Other (Specify)') 
    : (category || 'Select Category');

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary flex items-center justify-between cursor-pointer focus:outline-none focus:border-brand-purple hover:border-brand-purple/40 transition"
      >
        <span className="truncate">{displayValue}</span>
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <FiSearch size={14} />
          <FiChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-premium overflow-hidden animate-fade-in max-h-72 flex flex-col">
          <div className="p-2 border-b border-border flex items-center gap-2 bg-surface">
            <FiSearch className="text-text-tertiary shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="text-text-tertiary hover:text-text-primary"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 py-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div
                  key={cat.id || cat._id}
                  onClick={() => {
                    setCategory(cat.name);
                    if (setSubcategory) setSubcategory('');
                    if (setCustomCategory) setCustomCategory('');
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-brand-purple/10 hover:text-brand-purple transition ${
                    category === cat.name ? 'bg-brand-purple/5 text-brand-purple font-semibold' : 'text-text-secondary'
                  }`}
                >
                  <span>{cat.name}</span>
                  {category === cat.name && <FiCheck size={12} />}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-text-tertiary text-center">
                No categories found
              </div>
            )}

            <div className="border-t border-border mt-1">
              <div
                onClick={() => {
                  setCategory('Other');
                  if (setSubcategory) setSubcategory('');
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-brand-purple/10 hover:text-brand-purple transition ${
                  category === 'Other' ? 'bg-brand-purple/5 text-brand-purple font-semibold' : 'text-text-secondary'
                }`}
              >
                <span>Other (Request Admin Approval)</span>
                {category === 'Other' && <FiCheck size={12} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchableSubcategoryMultiSelect({
  subcategory,
  setSubcategory,
  subcategories,
  customSubcategory,
  setCustomSubcategory
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSubcategories = subcategories.filter(sub =>
    (sub.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse the current comma-separated subcategory value
  const selectedList = subcategory && subcategory !== 'Other'
    ? subcategory.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const handleToggleSubcategory = (name) => {
    // If "Other" was active, clear it when selecting a normal subcategory
    let newList;
    if (selectedList.includes(name)) {
      newList = selectedList.filter(item => item !== name);
    } else {
      newList = [...selectedList, name];
    }
    setSubcategory(newList.join(', '));
    if (setCustomSubcategory) setCustomSubcategory('');
  };

  const handleSelectOther = () => {
    if (subcategory === 'Other') {
      setSubcategory('');
    } else {
      setSubcategory('Other');
    }
  };

  const handleRemoveItem = (e, name) => {
    e.stopPropagation();
    const newList = selectedList.filter(item => item !== name);
    setSubcategory(newList.join(', '));
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary flex items-center justify-between cursor-pointer focus:outline-none focus:border-brand-purple hover:border-brand-purple/40 transition min-h-[38px]"
      >
        <div className="flex flex-wrap gap-1 items-center max-w-[85%]">
          {subcategory === 'Other' ? (
            <span className="text-brand-purple font-semibold bg-brand-purple/10 px-2 py-0.5 rounded-md text-[10px]">
              Other (Request)
            </span>
          ) : selectedList.length > 0 ? (
            selectedList.map(name => (
              <span 
                key={name} 
                className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 hover:bg-brand-purple/20 transition"
              >
                {name}
                <button 
                  type="button" 
                  onClick={(e) => handleRemoveItem(e, name)}
                  className="hover:text-red-500 shrink-0"
                >
                  <FiX size={10} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-text-tertiary">Select Subcategories</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-text-tertiary shrink-0">
          <FiSearch size={14} />
          <FiChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-premium overflow-hidden animate-fade-in max-h-72 flex flex-col">
          <div className="p-2 border-b border-border flex items-center gap-2 bg-surface">
            <FiSearch className="text-text-tertiary shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="text-text-tertiary hover:text-text-primary"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 py-1 max-h-48">
            {filteredSubcategories.length > 0 ? (
              filteredSubcategories.map(sub => {
                const isSelected = selectedList.includes(sub.name);
                return (
                  <div
                    key={sub.id || sub._id}
                    onClick={() => handleToggleSubcategory(sub.name)}
                    className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-brand-purple/10 hover:text-brand-purple transition ${
                      isSelected ? 'bg-brand-purple/5 text-brand-purple font-semibold' : 'text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by click
                        className="rounded border-border text-brand-purple focus:ring-brand-purple shrink-0 h-3.5 w-3.5 cursor-pointer accent-brand-purple"
                      />
                      <span>{sub.name}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-text-tertiary text-center">
                No subcategories found
              </div>
            )}
          </div>

          <div className="border-t border-border p-2 bg-surface flex flex-col gap-2">
            <div
              onClick={handleSelectOther}
              className={`px-4 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-brand-purple/10 hover:text-brand-purple rounded-lg transition ${
                subcategory === 'Other' ? 'bg-brand-purple/5 text-brand-purple font-semibold' : 'text-text-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subcategory === 'Other'}
                  onChange={() => {}} // handled by click
                  className="rounded border-border text-brand-purple focus:ring-brand-purple shrink-0 h-3.5 w-3.5 cursor-pointer accent-brand-purple"
                />
                <span>Other (Request Admin Approval)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 bg-brand-purple text-white text-xs font-semibold rounded-lg hover:opacity-95 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
