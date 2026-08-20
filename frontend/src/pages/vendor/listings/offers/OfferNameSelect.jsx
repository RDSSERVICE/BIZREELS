import React from 'react';
import { OFFER_CATEGORIES } from '../../../../constants/offerCategories';

/**
 * OfferNameSelect — Step 2 dropdown for selecting the offer name within a category.
 */
export default function OfferNameSelect({ category, value, onChange }) {
  const categoryData = OFFER_CATEGORIES[category];
  if (!categoryData) return null;

  const options = categoryData.offerNames || [];

  return (
    <div>
      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
        Offer Name
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
      >
        <option value="">Select offer name...</option>
        {options.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <p className="text-[9px] text-slate-400 mt-1">
        This is the customer-facing label for your offer
      </p>
    </div>
  );
}
