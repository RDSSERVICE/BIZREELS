import React from 'react';
export default function ReferralConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Referral Requirement</label>
        <select value={config.referralRequirement || 'referred customer completes first order'} onChange={(e) => updateConfig('referralRequirement', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="referred customer completes first order">Referred customer completes first order</option>
          <option value="referred customer signs up">Referred customer signs up</option>
          <option value="referred customer makes a purchase">Referred customer makes any purchase</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Referrer Benefit Type</label>
          <select value={config.referrerBenefitType || 'coupon'} onChange={(e) => updateConfig('referrerBenefitType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="coupon">Coupon Code</option>
            <option value="wallet">Wallet Credit</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Referrer Benefit (₹) *</label>
          <input type="number" min={0} value={config.referrerBenefitValue || ''} onChange={(e) => updateConfig('referrerBenefitValue', Number(e.target.value))} placeholder="e.g. 100" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">New Customer Benefit Type</label>
          <select value={config.newCustomerBenefitType || 'coupon'} onChange={(e) => updateConfig('newCustomerBenefitType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="coupon">Coupon Code</option>
            <option value="wallet">Wallet Credit</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">New Customer Benefit (₹) *</label>
          <input type="number" min={0} value={config.newCustomerBenefitValue || ''} onChange={(e) => updateConfig('newCustomerBenefitValue', Number(e.target.value))} placeholder="e.g. 50" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Purchase (₹)</label>
          <input type="number" min={0} value={config.minPurchaseAmount || ''} onChange={(e) => updateConfig('minPurchaseAmount', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Limit / Customer</label>
          <input type="number" min={1} value={config.referralLimitPerCustomer || 10} onChange={(e) => updateConfig('referralLimitPerCustomer', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Validity (days)</label>
          <input type="number" min={1} value={config.validityDays || 30} onChange={(e) => updateConfig('validityDays', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-800">
        💡 This offer layers on top of the existing platform referral system. Customers use their existing referral code — no new codes are needed.
      </div>
    </div>
  );
}
