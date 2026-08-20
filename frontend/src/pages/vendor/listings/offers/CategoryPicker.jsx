import React, { useState } from 'react';
import { OFFER_CATEGORIES, CATEGORY_GROUPS, getCategoriesByGroup } from '../../../../constants/offerCategories';
import { FiSearch } from 'react-icons/fi';

/**
 * CategoryPicker — Step 1 of offer creation.
 * Shows 19 categories grouped into 4 sections with search/filter.
 */
export default function CategoryPicker({ selectedCategory, onSelectCategory }) {
  const [search, setSearch] = useState('');

  const filteredGroups = CATEGORY_GROUPS.map(group => ({
    ...group,
    categories: getCategoriesByGroup(group.key).filter(cat =>
      !search || cat.label.toLowerCase().includes(search.toLowerCase()) ||
      cat.offerNames.some(n => n.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(g => g.categories.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search offer type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs"
        />
      </div>

      {filteredGroups.map(group => (
        <div key={group.key}>
          <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>{group.icon}</span> {group.label}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.categories.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  selectedCategory === cat.key
                    ? 'border-brand-purple bg-brand-purple/10 text-brand-purple shadow-sm ring-1 ring-brand-purple/20'
                    : 'border-border text-text-secondary hover:border-brand-purple/30 hover:bg-brand-purple/5'
                }`}
              >
                <span className="text-lg block mb-1">{cat.icon}</span>
                <span className="text-xs font-bold block leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
