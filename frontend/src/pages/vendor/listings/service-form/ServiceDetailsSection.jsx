import React from 'react';
import {
  FiSliders, FiLayers, FiSearch, FiGrid, FiMessageSquare,
  FiInfo, FiCheck, FiDollarSign, FiClock, FiShield, FiTag,
  FiCalendar, FiBriefcase, FiTool, FiCheckCircle
} from 'react-icons/fi';

const CUSTOM_PRICING_MODELS = [
  {
    id: 'price_range',
    label: 'Price Range',
    icon: FiSliders,
    badge: 'Min — Max',
    desc: 'Set a flexible price range based on scope (e.g. ₹500 - ₹2,500)',
  },
  {
    id: 'unit_rate',
    label: 'Per Unit Rate',
    icon: FiLayers,
    badge: 'Rate / Unit',
    desc: 'Charge per unit (e.g. ₹150 / Sq. Ft., ₹50 / Point, ₹300 / Room)',
  },
  {
    id: 'inspection_fee',
    label: 'Inspection / Visit Fee',
    icon: FiSearch,
    badge: 'Visit Charge',
    desc: 'Nominal visit charge, final quotation given after inspection',
  },
  {
    id: 'tiered',
    label: 'Tiered Packages',
    icon: FiGrid,
    badge: '3 Packages',
    desc: 'Offer Basic, Standard & Premium service tiers with custom features',
  },
  {
    id: 'free_quote',
    label: 'Custom Quote / Inquiry',
    icon: FiMessageSquare,
    badge: 'On Request',
    desc: 'Provide custom scope and quotation upon customer chat/inquiry',
  },
];

const STANDARD_MEASUREMENT_UNITS = [
  'per Sq. Ft.',
  'per Point / Switch',
  'per Room',
  'per Visit / Trip',
  'per Km / Distance',
  'per Unit / Piece',
  'per Kg / Weight',
  'per Hour / Time',
  'per Page / Screen',
  'Other (Custom Unit)',
];

export default function ServiceDetailsSection({ form, updateForm }) {
  const currentPriceType = form.priceType || 'Fixed Price';

  const isCustomPriceType =
    currentPriceType === 'Custom Quote' ||
    currentPriceType === 'Custom' ||
    currentPriceType === 'Custom / Quote Based';

  // Custom Pricing state
  const customPricing = form.customPricing || {
    pricingModel: 'price_range',
    minPrice: form.price || '',
    maxPrice: '',
    unitRate: '',
    unitType: 'per Sq. Ft.',
    customUnitType: '',
    inspectionFee: form.price || '',
    deductibleFromBill: true,
    leadTimeToQuote: 'Within 2 Hours',
    advanceDepositPercent: '0',
    pricingNotes: '',
    tiers: [
      { name: 'Basic', price: '', description: '' },
      { name: 'Standard', price: '', description: '' },
      { name: 'Premium', price: '', description: '' },
    ],
  };

  // Price Type specific attributes
  const priceTypeDetails = form.priceTypeDetails || {
    maxPriceEstimate: '',
    startingCondition: '',
    minBillableHours: '1 Hour',
    dailyShiftHours: '8 Hours Shift',
    projectScope: '',
    fixedIncludes: '',
  };

  const updatePriceTypeDetails = (key, val) => {
    const updated = { ...priceTypeDetails, [key]: val };
    updateForm('priceTypeDetails', updated);
  };

  const updateCustomPricing = (key, val) => {
    const updated = { ...customPricing, [key]: val };
    updateForm('customPricing', updated);

    // Synchronize base price for sorting/filter queries
    if (key === 'minPrice' && val) {
      updateForm('price', val);
    } else if (key === 'unitRate' && val) {
      updateForm('price', val);
    } else if (key === 'inspectionFee' && val) {
      updateForm('price', val);
    } else if (key === 'tiers' && Array.isArray(val) && val[0]?.price) {
      updateForm('price', val[0].price);
    }
  };

  const handleModelChange = (modelId) => {
    const updated = { ...customPricing, pricingModel: modelId };
    updateForm('customPricing', updated);

    if (modelId === 'price_range' && customPricing.minPrice) {
      updateForm('price', customPricing.minPrice);
    } else if (modelId === 'unit_rate' && customPricing.unitRate) {
      updateForm('price', customPricing.unitRate);
    } else if (modelId === 'inspection_fee' && customPricing.inspectionFee) {
      updateForm('price', customPricing.inspectionFee);
    }
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...(customPricing.tiers || [])];
    if (!newTiers[index]) return;
    newTiers[index] = { ...newTiers[index], [field]: value };
    updateCustomPricing('tiers', newTiers);
  };

  return (
    <div className="space-y-4 p-4 bg-surface-secondary rounded-2xl border border-border font-sans animate-fade-in">
      {/* Header with Active Type Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
          <FiDollarSign className="text-brand-purple" />
          <span>2. Service Details &amp; Pricing</span>
        </h4>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/30 self-start sm:self-auto flex items-center gap-1">
          <FiCheckCircle size={12} /> Model: {currentPriceType}
        </span>
      </div>

      {/* Main Grid: Core Service Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Service Type *</label>
          <select
            value={form.serviceType || 'At Home'}
            onChange={(e) => updateForm('serviceType', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
          >
            <option value="At Home">At Home (Doorstep Service)</option>
            <option value="At Shop">At Shop / Center</option>
            <option value="Online">Online / Remote Consultation</option>
            <option value="On-site">On-site / Commercial Location</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price Type *</label>
          <select
            value={currentPriceType}
            onChange={(e) => {
              const val = e.target.value;
              updateForm('priceType', val);
              if (val === 'Custom Quote' && !form.customPricing) {
                updateForm('customPricing', customPricing);
              }
            }}
            className="w-full p-2.5 bg-surface border-2 border-brand-purple/50 rounded-xl text-xs font-black text-brand-purple focus:outline-none focus:border-brand-purple cursor-pointer shadow-2xs"
          >
            <option value="Fixed Price">Fixed Price (One-time standard rate)</option>
            <option value="Starting From">Starting From (Base rate + variable)</option>
            <option value="Per Hour">Per Hour (Hourly billing)</option>
            <option value="Per Day">Per Day (Daily shift billing)</option>
            <option value="Per Project">Per Project (Milestone / Full scope)</option>
            <option value="Custom Quote">Custom Quote / Variable Pricing ✨</option>
          </select>
        </div>

        {/* ── DYNAMIC PRIMARY PRICE INPUT (Adapts label, placeholder, and behavior based on Price Type) ── */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
            {currentPriceType === 'Fixed Price' && 'Fixed Price (₹) *'}
            {currentPriceType === 'Starting From' && 'Starting Base Price (₹) *'}
            {currentPriceType === 'Per Hour' && 'Hourly Rate (₹/Hour) *'}
            {currentPriceType === 'Per Day' && 'Daily Shift Rate (₹/Day) *'}
            {currentPriceType === 'Per Project' && 'Total Project Price (₹) *'}
            {isCustomPriceType && (
              customPricing.pricingModel === 'price_range'
                ? 'Base / Min Price (₹) *'
                : customPricing.pricingModel === 'unit_rate'
                  ? 'Unit Base Rate (₹) *'
                  : customPricing.pricingModel === 'inspection_fee'
                    ? 'Inspection / Visit Fee (₹) *'
                    : 'Estimated Starting Price (₹)'
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              required={!isCustomPriceType}
              min="0"
              value={form.price || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateForm('price', val);
                if (isCustomPriceType) {
                  if (customPricing.pricingModel === 'price_range') {
                    updateCustomPricing('minPrice', val);
                  } else if (customPricing.pricingModel === 'unit_rate') {
                    updateCustomPricing('unitRate', val);
                  } else if (customPricing.pricingModel === 'inspection_fee') {
                    updateCustomPricing('inspectionFee', val);
                  }
                }
              }}
              placeholder={
                currentPriceType === 'Fixed Price'
                  ? 'e.g. 799'
                  : currentPriceType === 'Starting From'
                    ? 'e.g. 299'
                    : currentPriceType === 'Per Hour'
                      ? 'e.g. 350'
                      : currentPriceType === 'Per Day'
                        ? 'e.g. 1800'
                        : currentPriceType === 'Per Project'
                          ? 'e.g. 8500'
                          : 'e.g. 499'
              }
              className="w-full pl-6 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
            <span className="absolute left-2.5 top-3 text-text-tertiary text-xs font-bold">₹</span>
          </div>
        </div>

        {/* ── DYNAMIC DURATION / TIMELINE INPUT ── */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
            {currentPriceType === 'Per Hour' && 'Estimated Working Hours *'}
            {currentPriceType === 'Per Day' && 'Estimated Duration (Days) *'}
            {currentPriceType === 'Per Project' && 'Project Completion Timeline *'}
            {(currentPriceType === 'Fixed Price' || currentPriceType === 'Starting From' || isCustomPriceType) && 'Standard Service Duration *'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={form.duration || ''}
              onChange={(e) => updateForm('duration', e.target.value)}
              placeholder={
                currentPriceType === 'Per Hour'
                  ? 'e.g. 2 Hours, 3-4 Hours'
                  : currentPriceType === 'Per Day'
                    ? 'e.g. 1 Day, 3 Days'
                    : currentPriceType === 'Per Project'
                      ? 'e.g. 4-5 Days, 1 Week'
                      : 'e.g. 1 Hour, 45 Mins'
              }
              className="w-full pl-8 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
            <FiClock className="absolute left-2.5 top-3 text-text-tertiary text-xs" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Min Order Value (₹)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={form.minOrderValue || ''}
              onChange={(e) => updateForm('minOrderValue', e.target.value)}
              placeholder="e.g. 300"
              className="w-full pl-6 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
            <span className="absolute left-2.5 top-3 text-text-tertiary text-xs font-bold">₹</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Booking Availability</label>
          <select
            value={form.bookingAvailability || 'Immediate'}
            onChange={(e) => updateForm('bookingAvailability', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
          >
            <option value="Immediate">Immediate (Within 1-2 Hours)</option>
            <option value="Same Day">Same Day Booking</option>
            <option value="Next Day">Next Day Available</option>
            <option value="2-3 Days">2-3 Days Advance</option>
            <option value="By Appointment">By Prior Appointment Only</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DYNAMIC CONFIGURATION PANELS FOR SPECIFIC PRICE TYPES
      ───────────────────────────────────────────────────────────── */}

      {/* 1. FIXED PRICE SPECIFIC PANEL */}
      {currentPriceType === 'Fixed Price' && (
        <div className="p-3.5 bg-surface rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <FiCheckCircle className="text-emerald-600" />
              <span>Fixed Price Details &amp; Inclusions</span>
            </div>
            {form.price && (
              <span className="text-xs font-black text-emerald-800">
                Customer Price: ₹{Number(form.price).toLocaleString()} (All-inclusive)
              </span>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              What's Included in this Fixed Price (Optional)
            </label>
            <input
              type="text"
              value={priceTypeDetails.fixedIncludes || ''}
              onChange={(e) => updatePriceTypeDetails('fixedIncludes', e.target.value)}
              placeholder="e.g. Complete diagnosis, filter cleaning, gas pressure check &amp; 30-day labor warranty"
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      )}

      {/* 2. STARTING FROM SPECIFIC PANEL */}
      {currentPriceType === 'Starting From' && (
        <div className="p-3.5 bg-surface rounded-xl border border-amber-200 bg-amber-50/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <FiTag className="text-amber-600" />
              <span>Starting Price Range &amp; Scope Details</span>
            </div>
            {form.price && (
              <span className="text-xs font-black text-amber-800">
                Customer Sees: Starts @ ₹{Number(form.price).toLocaleString()} {priceTypeDetails.maxPriceEstimate ? `— ₹${Number(priceTypeDetails.maxPriceEstimate).toLocaleString()}` : ''}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Upper Price Estimate (₹) (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={priceTypeDetails.maxPriceEstimate || ''}
                  onChange={(e) => updatePriceTypeDetails('maxPriceEstimate', e.target.value)}
                  placeholder="e.g. 1500 (Max expected for major scope)"
                  className="w-full pl-6 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-amber-600"
                />
                <span className="absolute left-2.5 top-2.5 text-text-tertiary text-xs font-bold">₹</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Starting Rate Condition / Scope
              </label>
              <input
                type="text"
                value={priceTypeDetails.startingCondition || ''}
                onChange={(e) => updatePriceTypeDetails('startingCondition', e.target.value)}
                placeholder="e.g. Base charge for 1 unit inspection; parts and extra work charged on-site"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. PER HOUR SPECIFIC PANEL */}
      {currentPriceType === 'Per Hour' && (
        <div className="p-3.5 bg-surface rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <FiClock className="text-blue-600" />
              <span>Hourly Billing Rules</span>
            </div>
            {form.price && (
              <span className="text-xs font-black text-blue-800">
                Customer Rate: ₹{Number(form.price).toLocaleString()} / Hour ({priceTypeDetails.minBillableHours || '1 Hour min'})
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Minimum Billable Hours
              </label>
              <select
                value={priceTypeDetails.minBillableHours || '1 Hour'}
                onChange={(e) => updatePriceTypeDetails('minBillableHours', e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="1 Hour">1 Hour (Minimum 1 hour booking)</option>
                <option value="2 Hours">2 Hours Minimum Booking</option>
                <option value="3 Hours">3 Hours Minimum Booking</option>
                <option value="4 Hours">4 Hours (Half-day minimum)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Hourly Billing Policy / Notes
              </label>
              <input
                type="text"
                value={customPricing.pricingNotes || ''}
                onChange={(e) => updateCustomPricing('pricingNotes', e.target.value)}
                placeholder="e.g. Time starts upon arrival. Overtime charged in 30-min slabs."
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. PER DAY SPECIFIC PANEL */}
      {currentPriceType === 'Per Day' && (
        <div className="p-3.5 bg-surface rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <FiCalendar className="text-brand-purple" />
              <span>Daily Shift Rate Configuration</span>
            </div>
            {form.price && (
              <span className="text-xs font-black text-brand-purple">
                Customer Rate: ₹{Number(form.price).toLocaleString()} / Day ({priceTypeDetails.dailyShiftHours || '8h Shift'})
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Standard Working Hours per Day / Shift
              </label>
              <select
                value={priceTypeDetails.dailyShiftHours || '8 Hours Shift'}
                onChange={(e) => updatePriceTypeDetails('dailyShiftHours', e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
              >
                <option value="6 Hours Shift">6 Hours Shift (Part-time / Light day)</option>
                <option value="8 Hours Shift">8 Hours Shift (Standard Full Day)</option>
                <option value="9 Hours Shift">9 Hours Shift</option>
                <option value="10 Hours Shift">10 Hours Shift (Long Shift)</option>
                <option value="12 Hours Shift">12 Hours Day/Night Shift</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Daily Rate Scope / Overtime Policy
              </label>
              <input
                type="text"
                value={customPricing.pricingNotes || ''}
                onChange={(e) => updateCustomPricing('pricingNotes', e.target.value)}
                placeholder="e.g. Includes travel within city limits. Food/allowance or extra hours extra."
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. PER PROJECT SPECIFIC PANEL */}
      {currentPriceType === 'Per Project' && (
        <div className="p-3.5 bg-surface rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <FiBriefcase className="text-indigo-600" />
              <span>Project Scope &amp; Milestone Deliverables</span>
            </div>
            {form.price && (
              <span className="text-xs font-black text-indigo-800">
                Lump-Sum Price: ₹{Number(form.price).toLocaleString()} (Full Project Deliverable)
              </span>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              Project Deliverables / Scope Description *
            </label>
            <textarea
              rows={2}
              value={priceTypeDetails.projectScope || ''}
              onChange={(e) => updatePriceTypeDetails('projectScope', e.target.value)}
              placeholder="e.g. Complete 2BHK rewiring with MCB distribution board installation, conduit laying &amp; testing"
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. CUSTOM PRICING CONFIGURATION MENU (Shown when Custom is selected)
      ───────────────────────────────────────────────────────────── */}
      {isCustomPriceType && (
        <div className="mt-4 p-4.5 bg-surface rounded-2xl border-2 border-brand-purple/40 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h5 className="text-xs font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                <FiSliders className="text-brand-purple" />
                <span>Custom Pricing Structure &amp; Model</span>
              </h5>
              <p className="text-[10.5px] text-text-tertiary mt-0.5">
                Select how customers will be quoted and billed for this service.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/30 self-start sm:self-auto">
              Marketplace Standard Model
            </span>
          </div>

          {/* Model Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {CUSTOM_PRICING_MODELS.map((model) => {
              const Icon = model.icon;
              const isSelected = customPricing.pricingModel === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelChange(model.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-xs ring-1 ring-brand-purple'
                      : 'bg-surface-secondary border-border text-text-secondary hover:border-brand-purple/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon size={16} className={isSelected ? 'text-brand-purple' : 'text-text-tertiary'} />
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-surface border border-border">
                      {model.badge}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black block text-text-primary leading-tight">
                      {model.label}
                    </span>
                    <span className="text-[9.5px] text-text-tertiary block mt-0.5 line-clamp-2">
                      {model.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── DYNAMIC MODEL-SPECIFIC CONFIGURATION ── */}
          <div className="p-3.5 bg-surface-secondary rounded-xl border border-border space-y-3.5">
            
            {/* 1. PRICE RANGE MODEL */}
            {customPricing.pricingModel === 'price_range' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FiTag className="text-brand-purple" />
                  <span>Set Minimum and Maximum Estimated Price Range</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Minimum Expected Price (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={customPricing.minPrice || ''}
                        onChange={(e) => updateCustomPricing('minPrice', e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full pl-6 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                      />
                      <span className="absolute left-2.5 top-2.5 text-text-tertiary text-xs font-bold">₹</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Maximum Expected Price (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={customPricing.maxPrice || ''}
                        onChange={(e) => updateCustomPricing('maxPrice', e.target.value)}
                        placeholder="e.g. 2500"
                        className="w-full pl-6 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                      />
                      <span className="absolute left-2.5 top-2.5 text-text-tertiary text-xs font-bold">₹</span>
                    </div>
                  </div>
                </div>

                {customPricing.minPrice && customPricing.maxPrice && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold flex items-center justify-between">
                    <span>Customer Price Display:</span>
                    <span className="font-extrabold text-sm">
                      ₹{Number(customPricing.minPrice).toLocaleString()} — ₹{Number(customPricing.maxPrice).toLocaleString()} (Variable)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. UNIT RATE MODEL */}
            {customPricing.pricingModel === 'unit_rate' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FiLayers className="text-brand-purple" />
                  <span>Set Rate per Unit / Measurement Scale</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Unit Base Rate (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={customPricing.unitRate || ''}
                        onChange={(e) => updateCustomPricing('unitRate', e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full pl-6 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                      />
                      <span className="absolute left-2.5 top-2.5 text-text-tertiary text-xs font-bold">₹</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Measurement Unit *
                    </label>
                    <select
                      value={customPricing.unitType || 'per Sq. Ft.'}
                      onChange={(e) => updateCustomPricing('unitType', e.target.value)}
                      className="w-full p-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      {STANDARD_MEASUREMENT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {customPricing.unitType === 'Other (Custom Unit)' && (
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Custom Unit Description *
                    </label>
                    <input
                      type="text"
                      value={customPricing.customUnitType || ''}
                      onChange={(e) => updateCustomPricing('customUnitType', e.target.value)}
                      placeholder="e.g. per AC Outdoor Unit, per Circuit Point, per Tree..."
                      className="w-full p-2 bg-surface border border-brand-purple rounded-xl text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                )}

                {customPricing.unitRate && (
                  <div className="p-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-xs font-bold flex items-center justify-between">
                    <span>Customer Price Display:</span>
                    <span className="font-extrabold text-sm">
                      ₹{Number(customPricing.unitRate).toLocaleString()} / {customPricing.unitType === 'Other (Custom Unit)' ? (customPricing.customUnitType || 'Custom Unit') : customPricing.unitType.replace(/^per\s+/i, '')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 3. INSPECTION / VISIT FEE MODEL */}
            {customPricing.pricingModel === 'inspection_fee' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FiSearch className="text-brand-purple" />
                  <span>Visiting / Inspection Charge Setup</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Visit / Inspection Charge (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={customPricing.inspectionFee || ''}
                        onChange={(e) => updateCustomPricing('inspectionFee', e.target.value)}
                        placeholder="e.g. 199"
                        className="w-full pl-6 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                      />
                      <span className="absolute left-2.5 top-2.5 text-text-tertiary text-xs font-bold">₹</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-surface border border-border rounded-xl cursor-pointer hover:border-brand-purple">
                      <input
                        type="checkbox"
                        checked={customPricing.deductibleFromBill !== false}
                        onChange={(e) => updateCustomPricing('deductibleFromBill', e.target.checked)}
                        className="accent-brand-purple w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-text-primary">
                        Deductible from final job bill if customer accepts quote
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs font-medium space-y-0.5">
                  <p className="font-bold">Customer will pay ₹{customPricing.inspectionFee || '0'} for on-site visit &amp; diagnosis.</p>
                  <p className="text-[10.5px] text-amber-700">
                    {customPricing.deductibleFromBill !== false
                      ? '✓ This visit fee will be waived or adjusted in the total service bill.'
                      : 'ℹ️ This visit fee is non-refundable and charged separately from service cost.'}
                  </p>
                </div>
              </div>
            )}

            {/* 4. TIERED / PACKAGE MODEL */}
            {customPricing.pricingModel === 'tiered' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FiGrid className="text-brand-purple" />
                  <span>Define Service Packages &amp; Included Scope</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(customPricing.tiers || []).map((tier, idx) => (
                    <div key={idx} className="p-3 bg-surface rounded-xl border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-brand-purple">
                          {tier.name || `Tier ${idx + 1}`}
                        </span>
                        <span className="text-[9px] font-bold text-text-tertiary">Tier #{idx + 1}</span>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-0.5">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={tier.price || ''}
                          onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                          placeholder="e.g. 499"
                          className="w-full p-1.5 bg-surface-secondary border border-border rounded-lg text-xs font-bold text-text-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-0.5">Included Features / Scope</label>
                        <textarea
                          rows={2}
                          value={tier.description || ''}
                          onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Basic cleaning + 1 filter wash"
                          className="w-full p-1.5 bg-surface-secondary border border-border rounded-lg text-[11px] text-text-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. FREE QUOTE / INQUIRY MODEL */}
            {customPricing.pricingModel === 'free_quote' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FiMessageSquare className="text-brand-purple" />
                  <span>Direct Quotation &amp; Requirement Bidding</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Quote Turnaround Time *
                    </label>
                    <select
                      value={customPricing.leadTimeToQuote || 'Within 2 Hours'}
                      onChange={(e) => updateCustomPricing('leadTimeToQuote', e.target.value)}
                      className="w-full p-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value="Within 30 Minutes">Within 30 Minutes (Instant Response)</option>
                      <option value="Within 2 Hours">Within 2 Hours</option>
                      <option value="Same Day">Same Business Day</option>
                      <option value="Within 24 Hours">Within 24 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Consultation / Quote Charge
                    </label>
                    <input
                      type="text"
                      disabled
                      value="FREE (Zero Upfront Cost for Customer)"
                      className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-extrabold text-emerald-800 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ADDITIONAL PRICING TERMS & ADVANCE SETTINGS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                  Advance Token / Booking Deposit (%)
                </label>
                <select
                  value={customPricing.advanceDepositPercent || '0'}
                  onChange={(e) => updateCustomPricing('advanceDepositPercent', e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="0">0% (Pay 100% After Service Completion)</option>
                  <option value="10">10% Advance Token Deposit</option>
                  <option value="20">20% Advance Token Deposit</option>
                  <option value="30">30% Advance Token Deposit</option>
                  <option value="50">50% Advance Token Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                  Custom Pricing Terms / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={customPricing.pricingNotes || ''}
                  onChange={(e) => updateCustomPricing('pricingNotes', e.target.value)}
                  placeholder="e.g. Spare parts charged separately at MRP. 30-day labor warranty included."
                  className="w-full p-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
