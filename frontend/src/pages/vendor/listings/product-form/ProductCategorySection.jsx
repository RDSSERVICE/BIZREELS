import React from 'react';
import SearchableSelect from '../service-form/SearchableSelect';

export default function ProductCategorySection({
  form,
  updateForm,
  handleCategoryChange,
  productCategories = [],
  productSubcategories = [],
}) {
  return (
    <div className="space-y-3 p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] font-sans">
      <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wider">
        Category &amp; Classification
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SearchableSelect
          label="Category"
          placeholder="Search category..."
          value={form.category}
          onChange={handleCategoryChange}
          options={productCategories}
        />
        <SearchableSelect
          label="Subcategory"
          placeholder="Search subcategory..."
          value={form.subcategory}
          onChange={(val) => updateForm('subcategory', val)}
          options={productSubcategories}
        />
      </div>
    </div>
  );
}
