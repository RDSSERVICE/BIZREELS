import React from 'react';

export default function ProductPricingInventorySection({ form, updateForm }) {
  const calcDiscount = (actual, selling) => {
    const act = Number(actual);
    const sel = Number(selling);
    if (act > 0 && sel > 0 && act > sel) {
      return Math.round(((act - sel) / act) * 100);
    }
    return 0;
  };

  const handleActualPriceChange = (val) => {
    updateForm('actualPrice', val);
    const disc = calcDiscount(val, form.sellingPrice);
    updateForm('discount', disc);
  };

  const handleSellingPriceChange = (val) => {
    updateForm('sellingPrice', val);
    const disc = calcDiscount(form.actualPrice, val);
    updateForm('discount', disc);
  };

  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        Pricing & Inventory
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">MRP / Actual Price (₹)</label>
          <input
            type="number"
            value={form.actualPrice}
            onChange={(e) => handleActualPriceChange(e.target.value)}
            placeholder="1499"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Selling Price (₹) *</label>
          <input
            type="number"
            required
            value={form.sellingPrice}
            onChange={(e) => handleSellingPriceChange(e.target.value)}
            placeholder="999"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Discount (%)</label>
          <input
            type="number"
            value={form.discount}
            onChange={(e) => updateForm('discount', e.target.value)}
            placeholder="Auto"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Stock Quantity *</label>
          <input
            type="number"
            required
            value={form.stock}
            onChange={(e) => updateForm('stock', e.target.value)}
            placeholder="10"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Min Order Qty</label>
          <input
            type="number"
            value={form.minOrderQty}
            onChange={(e) => updateForm('minOrderQty', e.target.value)}
            placeholder="1"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Unit</label>
          <select
            value={form.unit}
            onChange={(e) => updateForm('unit', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          >
            <option value="piece">Piece</option>
            <option value="kg">Kg</option>
            <option value="gram">Gram</option>
            <option value="litre">Litre</option>
            <option value="meter">Meter</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="set">Set</option>
            <option value="pair">Pair</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">GST Rate (%)</label>
          <input
            type="number"
            value={form.gst}
            onChange={(e) => updateForm('gst', e.target.value)}
            placeholder="18"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Warranty Details</label>
          <input
            type="text"
            value={form.warranty}
            onChange={(e) => updateForm('warranty', e.target.value)}
            placeholder="e.g. 1 Year Brand Warranty"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Return / Replacement Policy</label>
          <input
            type="text"
            value={form.returnPolicy}
            onChange={(e) => updateForm('returnPolicy', e.target.value)}
            placeholder="e.g. 7 Days Replacement only if damaged"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3 pt-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.shippingDetails?.freeShipping}
              onChange={(e) =>
                updateForm('shippingDetails', {
                  ...form.shippingDetails,
                  freeShipping: e.target.checked,
                })
              }
            />
            Free Shipping Available
          </label>
        </div>
      </div>
    </div>
  );
}
