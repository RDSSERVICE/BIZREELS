import React from 'react';
import SearchableSelect from '../service-form/SearchableSelect';
import { useLanguage } from '../../../../context/LanguageContext';

export default function ProductCategorySection({
  form,
  updateForm,
  handleCategoryChange,
  productCategories = [],
  productSubcategories = [],
}) {
  const { bi } = useLanguage();

  return (
    <div className="space-y-3 p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] font-sans">
      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wider">
        {bi('Category & Classification', 'श्रेणी और वर्गीकरण')}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SearchableSelect
          label={bi('Category', 'श्रेणी (Category)')}
          placeholder={bi('Search category...', 'श्रेणी खोजें...')}
          value={form.category}
          onChange={handleCategoryChange}
          options={productCategories}
        />
        <SearchableSelect
          label={bi('Subcategory', 'उपश्रेणी (Subcategory)')}
          placeholder={bi('Search subcategory...', 'उपश्रेणी खोजें...')}
          value={form.subcategory}
          onChange={(val) => updateForm('subcategory', val)}
          options={productSubcategories}
        />
      </div>
    </div>
  );
}
