import React from 'react';
export default function FlashSaleConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Value (%) *</label>
        <input type="number" min={0} value={config.discountValue || ''} onChange={(e) => updateConfig('discountValue', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Limited Quantity</label>
          <input type="number" min={1} value={config.limitedQuantity || ''} onChange={(e) => updateConfig('limitedQuantity', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Per Customer Limit</label>
          <input type="number" min={1} value={config.perCustomerLimit || ''} onChange={(e) => updateConfig('perCustomerLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={config.countdownTimerEnabled !== false} onChange={(e) => updateConfig('countdownTimerEnabled', e.target.checked)} className="rounded" />
        <label className="text-xs font-bold text-text-secondary">Enable Countdown Timer</label>
      </div>
    </div>
  );
}
