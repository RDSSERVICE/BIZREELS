import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const STANDARD_UNITS = [
  { value: 'piece', label: 'Piece (Pcs)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'cm', label: 'Centimeter (cm)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bag', label: 'Bag' },
  { value: 'carton', label: 'Carton' },
  { value: 'roll', label: 'Roll' },
  { value: 'sqft', label: 'Square Feet (sq. ft)' },
  { value: 'other', label: 'Other (Custom Unit)...' },
];

const STANDARD_CONDITIONS = [
  'Defective or Damaged items only',
  'Wrong item received',
  'Unopened & in original packaging with tags',
  'Size / Fit issue (Exchange only)',
  'Missing accessories or parts',
  'All reasons accepted with unboxing proof',
  'Other / Custom condition',
];

export default function ProductPricingInventorySection({ form, updateForm }) {
  // Unit other state
  const isPredefinedUnit = STANDARD_UNITS.some((u) => u.value === form.unit && u.value !== 'other');
  const [selectedUnitType, setSelectedUnitType] = useState(
    isPredefinedUnit ? form.unit : form.unit ? 'other' : 'piece'
  );
  const [customUnit, setCustomUnit] = useState(isPredefinedUnit ? '' : form.unit || '');

  // Return policy state
  const isNoReturn =
    form.returnPolicy &&
    (form.returnPolicy.toLowerCase().includes('no return') ||
      form.returnPolicy.toLowerCase().includes('final sale'));

  const [hasReturnPolicy, setHasReturnPolicy] = useState(
    form.returnPolicy ? !isNoReturn : true
  );

  const [returnDays, setReturnDays] = useState('7 Days');
  const [selectedConditions, setSelectedConditions] = useState([
    'Defective or Damaged items only',
    'Wrong item received',
  ]);
  const [customConditionText, setCustomConditionText] = useState('');

  // Handle Unit Selection
  const handleUnitSelect = (val) => {
    setSelectedUnitType(val);
    if (val === 'other') {
      updateForm('unit', customUnit.trim() || 'other');
    } else {
      updateForm('unit', val);
    }
  };

  const handleCustomUnitChange = (val) => {
    setCustomUnit(val);
    updateForm('unit', val.trim() || 'other');
  };

  // Sync return policy string to form
  const syncReturnPolicy = (isAvailable, days, conditions, customText) => {
    if (!isAvailable) {
      updateForm('returnPolicy', 'No Returns Applicable (Final Sale)');
      return;
    }

    const filteredConds = conditions.filter((c) => c !== 'Other / Custom condition');
    if (customText.trim()) {
      filteredConds.push(customText.trim());
    }

    const conditionsStr = filteredConds.length > 0 ? filteredConds.join(', ') : 'Standard terms apply';
    const policyString = `${days} Return / Replacement: ${conditionsStr}`;
    updateForm('returnPolicy', policyString);
  };

  const handleToggleReturnPolicy = (isAvailable) => {
    setHasReturnPolicy(isAvailable);
    syncReturnPolicy(isAvailable, returnDays, selectedConditions, customConditionText);
  };

  const handleReturnDaysChange = (days) => {
    setReturnDays(days);
    syncReturnPolicy(hasReturnPolicy, days, selectedConditions, customConditionText);
  };

  const toggleCondition = (cond) => {
    let updated;
    if (selectedConditions.includes(cond)) {
      updated = selectedConditions.filter((c) => c !== cond);
    } else {
      updated = [...selectedConditions, cond];
    }
    setSelectedConditions(updated);
    syncReturnPolicy(hasReturnPolicy, returnDays, updated, customConditionText);
  };

  const handleCustomConditionChange = (text) => {
    setCustomConditionText(text);
    syncReturnPolicy(hasReturnPolicy, returnDays, selectedConditions, text);
  };

  // Initialize return policy on first load if empty
  useEffect(() => {
    if (!form.returnPolicy && hasReturnPolicy) {
      syncReturnPolicy(true, returnDays, selectedConditions, customConditionText);
    }
  }, []);

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
    <div className="space-y-4 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center justify-between">
        <span>Pricing & Inventory</span>
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* MRP / Actual Price */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            MRP / Actual Price (₹)
          </label>
          <input
            type="number"
            value={form.actualPrice}
            onChange={(e) => handleActualPriceChange(e.target.value)}
            placeholder="1499"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Selling Price */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Selling Price (₹) *
          </label>
          <input
            type="number"
            required
            value={form.sellingPrice}
            onChange={(e) => handleSellingPriceChange(e.target.value)}
            placeholder="999"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Discount Auto Calc */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Discount (%)
          </label>
          <input
            type="number"
            value={form.discount}
            onChange={(e) => updateForm('discount', e.target.value)}
            placeholder="Auto"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Stock Quantity */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Stock Quantity *
          </label>
          <input
            type="number"
            required
            value={form.stock}
            onChange={(e) => updateForm('stock', e.target.value)}
            placeholder="10"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Min Order Qty */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Min Order Qty
          </label>
          <input
            type="number"
            value={form.minOrderQty}
            onChange={(e) => updateForm('minOrderQty', e.target.value)}
            placeholder="1"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Unit with Other (Custom) Option */}
        <div className={selectedUnitType === 'other' ? 'col-span-2 sm:col-span-2' : ''}>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Unit / Quantity Type
          </label>
          <div className="flex gap-2">
            <select
              value={selectedUnitType}
              onChange={(e) => handleUnitSelect(e.target.value)}
              className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>

            {selectedUnitType === 'other' && (
              <input
                type="text"
                required
                value={customUnit}
                onChange={(e) => handleCustomUnitChange(e.target.value)}
                placeholder="Enter custom unit (e.g. Roll, Sq. Ft, Bottle)..."
                className="w-full p-2 bg-surface border border-brand-purple rounded-xl text-xs text-text-primary focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* GST Rate */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            GST Rate (%)
          </label>
          <input
            type="number"
            value={form.gst}
            onChange={(e) => updateForm('gst', e.target.value)}
            placeholder="18"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Warranty */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">
            Warranty Details
          </label>
          <input
            type="text"
            value={form.warranty}
            onChange={(e) => updateForm('warranty', e.target.value)}
            placeholder="e.g. 1 Year Brand Warranty"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>
      </div>

      {/* ── RETURN POLICY SECTION (YES / NO + MULTI-CONDITION SELECTOR) ── */}
      <div className="p-3.5 bg-surface rounded-2xl border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
          <div>
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FiRefreshCw className="text-brand-purple" />
              <span>Return / Replacement Policy</span>
            </label>
            <p className="text-[10.5px] text-text-tertiary">
              Specify whether customers can request a return or replacement for this item.
            </p>
          </div>

          {/* Yes / No Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-xl border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleReturnPolicy(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                hasReturnPolicy
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <FiCheck size={12} />
              <span>Yes</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleReturnPolicy(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                !hasReturnPolicy
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <FiX size={12} />
              <span>No</span>
            </button>
          </div>
        </div>

        {/* If NO return policy */}
        {!hasReturnPolicy ? (
          <div className="p-3 bg-red-50/50 border border-red-200/60 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <FiAlertCircle size={15} className="shrink-0" />
            <span>
              <strong>Final Sale:</strong> No returns or replacements will be accepted for this product.
            </span>
          </div>
        ) : (
          /* If YES return policy */
          <div className="space-y-3 animate-fade-in">
            {/* Return Window */}
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1">
                Return / Replacement Window *
              </label>
              <select
                value={returnDays}
                onChange={(e) => handleReturnDaysChange(e.target.value)}
                className="w-full sm:w-64 p-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
              >
                <option value="3 Days">3 Days Return / Replacement</option>
                <option value="7 Days">7 Days Return / Replacement (Standard)</option>
                <option value="10 Days">10 Days Return / Replacement</option>
                <option value="15 Days">15 Days Return / Replacement</option>
                <option value="30 Days">30 Days Return / Replacement</option>
              </select>
            </div>

            {/* Return Conditions Selector */}
            <div>
              <label className="text-[10px] font-bold text-text-tertiary block mb-1.5">
                Eligible Return Conditions (Select all applicable conditions) *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_CONDITIONS.map((cond) => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-purple/15 text-brand-purple border-brand-purple font-bold'
                          : 'bg-surface-secondary text-text-secondary border-border hover:border-text-tertiary'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] border ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple'
                            : 'border-border bg-surface'
                        }`}
                      >
                        {isSelected && <FiCheck size={10} />}
                      </span>
                      <span>{cond}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Condition Input when selected or optional addition */}
            {selectedConditions.includes('Other / Custom condition') && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-text-tertiary block">
                  Custom Return Terms / Conditions *
                </label>
                <input
                  type="text"
                  required
                  value={customConditionText}
                  onChange={(e) => handleCustomConditionChange(e.target.value)}
                  placeholder="e.g. Unboxing video proof required, original tags must be attached..."
                  className="w-full p-2 bg-surface-secondary border border-brand-purple rounded-xl text-xs text-text-primary focus:outline-none"
                />
              </div>
            )}

            {/* Generated Policy Preview */}
            <div className="text-[11px] text-text-tertiary bg-surface-secondary p-2.5 rounded-xl border border-border flex items-start gap-1.5">
              <span className="font-bold text-text-primary shrink-0">Policy Preview:</span>
              <span className="italic text-text-secondary">
                {form.returnPolicy || `${returnDays} Return / Replacement: Defective or Damaged items only, Wrong item received`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Free Shipping Option */}
      <div className="flex items-center gap-3 pt-1">
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
          Free Shipping Available for this Product
        </label>
      </div>
    </div>
  );
}
