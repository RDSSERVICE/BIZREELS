import React from 'react';
export default function CashbackConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 font-bold">
        ⚠️ Cashback settlement method needs product decision. Configure now, settlement logic will be implemented after confirmation.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Cashback Type *</label>
          <select value={config.cashbackType || 'percent'} onChange={(e) => updateConfig('cashbackType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Cashback Value *</label>
          <input type="number" min={0} value={config.cashbackValue || ''} onChange={(e) => updateConfig('cashbackValue', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Purchase (₹)</label>
          <input type="number" min={0} value={config.minPurchase || ''} onChange={(e) => updateConfig('minPurchase', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Cashback (₹)</label>
          <input type="number" min={0} value={config.maxCashback || ''} onChange={(e) => updateConfig('maxCashback', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );
}
