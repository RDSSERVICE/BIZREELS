import React from 'react';
import { FiPlus, FiX, FiRefreshCw, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductVariantsSpecsSection({
  form,
  updateForm,
  handleAddLabel,
  handleRemoveLabel,
  variantLabel,
  setVariantLabel,
  variantValue,
  setVariantValue,
  variantSku,
  setVariantSku,
  variantPriceAdj,
  setVariantPriceAdj,
  variantImageUrl,
  setVariantImageUrl,
  variantUploading,
  generateVariantSKU,
  handleAddVariant,
  handleRemoveVariant,
  handleVariantImageUpload,
}) {
  return (
    <div className="space-y-4 p-4 bg-surface-secondary rounded-2xl border border-border">
      {/* Specifications / Labels */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
          Specifications & Attributes
        </h4>
        <div className="grid grid-cols-5 gap-2">
          <input
            type="text"
            value={form.newLabelKey}
            onChange={(e) => updateForm('newLabelKey', e.target.value)}
            placeholder="Attribute (e.g. Color)"
            className="col-span-2 p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
          <input
            type="text"
            value={form.newLabelVal}
            onChange={(e) => updateForm('newLabelVal', e.target.value)}
            placeholder="Value (e.g. Matte Black)"
            className="col-span-2 p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
          <button
            type="button"
            onClick={handleAddLabel}
            className="bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90 transition flex items-center justify-center gap-1"
          >
            <FiPlus size={13} /> Add
          </button>
        </div>

        {form.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.labels.map((lbl, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-surface border border-border text-[10px] rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <strong className="text-brand-purple">{lbl.key}:</strong> {lbl.value}
                <button
                  type="button"
                  onClick={() => handleRemoveLabel(idx)}
                  className="text-text-tertiary hover:text-red-500 ml-1"
                >
                  <FiX size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product Variants */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
          Product Variants (Sizes, Colors, Models)
        </h4>

        <div className="p-3 bg-surface rounded-xl border border-border space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={variantLabel}
              onChange={(e) => setVariantLabel(e.target.value)}
              placeholder="Type (e.g. Size, Color)"
              className="p-2 bg-surface-secondary border rounded-xl text-xs text-text-primary"
            />
            <input
              type="text"
              value={variantValue}
              onChange={(e) => setVariantValue(e.target.value)}
              placeholder="Value (e.g. XL, Red)"
              className="p-2 bg-surface-secondary border rounded-xl text-xs text-text-primary"
            />
            <div className="relative">
              <input
                type="text"
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value)}
                placeholder="Variant SKU"
                className="w-full p-2 pr-6 bg-surface-secondary border rounded-xl text-xs text-text-primary"
              />
              <button
                type="button"
                onClick={generateVariantSKU}
                title="Auto SKU"
                className="absolute right-2 top-2.5 text-brand-purple hover:opacity-80"
              >
                <FiRefreshCw size={11} />
              </button>
            </div>
            <input
              type="number"
              value={variantPriceAdj}
              onChange={(e) => setVariantPriceAdj(e.target.value)}
              placeholder="Price (₹ diff, e.g. 0)"
              className="p-2 bg-surface-secondary border rounded-xl text-xs text-text-primary"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-surface-secondary border border-border rounded-xl text-[10px] font-bold cursor-pointer hover:border-brand-purple flex items-center gap-1.5 text-text-secondary">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVariantImageUpload}
                  className="hidden"
                />
                <FiUploadCloud size={13} />
                <span>{variantUploading ? 'Uploading...' : 'Upload Image'}</span>
              </label>
              {variantImageUrl && (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-brand-purple">
                  <img src={variantImageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setVariantImageUrl('')}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <FiX size={8} />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddVariant}
              className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition flex items-center gap-1"
            >
              <FiPlus size={13} /> Add Variant Option
            </button>
          </div>
        </div>

        {/* Existing Variants Table */}
        {form.variants?.length > 0 && (
          <div className="space-y-1.5">
            {form.variants.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-border text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  {v.image && (
                    <img
                      src={v.image}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-border"
                    />
                  )}
                  <div>
                    <span className="font-bold text-text-primary">
                      {v.label || v.type}: {v.value}
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-2 font-mono">
                      ({v.sku || 'No SKU'})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-emerald-600">
                    ₹{Number(v.price || form.sellingPrice || 0).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="text-text-tertiary hover:text-red-500 p-1"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
