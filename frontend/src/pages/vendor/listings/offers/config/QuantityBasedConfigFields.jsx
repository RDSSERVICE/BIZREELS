import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function QuantityBasedConfigFields({ config, updateConfig }) {
  const slabs = config.slabs || [{ minQty: 1, maxQty: null, discountPercent: 5 }];
  const addSlab = () => updateConfig('slabs', [...slabs, { minQty: slabs.length > 0 ? (slabs[slabs.length - 1].maxQty || slabs[slabs.length - 1].minQty) + 1 : 1, maxQty: null, discountPercent: 0 }]);
  const removeSlab = (i) => updateConfig('slabs', slabs.filter((_, idx) => idx !== i));
  const updateSlab = (i, field, val) => { const u = [...slabs]; u[i] = { ...u[i], [field]: val }; updateConfig('slabs', u); };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-text-tertiary uppercase block">Quantity Discount Slabs *</label>
      <div className="space-y-2">
        {slabs.map((slab, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[9px] text-slate-400 block mb-0.5">Min Qty</label>
              <input type="number" min={1} value={slab.minQty || ''} onChange={(e) => updateSlab(i, 'minQty', Number(e.target.value))} className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-slate-400 block mb-0.5">Max Qty</label>
              <input type="number" min={1} value={slab.maxQty || ''} onChange={(e) => updateSlab(i, 'maxQty', Number(e.target.value) || null)} placeholder="∞" className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-slate-400 block mb-0.5">Discount %</label>
              <input type="number" min={0} max={100} value={slab.discountPercent || ''} onChange={(e) => updateSlab(i, 'discountPercent', Number(e.target.value))} className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" />
            </div>
            {slabs.length > 1 && (
              <button type="button" onClick={() => removeSlab(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><FiTrash2 className="w-3 h-3" /></button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addSlab} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition">
        <FiPlus className="w-3 h-3" /> Add Slab
      </button>
    </div>
  );
}
