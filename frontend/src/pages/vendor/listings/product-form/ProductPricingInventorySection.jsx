import React, { useState, useEffect } from 'react';
import {
  FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiTruck, FiBox,
  FiDollarSign, FiPercent, FiCreditCard, FiPackage, FiLayers, FiHelpCircle
} from 'react-icons/fi';

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
  { value: 'quintal', label: 'Quintal (q)' },
  { value: 'tonne', label: 'Tonne (t)' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'plate', label: 'Plate' },
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
  const [customUnit, setCustomUnit] = useState(isPredefinedUnit ? '' : (form.unit === 'other' ? '' : form.unit || ''));

  // Sync selectedUnitType if form.unit changes externally
  useEffect(() => {
    if (form.unit) {
      const match = STANDARD_UNITS.some((u) => u.value === form.unit && u.value !== 'other');
      if (match) {
        setSelectedUnitType(form.unit);
      } else {
        setSelectedUnitType('other');
        setCustomUnit(form.unit === 'other' ? '' : form.unit);
      }
    }
  }, [form.unit]);

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

  // Pricing calculations
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

  const handleDiscountChange = (val) => {
    updateForm('discount', val);
    const act = Number(form.actualPrice);
    const disc = Number(val);
    if (act > 0 && disc >= 0 && disc <= 100) {
      const calculatedSelling = Math.round(act - (act * disc) / 100);
      updateForm('sellingPrice', calculatedSelling);
    }
  };

  // Shipping Details Helpers
  const shipping = form.shippingDetails || {};

  const updateShipping = (key, val) => {
    const updated = {
      ...shipping,
      [key]: val,
    };

    // Auto format combined dimensions string
    const l = key === 'length' ? val : updated.length || '';
    const w = key === 'width' ? val : updated.width || '';
    const h = key === 'height' ? val : updated.height || '';
    const dimUnit = key === 'dimensionUnit' ? val : updated.dimensionUnit || 'cm';
    if (l && w && h) {
      updated.dimensions = `${l} × ${w} × ${h} ${dimUnit}`;
    }

    // Auto format combined weight string
    const wt = key === 'weight' ? val : updated.weight || '';
    const wtUnit = key === 'weightUnit' ? val : updated.weightUnit || 'kg';
    if (wt) {
      updated.weightString = `${wt} ${wtUnit}`;
    }

    updateForm('shippingDetails', updated);
  };

  return (
    <div className="space-y-5 p-4 bg-surface-secondary rounded-2xl border border-border font-sans">
      {/* ── SECTION HEADER ── */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-2">
          <FiDollarSign className="text-brand-purple" />
          <span>Pricing &amp; Inventory Configuration</span>
        </h4>
      </div>

      {/* ── PRICING & INVENTORY FLOW GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        
        {/* 1. Unit / Quantity Type (with Other Option) */}
        <div className={selectedUnitType === 'other' ? 'sm:col-span-2' : ''}>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            1. Unit / Quantity Type *
          </label>
          <div className="flex gap-2">
            <select
              value={selectedUnitType}
              onChange={(e) => handleUnitSelect(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>

            {/* Custom Unit text input when "Other" is chosen */}
            {selectedUnitType === 'other' && (
              <input
                type="text"
                required
                value={customUnit}
                onChange={(e) => handleCustomUnitChange(e.target.value)}
                placeholder="Enter custom unit (e.g. Bottle, Sheet, Drum)..."
                className="w-full p-2.5 bg-surface border-2 border-brand-purple rounded-xl text-xs font-bold text-text-primary focus:outline-none animate-fade-in"
              />
            )}
          </div>
        </div>

        {/* 2. Stock Quantity */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            2. Stock Quantity *
          </label>
          <input
            type="number"
            required
            min="0"
            value={form.stock}
            onChange={(e) => updateForm('stock', e.target.value)}
            placeholder="e.g. 25"
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* 3. Actual Price / MRP */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            3. Actual Price / MRP (₹) *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              required
              value={form.actualPrice}
              onChange={(e) => handleActualPriceChange(e.target.value)}
              placeholder="e.g. 1499"
              className="w-full pl-6 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
            />
            <span className="absolute left-2.5 top-3 text-text-tertiary text-xs font-bold">₹</span>
          </div>
        </div>

        {/* 4. GST Rate (%) */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            4. GST Rate (%)
          </label>
          <div className="flex gap-1.5">
            <select
              value={form.gst || '0'}
              onChange={(e) => updateForm('gst', e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              <option value="0">0% (GST Exempt / Nil)</option>
              <option value="5">5% (Essential Goods)</option>
              <option value="12">12% (Standard Low)</option>
              <option value="18">18% (Standard General)</option>
              <option value="28">28% (Luxury / Premium)</option>
            </select>
          </div>
        </div>

        {/* 5. Selling Price (with GST) */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            5. Selling Price (with GST) (₹) *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              required
              value={form.sellingPrice}
              onChange={(e) => handleSellingPriceChange(e.target.value)}
              placeholder="e.g. 999"
              className="w-full pl-6 pr-3 py-2.5 bg-surface border-2 border-brand-purple/40 rounded-xl text-xs font-black text-brand-purple focus:outline-none focus:border-brand-purple shadow-2xs"
            />
            <span className="absolute left-2.5 top-3 text-brand-purple text-xs font-black">₹</span>
          </div>
        </div>

        {/* 6. Discount (%) */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            6. Discount (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="Auto"
              className="w-full pr-7 pl-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-black text-emerald-600 focus:outline-none focus:border-brand-purple"
            />
            <span className="absolute right-2.5 top-3 text-emerald-600 text-xs font-bold">%</span>
          </div>
        </div>

        {/* Min Order Qty & Warranty */}
        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            Min Order Quantity
          </label>
          <input
            type="number"
            min="1"
            value={form.minOrderQty || 1}
            onChange={(e) => updateForm('minOrderQty', e.target.value)}
            placeholder="1"
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block mb-1">
            Warranty Details
          </label>
          <input
            type="text"
            value={form.warranty}
            onChange={(e) => updateForm('warranty', e.target.value)}
            placeholder="e.g. 1 Year Brand Warranty"
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-brand-purple"
          />
        </div>

      </div>

      {/* Pricing Summary Breakdown Banner */}
      {(Number(form.actualPrice) > 0 || Number(form.sellingPrice) > 0) && (
        <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span>MRP: <strong className="text-text-primary font-mono font-bold">₹{Number(form.actualPrice || 0).toLocaleString()}</strong></span>
            <span>Selling Price: <strong className="text-brand-purple font-mono font-black">₹{Number(form.sellingPrice || 0).toLocaleString()}</strong></span>
            {Number(form.discount) > 0 && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black">
                {form.discount}% OFF (Save ₹{(Number(form.actualPrice) - Number(form.sellingPrice)).toLocaleString()})
              </span>
            )}
            {form.gst && Number(form.gst) > 0 && (
              <span className="text-[11px] text-text-tertiary">
                Includes {form.gst}% GST
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-tertiary font-medium">Unit: <strong>{form.unit || 'piece'}</strong></span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SHIPPING SPECIFICATION SECTION (Weight, Dimensions, COD/Prepaid)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-surface rounded-2xl border border-border space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <label className="text-xs font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
            <FiTruck className="text-[#d99a3d]" size={16} />
            <span>3. Shipping &amp; Package Specifications</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* A. Weight Specification */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block">
              Package Weight *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={shipping.weight || ''}
                onChange={(e) => updateShipping('weight', e.target.value)}
                placeholder="e.g. 0.5"
                className="w-full p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
              />
              <select
                value={shipping.weightUnit || 'kg'}
                onChange={(e) => updateShipping('weightUnit', e.target.value)}
                className="w-24 p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
              >
                <option value="kg">kg</option>
                <option value="g">gram (g)</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <p className="text-[9.5px] text-text-tertiary font-medium">Gross weight with packaging box</p>
          </div>

          {/* B. Dimensions (Length × Width × Height) */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block">
                Package Dimensions (Length × Width × Height) *
              </label>
              <span className="text-[10px] text-brand-purple font-mono font-bold">
                {shipping.length && shipping.width && shipping.height
                  ? `${shipping.length} × ${shipping.width} × ${shipping.height} ${shipping.dimensionUnit || 'cm'}`
                  : 'L × W × H'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Length */}
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={shipping.length || ''}
                  onChange={(e) => updateShipping('length', e.target.value)}
                  placeholder="Length"
                  className="w-full p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary text-center focus:outline-none focus:border-brand-purple"
                />
                <span className="text-[9px] text-text-tertiary text-center block mt-0.5 font-bold">Length (L)</span>
              </div>

              {/* Width */}
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={shipping.width || ''}
                  onChange={(e) => updateShipping('width', e.target.value)}
                  placeholder="Width"
                  className="w-full p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary text-center focus:outline-none focus:border-brand-purple"
                />
                <span className="text-[9px] text-text-tertiary text-center block mt-0.5 font-bold">Width (W)</span>
              </div>

              {/* Height */}
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={shipping.height || ''}
                  onChange={(e) => updateShipping('height', e.target.value)}
                  placeholder="Height"
                  className="w-full p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary text-center focus:outline-none focus:border-brand-purple"
                />
                <span className="text-[9px] text-text-tertiary text-center block mt-0.5 font-bold">Height (H)</span>
              </div>

              {/* Dimension Unit */}
              <div>
                <select
                  value={shipping.dimensionUnit || 'cm'}
                  onChange={(e) => updateShipping('dimensionUnit', e.target.value)}
                  className="w-full p-2.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                >
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                  <option value="mm">mm</option>
                  <option value="m">m</option>
                </select>
                <span className="text-[9px] text-text-tertiary text-center block mt-0.5 font-bold">Unit</span>
              </div>
            </div>
          </div>

        </div>

        {/* C. Shipping & Payment Type (COD / Prepayment / Both) */}
        <div className="pt-3 border-t border-border space-y-2">
          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block">
            Shipping &amp; Payment Acceptance Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* Both COD & Prepaid */}
            <button
              type="button"
              onClick={() => updateShipping('shippingType', 'both')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                (shipping.shippingType === 'both' || !shipping.shippingType)
                  ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-2xs font-bold'
                  : 'bg-surface-secondary text-text-secondary border-border hover:border-text-tertiary'
              }`}
            >
              <div>
                <div className="font-black text-xs">🔄 Both COD &amp; Prepaid</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">Accept Online &amp; Cash on Delivery</div>
              </div>
              {(shipping.shippingType === 'both' || !shipping.shippingType) && <FiCheck className="text-brand-purple shrink-0" size={16} />}
            </button>

            {/* Prepaid Only */}
            <button
              type="button"
              onClick={() => updateShipping('shippingType', 'prepaid')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                shipping.shippingType === 'prepaid'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs font-bold'
                  : 'bg-surface-secondary text-text-secondary border-border hover:border-text-tertiary'
              }`}
            >
              <div>
                <div className="font-black text-xs">💳 Prepaid Only</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">Online Payment Only (UPI, Card, NetBanking)</div>
              </div>
              {shipping.shippingType === 'prepaid' && <FiCheck className="text-blue-600 shrink-0" size={16} />}
            </button>

            {/* COD Only */}
            <button
              type="button"
              onClick={() => updateShipping('shippingType', 'cod')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                shipping.shippingType === 'cod'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs font-bold'
                  : 'bg-surface-secondary text-text-secondary border-border hover:border-text-tertiary'
              }`}
            >
              <div>
                <div className="font-black text-xs">💵 COD Only</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">Cash on Delivery on arrival</div>
              </div>
              {shipping.shippingType === 'cod' && <FiCheck className="text-emerald-600 shrink-0" size={16} />}
            </button>

          </div>
        </div>

        {/* D. Free Shipping Toggle & Estimated Days */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shipping.freeShipping || false}
              onChange={(e) => updateShipping('freeShipping', e.target.checked)}
              className="w-4 h-4 text-brand-purple rounded border-border focus:ring-brand-purple cursor-pointer"
            />
            <span>Free Shipping Available for this Product (No delivery charges)</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-text-tertiary uppercase whitespace-nowrap">
              Est. Delivery:
            </label>
            <select
              value={shipping.estimatedDays || 5}
              onChange={(e) => updateShipping('estimatedDays', Number(e.target.value))}
              className="px-2.5 py-1.5 bg-surface-secondary border border-border rounded-lg text-xs font-bold text-text-primary cursor-pointer focus:outline-none"
            >
              <option value="1">1 Day (Express)</option>
              <option value="2">2-3 Business Days</option>
              <option value="5">4-5 Business Days (Standard)</option>
              <option value="7">6-7 Business Days</option>
              <option value="10">8-10 Business Days</option>
            </select>
          </div>
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

            {/* Custom Condition Input */}
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

    </div>
  );
}
