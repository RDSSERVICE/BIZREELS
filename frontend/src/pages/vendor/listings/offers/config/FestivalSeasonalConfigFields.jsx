import React from 'react';
export default function FestivalSeasonalConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Festival / Season Name *</label>
        <input type="text" value={config.festivalName || ''} onChange={(e) => updateConfig('festivalName', e.target.value)} placeholder="e.g. Diwali, Summer Sale" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Special Discount (%)</label>
        <input type="number" min={0} value={config.specialDiscount || ''} onChange={(e) => updateConfig('specialDiscount', Number(e.target.value) || null)} placeholder="Optional" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Special Banner URL</label>
        <input type="url" value={config.specialBannerUrl || ''} onChange={(e) => updateConfig('specialBannerUrl', e.target.value)} placeholder="https://..." className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Daily Limit</label>
          <input type="number" min={0} value={config.dailyLimit || ''} onChange={(e) => updateConfig('dailyLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Total Limit</label>
          <input type="number" min={0} value={config.totalLimit || ''} onChange={(e) => updateConfig('totalLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );
}
