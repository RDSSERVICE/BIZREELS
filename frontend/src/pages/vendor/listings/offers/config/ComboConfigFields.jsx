import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function ComboConfigFields({ config, updateConfig }) {
  const items = config.items || [];
  const addItem = () => updateConfig('items', [...items, { productId: '', serviceId: '', qty: 1 }]);
  const removeItem = (i) => updateConfig('items', items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; updateConfig('items', u); };

  const individualTotal = Number(config.individualTotalPrice || 0);
  const comboPrice = Number(config.comboPrice || 0);
  const saving = individualTotal > comboPrice ? individualTotal - comboPrice : 0;

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-text-tertiary uppercase block">Combo Items *</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1">
            <input type="text" value={item.productId || item.serviceId || ''} onChange={(e) => updateItem(i, 'productId', e.target.value)} placeholder="Product/Service ID" className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" />
          </div>
          <div className="w-16">
            <input type="number" min={1} value={item.qty || 1} onChange={(e) => updateItem(i, 'qty', Number(e.target.value))} className="w-full p-2 bg-surface border border-border rounded-lg text-[10px]" />
          </div>
          <button type="button" onClick={() => removeItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><FiTrash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition">
        <FiPlus className="w-3 h-3" /> Add Item
      </button>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Individual Total (₹) *</label>
          <input type="number" min={0} value={config.individualTotalPrice || ''} onChange={(e) => updateConfig('individualTotalPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Combo Price (₹) *</label>
          <input type="number" min={0} value={config.comboPrice || ''} onChange={(e) => updateConfig('comboPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Customer Saves</label>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">₹{saving}</div>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Combo Stock</label>
        <input type="number" min={0} value={config.comboStock || ''} onChange={(e) => updateConfig('comboStock', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
