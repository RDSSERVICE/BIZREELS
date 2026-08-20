import React from 'react';
export default function ServiceOfferConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Normal Price (₹) *</label>
          <input type="number" min={0} value={config.normalPrice || ''} onChange={(e) => updateConfig('normalPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Price (₹) *</label>
          <input type="number" min={0} value={config.offerPrice || ''} onChange={(e) => updateConfig('offerPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Service Duration</label>
        <input type="text" value={config.serviceDuration || ''} onChange={(e) => updateConfig('serviceDuration', e.target.value)} placeholder="e.g. 1 hour, 30 min" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={config.appointmentRequired || false} onChange={(e) => updateConfig('appointmentRequired', e.target.checked)} className="rounded" />
        <label className="text-xs font-bold text-text-secondary">Appointment Required</label>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Available Days</label>
        <div className="flex flex-wrap gap-1.5">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
            const sel = (config.availableDays || []).includes(day);
            return (
              <button key={day} type="button" onClick={() => {
                const cur = config.availableDays || [];
                updateConfig('availableDays', sel ? cur.filter(d => d !== day) : [...cur, day]);
              }} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${sel ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' : 'border-border text-text-secondary'}`}>{day}</button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Customer Capacity</label>
        <input type="number" min={1} value={config.customerCapacity || ''} onChange={(e) => updateConfig('customerCapacity', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
