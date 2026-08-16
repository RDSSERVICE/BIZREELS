import React from 'react';

export default function ServiceLocationSection({ form, updateForm }) {
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        3. Location & Service Area
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Area</label>
          <input
            type="text"
            value={form.serviceArea}
            onChange={(e) => updateForm('serviceArea', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => updateForm('city', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => updateForm('state', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Pincode</label>
          <input
            type="text"
            value={form.pincode}
            onChange={(e) => updateForm('pincode', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Available Cities</label>
          <input
            type="text"
            value={form.availableCities}
            onChange={(e) => updateForm('availableCities', e.target.value)}
            placeholder="Mumbai, Pune, Delhi..."
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Max Travel (km)</label>
          <input
            type="number"
            value={form.maxTravelDistanceKm}
            onChange={(e) => updateForm('maxTravelDistanceKm', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div className="flex items-center pt-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.homeVisitAvailable}
              onChange={(e) => updateForm('homeVisitAvailable', e.target.checked)}
            />
            Home Visit Available
          </label>
        </div>
      </div>
    </div>
  );
}
