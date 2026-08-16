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
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        Category & Classification
      </h4>
      <div className="grid grid-cols-2 gap-3">
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
