import React from 'react';
export default function FreeDeliveryConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order Value (₹)</label>
          <input type="number" min={0} value={config.minOrderValue || ''} onChange={(e) => updateConfig('minOrderValue', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Delivery Type</label>
          <select value={config.deliveryType || 'local'} onChange={(e) => updateConfig('deliveryType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="local">Local</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Delivery Area</label>
        <input type="text" value={config.deliveryArea || ''} onChange={(e) => updateConfig('deliveryArea', e.target.value)} placeholder="e.g. Within 10km, City name" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Distance (km)</label>
        <input type="number" min={0} value={config.maxDeliveryDistanceKm || ''} onChange={(e) => updateConfig('maxDeliveryDistanceKm', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
