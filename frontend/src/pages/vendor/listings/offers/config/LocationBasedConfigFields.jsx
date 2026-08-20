import React from 'react';
export default function LocationBasedConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Location Type *</label>
        <select value={config.locationType || 'radius'} onChange={(e) => updateConfig('locationType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="radius">Radius (km)</option>
          <option value="city">City</option>
          <option value="area">Area</option>
          <option value="pincode">Pincode</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{config.locationType === 'radius' ? 'Distance (km) *' : 'Area/City/Pincode *'}</label>
        <input type={config.locationType === 'radius' ? 'number' : 'text'} min={0} value={config.distanceOrAreaValue || ''} onChange={(e) => updateConfig('distanceOrAreaValue', config.locationType === 'radius' ? Number(e.target.value) : e.target.value)} placeholder={config.locationType === 'radius' ? 'e.g. 10' : 'e.g. Mumbai, 400001'} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Value (₹)</label>
        <input type="number" min={0} value={config.offerValue || ''} onChange={(e) => updateConfig('offerValue', Number(e.target.value) || null)} placeholder="Optional" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
