import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
export default function PackageOfferConfigFields({ config, updateConfig }) {
  const items = config.packageItems || [];
  const addItem = () => updateConfig('packageItems', [...items, { serviceId: '', count: 1 }]);
  const removeItem = (i) => updateConfig('packageItems', items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; updateConfig('packageItems', u); };
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-text-tertiary uppercase block">Package Services *</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1"><input type="text" value={item.serviceId || ''} onChange={(e) => updateItem(i, 'serviceId', e.target.value)} placeholder="Service ID" className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" /></div>
          <div className="w-16"><input type="number" min={1} value={item.count || 1} onChange={(e) => updateItem(i, 'count', Number(e.target.value))} className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" /></div>
          {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><FiTrash2 className="w-3 h-3" /></button>}
        </div>
      ))}
      <button type="button" onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition"><FiPlus className="w-3 h-3" /> Add Service</button>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Package Price (₹) *</label>
          <input type="number" min={0} value={config.packagePrice || ''} onChange={(e) => updateConfig('packagePrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Validity (days) *</label>
          <input type="number" min={1} value={config.validityDays || ''} onChange={(e) => updateConfig('validityDays', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={config.transferable || false} onChange={(e) => updateConfig('transferable', e.target.checked)} className="rounded" />
        <label className="text-xs font-bold text-text-secondary">Transferable to others</label>
      </div>
    </div>
  );
}
